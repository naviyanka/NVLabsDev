using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Services;
using System.Diagnostics;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace Nexus.Gateway.Controllers;

public class OllamaProgressState
{
    public string Phase { get; set; } = "idle"; // idle, downloading, installing, pulling, completed, failed
    public int Percent { get; set; } = 0;
    public long BytesDownloaded { get; set; } = 0;
    public long TotalBytes { get; set; } = 0;
    public string Message { get; set; } = "";
    public string ActiveModel { get; set; } = "";
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

    private static string ResolveOllamaExePath()
    {
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var userPath = Path.Combine(appData, "Programs", "Ollama", "ollama.exe");
        if (System.IO.File.Exists(userPath)) return userPath;

        var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        var pfPath = Path.Combine(programFiles, "Ollama", "ollama.exe");
        if (System.IO.File.Exists(pfPath)) return pfPath;

        return "ollama";
    }

    private static string EncodeScript(string script)
    {
        return Convert.ToBase64String(Encoding.Unicode.GetBytes(script));
    }

    private static bool IsLocalHost(string? ip)
    {
        if (string.IsNullOrWhiteSpace(ip)) return true;
        var clean = ip.Trim().ToLowerInvariant();
        return clean == "127.0.0.1" || clean == "localhost" || clean == "::1" || clean == "." || clean == "local";
    }

    private string WrapScript(string innerScript, string? targetIp)
    {
        if (IsLocalHost(targetIp)) return innerScript;
        return $"Invoke-Command -ComputerName {targetIp!.Trim()} -ScriptBlock {{ {innerScript} }}";
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus([FromQuery] string? serverIp = null)
    {
        bool isInstalled = false;
        bool isRunning = false;
        string version = "";
        var installedModels = new List<string>();

        bool isLocal = IsLocalHost(serverIp);

        if (isLocal)
        {
            var exePath = ResolveOllamaExePath();
            if (System.IO.File.Exists(exePath) || exePath == "ollama")
            {
                try {
                    var versionCheck = await _ps.ExecuteAsync($"-NoProfile -Command \"& '{exePath}' --version\"", HttpContext.RequestAborted, 5000);
                    if (versionCheck.ExitCode == 0 || versionCheck.StandardOutput.Contains("ollama", StringComparison.OrdinalIgnoreCase))
                    {
                        isInstalled = true;
                        version = versionCheck.StandardOutput.Trim();
                    }
                } catch { }

                if (!isInstalled && System.IO.File.Exists(exePath))
                {
                    isInstalled = true;
                    version = "Ollama Windows App";
                }
            }

            // Check REST Endpoint http://localhost:11434/api/tags
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
        }
        else
        {
            // Remote Host Check via WinRM
            try {
                string remoteScript = WrapScript("$ollama = Join-Path $env:LOCALAPPDATA 'Programs\\Ollama\\ollama.exe'; if (Test-Path $ollama) { & $ollama list } else { ollama list }", serverIp);
                var encoded = EncodeScript(remoteScript);
                var res = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {encoded}", HttpContext.RequestAborted, 10000);
                if (res.ExitCode == 0 && (res.StandardOutput.Contains("NAME", StringComparison.OrdinalIgnoreCase) || res.StandardOutput.Contains("ollama", StringComparison.OrdinalIgnoreCase)))
                {
                    isInstalled = true;
                    isRunning = true;
                    version = $"Ollama Remote ({serverIp})";
                    var lines = res.StandardOutput.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (var line in lines.Skip(1))
                    {
                        var parts = line.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length > 0 && !parts[0].StartsWith("NAME", StringComparison.OrdinalIgnoreCase))
                        {
                            installedModels.Add(parts[0]);
                        }
                    }
                }
            } catch { }
        }

        lock (_progressLock)
        {
            return Ok(new {
                isInstalled,
                isRunning,
                version,
                serverIp = string.IsNullOrWhiteSpace(serverIp) ? "127.0.0.1" : serverIp,
                installedModels = installedModels.Where(m => !string.IsNullOrEmpty(m)).Distinct().ToList(),
                pullingModel = _progress.Phase == "pulling" ? _progress.ActiveModel : null
            });
        }
    }

