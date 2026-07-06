using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Nexus.Gateway.Services;

public class PowerShellExecutionService : IPowerShellExecutionService
{
    private readonly ILogger<PowerShellExecutionService> _logger;

    public PowerShellExecutionService(ILogger<PowerShellExecutionService> logger)
    {
        _logger = logger;
    }

    public async Task<PowerShellResult> ExecuteAsync(string arguments, CancellationToken cancellationToken = default, int timeoutMilliseconds = 300000)
    {
        _logger.LogInformation("Starting PowerShell execution with timeout {Timeout}ms", timeoutMilliseconds);

        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "powershell",
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        if (timeoutMilliseconds > 0)
        {
            cts.CancelAfter(timeoutMilliseconds);
        }

        try
        {
            process.Start();

            // Read output streams asynchronously to avoid blocking issues
            var outputTask = process.StandardOutput.ReadToEndAsync(cts.Token);
            var errorTask = process.StandardError.ReadToEndAsync(cts.Token);

            await process.WaitForExitAsync(cts.Token);

            var stdout = await outputTask;
            var stderr = await errorTask;

            return new PowerShellResult
            {
                ExitCode = process.ExitCode,
                StandardOutput = stdout,
                StandardError = stderr
            };
        }
        catch (OperationCanceledException ex)
        {
            _logger.LogError(ex, "PowerShell execution was canceled or timed out.");
            if (!process.HasExited)
            {
                try
                {
                    _logger.LogWarning("Killing process tree for PowerShell execution that exceeded timeout/cancellation.");
                    process.Kill(entireProcessTree: true);
                }
                catch (Exception killEx)
                {
                    _logger.LogError(killEx, "Error occurred while attempting to kill the PowerShell process tree.");
                }
            }
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during PowerShell process execution.");
            throw;
        }
    }
}
