using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Nexus.Gateway.Models;

public class PerfSample
{
    [Key]
    [JsonIgnore]
    public int Id { get; set; }
    [JsonIgnore]
    public string ServerIp { get; set; } = string.Empty;
    
    public long T { get; set; }
    public double Cpu { get; set; }
    public double Mem { get; set; }
    public double DiskR { get; set; }
    public double DiskW { get; set; }
    public double NetIn { get; set; }
    public double NetOut { get; set; }
}
