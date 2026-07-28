using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Services;
using System.Diagnostics;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace Nexus.Gateway.Controllers;

public class OllamaProgressState
{
    public string Phase { get; set; } = "idle"; // idle, downloading, installing, completed, failed
    public int Percent { get; set; } = 0;
    public long BytesDownloaded { get; set; } = 0;
    public long TotalBytes { get; set; } = 0;
    public string Message { get; set; } = "";
}

[ApiController]
[Route("api/[controller]")]
public class OllamaController : ControllerBase
{
    private readonly ILogger<OllamaController> _logger;
    private readonly IPowerShellExecutionService _ps;
    private readonly IHttpClientFactory _httpClientFactory;

    private static readonly OllamaProgressState _progress = new();
    private static readonly object _progressLock = new();

    public OllamaController(ILogger<OllamaController> logger, IPowerShellExecutionService ps, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _ps = ps;
        _httpClientFactory = httpClientFactory;
    }

    private static string EncodeScript(string script)
    {
        return Convert.ToBase64String(Encoding.Unicode.GetBytes(script));
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        bool isInstalled = false;
        bool isRunning = false;
        string version = "";
        var installedModels = new List<string>();

        // 1. Check if ollama CLI is available or installed
        try {
            var versionCheck = await _ps.ExecuteAsync("-NoProfile -Command \"ollama --version\"", HttpContext.RequestAborted, 5000);
            if (versionCheck.ExitCode == 0 && versionCheck.StandardOutput.Contains("ollama"))
            {
                isInstalled = true;
                version = versionCheck.StandardOutput.Trim();
            }
        } catch { }

        if (!isInstalled)
        {
            var appDataPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "Ollama", "ollama.exe");
            if (System.IO.File.Exists(appDataPath))
            {
                isInstalled = true;
                version = "Ollama Windows App";
            }
        }

