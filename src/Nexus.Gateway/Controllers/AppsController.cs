using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Models;
using Nexus.Gateway.Data;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Text.RegularExpressions;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{ip}/[controller]")]
public class AppsController : ControllerBase
{
    private readonly NexusContext _db;
    private readonly ILogger<AppsController> _logger;
    private readonly IPowerShellExecutionService _ps;

    public AppsController(NexusContext db, ILogger<AppsController> logger, IPowerShellExecutionService ps)
    {
        _db = db;
        _logger = logger;
        _ps = ps;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InstalledAppModel>>> GetApps(string ip, [FromQuery] bool refresh = false)
    {
        try
        {
            if (!refresh)
            {
                var cached = await _db.InstalledApps
                    .Where(a => a.ServerIp == ip)
                    .OrderBy(a => a.Name)
                    .ToListAsync();

                if (cached.Any())
                {
                    return Ok(cached.Select(a => new InstalledAppModel
                    {
                        Id = a.Id.ToString(),
                        Name = a.Name,
                        Version = a.Version,
                        Publisher = a.Publisher,
                        InstallDate = a.InstallDate,
                        Location = a.Location,
                        SizeMB = a.SizeMB,
                        UninstallString = a.UninstallString
                    }));
                }
            }

            var script = "Invoke-Command -ComputerName " + ip + " -ScriptBlock { Get-ItemProperty -Path @('HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*', 'HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*') -ErrorAction SilentlyContinue | Where-Object DisplayName | Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallLocation, EstimatedSize, UninstallString | ConvertTo-Csv -NoTypeInformation }";
            var base64 = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            
            var result = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {base64}", HttpContext.RequestAborted);
            var output = result.StandardOutput;

            var apps = new List<InstalledAppEntity>();
            var lines = output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries).Skip(1);

            foreach (var line in lines)
            {
                var matches = Regex.Matches(line, @"(?:^|,)(?:""(?<val>[^""]*)""|(?<val>[^,]*))");
                var parts = matches.Cast<Match>().Select(m => m.Groups["val"].Value).ToList();

                if (parts.Count >= 7)
                {
                    var sizeStr = parts[5];
                    if (int.TryParse(sizeStr, out var sizeKb))
                    {
                        sizeStr = (sizeKb / 1024).ToString();
                    }
                    else
                    {
                        sizeStr = "0";
                    }

                    apps.Add(new InstalledAppEntity
                    {
                        ServerIp = ip,
                        Name = parts[0],
                        Version = parts[1],
                        Publisher = parts[2],
                        InstallDate = parts[3],
                        Location = parts[4],
                        SizeMB = sizeStr,
                        UninstallString = parts[6]
                    });
                }
            }

            // Update DB cache
            var existing = await _db.InstalledApps.Where(a => a.ServerIp == ip).ToListAsync();
            _db.InstalledApps.RemoveRange(existing);
            await _db.InstalledApps.AddRangeAsync(apps);
            await _db.SaveChangesAsync();

            return Ok(apps.OrderBy(a => a.Name).Select(a => new InstalledAppModel
            {
                Id = a.Id.ToString(),
                Name = a.Name,
                Version = a.Version,
                Publisher = a.Publisher,
                InstallDate = a.InstallDate,
                Location = a.Location,
                SizeMB = a.SizeMB,
                UninstallString = a.UninstallString
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get installed apps for {Ip}", ip);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("install")]
    public async Task<IActionResult> InstallApp(string ip, [FromBody] InstallAppRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.InstallerPath)) return BadRequest("InstallerPath is required");

            var ext = Path.GetExtension(request.InstallerPath).ToLowerInvariant();
            var args = request.Arguments;

            // Enforce silent arguments if none provided
            if (string.IsNullOrEmpty(args))
            {
                if (ext == ".msi") args = "/qn /norestart";
                else if (ext == ".exe") args = "/S";
            }

            var actualInstallerPath = request.InstallerPath;
            var copiedFile = false;

            if (!string.IsNullOrEmpty(request.SourceServerIp) && !request.SourceServerIp.Equals(ip, StringComparison.OrdinalIgnoreCase))
            {
                // Source path on source server
                var driveLetter = request.InstallerPath.Substring(0, 1);
                var restOfPath = request.InstallerPath.Substring(3); // skip "C:\"
                var sourceSmb = $@"\\{request.SourceServerIp}\{driveLetter}$\{restOfPath}";

                var filename = Path.GetFileName(request.InstallerPath);
                var targetSmbFolder = $@"\\{ip}\C$\Windows\Temp";
                var targetSmbFile = $@"{targetSmbFolder}\{filename}";

                System.IO.File.Copy(sourceSmb, targetSmbFile, true);
                
                actualInstallerPath = $@"C:\Windows\Temp\{filename}";
                copiedFile = true;
            }

            // Run process via WMI or Invoke-Command. Let's use Invoke-Command
            // Note: msiexec might return immediately and run in background. We just start it.
            string cmd;
            if (ext == ".msi")
            {
                cmd = $"msiexec.exe /i \"{actualInstallerPath}\" {args}";
            }
            else
            {
                cmd = $"Start-Process -FilePath \"{actualInstallerPath}\" -ArgumentList \"{args}\" -Wait -NoNewWindow";
            }

            var script = $"Invoke-Command -ComputerName {ip} -ScriptBlock {{ {cmd} }}";
            var base64 = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            
            var result = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {base64}", HttpContext.RequestAborted);
            var err = result.StandardError;
            
            if (copiedFile)
            {
                try
                {
                    var targetSmbFile = $@"\\{ip}\C$\Windows\Temp\{Path.GetFileName(request.InstallerPath)}";
                    System.IO.File.Delete(targetSmbFile);
                }
                catch (Exception deleteEx)
                {
                    _logger.LogWarning(deleteEx, "Failed to delete temporary installer from target server.");
                }
            }

            if (result.ExitCode != 0)
            {
                return StatusCode(500, $"Installer failed: {err}");
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to install app on {Ip}", ip);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("upload-installer")]
    [RequestSizeLimit(long.MaxValue)]
    [RequestFormLimits(MultipartBodyLengthLimit = long.MaxValue)]
    public async Task<IActionResult> UploadInstaller(string ip, [FromForm] IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0) return BadRequest("No file uploaded");

            var targetSmbFolder = $@"\\{ip}\C$\Windows\Temp";
            var targetSmbFile = $@"{targetSmbFolder}\{file.FileName}";

            using (var stream = new FileStream(targetSmbFile, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new { Path = $@"C:\Windows\Temp\{file.FileName}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload installer to {Ip}", ip);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("uninstall")]
    public async Task<IActionResult> UninstallApp(string ip, [FromBody] UninstallAppRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.UninstallString)) return BadRequest("UninstallString is required");

            var cmd = request.UninstallString;
            // Force silent uninstall for MSIs
            if (cmd.Contains("msiexec", StringComparison.OrdinalIgnoreCase))
            {
                cmd = cmd.Replace("/I", "/x", StringComparison.OrdinalIgnoreCase);
                if (!cmd.Contains("/q", StringComparison.OrdinalIgnoreCase))
                {
                    cmd += " /qn /norestart";
                }
            }

            var script = $"Invoke-Command -ComputerName {ip} -ScriptBlock {{ {cmd} }}";
            var base64 = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            
            var result = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {base64}", HttpContext.RequestAborted);

            if (result.ExitCode != 0)
            {
                var err = result.StandardError;
                return StatusCode(500, $"Uninstaller failed: {err}");
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to uninstall app on {Ip}", ip);
            return StatusCode(500, "Internal server error");
        }
    }
}
