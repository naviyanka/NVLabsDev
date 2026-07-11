using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.BackgroundServices;

public class AdSyncBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AdSyncBackgroundService> _logger;

    public AdSyncBackgroundService(IServiceProvider serviceProvider, ILogger<AdSyncBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<NexusContext>();
                var adService = scope.ServiceProvider.GetRequiredService<ActiveDirectoryService>();
                var cimService = scope.ServiceProvider.GetRequiredService<CimService>();

                var setting = await db.AppSettings.FirstOrDefaultAsync(cancellationToken: stoppingToken);
                int intervalMinutes = setting?.AdSyncInterval > 0 ? setting.AdSyncInterval : 60;

                _logger.LogInformation("Starting background AD computer sync.");

                var adServers = await adService.GetDomainComputersAsync();
                
                foreach (var adServer in adServers)
                {
                    var existing = await db.Servers.FirstOrDefaultAsync(s => s.Id == adServer.Id, cancellationToken: stoppingToken);
                    if (existing == null)
                    {
                        adServer.IsAdFetched = true;
                        db.Servers.Add(adServer);
                        _ = Task.Run(() => cimService.EnableWinRmAsync(adServer.Ip), stoppingToken);
                    }
                    else
                    {
                        if (existing.IsAdFetched && existing.Ip != adServer.Ip && adServer.Ip != adServer.Name)
                        {
                            existing.Ip = adServer.Ip;
                        }
                    }
                }
                await db.SaveChangesAsync(stoppingToken);

                _logger.LogInformation("Finished background AD computer sync. Sleeping for {Interval} minutes.", intervalMinutes);
                await Task.Delay(TimeSpan.FromMinutes(intervalMinutes), stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during background AD sync. Retrying in 15 minutes.");
                await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
            }
        }
    }
}
