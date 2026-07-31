namespace Nexus.Gateway.Models;

public class NexusUser
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = "Viewer"; // Viewer, Operator, Admin, SuperAdmin
    public string Source { get; set; } = "local"; // "domain" or "local"
    public string Domain { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
}
