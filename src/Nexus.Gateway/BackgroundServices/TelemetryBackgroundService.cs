using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Services;

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

                await db.SaveChangesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Telemetry background sync");
            }

            await Task.Delay(3000, stoppingToken);
        }
    }
}
