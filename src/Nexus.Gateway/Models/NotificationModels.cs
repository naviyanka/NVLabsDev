namespace Nexus.Gateway.Models;

public class NotificationEntity
{
    public int Id { get; set; }
    public string Type { get; set; } = "Info"; // Info, Success, Error
    public string Message { get; set; } = string.Empty;
    public string ServerIp { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;
}

public class NotificationModel
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string ServerIp { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public bool IsRead { get; set; }
}
