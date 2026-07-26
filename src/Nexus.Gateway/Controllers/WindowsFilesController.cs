using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;
using System.IO;
using System.IO.Compression;
using Microsoft.AspNetCore.Authorization;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{serverIp}/files")]
[Authorize]
public class WindowsFilesController : ControllerBase
{
    private readonly CimService _cimService;

    public WindowsFilesController(CimService cimService)
    {
        _cimService = cimService;
    }

    [HttpGet("sources")]
    public IActionResult GetSources(string serverIp)
    {
        try
        {
            var sources = new List<FileSourceModel>();
            using var session = _cimService.CreateSession(serverIp);

            var logicalDisks = session.QueryInstances(@"root\cimv2", "WQL", "SELECT Name, VolumeName FROM Win32_LogicalDisk WHERE DriveType = 3").ToList();
            foreach (var ld in logicalDisks)
            {
                var letter = ld.CimInstanceProperties["Name"]?.Value?.ToString() ?? "";
                var label = ld.CimInstanceProperties["VolumeName"]?.Value?.ToString() ?? "";
                sources.Add(new FileSourceModel
                {
                    Name = $"{letter} ({label})".Trim(),
                    Type = "Disk",
                    Path = letter
                });
            }

            var shares = session.QueryInstances(@"root\cimv2", "WQL", "SELECT Name, Path FROM Win32_Share WHERE Type = 0").ToList();
            foreach (var sh in shares)
            {
                var name = sh.CimInstanceProperties["Name"]?.Value?.ToString() ?? "";
                if (name.EndsWith("$") && name != "IPC$") continue;
                sources.Add(new FileSourceModel
                {
                    Name = name,
                    Type = "Share",
                    Path = name
                });
            }

            return Ok(sources);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    // Reject paths containing '..' sequences to prevent traversal
    private static bool ContainsTraversal(string path)
    {
        return path.Contains("..", StringComparison.OrdinalIgnoreCase)
            || path.Contains("%2e%2e", StringComparison.OrdinalIgnoreCase)
            || path.Contains("%252e%252e", StringComparison.OrdinalIgnoreCase);
    }

    private string BuildUncPath(string serverIp, string path)
    {
        if (ContainsTraversal(path))
            throw new ArgumentException("Path traversal is not allowed.");

        if (path.Length >= 2 && path[1] == ':')
        {
            char drive = path[0];
            string rest = path.Length > 2 ? path.Substring(2) : "";
            if (rest.StartsWith("\\") || rest.StartsWith("/")) rest = rest.Substring(1);
            return $@"\\{serverIp}\{drive}$\{rest}";
        }
        else
        {
            return $@"\\{serverIp}\{path}";
        }
    }

    [HttpGet("list")]
    public IActionResult ListFiles(string serverIp, [FromQuery] string path)
    {
        try
        {
            var uncPath = BuildUncPath(serverIp, path);
            var dirInfo = new DirectoryInfo(uncPath);

            if (!dirInfo.Exists)
                return NotFound(new { message = "Directory not found." });

            var items = new List<FileItemModel>();

            foreach (var dir in dirInfo.GetDirectories())
            {
                items.Add(new FileItemModel
                {
                    Name = dir.Name,
                    Type = "folder",
                    Size = 0,
                    Modified = dir.LastWriteTime.ToString("yyyy-MM-dd HH:mm"),
                    Attrs = "D----"
                });
            }

            foreach (var file in dirInfo.GetFiles())
            {
                items.Add(new FileItemModel
                {
                    Name = file.Name,
                    Type = string.IsNullOrEmpty(file.Extension) ? "file" : file.Extension.Replace(".", "").ToLower(),
                    Size = file.Length,
                    Modified = file.LastWriteTime.ToString("yyyy-MM-dd HH:mm"),
                    Attrs = "-A---"
                });
            }

            return Ok(items);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("new-folder")]
    public IActionResult CreateFolder(string serverIp, [FromQuery] string path, [FromQuery] string name)
    {
        try
        {
            var uncPath = BuildUncPath(serverIp, Path.Combine(path, name));
            Directory.CreateDirectory(uncPath);
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpDelete("delete")]
    public IActionResult Delete(string serverIp, [FromQuery] string path)
    {
        try
        {
            var uncPath = BuildUncPath(serverIp, path);
            if (Directory.Exists(uncPath))
            {
                Directory.Delete(uncPath, true);
            }
            else if (System.IO.File.Exists(uncPath))
            {
                System.IO.File.Delete(uncPath);
            }
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("upload")]
    [RequestSizeLimit(1073741824)] // 1GB max
    [RequestFormLimits(MultipartBodyLengthLimit = 1073741824)]
    public async Task<IActionResult> Upload(string serverIp, [FromQuery] string path, [FromForm] IFormFile file)
    {
        try
        {
            var uncPath = BuildUncPath(serverIp, Path.Combine(path, file.FileName));
            using var stream = new FileStream(uncPath, FileMode.Create);
            await file.CopyToAsync(stream);
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("download")]
    public IActionResult Download(string serverIp, [FromQuery] string path)
    {
        try
        {
            var uncPath = BuildUncPath(serverIp, path);

            if (Directory.Exists(uncPath))
            {
                var tempZipFile = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString() + ".zip");
                ZipFile.CreateFromDirectory(uncPath, tempZipFile, CompressionLevel.Fastest, includeBaseDirectory: false);
                
                var stream = new FileStream(tempZipFile, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.DeleteOnClose);
                var folderName = new DirectoryInfo(uncPath).Name;
                return File(stream, "application/zip", folderName + ".zip");
            }
            else if (System.IO.File.Exists(uncPath))
            {
                var fileName = Path.GetFileName(uncPath);
                return PhysicalFile(uncPath, "application/octet-stream", fileName);
            }
            
            return NotFound();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("rename")]
    public IActionResult Rename(string serverIp, [FromQuery] string path, [FromQuery] string newName)
    {
        try
        {
            var uncPath = BuildUncPath(serverIp, path);
            var destPath = Path.Combine(Path.GetDirectoryName(uncPath) ?? "", newName);
            if (Directory.Exists(uncPath))
                Directory.Move(uncPath, destPath);
            else if (System.IO.File.Exists(uncPath))
                System.IO.File.Move(uncPath, destPath);
            else return NotFound();
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    private void CopyDirectory(string sourceDir, string destinationDir, bool recursive)
    {
        var dir = new DirectoryInfo(sourceDir);
        if (!dir.Exists) throw new DirectoryNotFoundException($"Source directory not found: {dir.FullName}");

        DirectoryInfo[] dirs = dir.GetDirectories();
        Directory.CreateDirectory(destinationDir);

        foreach (FileInfo file in dir.GetFiles())
        {
            string targetFilePath = Path.Combine(destinationDir, file.Name);
            file.CopyTo(targetFilePath, true);
        }

        if (recursive)
        {
            foreach (DirectoryInfo subDir in dirs)
            {
                string newDestinationDir = Path.Combine(destinationDir, subDir.Name);
                CopyDirectory(subDir.FullName, newDestinationDir, true);
            }
        }
    }

    [HttpPost("move")]
    public IActionResult Move(string serverIp, [FromQuery] string path, [FromQuery] string destPath)
    {
        try
        {
            var uncPath = BuildUncPath(serverIp, path);
            var uncDestPath = BuildUncPath(serverIp, destPath);
            if (Directory.Exists(uncPath))
            {
                try
                {
                    Directory.Move(uncPath, uncDestPath);
                }
                catch (IOException)
                {
                    // Fallback for moving across volumes
                    CopyDirectory(uncPath, uncDestPath, true);
                    Directory.Delete(uncPath, true);
                }
            }
            else if (System.IO.File.Exists(uncPath))
            {
                try
                {
                    System.IO.File.Move(uncPath, uncDestPath);
                }
                catch (IOException)
                {
                    // Fallback for moving across volumes
                    System.IO.File.Copy(uncPath, uncDestPath, true);
                    System.IO.File.Delete(uncPath);
                }
            }
            else return NotFound();
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("copy")]
    public IActionResult Copy(string serverIp, [FromQuery] string path, [FromQuery] string destPath)
    {
        try
        {
            var uncPath = BuildUncPath(serverIp, path);
            var uncDestPath = BuildUncPath(serverIp, destPath);
            if (Directory.Exists(uncPath))
            {
                CopyDirectory(uncPath, uncDestPath, true);
            }
            else if (System.IO.File.Exists(uncPath))
            {
                System.IO.File.Copy(uncPath, uncDestPath, overwrite: true);
            }
            else return NotFound();
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("read-text")]
    public async Task<IActionResult> ReadText(string serverIp, [FromQuery] string path)
    {
        try
        {
            var uncPath = BuildUncPath(serverIp, path);
            if (!System.IO.File.Exists(uncPath)) return NotFound();
            var content = await System.IO.File.ReadAllTextAsync(uncPath);
            return Ok(new { content });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("write-text")]
    public async Task<IActionResult> WriteText(string serverIp, [FromQuery] string path, [FromBody] FileContentDto dto)
    {
        try
        {
            var uncPath = BuildUncPath(serverIp, path);
            await System.IO.File.WriteAllTextAsync(uncPath, dto.Content);
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}

public class FileContentDto
{
    public string Content { get; set; } = string.Empty;
}

