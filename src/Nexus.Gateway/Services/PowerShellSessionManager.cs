using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using System.Threading.Channels;
using System.Management.Automation;
using System.Management.Automation.Runspaces;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;

namespace Nexus.Gateway.Services;

/// <summary>
/// Manages persistent PowerShell sessions using the native System.Management.Automation SDK.
/// This avoids spawning external powershell.exe processes entirely, running PS inside the Gateway.
/// </summary>
public class PowerShellSessionManager : IDisposable
{
    private readonly ILogger<PowerShellSessionManager> _logger;
    private readonly ConcurrentDictionary<string, PsSession> _sessions = new();
    private readonly Timer _cleanupTimer;
    private readonly IPowerShellExecutionService _executionService;

    private readonly int _maxConcurrentSessions;
    private readonly int _idleTimeoutMinutes;
    private readonly int _cleanupIntervalMinutes;

    public PowerShellSessionManager(ILogger<PowerShellSessionManager> logger, IPowerShellExecutionService executionService, IConfiguration configuration)
    {
        _logger = logger;
        _executionService = executionService;

        _maxConcurrentSessions = configuration.GetValue("PowerShell:MaxConcurrentSessions", 20);
        _idleTimeoutMinutes = configuration.GetValue("PowerShell:IdleTimeoutMinutes", 30);
        _cleanupIntervalMinutes = configuration.GetValue("PowerShell:CleanupIntervalMinutes", 5);

        _logger.LogInformation(
            "PowerShell session manager initialized: MaxSessions={Max}, IdleTimeout={Timeout}min, CleanupInterval={Interval}min",
            _maxConcurrentSessions, _idleTimeoutMinutes, _cleanupIntervalMinutes);

        _cleanupTimer = new Timer(
            CleanupIdleSessions,
            null,
            TimeSpan.FromMinutes(_cleanupIntervalMinutes),
            TimeSpan.FromMinutes(_cleanupIntervalMinutes));
    }

    private class PsSession : IDisposable
    {
        public PowerShell PowerShell { get; }
        public Runspace Runspace { get; }
        public string ServerId { get; }
        public SemaphoreSlim Lock { get; } = new(1, 1);
        public DateTime LastUsed { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; } = DateTime.UtcNow;

        public PsSession(string serverId, IPowerShellExecutionService executionService, ILogger logger)
        {
            ServerId = serverId;

            try
            {
                if (string.IsNullOrEmpty(serverId) || 
                    serverId.Equals("localhost", StringComparison.OrdinalIgnoreCase) || 
                    serverId.Equals("127.0.0.1") || 
                    serverId.Equals("::1") || 
                    serverId.Equals(Environment.MachineName, StringComparison.OrdinalIgnoreCase))
                {
                    Runspace = RunspaceFactory.CreateRunspace();
                }
                else
                {
                    // Always use WSManConnectionInfo to ensure each session gets a distinct wsmprovhost.exe process.
                    // This prevents in-process runspaces from sharing the Gateway's PID.
                    var connectionInfo = new WSManConnectionInfo
                    {
                        ComputerName = serverId
                    };
                    
                    Runspace = RunspaceFactory.CreateRunspace(connectionInfo);
                }
                Runspace.Open();
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to open Runspace via WSMan to {ServerId}. Attempting to bootstrap WinRM via WMI...", serverId);
                
                // Bootstrap WinRM using WMI/CIM over DCOM using the local PowerShellExecutionService
                // This command invokes a process on the remote machine to execute winrm quickconfig
                var bootstrapCmd = $"Invoke-CimMethod -ComputerName '{serverId}' -ClassName Win32_Process -MethodName Create -Arguments @{{CommandLine='powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \"Enable-PSRemoting -SkipNetworkProfileCheck -Force\"'}}";
                var result = executionService.ExecuteAsync(bootstrapCmd).GetAwaiter().GetResult();
                
                if (result.ExitCode == 0)
                {
                    logger.LogInformation("Successfully bootstrapped WinRM on {ServerId}. Retrying Runspace connection...", serverId);
                    Thread.Sleep(3000); // Wait for WinRM service to start
                    var connectionInfo = new WSManConnectionInfo { ComputerName = serverId };
                    Runspace = RunspaceFactory.CreateRunspace(connectionInfo);
                    Runspace.Open();
                }
                else
                {
                    throw new Exception($"Failed to bootstrap WinRM on {serverId}. Exit Code: {result.ExitCode}. Error: {result.StandardError}", ex);
                }
            }
            
            PowerShell = PowerShell.Create();
            PowerShell.Runspace = Runspace;
        }

