using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Services;
using System.Text.Json;
using System.Text;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/plugins/[controller]")]
[Authorize]
public class SharePointSetupController : ControllerBase
{
    private readonly PluginBackgroundJobManager _jobManager;
    private readonly ILogger<SharePointSetupController> _logger;

    public SharePointSetupController(PluginBackgroundJobManager jobManager, ILogger<SharePointSetupController> logger)
    {
        _jobManager = jobManager;
        _logger = logger;
    }

    [HttpPost("execute")]
    public IActionResult ExecuteSetup([FromBody] JsonElement payload)
    {
        _logger.LogInformation("Starting SharePoint Setup with payload: {Payload}", payload.ToString());
        
        try
        {
            var p = payload.Deserialize<SharePointSetupPayload>();
            if (p == null) return BadRequest("Invalid payload");

            // Build PS script for DC (FileShare & Download)
            var dcScript = new StringBuilder();
            if (!string.IsNullOrWhiteSpace(p.FileSharePath) && !p.FileSharePath.StartsWith(@"\\"))
            {
                dcScript.AppendLine($@"
$path = '{p.FileSharePath}'
if (-not (Test-Path $path)) {{ New-Item -ItemType Directory -Force -Path $path }}
$shareName = 'SPSetup'
if (-not (Get-SmbShare -Name $shareName -ErrorAction SilentlyContinue)) {{
    New-SmbShare -Name $shareName -Path $path -FullAccess 'Everyone'
}}
");
            }

            if (!p.FilesAlreadyDownloaded)
            {
                if (p.DownloadSql && !string.IsNullOrWhiteSpace(p.SqlDownloadUrl))
                {
                    dcScript.AppendLine($@"
$sqlDir = Join-Path '{p.FileSharePath}' 'SQL'
if (-not (Test-Path $sqlDir)) {{ New-Item -ItemType Directory -Force -Path $sqlDir }}
Invoke-WebRequest -Uri '{p.SqlDownloadUrl}' -OutFile (Join-Path $sqlDir 'sql.iso') -UseBasicParsing
");
                }
                if (p.DownloadSp && !string.IsNullOrWhiteSpace(p.SpDownloadUrl))
                {
                    dcScript.AppendLine($@"
$spDir = Join-Path '{p.FileSharePath}' 'SP'
if (-not (Test-Path $spDir)) {{ New-Item -ItemType Directory -Force -Path $spDir }}
Invoke-WebRequest -Uri '{p.SpDownloadUrl}' -OutFile (Join-Path $spDir 'sp.iso') -UseBasicParsing
");
                }
            }

            // In a real scenario, we'd find the DC IP and run this.
            // For now, assume the current machine or a specified DC runs it.
            var dcIp = "127.0.0.1"; // Or get from config
            if (dcScript.Length > 0)
            {
                _jobManager.StartJob("sharepoint-setup-dc", dcIp, "ps1", dcScript.ToString());
            }

            // Build PS script for SQL Server
            if (p.InstallSql && !string.IsNullOrWhiteSpace(p.SqlTargetServer))
            {
                var sqlAdmins = string.Join(" ", p.SqlAdmins.Select(a => $@"""{a}"""));
                var sqlScript = $@"
$share = '{p.FileShareUrl}'
if (-not (Get-PSDrive -Name Z -ErrorAction SilentlyContinue)) {{
    New-PSDrive -Name Z -PSProvider FileSystem -Root $share -Persist
    $shell = New-Object -ComObject shell.application
    $shell.Namespace($share).Self.InvokeVerb('pintohome')
}}

$isoPath = Join-Path $share 'SQL\sql.iso'
if (Test-Path $isoPath) {{
    $mount = Mount-DiskImage -ImagePath $isoPath -PassThru
    $driveLetter = ($mount | Get-Volume).DriveLetter
    $setup = ""${{driveLetter}}:\setup.exe""
    Start-Process -FilePath $setup -ArgumentList '/Q /IACCEPTSQLSERVERLICENSETERMS /ACTION=install /FEATURES=SQLEngine /INSTANCENAME=""{p.SqlInstanceName}"" /INSTANCEDIR=""{p.SqlDisk}:\"" /SQLSYSADMINACCOUNTS={sqlAdmins}' -Wait
}}
";
                _jobManager.StartJob("sharepoint-setup-sql", p.SqlTargetServer, "ps1", sqlScript);
            }

            // Build PS script for SP Servers
            if (p.InstallSp && p.SpServers != null && p.SpServers.Any())
            {
                foreach (var server in p.SpServers)
                {
                    var spScript = $@"
$share = '{p.FileShareUrl}'
if (-not (Get-PSDrive -Name Z -ErrorAction SilentlyContinue)) {{
    New-PSDrive -Name Z -PSProvider FileSystem -Root $share -Persist
    $shell = New-Object -ComObject shell.application
    $shell.Namespace($share).Self.InvokeVerb('pintohome')
}}

$isoPath = Join-Path $share 'SP\sp.iso'
if (Test-Path $isoPath) {{
    $mount = Mount-DiskImage -ImagePath $isoPath -PassThru
    $driveLetter = ($mount | Get-Volume).DriveLetter
    $prereq = ""${{driveLetter}}:\prerequisiteinstaller.exe""
    Start-Process -FilePath $prereq -ArgumentList '/unattended' -Wait
    
    $setup = ""${{driveLetter}}:\setup.exe""
    Start-Process -FilePath $setup -ArgumentList '/config config.xml' -Wait
}}
";
                    _jobManager.StartJob($"sharepoint-setup-sp-{server}", server, "ps1", spScript);
                }
            }

            return Ok(new { message = "SharePoint Setup execution started." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to execute setup.");
            return StatusCode(500, ex.Message);
        }
    }
}

public class SharePointSetupPayload
{
    public string SpEdition { get; set; } = string.Empty;
    public List<string> SpServers { get; set; } = new();
    public string SqlTargetServer { get; set; } = string.Empty;
    public string SqlInstanceName { get; set; } = string.Empty;
    public string SqlDisk { get; set; } = string.Empty;
    public List<string> SqlAdmins { get; set; } = new();
    public string FileSharePath { get; set; } = string.Empty;
    public string FileShareUrl { get; set; } = string.Empty;
    public string SpDownloadUrl { get; set; } = string.Empty;
    public string SqlDownloadUrl { get; set; } = string.Empty;
    public bool FilesAlreadyDownloaded { get; set; }
    public bool DownloadSql { get; set; }
    public bool InstallSql { get; set; }
    public bool DownloadSp { get; set; }
    public bool InstallSp { get; set; }
}
