using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Nodes;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/settings")]
public class AppSettingsController : ControllerBase
{
    private readonly NexusContext _db;

    public AppSettingsController(NexusContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<AppSetting>> Get()
    {
        var settings = await _db.AppSettings.FirstOrDefaultAsync(s => s.Id == "global");
        if (settings == null)
        {
            settings = new AppSetting { Id = "global", Theme = "horizon", TerminalTheme = "stealth" };
            _db.AppSettings.Add(settings);
            await _db.SaveChangesAsync();
        }
        else if (string.IsNullOrEmpty(settings.Theme) || settings.Theme == "dark")
        {
            settings.Theme = "horizon";
            await _db.SaveChangesAsync();
        }
        return Ok(settings);
    }

    [HttpPatch]
    [HttpPost]
    public async Task<ActionResult<AppSetting>> Update([FromBody] JsonObject updates)
    {
        var settings = await _db.AppSettings.FirstOrDefaultAsync(s => s.Id == "global");
        if (settings == null)
        {
            settings = new AppSetting { Id = "global" };
            _db.AppSettings.Add(settings);
        }

        var getProp = (string name) => {
            if (updates.TryGetPropertyValue(name, out var node)) return node;
            var camelName = char.ToLower(name[0]) + name.Substring(1);
            if (updates.TryGetPropertyValue(camelName, out node)) return node;
            return null;
        };

        // Apply updates dynamically based on what was actually sent
        var node = getProp("Language");
        if (node != null) settings.Language = node.ToString();

        node = getProp("DefaultLandingPage");
        if (node != null) settings.DefaultLandingPage = node.ToString();

        node = getProp("AutoRefreshInterval");
        if (node != null) settings.AutoRefreshInterval = node.GetValue<int>();

        node = getProp("Theme");
        if (node != null) settings.Theme = node.ToString();

        node = getProp("UiDensity");
        if (node != null) settings.UiDensity = node.ToString();

        node = getProp("AnimationsEnabled");
        if (node != null) settings.AnimationsEnabled = node.GetValue<bool>();

        node = getProp("AdSyncInterval");
        if (node != null) settings.AdSyncInterval = node.GetValue<int>();

        node = getProp("AppLoginMethod");
        if (node != null) settings.AppLoginMethod = node.ToString();

        node = getProp("DefaultDomainName");
        if (node != null) settings.DefaultDomainName = node.ToString();

        node = getProp("SessionTimeout");
        if (node != null) settings.SessionTimeout = node.GetValue<int>();

        node = getProp("MfaRequired");
        if (node != null) settings.MfaRequired = node.GetValue<bool>();

        node = getProp("CpuAlertThreshold");
        if (node != null) settings.CpuAlertThreshold = node.GetValue<int>();

        node = getProp("RamAlertThreshold");
        if (node != null) settings.RamAlertThreshold = node.GetValue<int>();

        node = getProp("NotificationEmail");
        if (node != null) settings.NotificationEmail = node.ToString();

        node = getProp("WebhookUrl");
        if (node != null) settings.WebhookUrl = node.ToString();

        node = getProp("DiscordWebhookUrl");
        if (node != null) settings.DiscordWebhookUrl = node.ToString();

        node = getProp("SlackWebhookUrl");
        if (node != null) settings.SlackWebhookUrl = node.ToString();

        node = getProp("TelemetryRetentionDays");
        if (node != null) settings.TelemetryRetentionDays = node.GetValue<int>();

        node = getProp("LogLevel");
        if (node != null) settings.LogLevel = node.ToString();

        node = getProp("PluginCategories");
        if (node != null) settings.PluginCategories = node.ToString();

        node = getProp("TerminalTheme");
        if (node != null) settings.TerminalTheme = node.ToString();

        node = getProp("DashboardLayout");
        if (node != null) settings.DashboardLayout = node.ToString();

        node = getProp("AppName");
        if (node != null) settings.AppName = node.ToString();

        node = getProp("AppSubtitle");
        if (node != null) settings.AppSubtitle = node.ToString();

        node = getProp("AlertQuietHours");
        if (node != null) settings.AlertQuietHours = node.ToString();

        await _db.SaveChangesAsync();
        return Ok(settings);
    }

    [HttpPost("clear-db-cache")]
    public async Task<ActionResult<object>> ClearDbCache()
    {
        int totalCleared = 0;

        var perfCount = await _db.PerfSamples.CountAsync();
        if (perfCount > 0) { _db.PerfSamples.RemoveRange(_db.PerfSamples); totalCleared += perfCount; }

        var procCount = await _db.Processes.CountAsync();
        if (procCount > 0) { _db.Processes.RemoveRange(_db.Processes); totalCleared += procCount; }

        var diskCount = await _db.Disks.CountAsync();
        if (diskCount > 0) { _db.Disks.RemoveRange(_db.Disks); totalCleared += diskCount; }

        var volCount = await _db.Volumes.CountAsync();
        if (volCount > 0) { _db.Volumes.RemoveRange(_db.Volumes); totalCleared += volCount; }

        var telCount = await _db.TelemetryHistory.CountAsync();
        if (telCount > 0) { _db.TelemetryHistory.RemoveRange(_db.TelemetryHistory); totalCleared += telCount; }

        var notifCount = await _db.Notifications.CountAsync();
        if (notifCount > 0) { _db.Notifications.RemoveRange(_db.Notifications); totalCleared += notifCount; }

        var jobCount = await _db.BackgroundJobs.CountAsync();
        if (jobCount > 0) { _db.BackgroundJobs.RemoveRange(_db.BackgroundJobs); totalCleared += jobCount; }

        await _db.SaveChangesAsync();
        return Ok(new { message = $"Database cache cleared. Removed {totalCleared} records.", totalCleared });
    }

    [HttpPost("clear-app-cache")]
    public async Task<ActionResult<object>> ClearAppCache([FromServices] NexusLogContext logDb)
    {
        var logCount = await logDb.LogEntries.CountAsync();
        if (logCount > 0) { logDb.LogEntries.RemoveRange(logDb.LogEntries); }
        await logDb.SaveChangesAsync();

        int totalCleared = logCount;

        var secCount = await _db.SecurityEventLogs.CountAsync();
        if (secCount > 0) { _db.SecurityEventLogs.RemoveRange(_db.SecurityEventLogs); totalCleared += secCount; }

        var snapCount = await _db.SecuritySnapshots.CountAsync();
        if (snapCount > 0) { _db.SecuritySnapshots.RemoveRange(_db.SecuritySnapshots); totalCleared += snapCount; }

        var appCount = await _db.InstalledApps.CountAsync();
        if (appCount > 0) { _db.InstalledApps.RemoveRange(_db.InstalledApps); totalCleared += appCount; }

        var roleCount = await _db.ServerRoles.CountAsync();
        if (roleCount > 0) { _db.ServerRoles.RemoveRange(_db.ServerRoles); totalCleared += roleCount; }

        var updateCount = await _db.ServerUpdates.CountAsync();
        if (updateCount > 0) { _db.ServerUpdates.RemoveRange(_db.ServerUpdates); totalCleared += updateCount; }

        await _db.SaveChangesAsync();
        return Ok(new { message = $"Application cache cleared. Removed {totalCleared} cached records.", totalCleared });
    }

    [HttpGet("logs")]
    public async Task<ActionResult<object>> GetLogs([FromServices] NexusLogContext logDb)
    {
        var setting = await logDb.LogSettings.FirstOrDefaultAsync(s => s.Id == "global");
        var enabled = setting?.EnableBackendLogs ?? true;

        var entries = await logDb.LogEntries
            .OrderByDescending(e => e.Timestamp)
            .Take(1000)
            .ToListAsync();

        var lines = entries.OrderBy(e => e.Timestamp)
            .Select(e => $"[{e.Timestamp:HH:mm:ss}] [{e.LogLevel}] [{e.Category}] {e.Message}")
            .ToList();

        return Ok(new { enabled, logs = lines });
    }

    [HttpPost("logs/toggle")]
    public async Task<ActionResult<object>> ToggleLogs([FromServices] NexusLogContext logDb)
    {
        var setting = await logDb.LogSettings.FirstOrDefaultAsync(s => s.Id == "global");
        if (setting == null)
        {
            setting = new LogSetting { Id = "global", EnableBackendLogs = true };
            logDb.LogSettings.Add(setting);
        }
        setting.EnableBackendLogs = !setting.EnableBackendLogs;
        await logDb.SaveChangesAsync();

        return Ok(new { enabled = setting.EnableBackendLogs });
    }
}
