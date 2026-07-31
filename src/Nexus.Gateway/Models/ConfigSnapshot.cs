namespace Nexus.Gateway.Models;

public class ConfigSnapshot
{
    public int Id { get; set; }
    public string ServerIp { get; set; } = string.Empty;
    public string ServerName { get; set; } = string.Empty;
    public DateTime CapturedAt { get; set; } = DateTime.UtcNow;
    public string InstalledRolesJson { get; set; } = "[]";
    public string ServicesJson { get; set; } = "[]";
    public string LocalUsersJson { get; set; } = "[]";
    public string FirewallProfileJson { get; set; } = "[]";
    public bool IsBaseline { get; set; } = false;
}
