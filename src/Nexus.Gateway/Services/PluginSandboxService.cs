using System.Text.Json;
using System.Text.RegularExpressions;
using Nexus.Gateway.Models;

namespace Nexus.Gateway.Services;

/// <summary>
/// Validates plugin script content against declared capabilities and sandbox policy.
/// Prevents plugins from using operations outside their declared permission scope.
/// </summary>
public class PluginSandboxService
{
    private readonly ILogger<PluginSandboxService> _logger;

    public PluginSandboxService(ILogger<PluginSandboxService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Patterns that are always blocked regardless of capabilities (critical security risk).
    /// </summary>
    private static readonly string[] UniversalBlockedPatterns = new[]
    {
        @"\bInvoke-Expression\b",
        @"\bIEX\b",
        @"\bcertutil\b",
        @"\bbitsadmin\b",
        @"\[System\.Net\.WebClient\]",
        @"\bDownloadString\b",
        @"\bDownloadFile\b"
    };

    /// <summary>
    /// Maps capabilities to the patterns they unlock. If a plugin does NOT declare a capability,
    /// any matching pattern in its script will be flagged as a violation.
    /// </summary>
    private static readonly Dictionary<PluginCapability, string[]> CapabilityPatterns = new()
    {
        [PluginCapability.Network] = new[]
        {
            @"\bInvoke-WebRequest\b",
            @"\bInvoke-RestMethod\b",
            @"\bTest-NetConnection\b",
            @"\bTest-Connection\b",
            @"\bNew-Object\s+System\.Net\.",
            @"\b\[System\.Net\.",
            @"\bResolve-DnsName\b"
        },
        [PluginCapability.Filesystem] = new[]
        {
            @"\bRemove-Item\b",
            @"\bSet-Content\b",
            @"\bAdd-Content\b",
            @"\bNew-Item\b.*-ItemType\s+(File|Directory)",
            @"\bCopy-Item\b",
            @"\bMove-Item\b",
            @"\bOut-File\b"
        },
        [PluginCapability.Registry] = new[]
        {
            @"\bNew-Item\s+HK(LM|CU|CR):",
            @"\bSet-ItemProperty\b.*HK(LM|CU|CR):",
            @"\bRemove-ItemProperty\b.*HK(LM|CU|CR):",
            @"\bNew-ItemProperty\b.*HK(LM|CU|CR):"
        },
        [PluginCapability.ActiveDirectory] = new[]
        {
            @"\bGet-AD\w+\b",
            @"\bSet-AD\w+\b",
            @"\bNew-AD\w+\b",
            @"\bRemove-AD\w+\b",
            @"\bSearch-ADAccount\b"
        },
        [PluginCapability.ProcessManagement] = new[]
        {
            @"\bStart-Process\b",
            @"\bStop-Process\b",
            @"\bGet-Process\b"
        },
        [PluginCapability.ServiceControl] = new[]
        {
            @"\bStart-Service\b",
            @"\bStop-Service\b",
            @"\bRestart-Service\b",
            @"\bSet-Service\b"
        },
        [PluginCapability.EventLog] = new[]
        {
            @"\bWrite-EventLog\b",
            @"\bNew-EventLog\b",
            @"\bClear-EventLog\b"
        },
        [PluginCapability.ScheduledTasks] = new[]
        {
            @"\bRegister-ScheduledTask\b",
            @"\bUnregister-ScheduledTask\b",
            @"\bSet-ScheduledTask\b",
            @"\bNew-ScheduledTask\w*\b"
        },
        [PluginCapability.Wmi] = new[]
        {
            @"\bInvoke-WmiMethod\b",
            @"\bInvoke-CimMethod\b",
            @"\bGet-WmiObject\b",
            @"\bGet-CimInstance\b",
            @"\bInvoke-Command\b"
        },
        [PluginCapability.Certificates] = new[]
        {
            @"\bGet-ChildItem\s+Cert:",
            @"\bImport-Certificate\b",
            @"\bExport-Certificate\b",
            @"\bNew-SelfSignedCertificate\b"
        }
    };

    /// <summary>
    /// Additional patterns blocked under Strict sandbox policy.
    /// </summary>
    private static readonly string[] StrictAdditionalBlocks = new[]
    {
        @"\bStart-Process\b",
        @"\bStart-Job\b",
        @"\bInvoke-Command\b",
        @"\bEnter-PSSession\b",
        @"\bNew-PSSession\b",
        @"\bSet-Content\b",
        @"\bAdd-Content\b",
        @"\bOut-File\b",
        @"\bRemove-Item\b"
    };

    /// <summary>
    /// Validates plugin script content against its declared capabilities and sandbox policy.
    /// Returns a validation result with any violations found.
    /// </summary>
    public PluginValidationResult Validate(PluginEntity plugin)
    {
        var result = new PluginValidationResult { PluginId = plugin.Id, IsValid = true };
        var scriptContent = plugin.ScriptContent ?? "";

        if (string.IsNullOrWhiteSpace(scriptContent))
        {
            result.IsValid = true;
            result.Messages.Add("No script content to validate.");
            return result;
        }

        // Parse declared capabilities
        var declaredCapabilities = ParseCapabilities(plugin.RequiredCapabilities);
        var sandboxPolicy = ParseSandboxPolicy(plugin.SandboxLevel);

        // Check universal blocked patterns (always blocked)
        foreach (var pattern in UniversalBlockedPatterns)
        {
            if (Regex.IsMatch(scriptContent, pattern, RegexOptions.IgnoreCase))
            {
                result.IsValid = false;
                result.Violations.Add(new PluginViolation
                {
                    Rule = "UniversalBlock",
                    Pattern = pattern,
                    Message = $"Script contains universally blocked pattern: {pattern}"
                });
            }
        }

        // Check capability-scoped patterns
        foreach (var (capability, patterns) in CapabilityPatterns)
        {
            if (declaredCapabilities.Contains(capability))
                continue; // Plugin has declared this capability, allow these patterns

            foreach (var pattern in patterns)
            {
                if (Regex.IsMatch(scriptContent, pattern, RegexOptions.IgnoreCase))
                {
                    result.IsValid = false;
                    result.Violations.Add(new PluginViolation
                    {
                        Rule = "UndeclaredCapability",
                        Pattern = pattern,
                        Capability = capability.ToString(),
                        Message = $"Script uses '{capability}' operations but does not declare the '{capability}' capability. Add \"{capability.ToString().ToLower()}\" to RequiredCapabilities."
                    });
                }
            }
        }

        // Apply strict sandbox additional blocks
        if (sandboxPolicy == SandboxPolicy.Strict)
        {
            foreach (var pattern in StrictAdditionalBlocks)
            {
                if (Regex.IsMatch(scriptContent, pattern, RegexOptions.IgnoreCase))
                {
                    result.IsValid = false;
                    result.Violations.Add(new PluginViolation
                    {
                        Rule = "StrictSandbox",
                        Pattern = pattern,
                        Message = $"Script contains pattern blocked under Strict sandbox policy: {pattern}"
                    });
                }
            }
        }

        if (result.IsValid)
        {
            result.Messages.Add("Plugin script passes all sandbox validation checks.");
        }

        _logger.LogInformation(
            "Plugin {PluginId} validation: {IsValid}, Violations: {Count}",
            plugin.Id, result.IsValid, result.Violations.Count);

        return result;
    }

    /// <summary>
    /// Builds a PluginManifest from a PluginEntity by parsing its JSON fields.
    /// </summary>
    public PluginManifest BuildManifest(PluginEntity plugin)
    {
        var capabilities = ParseCapabilities(plugin.RequiredCapabilities);
        var lifecycleHooks = ParseLifecycleHooks(plugin.LifecycleHooks);
        var sandboxPolicy = ParseSandboxPolicy(plugin.SandboxLevel);
        var dependsOn = string.IsNullOrWhiteSpace(plugin.DependsOn)
            ? new List<string>()
            : plugin.DependsOn.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

        // Build permissions from capabilities
        var permissions = capabilities.Select(c => new PluginPermission
        {
            Resource = c.ToString().ToLower(),
            Actions = new List<string> { "read", "execute" },
            Justification = $"Required for {c} operations"
        }).ToList();

        return new PluginManifest
        {
            Id = plugin.Id,
            Name = plugin.Name,
            Description = plugin.Description,
            Version = plugin.Version,
            Author = plugin.Author,
            ApiVersion = plugin.ApiVersion,
            MinGatewayVersion = plugin.MinGatewayVersion,
            Capabilities = capabilities,
            Permissions = permissions,
            LifecycleHooks = lifecycleHooks,
            EntryPoint = plugin.SourceType == "file" ? "UploadedScript" : "ScriptContent",
            SandboxPolicy = sandboxPolicy,
            DependsOn = dependsOn
        };
    }

    private static List<PluginCapability> ParseCapabilities(string? json)
    {
        if (string.IsNullOrWhiteSpace(json) || json == "[]")
            return new List<PluginCapability>();

        try
        {
            var items = JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
            var capabilities = new List<PluginCapability>();
            foreach (var item in items)
            {
                if (Enum.TryParse<PluginCapability>(item, ignoreCase: true, out var cap))
                    capabilities.Add(cap);
            }
            return capabilities;
        }
        catch
        {
            return new List<PluginCapability>();
        }
    }

    private static Dictionary<string, string> ParseLifecycleHooks(string? json)
    {
        if (string.IsNullOrWhiteSpace(json) || json == "{}")
            return new Dictionary<string, string>();

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? new Dictionary<string, string>();
        }
        catch
        {
            return new Dictionary<string, string>();
        }
    }

    private static SandboxPolicy ParseSandboxPolicy(string? level)
    {
        return level?.ToLower() switch
        {
            "full" or "unrestricted" => SandboxPolicy.Unrestricted,
            "minimal" or "strict" => SandboxPolicy.Strict,
            _ => SandboxPolicy.Standard
        };
    }
}

/// <summary>
/// Result of plugin sandbox validation.
/// </summary>
public class PluginValidationResult
{
    public string PluginId { get; set; } = "";
    public bool IsValid { get; set; }
    public List<PluginViolation> Violations { get; set; } = new();
    public List<string> Messages { get; set; } = new();
}

/// <summary>
/// Describes a single validation violation.
/// </summary>
public class PluginViolation
{
    public string Rule { get; set; } = "";
    public string Pattern { get; set; } = "";
    public string? Capability { get; set; }
    public string Message { get; set; } = "";
}
