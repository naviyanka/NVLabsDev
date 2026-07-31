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

        var checks = new List<object>();

        // Check 1: Firewall enabled on all profiles
        var fwResult = await RunOnServer(serverIp, "Get-NetFirewallProfile | Select-Object Name, Enabled | ConvertTo-Json -Compress");
        checks.Add(new { id = "CIS-1.1", name = "Firewall Enabled (All Profiles)", status = fwResult?.Contains("true") == true ? "pass" : "fail", category = "Network" });

        // Check 2: SMBv1 disabled
        var smbResult = await RunOnServer(serverIp, "(Get-SmbServerConfiguration).EnableSMB1Protocol");
        checks.Add(new { id = "CIS-2.1", name = "SMBv1 Disabled", status = smbResult?.Trim().Equals("False", StringComparison.OrdinalIgnoreCase) == true ? "pass" : "fail", category = "Network" });

        // Check 3: Remote Desktop NLA required
        var nlaResult = await RunOnServer(serverIp, "(Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp').UserAuthentication");
        checks.Add(new { id = "CIS-3.1", name = "RDP Network Level Auth Required", status = nlaResult?.Trim() == "1" ? "pass" : "fail", category = "Security" });

        // Check 4: Guest account disabled
        var guestResult = await RunOnServer(serverIp, "(Get-LocalUser -Name 'Guest' -ErrorAction SilentlyContinue).Enabled");
        checks.Add(new { id = "CIS-4.1", name = "Guest Account Disabled", status = guestResult?.Trim().Equals("False", StringComparison.OrdinalIgnoreCase) == true ? "pass" : "fail", category = "Security" });

        // Check 5: Admin account renamed
        var adminResult = await RunOnServer(serverIp, "(Get-LocalUser | Where-Object { $_.SID -like '*-500' }).Name");
        var adminName = adminResult?.Trim() ?? "Administrator";
        checks.Add(new { id = "CIS-5.1", name = "Default Admin Account Renamed", status = adminName != "Administrator" ? "pass" : "fail", category = "Security" });

        // Check 6: Password policy minimum length
        var pwResult = await RunOnServer(serverIp, "(net accounts | Select-String 'Minimum password length').ToString().Split(':')[1].Trim()");
        int.TryParse(pwResult?.Trim(), out var pwLen);
        checks.Add(new { id = "CIS-6.1", name = "Password Min Length >= 14", status = pwLen >= 14 ? "pass" : "fail", category = "Security" });

        // Check 7: Audit policy - logon events
        var auditResult = await RunOnServer(serverIp, "auditpol /get /subcategory:'Logon' /r | ConvertFrom-Csv | Select-Object -ExpandProperty 'Inclusion Setting'");
        checks.Add(new { id = "CIS-7.1", name = "Audit Logon Events Enabled", status = auditResult?.Contains("Success") == true ? "pass" : "fail", category = "Audit" });

        // Check 8: Windows Defender real-time protection
        var defenderResult = await RunOnServer(serverIp, "(Get-MpPreference).DisableRealtimeMonitoring");
        checks.Add(new { id = "CIS-8.1", name = "Windows Defender Real-Time Protection", status = defenderResult?.Trim().Equals("False", StringComparison.OrdinalIgnoreCase) == true ? "pass" : "fail", category = "Security" });

        var passed = checks.Count(c => ((dynamic)c).status == "pass");
        var total = checks.Count;
        var score = total > 0 ? Math.Round((double)passed / total * 100, 1) : 0;

        return Ok(new { serverIp, score, passed, total, checks });
    }

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
