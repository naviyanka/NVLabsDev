using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.BackgroundServices;

/// <summary>
/// Periodically calculates rolling baselines from telemetry history and detects
/// statistical anomalies (values exceeding 2 standard deviations above the mean).
/// </summary>
public class AnomalyDetectionService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AnomalyDetectionService> _logger;

    public AnomalyDetectionService(IServiceProvider serviceProvider, ILogger<AnomalyDetectionService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait for startup + initial telemetry collection
        await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<NexusContext>();
                var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

                var servers = await db.Servers.Where(s => s.Status != "offline").ToListAsync(stoppingToken);
                var cutoff = DateTime.UtcNow.AddDays(-7);

                foreach (var server in servers)
                {
                    if (server.MaintenanceMode) continue;

                    var history = await db.TelemetryHistory
                        .Where(h => h.ServerIp == server.Ip && h.Timestamp >= cutoff)
                        .ToListAsync(stoppingToken);

                    if (history.Count < 30) continue; // Need minimum data points

                    await EvaluateMetric(db, notificationService, server, history, "cpu", h => h.Cpu, server.Cpu, stoppingToken);
                    await EvaluateMetric(db, notificationService, server, history, "ram", h => h.Mem, server.Mem, stoppingToken);
                    await EvaluateMetric(db, notificationService, server, history, "disk", h => h.Disk, server.Disk, stoppingToken);
                }

                await db.SaveChangesAsync(stoppingToken);
            }
            catch (TaskCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Anomaly detection cycle failed.");
            }

            // Run every 5 minutes
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }

    private async Task EvaluateMetric(
        NexusContext db,
        NotificationService notificationService,
        Server server,
        List<TelemetryHistory> history,
        string metric,
        Func<TelemetryHistory, double> selector,
        double currentValue,
        CancellationToken ct)
    {
        var values = history.Select(selector).ToList();
        var mean = values.Average();
        var stdDev = Math.Sqrt(values.Select(v => Math.Pow(v - mean, 2)).Average());

        // Persist baseline
        var existing = await db.ServerBaselines
            .FirstOrDefaultAsync(b => b.ServerIp == server.Ip && b.Metric == metric, ct);

        if (existing != null)
        {
            existing.Mean = Math.Round(mean, 2);
            existing.StdDev = Math.Round(stdDev, 2);
            existing.CalculatedAt = DateTime.UtcNow;
        }
        else
        {
            db.ServerBaselines.Add(new ServerBaseline
            {
                ServerIp = server.Ip,
                Metric = metric,
                Mean = Math.Round(mean, 2),
                StdDev = Math.Round(stdDev, 2),
                CalculatedAt = DateTime.UtcNow
            });
        }

        // Anomaly detection: current value > mean + 2*stdDev (and stdDev is meaningful)
        if (stdDev > 1.0 && currentValue > mean + (2 * stdDev))
        {
            var deviations = Math.Round((currentValue - mean) / stdDev, 1);
            var msg = $"Anomaly: {metric.ToUpper()} on {server.Name} is {currentValue:F1}% ({deviations} sigma above {mean:F1}% baseline)";
            _logger.LogInformation(msg);

            // Only fire if we haven't alerted for this server+metric in the last 30 minutes
            var recentAlert = await db.Notifications
                .AnyAsync(n => n.ServerIp == server.Ip
                    && n.Message.Contains($"Anomaly: {metric.ToUpper()}")
                    && n.Timestamp > DateTime.UtcNow.AddMinutes(-30), ct);

            if (!recentAlert)
            {
                await notificationService.AddAndBroadcastNotificationAsync("Warning", msg, server.Ip);
            }
        }
    }
}