        public void Dispose()
        {
            try { PowerShell.Dispose(); } catch { }
            try { Runspace.Dispose(); } catch { }
            try { Lock.Dispose(); } catch { }
        }
    }

    public string CreateSession(string serverId)
    {
        if (_sessions.Count >= _maxConcurrentSessions)
        {
            _logger.LogWarning("Max concurrent sessions ({Max}) reached. Rejecting new session for {Server}.", _maxConcurrentSessions, serverId);
            throw new InvalidOperationException($"Maximum concurrent sessions ({_maxConcurrentSessions}) reached. Please close existing sessions before creating new ones.");
        }

        var sessionId = Guid.NewGuid().ToString("N")[..12];
        var session = new PsSession(serverId, _executionService, _logger);
        _sessions[sessionId] = session;

        _logger.LogInformation("Native PS runspace {Id} created for {Server}. Active sessions: {Count}/{Max}", sessionId, serverId, _sessions.Count, _maxConcurrentSessions);
        return sessionId;
    }

        // Block dangerous commands that could escape the intended PS session scope
        private static readonly string[] BlockedPatterns = new[]
        {
            @"\bInvoke-Expression\b", @"\bIEX\b", @"\bInvoke-WebRequest\b", @"\bInvoke-RestMethod\b",
            @"\bStart-Job\b", @"\bRegister-ScheduledTask\b",
            @"\bNew-Item\s+HKLM:", @"\bRemove-Item\b.*-Recurse\b.*-Force\b",
            @"\bFormat-Table\b.*\|\s*Out-File\b", @"\bSet-Content\b", @"\bAdd-Content\b",
            @"\bInvoke-Command\b", @"\bEnter-PSSession\b", @"\bNew-PSSession\b",
            @"\bInvoke-WmiMethod\b", @"\bInvoke-CimMethod\b",
            @"\[System\.Net\.WebClient\]",
            @"\bDownloadString\b", @"\bDownloadFile\b",
            @"\bcertutil\b", @"\bbitsadmin\b"
        };

        private static bool ContainsBlockedCommand(string command)
        {
            foreach (var pattern in BlockedPatterns)
            {
                if (Regex.IsMatch(command, pattern, RegexOptions.IgnoreCase))
                    return true;
            }
            return false;
        }

