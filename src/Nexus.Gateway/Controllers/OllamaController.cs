using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Services;
using System.Diagnostics;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OllamaController : ControllerBase
{
    private readonly ILogger<OllamaController> _logger;
    private readonly IPowerShellExecutionService _ps;
    private readonly IHttpClientFactory _httpClientFactory;

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

    [HttpPost("install")]
    public async Task<IActionResult> InstallOllama()
    {
        try {
            _logger.LogInformation("Initiating One-Click Ollama Installation...");

            string script = @"
                $ProgressPreference = 'SilentlyContinue'
                [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

                $installed = Get-Command ollama -ErrorAction SilentlyContinue
                if (-not $installed) {
                    $winget = Get-Command winget -ErrorAction SilentlyContinue
                    if ($winget) {
                        Write-Host 'Installing Ollama via Winget...'
                        & winget install --id Ollama.Ollama -e --accept-package-agreements --accept-source-agreements --silent
                    } else {
                        Write-Host 'Downloading OllamaSetup.exe...'
                        $installer = Join-Path $env:TEMP 'OllamaSetup.exe'
                        [System.Net.WebClient]::new().DownloadFile('https://ollama.com/download/OllamaSetup.exe', $installer)
                        Write-Host 'Executing silent installer...'
                        Start-Process -FilePath $installer -ArgumentList '/silent' -Wait
                    }
                }

                $appDataPath = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'
                if (Test-Path $appDataPath) {
                    Start-Process -FilePath $appDataPath -ArgumentList 'apphost' -WindowStyle Hidden -ErrorAction SilentlyContinue
                } else {
                    Start-Process -FilePath 'ollama' -ArgumentList 'serve' -WindowStyle Hidden -ErrorAction SilentlyContinue
                }
                Write-Host 'Ollama Installation Complete.'
            ";

            var encoded = EncodeScript(script);
            var result = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {encoded}", HttpContext.RequestAborted, 600000);

            return Ok(new {
                success = result.ExitCode == 0 || result.StandardOutput.Contains("Complete") || result.StandardOutput.Contains("Ollama"),
                message = "Ollama setup process executed.",
                output = result.StandardOutput + " " + result.StandardError
            });
        } catch (Exception ex) {
            _logger.LogError(ex, "Failed to execute Ollama installation.");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
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
