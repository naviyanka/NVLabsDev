using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Services;
using System.Diagnostics;
using System.Net.Http.Json;
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

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        bool isInstalled = false;
        bool isRunning = false;
        string version = "";
        var installedModels = new List<string>();

        // 1. Check if ollama CLI is available or installed
        try {
            var versionCheck = await _ps.ExecuteAsync("-NoProfile -Command \"ollama --version\"", HttpContext.RequestAborted, 10000);
            if (versionCheck.ExitCode == 0 && versionCheck.StandardOutput.Contains("ollama"))
            {
                isInstalled = true;
                version = versionCheck.StandardOutput.Trim();
            }
        } catch {
            // Check default installation path
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
            _logger.LogInformation("Attempting One-Click Ollama Installation on Windows...");
            
            // Script: Try Winget first, fallback to downloading installer
            string psScript = @"
                $ProgressPreference = 'SilentlyContinue'
                $winget = Get-Command winget -ErrorAction SilentlyContinue
                if ($winget) {
                    Write-Host 'Installing Ollama via Winget...'
                    winget install --id Ollama.Ollama -e --accept-package-agreements --accept-source-agreements --silent
                } else {
                    Write-Host 'Winget not found. Downloading OllamaSetup.exe...'
                    $installerPath = Join-Path $env:TEMP 'OllamaSetup.exe'
                    Invoke-WebRequest -Uri 'https://ollama.com/download/OllamaSetup.exe' -OutFile $installerPath
                    Start-Process -FilePath $installerPath -ArgumentList '/silent' -Wait
                }
                
                # Start Ollama service/app in background if needed
                Start-Process -FilePath 'ollama' -ArgumentList 'serve' -WindowStyle Hidden -ErrorAction SilentlyContinue
            ";

            var result = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -Command \"{psScript.Replace("\"", "\\\"").Replace("\r\n", " ")}\"", HttpContext.RequestAborted, 600000);
            
            return Ok(new { 
                success = result.ExitCode == 0, 
                message = result.ExitCode == 0 ? "Ollama installation sequence initiated successfully." : "Ollama installation returned warnings/error.",
                output = result.StandardOutput + " " + result.StandardError
            });
        } catch (Exception ex) {
            _logger.LogError(ex, "Failed to execute Ollama installer.");
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
            
            var result = await _ps.ExecuteAsync($"-NoProfile -Command \"ollama pull {req.Model.Trim()}\"", HttpContext.RequestAborted, 600000);

            return Ok(new {
                success = result.ExitCode == 0,
                message = result.ExitCode == 0 ? $"Model '{req.Model}' pulled successfully." : $"Failed to pull model '{req.Model}'.",
                output = result.StandardOutput + " " + result.StandardError
            });
        } catch (Exception ex) {
            _logger.LogError(ex, "Error pulling Ollama model {Model}", req.Model);
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}

public class ModelPullRequest
{
    public string Model { get; set; } = "";
}
