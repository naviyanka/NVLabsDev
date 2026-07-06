using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly NexusContext _db;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(NexusContext db, ILogger<NotificationsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationModel>>> GetNotifications()
    {
        var notifications = await _db.Notifications
            .OrderByDescending(n => n.Timestamp)
            .ToListAsync();

        return Ok(notifications.Select(n => new NotificationModel
        {
            Id = n.Id,
            Type = n.Type,
            Message = n.Message,
            ServerIp = n.ServerIp,
            Timestamp = n.Timestamp,
            IsRead = n.IsRead
        }));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(int id)
    {
        var notification = await _db.Notifications.FindAsync(id);
        if (notification == null) return NotFound();

        _db.Notifications.Remove(notification);
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteAllNotifications()
    {
        _db.Notifications.RemoveRange(_db.Notifications);
        await _db.SaveChangesAsync();
        return Ok();
    }

    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    [HttpPost("test")]
    public async Task<IActionResult> TestNotification([FromServices] Nexus.Gateway.Services.NotificationService svc, [FromQuery] string type = "Info", [FromQuery] string message = "Test notification")
    {
        await svc.AddAndBroadcastNotificationAsync(type, message, "localhost");
        return Ok();
    }

}
