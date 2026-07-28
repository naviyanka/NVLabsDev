namespace Nexus.Gateway.Models;

/// <summary>
/// Defines the SDK contract for a Nexus plugin manifest.
/// This is the canonical representation returned by the /manifest endpoint.
/// </summary>
public class PluginManifest
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Version { get; set; } = "1.0.0";
    public string Author { get; set; } = "";
    public string ApiVersion { get; set; } = "1.0";
    public string MinGatewayVersion { get; set; } = "1.0.0";
    public List<PluginCapability> Capabilities { get; set; } = new();
    public List<PluginPermission> Permissions { get; set; } = new();
    public Dictionary<string, string> LifecycleHooks { get; set; } = new();
    public string EntryPoint { get; set; } = "ScriptContent";
    public SandboxPolicy SandboxPolicy { get; set; } = SandboxPolicy.Standard;
    public List<string> DependsOn { get; set; } = new();
}

/// <summary>
/// Enumerates the capability domains a plugin may request access to.
/// </summary>
public enum PluginCapability
{
    /// <summary>Read/write access to the filesystem</summary>
    Filesystem,

    /// <summary>Network operations (HTTP, DNS, sockets)</summary>
    Network,

    /// <summary>Windows Registry access</summary>
    Registry,

    /// <summary>Active Directory queries and modifications</summary>
    ActiveDirectory,

    /// <summary>Process management (start, stop, query)</summary>
    ProcessManagement,

    /// <summary>Windows service control</summary>
    ServiceControl,

    /// <summary>Event log read/write</summary>
    EventLog,

    /// <summary>Scheduled task management</summary>
    ScheduledTasks,

    /// <summary>WMI/CIM operations</summary>
    Wmi,

    /// <summary>Certificate store access</summary>
    Certificates
}

/// <summary>
/// Describes a specific permission requested by a plugin.
/// </summary>
public class PluginPermission
{
    /// <summary>The resource or domain (e.g. "filesystem", "registry")</summary>
    public string Resource { get; set; } = "";

    /// <summary>Actions requested on the resource (e.g. ["read", "write", "delete"])</summary>
    public List<string> Actions { get; set; } = new();

    /// <summary>Human-readable justification for why this permission is needed</summary>
    public string Justification { get; set; } = "";
}

/// <summary>
/// Defines the sandbox isolation level for plugin execution.
/// </summary>
public enum SandboxPolicy
{
    /// <summary>No restrictions - full PowerShell access (admin-only plugins)</summary>
    Unrestricted,

    /// <summary>Standard restrictions - blocked dangerous patterns, scoped to declared capabilities</summary>
    Standard,

    /// <summary>Maximum isolation - read-only, no network, no registry, no process control</summary>
    Strict
}
