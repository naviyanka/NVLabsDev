using System.Security.Cryptography;
using System.Text;

namespace Nexus.ControlPlane.Credentials;

public sealed class DpapiCredentialProtector : ICredentialProtector
{
    public byte[] Protect(ReadOnlySpan<byte> plaintext, Guid credentialId, int secretVersion)
    {
        EnsureWindows();
        var secret = plaintext.ToArray();
        var entropy = BuildEntropy(credentialId, secretVersion);

        try
        {
            return ProtectedData.Protect(secret, entropy, DataProtectionScope.CurrentUser);
        }
        finally
        {
            CryptographicOperations.ZeroMemory(secret);
            CryptographicOperations.ZeroMemory(entropy);
        }
    }

    public byte[] Unprotect(ReadOnlySpan<byte> protectedSecret, Guid credentialId, int secretVersion)
    {
        EnsureWindows();
        var ciphertext = protectedSecret.ToArray();
        var entropy = BuildEntropy(credentialId, secretVersion);

        try
        {
            return ProtectedData.Unprotect(ciphertext, entropy, DataProtectionScope.CurrentUser);
        }
        finally
        {
            CryptographicOperations.ZeroMemory(ciphertext);
            CryptographicOperations.ZeroMemory(entropy);
        }
    }

    private static byte[] BuildEntropy(Guid credentialId, int secretVersion)
    {
        var purpose = Encoding.UTF8.GetBytes($"Nexus.V2.Credential/{credentialId:N}/{secretVersion}");
        try
        {
            return SHA256.HashData(purpose);
        }
        finally
        {
            CryptographicOperations.ZeroMemory(purpose);
        }
    }

    private static void EnsureWindows()
    {
        if (!OperatingSystem.IsWindows())
        {
            throw new PlatformNotSupportedException("Nexus credential protection requires Windows DPAPI.");
        }
    }
}
