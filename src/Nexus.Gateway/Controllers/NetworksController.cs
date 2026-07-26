using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;
using System.Text.Json;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{ip}/[controller]")]
public class NetworksController : ControllerBase
{
    private readonly IPowerShellExecutionService _ps;
    private readonly ILogger<NetworksController> _logger;

    public NetworksController(IPowerShellExecutionService ps, ILogger<NetworksController> logger)
    {
        _ps = ps;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NetworkAdapterModel>>> GetNetworks(string ip)
    {
        try
        {
            var script = @"
                $adapters = Get-NetAdapter -IncludeHidden:$false -ErrorAction SilentlyContinue
                $result = @()
                foreach ($a in $adapters) {
                    $ipInfo = Get-NetIPConfiguration -InterfaceAlias $a.Name -ErrorAction SilentlyContinue
                    $stats = Get-NetAdapterStatistics -Name $a.Name -ErrorAction SilentlyContinue

                    $ipv4 = ''
                    $ipv6 = ''
                    $subnet = ''
                    $gateway = ''
                    $dns = @()
                    $dhcp = $false

                    if ($ipInfo) {
                        $v4 = $ipInfo.IPv4Address | Select-Object -First 1
                        if ($v4) { $ipv4 = $v4.IPAddress }
                        $v6 = $ipInfo.IPv6Address | Select-Object -First 1
                        if ($v6) { $ipv6 = $v6.IPAddress }
                        
                        $defGateway = $ipInfo.IPv4DefaultGateway | Select-Object -First 1
                        if ($defGateway) { $gateway = $defGateway.NextHop }

                        $dnsServer = $ipInfo.DNSServer
                        if ($dnsServer) { $dns = $dnsServer.ServerAddresses }
                    }

                    # Fetch subnet & DHCP using WMI for the adapter
                    $wmi = Get-WmiObject Win32_NetworkAdapterConfiguration -Filter ""Index = $($a.InterfaceIndex)"" -ErrorAction SilentlyContinue
                    if ($wmi) {
                        if ($wmi.IPSubnet) { $subnet = $wmi.IPSubnet[0] }
                        $dhcp = $wmi.DHCPEnabled
                    }

                    $type = 'Wired'
                    if ($a.Virtual) { $type = 'Virtual' }
                    elseif ($a.PhysicalMediaType -match '802.11|Wi-Fi') { $type = 'WiFi' }

                    $status = 'Disconnected'
                    if ($a.Status -eq 'Up') { $status = 'Connected' }
                    elseif ($a.Status -eq 'Disabled') { $status = 'Disabled' }

                    $speed = 0
                    if ($a.LinkSpeed) {
                        $speedStr = $a.LinkSpeed
                        if ($speedStr -match '(\d+)\s+([KMG]?)bps') {
                            $val = [double]$matches[1]
                            $unit = $matches[2]
                            if ($unit -eq 'K') { $val = $val / 1000 }
                            elseif ($unit -eq 'G') { $val = $val * 1000 }
                            $speed = $val
                        }
                    }

                    $bytesIn = 0
                    $bytesOut = 0
                    if ($stats) {
                        $bytesIn = $stats.ReceivedBytes
                        $bytesOut = $stats.SentBytes
                    }

                    $result += [PSCustomObject]@{
                        Name = $a.Name
                        Description = $a.InterfaceDescription
                        Type = $type
                        Status = $status
                        Mac = $a.MacAddress
                        Ipv4 = $ipv4
                        Ipv6 = $ipv6
                        Subnet = $subnet
                        Gateway = $gateway
                        Dns = $dns
                        Dhcp = $dhcp
                        SpeedMbps = $speed
                        BytesIn = $bytesIn
                        BytesOut = $bytesOut
                    }
                }
                $result | ConvertTo-Json -Compress -Depth 3 -WarningAction SilentlyContinue
            ";

            var base64 = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            var psCmd = $"-NoProfile -ExecutionPolicy Bypass -Command \"Invoke-Command -ComputerName {ip} -ScriptBlock {{ [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{base64}')) | Invoke-Expression }}\"";
            
            if (ip == "localhost" || ip == "127.0.0.1" || ip.Equals("dc", StringComparison.OrdinalIgnoreCase))
            {
                 psCmd = $"-NoProfile -ExecutionPolicy Bypass -Command \"[System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{base64}')) | Invoke-Expression\"";
            }

            var result = await _ps.ExecuteAsync(psCmd, HttpContext.RequestAborted);
            var output = result.StandardOutput;

            var adapterList = new List<NetworkAdapterModel>();

            if (!string.IsNullOrWhiteSpace(output))
            {
                try
                {
                    using var doc = JsonDocument.Parse(output);
                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var el in doc.RootElement.EnumerateArray())
                        {
                            adapterList.Add(ParseAdapter(el));
                        }
                    }
                    else if (doc.RootElement.ValueKind == JsonValueKind.Object)
                    {
                        adapterList.Add(ParseAdapter(doc.RootElement));
                    }
                }
                catch (JsonException) { }
            }

            return Ok(adapterList);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get network adapters for {Ip}", ip);
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("{adapterName}/{action}")]
    public async Task<IActionResult> ControlAdapter(string ip, string adapterName, string action)
    {
        try
        {
            var cleanAdapterName = adapterName.Replace("'", "''"); // escape single quotes
            string script = "";

            switch (action.ToLower())
            {
                case "enable":
                    script = $"Enable-NetAdapter -Name '{cleanAdapterName}' -Confirm:$false -ErrorAction Stop";
                    break;
                case "disable":
                    script = $"Disable-NetAdapter -Name '{cleanAdapterName}' -Confirm:$false -ErrorAction Stop";
                    break;
                case "release":
                    script = $@"
                        $wmi = Get-WmiObject Win32_NetworkAdapterConfiguration | Where-Object {{ $_.Description -match '{cleanAdapterName}' -or $_.Caption -match '{cleanAdapterName}' }}
                        if ($wmi) {{ $wmi.ReleaseDHCPLease() }}
                    ";
                    break;
                case "renew":
                    script = $@"
                        $wmi = Get-WmiObject Win32_NetworkAdapterConfiguration | Where-Object {{ $_.Description -match '{cleanAdapterName}' -or $_.Caption -match '{cleanAdapterName}' }}
                        if ($wmi) {{ $wmi.RenewDHCPLease() }}
                    ";
                    break;
                default:
                    return BadRequest("Invalid action. Supported: enable, disable, release, renew.");
            }

            var base64 = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            var psCmd = $"-NoProfile -ExecutionPolicy Bypass -Command \"Invoke-Command -ComputerName {ip} -ScriptBlock {{ [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{base64}')) | Invoke-Expression }}\"";
            
            if (ip == "localhost" || ip == "127.0.0.1" || ip.Equals("dc", StringComparison.OrdinalIgnoreCase))
            {
                 psCmd = $"-NoProfile -ExecutionPolicy Bypass -Command \"[System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{base64}')) | Invoke-Expression\"";
            }

            var result = await _ps.ExecuteAsync(psCmd, HttpContext.RequestAborted);
            if (result.ExitCode == 0)
            {
                return Ok();
            }
            return StatusCode(500, result.StandardError ?? "Unknown error executing command.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to control adapter {AdapterName} on {Ip}", adapterName, ip);
            return StatusCode(500, ex.Message);
        }
    }

