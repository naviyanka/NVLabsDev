using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServersController : ControllerBase
{
    private readonly ServerService _serverService;

    public ServersController(ServerService serverService)
    {
        _serverService = serverService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Server>>> GetServers([FromQuery] string? group = null)
    {
        var servers = await _serverService.GetServersAsync();
        if (!string.IsNullOrWhiteSpace(group))
        {
            servers = servers.Where(s => s.Group.Equals(group, StringComparison.OrdinalIgnoreCase)).ToList();
        }
        return Ok(servers);
    }

    [HttpPost]
    public async Task<ActionResult> AddServer([FromBody] ServerCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Ip))
        {
            return BadRequest("IP Address is required.");
        }
        await _serverService.AddManualServerAsync(dto);
        return Ok();
    }

    [HttpPut("{ip}")]
    public async Task<ActionResult> EditServer(string ip, [FromBody] ServerCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Ip))
        {
            return BadRequest("IP Address is required.");
        }
        var updated = await _serverService.UpdateServerAsync(ip, dto);
        if (updated == null) return NotFound();
        return Ok();
    }

    [HttpDelete("{ip}")]
    public async Task<IActionResult> DeleteServer(string ip)
    {
        var ok = await _serverService.DeleteServerAsync(ip);
        if (ok) return Ok();
        return NotFound();
    }

    [HttpPost("{ip}/restart")]
    public async Task<IActionResult> RestartServer(string ip, [FromServices] CimService cimService)
    {
        var ok = await cimService.RestartServerAsync(ip);
        if (ok) return Ok();
        return StatusCode(500, "Failed to restart server");
    }

    [HttpPost("{ip}/shutdown")]
    public async Task<IActionResult> ShutdownServer(string ip, [FromServices] CimService cimService)
    {
        var ok = await cimService.ShutdownServerAsync(ip);
        if (ok) return Ok();
        return StatusCode(500, "Failed to shutdown server");
    }

    [HttpGet("{ip}/disks")]
    public async Task<IActionResult> GetDisks(string ip, [FromServices] CimService cimService)
    {
        var disks = await cimService.GetDisksAsync(ip);
        return Ok(disks);
    }

    [HttpPost("sync")]
    public async Task<IActionResult> SyncFromAd([FromServices] ActiveDirectoryService adService, [FromServices] CimService cimService)
    {
        try
        {
            var adServers = await adService.GetDomainComputersAsync();
            int added = 0;

            // Load existing server IDs once to avoid repeated DB queries
            var existingIds = (await _serverService.GetServersAsync())
                .Select(s => s.Id)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var adServer in adServers)
            {
                if (!existingIds.Contains(adServer.Id))
                {
                    adServer.IsAdFetched = true;
                    await _serverService.AddDiscoveredServerAsync(adServer);
                    _ = Task.Run(() => cimService.EnableWinRmAsync(adServer.Ip));
                    added++;
                }
            }

            return Ok(new { message = $"AD sync complete. Discovered {adServers.Count} computers, added {added} new.", total = adServers.Count, added });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"AD sync failed: {ex.Message}" });
        }
    }

    [HttpPost("bulk-action")]
    public async Task<IActionResult> BulkAction([FromBody] BulkActionRequest request, [FromServices] IPowerShellExecutionService ps)
    {
        if (request.ServerIps == null || request.ServerIps.Count == 0)
            return BadRequest(new { error = "At least one server IP is required." });

        var results = new List<object>();

        foreach (var ip in request.ServerIps.Take(20)) // ponytail: cap at 20, pagination if fleet grows past that
        {
            try
            {
                string output;
                bool success;
                if (request.Action == "restart-service" && !string.IsNullOrWhiteSpace(request.ServiceName))
                {
                    var cmd = ip == "127.0.0.1" || ip == "localhost"
                        ? $"-NoProfile -Command \"Restart-Service -Name '{request.ServiceName}' -Force\""
                        : $"-NoProfile -Command \"Invoke-Command -ComputerName {ip} -ScriptBlock {{ Restart-Service -Name '{request.ServiceName}' -Force }}\"";
                    var res = await ps.ExecuteAsync(cmd, HttpContext.RequestAborted, 30000);
                    success = res.ExitCode == 0;
                    output = success ? "OK" : res.StandardError;
                }
                else if (request.Action == "run-script" && !string.IsNullOrWhiteSpace(request.Script))
                {
                    var encoded = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(request.Script));
                    var cmd = ip == "127.0.0.1" || ip == "localhost"
                        ? $"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {encoded}"
                        : $"-NoProfile -ExecutionPolicy Bypass -Command \"Invoke-Command -ComputerName {ip} -ScriptBlock {{ [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{encoded}')) | Invoke-Expression }}\"";
                    var res = await ps.ExecuteAsync(cmd, HttpContext.RequestAborted, 60000);
                    success = res.ExitCode == 0;
                    output = string.IsNullOrWhiteSpace(res.StandardOutput) ? (success ? "OK" : res.StandardError) : res.StandardOutput;
                }
                else if (request.Action == "restart-server")
                {
                    var cimService = HttpContext.RequestServices.GetRequiredService<CimService>();
                    var ok = await cimService.RestartServerAsync(ip);
                    success = ok;
                    output = ok ? "Restart initiated" : "Failed";
                }
                else
                {
                    success = false;
                    output = "Unknown action";
                }

                results.Add(new { ip, success, output = output.Trim() });
            }
            catch (Exception ex)
            {
                results.Add(new { ip, success = false, output = ex.Message });
            }
        }

        return Ok(new { action = request.Action, results });
    }
}

public class BulkActionRequest
{
    public List<string> ServerIps { get; set; } = new();
    public string Action { get; set; } = ""; // restart-service, run-script, restart-server
    public string? ServiceName { get; set; }
    public string? Script { get; set; }
}