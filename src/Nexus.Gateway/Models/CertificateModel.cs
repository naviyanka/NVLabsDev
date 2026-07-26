namespace Nexus.Gateway.Models;

public class CertificateModel
{
    public string Id { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public string Thumbprint { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
}
