using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly NexusContext _db;

    public ReportsController(NexusContext db)
    {
        _db = db;
    }

    [HttpGet("patch-compliance")]
    public async Task<IActionResult> PatchCompliance([FromQuery] string? group = null)
    {
        var servers = await _db.Servers.ToListAsync();
        if (!string.IsNullOrWhiteSpace(group))
            servers = servers.Where(s => s.Group.Equals(group, StringComparison.OrdinalIgnoreCase)).ToList();

        var updates = await _db.ServerUpdates.ToListAsync();

        var report = servers.Select(s =>
        {
            var serverUpdates = updates.Where(u => u.ServerIp == s.Ip).ToList();
            var total = serverUpdates.Count;
            // Consider all pending updates as "missing"
            return new
            {
                serverName = s.Name,
                serverIp = s.Ip,
                group = s.Group,
                status = s.Status,
                missingPatches = total,
                compliancePercent = total == 0 ? 100.0 : 0.0, // No pending = 100% compliant
                lastScanDate = (DateTime?)null // Would be populated by an update scan feature
            };
        }).OrderByDescending(r => r.missingPatches).ToList();

        return Ok(report);
    }

    [HttpGet("compare")]
    public async Task<IActionResult> Compare([FromQuery] string servers)
    {
        if (string.IsNullOrWhiteSpace(servers))
            return BadRequest(new { message = "Provide comma-separated server IPs via ?servers=ip1,ip2" });

        var ips = servers.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (ips.Length < 2 || ips.Length > 5)
            return BadRequest(new { message = "Provide 2-5 server IPs to compare." });

        var serverList = await _db.Servers.Where(s => ips.Contains(s.Ip)).ToListAsync();
        var roles = await _db.ServerRoles.Where(r => ips.Contains(r.ServerIp)).ToListAsync();

        var comparison = serverList.Select(s =>
        {
            var serverRoles = roles.Where(r => r.ServerIp == s.Ip).Select(r => r.Name).OrderBy(n => n).ToList();
            return new
            {
                name = s.Name,
                ip = s.Ip,
                os = s.Os,
                status = s.Status,
                cpu = s.Cpu,
                mem = s.Mem,
                disk = s.Disk,
                uptime = s.Uptime,
                group = s.Group,
                roles = serverRoles
            };
        }).ToList();

        return Ok(comparison);
    }

    [HttpGet("health")]
    public async Task<IActionResult> FleetHealth()
    {
        var servers = await _db.Servers.ToListAsync();
        var total = servers.Count;
        var online = servers.Count(s => s.Status != "offline");
        var onlinePercent = total > 0 ? Math.Round((double)online / total * 100, 1) : 0;

        var avgCpu = servers.Where(s => s.Status != "offline").Select(s => s.Cpu).DefaultIfEmpty(0).Average();
        var avgMem = servers.Where(s => s.Status != "offline").Select(s => s.Mem).DefaultIfEmpty(0).Average();
        var avgDisk = servers.Where(s => s.Status != "offline").Select(s => s.Disk).DefaultIfEmpty(0).Average();

        var worstCpu = servers.OrderByDescending(s => s.Cpu).Take(5).Select(s => new { s.Name, s.Ip, value = s.Cpu }).ToList();
        var worstMem = servers.OrderByDescending(s => s.Mem).Take(5).Select(s => new { s.Name, s.Ip, value = s.Mem }).ToList();
        var worstDisk = servers.OrderByDescending(s => s.Disk).Take(5).Select(s => new { s.Name, s.Ip, value = s.Disk }).ToList();

        // Alert frequency last 30 days
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
        var recentAlerts = await _db.Notifications
            .Where(n => n.Timestamp >= thirtyDaysAgo)
            .ToListAsync();

        var alertsByDay = recentAlerts
            .GroupBy(n => n.Timestamp.Date)
            .Select(g => new { date = g.Key.ToString("yyyy-MM-dd"), count = g.Count() })
            .OrderBy(x => x.date)
            .ToList();

        return Ok(new
        {
            totalServers = total,
            onlineCount = online,
            onlinePercent,
            avgCpu = Math.Round(avgCpu, 1),
            avgMem = Math.Round(avgMem, 1),
            avgDisk = Math.Round(avgDisk, 1),
            worstCpu,
            worstMem,
            worstDisk,
            alertsByDay
        });
    }
}
