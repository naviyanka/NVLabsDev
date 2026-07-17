using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Nexus.ControlPlane.Data;

namespace Nexus.ControlPlane.Credentials;

public sealed class CredentialVault(
    ControlPlaneDbContext db,
    ICredentialProtector protector,
    TimeProvider timeProvider) : ICredentialVault
{
    public async Task<IReadOnlyList<CredentialSummary>> ListAsync(CancellationToken cancellationToken = default) =>
        await db.CredentialProfiles
            .AsNoTracking()
            .OrderBy(profile => profile.Name)
            .Select(profile => ToSummary(profile))
            .ToListAsync(cancellationToken);

    public async Task<CredentialSummary> CreateAsync(
        CreateCredentialRequest request,
        string actor,
        CancellationToken cancellationToken = default)
    {
        var name = NormalizeRequired(request.Name, nameof(request.Name), 120);
        var userName = NormalizeRequired(request.UserName, nameof(request.UserName), 256);
        var normalizedActor = NormalizeRequired(actor, nameof(actor), 256);
        ValidateSecret(request.Secret);
        var id = Guid.NewGuid();
        const int version = 1;
        var now = timeProvider.GetUtcNow();
        var plaintext = Encoding.UTF8.GetBytes(request.Secret);

        try
        {
            var profile = new CredentialProfile
            {
                Id = id,
                Name = name,
                UserName = userName,
                Domain = NormalizeOptional(request.Domain),
                ProtectedSecret = protector.Protect(plaintext, id, version),
                SecretVersion = version,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
                CreatedBy = normalizedActor,
                UpdatedBy = normalizedActor,
                ConcurrencyToken = Guid.NewGuid()
            };

            db.CredentialProfiles.Add(profile);
            await SaveChangesAsync(profile.Name, cancellationToken);
            return ToSummary(profile);
        }
        finally
        {
            CryptographicOperations.ZeroMemory(plaintext);
        }
    }

    public async Task<CredentialSummary> RotateAsync(
        Guid id,
        string secret,
        string actor,
        CancellationToken cancellationToken = default)
    {
        ValidateSecret(secret);
        var normalizedActor = NormalizeRequired(actor, nameof(actor), 256);
        var profile = await FindAsync(id, cancellationToken);
        var nextVersion = checked(profile.SecretVersion + 1);
        var plaintext = Encoding.UTF8.GetBytes(secret);

        try
        {
            profile.ProtectedSecret = protector.Protect(plaintext, id, nextVersion);
            profile.SecretVersion = nextVersion;
            profile.UpdatedAtUtc = timeProvider.GetUtcNow();
            profile.UpdatedBy = normalizedActor;
            profile.ConcurrencyToken = Guid.NewGuid();
            await db.SaveChangesAsync(cancellationToken);
            return ToSummary(profile);
        }
        finally
        {
            CryptographicOperations.ZeroMemory(plaintext);
        }
    }

    public async Task<CredentialLease> OpenAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var profile = await db.CredentialProfiles
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken)
            ?? throw new CredentialNotFoundException(id);

        var plaintext = protector.Unprotect(profile.ProtectedSecret, profile.Id, profile.SecretVersion);
        try
        {
            return new CredentialLease(profile.UserName, profile.Domain, Encoding.UTF8.GetChars(plaintext));
        }
        finally
        {
            CryptographicOperations.ZeroMemory(plaintext);
        }
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var profile = await FindAsync(id, cancellationToken);
        db.CredentialProfiles.Remove(profile);
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<CredentialProfile> FindAsync(Guid id, CancellationToken cancellationToken) =>
        await db.CredentialProfiles.SingleOrDefaultAsync(item => item.Id == id, cancellationToken)
        ?? throw new CredentialNotFoundException(id);

    private async Task SaveChangesAsync(string name, CancellationToken cancellationToken)
    {
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException?.Message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase) == true)
        {
            foreach (var entry in db.ChangeTracker.Entries<CredentialProfile>().Where(entry => entry.State == EntityState.Added))
            {
                entry.State = EntityState.Detached;
            }
            throw new CredentialConflictException(name);
        }
    }

    private static string NormalizeRequired(string value, string parameterName, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Value is required.", parameterName);
        }

        var normalized = value.Trim();
        if (normalized.Length > maxLength)
        {
            throw new ArgumentException($"Value cannot exceed {maxLength} characters.", parameterName);
        }

        return normalized;
    }

    private static void ValidateSecret(string secret)
    {
        if (string.IsNullOrEmpty(secret) || secret.Length > 4096)
        {
            throw new ArgumentException("Secret must contain between 1 and 4096 characters.", nameof(secret));
        }
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static CredentialSummary ToSummary(CredentialProfile profile) => new(
        profile.Id,
        profile.Name,
        profile.UserName,
        profile.Domain,
        profile.SecretVersion,
        profile.CreatedAtUtc,
        profile.UpdatedAtUtc);
}
