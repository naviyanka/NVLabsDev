using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.BackgroundServices;

public class LogPersistenceService : BackgroundService
{
    private readonly IServiceProvider _services;

    public LogPersistenceService(IServiceProvider services)
    {
        _services = services;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<NexusLogContext>();
                
                var setting = await db.LogSettings.FirstOrDefaultAsync(s => s.Id == "global", stoppingToken);
                if (setting == null)
                {
                    setting = new LogSetting { Id = "global", EnableBackendLogs = true };
                    db.LogSettings.Add(setting);
                    await db.SaveChangesAsync(stoppingToken);
                }

                var pending = MemoryLogSink.Instance.DequeuePending();
                if (pending.Any() && setting.EnableBackendLogs)
                {
                    var entities = pending.Select(p => new LogEntry
                    {
                        Timestamp = p.Timestamp,
                        LogLevel = p.LogLevel,
                        Category = p.Category,
                        Message = p.Message
                    });
                    await db.LogEntries.AddRangeAsync(entities, stoppingToken);
                    await db.SaveChangesAsync(stoppingToken);
                }

                // Prune logs older than 3 days in batches to bound memory use
                var cutoff = DateTime.UtcNow.AddDays(-3);
                const int pruneBatchSize = 1000;
                int pruned;
                do
                {
                    var batch = await db.LogEntries
                        .Where(e => e.Timestamp < cutoff)
                        .OrderBy(e => e.Id)
                        .Take(pruneBatchSize)
                        .ToListAsync(stoppingToken);
                    pruned = batch.Count;
                    if (pruned > 0)
                    {
                        db.LogEntries.RemoveRange(batch);
                        await db.SaveChangesAsync(stoppingToken);
                    }
                } while (pruned == pruneBatchSize && !stoppingToken.IsCancellationRequested);
            }
            catch (Exception)
            {
                // Suppress background persistence exceptions to prevent crashing the host
            }

            await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);
        }
    }
}
