namespace Nexus.ControlPlane.Data;

public sealed class CredentialProfile
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string UserName { get; set; }
    public string? Domain { get; set; }
    public required byte[] ProtectedSecret { get; set; }
    public int SecretVersion { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public required string CreatedBy { get; set; }
    public required string UpdatedBy { get; set; }
    public Guid ConcurrencyToken { get; set; }
}
