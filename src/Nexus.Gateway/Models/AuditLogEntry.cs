using System.ComponentModel.DataAnnotations;

namespace Nexus.Gateway.Models;

public class AuditLogEntry
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty;
    public string? ResourceId { get; set; }
    public string HttpMethod { get; set; } = string.Empty;
    public string RequestPath { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public long DurationMs { get; set; }
    public string? RequestBody { get; set; }
    public string? ResponseSummary { get; set; }
    public string? ServerContext { get; set; }
    public string? PreviousHash { get; set; }
    public string Hash { get; set; } = string.Empty;
}
