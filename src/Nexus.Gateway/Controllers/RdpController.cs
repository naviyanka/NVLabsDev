using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;
using Microsoft.Win32;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{serverId}/rdp")]
public class RdpController : ControllerBase
{
    private readonly IPowerShellExecutionService _ps;

    public RdpController(IPowerShellExecutionService ps)
    {
        _ps = ps;
    }

    public class RdpSessionDto
    {
        [JsonPropertyName("sessionId")] public int SessionId { get; set; }
        [JsonPropertyName("userName")] public string UserName { get; set; } = string.Empty;
        [JsonPropertyName("sessionName")] public string SessionName { get; set; } = string.Empty;
        [JsonPropertyName("state")] public string State { get; set; } = "Active";
        [JsonPropertyName("connectTime")] public string ConnectTime { get; set; } = string.Empty;
        [JsonPropertyName("idleTime")] public string IdleTime { get; set; } = string.Empty;
        [JsonPropertyName("clientIp")] public string ClientIp { get; set; } = string.Empty;
        [JsonPropertyName("clientName")] public string ClientName { get; set; } = string.Empty;
    }

    public class RdpSecurityConfigDto
    {
        [JsonPropertyName("networkLevelAuth")] public bool NetworkLevelAuth { get; set; } = true;
        [JsonPropertyName("allowRemoteConnections")] public bool AllowRemoteConnections { get; set; } = true;
        [JsonPropertyName("securityLayer")] public string SecurityLayer { get; set; } = "SSL";
        [JsonPropertyName("port")] public int Port { get; set; } = 3389;
        [JsonPropertyName("maxIdleTimeoutMinutes")] public int MaxIdleTimeoutMinutes { get; set; } = 60;
    }

    public class RdpSecurityAuditDto
    {
        [JsonPropertyName("serverIp")] public string ServerIp { get; set; } = "";
        [JsonPropertyName("networkLevelAuth")] public bool NetworkLevelAuth { get; set; }
        [JsonPropertyName("securityLayer")] public string SecurityLayer { get; set; } = "";
        [JsonPropertyName("port")] public int Port { get; set; } = 3389;
        [JsonPropertyName("portExposed")] public bool PortExposed { get; set; }
        [JsonPropertyName("allowRemoteConnections")] public bool AllowRemoteConnections { get; set; }
        [JsonPropertyName("maxSessions")] public int MaxSessions { get; set; }
        [JsonPropertyName("activeSessions")] public int ActiveSessions { get; set; }
        [JsonPropertyName("failedLoginsLast24h")] public int FailedLoginsLast24h { get; set; }
        [JsonPropertyName("findings")] public List<string> Findings { get; set; } = new();
        [JsonPropertyName("riskLevel")] public string RiskLevel { get; set; } = "Low";
    }

    public class SendMessageRequest
    {
        [JsonPropertyName("message")] public string Message { get; set; } = string.Empty;
    }

    public class WebStudioDataDto
    {
        [JsonPropertyName("processes")] public string Processes { get; set; } = "[]";
        [JsonPropertyName("services")] public string Services { get; set; } = "[]";
        [JsonPropertyName("systemInfo")] public string SystemInfo { get; set; } = "{}";
        [JsonPropertyName("hostname")] public string Hostname { get; set; } = "";
        [JsonPropertyName("uptime")] public string Uptime { get; set; } = "";
    }

    // ─── SESSION MANAGEMENT (remote via WinRM) ───

    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions([FromRoute] string serverId)
    {
        var script = @"
            $sessions = qwinsta 2>$null
            if (-not $sessions) { $sessions = query session 2>$null }
            if (-not $sessions) { return '[]' }
            $result = @()
            foreach ($line in ($sessions | Select-Object -Skip 1)) {
                if ([string]::IsNullOrWhiteSpace($line)) { continue }
                $parts = $line.Trim() -split '\s+'
                if ($parts.Count -ge 3) {
                    $sessName = $parts[0] -replace '^>', ''
                    $user = ''; $id = 0; $state = 'Active'
                    if ($parts[1] -match '^\d+$') { $id = [int]$parts[1]; $state = $parts[2] }
                    else { $user = $parts[1]; if ($parts[2] -match '^\d+$') { $id = [int]$parts[2]; $state = if ($parts.Count -gt 3) { $parts[3] } else { 'Active' } } }
                    if ($id -gt 0 -or $user) {
                        $result += [PSCustomObject]@{ sessionId=$id; userName=$user; sessionName=$sessName; state=$(if($state -like '*Disc*'){'Disconnected'}else{'Active'}); clientIp=''; clientName='' }
                    }
                }
            }
            $result | ConvertTo-Json -Compress";

        var output = await RunOnServer(serverId, script);
        if (string.IsNullOrWhiteSpace(output) || output == "null")
            return Ok(new object[0]);
        return Content(output.StartsWith("[") ? output : $"[{output}]", "application/json");
    }

