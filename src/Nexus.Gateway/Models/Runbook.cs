namespace Nexus.Gateway.Models;

public class Runbook
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Script { get; set; } = string.Empty;
    public string CronExpression { get; set; } = string.Empty; // "0 2 * * 0" = Sunday 2 AM
    public string TargetServers { get; set; } = "*"; // comma-separated IPs or "*" for all
    public bool Enabled { get; set; } = true;
    public DateTime? LastRunAt { get; set; }
    public string LastRunStatus { get; set; } = string.Empty; // Success, Failed, Running
    public string LastRunOutput { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;
}

public class RunbookExecution
{
    public int Id { get; set; }
    public string RunbookId { get; set; } = string.Empty;
    public string RunbookName { get; set; } = string.Empty;
    public string ServerIp { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public int ExitCode { get; set; }
    public string Output { get; set; } = string.Empty;
    public string Status { get; set; } = "Running"; // Running, Success, Failed
}
