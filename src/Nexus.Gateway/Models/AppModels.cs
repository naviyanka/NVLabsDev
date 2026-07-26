namespace Nexus.Gateway.Models;

public class InstalledAppModel
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Publisher { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string InstallDate { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string SizeMB { get; set; } = string.Empty;
    public string UninstallString { get; set; } = string.Empty;
}

public class InstallAppRequest
{
    public string InstallerPath { get; set; } = string.Empty;
    public string Arguments { get; set; } = string.Empty;
    public string SourceServerIp { get; set; } = string.Empty;
}

public class UninstallAppRequest
{
    public string UninstallString { get; set; } = string.Empty;
}
