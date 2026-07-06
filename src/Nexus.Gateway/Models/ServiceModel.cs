namespace Nexus.Gateway.Models;

public class ServiceModel
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StartupType { get; set; } = string.Empty;
    public string LogOnAs { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
