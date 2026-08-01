using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CopilotController : ControllerBase
{
    private readonly NexusContext _db;

    public CopilotController(NexusContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Generates a PowerShell command from natural language input with safety classification.
    /// This is a local heuristic-based generator (no external LLM call required).
    /// For advanced generation, use the Copilot Drawer which calls the configured AI provider.
    /// </summary>
    [HttpPost("generate-command")]
    public Task<IActionResult> GenerateCommand([FromBody] GenerateCommandRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Prompt))
            return Task.FromResult<IActionResult>(BadRequest(new { message = "Prompt is required." }));

        var prompt = request.Prompt.Trim().ToLowerInvariant();
        var serverContext = request.ServerIp ?? "localhost";

        // Pattern-based NL→PS mapping with safety classification
        var (command, safety, description) = MapToCommand(prompt, serverContext);

        if (string.IsNullOrEmpty(command))
        {
            return Task.FromResult<IActionResult>(Ok(new
            {
                command = "",
                safety = "unknown",
                description = "Could not generate a command from that prompt. Try being more specific (e.g., 'show stopped auto-start services').",
                generated = false
            }));
        }

        return Task.FromResult<IActionResult>(Ok(new
        {
            command,
            safety,
            description,
            generated = true,
            serverIp = serverContext
        }));
    }

    [HttpGet("baselines")]
    public async Task<IActionResult> GetBaselines([FromQuery] string? serverIp = null)
    {
        var query = _db.ServerBaselines.AsQueryable();
        if (!string.IsNullOrWhiteSpace(serverIp))
            query = query.Where(b => b.ServerIp == serverIp);

        var baselines = await query.OrderByDescending(b => b.CalculatedAt).Take(100).ToListAsync();
        return Ok(baselines);
    }

    [HttpGet("anomalies")]
    public async Task<IActionResult> GetRecentAnomalies()
    {
        // Return recent anomaly notifications (last 24h)
        var cutoff = DateTime.UtcNow.AddHours(-24);
        var anomalies = await _db.Notifications
            .Where(n => n.Message.Contains("Anomaly") && n.Timestamp >= cutoff)
            .OrderByDescending(n => n.Timestamp)
            .Take(50)
            .ToListAsync();

        return Ok(anomalies);
    }

    private static (string command, string safety, string description) MapToCommand(string prompt, string server)
    {
        // Services
        if (prompt.Contains("stopped") && prompt.Contains("service") && (prompt.Contains("auto") || prompt.Contains("automatic")))
            return ("Get-Service | Where-Object { $_.Status -eq 'Stopped' -and $_.StartType -eq 'Automatic' } | Select-Object Name, DisplayName, Status", "safe", "List services that are stopped but configured to auto-start");

        if (prompt.Contains("running service") || (prompt.Contains("service") && prompt.Contains("running")))
            return ("Get-Service | Where-Object Status -eq 'Running' | Select-Object Name, DisplayName, StartType", "safe", "List all running services");

        if (prompt.Contains("restart") && prompt.Contains("service") && !prompt.Contains("all"))
            return ("# Specify service name:\nRestart-Service -Name 'ServiceName' -Force", "destructive", "Restart a specific service (modify ServiceName)");

        if (prompt.Contains("stop") && prompt.Contains("service"))
            return ("# Specify service name:\nStop-Service -Name 'ServiceName' -Force", "destructive", "Stop a specific service");

        // Processes
        if (prompt.Contains("top") && (prompt.Contains("cpu") || prompt.Contains("process")))
            return ("Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name, Id, @{N='CPU_Sec';E={[math]::Round($_.CPU,1)}}, @{N='RAM_MB';E={[math]::Round($_.WorkingSet64/1MB,1)}}", "safe", "Top 10 processes by CPU time");

        if (prompt.Contains("top") && prompt.Contains("memory"))
            return ("Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 10 Name, Id, @{N='RAM_MB';E={[math]::Round($_.WorkingSet64/1MB,1)}}", "safe", "Top 10 processes by memory usage");

        if (prompt.Contains("kill") || (prompt.Contains("stop") && prompt.Contains("process")))
            return ("# Specify process name or ID:\nStop-Process -Name 'ProcessName' -Force", "destructive", "Kill a process (modify ProcessName)");

        // Disk / Storage
        if (prompt.Contains("disk") && (prompt.Contains("space") || prompt.Contains("free") || prompt.Contains("usage")))
            return ("Get-Volume | Select-Object DriveLetter, FileSystemLabel, @{N='Size_GB';E={[math]::Round($_.Size/1GB,1)}}, @{N='Free_GB';E={[math]::Round($_.SizeRemaining/1GB,1)}}, @{N='Used_%';E={[math]::Round(($_.Size-$_.SizeRemaining)/$_.Size*100,1)}}", "safe", "Show disk volumes with usage percentages");

        if (prompt.Contains("large file") || prompt.Contains("biggest file"))
            return ("Get-ChildItem C:\\ -Recurse -File -ErrorAction SilentlyContinue | Sort-Object Length -Descending | Select-Object -First 20 @{N='Size_MB';E={[math]::Round($_.Length/1MB,1)}}, FullName", "safe", "Find the 20 largest files on C: drive");

        // Network
        if (prompt.Contains("ip") && (prompt.Contains("address") || prompt.Contains("config")))
            return ("Get-NetIPAddress -AddressFamily IPv4 | Where-Object IPAddress -notlike '127.*' | Select-Object InterfaceAlias, IPAddress, PrefixLength", "safe", "Show IPv4 network interface addresses");

        if (prompt.Contains("port") && (prompt.Contains("listen") || prompt.Contains("open")))
            return ("Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess | Sort-Object LocalPort", "safe", "List all listening TCP ports");

        if (prompt.Contains("connection") && (prompt.Contains("active") || prompt.Contains("established")))
            return ("Get-NetTCPConnection -State Established | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort | Sort-Object RemoteAddress", "safe", "Show active network connections");

        // Users & Security
        if (prompt.Contains("local user") || prompt.Contains("user account"))
            return ("Get-LocalUser | Select-Object Name, Enabled, LastLogon, PasswordLastSet", "safe", "List local user accounts");

        if (prompt.Contains("admin") && prompt.Contains("member"))
            return ("Get-LocalGroupMember -Group 'Administrators' | Select-Object Name, ObjectClass, PrincipalSource", "safe", "List members of the local Administrators group");

        if (prompt.Contains("login") && (prompt.Contains("fail") || prompt.Contains("failed")))
            return ("Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} -MaxEvents 20 | Select-Object TimeCreated, @{N='User';E={$_.Properties[5].Value}}, @{N='Source';E={$_.Properties[19].Value}}", "safe", "Show recent failed login attempts from Security log");

        // System Info
        if (prompt.Contains("uptime") || prompt.Contains("boot time") || prompt.Contains("last reboot"))
            return ("(Get-CimInstance Win32_OperatingSystem).LastBootUpTime; \"Uptime: $((Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime)\"", "safe", "Show system uptime and last boot time");

        if (prompt.Contains("os") && (prompt.Contains("version") || prompt.Contains("info")))
            return ("Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version, BuildNumber, OSArchitecture, TotalVisibleMemorySize", "safe", "Show OS version and system information");

        if (prompt.Contains("installed") && prompt.Contains("role"))
            return ("Get-WindowsFeature | Where-Object Installed | Select-Object Name, DisplayName, FeatureType", "safe", "List installed Windows Server roles and features");

        // Event Logs
        if (prompt.Contains("error") && (prompt.Contains("event") || prompt.Contains("log")))
            return ("Get-WinEvent -FilterHashtable @{LogName='System'; Level=2} -MaxEvents 20 | Select-Object TimeCreated, ProviderName, Message", "safe", "Show recent error events from System log");

        if (prompt.Contains("warning") && prompt.Contains("event"))
            return ("Get-WinEvent -FilterHashtable @{LogName='System'; Level=3} -MaxEvents 20 | Select-Object TimeCreated, ProviderName, Message", "safe", "Show recent warning events from System log");

        // Updates
        if (prompt.Contains("pending") && prompt.Contains("update"))
            return ("Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 10 HotFixID, Description, InstalledOn", "safe", "Show 10 most recently installed hotfixes");

        // Restart / Shutdown
        if (prompt.Contains("restart") && (prompt.Contains("server") || prompt.Contains("computer") || prompt.Contains("machine")))
            return ("Restart-Computer -Force", "destructive", "Restart the server immediately");

        if (prompt.Contains("shutdown"))
            return ("Stop-Computer -Force", "destructive", "Shutdown the server immediately");

        // Scheduled Tasks
        if (prompt.Contains("scheduled task") || prompt.Contains("task scheduler"))
            return ("Get-ScheduledTask | Where-Object State -ne 'Disabled' | Select-Object TaskName, State, @{N='NextRun';E={$_.Triggers[0].StartBoundary}} | Sort-Object TaskName", "safe", "List active scheduled tasks");

        // Firewall
        if (prompt.Contains("firewall") && prompt.Contains("rule"))
            return ("Get-NetFirewallRule -Enabled True | Select-Object DisplayName, Direction, Action, Profile -First 30", "safe", "Show first 30 enabled firewall rules");

        // DNS
        if (prompt.Contains("dns") && prompt.Contains("cache"))
            return ("Get-DnsClientCache | Select-Object -First 30 Entry, RecordName, Data", "safe", "Show DNS client cache entries");

        if (prompt.Contains("flush") && prompt.Contains("dns"))
            return ("Clear-DnsClientCache", "safe", "Flush the local DNS resolver cache");

        return ("", "", "");
    }
}

public class GenerateCommandRequest
{
    public string Prompt { get; set; } = "";
    public string? ServerIp { get; set; }
}
