# Nexus Plugin SDK

## Overview

The Nexus Plugin SDK provides a contract-based system for developing, distributing, and executing third-party plugins within the Nexus Gateway platform. Plugins are PowerShell (or other script-type) extensions that run in a sandboxed environment with declared capabilities and permissions.

## Plugin Manifest

Every plugin is described by a manifest that defines its metadata, capabilities, permissions, and lifecycle hooks. The manifest is automatically derived from the `PluginEntity` model fields stored in the database.

### Manifest Schema

```json
{
  "id": "string (GUID)",
  "name": "string",
  "description": "string",
  "version": "string (semver, e.g. 1.0.0)",
  "author": "string",
  "apiVersion": "string (e.g. 1.0)",
  "minGatewayVersion": "string (semver)",
  "capabilities": ["Filesystem", "Network", "Registry", ...],
  "permissions": [
    {
      "resource": "string",
      "actions": ["read", "write", "execute"],
      "justification": "string"
    }
  ],
  "lifecycleHooks": {
    "OnInstall": "script content",
    "OnActivate": "script content",
    "OnDeactivate": "script content",
    "OnUninstall": "script content"
  },
  "entryPoint": "ScriptContent | UploadedScript",
  "sandboxPolicy": "Unrestricted | Standard | Strict",
  "dependsOn": ["plugin-id-1", "plugin-id-2"]
}
```

### Retrieving a Manifest

```
GET /api/plugins/{id}/manifest
```

Returns the full manifest for the specified plugin.

## Capabilities

Capabilities declare what system domains your plugin needs access to. The sandbox validator checks your script content against these declarations and blocks undeclared operations.

| Capability | Description | Example Operations |
|---|---|---|
| `Filesystem` | Read/write files and directories | `Set-Content`, `Remove-Item`, `Copy-Item`, `Move-Item` |
| `Network` | HTTP requests, DNS, connections | `Invoke-WebRequest`, `Invoke-RestMethod`, `Test-Connection` |
| `Registry` | Windows Registry access | `New-Item HKLM:`, `Set-ItemProperty` |
| `ActiveDirectory` | AD queries and modifications | `Get-ADUser`, `Set-ADUser`, `New-ADGroup` |
| `ProcessManagement` | Start/stop processes | `Start-Process`, `Stop-Process`, `Get-Process` |
| `ServiceControl` | Windows service management | `Start-Service`, `Stop-Service`, `Restart-Service` |
| `EventLog` | Event log operations | `Write-EventLog`, `New-EventLog` |
| `ScheduledTasks` | Task scheduler management | `Register-ScheduledTask`, `Unregister-ScheduledTask` |
| `Wmi` | WMI/CIM remote operations | `Invoke-WmiMethod`, `Get-CimInstance`, `Invoke-Command` |
| `Certificates` | Certificate store access | `Import-Certificate`, `New-SelfSignedCertificate` |

### Declaring Capabilities

Set the `RequiredCapabilities` field as a JSON array:

```json
["filesystem", "network", "registry"]
```

## Sandbox Policies

The sandbox policy controls how strictly the plugin's script is validated.

### Unrestricted (SandboxLevel: "full")

- No capability-scoped restrictions
- Universal blocks still apply (e.g., `Invoke-Expression`, `certutil`)
- Intended for administrator-authored built-in plugins only

### Standard (SandboxLevel: "restricted")

- Scripts are validated against declared capabilities
- Operations outside declared capabilities are blocked
- Universal blocks apply
- **Recommended for most plugins**

### Strict (SandboxLevel: "minimal")

- All Standard restrictions apply
- Additional operations blocked: `Start-Process`, `Start-Job`, `Invoke-Command`, `Enter-PSSession`, `New-PSSession`, `Set-Content`, `Add-Content`, `Out-File`, `Remove-Item`
- Intended for read-only diagnostic plugins

## Universally Blocked Patterns

These patterns are always blocked regardless of capabilities or sandbox policy:

- `Invoke-Expression` / `IEX` (arbitrary code execution)
- `certutil` (certificate abuse vector)
- `bitsadmin` (download abuse vector)
- `[System.Net.WebClient]` (uncontrolled network)
- `DownloadString` / `DownloadFile` (uncontrolled downloads)

## Lifecycle Hooks

Lifecycle hooks allow plugins to execute setup/teardown logic at specific points in their lifecycle.

| Hook | When Executed | Use Case |
|---|---|---|
| `OnInstall` | When the plugin is first added to the system | Create required directories, validate prerequisites |
| `OnActivate` | Before each plugin execution (run) | Check dependencies, warm caches, verify connectivity |
| `OnDeactivate` | After plugin execution completes | Clean temporary files, close connections |
| `OnUninstall` | When the plugin is removed from the system | Remove created resources, clean up |

### Declaring Lifecycle Hooks

Set the `LifecycleHooks` field as a JSON object:

