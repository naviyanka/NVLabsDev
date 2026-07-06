namespace Nexus.Gateway.Models;

public class Server
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Ip { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Os { get; set; } = string.Empty;
    public string Status { get; set; } = "offline";
    public double Cpu { get; set; } = 0;
    public double Mem { get; set; } = 0;
    public double Disk { get; set; } = 0;
    public string Uptime { get; set; } = string.Empty;
    public string Site { get; set; } = string.Empty;
    public bool IsAdFetched { get; set; } = false;
}
