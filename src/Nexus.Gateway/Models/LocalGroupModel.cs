namespace Nexus.Gateway.Models;

public class LocalGroupModel
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Members { get; set; } = new();
}