    private NetworkAdapterModel ParseAdapter(JsonElement el)
    {
        var model = new NetworkAdapterModel
        {
            Name = el.TryGetProperty("Name", out var name) ? name.GetString() ?? "" : "",
            Description = el.TryGetProperty("Description", out var desc) ? desc.GetString() ?? "" : "",
            Type = el.TryGetProperty("Type", out var type) ? type.GetString() ?? "Wired" : "Wired",
            Status = el.TryGetProperty("Status", out var status) ? status.GetString() ?? "Disconnected" : "Disconnected",
            Mac = el.TryGetProperty("Mac", out var mac) ? mac.GetString() ?? "" : "",
            Ipv4 = el.TryGetProperty("Ipv4", out var v4) ? v4.GetString() ?? "" : "",
            Ipv6 = el.TryGetProperty("Ipv6", out var v6) ? v6.GetString() ?? "" : "",
            Subnet = el.TryGetProperty("Subnet", out var sub) ? sub.GetString() ?? "" : "",
            Gateway = el.TryGetProperty("Gateway", out var gw) ? gw.GetString() ?? "" : "",
            Dhcp = el.TryGetProperty("Dhcp", out var dhcp) && dhcp.ValueKind == JsonValueKind.True,
            SpeedMbps = el.TryGetProperty("SpeedMbps", out var speed) && speed.TryGetDouble(out var s) ? s : 0,
            BytesIn = el.TryGetProperty("BytesIn", out var bin) && bin.TryGetInt64(out var bi) ? bi : 0,
            BytesOut = el.TryGetProperty("BytesOut", out var bout) && bout.TryGetInt64(out var bo) ? bo : 0
        };

        if (el.TryGetProperty("Dns", out var d) && d.ValueKind == JsonValueKind.Array)
        {
            foreach (var dn in d.EnumerateArray())
            {
                var ds = dn.GetString();
                if (!string.IsNullOrEmpty(ds)) model.Dns.Add(ds);
            }
        }
        else if (d.ValueKind == JsonValueKind.String)
        {
            var ds = d.GetString();
            if (!string.IsNullOrEmpty(ds)) model.Dns.Add(ds);
        }

        return model;
    }
}
