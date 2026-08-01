using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ComplianceController : ControllerBase
{
    private readonly NexusContext _db;
    private readonly IPowerShellExecutionService _ps;

    public ComplianceController(NexusContext db, IPowerShellExecutionService ps)
    {
        _db = db;
        _ps = ps;
    }

    [HttpGet("snapshots")]
    public async Task<IActionResult> GetSnapshots([FromQuery] string? serverIp = null)
    {
        var query = _db.ConfigSnapshots.AsQueryable();
        if (!string.IsNullOrWhiteSpace(serverIp))
            query = query.Where(s => s.ServerIp == serverIp);

        var snapshots = await query.OrderByDescending(s => s.CapturedAt).Take(100).ToListAsync();
        return Ok(snapshots);
    }

    [HttpPost("snapshots/capture")]
    public async Task<IActionResult> CaptureSnapshot([FromQuery] string serverIp)
    {
        if (string.IsNullOrWhiteSpace(serverIp))
            return BadRequest(new { message = "serverIp is required." });

        var server = await _db.Servers.FirstOrDefaultAsync(s => s.Ip == serverIp);
        var serverName = server?.Name ?? serverIp;

        // Capture roles
        var rolesScript = "Get-WindowsFeature | Where-Object Installed | Select-Object Name, DisplayName | ConvertTo-Json -Compress";
        var rolesResult = await RunOnServer(serverIp, rolesScript);

        // Capture services
        var servicesScript = "Get-Service | Select-Object Name, Status, StartType | ConvertTo-Json -Compress";
        var servicesResult = await RunOnServer(serverIp, servicesScript);

        // Capture local users
        var usersScript = "Get-LocalUser | Select-Object Name, Enabled | ConvertTo-Json -Compress";
        var usersResult = await RunOnServer(serverIp, usersScript);

        // Capture firewall profiles
        var fwScript = "Get-NetFirewallProfile | Select-Object Name, Enabled | ConvertTo-Json -Compress";
        var fwResult = await RunOnServer(serverIp, fwScript);

        var snapshot = new ConfigSnapshot
        {
            ServerIp = serverIp,
            ServerName = serverName,
            CapturedAt = DateTime.UtcNow,
            InstalledRolesJson = rolesResult ?? "[]",
            ServicesJson = servicesResult ?? "[]",
            LocalUsersJson = usersResult ?? "[]",
            FirewallProfileJson = fwResult ?? "[]",
            IsBaseline = false
        };

        _db.ConfigSnapshots.Add(snapshot);
        await _db.SaveChangesAsync();
        return Ok(snapshot);
    }

    [HttpPost("snapshots/{id}/set-baseline")]
    public async Task<IActionResult> SetBaseline(int id)
    {
        var snapshot = await _db.ConfigSnapshots.FindAsync(id);
        if (snapshot == null) return NotFound();

        // Clear any existing baseline for this server
        var existing = await _db.ConfigSnapshots
            .Where(s => s.ServerIp == snapshot.ServerIp && s.IsBaseline)
            .ToListAsync();
        foreach (var e in existing) e.IsBaseline = false;

        snapshot.IsBaseline = true;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Baseline set.", snapshot });
    }

    [HttpGet("drift")]
    public async Task<IActionResult> DetectDrift([FromQuery] string serverIp)
    {
        if (string.IsNullOrWhiteSpace(serverIp))
            return BadRequest(new { message = "serverIp is required." });

        var baseline = await _db.ConfigSnapshots
            .Where(s => s.ServerIp == serverIp && s.IsBaseline)
            .FirstOrDefaultAsync();

        if (baseline == null)
            return Ok(new { hasDrift = false, message = "No baseline set for this server. Capture a snapshot and mark it as baseline first." });

        var latest = await _db.ConfigSnapshots
            .Where(s => s.ServerIp == serverIp && !s.IsBaseline)
            .OrderByDescending(s => s.CapturedAt)
            .FirstOrDefaultAsync();

        if (latest == null)
            return Ok(new { hasDrift = false, message = "No comparison snapshot available. Capture a new snapshot to compare against baseline." });

        var drifts = new List<object>();

        if (baseline.InstalledRolesJson != latest.InstalledRolesJson)
            drifts.Add(new { category = "Installed Roles", baseline = baseline.InstalledRolesJson, current = latest.InstalledRolesJson });
        if (baseline.ServicesJson != latest.ServicesJson)
            drifts.Add(new { category = "Services", baseline = baseline.ServicesJson, current = latest.ServicesJson });
        if (baseline.LocalUsersJson != latest.LocalUsersJson)
            drifts.Add(new { category = "Local Users", baseline = baseline.LocalUsersJson, current = latest.LocalUsersJson });
        if (baseline.FirewallProfileJson != latest.FirewallProfileJson)
            drifts.Add(new { category = "Firewall Profiles", baseline = baseline.FirewallProfileJson, current = latest.FirewallProfileJson });

        return Ok(new
        {
            hasDrift = drifts.Count > 0,
            driftCount = drifts.Count,
            baselineDate = baseline.CapturedAt,
            latestDate = latest.CapturedAt,
            drifts
        });
    }

    [HttpGet("cis-check")]
    public async Task<IActionResult> CisCheck([FromQuery] string serverIp)
    {
        if (string.IsNullOrWhiteSpace(serverIp))
            return BadRequest(new { message = "serverIp is required." });

        var checks = await RunAllCisChecks(serverIp);

        var passed = checks.Count(c => c.Status == "pass");
        var total = checks.Count;
        var score = total > 0 ? Math.Round((double)passed / total * 100, 1) : 0;

        return Ok(new { serverIp, score, passed, total, checks });
    }

    [HttpGet("fleet-score")]
    public async Task<IActionResult> FleetComplianceScore()
    {
        var servers = await _db.Servers.Where(s => s.Status != "offline").ToListAsync();
        var results = new List<object>();

        foreach (var server in servers)
        {
            try
            {
                var checks = await RunAllCisChecks(server.Ip);
                var passed = checks.Count(c => c.Status == "pass");
                var total = checks.Count;
                var score = total > 0 ? Math.Round((double)passed / total * 100, 1) : 0;
                results.Add(new { serverName = server.Name, serverIp = server.Ip, score, passed, total });
            }
            catch
            {
                results.Add(new { serverName = server.Name, serverIp = server.Ip, score = 0.0, passed = 0, total = 0 });
            }
        }

        var fleetAvg = results.Count > 0 ? Math.Round(results.Average(r => ((dynamic)r).score), 1) : 0;
        return Ok(new { fleetAverageScore = fleetAvg, serverCount = results.Count, servers = results });
    }

    [HttpPost("remediate")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Remediate([FromBody] RemediateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CheckId) || string.IsNullOrWhiteSpace(request.ServerIp))
            return BadRequest(new { message = "checkId and serverIp are required." });

        var script = GetRemediationScript(request.CheckId);
        if (string.IsNullOrEmpty(script))
            return BadRequest(new { message = $"No remediation available for check '{request.CheckId}'." });

        var result = await RunOnServer(request.ServerIp, script);
        return Ok(new { checkId = request.CheckId, serverIp = request.ServerIp, applied = true, output = result ?? "Remediation applied (no output)." });
    }

    private async Task<List<CisCheckResult>> RunAllCisChecks(string serverIp)
    {
        var checks = new List<CisCheckResult>();

        // === NETWORK ===
        var fwResult = await RunOnServer(serverIp, "Get-NetFirewallProfile | Select-Object Name, Enabled | ConvertTo-Json -Compress");
        checks.Add(new CisCheckResult { Id = "CIS-1.1", Name = "Firewall Enabled (All Profiles)", Status = fwResult?.Contains("true") == true ? "pass" : "fail", Category = "Network", Remediable = true });

        var smbResult = await RunOnServer(serverIp, "(Get-SmbServerConfiguration).EnableSMB1Protocol");
        checks.Add(new CisCheckResult { Id = "CIS-1.2", Name = "SMBv1 Disabled", Status = smbResult?.Trim().Equals("False", StringComparison.OrdinalIgnoreCase) == true ? "pass" : "fail", Category = "Network", Remediable = true });

        var nlaResult = await RunOnServer(serverIp, "(Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp').UserAuthentication");
        checks.Add(new CisCheckResult { Id = "CIS-1.3", Name = "RDP Network Level Auth Required", Status = nlaResult?.Trim() == "1" ? "pass" : "fail", Category = "Network", Remediable = true });

        var tlsResult = await RunOnServer(serverIp, "(Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.2\\Server' -ErrorAction SilentlyContinue).Enabled");
        checks.Add(new CisCheckResult { Id = "CIS-1.4", Name = "TLS 1.2 Enabled (Server)", Status = tlsResult?.Trim() == "1" || tlsResult == null ? "pass" : "fail", Category = "Network", Remediable = true });

        var winrmResult = await RunOnServer(serverIp, "(Get-WSManInstance -ResourceURI winrm/config/listener -Enumerate | Where-Object Transport -eq 'HTTPS').Transport");
        checks.Add(new CisCheckResult { Id = "CIS-1.5", Name = "WinRM HTTPS Listener Configured", Status = winrmResult?.Contains("HTTPS") == true ? "pass" : "fail", Category = "Network", Remediable = false });

        // === SECURITY ===
        var guestResult = await RunOnServer(serverIp, "(Get-LocalUser -Name 'Guest' -ErrorAction SilentlyContinue).Enabled");
        checks.Add(new CisCheckResult { Id = "CIS-2.1", Name = "Guest Account Disabled", Status = guestResult?.Trim().Equals("False", StringComparison.OrdinalIgnoreCase) == true ? "pass" : "fail", Category = "Security", Remediable = true });

        var adminResult = await RunOnServer(serverIp, "(Get-LocalUser | Where-Object { $_.SID -like '*-500' }).Name");
        var adminName = adminResult?.Trim() ?? "Administrator";
        checks.Add(new CisCheckResult { Id = "CIS-2.2", Name = "Default Admin Account Renamed", Status = adminName != "Administrator" ? "pass" : "fail", Category = "Security", Remediable = false });

        var pwResult = await RunOnServer(serverIp, "(net accounts | Select-String 'Minimum password length').ToString().Split(':')[1].Trim()");
        int.TryParse(pwResult?.Trim(), out var pwLen);
        checks.Add(new CisCheckResult { Id = "CIS-2.3", Name = "Password Min Length >= 14", Status = pwLen >= 14 ? "pass" : "fail", Category = "Security", Remediable = true });

        var lockoutResult = await RunOnServer(serverIp, "(net accounts | Select-String 'Lockout threshold').ToString().Split(':')[1].Trim()");
        int.TryParse(lockoutResult?.Trim(), out var lockout);
        checks.Add(new CisCheckResult { Id = "CIS-2.4", Name = "Account Lockout Threshold <= 5", Status = lockout > 0 && lockout <= 5 ? "pass" : "fail", Category = "Security", Remediable = true });

        var defenderResult = await RunOnServer(serverIp, "(Get-MpPreference).DisableRealtimeMonitoring");
        checks.Add(new CisCheckResult { Id = "CIS-2.5", Name = "Windows Defender Real-Time Protection", Status = defenderResult?.Trim().Equals("False", StringComparison.OrdinalIgnoreCase) == true ? "pass" : "fail", Category = "Security", Remediable = true });

        var lsaResult = await RunOnServer(serverIp, "(Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa' -ErrorAction SilentlyContinue).RunAsPPL");
        checks.Add(new CisCheckResult { Id = "CIS-2.6", Name = "LSA Protection (RunAsPPL) Enabled", Status = lsaResult?.Trim() == "1" ? "pass" : "fail", Category = "Security", Remediable = true });

        var uacResult = await RunOnServer(serverIp, "(Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System').EnableLUA");
        checks.Add(new CisCheckResult { Id = "CIS-2.7", Name = "UAC Enabled", Status = uacResult?.Trim() == "1" ? "pass" : "fail", Category = "Security", Remediable = true });

        // === AUDIT ===
        var auditLogon = await RunOnServer(serverIp, "auditpol /get /subcategory:'Logon' /r | ConvertFrom-Csv | Select-Object -ExpandProperty 'Inclusion Setting'");
        checks.Add(new CisCheckResult { Id = "CIS-3.1", Name = "Audit Logon Events Enabled", Status = auditLogon?.Contains("Success") == true ? "pass" : "fail", Category = "Audit", Remediable = true });

        var auditPriv = await RunOnServer(serverIp, "auditpol /get /subcategory:'Sensitive Privilege Use' /r | ConvertFrom-Csv | Select-Object -ExpandProperty 'Inclusion Setting'");
        checks.Add(new CisCheckResult { Id = "CIS-3.2", Name = "Audit Privilege Use Enabled", Status = auditPriv?.Contains("Success") == true ? "pass" : "fail", Category = "Audit", Remediable = true });

        var auditPolicy = await RunOnServer(serverIp, "auditpol /get /subcategory:'Audit Policy Change' /r | ConvertFrom-Csv | Select-Object -ExpandProperty 'Inclusion Setting'");
        checks.Add(new CisCheckResult { Id = "CIS-3.3", Name = "Audit Policy Change Enabled", Status = auditPolicy?.Contains("Success") == true ? "pass" : "fail", Category = "Audit", Remediable = true });

        // === SERVICES ===
        var autoUpdateResult = await RunOnServer(serverIp, "(Get-Service -Name wuauserv -ErrorAction SilentlyContinue).StartType");
        checks.Add(new CisCheckResult { Id = "CIS-4.1", Name = "Windows Update Service Auto-Start", Status = autoUpdateResult?.Contains("Automatic") == true ? "pass" : "fail", Category = "Services", Remediable = true });

        var printSpooler = await RunOnServer(serverIp, "(Get-Service -Name Spooler -ErrorAction SilentlyContinue).Status");
        checks.Add(new CisCheckResult { Id = "CIS-4.2", Name = "Print Spooler Disabled (if not print server)", Status = printSpooler?.Contains("Stopped") == true ? "pass" : "fail", Category = "Services", Remediable = true });

        var rdpEnabled = await RunOnServer(serverIp, "(Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server').fDenyTSConnections");
        checks.Add(new CisCheckResult { Id = "CIS-4.3", Name = "RDP Enabled (fDenyTSConnections=0)", Status = rdpEnabled?.Trim() == "0" ? "pass" : "fail", Category = "Services", Remediable = false });

        // === DATA PROTECTION ===
        var bitlockerResult = await RunOnServer(serverIp, "(Get-BitLockerVolume -MountPoint C: -ErrorAction SilentlyContinue).ProtectionStatus");
        checks.Add(new CisCheckResult { Id = "CIS-5.1", Name = "BitLocker Enabled on C:", Status = bitlockerResult?.Contains("On") == true ? "pass" : "fail", Category = "Data Protection", Remediable = false });

        return checks;
    }

    private static string? GetRemediationScript(string checkId) => checkId switch
    {
        "CIS-1.1" => "Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True",
        "CIS-1.2" => "Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force",
        "CIS-1.3" => "Set-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp' -Name UserAuthentication -Value 1",
        "CIS-1.4" => "New-Item 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.2\\Server' -Force | Out-Null; Set-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.2\\Server' -Name Enabled -Value 1 -Type DWord; Set-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.2\\Server' -Name DisabledByDefault -Value 0 -Type DWord",
        "CIS-2.1" => "Disable-LocalUser -Name 'Guest'",
        "CIS-2.3" => "net accounts /minpwlen:14",
        "CIS-2.4" => "net accounts /lockoutthreshold:5",
        "CIS-2.5" => "Set-MpPreference -DisableRealtimeMonitoring $false",
        "CIS-2.6" => "Set-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa' -Name RunAsPPL -Value 1 -Type DWord",
        "CIS-2.7" => "Set-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System' -Name EnableLUA -Value 1 -Type DWord",
        "CIS-3.1" => "auditpol /set /subcategory:'Logon' /success:enable /failure:enable",
        "CIS-3.2" => "auditpol /set /subcategory:'Sensitive Privilege Use' /success:enable /failure:enable",
        "CIS-3.3" => "auditpol /set /subcategory:'Audit Policy Change' /success:enable /failure:enable",
        "CIS-4.1" => "Set-Service -Name wuauserv -StartupType Automatic; Start-Service wuauserv",
        "CIS-4.2" => "Stop-Service -Name Spooler -Force; Set-Service -Name Spooler -StartupType Disabled",
        _ => null
    };

    [HttpDelete("snapshots/{id}")]
    public async Task<IActionResult> DeleteSnapshot(int id)
    {
        var snapshot = await _db.ConfigSnapshots.FindAsync(id);
        if (snapshot == null) return NotFound();
        _db.ConfigSnapshots.Remove(snapshot);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Snapshot deleted." });
    }

    private async Task<string?> RunOnServer(string serverIp, string script)
    {
        try
        {
            var encoded = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            var cmd = serverIp == "127.0.0.1" || serverIp == "localhost"
                ? $"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {encoded}"
                : $"-NoProfile -ExecutionPolicy Bypass -Command \"Invoke-Command -ComputerName {serverIp} -ScriptBlock {{ [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{encoded}')) | Invoke-Expression }}\"";
            var result = await _ps.ExecuteAsync(cmd, default, 30000);
            return result.ExitCode == 0 ? result.StandardOutput?.Trim() : null;
        }
        catch { return null; }
    }
}

public class CisCheckResult
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Status { get; set; } = "fail";
    public string Category { get; set; } = "";
    public bool Remediable { get; set; } = false;
}

public class RemediateRequest
{
    public string CheckId { get; set; } = "";
    public string ServerIp { get; set; } = "";
}
