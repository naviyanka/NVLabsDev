using System.Collections.Concurrent;
using System.Text;

namespace Nexus.Gateway.Services;

public class PluginJobState
{
    public string PluginId { get; set; } = string.Empty;
    public string ServerIp { get; set; } = string.Empty;
    public string Status { get; set; } = "Ready"; // Running, Completed, Stopped, Failed
    public StringBuilder Output { get; set; } = new();
    public CancellationTokenSource? Cts { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
}

public class PluginBackgroundJobManager
{
    private readonly PowerShellSessionManager _sessionManager;
    private readonly ILogger<PluginBackgroundJobManager> _logger;
    // Key: $"{pluginId}_{serverIp}"
    private readonly ConcurrentDictionary<string, PluginJobState> _jobs = new();

    public PluginBackgroundJobManager(PowerShellSessionManager sessionManager, ILogger<PluginBackgroundJobManager> logger)
    {
        _sessionManager = sessionManager;
        _logger = logger;
    }

    public PluginJobState GetOrCreateJobState(string pluginId, string serverIp)
    {
        var key = $"{pluginId}_{serverIp}";
        return _jobs.GetOrAdd(key, _ => new PluginJobState { PluginId = pluginId, ServerIp = serverIp });
    }

    public List<PluginJobState> GetJobsForPlugin(string pluginId)
    {
        return _jobs.Values.Where(j => j.PluginId == pluginId).ToList();
    }

    public void StartJob(string pluginId, string serverIp, string scriptType, string scriptContent)
    {
        var job = GetOrCreateJobState(pluginId, serverIp);
        if (job.Status == "Running" && job.Cts != null && !job.Cts.IsCancellationRequested)
        {
            // Already running
            return;
        }

        job.Status = "Running";
        job.Output.Clear();
        job.Output.AppendLine($"[{DateTime.UtcNow:HH:mm:ss}] Starting native PowerShell runspace session on {serverIp}...");
        job.StartTime = DateTime.UtcNow;
        job.EndTime = null;
        job.Cts = new CancellationTokenSource();

        var token = job.Cts.Token;

        _ = Task.Run(async () =>
        {
            string sessionId = string.Empty;
            try
            {
                string commandToRun;
                if (scriptType.ToLower() == "bat")
                {
                    var content = scriptContent.Replace("'", "''");
                    commandToRun = $@"
$tempFile = Join-Path $env:TEMP ""nexus_plugin_$([Guid]::NewGuid()).bat""
Set-Content -Path $tempFile -Value '{content}'
cmd.exe /c ""$tempFile"" 2>&1
Remove-Item $tempFile -ErrorAction SilentlyContinue
";
                }
                else if (scriptType.ToLower() == "vbs")
                {
                    var content = scriptContent.Replace("'", "''");
                    commandToRun = $@"
$tempFile = Join-Path $env:TEMP ""nexus_plugin_$([Guid]::NewGuid()).vbs""
Set-Content -Path $tempFile -Value '{content}'
cscript.exe //nologo ""$tempFile"" 2>&1
Remove-Item $tempFile -ErrorAction SilentlyContinue
";
                }
                else
                {
                    commandToRun = scriptContent;
                }

                sessionId = _sessionManager.CreateSession(serverIp);
                job.Output.AppendLine($"[{DateTime.UtcNow:HH:mm:ss}] Native session {sessionId} established. Executing script...");

                await foreach (var chunk in _sessionManager.ExecuteStreamAsync(sessionId, commandToRun, token))
                {
                    if (token.IsCancellationRequested) break;

                    if (chunk.StartsWith("OUT:"))
                    {
                        job.Output.AppendLine(chunk.Substring(4));
                    }
                    else if (chunk.StartsWith("ERR:"))
                    {
                        job.Output.AppendLine($"[ERROR] {chunk.Substring(4)}");
                    }
                    else
                    {
                        job.Output.AppendLine(chunk);
                    }
                }

                if (token.IsCancellationRequested)
                {
                    job.Status = "Stopped";
                    job.Output.AppendLine($"[{DateTime.UtcNow:HH:mm:ss}] Plugin execution stopped by user.");
                }
                else
                {
                    job.Status = "Completed";
                    job.Output.AppendLine($"[{DateTime.UtcNow:HH:mm:ss}] Plugin execution completed successfully.");
                }
            }
            catch (OperationCanceledException)
            {
                job.Status = "Stopped";
                job.Output.AppendLine($"[{DateTime.UtcNow:HH:mm:ss}] Plugin execution stopped by user.");
            }
            catch (Exception ex)
            {
                job.Status = "Failed";
                job.Output.AppendLine($"[{DateTime.UtcNow:HH:mm:ss}] [FAILED] {ex.Message}");
            }
            finally
            {
                job.EndTime = DateTime.UtcNow;
                if (!string.IsNullOrEmpty(sessionId))
                {
                    _sessionManager.DestroySession(sessionId);
                }
            }
        });
    }

    public void StopJob(string pluginId, string serverIp)
    {
        var key = $"{pluginId}_{serverIp}";
        if (_jobs.TryGetValue(key, out var job))
        {
            if (job.Status == "Running" && job.Cts != null)
            {
                job.Cts.Cancel();
                job.Status = "Stopped";
                job.Output.AppendLine($"[{DateTime.UtcNow:HH:mm:ss}] Stop command issued.");
            }
        }
    }

    public void StopAllJobsForPlugin(string pluginId)
    {
        foreach (var job in _jobs.Values.Where(j => j.PluginId == pluginId && j.Status == "Running"))
        {
            if (job.Cts != null)
            {
                job.Cts.Cancel();
                job.Status = "Stopped";
                job.Output.AppendLine($"[{DateTime.UtcNow:HH:mm:ss}] Stop command issued.");
            }
        }
    }
}
