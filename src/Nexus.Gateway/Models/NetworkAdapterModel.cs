namespace Nexus.Gateway.Models;

public class NetworkAdapterModel
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = "Wired";
    public string Status { get; set; } = "Disconnected";
    public string Mac { get; set; } = string.Empty;
    public string Ipv4 { get; set; } = string.Empty;
    public string Ipv6 { get; set; } = string.Empty;
    public string Subnet { get; set; } = string.Empty;
    public string Gateway { get; set; } = string.Empty;
    public List<string> Dns { get; set; } = new();
    public bool Dhcp { get; set; }
    public double SpeedMbps { get; set; }
    public long BytesIn { get; set; }
    public long BytesOut { get; set; }
}
