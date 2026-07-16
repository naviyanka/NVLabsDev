using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
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

        public AuthController(IConfiguration config)
        {
            _config = config;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            try
            {
                if (request.Scope == "domain")
                {
                    if (string.IsNullOrEmpty(request.Domain))
                        return BadRequest(new { message = "Domain name is required for domain login." });

                    using var context = new PrincipalContext(ContextType.Domain, request.Domain);
                    bool isValid = context.ValidateCredentials(request.Username, request.Password);
                    if (!isValid) return Unauthorized(new { message = "Invalid domain credentials." });

                    using var user = UserPrincipal.FindByIdentity(context, IdentityType.SamAccountName, request.Username);
                    var groups = user.GetAuthorizationGroups();
                    bool isAdmin = groups.Any(g => g.Name.Equals("Domain Admins", StringComparison.OrdinalIgnoreCase));
                    
                    if (!isAdmin) return Unauthorized(new { message = "Domain Admin privileges are required to access NEXUS." });

                    var token = GenerateJwtToken(request.Username, "Domain Admins");
                    return Ok(new { token });
                }
                else
                {
                    using var context = new PrincipalContext(ContextType.Machine);
                    bool isValid = context.ValidateCredentials(request.Username, request.Password);
                    if (!isValid) return Unauthorized(new { message = "Invalid local credentials." });

                    using var user = UserPrincipal.FindByIdentity(context, IdentityType.SamAccountName, request.Username);
                    var groups = user.GetAuthorizationGroups();
                    bool isAdmin = groups.Any(g => g.Name.Equals("Administrators", StringComparison.OrdinalIgnoreCase));

                    if (!isAdmin) return Unauthorized(new { message = "Local Administrator privileges are required to access NEXUS." });

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