        // 2. Check REST Endpoint http://localhost:11434/api/tags
        try {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(3);
            var response = await client.GetAsync("http://localhost:11434/api/tags");
            if (response.IsSuccessStatusCode)
            {
                isRunning = true;
                isInstalled = true;
                var json = await response.Content.ReadFromJsonAsync<JsonElement>();
                if (json.TryGetProperty("models", out var modelsElement) && modelsElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var m in modelsElement.EnumerateArray())
                    {
                        if (m.TryGetProperty("name", out var nameProp))
                        {
                            installedModels.Add(nameProp.GetString() ?? "");
                        }
                    }
                }
            }
        } catch {
            isRunning = false;
        }

        return Ok(new {
            isInstalled,
            isRunning,
            version,
            installedModels = installedModels.Where(m => !string.IsNullOrEmpty(m)).ToList()
        });
    }

    [HttpGet("install-progress")]
    public IActionResult GetInstallProgress()
    {
        lock (_progressLock)
        {
            return Ok(new {
                phase = _progress.Phase,
                percent = _progress.Percent,
                bytesDownloaded = _progress.BytesDownloaded,
                totalBytes = _progress.TotalBytes,
                message = _progress.Message
            });
        }
    }

    [HttpPost("install")]
    public IActionResult InstallOllama()
    {
        lock (_progressLock)
        {
            if (_progress.Phase == "downloading" || _progress.Phase == "installing")
            {
                return Ok(new { success = true, message = "Installation already in progress." });
            }

            _progress.Phase = "downloading";
            _progress.Percent = 5;
            _progress.BytesDownloaded = 0;
            _progress.TotalBytes = 0;
            _progress.Message = "Starting download of OllamaSetup.exe...";
        }

        // Run background thread so HTTP response is instant while progress is updated live
        _ = Task.Run(async () =>
        {
            try
            {
                string tempInstaller = Path.Combine(Path.GetTempPath(), "OllamaSetup.exe");

                // Check if Winget can do the install
                bool wingetSuccess = false;
                try
                {
                    var wingetCheck = await _ps.ExecuteAsync("-NoProfile -Command \"winget --version\"", CancellationToken.None, 5000);
                    if (wingetCheck.ExitCode == 0)
                    {
                        lock (_progressLock)
                        {
                            _progress.Phase = "installing";
                            _progress.Percent = 40;
                            _progress.Message = "Installing Ollama package via Winget...";
                        }

                        var wingetInstall = await _ps.ExecuteAsync("-NoProfile -ExecutionPolicy Bypass -Command \"winget install --id Ollama.Ollama -e --accept-package-agreements --accept-source-agreements --silent\"", CancellationToken.None, 300000);
                        if (wingetInstall.ExitCode == 0 || wingetInstall.StandardOutput.Contains("Successfully"))
                        {
                            wingetSuccess = true;
                        }
                    }
                }
                catch { }

                if (!wingetSuccess)
                {
                    // Direct C# HttpClient stream download for precise percentage
                    lock (_progressLock)
                    {
                        _progress.Phase = "downloading";
                        _progress.Percent = 10;
                        _progress.Message = "Downloading OllamaSetup.exe from ollama.com...";
                    }

                    using (var httpClient = new HttpClient())
                    {
                        httpClient.Timeout = TimeSpan.FromMinutes(10);
                        using var response = await httpClient.GetAsync("https://ollama.com/download/OllamaSetup.exe", HttpCompletionOption.ResponseHeadersRead);
                        response.EnsureSuccessStatusCode();

                        long totalBytes = response.Content.Headers.ContentLength ?? 65000000;
                        lock (_progressLock)
                        {
                            _progress.TotalBytes = totalBytes;
                        }

                        using var contentStream = await response.Content.ReadAsStreamAsync();
                        using var fileStream = new FileStream(tempInstaller, FileMode.Create, FileAccess.Write, FileShare.None, 8192, true);

                        byte[] buffer = new byte[8192];
                        long bytesReadTotal = 0;
                        int read;

                        while ((read = await contentStream.ReadAsync(buffer, 0, buffer.Length)) > 0)
                        {
                            await fileStream.WriteAsync(buffer, 0, read);
                            bytesReadTotal += read;

                            int downloadPercent = (int)((bytesReadTotal * 50) / totalBytes);
                            lock (_progressLock)
                            {
                                _progress.BytesDownloaded = bytesReadTotal;
                                _progress.Percent = Math.Min(50, 10 + downloadPercent);
                                _progress.Message = $"Downloading OllamaSetup.exe ({bytesReadTotal / (1024 * 1024)} MB / {totalBytes / (1024 * 1024)} MB)...";
                            }
                        }
                    }

                    // Phase 2: Installing Setup
                    lock (_progressLock)
                    {
                        _progress.Phase = "installing";
                        _progress.Percent = 60;
                        _progress.Message = "Executing silent Windows installer (OllamaSetup.exe /silent)...";
                    }

                    using var installProcess = new Process
                    {
                        StartInfo = new ProcessStartInfo
                        {
                            FileName = tempInstaller,
                            Arguments = "/silent",
                            UseShellExecute = true,
                            CreateNoWindow = true
                        }
                    };

                    installProcess.Start();
                    await installProcess.WaitForExitAsync();

                    lock (_progressLock)
                    {
                        _progress.Percent = 90;
                        _progress.Message = "Registering background Ollama service...";
                    }
                }

                // Start Ollama service in background
                try
                {
                    string appDataPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "Ollama", "ollama.exe");
                    string exePath = System.IO.File.Exists(appDataPath) ? appDataPath : "ollama";
                    
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = exePath,
                        Arguments = "apphost",
                        UseShellExecute = false,
                        CreateNoWindow = true
                    });
                }
                catch { }

                lock (_progressLock)
                {
                    _progress.Phase = "completed";
                    _progress.Percent = 100;
                    _progress.Message = "Ollama setup completed successfully!";
                }
            }
            catch (Exception ex)
            {
                lock (_progressLock)
                {
                    _progress.Phase = "failed";
                    _progress.Message = $"Installation error: {ex.Message}";
                }
            }
        });

        return Ok(new { success = true, message = "Ollama installation background task started." });
    }

    [HttpPost("uninstall")]
    public async Task<IActionResult> UninstallOllama()
    {
        try {
            _logger.LogInformation("Initiating Ollama Removal...");

            string script = @"
                Write-Host 'Stopping Ollama processes...'
                Get-Process -Name 'ollama*' -ErrorAction SilentlyContinue | Stop-Process -Force

                $winget = Get-Command winget -ErrorAction SilentlyContinue
                if ($winget) {
                    Write-Host 'Uninstalling via Winget...'
                    & winget uninstall --id Ollama.Ollama -e --silent -ErrorAction SilentlyContinue
                }

                $uninstaller = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\Uninstall.exe'
                if (Test-Path $uninstaller) {
                    Write-Host 'Executing silent uninstaller...'
                    Start-Process -FilePath $uninstaller -ArgumentList '/silent' -Wait -ErrorAction SilentlyContinue
                }

                $appDir = Join-Path $env:LOCALAPPDATA 'Programs\Ollama'
                if (Test-Path $appDir) {
                    Remove-Item -Path $appDir -Recurse -Force -ErrorAction SilentlyContinue
                }
                Write-Host 'Ollama Removal Complete.'
            ";

            var encoded = EncodeScript(script);
            var result = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {encoded}", HttpContext.RequestAborted, 300000);

            lock (_progressLock)
            {
                _progress.Phase = "idle";
                _progress.Percent = 0;
                _progress.Message = "";
            }

            return Ok(new {
                success = true,
                message = "Ollama removal sequence executed.",
                output = result.StandardOutput + " " + result.StandardError
            });
        } catch (Exception ex) {
            _logger.LogError(ex, "Failed to execute Ollama removal.");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpPost("pull")]
    public async Task<IActionResult> PullModel([FromBody] ModelPullRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Model))
        {
            return BadRequest(new { success = false, message = "Model name is required (e.g. qwen2.5:0.5b)" });
        }

        try {
            _logger.LogInformation("Pulling Ollama model: {Model}", req.Model);

            string script = $"ollama pull {req.Model.Trim()}";
            var encoded = EncodeScript(script);
            var result = await _ps.ExecuteAsync($"-NoProfile -EncodedCommand {encoded}", HttpContext.RequestAborted, 600000);

            return Ok(new {
                success = result.ExitCode == 0 || result.StandardOutput.Contains("success"),
                message = result.ExitCode == 0 ? $"Model '{req.Model}' pulled successfully." : $"Pull completed for '{req.Model}'.",
                output = result.StandardOutput + " " + result.StandardError
            });
        } catch (Exception ex) {
            _logger.LogError(ex, "Error pulling Ollama model {Model}", req.Model);
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpDelete("model")]
    public async Task<IActionResult> DeleteModel([FromQuery] string model)
    {
        if (string.IsNullOrWhiteSpace(model))
        {
            return BadRequest(new { success = false, message = "Model name required" });
        }

        try {
            _logger.LogInformation("Removing Ollama model: {Model}", model);

            string script = $"ollama rm {model.Trim()}";
            var encoded = EncodeScript(script);
            var result = await _ps.ExecuteAsync($"-NoProfile -EncodedCommand {encoded}", HttpContext.RequestAborted, 60000);

            return Ok(new {
                success = true,
                message = $"Model '{model}' removed.",
                output = result.StandardOutput
            });
        } catch (Exception ex) {
            _logger.LogError(ex, "Error deleting Ollama model {Model}", model);
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}

public class ModelPullRequest
{
    public string Model { get; set; } = "";
}
