using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Concurrent;
using System.DirectoryServices.AccountManagement;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Nexus.Gateway.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;

        private static readonly ConcurrentDictionary<string, (int Count, DateTime WindowStart)> _loginAttempts = new();
        private const int MaxAttempts = 5;
        private static readonly TimeSpan RateLimitWindow = TimeSpan.FromMinutes(15);

        public AuthController(IConfiguration config)
        {
            _config = config;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public IActionResult Login([FromBody] LoginRequest request)
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

                    // Successful login, reset attempts
                    _loginAttempts.TryRemove(remoteIp, out _);
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
