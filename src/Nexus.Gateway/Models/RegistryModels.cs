namespace Nexus.Gateway.Models;

public class RegistryValueModel
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Data { get; set; } = string.Empty;
}

public class RegistryNodeModel
{
    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public bool HasSubKeys { get; set; }
}

public class RegistryContentModel
{
    public List<RegistryNodeModel> SubKeys { get; set; } = new();
    public List<RegistryValueModel> Values { get; set; } = new();
}
