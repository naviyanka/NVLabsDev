using System.Threading;
using System.Threading.Tasks;

namespace Nexus.Gateway.Services;

public class PowerShellResult
{
    public int ExitCode { get; set; }
    public string StandardOutput { get; set; } = string.Empty;
    public string StandardError { get; set; } = string.Empty;
}

public interface IPowerShellExecutionService
{
    Task<PowerShellResult> ExecuteAsync(string arguments, CancellationToken cancellationToken = default, int timeoutMilliseconds = 300000);
}