    [HttpPost("sessions/{sessionId:int}/disconnect")]
    public async Task<IActionResult> DisconnectSession([FromRoute] string serverId, [FromRoute] int sessionId)
    {
        var script = $"tsdiscon {sessionId} /server:{serverId}";
        var result = await RunOnServer(serverId, script);
        return Ok(new { success = true, message = $"Session {sessionId} disconnected on {serverId}" });
    }

    [HttpPost("sessions/{sessionId:int}/logoff")]
    public async Task<IActionResult> LogoffSession([FromRoute] string serverId, [FromRoute] int sessionId)
    {
        var script = $"logoff {sessionId} /server:{serverId}";
        var result = await RunOnServer(serverId, script);
        return Ok(new { success = true, message = $"Session {sessionId} logged off on {serverId}" });
    }

    [HttpPost("sessions/{sessionId:int}/message")]
    public async Task<IActionResult> SendMessage([FromRoute] string serverId, [FromRoute] int sessionId, [FromBody] SendMessageRequest req)
    {
        var script = $"msg {sessionId} /server:{serverId} \"{req.Message}\"";
        await RunOnServer(serverId, script);
        return Ok(new { success = true, message = "Message sent" });
    }

    // ─── RDP SECURITY CONFIG (registry) ───

    [HttpGet("config")]
    public IActionResult GetRdpConfig([FromRoute] string serverId)
    {
        var config = new RdpSecurityConfigDto();
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Control\Terminal Server");
            if (key != null)
            {
                var fDeny = key.GetValue("fDenyTSConnections");
                if (fDeny != null) config.AllowRemoteConnections = Convert.ToInt32(fDeny) == 0;

                using var ws = key.OpenSubKey(@"WinStations\RDP-Tcp");
                if (ws != null)
                {
                    var nla = ws.GetValue("UserAuthentication");
                    if (nla != null) config.NetworkLevelAuth = Convert.ToInt32(nla) == 1;
                    var port = ws.GetValue("PortNumber");
                    if (port != null) config.Port = Convert.ToInt32(port);
                    var sec = ws.GetValue("SecurityLayer");
                    if (sec != null) config.SecurityLayer = Convert.ToInt32(sec) switch { 0 => "RDP", 1 => "Negotiate", _ => "SSL" };
                }
            }
        }
        catch { }
        return Ok(config);
    }

    [HttpPut("config")]
    public IActionResult UpdateRdpConfig([FromRoute] string serverId, [FromBody] RdpSecurityConfigDto cfg)
    {
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Control\Terminal Server", true);
            if (key != null)
            {
                key.SetValue("fDenyTSConnections", cfg.AllowRemoteConnections ? 0 : 1, RegistryValueKind.DWord);
                using var ws = key.OpenSubKey(@"WinStations\RDP-Tcp", true);
                if (ws != null)
                {
                    ws.SetValue("UserAuthentication", cfg.NetworkLevelAuth ? 1 : 0, RegistryValueKind.DWord);
                    ws.SetValue("PortNumber", cfg.Port, RegistryValueKind.DWord);
                    ws.SetValue("SecurityLayer", cfg.SecurityLayer switch { "RDP" => 0, "Negotiate" => 1, _ => 2 }, RegistryValueKind.DWord);
                }
            }
            return Ok(cfg);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    // ─── SECURITY AUDIT ───

    [HttpGet("security-audit")]
    public async Task<IActionResult> SecurityAudit([FromRoute] string serverId)
    {
        var audit = new RdpSecurityAuditDto { ServerIp = serverId };
        var findings = new List<string>();

        // Get RDP config
        var nlaResult = await RunOnServer(serverId, "(Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp' -ErrorAction SilentlyContinue).UserAuthentication");
        audit.NetworkLevelAuth = nlaResult?.Trim() == "1";
        if (!audit.NetworkLevelAuth) findings.Add("Network Level Authentication (NLA) is disabled — credentials sent before session establishment");

        var secLayerResult = await RunOnServer(serverId, "(Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp' -ErrorAction SilentlyContinue).SecurityLayer");
        int.TryParse(secLayerResult?.Trim(), out var secLayer);
        audit.SecurityLayer = secLayer switch { 0 => "RDP (No Encryption)", 1 => "Negotiate", _ => "SSL/TLS" };
        if (secLayer == 0) findings.Add("Security layer set to 'RDP' with no transport encryption");

        var portResult = await RunOnServer(serverId, "(Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp' -ErrorAction SilentlyContinue).PortNumber");
        int.TryParse(portResult?.Trim(), out var port);
        audit.Port = port > 0 ? port : 3389;
        if (audit.Port == 3389) findings.Add("RDP running on default port 3389 — easily discoverable by scanners");

        var denyResult = await RunOnServer(serverId, "(Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server' -ErrorAction SilentlyContinue).fDenyTSConnections");
        audit.AllowRemoteConnections = denyResult?.Trim() == "0";

        // Check active sessions
        var sessCountResult = await RunOnServer(serverId, "(qwinsta 2>$null | Select-Object -Skip 1 | Where-Object { $_ -match '\\S' }).Count");
        int.TryParse(sessCountResult?.Trim(), out var sessCount);
        audit.ActiveSessions = sessCount;

        // Check max sessions
        var maxSessResult = await RunOnServer(serverId, "(Get-ItemProperty 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\Terminal Services' -ErrorAction SilentlyContinue).MaxInstanceCount");
        int.TryParse(maxSessResult?.Trim(), out var maxSess);
        audit.MaxSessions = maxSess > 0 ? maxSess : 2;

        // Check failed RDP logins last 24h (Event ID 4625 with logon type 10)
        var failedResult = await RunOnServer(serverId, "(Get-WinEvent -FilterHashtable @{LogName='Security';Id=4625;StartTime=(Get-Date).AddHours(-24)} -ErrorAction SilentlyContinue | Where-Object { $_.Properties[10].Value -eq 10 }).Count");
        int.TryParse(failedResult?.Trim(), out var failedLogins);
        audit.FailedLoginsLast24h = failedLogins;
        if (failedLogins > 20) findings.Add($"High number of failed RDP logins ({failedLogins}) in last 24h — possible brute-force");
        else if (failedLogins > 5) findings.Add($"{failedLogins} failed RDP login attempts in last 24h");

        // Check if RDP port responds (basic port check)
        var portCheckResult = await RunOnServer(serverId, $"(Test-NetConnection -ComputerName localhost -Port {audit.Port} -WarningAction SilentlyContinue).TcpTestSucceeded");
        audit.PortExposed = portCheckResult?.Trim().Equals("True", StringComparison.OrdinalIgnoreCase) == true;

        // Risk assessment
        audit.Findings = findings;
        audit.RiskLevel = findings.Count switch
        {
            0 => "Low",
            1 => "Medium",
            _ => findings.Any(f => f.Contains("brute-force") || f.Contains("No Encryption")) ? "Critical" : "High"
        };

        return Ok(audit);
    }

    // ─── WEB STUDIO LIVE DATA ───

    [HttpGet("live-data")]
    public async Task<IActionResult> GetLiveData([FromRoute] string serverId)
    {
        var data = new WebStudioDataDto();

        // Top processes
        var procResult = await RunOnServer(serverId, "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 12 Name, Id, @{N='MemMB';E={[math]::Round($_.WorkingSet64/1MB,1)}}, @{N='CpuSec';E={[math]::Round($_.CPU,1)}} | ConvertTo-Json -Compress");
        data.Processes = procResult ?? "[]";

        // Running services
        var svcResult = await RunOnServer(serverId, "Get-Service | Where-Object Status -eq 'Running' | Select-Object -First 15 Name, DisplayName | ConvertTo-Json -Compress");
        data.Services = svcResult ?? "[]";

        // System info
        var sysResult = await RunOnServer(serverId, "[PSCustomObject]@{ OS=(Get-CimInstance Win32_OperatingSystem).Caption; Domain=(Get-CimInstance Win32_ComputerSystem).Domain; TotalRAM=[math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB,1); Processors=(Get-CimInstance Win32_Processor).NumberOfLogicalProcessors } | ConvertTo-Json -Compress");
        data.SystemInfo = sysResult ?? "{}";

        // Hostname
        var hostResult = await RunOnServer(serverId, "hostname");
        data.Hostname = hostResult?.Trim() ?? serverId;

        // Uptime
        var uptimeResult = await RunOnServer(serverId, "((Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime).ToString('d\\.hh\\:mm')");
        data.Uptime = uptimeResult?.Trim() ?? "";

        return Ok(data);
    }

    // ─── HELPERS ───

    private async Task<string?> RunOnServer(string serverIp, string script)
    {
        try
        {
            var encoded = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            var isLocal = serverIp == "127.0.0.1" || serverIp == "localhost" ||
                          serverIp.Equals(Environment.MachineName, StringComparison.OrdinalIgnoreCase);
            var cmd = isLocal
                ? $"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {encoded}"
                : $"-NoProfile -ExecutionPolicy Bypass -Command \"Invoke-Command -ComputerName {serverIp} -ScriptBlock {{ [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{encoded}')) | Invoke-Expression }}\"";
            var result = await _ps.ExecuteAsync(cmd, default, 30000);
            return result.ExitCode == 0 ? result.StandardOutput?.Trim() : null;
        }
        catch { return null; }
    }
}
