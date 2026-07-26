using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Models;
using Nexus.Gateway.Data;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Text.Json;
using System.Text;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{ip}/[controller]")]
public class SecurityController : ControllerBase
{
    private readonly NexusContext _db;
    private readonly ILogger<SecurityController> _logger;
    private readonly IPowerShellExecutionService _ps;

    public SecurityController(NexusContext db, ILogger<SecurityController> logger, IPowerShellExecutionService ps)
    {
        _db = db;
        _logger = logger;
        _ps = ps;
    }

    [HttpGet]
    public async Task<ActionResult<SecurityDashboardDto>> GetSecurity(string ip, [FromQuery] bool refresh = false)
    {
        try
        {
            if (!refresh)
            {
                var cachedSnapshot = await _db.SecuritySnapshots.FindAsync(ip);
                if (cachedSnapshot != null)
                {
                    var cachedEvents = await _db.SecurityEventLogs
                        .Where(e => e.ServerIp == ip)
                        .OrderByDescending(e => e.TimeCreated)
                        .Take(20)
                        .ToListAsync();

                    return Ok(new SecurityDashboardDto
                    {
                        Events = cachedEvents,
                        OpenPorts = JsonSerializer.Deserialize<List<OpenPortDto>>(cachedSnapshot.OpenPortsJson) ?? new List<OpenPortDto>(),
                        LocalAdmins = JsonSerializer.Deserialize<List<LocalAdminDto>>(cachedSnapshot.LocalAdminsJson) ?? new List<LocalAdminDto>(),
                        FailedLogins24h = cachedSnapshot.FailedLogins24h,
                        LastUpdated = cachedSnapshot.LastUpdated
                    });
                }
            }

            // Perform refresh
            var script = @"
$ErrorActionPreference = 'SilentlyContinue'
$events = Get-WinEvent -LogName Security -MaxEvents 20 | Select-Object TimeCreated, Id, LevelDisplayName, Message, RecordId
$ports = Get-NetTCPConnection -State Listen | Select-Object LocalPort, OwningProcess, State
$admins = Get-LocalGroupMember -Group Administrators | Select-Object Name, PrincipalSource
$failed = (Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625; StartTime=(Get-Date).AddHours(-24)}).Count
if ($null -eq $failed) { $failed = 0 }
@{
    Events = @($events | ForEach-Object { @{ TimeCreated=$_.TimeCreated; Id=$_.Id; Level=$_.LevelDisplayName; Message=$_.Message; RecordId=$_.RecordId } })
    Ports = @($ports | ForEach-Object {
        $pname = ''
        if ($_.OwningProcess -gt 0) {
            $p = Get-Process -Id $_.OwningProcess
            if ($p) { $pname = $p.ProcessName }
        }
        @{ LocalPort=$_.LocalPort; OwningProcess=$pname; State=$_.State }
    })
    Admins = @($admins | ForEach-Object { @{ Name=$_.Name; PrincipalSource=$_.PrincipalSource; Expected=($_.Name -match 'Administrator|Domain Admins|nexus') } })
    FailedLogins24h = $failed
} | ConvertTo-Json -Depth 5 -Compress
";
            
            var base64 = Convert.ToBase64String(Encoding.Unicode.GetBytes($"Invoke-Command -ComputerName {ip} -ScriptBlock {{{script}}}"));
            
            var result = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {base64}", HttpContext.RequestAborted);
            var output = result.StandardOutput;

            using var doc = JsonDocument.Parse(output);
            var root = doc.RootElement;

            var events = new List<SecurityEventLog>();
            foreach (var e in root.GetProperty("Events").EnumerateArray())
            {
                events.Add(new SecurityEventLog
                {
                    ServerIp = ip,
                    EventId = e.GetProperty("Id").GetInt32(),
                    Level = e.GetProperty("Level").GetString() ?? "",
                    TimeCreated = e.GetProperty("TimeCreated").GetDateTime(),
                    Message = e.GetProperty("Message").GetString() ?? "",
                    RecordId = e.GetProperty("RecordId").GetInt64()
                });
            }

            var ports = new List<OpenPortDto>();
            foreach (var p in root.GetProperty("Ports").EnumerateArray())
            {
                ports.Add(new OpenPortDto
                {
                    LocalPort = p.GetProperty("LocalPort").GetInt32(),
                    ProcessName = p.GetProperty("OwningProcess").GetString() ?? "",
                    State = p.GetProperty("State").GetProperty("ToString").GetString() ?? "Listen" // PowerShell enums serialize weirdly
                });
            }

            var admins = new List<LocalAdminDto>();
            foreach (var a in root.GetProperty("Admins").EnumerateArray())
            {
                admins.Add(new LocalAdminDto
                {
                    Name = a.GetProperty("Name").GetString() ?? "",
                    PrincipalSource = a.GetProperty("PrincipalSource").GetString() ?? "",
                    Expected = a.GetProperty("Expected").GetBoolean()
                });
            }

            var failed24h = root.GetProperty("FailedLogins24h").GetInt32();

            // Update DB
            var snapshot = await _db.SecuritySnapshots.FindAsync(ip);
            if (snapshot == null)
            {
                snapshot = new SecuritySnapshot { ServerIp = ip };
                _db.SecuritySnapshots.Add(snapshot);
            }
            snapshot.OpenPortsJson = JsonSerializer.Serialize(ports);
            snapshot.LocalAdminsJson = JsonSerializer.Serialize(admins);
            snapshot.FailedLogins24h = failed24h;
            snapshot.LastUpdated = DateTime.UtcNow;

            // Merge events (avoid duplicates based on RecordId)
            var existingRecordIds = await _db.SecurityEventLogs
                .Where(e => e.ServerIp == ip)
                .Select(e => e.RecordId)
                .ToListAsync();

            var newEvents = events.Where(e => !existingRecordIds.Contains(e.RecordId)).ToList();
            if (newEvents.Any())
            {
                _db.SecurityEventLogs.AddRange(newEvents);
            }

            // Prune events older than 7 days
            var cutoff = DateTime.UtcNow.AddDays(-7);
            var oldEvents = await _db.SecurityEventLogs
                .Where(e => e.TimeCreated < cutoff)
                .ToListAsync();
            
            if (oldEvents.Any())
            {
                _db.SecurityEventLogs.RemoveRange(oldEvents);
            }

            await _db.SaveChangesAsync();

            return Ok(new SecurityDashboardDto
            {
                Events = events,
                OpenPorts = ports,
                LocalAdmins = admins,
                FailedLogins24h = failed24h,
                LastUpdated = snapshot.LastUpdated
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get security info for {ip}", ip);
            return StatusCode(500, "Internal server error: " + ex.Message);
        }
    }
}
