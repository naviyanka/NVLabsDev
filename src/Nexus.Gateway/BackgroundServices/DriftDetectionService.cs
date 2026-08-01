using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.BackgroundServices;

/// <summary>
/// Runs daily, captures a fresh config snapshot for each server that has a baseline,
/// and fires a notification if drift is detected.
/// </summary>
public class DriftDetectionService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DriftDetectionService> _logger;

    public DriftDetectionService(IServiceProvider serviceProvider, ILogger<DriftDetectionService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait for startup
        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<NexusContext>();
                var ps = scope.ServiceProvider.GetRequiredService<IPowerShellExecutionService>();
                var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

                // Find all servers that have a baseline snapshot
                var baselines = await db.ConfigSnapshots
                    .Where(s => s.IsBaseline)
                    .ToListAsync(stoppingToken);

                if (baselines.Count == 0)
                {
                    _logger.LogDebug("No baseline snapshots configured. Drift detection skipped.");
                    await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
                    continue;
                }

                _logger.LogInformation("Starting daily drift detection for {Count} server(s).", baselines.Count);

                foreach (var baseline in baselines)
                {
                    var server = await db.Servers.FirstOrDefaultAsync(s => s.Ip == baseline.ServerIp, stoppingToken);
                    if (server == null || server.Status == "offline" || server.MaintenanceMode) continue;

                    try
                    {
                        // Capture fresh snapshot
                        var rolesJson = await RunOnServer(ps, baseline.ServerIp, "Get-WindowsFeature | Where-Object Installed | Select-Object Name, DisplayName | ConvertTo-Json -Compress") ?? "[]";
                        var servicesJson = await RunOnServer(ps, baseline.ServerIp, "Get-Service | Select-Object Name, Status, StartType | ConvertTo-Json -Compress") ?? "[]";
                        var usersJson = await RunOnServer(ps, baseline.ServerIp, "Get-LocalUser | Select-Object Name, Enabled | ConvertTo-Json -Compress") ?? "[]";
                        var fwJson = await RunOnServer(ps, baseline.ServerIp, "Get-NetFirewallProfile | Select-Object Name, Enabled | ConvertTo-Json -Compress") ?? "[]";

                        // Save as latest snapshot
                        var snapshot = new ConfigSnapshot
                        {
                            ServerIp = baseline.ServerIp,
                            ServerName = server.Name,
                            CapturedAt = DateTime.UtcNow,
                            InstalledRolesJson = rolesJson,
                            ServicesJson = servicesJson,
                            LocalUsersJson = usersJson,
                            FirewallProfileJson = fwJson,
                            IsBaseline = false
                        };
                        db.ConfigSnapshots.Add(snapshot);

                        // Compare against baseline
                        var driftCategories = new List<string>();
                        if (baseline.InstalledRolesJson != rolesJson) driftCategories.Add("Roles");
                        if (baseline.ServicesJson != servicesJson) driftCategories.Add("Services");
                        if (baseline.LocalUsersJson != usersJson) driftCategories.Add("Users");
                        if (baseline.FirewallProfileJson != fwJson) driftCategories.Add("Firewall");

                        if (driftCategories.Count > 0)
                        {
                            var msg = $"Configuration drift detected on {server.Name}: {string.Join(", ", driftCategories)} changed from baseline.";
                            _logger.LogWarning(msg);
                            await notificationService.AddAndBroadcastNotificationAsync("Warning", msg, server.Ip);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug(ex, "Drift check failed for {Server}.", baseline.ServerIp);
                    }
                }

                await db.SaveChangesAsync(stoppingToken);

                // Clean up old non-baseline snapshots (keep last 5 per server)
                var allSnapshots = await db.ConfigSnapshots
                    .Where(s => !s.IsBaseline)
                    .OrderByDescending(s => s.CapturedAt)
                    .ToListAsync(stoppingToken);

                var toDelete = allSnapshots
                    .GroupBy(s => s.ServerIp)
                    .SelectMany(g => g.Skip(5))
                    .ToList();

                if (toDelete.Count > 0)
                {
                    db.ConfigSnapshots.RemoveRange(toDelete);
                    await db.SaveChangesAsync(stoppingToken);
                }

                _logger.LogInformation("Daily drift detection complete.");
            }
            catch (TaskCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Drift detection cycle failed.");
            }

            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    private static async Task<string?> RunOnServer(IPowerShellExecutionService ps, string serverIp, string script)
    {
        try
        {
            var encoded = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            var cmd = serverIp == "127.0.0.1" || serverIp == "localhost"
                ? $"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {encoded}"
                : $"-NoProfile -ExecutionPolicy Bypass -Command \"Invoke-Command -ComputerName {serverIp} -ScriptBlock {{ [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{encoded}')) | Invoke-Expression }}\"";
            var result = await ps.ExecuteAsync(cmd, default, 30000);
            return result.ExitCode == 0 ? result.StandardOutput?.Trim() : null;
        }
        catch { return null; }
    }
}
