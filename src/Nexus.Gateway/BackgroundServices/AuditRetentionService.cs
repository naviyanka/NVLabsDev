using Nexus.Gateway.Services;

namespace Nexus.Gateway.BackgroundServices;

public class AuditRetentionService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuditRetentionService> _logger;

    public AuditRetentionService(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ILogger<AuditRetentionService> logger)
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var retentionDays = _configuration.GetValue<int>("Audit:RetentionDays", 90);

                using var scope = _serviceProvider.CreateScope();
                var auditService = scope.ServiceProvider.GetRequiredService<AuditLogService>();
                var purgedCount = await auditService.PurgeExpiredAsync(retentionDays);

                if (purgedCount > 0)
                {
                    _logger.LogInformation(
                        "Audit retention service purged {Count} entries older than {Days} days",
                        purgedCount, retentionDays);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Audit retention background service");
            }

            // Run once per day
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
}