        public async IAsyncEnumerable<string> ExecuteStreamAsync(string sessionId, string command, [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            if (!_sessions.TryGetValue(sessionId, out var session))
            {
                yield return $"ERR:Session '{sessionId}' not found.";
                yield break;
            }

            // Block dangerous commands before execution
            if (ContainsBlockedCommand(command))
            {
                yield return $"ERR:Command blocked — contains disallowed operation.";
                yield break;
            }

            await session.Lock.WaitAsync(cancellationToken);
            var channel = Channel.CreateUnbounded<string>();
            EventHandler<DataAddedEventArgs>? errorHandler = null;

            try
            {
                session.LastUsed = DateTime.UtcNow;
                session.PowerShell.Commands.Clear();
                session.PowerShell.AddScript(command);
                session.PowerShell.AddCommand("Out-String").AddParameter("Stream", true);

                var outputBuffer = new PSDataCollection<PSObject>();
                outputBuffer.DataAdded += (s, e) =>
                {
                    var item = outputBuffer[e.Index];
                    if (item != null)
                        channel.Writer.TryWrite("OUT:" + item.ToString());
                };

                errorHandler = (s, e) =>
                {
                    var item = session.PowerShell.Streams.Error[e.Index];
                    if (item != null)
                        channel.Writer.TryWrite("ERR:" + item.ToString());
                };
                session.PowerShell.Streams.Error.DataAdded += errorHandler;

                var asyncResult = session.PowerShell.BeginInvoke<PSObject, PSObject>(null, outputBuffer);

                _ = Task.Run(async () =>
                {
                    try 
                    { 
                        // Optional delay/timeout can be added here if needed
                        await Task.Factory.FromAsync(asyncResult, _ => { }); 
                        session.PowerShell.EndInvoke(asyncResult); 
                    }
                    catch (Exception ex)
                    {
                        channel.Writer.TryWrite("ERR:" + ex.Message);
                    }
                    finally
                    {
                        channel.Writer.TryComplete();
                    }
                }, cancellationToken);

                await foreach (var item in channel.Reader.ReadAllAsync(cancellationToken))
                {
                    yield return item;
                }
            }
            finally
            {
                if (errorHandler != null)
                    session.PowerShell.Streams.Error.DataAdded -= errorHandler;
                session.PowerShell.Streams.Error.Clear();
                session.Lock.Release();
            }
        }

    public void DestroySession(string sessionId)
    {
        if (_sessions.TryRemove(sessionId, out var session))
        {
            var duration = DateTime.UtcNow - session.CreatedAt;
            session.Dispose();
            _logger.LogInformation("Destroyed native PS session {Id} for {Server}. Lifetime: {Duration}. Remaining: {Count}", sessionId, session.ServerId, duration, _sessions.Count);
        }
    }

    public bool SessionExists(string sessionId)
    {
        return _sessions.ContainsKey(sessionId);
    }

    private void CleanupIdleSessions(object? state)
    {
        var cutoff = DateTime.UtcNow.AddMinutes(-_idleTimeoutMinutes);
        var cleanedCount = 0;
        foreach (var kvp in _sessions)
        {
            if (kvp.Value.LastUsed < cutoff)
            {
                if (_sessions.TryRemove(kvp.Key, out var s))
                {
                    var duration = DateTime.UtcNow - s.CreatedAt;
                    s.Dispose();
                    cleanedCount++;
                    _logger.LogInformation("Cleaned idle native PS session {Id} for {Server}. Idle for >{Timeout}min. Lifetime: {Duration}", kvp.Key, s.ServerId, _idleTimeoutMinutes, duration);
                }
            }
        }

        if (cleanedCount > 0)
        {
            _logger.LogInformation("Session cleanup complete: removed {Cleaned} idle sessions. Remaining: {Count}", cleanedCount, _sessions.Count);
        }
    }

    /// <summary>
    /// Force cleanup of all expired/idle sessions regardless of the timer schedule.
    /// Returns the number of sessions cleaned up.
    /// </summary>
    public int ForceCleanupExpiredSessions()
    {
        var cutoff = DateTime.UtcNow.AddMinutes(-_idleTimeoutMinutes);
        var cleanedCount = 0;
        foreach (var kvp in _sessions)
        {
            if (kvp.Value.LastUsed < cutoff)
            {
                if (_sessions.TryRemove(kvp.Key, out var s))
                {
                    s.Dispose();
                    cleanedCount++;
                    _logger.LogInformation("Force-cleaned expired PS session {Id} for {Server}", kvp.Key, s.ServerId);
                }
            }
        }

        _logger.LogInformation("Force cleanup complete: removed {Cleaned} expired sessions. Remaining: {Count}", cleanedCount, _sessions.Count);
        return cleanedCount;
    }

    /// <summary>
    /// Returns metadata about all active sessions for monitoring purposes.
    /// </summary>
    public IReadOnlyList<SessionInfo> GetActiveSessions()
    {
        return _sessions.Select(kvp => new SessionInfo
        {
            SessionId = kvp.Key,
            ServerId = kvp.Value.ServerId,
            LastUsed = kvp.Value.LastUsed,
            CreatedAt = kvp.Value.CreatedAt
        }).ToList().AsReadOnly();
    }

    public class SessionInfo
    {
        public string SessionId { get; set; } = string.Empty;
        public string ServerId { get; set; } = string.Empty;
        public DateTime LastUsed { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public void Dispose()
    {
        _cleanupTimer.Dispose();
        foreach (var kvp in _sessions)
        {
            kvp.Value.Dispose();
        }
        _sessions.Clear();
    }
}
