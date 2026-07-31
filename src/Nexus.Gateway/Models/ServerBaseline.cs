namespace Nexus.Gateway.Models;

public class ServerBaseline
{
    public int Id { get; set; }
    public string ServerIp { get; set; } = string.Empty;
    public string Metric { get; set; } = string.Empty; // cpu, ram, disk
    public double Mean { get; set; }
    public double StdDev { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}
