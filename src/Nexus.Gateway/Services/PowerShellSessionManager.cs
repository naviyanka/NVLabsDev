using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using System.Threading.Channels;
using System.Management.Automation;
using System.Management.Automation.Runspaces;

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

    public PowerShellSessionManager(ILogger<PowerShellSessionManager> logger, IPowerShellExecutionService executionService)
    {
        _logger = logger;
        _executionService = executionService;
        _cleanupTimer = new Timer(CleanupIdleSessions, null, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(5));
    }

    private class PsSession : IDisposable
    {
        public PowerShell PowerShell { get; }
        public Runspace Runspace { get; }
        public string ServerId { get; }
        public SemaphoreSlim Lock { get; } = new(1, 1);
        public DateTime LastUsed { get; set; } = DateTime.UtcNow;

        public PsSession(string serverId, IPowerShellExecutionService executionService, ILogger logger)
        {
            ServerId = serverId;

            try
            {
                // Always use WSManConnectionInfo to ensure each session gets a distinct wsmprovhost.exe process.
                // This prevents in-process runspaces from sharing the Gateway's PID.
                var connectionInfo = new WSManConnectionInfo
                {
                    ComputerName = serverId
                };
                
                Runspace = RunspaceFactory.CreateRunspace(connectionInfo);
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
        var sessionId = Guid.NewGuid().ToString("N")[..12];
        var session = new PsSession(serverId, _executionService, _logger);
        _sessions[sessionId] = session;

        _logger.LogInformation("Native PS runspace {Id} created for {Server}", sessionId, serverId);
        return sessionId;
    }

        public async IAsyncEnumerable<string> ExecuteStreamAsync(string sessionId, string command, [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            if (!_sessions.TryGetValue(sessionId, out var session))
            {
                yield return $"ERR:Session '{sessionId}' not found.";
                yield break;
            }

            await session.Lock.WaitAsync(cancellationToken);
            var channel = Channel.CreateUnbounded<string>();
            EventHandler<DataAddedEventArgs>? errorHandler = null;

            try
            {
                session.LastUsed = DateTime.UtcNow;
                session.PowerShell.Commands.Clear();
                session.PowerShell.AddScript($". {{ {command} }} | Out-String -Stream");

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
            session.Dispose();
            _logger.LogInformation("Destroyed native PS session {Id}", sessionId);
        }
    }

    public bool SessionExists(string sessionId)
    {
        return _sessions.ContainsKey(sessionId);
    }

    private void CleanupIdleSessions(object? state)
    {
        var cutoff = DateTime.UtcNow.AddMinutes(-30);
        foreach (var kvp in _sessions)
        {
            if (kvp.Value.LastUsed < cutoff)
            {
                if (_sessions.TryRemove(kvp.Key, out var s))
                {
                    s.Dispose();
                    _logger.LogInformation("Cleaned idle native PS session {Id}", kvp.Key);
                }
            }
        }
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
