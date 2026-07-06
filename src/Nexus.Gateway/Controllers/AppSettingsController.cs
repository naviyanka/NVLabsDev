using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
            settings = new AppSetting { Id = "global" };
            _db.AppSettings.Add(settings);
            await _db.SaveChangesAsync();
        }
        return Ok(settings);
    }

    [HttpPatch]
    public async Task<ActionResult<AppSetting>> Update(AppSetting updates)
    {
        var settings = await _db.AppSettings.FirstOrDefaultAsync(s => s.Id == "global");
        if (settings == null)
        {
            settings = new AppSetting { Id = "global" };
            _db.AppSettings.Add(settings);
        }

        // Apply updates
        settings.Language = updates.Language ?? settings.Language;
        settings.DefaultLandingPage = updates.DefaultLandingPage ?? settings.DefaultLandingPage;
        if (updates.AutoRefreshInterval > 0) settings.AutoRefreshInterval = updates.AutoRefreshInterval;
        
        settings.Theme = updates.Theme ?? settings.Theme;
        settings.UiDensity = updates.UiDensity ?? settings.UiDensity;
        settings.AnimationsEnabled = updates.AnimationsEnabled;
        
        if (updates.AdSyncInterval > 0) settings.AdSyncInterval = updates.AdSyncInterval;
        if (updates.SessionTimeout > 0) settings.SessionTimeout = updates.SessionTimeout;
        settings.MfaRequired = updates.MfaRequired;
        
        if (updates.CpuAlertThreshold > 0) settings.CpuAlertThreshold = updates.CpuAlertThreshold;
        if (updates.RamAlertThreshold > 0) settings.RamAlertThreshold = updates.RamAlertThreshold;
        settings.NotificationEmail = updates.NotificationEmail ?? settings.NotificationEmail;
        settings.WebhookUrl = updates.WebhookUrl ?? settings.WebhookUrl;
        
        if (updates.TelemetryRetentionDays > 0) settings.TelemetryRetentionDays = updates.TelemetryRetentionDays;
        settings.LogLevel = updates.LogLevel ?? settings.LogLevel;
        
        settings.PluginCategories = updates.PluginCategories ?? settings.PluginCategories;
        settings.TerminalTheme = updates.TerminalTheme ?? settings.TerminalTheme;
        settings.DashboardLayout = updates.DashboardLayout ?? settings.DashboardLayout;
        settings.AppName = updates.AppName ?? settings.AppName;
        settings.AppSubtitle = updates.AppSubtitle ?? settings.AppSubtitle;

        await _db.SaveChangesAsync();
        return Ok(settings);
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
