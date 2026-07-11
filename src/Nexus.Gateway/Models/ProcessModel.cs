using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Nexus.Gateway.Models;

public class ProcessModel
{
    [Key]
    [JsonIgnore]
    public int Id { get; set; }
    [JsonIgnore]
    public string ServerIp { get; set; } = string.Empty;

    public int Pid { get; set; }
    public string Name { get; set; } = string.Empty;
    public double Cpu { get; set; }
    public double MemMB { get; set; }
    public double MemPct { get; set; }
    public int Handles { get; set; }
    public int Threads { get; set; }
    public string User { get; set; } = string.Empty;
    public string Status { get; set; } = "Running";
    public string? CommandLine { get; set; }
    public string? ExecutablePath { get; set; }
}
