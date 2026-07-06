using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;
using System.Diagnostics;
using System.Text.Json;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{ip}/roles")]
public class RolesController : ControllerBase
{
    private readonly NexusContext _db;
    private readonly ILogger<RolesController> _logger;
    private readonly IPowerShellExecutionService _ps;

    public RolesController(NexusContext db, ILogger<RolesController> logger, IPowerShellExecutionService ps)
    {
        _db = db;
        _logger = logger;
        _ps = ps;
    }

    private async Task<bool> IsServerOs(string ip)
    {
        var server = await _db.Servers.FirstOrDefaultAsync(s => s.Ip == ip || s.Id == ip);
        if (server == null) return true; // Default to server logic if not found
        return server.Os.Contains("Server", StringComparison.OrdinalIgnoreCase);
    }

    [HttpGet]
    public async Task<IActionResult> GetRoles(string ip, [FromQuery] bool refresh = false)
    {
        try
        {
            if (!refresh)
            {
                var cached = await _db.ServerRoles
                    .Where(r => r.ServerIp == ip)
                    .OrderBy(r => r.DisplayName)
                    .ToListAsync();

                if (cached.Any())
                {
                    return Ok(cached.Select(r => new WindowsRoleModel
                    {
                        Name = r.Name,
                        DisplayName = r.DisplayName,
                        InstallState = r.InstallState,
                        FeatureType = r.FeatureType
                    }));
                }
            }

            var isServer = await IsServerOs(ip);
            string cmd;
            
            if (isServer)
            {
                cmd = "Get-WindowsFeature | Select-Object Name, DisplayName, InstallState | ConvertTo-Json -Compress -Depth 1 -WarningAction SilentlyContinue";
            }
            else
            {
                cmd = "Get-WindowsOptionalFeature -Online | Select-Object FeatureName, DisplayName, State | ConvertTo-Json -Compress -Depth 1 -WarningAction SilentlyContinue";
            }

            var script = $"Invoke-Command -ComputerName {ip} -ScriptBlock {{ {cmd} }}";
            var base64 = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            
            var result = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {base64}", HttpContext.RequestAborted);
            var output = result.StandardOutput;

            if (result.ExitCode != 0 || string.IsNullOrWhiteSpace(output))
            {
                return StatusCode(500, "Failed to get roles/features.");
            }

            var rolesList = new List<WindowsRoleEntity>();
            
            try 
            {
                using var doc = JsonDocument.Parse(output);
                if (doc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var element in doc.RootElement.EnumerateArray())
                    {
                        if (isServer)
                        {
                            var stateInt = element.TryGetProperty("InstallState", out var st) ? st.GetInt32() : 0;
                            var stateStr = stateInt == 1 ? "Installed" : (stateInt == 2 ? "Removed" : "Available");
                            
                            rolesList.Add(new WindowsRoleEntity
                            {
                                ServerIp = ip,
                                Name = element.GetProperty("Name").GetString() ?? "",
                                DisplayName = element.GetProperty("DisplayName").GetString() ?? "",
                                InstallState = stateStr,
                                FeatureType = "Role"
                            });
                        }
                        else
                        {
                            var stateInt = element.TryGetProperty("State", out var st) ? st.GetInt32() : 0;
                            var stateStr = stateInt == 1 ? "Installed" : "Available";

                            rolesList.Add(new WindowsRoleEntity
                            {
                                ServerIp = ip,
                                Name = element.GetProperty("FeatureName").GetString() ?? "",
                                DisplayName = element.GetProperty("DisplayName").GetString() ?? element.GetProperty("FeatureName").GetString() ?? "",
                                InstallState = stateStr,
                                FeatureType = "OptionalFeature"
                            });
                        }
                    }
                }
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse JSON output: {Output}", output);
                return StatusCode(500, "Failed to parse roles/features.");
            }

            // Save to DB
            var existing = await _db.ServerRoles.Where(r => r.ServerIp == ip).ToListAsync();
            _db.ServerRoles.RemoveRange(existing);
            _db.ServerRoles.AddRange(rolesList);
            await _db.SaveChangesAsync();

            return Ok(rolesList.OrderBy(r => r.DisplayName).Select(r => new WindowsRoleModel
            {
                Name = r.Name,
                DisplayName = r.DisplayName,
                InstallState = r.InstallState,
                FeatureType = r.FeatureType
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting roles for {Ip}", ip);
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("install")]
    public async Task<IActionResult> InstallRole(string ip, [FromBody] RoleRequest request)
    {
        try
        {
            var isServer = await IsServerOs(ip);
            string cmd;

            if (isServer)
            {
                cmd = $"Install-WindowsFeature -Name \"{request.Name}\" -IncludeManagementTools";
            }
            else
            {
                cmd = $"Enable-WindowsOptionalFeature -Online -FeatureName \"{request.Name}\" -All -NoRestart";
            }

            var script = $"Invoke-Command -ComputerName {ip} -ScriptBlock {{ {cmd} }}";
            var base64 = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            
            var result = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {base64}", HttpContext.RequestAborted);
            var err = result.StandardError;

            if (result.ExitCode != 0)
            {
                return StatusCode(500, $"Install failed: {err}");
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error installing role for {Ip}", ip);
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("uninstall")]
    public async Task<IActionResult> UninstallRole(string ip, [FromBody] RoleRequest request)
    {
        try
        {
            var isServer = await IsServerOs(ip);
            string cmd;

            if (isServer)
            {
                cmd = $"Uninstall-WindowsFeature -Name \"{request.Name}\"";
            }
            else
            {
                cmd = $"Disable-WindowsOptionalFeature -Online -FeatureName \"{request.Name}\" -NoRestart";
            }

            var script = $"Invoke-Command -ComputerName {ip} -ScriptBlock {{ {cmd} }}";
            var base64 = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            
            var result = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {base64}", HttpContext.RequestAborted);
            var err = result.StandardError;

            if (result.ExitCode != 0)
            {
                return StatusCode(500, $"Uninstall failed: {err}");
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uninstalling role for {Ip}", ip);
            return StatusCode(500, ex.Message);
        }
    }
}
