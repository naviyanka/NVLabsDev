using System.Collections.Concurrent;
using System.Text;
using Microsoft.Extensions.DependencyInjection;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;

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
    public string ScriptType { get; set; } = string.Empty;
    public string ScriptContent { get; set; } = string.Empty;
    public int JobId { get; set; }
    public string LogFilePath { get; set; } = string.Empty;
}

public class PluginBackgroundJobManager
{
    private readonly PowerShellSessionManager _sessionManager;
    private readonly ILogger<PluginBackgroundJobManager> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    // Key: $"{pluginId}_{serverIp}"
    private readonly ConcurrentDictionary<string, PluginJobState> _jobs = new();

    public PluginBackgroundJobManager(PowerShellSessionManager sessionManager, ILogger<PluginBackgroundJobManager> logger, IServiceScopeFactory scopeFactory)
    {
        _sessionManager = sessionManager;
        _logger = logger;
        _scopeFactory = scopeFactory;
        
        var logDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data", "JobLogs");
        if (!Directory.Exists(logDir)) Directory.CreateDirectory(logDir);
    }

    private void LogToFileAndOutput(PluginJobState job, string line)
    {
        job.Output.AppendLine(line);
        try { File.AppendAllText(job.LogFilePath, line + Environment.NewLine); } catch { }
    }
    
    private void UpdateDbStatus(int jobId, string status, DateTime? endTime = null)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NexusContext>();
        var dbJob = db.BackgroundJobs.Find(jobId);
        if (dbJob != null) {
            dbJob.Status = status;
            if (endTime.HasValue) dbJob.EndTime = endTime.Value;
            db.SaveChanges();
        }
    }

    public PluginJobState GetOrCreateJobState(string pluginId, string serverIp)
    {
        var key = $"{pluginId}_{serverIp}";
        return _jobs.GetOrAdd(key, _ => new PluginJobState { PluginId = pluginId, ServerIp = serverIp });
    }

    public List<BackgroundJob> GetAllJobs()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NexusContext>();
        return db.BackgroundJobs.OrderByDescending(j => j.StartTime).ToList();
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
            return;
        }

        job.ScriptType = scriptType;
        job.ScriptContent = scriptContent;
        job.Status = "Running";
        job.Output.Clear();
        
        var logDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data", "JobLogs");
        job.LogFilePath = Path.Combine(logDir, $"{pluginId}_{serverIp.Replace(":", "_").Replace(".", "_")}_{DateTime.UtcNow.Ticks}.log");

        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<NexusContext>();
            var dbJob = new BackgroundJob
            {
                PluginId = pluginId,
                ServerIp = serverIp,
                Status = "Running",
                StartTime = DateTime.UtcNow,
                ScriptType = scriptType,
                ScriptContent = scriptContent,
                LogFilePath = job.LogFilePath
            };
            db.BackgroundJobs.Add(dbJob);
            db.SaveChanges();
            job.JobId = dbJob.Id;
        }

        LogToFileAndOutput(job, $"[{DateTime.UtcNow:HH:mm:ss}] Starting native PowerShell runspace session on {serverIp}...");
        job.StartTime = DateTime.UtcNow;
        job.EndTime = null;
        job.Cts?.Dispose();
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
                LogToFileAndOutput(job, $"[{DateTime.UtcNow:HH:mm:ss}] Native session {sessionId} established. Executing script...");

                await foreach (var chunk in _sessionManager.ExecuteStreamAsync(sessionId, commandToRun, token))
                {
                    if (token.IsCancellationRequested) break;

                    if (chunk.StartsWith("OUT:"))
                    {
                        LogToFileAndOutput(job, chunk.Substring(4));
                    }
                    else if (chunk.StartsWith("ERR:"))
                    {
                        LogToFileAndOutput(job, $"[ERROR] {chunk.Substring(4)}");
                    }
                    else
                    {
                        LogToFileAndOutput(job, chunk);
                    }
                }

                if (token.IsCancellationRequested)
                {
                    job.Status = "Stopped";
                    LogToFileAndOutput(job, $"[{DateTime.UtcNow:HH:mm:ss}] Plugin execution stopped by user.");
                }
                else
                {
                    job.Status = "Completed";
                    LogToFileAndOutput(job, $"[{DateTime.UtcNow:HH:mm:ss}] Plugin execution completed successfully.");
                }
            }
            catch (OperationCanceledException)
            {
                job.Status = "Stopped";
                LogToFileAndOutput(job, $"[{DateTime.UtcNow:HH:mm:ss}] Plugin execution stopped by user.");
            }
            catch (Exception ex)
            {
                job.Status = "Failed";
                LogToFileAndOutput(job, $"[{DateTime.UtcNow:HH:mm:ss}] [FAILED] {ex.Message}");
            }
            finally
            {
                job.EndTime = DateTime.UtcNow;
                if (!string.IsNullOrEmpty(sessionId))
                {
                    _sessionManager.DestroySession(sessionId);
                }
                job.Cts?.Dispose();
                job.Cts = null;
                UpdateDbStatus(job.JobId, job.Status, job.EndTime);
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
                LogToFileAndOutput(job, $"[{DateTime.UtcNow:HH:mm:ss}] Stop command issued.");
                UpdateDbStatus(job.JobId, job.Status, DateTime.UtcNow);
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
                LogToFileAndOutput(job, $"[{DateTime.UtcNow:HH:mm:ss}] Stop command issued.");
                UpdateDbStatus(job.JobId, job.Status, DateTime.UtcNow);
            }
        }
    }

    public void RetryJob(string pluginId, string serverIp)
    {
        var key = $"{pluginId}_{serverIp}";
        if (_jobs.TryGetValue(key, out var job))
        {
            if (job.Status != "Running" && !string.IsNullOrEmpty(job.ScriptContent))
            {
                StartJob(pluginId, serverIp, job.ScriptType, job.ScriptContent);
            }
        }
    }
}
