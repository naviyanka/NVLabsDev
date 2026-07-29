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

    // --- Plugin SDK fields ---
    /// <summary>Semantic version of the plugin (e.g. "1.0.0")</summary>
    public string Version { get; set; } = "1.0.0";

    /// <summary>Minimum gateway version required to run this plugin</summary>
    public string MinGatewayVersion { get; set; } = "1.0.0";

    /// <summary>JSON array of required capabilities (e.g. ["filesystem","network","registry","activedirectory"])</summary>
    public string RequiredCapabilities { get; set; } = "[]";

    /// <summary>Sandbox isolation level: "full", "restricted", or "minimal"</summary>
    public string SandboxLevel { get; set; } = "restricted";

    /// <summary>JSON object with lifecycle hook scripts: { "OnInstall": "...", "OnActivate": "...", "OnDeactivate": "...", "OnUninstall": "..." }</summary>
    public string LifecycleHooks { get; set; } = "{}";

    /// <summary>Comma-separated list of plugin IDs this plugin depends on</summary>
    public string DependsOn { get; set; } = "";

    /// <summary>Plugin SDK API version this plugin targets (e.g. "1.0")</summary>
    public string ApiVersion { get; set; } = "1.0";
}

public class PluginRunDto
{
    public string ServerIp { get; set; } = "";
}

public class PluginRunResultDto
{
    public string Output { get; set; } = "";
}
