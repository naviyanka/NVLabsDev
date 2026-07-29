using System.Text.Json.Serialization;

namespace Nexus.Gateway.Models;

public class ReplicaPartnershipDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("sourceServer")]
    public string SourceServer { get; set; } = string.Empty;

    [JsonPropertyName("destServer")]
    public string DestServer { get; set; } = string.Empty;

    [JsonPropertyName("sourceVol")]
    public string SourceVol { get; set; } = string.Empty;

    [JsonPropertyName("destVol")]
    public string DestVol { get; set; } = string.Empty;

    [JsonPropertyName("sourceLogVol")]
    public string SourceLogVol { get; set; } = string.Empty;

    [JsonPropertyName("destLogVol")]
    public string DestLogVol { get; set; } = string.Empty;

    [JsonPropertyName("mode")]
    public string Mode { get; set; } = "Synchronous"; // Synchronous or Asynchronous

    [JsonPropertyName("status")]
    public string Status { get; set; } = "Healthy";

    [JsonPropertyName("progress")]
    public int Progress { get; set; } = 100;

    [JsonPropertyName("bytes")]
    public long Bytes { get; set; } = 0;

    [JsonPropertyName("latencyMs")]
    public double LatencyMs { get; set; } = 0;

    [JsonPropertyName("transferRateMbps")]
    public double TransferRateMbps { get; set; } = 0;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("replicationGroup")]
    public string ReplicationGroup { get; set; } = string.Empty;

    [JsonPropertyName("logSizeGb")]
    public int LogSizeGb { get; set; } = 8;

    [JsonPropertyName("encryption")]
    public bool Encryption { get; set; } = false;

    [JsonPropertyName("autoFailover")]
    public bool AutoFailover { get; set; } = false;
}

public class CreateReplicaPartnershipRequest
{
    [JsonPropertyName("sourceServer")]
    public string SourceServer { get; set; } = string.Empty;

    [JsonPropertyName("destServer")]
    public string DestServer { get; set; } = string.Empty;

    [JsonPropertyName("sourceVol")]
    public string SourceVol { get; set; } = string.Empty;

    [JsonPropertyName("destVol")]
    public string DestVol { get; set; } = string.Empty;

    [JsonPropertyName("sourceLogVol")]
    public string SourceLogVol { get; set; } = string.Empty;

    [JsonPropertyName("destLogVol")]
    public string DestLogVol { get; set; } = string.Empty;

    [JsonPropertyName("mode")]
    public string Mode { get; set; } = "Synchronous";

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("replicationGroup")]
    public string ReplicationGroup { get; set; } = string.Empty;

    [JsonPropertyName("logSizeGb")]
    public int LogSizeGb { get; set; } = 8;

    [JsonPropertyName("encryption")]
    public bool Encryption { get; set; } = false;

    [JsonPropertyName("autoFailover")]
    public bool AutoFailover { get; set; } = false;
}

public class UpdateReplicaPartnershipRequest
{
    [JsonPropertyName("mode")]
    public string? Mode { get; set; }

    [JsonPropertyName("logSizeGb")]
    public int? LogSizeGb { get; set; }

    [JsonPropertyName("encryption")]
    public bool? Encryption { get; set; }

    [JsonPropertyName("autoFailover")]
    public bool? AutoFailover { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }
}
