using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;
using System.Diagnostics;
using System.Text.Json;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{ip}/[controller]")]
public class UpdatesController : ControllerBase
{
    private readonly NexusContext _db;
    private readonly ILogger<UpdatesController> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly IPowerShellExecutionService _ps;

    public UpdatesController(NexusContext db, ILogger<UpdatesController> logger, IServiceProvider serviceProvider, IPowerShellExecutionService ps)
    {
        _db = db;
        _logger = logger;
        _serviceProvider = serviceProvider;
        _ps = ps;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WindowsUpdateModel>>> GetUpdates(string ip)
    {
        var cached = await _db.ServerUpdates
            .Where(u => u.ServerIp == ip)
            .ToListAsync();

        return Ok(cached.Select(u => new WindowsUpdateModel
        {
            Title = u.Title,
            Description = u.Description,
            MaxDownloadSize = u.MaxDownloadSize
        }));
    }

    [HttpPost("check")]
    public async Task<ActionResult<IEnumerable<WindowsUpdateModel>>> CheckUpdates(string ip)
    {
        try
        {
            var script = @"
                $Session = New-Object -ComObject Microsoft.Update.Session
                $Searcher = $Session.CreateUpdateSearcher()
                $SearchResult = $Searcher.Search(""IsInstalled=0 and Type='Software' and IsHidden=0"")
                $updates = @()
                if ($SearchResult.Updates.Count -gt 0) {
                    foreach ($update in $SearchResult.Updates) {
                        $updates += [PSCustomObject]@{
                            Title = $update.Title
                            Description = $update.Description
                            MaxDownloadSize = $update.MaxDownloadSize
                        }
                    }
                }
                $updates | ConvertTo-Json -Compress -Depth 1 -WarningAction SilentlyContinue
            ";

            var base64 = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            var result = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -Command \"Invoke-Command -ComputerName {ip} -ScriptBlock {{ [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{base64}')) | Invoke-Expression }}\"", HttpContext.RequestAborted);
            var output = result.StandardOutput;

            var updatesList = new List<WindowsUpdateEntity>();

            if (!string.IsNullOrWhiteSpace(output))
            {
                try
                {
                    using var doc = JsonDocument.Parse(output);
                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var element in doc.RootElement.EnumerateArray())
                        {
                            updatesList.Add(new WindowsUpdateEntity
                            {
                                ServerIp = ip,
                                Title = element.TryGetProperty("Title", out var title) ? title.GetString() ?? "" : "",
                                Description = element.TryGetProperty("Description", out var desc) ? desc.GetString() ?? "" : "",
                                MaxDownloadSize = element.TryGetProperty("MaxDownloadSize", out var size) ? size.GetInt64() : 0
                            });
                        }
                    }
                    else if (doc.RootElement.ValueKind == JsonValueKind.Object)
                    {
                        updatesList.Add(new WindowsUpdateEntity
                        {
                            ServerIp = ip,
                            Title = doc.RootElement.TryGetProperty("Title", out var title) ? title.GetString() ?? "" : "",
                            Description = doc.RootElement.TryGetProperty("Description", out var desc) ? desc.GetString() ?? "" : "",
                            MaxDownloadSize = doc.RootElement.TryGetProperty("MaxDownloadSize", out var size) ? size.GetInt64() : 0
                        });
                    }
                }
                catch (JsonException) { }
            }

            var existing = await _db.ServerUpdates.Where(u => u.ServerIp == ip).ToListAsync();
            _db.ServerUpdates.RemoveRange(existing);
            _db.ServerUpdates.AddRange(updatesList);
            await _db.SaveChangesAsync();

            return Ok(updatesList.Select(u => new WindowsUpdateModel
            {
                Title = u.Title,
                Description = u.Description,
                MaxDownloadSize = u.MaxDownloadSize
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check updates for {Ip}", ip);
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("install")]
    public IActionResult InstallUpdates(string ip, [FromBody] InstallUpdatesRequest request)
    {
        if (request.UpdateTitles == null || !request.UpdateTitles.Any())
        {
            return BadRequest("No updates selected.");
        }

        // Run background task
        Task.Run(async () =>
        {
            try
            {
                var titlesStr = string.Join("','", request.UpdateTitles.Select(t => t.Replace("'", "''")));
                var script = $@"
                    $Session = New-Object -ComObject Microsoft.Update.Session
                    $Searcher = $Session.CreateUpdateSearcher()
                    $SearchResult = $Searcher.Search(""IsInstalled=0 and Type='Software' and IsHidden=0"")
                    $UpdatesToInstall = New-Object -ComObject Microsoft.Update.UpdateColl
                    $Titles = @('{titlesStr}')
                    
                    foreach ($update in $SearchResult.Updates) {{
                        if ($Titles -contains $update.Title) {{
                            $UpdatesToInstall.Add($update)
                        }}
                    }}
                    
                    if ($UpdatesToInstall.Count -gt 0) {{
                        foreach ($u in $UpdatesToInstall) {{ if (-not $u.EulaAccepted) {{ $u.AcceptEula() }} }}
                        $Downloader = $Session.CreateUpdateDownloader()
                        $Downloader.Updates = $UpdatesToInstall
                        $Downloader.Download()

                        $Installer = $Session.CreateUpdateInstaller()
                        $Installer.Updates = $UpdatesToInstall
                        $InstallResult = $Installer.Install()
                        
                        [PSCustomObject]@{{
                            ResultCode = $InstallResult.ResultCode
                            RebootRequired = $InstallResult.RebootRequired
                        }} | ConvertTo-Json -Compress
                    }} else {{
                        'No updates matched.'
                    }}
                ";

                var base64 = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
                var result = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -Command \"Invoke-Command -ComputerName {ip} -ScriptBlock {{ [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{base64}')) | Invoke-Expression }}\"", CancellationToken.None);
                var output = result.StandardOutput;

                using var scope = _serviceProvider.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<Nexus.Gateway.Services.NotificationService>();
                var db = scope.ServiceProvider.GetRequiredService<NexusContext>();
                
                var success = result.ExitCode == 0 && output.Contains("ResultCode");
                var message = success 
                    ? $"Successfully installed {request.UpdateTitles.Count} updates on {ip}. {output}" 
                    : $"Failed to install updates on {ip}. {output}";
                
                await notificationService.AddAndBroadcastNotificationAsync(
                    success ? "Success" : "Error",
                    message.Length > 500 ? message.Substring(0, 497) + "..." : message,
                    ip
                );

                // Clear the cached updates if successful so they don't show up anymore
                if (success)
                {
                    var existingUpdates = await db.ServerUpdates.Where(u => u.ServerIp == ip).ToListAsync();
                    var toRemove = existingUpdates.Where(u => request.UpdateTitles.Contains(u.Title)).ToList();
                    db.ServerUpdates.RemoveRange(toRemove);
                }

                await db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background install task failed");
                using var scope = _serviceProvider.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<Nexus.Gateway.Services.NotificationService>();
                await notificationService.AddAndBroadcastNotificationAsync(
                    "Error",
                    $"Background update task failed on {ip}: {ex.Message}",
                    ip
                );
            }
        });

        return Accepted();
    }
}
