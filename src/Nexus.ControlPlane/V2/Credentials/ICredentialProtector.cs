namespace Nexus.ControlPlane.Credentials;

public interface ICredentialProtector
{
    byte[] Protect(ReadOnlySpan<byte> plaintext, Guid credentialId, int secretVersion);
    byte[] Unprotect(ReadOnlySpan<byte> protectedSecret, Guid credentialId, int secretVersion);
}
