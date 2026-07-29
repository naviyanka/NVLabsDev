namespace Nexus.Gateway.Models;

public class AlertRule
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Metric { get; set; } = "cpu"; // cpu, ram, disk, status
    public string Comparison { get; set; } = "gt"; // gt, lt, eq
    public double Threshold { get; set; } = 90;
    public int DurationSeconds { get; set; } = 60; // sustained for N seconds before firing
    public string ServerIp { get; set; } = "*"; // * = all servers, or specific IP
    public string Channel { get; set; } = "notification"; // notification, discord, slack, webhook
    public bool Enabled { get; set; } = true;
    public DateTime? LastFiredAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
