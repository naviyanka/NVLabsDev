using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;
using System.IO;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobsController : ControllerBase
{
    private readonly PluginBackgroundJobManager _jobManager;
    private readonly Data.NexusContext _context;

    public JobsController(PluginBackgroundJobManager jobManager, Data.NexusContext context)
    {
        _jobManager = jobManager;
        _context = context;
    }

    [HttpGet]
    public IActionResult GetAllJobs([FromQuery] bool includeLogs = false)
    {
        var jobs = _jobManager.GetAllJobs().Select(j => 
        {
            string output = "";
            if (includeLogs && System.IO.File.Exists(j.LogFilePath))
            {
                try
                {
                    using var fs = new FileStream(j.LogFilePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                    using var sr = new StreamReader(fs);
                    output = sr.ReadToEnd();
                }
                catch { }
            }
            return new
            {
                j.Id,
                j.PluginId,
                j.ServerIp,
                j.Status,
                j.StartTime,
                j.EndTime,
                j.ScriptType,
                LogFileExists = System.IO.File.Exists(j.LogFilePath),
                Output = output
            };
        });
        return Ok(jobs);
    }

    [HttpGet("{id}/logs")]
    public IActionResult GetJobLogs(int id)
    {
        var job = _context.BackgroundJobs.Find(id);
        if (job == null) return NotFound("Job not found.");
        
        if (System.IO.File.Exists(job.LogFilePath))
        {
            try
            {
                using var fs = new FileStream(job.LogFilePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                using var sr = new StreamReader(fs);
                var content = sr.ReadToEnd();
                return Ok(new { Output = content, job.Status });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error reading log file: " + ex.Message);
            }
        }
        return Ok(new { Output = "[No log file found on disk]", job.Status });
    }

    [HttpPost("{id}/stop")]
    public IActionResult StopJob(int id)
    {
        var job = _context.BackgroundJobs.Find(id);
        if (job == null) return NotFound();
        _jobManager.StopJob(job.PluginId, job.ServerIp);
        return Ok(new { Message = "Stop command issued" });
    }

    [HttpPost("{id}/retry")]
    public IActionResult RetryJob(int id)
    {
        var job = _context.BackgroundJobs.Find(id);
        if (job == null) return NotFound();
        _jobManager.RetryJob(job.PluginId, job.ServerIp);
        return Ok(new { Message = "Retry command issued" });
    }
}
