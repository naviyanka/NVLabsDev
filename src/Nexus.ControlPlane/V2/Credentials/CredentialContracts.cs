using System.ComponentModel.DataAnnotations;

namespace Nexus.ControlPlane.Credentials;

public sealed record CredentialSummary(
    Guid Id,
    string Name,
    string UserName,
    string? Domain,
    int SecretVersion,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

public sealed record CreateCredentialRequest(
    [property: Required, StringLength(120, MinimumLength = 1)] string Name,
    [property: Required, StringLength(256, MinimumLength = 1)] string UserName,
    [property: StringLength(256)] string? Domain,
    [property: Required, StringLength(4096, MinimumLength = 1)] string Secret);

public sealed record RotateCredentialRequest(
    [property: Required, StringLength(4096, MinimumLength = 1)] string Secret);

public sealed class CredentialNotFoundException(Guid id)
    : Exception($"Credential profile '{id}' was not found.");

public sealed class CredentialConflictException(string name)
    : Exception($"Credential profile name '{name}' already exists.");
