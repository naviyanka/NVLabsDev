using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Nexus.Gateway.Models;

public class DiskPartition
{
    public string Label { get; set; } = string.Empty;
    public double SizeGB { get; set; }
    public string Type { get; set; } = "Data";
}

public class DiskModel
{
    public int DbId { get; set; }
    public string ServerIp { get; set; } = string.Empty;
    public string Id { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public double SizeGB { get; set; }
    public string Bus { get; set; } = string.Empty;
    public string Health { get; set; } = "Healthy";
    
    [NotMapped]
    public List<DiskPartition> Partitions { get; set; } = new();

    public string PartitionsJson
    {
        get => JsonSerializer.Serialize(Partitions);
        set => Partitions = string.IsNullOrEmpty(value) ? new List<DiskPartition>() : JsonSerializer.Deserialize<List<DiskPartition>>(value) ?? new List<DiskPartition>();
    }
}

public class VolumeModel
{
    public int DbId { get; set; }
    public string ServerIp { get; set; } = string.Empty;
    public string Letter { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Fs { get; set; } = string.Empty;
    public double SizeGB { get; set; }
    public double UsedGB { get; set; }
    public string Status { get; set; } = "Healthy";
    public string DiskId { get; set; } = string.Empty;
}
