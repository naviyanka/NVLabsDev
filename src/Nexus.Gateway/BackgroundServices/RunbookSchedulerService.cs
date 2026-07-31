using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.BackgroundServices;

public class RunbookSchedulerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RunbookSchedulerService> _logger;

    public RunbookSchedulerService(IServiceProvider serviceProvider, ILogger<RunbookSchedulerService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait for app startup
        await Task.Delay(5000, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<NexusContext>();
                var ps = scope.ServiceProvider.GetRequiredService<IPowerShellExecutionService>();
                var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

                var runbooks = await db.Runbooks.Where(r => r.Enabled).ToListAsync(stoppingToken);
                var now = DateTime.UtcNow;

                foreach (var runbook in runbooks)
                {
                    if (string.IsNullOrWhiteSpace(runbook.CronExpression)) continue;

                    if (!IsDue(runbook.CronExpression, now, runbook.LastRunAt))
                        continue;

                    _logger.LogInformation("Runbook '{Name}' is due. Executing...", runbook.Name);
                    runbook.LastRunAt = now;
                    runbook.LastRunStatus = "Running";

                    var servers = await ResolveTargetServers(db, runbook.TargetServers, stoppingToken);

                    foreach (var serverIp in servers)
                    {
                        var execution = new RunbookExecution
                        {
                            RunbookId = runbook.Id,
                            RunbookName = runbook.Name,
                            ServerIp = serverIp,
                            StartedAt = DateTime.UtcNow,
                            Status = "Running"
                        };
                        db.RunbookExecutions.Add(execution);
                        await db.SaveChangesAsync(stoppingToken);

                        try
                        {
                            var encoded = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(runbook.Script));
                            var cmd = serverIp == "127.0.0.1" || serverIp == "localhost"
                                ? $"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {encoded}"
                                : $"-NoProfile -ExecutionPolicy Bypass -Command \"Invoke-Command -ComputerName {serverIp} -ScriptBlock {{ [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{encoded}')) | Invoke-Expression }}\"";

                            var result = await ps.ExecuteAsync(cmd, stoppingToken, 120000);

                            execution.ExitCode = result.ExitCode;
                            execution.Output = string.IsNullOrWhiteSpace(result.StandardOutput) ? result.StandardError : result.StandardOutput;
                            execution.Status = result.ExitCode == 0 ? "Success" : "Failed";
                            execution.CompletedAt = DateTime.UtcNow;

                            runbook.LastRunStatus = execution.Status;
                            runbook.LastRunOutput = execution.Output.Length > 2000 ? execution.Output[..2000] : execution.Output;
                        }
                        catch (Exception ex)
                        {
                            execution.Status = "Failed";
                            execution.Output = ex.Message;
                            execution.ExitCode = -1;
                            execution.CompletedAt = DateTime.UtcNow;
                            runbook.LastRunStatus = "Failed";
                            runbook.LastRunOutput = ex.Message;
                        }

                        await db.SaveChangesAsync(stoppingToken);
                    }

                    // Send notification
                    var statusEmoji = runbook.LastRunStatus == "Success" ? "OK" : "FAIL";
                    await notificationService.AddAndBroadcastNotificationAsync(
                        runbook.LastRunStatus == "Success" ? "Info" : "Warning",
                        $"Runbook '{runbook.Name}' completed: {statusEmoji}",
                        servers.FirstOrDefault() ?? ""
                    );
                }

                await db.SaveChangesAsync(stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Runbook scheduler error. Retrying in 60s.");
            }

            await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
        }
    }

    private static bool IsDue(string cronExpression, DateTime now, DateTime? lastRunAt)
    {
        // Simple cron parser: "minute hour dayOfMonth month dayOfWeek"
        // Supports: *, specific numbers, and basic matching
        var parts = cronExpression.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 5) return false;

        // Don't re-run if already ran this minute
        if (lastRunAt.HasValue && (now - lastRunAt.Value).TotalSeconds < 60)
            return false;

        return MatchesCronField(parts[0], now.Minute) &&
               MatchesCronField(parts[1], now.Hour) &&
               MatchesCronField(parts[2], now.Day) &&
               MatchesCronField(parts[3], now.Month) &&
               MatchesCronField(parts[4], (int)now.DayOfWeek);
    }

    private static bool MatchesCronField(string field, int value)
    {
        if (field == "*") return true;

        // Handle step values: */5
        if (field.StartsWith("*/"))
        {
            if (int.TryParse(field[2..], out var step) && step > 0)
                return value % step == 0;
            return false;
        }

        // Handle comma-separated values: 1,3,5
        if (field.Contains(','))
        {
            return field.Split(',').Any(v => int.TryParse(v.Trim(), out var n) && n == value);
        }

        // Handle range: 1-5
        if (field.Contains('-'))
        {
            var rangeParts = field.Split('-', 2);
            if (int.TryParse(rangeParts[0], out var start) && int.TryParse(rangeParts[1], out var end))
                return value >= start && value <= end;
            return false;
        }

        // Exact match
        return int.TryParse(field, out var exact) && exact == value;
    }

    private static async Task<List<string>> ResolveTargetServers(NexusContext db, string targetServers, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(targetServers) || targetServers == "*")
        {
            var servers = await db.Servers.ToListAsync(ct);
            return servers.Select(s => s.Ip).ToList();
        }

        return targetServers.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
    }
}
