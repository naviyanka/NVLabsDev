using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Hubs;

namespace Nexus.Gateway.Services;

/// <summary>
/// Background service that reads latest telemetry from NexusContext PerfSamples table
/// and broadcasts to server-specific SignalR groups every 2 seconds.
/// </summary>
public class PerformanceStreamService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<PerformanceStreamService> _logger;

    public PerformanceStreamService(
        IServiceScopeFactory scopeFactory,
        IHubContext<NotificationHub> hubContext,
        ILogger<PerformanceStreamService> logger)
    {
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();
        _logger.LogInformation("PerformanceStreamService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<NexusContext>();

                // Get the latest PerfSample per server (within last 5 seconds)
                var cutoff = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - 5000;

                var latestSamples = await db.PerfSamples
                    .Where(s => s.T >= cutoff)
                    .GroupBy(s => s.ServerIp)
                    .Select(g => g.OrderByDescending(s => s.T).First())
                    .ToListAsync(stoppingToken);

                foreach (var sample in latestSamples)
                {
                    var groupName = $"server:{sample.ServerIp}";
                    var payload = new
                    {
                        timestamp = sample.T.ToString(),
                        cpu = sample.Cpu,
                        mem = sample.Mem,
                        diskR = sample.DiskR,
                        diskW = sample.DiskW,
                        disk = sample.DiskR + sample.DiskW,
                        netIn = sample.NetIn,
                        netOut = sample.NetOut,
                    };

                    await _hubContext.Clients.Group(groupName)
                        .SendAsync("ReceivePerformanceData", payload, stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting performance data");
            }

            await Task.Delay(2000, stoppingToken);
        }

        _logger.LogInformation("PerformanceStreamService stopped.");
    }
}