```json
{
  "OnInstall": "New-Item -Path C:\\NexusPlugins\\MyPlugin -ItemType Directory -Force",
  "OnActivate": "Write-Output 'Plugin activating...'",
  "OnDeactivate": "Write-Output 'Plugin deactivating...'",
  "OnUninstall": "Remove-Item -Path C:\\NexusPlugins\\MyPlugin -Recurse -Force"
}
```

**Note:** Lifecycle hook scripts are subject to the same sandbox validation as the main script content.

## Validation

Before execution, the gateway validates plugin scripts against their declared manifest. You can also validate manually:

```
POST /api/plugins/{id}/validate
```

### Validation Response

```json
{
  "pluginId": "abc-123",
  "isValid": true,
  "violations": [],
  "messages": ["Plugin script passes all sandbox validation checks."]
}
```

If validation fails:

```json
{
  "pluginId": "abc-123",
  "isValid": false,
  "violations": [
    {
      "rule": "UndeclaredCapability",
      "pattern": "\\bInvoke-WebRequest\\b",
      "capability": "Network",
      "message": "Script uses 'Network' operations but does not declare the 'Network' capability."
    }
  ],
  "messages": []
}
```

## Dependencies

Plugins can declare dependencies on other plugins using the `DependsOn` field (comma-separated plugin IDs):

```
"DependsOn": "plugin-id-1,plugin-id-2"
```

The gateway will verify that all dependencies are present and active before allowing execution.

## Developing a Third-Party Plugin

### Step 1: Define Your Manifest

Determine what capabilities your plugin needs and set the appropriate fields:

```json
{
  "name": "Network Health Check",
  "description": "Validates network connectivity to critical endpoints",
  "version": "1.0.0",
  "author": "Your Name",
  "apiVersion": "1.0",
  "minGatewayVersion": "1.0.0",
  "requiredCapabilities": "[\"network\"]",
  "sandboxLevel": "restricted",
  "scriptType": "powershell",
  "category": "Network"
}
```

### Step 2: Write Your Script

Write your PowerShell script using only the operations allowed by your declared capabilities:

```powershell
# Network Health Check Plugin
param(
    [string[]]$Endpoints = @("google.com", "8.8.8.8", "your-dc.domain.local")
)

foreach ($endpoint in $Endpoints) {
    $result = Test-Connection -ComputerName $endpoint -Count 1 -Quiet
    if ($result) {
        Write-Output "[OK] $endpoint is reachable"
    } else {
        Write-Output "[FAIL] $endpoint is NOT reachable"
    }
}
```

### Step 3: Validate

Use the validation endpoint to check your script before deploying:

```
POST /api/plugins/{id}/validate
```

Fix any violations reported in the response.

### Step 4: Add Lifecycle Hooks (Optional)

If your plugin needs setup/teardown:

```json
{
  "OnActivate": "Write-Output 'Checking DNS resolution...' ; Resolve-DnsName google.com | Out-Null",
  "OnDeactivate": "Write-Output 'Network check complete.'"
}
```

### Step 5: Deploy

Upload your plugin via the Nexus UI or the API:

```
POST /api/plugins
Content-Type: application/json

{
  "name": "Network Health Check",
  "description": "Validates network connectivity",
  "icon": "network",
  "scriptType": "powershell",
  "sourceType": "inline",
  "scriptContent": "...",
  "author": "Your Name",
  "category": "Network",
  "version": "1.0.0",
  "requiredCapabilities": "[\"network\"]",
  "sandboxLevel": "restricted",
  "lifecycleHooks": "{\"OnActivate\": \"Write-Output 'Starting...'\"}"
}
```

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/plugins` | GET | List all plugins |
| `/api/plugins` | POST | Create a new plugin |
| `/api/plugins/{id}` | PUT | Update a plugin |
| `/api/plugins/{id}` | DELETE | Delete a plugin (non-built-in only) |
| `/api/plugins/{id}/manifest` | GET | Get the plugin's full SDK manifest |
| `/api/plugins/{id}/validate` | POST | Validate plugin script against sandbox |
| `/api/plugins/{id}/run?serverIps=...` | POST | Execute plugin on target servers |
| `/api/plugins/{id}/stop` | POST | Stop running plugin jobs |
| `/api/plugins/{id}/jobs` | GET | Get execution job status |
| `/api/plugins/{id}/upload` | POST | Upload a script file |

## Version Compatibility

| API Version | Gateway Version | Features |
|---|---|---|
| 1.0 | 1.0.0+ | Base plugin system, CRUD, execution |
| 1.0 | 1.1.0+ | SDK manifest, capabilities, sandbox validation, lifecycle hooks |

## Security Considerations

1. **Principle of Least Privilege**: Always declare only the capabilities your plugin actually needs.
2. **Prefer Strict or Standard**: Use `Unrestricted` only when absolutely necessary and only for admin-authored plugins.
3. **Lifecycle Hooks are Validated**: Hook scripts go through the same sandbox checks as main content.
4. **Pre-execution Validation**: The gateway validates scripts before every execution. If your manifest changes, re-validate.
5. **Universal Blocks Cannot Be Bypassed**: Certain dangerous patterns are always blocked regardless of permissions.
