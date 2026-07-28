using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Nexus.Gateway.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Subscribe the caller to a server-specific performance data group.
    /// Clients call this to receive ReceivePerformanceData events for a given server.
    /// </summary>
    public async Task JoinServerGroup(string serverId)
    {
        var groupName = $"server:{serverId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("Client {ConnectionId} joined group {Group}", Context.ConnectionId, groupName);
    }

    /// <summary>
    /// Unsubscribe the caller from a server-specific performance data group.
    /// </summary>
    public async Task LeaveServerGroup(string serverId)
    {
        var groupName = $"server:{serverId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("Client {ConnectionId} left group {Group}", Context.ConnectionId, groupName);
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId} (User: {User})",
            Context.ConnectionId, Context.User?.Identity?.Name ?? "unknown");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId} (Reason: {Reason})",
            Context.ConnectionId, exception?.Message ?? "normal");
        await base.OnDisconnectedAsync(exception);
    }
}
