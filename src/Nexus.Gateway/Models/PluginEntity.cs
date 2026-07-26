using System.ComponentModel.DataAnnotations;

namespace Nexus.Gateway.Models;

public class PluginEntity
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Icon { get; set; } = "terminal";
    public string ScriptType { get; set; } = "powershell";
    public string SourceType { get; set; } = "inline"; // "inline" or "file"
    public string ScriptContent { get; set; } = "";
    public bool IsActive { get; set; } = false;
    public string Author { get; set; } = "Custom";
    public string Category { get; set; } = "Custom";
    public bool IsBuiltIn { get; set; } = false;
    public string? TargetRoute { get; set; }
}

public class PluginRunDto
{
    public string ServerIp { get; set; } = "";
}

public class PluginRunResultDto
{
    public string Output { get; set; } = "";
}
