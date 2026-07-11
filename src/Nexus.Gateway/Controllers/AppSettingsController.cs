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
            settings = new AppSetting { Id = "global" };
            _db.AppSettings.Add(settings);
            await _db.SaveChangesAsync();
        }
        return Ok(settings);
    }

    [HttpPatch]
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
