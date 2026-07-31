using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DnsController : ControllerBase
{
    private readonly IPowerShellExecutionService _ps;

    public DnsController(IPowerShellExecutionService ps)
    {
        _ps = ps;
    }

    [HttpGet("zones")]
    public async Task<IActionResult> GetZones([FromQuery] string serverIp = "localhost")
    {
        var cmd = BuildRemoteCommand(serverIp, "Get-DnsServerZone | Select-Object ZoneName, ZoneType, IsAutoCreated, IsDsIntegrated, IsReverseLookupZone | ConvertTo-Json -Compress");
        var result = await _ps.ExecuteAsync(cmd, HttpContext.RequestAborted, 30000);
        return ParseJsonResult(result);
    }

    [HttpGet("zones/{zoneName}/records")]
    public async Task<IActionResult> GetRecords(string zoneName, [FromQuery] string serverIp = "localhost")
    {
        var cmd = BuildRemoteCommand(serverIp, $"Get-DnsServerResourceRecord -ZoneName '{zoneName}' | Select-Object HostName, RecordType, @{{N='Data';E={{$_.RecordData.IPv4Address.IPAddressToString ?? $_.RecordData.HostNameAlias ?? $_.RecordData.DescriptiveText ?? ''}}}} , Timestamp | ConvertTo-Json -Compress");
        var result = await _ps.ExecuteAsync(cmd, HttpContext.RequestAborted, 30000);
        return ParseJsonResult(result);
    }

    [HttpPost("zones/{zoneName}/records")]
    public async Task<IActionResult> AddRecord(string zoneName, [FromBody] DnsRecordDto dto, [FromQuery] string serverIp = "localhost")
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Type))
            return BadRequest(new { message = "Name and Type are required." });

        var script = dto.Type.ToUpperInvariant() switch
        {
            "A" => $"Add-DnsServerResourceRecordA -ZoneName '{zoneName}' -Name '{dto.Name}' -IPv4Address '{dto.Value}'",
            "AAAA" => $"Add-DnsServerResourceRecordAAAA -ZoneName '{zoneName}' -Name '{dto.Name}' -IPv6Address '{dto.Value}'",
            "CNAME" => $"Add-DnsServerResourceRecordCName -ZoneName '{zoneName}' -Name '{dto.Name}' -HostNameAlias '{dto.Value}'",
            "MX" => $"Add-DnsServerResourceRecordMX -ZoneName '{zoneName}' -Name '{dto.Name}' -MailExchange '{dto.Value}' -Preference {dto.Priority ?? 10}",
            "TXT" => $"Add-DnsServerResourceRecord -ZoneName '{zoneName}' -Name '{dto.Name}' -Txt -DescriptiveText '{dto.Value}'",
            _ => ""
        };

        if (string.IsNullOrEmpty(script))
            return BadRequest(new { message = $"Unsupported record type: {dto.Type}" });

        var cmd = BuildRemoteCommand(serverIp, script);
        var result = await _ps.ExecuteAsync(cmd, HttpContext.RequestAborted, 15000);
        return result.ExitCode == 0 ? Ok(new { message = "Record added." }) : StatusCode(500, new { message = result.StandardError });
    }

    [HttpDelete("zones/{zoneName}/records")]
    public async Task<IActionResult> DeleteRecord(string zoneName, [FromQuery] string name, [FromQuery] string type, [FromQuery] string serverIp = "localhost")
    {
        var script = $"Remove-DnsServerResourceRecord -ZoneName '{zoneName}' -Name '{name}' -RRType '{type}' -Force";
        var cmd = BuildRemoteCommand(serverIp, script);
        var result = await _ps.ExecuteAsync(cmd, HttpContext.RequestAborted, 15000);
        return result.ExitCode == 0 ? Ok(new { message = "Record deleted." }) : StatusCode(500, new { message = result.StandardError });
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

public class DnsRecordDto
{
    public string Name { get; set; } = "";
    public string Type { get; set; } = "A";
    public string Value { get; set; } = "";
    public int? Priority { get; set; }
}
