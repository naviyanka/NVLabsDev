using System.Security.Cryptography;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Nexus.ControlPlane.Credentials;
using Nexus.ControlPlane.Data;

namespace Nexus.Gateway.Tests;

public sealed class CredentialVaultTests : IAsyncLifetime
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private ControlPlaneDbContext _db = null!;
    private CredentialVault _vault = null!;

    public async Task InitializeAsync()
    {
        await _connection.OpenAsync();
        var options = new DbContextOptionsBuilder<ControlPlaneDbContext>()
            .UseSqlite(_connection)
            .Options;
        _db = new ControlPlaneDbContext(options);
        await _db.Database.MigrateAsync();
        _vault = new CredentialVault(_db, new DpapiCredentialProtector(), TimeProvider.System);
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task Create_persists_ciphertext_and_opens_only_through_lease()
    {
        const string password = "never-store-this-plaintext";

        var summary = await _vault.CreateAsync(
            new CreateCredentialRequest("Production", "operator", "CORP", password),
            "test-user");
        var persisted = await _db.CredentialProfiles.AsNoTracking().SingleAsync();

        Assert.False(System.Text.Encoding.UTF8.GetBytes(password).SequenceEqual(persisted.ProtectedSecret));
        Assert.Equal(1, summary.SecretVersion);
        Assert.Equal("test-user", persisted.CreatedBy);

        using var lease = await _vault.OpenAsync(summary.Id);
        Assert.Equal(password, new string(lease.Secret.Span));

        lease.Dispose();
        Assert.Throws<ObjectDisposedException>(() => _ = lease.Secret);
    }

    [Fact]
    public async Task Rotate_replaces_ciphertext_and_increments_version()
    {
        var created = await _vault.CreateAsync(
            new CreateCredentialRequest("Production", "operator", null, "old-secret"),
            "creator");
        var originalCiphertext = (await _db.CredentialProfiles.AsNoTracking().SingleAsync()).ProtectedSecret;

        var rotated = await _vault.RotateAsync(created.Id, "new-secret", "rotator");
        var persisted = await _db.CredentialProfiles.AsNoTracking().SingleAsync();

        Assert.Equal(2, rotated.SecretVersion);
        Assert.False(originalCiphertext.SequenceEqual(persisted.ProtectedSecret));
        Assert.Equal("rotator", persisted.UpdatedBy);

        using var lease = await _vault.OpenAsync(created.Id);
        Assert.Equal("new-secret", new string(lease.Secret.Span));
    }

    [Fact]
    public async Task Duplicate_name_is_rejected_case_insensitively()
    {
        await _vault.CreateAsync(
            new CreateCredentialRequest("Production", "operator", null, "secret"),
            "creator");

        await Assert.ThrowsAsync<CredentialConflictException>(() => _vault.CreateAsync(
            new CreateCredentialRequest("production", "other", null, "secret"),
            "creator"));
    }

    [Fact]
    public void Dpapi_purpose_prevents_cross_credential_decryption()
    {
        var protector = new DpapiCredentialProtector();
        var plaintext = "purpose-bound"u8.ToArray();
        var firstId = Guid.NewGuid();
        var protectedSecret = protector.Protect(plaintext, firstId, 1);

        Assert.Throws<CryptographicException>(() => protector.Unprotect(protectedSecret, Guid.NewGuid(), 1));

        CryptographicOperations.ZeroMemory(plaintext);
        CryptographicOperations.ZeroMemory(protectedSecret);
    }
}
