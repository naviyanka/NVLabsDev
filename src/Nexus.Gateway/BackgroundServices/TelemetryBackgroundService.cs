using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Services;
using Nexus.Gateway.Models;

namespace Nexus.Gateway.BackgroundServices;

public class TelemetryBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly CimService _cimService;
    private readonly ILogger<TelemetryBackgroundService> _logger;

    public TelemetryBackgroundService(IServiceProvider serviceProvider, CimService cimService, ILogger<TelemetryBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _cimService = cimService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var ctx = scope.ServiceProvider.GetRequiredService<NexusContext>();
            ctx.Database.EnsureCreated();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Telemetry background service database initialization bypassed.");
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<NexusContext>();
                
                var servers = await db.Servers.ToListAsync();

                foreach (var server in servers)
                {
                    await _cimService.UpdateServerStatusAsync(server);
                    db.Servers.Update(server);

                    if (server.Status != "offline")
                    {
                        var metrics = await _cimService.GetRealtimeMetricsAsync(server.Ip);
                        if (metrics.Length > 0)
                        {
                            var m = metrics[0];
                            m.ServerIp = server.Ip;
                            db.PerfSamples.Add(m);

                            // Persist for history charts (one sample per poll cycle per server)
                            db.TelemetryHistory.Add(new TelemetryHistory
                            {
                                ServerIp = server.Ip,
                                Cpu = server.Cpu,
                                Mem = server.Mem,
                                Disk = server.Disk,
                                Timestamp = DateTime.UtcNow
                            });
                        }

                        var procs = await _cimService.GetProcessesAsync(server.Ip);
                        var existingProcs = await db.Processes.Where(p => p.ServerIp == server.Ip).ToListAsync();
                        db.Processes.RemoveRange(existingProcs);
                        
                        foreach (var p in procs)
                        {
                            p.ServerIp = server.Ip;
                            db.Processes.Add(p);
                        }
                    }
                }
                
                var cutoff = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - 300000;
                var oldSamples = await db.PerfSamples.Where(s => s.T < cutoff).ToListAsync();
                db.PerfSamples.RemoveRange(oldSamples);

                // Purge old telemetry history based on retention setting
                var setting = await db.AppSettings.FirstOrDefaultAsync(s => s.Id == "global");
                var retentionDays = setting?.TelemetryRetentionDays ?? 7;
                var historyCutoff = DateTime.UtcNow.AddDays(-retentionDays);
                var oldHistory = await db.TelemetryHistory.Where(h => h.Timestamp < historyCutoff).ToListAsync();
                if (oldHistory.Count > 0) db.TelemetryHistory.RemoveRange(oldHistory);

                await db.SaveChangesAsync(stoppingToken);

                // ─── Alert Rules Evaluation ───
                await EvaluateAlertRules(db, servers, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Telemetry background sync");
            }

            await Task.Delay(3000, stoppingToken);
        }
    }

    private async Task EvaluateAlertRules(NexusContext db, List<Server> servers, CancellationToken ct)
    {
        var rules = await db.AlertRules.Where(r => r.Enabled).ToListAsync(ct);
        if (rules.Count == 0) return;

        // Check if we're inside Alert Quiet Hours — if so, skip all alert evaluation
        var setting = await db.AppSettings.FirstOrDefaultAsync(s => s.Id == "global", ct);
        if (setting != null && !string.IsNullOrWhiteSpace(setting.AlertQuietHours) && IsInsideQuietHours(setting.AlertQuietHours))
        {
            return;
        }

        var now = DateTime.UtcNow;
        using var alertScope = _serviceProvider.CreateScope();
        var notificationService = alertScope.ServiceProvider.GetRequiredService<NotificationService>();

        foreach (var rule in rules)
        {
            // Cooldown: don't re-fire within DurationSeconds
            if (rule.LastFiredAt.HasValue && (now - rule.LastFiredAt.Value).TotalSeconds < rule.DurationSeconds)
                continue;

            var targets = rule.ServerIp == "*" ? servers : servers.Where(s => s.Ip == rule.ServerIp).ToList();

            foreach (var srv in targets)
            {
                // Skip servers in maintenance mode
                if (srv.MaintenanceMode) continue;

                double value = rule.Metric switch
                {
                    "cpu" => srv.Cpu,
                    "ram" => srv.Mem,
                    "disk" => srv.Disk,
                    _ => 0
                };

                bool triggered = rule.Comparison switch
                {
                    "gt" => value > rule.Threshold,
                    "lt" => value < rule.Threshold,
                    "eq" => Math.Abs(value - rule.Threshold) < 0.5,
                    _ => false
                };

                if (triggered)
                {
                    rule.LastFiredAt = now;
                    var msg = $"Alert '{rule.Name}': {rule.Metric.ToUpper()} is {value:F1}% on {srv.Name} ({rule.Comparison} {rule.Threshold}%)";
                    await notificationService.AddAndBroadcastNotificationAsync("Warning", msg, srv.Ip);

                    // Webhook dispatch
                    await DispatchWebhook(db, rule, msg);
                }
            }
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task DispatchWebhook(NexusContext db, AlertRule rule, string message)
    {
        if (rule.Channel == "notification") return; // already handled via NotificationService

        var settings = await db.AppSettings.FirstOrDefaultAsync(s => s.Id == "global");
        if (settings == null) return;

        string? url = rule.Channel switch
        {
            "discord" => settings.DiscordWebhookUrl,
            "slack" => settings.SlackWebhookUrl,
            "webhook" => settings.WebhookUrl,
            _ => null
        };

        if (string.IsNullOrWhiteSpace(url)) return;

        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            var body = rule.Channel == "discord"
                ? System.Text.Json.JsonSerializer.Serialize(new { content = $"⚠️ {message}" })
                : System.Text.Json.JsonSerializer.Serialize(new { text = $"⚠️ {message}" });

            await client.PostAsync(url, new StringContent(body, System.Text.Encoding.UTF8, "application/json"));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to dispatch alert webhook to {Channel}", rule.Channel);
        }
    }

    private static bool IsInsideQuietHours(string quietHours)
    {
        // Format: "HH:mm-HH:mm" e.g. "22:00-06:00" (10 PM to 6 AM UTC)
        var parts = quietHours.Split('-', 2);
        if (parts.Length != 2) return false;

        if (!TimeSpan.TryParse(parts[0].Trim(), out var start) || !TimeSpan.TryParse(parts[1].Trim(), out var end))
            return false;

        var now = DateTime.UtcNow.TimeOfDay;

        if (start <= end)
        {
            // Same-day window: e.g. "02:00-06:00"
            return now >= start && now <= end;
        }
        else
        {
            // Overnight window: e.g. "22:00-06:00"
            return now >= start || now <= end;
        }
    }
}
