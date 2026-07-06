namespace Nexus.Gateway.Models;

public class WindowsRoleModel
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string InstallState { get; set; } = string.Empty;
    public string FeatureType { get; set; } = "Role"; // "Role" or "OptionalFeature"
}

public class RoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string FeatureType { get; set; } = "Role"; 
}

public class WindowsRoleEntity
{
    public int Id { get; set; }
    public string ServerIp { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string InstallState { get; set; } = string.Empty;
    public string FeatureType { get; set; } = "Role";
}
