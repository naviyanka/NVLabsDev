using System.Runtime.InteropServices;
using System.Security.Cryptography;

namespace Nexus.ControlPlane.Credentials;

public sealed class CredentialLease : IDisposable
{
    private char[]? _secret;

    internal CredentialLease(string userName, string? domain, char[] secret)
    {
        UserName = userName;
        Domain = domain;
        _secret = secret;
    }

    public string UserName { get; }
    public string? Domain { get; }
    public ReadOnlyMemory<char> Secret => _secret ?? throw new ObjectDisposedException(nameof(CredentialLease));

    public void Dispose()
    {
        var secret = Interlocked.Exchange(ref _secret, null);
        if (secret is not null)
        {
            CryptographicOperations.ZeroMemory(MemoryMarshal.AsBytes(secret.AsSpan()));
        }
    }
}
