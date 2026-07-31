using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DhcpController : ControllerBase
{
    private readonly IPowerShellExecutionService _ps;

    public DhcpController(IPowerShellExecutionService ps)
    {
        _ps = ps;
    }

    [HttpGet("scopes")]
    public async Task<IActionResult> GetScopes([FromQuery] string serverIp = "localhost")
    {
        var script = @"
            Get-DhcpServerv4Scope | ForEach-Object {
                $stats = Get-DhcpServerv4ScopeStatistics -ScopeId $_.ScopeId
                [PSCustomObject]@{
                    ScopeId = $_.ScopeId.ToString()
                    Name = $_.Name
                    StartRange = $_.StartRange.ToString()
                    EndRange = $_.EndRange.ToString()
                    SubnetMask = $_.SubnetMask.ToString()
                    State = $_.State
                    Free = $stats.Free
                    InUse = $stats.InUse
                    PercentInUse = $stats.PercentageInUse
                }
            } | ConvertTo-Json -Compress";
        var cmd = BuildRemoteCommand(serverIp, script);
        var result = await _ps.ExecuteAsync(cmd, HttpContext.RequestAborted, 30000);
        return ParseJsonResult(result);
    }

    [HttpGet("scopes/{scopeId}/leases")]
    public async Task<IActionResult> GetLeases(string scopeId, [FromQuery] string serverIp = "localhost")
    {
        var script = $"Get-DhcpServerv4Lease -ScopeId '{scopeId}' | Select-Object IPAddress, ClientId, HostName, AddressState, LeaseExpiryTime | ConvertTo-Json -Compress";
        var cmd = BuildRemoteCommand(serverIp, script);
        var result = await _ps.ExecuteAsync(cmd, HttpContext.RequestAborted, 30000);
        return ParseJsonResult(result);
    }

    [HttpGet("reservations")]
    public async Task<IActionResult> GetReservations([FromQuery] string serverIp = "localhost")
    {
        var script = "Get-DhcpServerv4Scope | ForEach-Object { Get-DhcpServerv4Reservation -ScopeId $_.ScopeId } | Select-Object ScopeId, IPAddress, ClientId, Name, Description | ConvertTo-Json -Compress";
        var cmd = BuildRemoteCommand(serverIp, script);
        var result = await _ps.ExecuteAsync(cmd, HttpContext.RequestAborted, 30000);
        return ParseJsonResult(result);
    }

    private static string BuildRemoteCommand(string serverIp, string script)
    {
        var encoded = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
        if (serverIp == "localhost" || serverIp == "127.0.0.1")
            return $"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {encoded}";
        return $"-NoProfile -ExecutionPolicy Bypass -Command \"Invoke-Command -ComputerName {serverIp} -ScriptBlock {{ [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{encoded}')) | Invoke-Expression }}\"";
    }

    private IActionResult ParseJsonResult(PowerShellResult result)
    {
        if (result.ExitCode != 0)
            return StatusCode(500, new { message = result.StandardError });
        var output = result.StandardOutput?.Trim();
        if (string.IsNullOrEmpty(output) || output == "null")
            return Ok(new object[0]);
        return Content(output.StartsWith("[") || output.StartsWith("{") ? output : "[]", "application/json");
    }
}
