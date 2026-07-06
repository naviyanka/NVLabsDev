using Microsoft.AspNetCore.SignalR;
using Nexus.Gateway.Data;
using Nexus.Gateway.Hubs;
using Nexus.Gateway.Models;

namespace Nexus.Gateway.Services;

public class NotificationService
{
    private readonly NexusContext _db;
    private readonly IHubContext<NotificationHub> _hub;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(NexusContext db, IHubContext<NotificationHub> hub, ILogger<NotificationService> logger)
    {
        _db = db;
        _hub = hub;
        _logger = logger;
    }

    public async Task AddAndBroadcastNotificationAsync(string type, string message, string serverIp)
    {
        var notification = new NotificationEntity
        {
            Type = type,
            Message = message,
            ServerIp = serverIp,
            Timestamp = DateTime.UtcNow,
            IsRead = false
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        var model = new NotificationModel
        {
            Id = notification.Id,
            Type = notification.Type,
            Message = notification.Message,
            ServerIp = notification.ServerIp,
            Timestamp = notification.Timestamp,
            IsRead = notification.IsRead
        };

        await _hub.Clients.All.SendAsync("ReceiveNotification", model);
        _logger.LogInformation($"Broadcasted notification: {type} - {message}");
    }
}