    [HttpGet("discover-models")]
    public async Task<IActionResult> DiscoverModels([FromQuery] string? baseUrl = null, [FromQuery] string? apiKey = null)
    {
        var models = new List<string>();
        string targetUrl = string.IsNullOrWhiteSpace(baseUrl) ? "http://localhost:11434/v1" : baseUrl.Trim().TrimEnd('/');
        
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(30);

            client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 NEXUS/1.0");

            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey.Trim());
            }

            // 1. Try standard OpenAI /v1/models endpoint
            var modelsUrl = targetUrl.EndsWith("/models", StringComparison.OrdinalIgnoreCase) ? targetUrl : $"{targetUrl}/models";
            var response = await client.GetAsync(modelsUrl, HttpCompletionOption.ResponseHeadersRead);

            if (response.IsSuccessStatusCode)
            {
                using var stream = await response.Content.ReadAsStreamAsync();
                using var doc = await JsonDocument.ParseAsync(stream);
                var root = doc.RootElement;

                if (root.TryGetProperty("data", out var dataArr) && dataArr.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in dataArr.EnumerateArray())
                    {
                        string? modelId = null;
                        if (item.TryGetProperty("id", out var idProp) && idProp.ValueKind == JsonValueKind.String)
                        {
                            modelId = idProp.GetString();
                        }
                        else if (item.TryGetProperty("name", out var nameProp) && nameProp.ValueKind == JsonValueKind.String)
                        {
                            modelId = nameProp.GetString();
                        }

                        if (!string.IsNullOrWhiteSpace(modelId)) models.Add(modelId.Trim());
                    }
                }
                else if (root.TryGetProperty("models", out var modelsArr) && modelsArr.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in modelsArr.EnumerateArray())
                    {
                        string? modelId = null;
                        if (item.TryGetProperty("name", out var nameProp) && nameProp.ValueKind == JsonValueKind.String)
                        {
                            modelId = nameProp.GetString();
                        }
                        else if (item.TryGetProperty("id", out var idProp) && idProp.ValueKind == JsonValueKind.String)
                        {
                            modelId = idProp.GetString();
                        }

                        if (!string.IsNullOrWhiteSpace(modelId)) models.Add(modelId.Trim());
                    }
                }
            }
            else
            {
                // 2. Try Ollama native /api/tags if /v1/models didn't work
                var rawBase = targetUrl.Replace("/v1", "");
                var tagsUrl = $"{rawBase}/api/tags";
                var tagsRes = await client.GetAsync(tagsUrl);
                if (tagsRes.IsSuccessStatusCode)
                {
                    using var stream = await tagsRes.Content.ReadAsStreamAsync();
                    using var doc = await JsonDocument.ParseAsync(stream);
                    if (doc.RootElement.TryGetProperty("models", out var modelsArr) && modelsArr.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in modelsArr.EnumerateArray())
                        {
                            if (item.TryGetProperty("name", out var nameProp) && nameProp.ValueKind == JsonValueKind.String)
                            {
                                var nameStr = nameProp.GetString();
                                if (!string.IsNullOrWhiteSpace(nameStr)) models.Add(nameStr.Trim());
                            }
                        }
                    }
                }
            }

            return Ok(new {
                success = true,
                count = models.Count,
                models = models.Distinct().ToList()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to discover models from {BaseUrl}", targetUrl);
            return Ok(new {
                success = false,
                message = ex.Message,
                models = new List<string>()
            });
        }
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
                message = _progress.Message,
                activeModel = _progress.ActiveModel
            });
        }
    }

    [HttpPost("install")]
    public IActionResult InstallOllama([FromQuery] string? serverIp = null)
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
            _progress.Message = $"Starting setup on target server {serverIp ?? "127.0.0.1"}...";
        }

        _ = Task.Run(async () =>
        {
            try
            {
                bool isLocal = IsLocalHost(serverIp);

                if (isLocal)
                {
                    string tempInstaller = Path.Combine(Path.GetTempPath(), "OllamaSetup.exe");
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
                                _progress.Message = "Installing Ollama via Winget...";
                            }

                            var wingetInstall = await _ps.ExecuteAsync("-NoProfile -ExecutionPolicy Bypass -Command \"winget install --id Ollama.Ollama -e --accept-package-agreements --accept-source-agreements --silent\"", CancellationToken.None, 300000);
                            if (wingetInstall.ExitCode == 0 || wingetInstall.StandardOutput.Contains("Successfully", StringComparison.OrdinalIgnoreCase))
                            {
                                wingetSuccess = true;
                            }
                        }
                    }
                    catch { }

                    if (!wingetSuccess)
                    {
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
                            lock (_progressLock) { _progress.TotalBytes = totalBytes; }

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

                    try
                    {
                        string exePath = ResolveOllamaExePath();
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = exePath,
                            Arguments = "apphost",
                            UseShellExecute = false,
                            CreateNoWindow = true
                        });
                    }
                    catch { }
                }
                else
                {
                    // Remote Target Server Installation via WinRM
                    lock (_progressLock)
                    {
                        _progress.Phase = "installing";
                        _progress.Percent = 30;
                        _progress.Message = $"Deploying Ollama on remote server {serverIp}...";
                    }

                    string remoteScript = @"
                        $ProgressPreference = 'SilentlyContinue'
                        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
                        $winget = Get-Command winget -ErrorAction SilentlyContinue
                        if ($winget) {
                            winget install --id Ollama.Ollama -e --accept-package-agreements --accept-source-agreements --silent
                        } else {
                            $installer = Join-Path $env:TEMP 'OllamaSetup.exe'
                            [System.Net.WebClient]::new().DownloadFile('https://ollama.com/download/OllamaSetup.exe', $installer)
                            Start-Process -FilePath $installer -ArgumentList '/silent' -Wait
                        }
                        $ollama = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'
                        if (Test-Path $ollama) {
                            Start-Process -FilePath $ollama -ArgumentList 'apphost' -WindowStyle Hidden -ErrorAction SilentlyContinue
                        } else {
                            Start-Process -FilePath 'ollama' -ArgumentList 'serve' -WindowStyle Hidden -ErrorAction SilentlyContinue
                        }
                    ";

                    string wrapped = WrapScript(remoteScript, serverIp);
                    var encoded = EncodeScript(wrapped);
                    await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {encoded}", CancellationToken.None, 600000);
                }

                lock (_progressLock)
                {
                    _progress.Phase = "completed";
                    _progress.Percent = 100;
                    _progress.Message = $"Ollama setup completed on {serverIp ?? "Local Target"}!";
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
    public async Task<IActionResult> UninstallOllama([FromQuery] string? serverIp = null)
    {
        try {
            _logger.LogInformation("Initiating Ollama Removal on target {ServerIp}...", serverIp ?? "Local");

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

            string wrapped = WrapScript(script, serverIp);
            var encoded = EncodeScript(wrapped);
            var result = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {encoded}", HttpContext.RequestAborted, 300000);

            lock (_progressLock)
            {
                _progress.Phase = "idle";
                _progress.Percent = 0;
                _progress.Message = "";
                _progress.ActiveModel = "";
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
    public IActionResult PullModel([FromBody] ModelPullRequest req, [FromQuery] string? serverIp = null)
    {
        if (string.IsNullOrWhiteSpace(req.Model))
        {
            return BadRequest(new { success = false, message = "Model name is required (e.g. qwen2.5:0.5b)" });
        }

        string modelName = req.Model.Trim();
        bool isLocal = IsLocalHost(serverIp);

        lock (_progressLock)
        {
            _progress.Phase = "pulling";
            _progress.Percent = 20;
            _progress.ActiveModel = modelName;
            _progress.Message = $"Downloading Ollama model '{modelName}' on {serverIp ?? "Local"}...";
        }

        _ = Task.Run(async () =>
        {
            try
            {
                if (isLocal)
                {
                    var exePath = ResolveOllamaExePath();
                    _logger.LogInformation("Pulling model {Model} using executable {ExePath}", modelName, exePath);

                    bool pullSuccess = false;
                    for (int attempt = 1; attempt <= 3; attempt++)
                    {
                        using var process = new Process
                        {
                            StartInfo = new ProcessStartInfo
                            {
                                FileName = exePath,
                                Arguments = $"pull {modelName}",
                                UseShellExecute = false,
                                CreateNoWindow = true,
                                RedirectStandardOutput = true,
                                RedirectStandardError = true
                            }
                        };

                        process.StartInfo.EnvironmentVariables["OLLAMA_KEEP_ALIVE"] = "24h";

                        process.Start();
                        await process.WaitForExitAsync();

                        if (process.ExitCode == 0)
                        {
                            pullSuccess = true;
                            break;
                        }

                        _logger.LogWarning("Pull attempt {Attempt} for {Model} exited with code {Code}. Retrying in 2 seconds...", attempt, modelName, process.ExitCode);
                        await Task.Delay(2000);
                    }

                    lock (_progressLock)
                    {
                        if (pullSuccess)
                        {
                            _progress.Phase = "completed";
                            _progress.Percent = 100;
                            _progress.Message = $"Model '{modelName}' downloaded successfully!";
                        }
                        else
                        {
                            _progress.Phase = "failed";
                            _progress.Message = $"Failed to download model '{modelName}' after 3 attempts.";
                        }
                    }
                }
                else
                {
                    string script = $"$ollama = Join-Path $env:LOCALAPPDATA 'Programs\\Ollama\\ollama.exe'; if (Test-Path $ollama) {{ & $ollama pull {modelName} }} else {{ ollama pull {modelName} }}";
                    string wrapped = WrapScript(script, serverIp);
                    var encoded = EncodeScript(wrapped);
                    await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {encoded}", CancellationToken.None, 600000);

                    lock (_progressLock)
                    {
                        _progress.Phase = "completed";
                        _progress.Percent = 100;
                        _progress.Message = $"Model '{modelName}' downloaded on {serverIp}!";
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error pulling model {Model}", modelName);
                lock (_progressLock)
                {
                    _progress.Phase = "failed";
                    _progress.Message = $"Failed to pull model '{modelName}': {ex.Message}";
                }
            }
        });

        return Ok(new {
            success = true,
            message = $"Model pull task for '{modelName}' started in background.",
            model = modelName
        });
    }

    [HttpDelete("model")]
    public async Task<IActionResult> DeleteModel([FromQuery] string model, [FromQuery] string? serverIp = null)
    {
        if (string.IsNullOrWhiteSpace(model))
        {
            return BadRequest(new { success = false, message = "Model name required" });
        }

        try {
            string modelName = model.Trim();
            _logger.LogInformation("Removing Ollama model: {Model} on {ServerIp}", modelName, serverIp ?? "Local");

            bool isLocal = IsLocalHost(serverIp);
            if (isLocal)
            {
                var exePath = ResolveOllamaExePath();
                using var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = exePath,
                        Arguments = $"rm {modelName}",
                        UseShellExecute = false,
                        CreateNoWindow = true
                    }
                };
                process.Start();
                await process.WaitForExitAsync();
            }
            else
            {
                string script = $"$ollama = Join-Path $env:LOCALAPPDATA 'Programs\\Ollama\\ollama.exe'; if (Test-Path $ollama) {{ & $ollama rm {modelName} }} else {{ ollama rm {modelName} }}";
                string wrapped = WrapScript(script, serverIp);
                var encoded = EncodeScript(wrapped);
                await _ps.ExecuteAsync($"-NoProfile -EncodedCommand {encoded}", HttpContext.RequestAborted, 60000);
            }

            return Ok(new {
                success = true,
                message = $"Model '{modelName}' removed.",
                output = "Model deleted successfully."
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
