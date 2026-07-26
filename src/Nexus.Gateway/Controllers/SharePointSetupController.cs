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
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var p = payload.Deserialize<SharePointSetupPayload>(options);
            if (p == null || p.Configurations == null) return BadRequest("Invalid payload");

            var dcScript = new StringBuilder();
            var basePath = string.IsNullOrWhiteSpace(p.FileSharePath) ? p.FileShareUrl : p.FileSharePath;
            
            // PS Downloader function
            dcScript.AppendLine(@"
function Invoke-DownloadWithProgress {
    param($url, $outFile, $tag)
    try {
        $req = [System.Net.WebRequest]::Create($url)
        $res = $req.GetResponse()
        $totalBytes = [double]$res.ContentLength
        $stream = $res.GetResponseStream()
        $fs = [System.IO.File]::Create($outFile)
        
        $buffer = New-Object byte[] 65536
        $read = 0; $totalRead = 0; $lastReport = 0
        
        do {
            $read = $stream.Read($buffer, 0, $buffer.Length)
            if ($read -gt 0) {
                $fs.Write($buffer, 0, $read)
                $totalRead += $read
                $pct = [int](($totalRead / $totalBytes) * 100)
                if ($pct -gt ($lastReport + 2) -or $pct -eq 100) {
                    Write-Output ""[PROGRESS|$tag|$pct]""
                    $lastReport = $pct
                }
            }
        } while ($read -gt 0)
        
        $fs.Close(); $stream.Close(); $res.Close()
        Write-Output ""[PROGRESS|$tag|100]""
    } catch {
        Write-Output ""[ERROR] Failed to download $tag : $_""
        throw
    }
}
");

            if (!string.IsNullOrWhiteSpace(p.FileSharePath) && !p.FileSharePath.StartsWith(@"\\"))
            {
                dcScript.AppendLine($@"
$path = '{p.FileSharePath}'
if (-not (Test-Path $path)) {{ New-Item -ItemType Directory -Force -Path $path }}
$shareName = 'SPSetup'
if (-not (Get-SmbShare -Name $shareName -ErrorAction SilentlyContinue)) {{
    Write-Output ""[INFO] Creating SMB Share '$shareName' at $path with FullAccess to Everyone...""
    New-SmbShare -Name $shareName -Path $path -FullAccess 'Everyone'
}}
");
            }

            foreach (var conf in p.Configurations)
            {
                if (p.DownloadSql && !string.IsNullOrWhiteSpace(conf.SqlDownloadUrl))
                {
                    var tag = "SQL_" + conf.SpEdition;
                    if (conf.SqlDownloaded)
                    {
                        dcScript.AppendLine($@"Write-Output ""[PROGRESS|{tag}|100]""");
                    }
                    else
                    {
                        dcScript.AppendLine($@"
$sqlDir = Join-Path '{basePath}' 'SQL_{conf.SpEdition}'
if (-not (Test-Path $sqlDir)) {{ New-Item -ItemType Directory -Force -Path $sqlDir }}
$outFile = Join-Path $sqlDir 'sql.iso'
if (-not (Test-Path $outFile)) {{
    Write-Output ""[INFO] Downloading SQL ISO to $outFile...""
    Invoke-DownloadWithProgress -url '{conf.SqlDownloadUrl}' -outFile $outFile -tag '{tag}'
    Write-Output ""[INFO] Download completed.""
}} else {{
    Write-Output ""[PROGRESS|{tag}|100]""
}}
");
                    }
                }
                if (p.DownloadSp && !string.IsNullOrWhiteSpace(conf.SpDownloadUrl))
                {
                    var tag = "SP_" + conf.SpEdition;
                    if (conf.SpDownloaded)
                    {
                        dcScript.AppendLine($@"Write-Output ""[PROGRESS|{tag}|100]""");
                    }
                    else
                    {
                        dcScript.AppendLine($@"
$spDir = Join-Path '{basePath}' 'SP_{conf.SpEdition}'
if (-not (Test-Path $spDir)) {{ New-Item -ItemType Directory -Force -Path $spDir }}
$outFile = Join-Path $spDir 'sp.iso'
if (-not (Test-Path $outFile)) {{
    Write-Output ""[INFO] Downloading SP ISO to $outFile...""
    Invoke-DownloadWithProgress -url '{conf.SpDownloadUrl}' -outFile $outFile -tag '{tag}'
    Write-Output ""[INFO] Download completed.""
}} else {{
    Write-Output ""[PROGRESS|{tag}|100]""
}}
");
                    }
                }
            }

            var dcIp = "127.0.0.1"; 
            if (dcScript.Length > 0 && (p.DownloadSp || p.DownloadSql || !string.IsNullOrWhiteSpace(basePath)))
            {
                _jobManager.StartJob("sharepoint_DC_Download", dcIp, "ps1", dcScript.ToString());
            }

            foreach (var conf in p.Configurations)
            {
                if (p.InstallSql && !string.IsNullOrWhiteSpace(conf.SqlTargetServer))
                {
                    var sqlAdmins = string.Join(" ", conf.SqlAdmins.Select(a => $@"""{a}"""));
                    var sqlScript = $@"
$share = '{p.FileShareUrl}'
if (-not (Get-PSDrive -Name Z -ErrorAction SilentlyContinue)) {{
    Write-Output ""[INFO] Mapping network drive Z: to $share...""
    New-PSDrive -Name Z -PSProvider FileSystem -Root $share -Persist
    $shell = New-Object -ComObject shell.application
    Write-Output ""[INFO] Pinning $share to Quick Access...""
    $shell.Namespace($share).Self.InvokeVerb('pintohome')
}}

$isoPath = Join-Path $share 'SQL_{conf.SpEdition}\sql.iso'
if (Test-Path $isoPath) {{
    Write-Output ""[PROGRESS|SQL_INSTALL_{conf.SpEdition}|10]""
    Write-Output ""[INFO] Mounting ISO image $isoPath...""
    $mount = Mount-DiskImage -ImagePath $isoPath -PassThru
    $driveLetter = ($mount | Get-Volume).DriveLetter
    $setup = ""${{driveLetter}}:\setup.exe""
    Write-Output ""[PROGRESS|SQL_INSTALL_{conf.SpEdition}|50]""
    Write-Output ""[INFO] Installing SQL Server...""
    Start-Process -FilePath $setup -ArgumentList '/Q /IACCEPTSQLSERVERLICENSETERMS /ACTION=install /FEATURES=SQLEngine /INSTANCENAME=""{conf.SqlInstanceName}"" /INSTANCEDIR=""{conf.SqlDisk}:\"" /SQLSYSADMINACCOUNTS={sqlAdmins}' -Wait
    Write-Output ""[INFO] SQL Server installation finished.""
    Write-Output ""[PROGRESS|SQL_INSTALL_{conf.SpEdition}|100]""
}}
";
                    _jobManager.StartJob($"sharepoint_SQL_{conf.SpEdition}", conf.SqlTargetServer, "ps1", sqlScript);
                }

                if (p.InstallSp && conf.SpServers != null && conf.SpServers.Any())
                {
                    foreach (var server in conf.SpServers)
                    {
                        var spScript = $@"
$share = '{p.FileShareUrl}'
if (-not (Get-PSDrive -Name Z -ErrorAction SilentlyContinue)) {{
    Write-Output ""[INFO] Mapping network drive Z: to $share...""
    New-PSDrive -Name Z -PSProvider FileSystem -Root $share -Persist
    $shell = New-Object -ComObject shell.application
    Write-Output ""[INFO] Pinning $share to Quick Access...""
    $shell.Namespace($share).Self.InvokeVerb('pintohome')
}}

$isoPath = Join-Path $share 'SP_{conf.SpEdition}\sp.iso'
if (Test-Path $isoPath) {{
    Write-Output ""[PROGRESS|SP_PREREQ_{server}|10]""
    Write-Output ""[INFO] Mounting ISO image $isoPath...""
    $mount = Mount-DiskImage -ImagePath $isoPath -PassThru
    $driveLetter = ($mount | Get-Volume).DriveLetter
    $prereq = ""${{driveLetter}}:\prerequisiteinstaller.exe""
    Write-Output ""[INFO] Installing SharePoint Prerequisites...""
    Start-Process -FilePath $prereq -ArgumentList '/unattended' -Wait
    Write-Output ""[INFO] Prerequisites installation finished.""
    
    Write-Output ""[PROGRESS|SP_INSTALL_{server}|50]""
    $setup = ""${{driveLetter}}:\setup.exe""
    Write-Output ""[INFO] Installing SharePoint...""
    Start-Process -FilePath $setup -ArgumentList '/config config.xml' -Wait
    Write-Output ""[INFO] SharePoint installation finished.""
    Write-Output ""[PROGRESS|SP_INSTALL_{server}|100]""
}}
";
                        _jobManager.StartJob($"sharepoint_SP_{conf.SpEdition}", server, "ps1", spScript);
                    }
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

public class SpEditionConfig
{
    public string SpEdition { get; set; } = string.Empty;
    public List<string> SpServers { get; set; } = new();
    public string SqlTargetServer { get; set; } = string.Empty;
    public string SqlInstanceName { get; set; } = string.Empty;
    public string SqlDisk { get; set; } = string.Empty;
    public List<string> SqlAdmins { get; set; } = new();
    public string SpDownloadUrl { get; set; } = string.Empty;
    public string SqlDownloadUrl { get; set; } = string.Empty;
    public bool SpDownloaded { get; set; }
    public bool SqlDownloaded { get; set; }
}

public class SharePointSetupPayload
{
    public List<SpEditionConfig> Configurations { get; set; } = new();
    public string FileSharePath { get; set; } = string.Empty;
    public string FileShareUrl { get; set; } = string.Empty;
    public bool FilesAlreadyDownloaded { get; set; }
    public bool DownloadSql { get; set; }
    public bool InstallSql { get; set; }
    public bool DownloadSp { get; set; }
    public bool InstallSp { get; set; }
}
