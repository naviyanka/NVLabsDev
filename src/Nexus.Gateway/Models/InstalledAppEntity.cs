namespace Nexus.Gateway.Models;

public class InstalledAppEntity
{
    public int Id { get; set; }
    public string ServerIp { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Publisher { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string InstallDate { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string SizeMB { get; set; } = string.Empty;
    public string UninstallString { get; set; } = string.Empty;
}
