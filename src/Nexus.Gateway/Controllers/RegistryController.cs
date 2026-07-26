using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;
using System.Text.Json;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{ip}/[controller]")]
public class RegistryController : ControllerBase
{
    private readonly IPowerShellExecutionService _ps;
    private readonly ILogger<RegistryController> _logger;

    public RegistryController(IPowerShellExecutionService ps, ILogger<RegistryController> logger)
    {
        _ps = ps;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<RegistryContentModel>> GetRegistryContent(string ip, [FromQuery] string path)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(path))
            {
                return BadRequest("Path is required.");
            }

            var cleanPath = path.Replace("'", "''");

            var script = @"
                $path = '" + cleanPath + @"'
                
                # Map standard hives to PS provider drives
                $path = $path -replace '^HKEY_LOCAL_MACHINE', 'HKLM:'
                $path = $path -replace '^HKEY_CURRENT_USER', 'HKCU:'
                $path = $path -replace '^HKEY_CLASSES_ROOT', 'HKCR:'
                $path = $path -replace '^HKEY_USERS', 'HKU:'
                $path = $path -replace '^HKEY_CURRENT_CONFIG', 'HKCC:'
                $path = $path -replace '\\+', '\' # normalize slashes

                $result = @{
                    SubKeys = @()
                    Values = @()
                }

                try {
                    $item = Get-Item -LiteralPath $path -ErrorAction Stop

                    # Get Subkeys
                    $subnames = $item.GetSubKeyNames()
                    foreach ($s in $subnames) {
                        $hasSub = $false
                        try {
                            $subItem = $item.OpenSubKey($s)
                            if ($subItem -and $subItem.SubKeyCount -gt 0) { $hasSub = $true }
                            if ($subItem) { $subItem.Close() }
                        } catch {}

                        $fullPath = ('{0}\{1}' -f $path, $s) -replace 'HKLM:', 'HKEY_LOCAL_MACHINE' -replace 'HKCU:', 'HKEY_CURRENT_USER' -replace 'HKCR:', 'HKEY_CLASSES_ROOT' -replace 'HKU:', 'HKEY_USERS' -replace 'HKCC:', 'HKEY_CURRENT_CONFIG'

                        $result.SubKeys += [PSCustomObject]@{
                            Name = $s
                            Path = $fullPath
                            HasSubKeys = $hasSub
                        }
                    }

                    # Get Values
                    $valnames = $item.GetValueNames()
                    foreach ($v in $valnames) {
                        $val = $item.GetValue($v)
                        $kind = $item.GetValueKind($v).ToString()
                        
                        $displayVal = ''
                        if ($val -is [array]) {
                            if ($kind -eq 'Binary') {
                                $displayVal = [System.BitConverter]::ToString($val).Replace('-',' ').ToLower()
                            } else {
                                $displayVal = $val -join ' '
                            }
                        } else {
                            $displayVal = [string]$val
                        }
                        
                        $name = $v
                        if ([string]::IsNullOrEmpty($name)) { $name = '(Default)' }

                        $result.Values += [PSCustomObject]@{
                            Name = $name
                            Type = 'REG_' + $kind.ToUpper()
                            Data = $displayVal
                        }
                    }
                } catch {
                    # If access denied or not found, just return empty with success so the UI doesn't crash
                }

                $result | ConvertTo-Json -Compress -Depth 4 -WarningAction SilentlyContinue
            ";

            var base64 = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            var psCmd = $"-NoProfile -ExecutionPolicy Bypass -Command \"Invoke-Command -ComputerName {ip} -ScriptBlock {{ [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{base64}')) | Invoke-Expression }}\"";
            
            if (ip == "localhost" || ip == "127.0.0.1" || ip.Equals("dc", StringComparison.OrdinalIgnoreCase))
            {
                 psCmd = $"-NoProfile -ExecutionPolicy Bypass -Command \"[System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{base64}')) | Invoke-Expression\"";
            }

            var result = await _ps.ExecuteAsync(psCmd, HttpContext.RequestAborted);
            var output = result.StandardOutput;

            var content = new RegistryContentModel();

            if (!string.IsNullOrWhiteSpace(output))
            {
                try
                {
                    using var doc = JsonDocument.Parse(output);
                    
                    if (doc.RootElement.TryGetProperty("SubKeys", out var skEl) && skEl.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var el in skEl.EnumerateArray())
                        {
                            content.SubKeys.Add(new RegistryNodeModel
                            {
                                Name = el.TryGetProperty("Name", out var n) ? n.GetString() ?? "" : "",
                                Path = el.TryGetProperty("Path", out var p) ? p.GetString() ?? "" : "",
                                HasSubKeys = el.TryGetProperty("HasSubKeys", out var h) && h.ValueKind == JsonValueKind.True
                            });
                        }
                    }
                    
                    if (doc.RootElement.TryGetProperty("Values", out var vEl) && vEl.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var el in vEl.EnumerateArray())
                        {
                            content.Values.Add(new RegistryValueModel
                            {
                                Name = el.TryGetProperty("Name", out var n) ? n.GetString() ?? "" : "",
                                Type = el.TryGetProperty("Type", out var t) ? t.GetString() ?? "" : "",
                                Data = el.TryGetProperty("Data", out var d) ? d.GetString() ?? "" : ""
                            });
                        }
                    }
                }
                catch (JsonException) { }
            }

            return Ok(content);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get registry path {Path} for {Ip}", path, ip);
            return StatusCode(500, ex.Message);
        }
    }
}
