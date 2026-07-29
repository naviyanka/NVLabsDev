namespace Nexus.Gateway.Models;

public class TelemetryHistory
{
    public long Id { get; set; }
    public string ServerIp { get; set; } = "";
    public double Cpu { get; set; }
    public double Mem { get; set; }
    public double Disk { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
