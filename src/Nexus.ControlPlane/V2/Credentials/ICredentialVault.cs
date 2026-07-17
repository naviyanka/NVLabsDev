namespace Nexus.ControlPlane.Credentials;

public interface ICredentialVault
{
    Task<IReadOnlyList<CredentialSummary>> ListAsync(CancellationToken cancellationToken = default);
    Task<CredentialSummary> CreateAsync(CreateCredentialRequest request, string actor, CancellationToken cancellationToken = default);
    Task<CredentialSummary> RotateAsync(Guid id, string secret, string actor, CancellationToken cancellationToken = default);
    Task<CredentialLease> OpenAsync(Guid id, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
