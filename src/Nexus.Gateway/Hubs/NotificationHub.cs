using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Nexus.Gateway.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    // Clients can connect and will receive notifications. 
    // Additional methods can be added if clients need to send messages to the server.
}
