using System.Security.Cryptography;

namespace Nexus.Gateway.Models;

public class ApiKey
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string HashedKey { get; set; } = string.Empty;
    public string Prefix { get; set; } = string.Empty; // First 8 chars for display: "nxk_abcd..."
    public string Role { get; set; } = "Operator"; // Maps to RBAC role
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public bool IsActive { get; set; } = true;

    public static string GenerateKey()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return "nxk_" + Convert.ToBase64String(bytes).Replace("+", "").Replace("/", "").Replace("=", "")[..40];
    }

    public static string HashKey(string plainKey)
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes(plainKey);
        var hash = SHA256.HashData(bytes);
        return Convert.ToBase64String(hash);
    }
}
