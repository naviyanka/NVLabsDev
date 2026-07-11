using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;
using Microsoft.AspNetCore.Authorization;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/plugins")]
[Authorize]
public class PluginsController : ControllerBase
{
    private readonly NexusContext _db;
    private readonly PluginBackgroundJobManager _jobManager;
    private readonly ILogger<PluginsController> _logger;

    public PluginsController(NexusContext db, PluginBackgroundJobManager jobManager, ILogger<PluginsController> logger)
    {
        _db = db;
        _jobManager = jobManager;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PluginEntity>>> GetAll()
    {
        return await _db.Plugins.ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<PluginEntity>> Create(PluginEntity plugin)
    {
        plugin.Id = Guid.NewGuid().ToString();
        _db.Plugins.Add(plugin);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = plugin.Id }, plugin);
    }

    [HttpPost("{id}/upload")]
    [Authorize(Roles = "Administrators,Domain Admins")]
    public async Task<IActionResult> UploadScript(string id, IFormFile file)
    {
        var plugin = await _db.Plugins.FindAsync(id);
        if (plugin == null) return NotFound();

        // Reject scripts containing dangerous commands
        using (var reader = new StreamReader(file.OpenReadStream()))
        {
            var content = await reader.ReadToEndAsync();
            var dangerousPatterns = new[] {
                "Remove-Item", "Invoke-Expression", "IEX", "Invoke-WebRequest",
                "Start-Process", "Format-Table", "Set-Content", "Add-Content",
                "certutil", "bitsadmin", "Invoke-WmiMethod", "Invoke-CimMethod"
            };
            foreach (var p in dangerousPatterns)
            {
                if (content.Contains(p, StringComparison.OrdinalIgnoreCase))
                    return BadRequest($"Script contains disallowed command: {p}");
            }
            plugin.ScriptContent = content;
            plugin.SourceType = "file";
        }

        await _db.SaveChangesAsync();
        return Ok(plugin);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, PluginEntity plugin)
    {
        if (id != plugin.Id) return BadRequest();

        var existing = await _db.Plugins.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        if (existing == null) return NotFound();

        if (existing.IsBuiltIn)
        {
            // Only allow changing Category and IsActive
            existing.Category = plugin.Category;
            existing.IsActive = plugin.IsActive;
            _db.Entry(existing).State = EntityState.Modified;
        }
        else
        {
            _db.Entry(plugin).State = EntityState.Modified;
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var plugin = await _db.Plugins.FindAsync(id);
        if (plugin == null) return NotFound();
        if (plugin.IsBuiltIn) return BadRequest("Cannot delete built-in plugins.");

        _db.Plugins.Remove(plugin);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/run")]
    [Authorize(Roles = "Administrators,Domain Admins")]
    public async Task<IActionResult> Run(string id, [FromQuery] string[] serverIps)
    {
        if (serverIps == null || serverIps.Length == 0) return BadRequest("No servers specified");

        var plugin = await _db.Plugins.FindAsync(id);
        if (plugin == null) return NotFound();

        foreach (var ip in serverIps)
        {
            _jobManager.StartJob(id, ip, plugin.ScriptType, plugin.ScriptContent);
        }

        return Ok(new { started = true });
    }

    [HttpGet("{id}/jobs")]
    public IActionResult GetJobs(string id)
    {
        var jobs = _jobManager.GetJobsForPlugin(id).Select(j => new
        {
            pluginId = j.PluginId,
            serverIp = j.ServerIp,
            status = j.Status,
            output = j.Output.ToString(),
            startTime = j.StartTime,
            endTime = j.EndTime
        });
        return Ok(jobs);
    }

    [HttpPost("{id}/stop")]
    public IActionResult StopJob(string id, [FromQuery] string? serverIp)
    {
        if (string.IsNullOrEmpty(serverIp))
        {
            _jobManager.StopAllJobsForPlugin(id);
        }
        else
        {
            _jobManager.StopJob(id, serverIp);
        }
        return Ok(new { stopped = true });
    }
}
