using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;
using System.Text.Json;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{ip}/[controller]")]
public class CertificatesController : ControllerBase
{
    private readonly IPowerShellExecutionService _ps;
    private readonly ILogger<CertificatesController> _logger;

    public CertificatesController(IPowerShellExecutionService ps, ILogger<CertificatesController> logger)
    {
        _ps = ps;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CertificateModel>>> GetCertificates(string ip, [FromQuery] string store = "My")
    {
        try
        {
            var storeName = store switch
            {
                "Personal" => "My",
                "Trusted Root CAs" => "Root",
                "Intermediate CAs" => "CA",
                "Enterprise Trust" => "Trust",
                _ => "My"
            };

            var script = $@"
                $certs = Get-ChildItem -Path Cert:\LocalMachine\{storeName} -ErrorAction SilentlyContinue
                $result = @()
                foreach ($c in $certs) {{
                    $purpose = ''
                    if ($c.Extensions) {{
                        $eku = $c.Extensions | Where-Object {{ $_.Oid.FriendlyName -eq 'Enhanced Key Usage' }}
                        if ($eku) {{
                            $purpose = $eku.Format(0) -replace ' \([\d\.]+\)', ''
                        }}
                    }}
                    if (-not $purpose -or $purpose -eq '') {{
                        $purpose = 'Any Purpose'
                    }}

                    $result += [PSCustomObject]@{{
                        Id = $c.Thumbprint
                        Thumbprint = $c.Thumbprint
                        Subject = $c.Subject
                        Issuer = $c.Issuer
                        From = $c.NotBefore.ToString('yyyy-MM-dd')
                        To = $c.NotAfter.ToString('yyyy-MM-dd')
                        Purpose = $purpose
                    }}
                }}
                $result | ConvertTo-Json -Compress -Depth 2 -WarningAction SilentlyContinue
            ";

            var base64 = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            var psCmd = $"-NoProfile -ExecutionPolicy Bypass -Command \"Invoke-Command -ComputerName {ip} -ScriptBlock {{ [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{base64}')) | Invoke-Expression }}\"";
            
            // For localhost/DC we don't need Invoke-Command
            if (ip == "localhost" || ip == "127.0.0.1" || ip.Equals("dc", StringComparison.OrdinalIgnoreCase))
            {
                 psCmd = $"-NoProfile -ExecutionPolicy Bypass -Command \"[System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{base64}')) | Invoke-Expression\"";
            }

            var result = await _ps.ExecuteAsync(psCmd, HttpContext.RequestAborted);
            var output = result.StandardOutput;

            var certList = new List<CertificateModel>();

            if (!string.IsNullOrWhiteSpace(output))
            {
                try
                {
                    using var doc = JsonDocument.Parse(output);
                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var el in doc.RootElement.EnumerateArray())
                        {
                            certList.Add(new CertificateModel
                            {
                                Id = el.TryGetProperty("Id", out var id) ? id.GetString() ?? "" : "",
                                Thumbprint = el.TryGetProperty("Thumbprint", out var th) ? th.GetString() ?? "" : "",
                                Subject = el.TryGetProperty("Subject", out var sub) ? sub.GetString() ?? "" : "",
                                Issuer = el.TryGetProperty("Issuer", out var iss) ? iss.GetString() ?? "" : "",
                                From = el.TryGetProperty("From", out var f) ? f.GetString() ?? "" : "",
                                To = el.TryGetProperty("To", out var t) ? t.GetString() ?? "" : "",
                                Purpose = el.TryGetProperty("Purpose", out var p) ? p.GetString() ?? "" : ""
                            });
                        }
                    }
                    else if (doc.RootElement.ValueKind == JsonValueKind.Object)
                    {
                        certList.Add(new CertificateModel
                        {
                            Id = doc.RootElement.TryGetProperty("Id", out var id) ? id.GetString() ?? "" : "",
                            Thumbprint = doc.RootElement.TryGetProperty("Thumbprint", out var th) ? th.GetString() ?? "" : "",
                            Subject = doc.RootElement.TryGetProperty("Subject", out var sub) ? sub.GetString() ?? "" : "",
                            Issuer = doc.RootElement.TryGetProperty("Issuer", out var iss) ? iss.GetString() ?? "" : "",
                            From = doc.RootElement.TryGetProperty("From", out var f) ? f.GetString() ?? "" : "",
                            To = doc.RootElement.TryGetProperty("To", out var t) ? t.GetString() ?? "" : "",
                            Purpose = doc.RootElement.TryGetProperty("Purpose", out var p) ? p.GetString() ?? "" : ""
                        });
                    }
                }
                catch (JsonException) { }
            }

            return Ok(certList);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get certificates for {Ip}", ip);
            return StatusCode(500, ex.Message);
        }
    }
}
