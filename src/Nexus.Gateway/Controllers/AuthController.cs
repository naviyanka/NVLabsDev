using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Concurrent;
using System.DirectoryServices.AccountManagement;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Nexus.Gateway.Data;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly NexusContext _db;
        private readonly ActiveDirectoryService _adService;
        private readonly CimService _cimService;
        private readonly ILogger<AuthController> _logger;

        private static readonly ConcurrentDictionary<string, (int Count, DateTime WindowStart)> _loginAttempts = new();
        private const int MaxAttempts = 5;
        private static readonly TimeSpan RateLimitWindow = TimeSpan.FromMinutes(15);

        public AuthController(IConfiguration config, NexusContext db, ActiveDirectoryService adService, CimService cimService, ILogger<AuthController> logger)
        {
            _config = config;
            _db = db;
            _adService = adService;
            _cimService = cimService;
            _logger = logger;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            // Periodic cleanup: remove expired entries when dictionary exceeds size threshold
            if (_loginAttempts.Count > 100)
            {
                var expiredKeys = _loginAttempts
                    .Where(kvp => DateTime.UtcNow - kvp.Value.WindowStart > RateLimitWindow)
                    .Select(kvp => kvp.Key)
                    .ToList();
                foreach (var key in expiredKeys)
                {
                    _loginAttempts.TryRemove(key, out _);
                }
            }

            // Rate limiting check
            if (_loginAttempts.TryGetValue(remoteIp, out var attempt))
            {
                if (DateTime.UtcNow - attempt.WindowStart > RateLimitWindow)
                {
                    // Window expired, reset
                    _loginAttempts.TryRemove(remoteIp, out _);
                }
                else if (attempt.Count >= MaxAttempts)
                {
                    return StatusCode(429, new { message = "Too many login attempts. Please try again later." });
                }
            }

            try
            {
                if (request.Scope == "domain")
                {
                    if (string.IsNullOrEmpty(request.Domain))
                        return BadRequest(new { message = "Domain name is required for domain login." });

                    using var context = new PrincipalContext(ContextType.Domain, request.Domain);
                    bool isValid = context.ValidateCredentials(request.Username, request.Password);
                    if (!isValid)
                    {
                        IncrementLoginAttempts(remoteIp);
                        return Unauthorized(new { message = "Invalid domain credentials." });
                    }

                    using var user = UserPrincipal.FindByIdentity(context, IdentityType.SamAccountName, request.Username);
                    using var groups = user.GetAuthorizationGroups();
                    bool isAdmin = groups.Any(g => g.Name.Equals("Domain Admins", StringComparison.OrdinalIgnoreCase));
                    
                    if (!isAdmin)
                    {
                        IncrementLoginAttempts(remoteIp);
                        return Unauthorized(new { message = "Domain Admin privileges are required to access NEXUS." });
                    }

                    // Successful domain login, reset attempts
                    _loginAttempts.TryRemove(remoteIp, out _);

                    // Update AppLoginMethod to "Domain" so AD discovery is enabled
                    await UpdateAppLoginMethodAsync("Domain", request.Domain!);

                    // Trigger immediate AD sync in background
                    _ = Task.Run(() => RunImmediateAdSyncAsync());

                    var token = GenerateJwtToken(request.Username, "Domain Admins");
                    return Ok(new { token });
                }
                else
                {
                    using var context = new PrincipalContext(ContextType.Machine);
                    bool isValid = context.ValidateCredentials(request.Username, request.Password);
                    if (!isValid)
                    {
                        IncrementLoginAttempts(remoteIp);
                        return Unauthorized(new { message = "Invalid local credentials." });
                    }

                    using var user = UserPrincipal.FindByIdentity(context, IdentityType.SamAccountName, request.Username);
                    using var groups = user.GetAuthorizationGroups();
                    bool isAdmin = groups.Any(g => g.Name.Equals("Administrators", StringComparison.OrdinalIgnoreCase));

                    if (!isAdmin)
                    {
                        IncrementLoginAttempts(remoteIp);
                        return Unauthorized(new { message = "Local Administrator privileges are required to access NEXUS." });
                    }

                    // Successful login, reset attempts
                    _loginAttempts.TryRemove(remoteIp, out _);
                    var token = GenerateJwtToken(request.Username, "Administrators");
                    return Ok(new { token });
                }
            }
            catch (Exception ex)
            {
                // Log full error server-side but return generic message to prevent info leak
                return StatusCode(500, new { message = "Authentication service error." });
            }
        }

        private static void IncrementLoginAttempts(string ip)
        {
            _loginAttempts.AddOrUpdate(
                ip,
                _ => (1, DateTime.UtcNow),
                (_, existing) =>
                {
                    if (DateTime.UtcNow - existing.WindowStart > RateLimitWindow)
                    {
                        return (1, DateTime.UtcNow);
                    }
                    return (existing.Count + 1, existing.WindowStart);
                });
        }

        private async Task UpdateAppLoginMethodAsync(string method, string domainName)
        {
            try
            {
                var setting = await _db.AppSettings.FirstOrDefaultAsync(s => s.Id == "global");
                if (setting != null)
                {
                    setting.AppLoginMethod = method;
                    if (!string.IsNullOrEmpty(domainName))
                    {
                        setting.DefaultDomainName = domainName;
                    }
                    await _db.SaveChangesAsync();
                    _logger.LogInformation("Updated AppLoginMethod to '{Method}' with domain '{Domain}'.", method, domainName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update AppLoginMethod.");
            }
        }

        private async Task RunImmediateAdSyncAsync()
        {
            try
            {
                _logger.LogInformation("Triggering immediate AD computer sync after domain login.");
                var adServers = await _adService.GetDomainComputersAsync();

                foreach (var adServer in adServers)
                {
                    var existing = await _db.Servers.FirstOrDefaultAsync(s => s.Id == adServer.Id);
                    if (existing == null)
                    {
                        adServer.IsAdFetched = true;
                        _db.Servers.Add(adServer);
                        _ = Task.Run(() => _cimService.EnableWinRmAsync(adServer.Ip));
                    }
                    else
                    {
                        if (existing.IsAdFetched && existing.Ip != adServer.Ip && adServer.Ip != adServer.Name)
                        {
                            existing.Ip = adServer.Ip;
                        }
                    }
                }
                await _db.SaveChangesAsync();
                _logger.LogInformation("Immediate AD sync completed. Found {Count} domain computers.", adServers.Count);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Immediate AD sync after login failed.");
            }
        }

        private string GenerateJwtToken(string username, string role)
        {
            var jwtKey = _config["Jwt:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY");
            if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32)
                throw new InvalidOperationException("JWT_KEY must be configured with at least 32 characters.");

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, username),
                new Claim(ClaimTypes.Role, role)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"] ?? "Nexus",
                audience: _config["Jwt:Audience"] ?? "NexusUsers",
                claims: claims,
                expires: DateTime.Now.AddHours(8),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class LoginRequest
    {
        public string Scope { get; set; } = "local";
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
        public string? Domain { get; set; }
    }
}
