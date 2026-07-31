using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IisController : ControllerBase
{
    private readonly IPowerShellExecutionService _ps;

    public IisController(IPowerShellExecutionService ps)
    {
        _ps = ps;
    }

    [HttpGet("sites")]
    public async Task<IActionResult> GetSites([FromQuery] string serverIp = "localhost")
    {
        var script = "Import-Module WebAdministration; Get-Website | Select-Object Name, Id, State, @{N='Bindings';E={($_.Bindings.Collection | ForEach-Object { $_.bindingInformation }) -join '; '}}, PhysicalPath, ApplicationPool | ConvertTo-Json -Compress";
        var cmd = BuildRemoteCommand(serverIp, script);
        var result = await _ps.ExecuteAsync(cmd, HttpContext.RequestAborted, 30000);
        return ParseJsonResult(result);
    }

    [HttpGet("app-pools")]
    public async Task<IActionResult> GetAppPools([FromQuery] string serverIp = "localhost")
    {
        var script = "Import-Module WebAdministration; Get-ChildItem IIS:\\AppPools | Select-Object Name, State, ManagedRuntimeVersion, @{N='WorkerProcesses';E={($_ | Get-ChildItem -ErrorAction SilentlyContinue).Count}} | ConvertTo-Json -Compress";
        var cmd = BuildRemoteCommand(serverIp, script);
        var result = await _ps.ExecuteAsync(cmd, HttpContext.RequestAborted, 30000);
        return ParseJsonResult(result);
    }

    [HttpPost("app-pools/{name}/recycle")]
    public async Task<IActionResult> RecycleAppPool(string name, [FromQuery] string serverIp = "localhost")
    {
        var script = $"Import-Module WebAdministration; Restart-WebAppPool -Name '{name}'";
        var cmd = BuildRemoteCommand(serverIp, script);
        var result = await _ps.ExecuteAsync(cmd, HttpContext.RequestAborted, 15000);
        return result.ExitCode == 0 ? Ok(new { message = $"App pool '{name}' recycled." }) : StatusCode(500, new { message = result.StandardError });
    }

    [HttpPost("sites/{name}/stop")]
    public async Task<IActionResult> StopSite(string name, [FromQuery] string serverIp = "localhost")
    {
        var script = $"Import-Module WebAdministration; Stop-Website -Name '{name}'";
        var cmd = BuildRemoteCommand(serverIp, script);
        var result = await _ps.ExecuteAsync(cmd, HttpContext.RequestAborted, 15000);
        return result.ExitCode == 0 ? Ok(new { message = $"Site '{name}' stopped." }) : StatusCode(500, new { message = result.StandardError });
    }

    [HttpPost("sites/{name}/start")]
    public async Task<IActionResult> StartSite(string name, [FromQuery] string serverIp = "localhost")
    {
        var script = $"Import-Module WebAdministration; Start-Website -Name '{name}'";
        var cmd = BuildRemoteCommand(serverIp, script);
        var result = await _ps.ExecuteAsync(cmd, HttpContext.RequestAborted, 15000);
        return result.ExitCode == 0 ? Ok(new { message = $"Site '{name}' started." }) : StatusCode(500, new { message = result.StandardError });
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
