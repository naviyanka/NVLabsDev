namespace Nexus.Gateway.Models;

public class ScheduledTaskModel
{
    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string LastRun { get; set; } = string.Empty;
    public string LastResult { get; set; } = string.Empty;
    public string NextRun { get; set; } = string.Empty;
    public List<string> Triggers { get; set; } = new();
}

public class RunTaskRequest
{
    public string TaskPath { get; set; } = string.Empty;
}
