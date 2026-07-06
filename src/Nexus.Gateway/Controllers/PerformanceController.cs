using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PerformanceController : ControllerBase
{
    private readonly NexusContext _db;
    private readonly Nexus.Gateway.Services.CimService _cimService;

    public PerformanceController(NexusContext db, Nexus.Gateway.Services.CimService cimService)
    {
        _db = db;
        _cimService = cimService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<IEnumerable<PerfSample>>> GetPerformanceHistory(string id)
    {
        if (string.IsNullOrWhiteSpace(id)) return BadRequest();
        
        var server = await _db.Servers.FindAsync(id);
        var targetIp = server != null ? server.Ip : id;
        
        var data = await _db.PerfSamples
            .Where(p => p.ServerIp == targetIp)
            .OrderByDescending(p => p.T)
            .Take(60)
            .ToListAsync();
            
        data.Reverse();
        return Ok(data);
    }

    [HttpGet("{id}/processes")]
    public async Task<ActionResult<IEnumerable<ProcessModel>>> GetTopProcesses(string id)
    {
        if (string.IsNullOrWhiteSpace(id)) return BadRequest();
        
        var server = await _db.Servers.FindAsync(id);
        var targetIp = server != null ? server.Ip : id;
        
        var data = await _db.Processes
            .Where(p => p.ServerIp == targetIp)
            .OrderByDescending(p => p.Cpu)
            .ToListAsync();
            
        return Ok(data);
    }

    [HttpGet("{id}/processes/live")]
    public async Task<ActionResult<IEnumerable<ProcessModel>>> GetLiveProcesses(string id)
    {
        if (string.IsNullOrWhiteSpace(id)) return BadRequest();
        
        var server = await _db.Servers.FindAsync(id);
        var targetIp = server != null ? server.Ip : id;
        
        var data = await _cimService.GetProcessesAsync(targetIp, int.MaxValue);
        return Ok(data);
    }

    [HttpDelete("{id}/processes/{pid}")]
    public async Task<IActionResult> KillProcess(string id, int pid)
    {
        if (string.IsNullOrWhiteSpace(id)) return BadRequest();
        
        var server = await _db.Servers.FindAsync(id);
        var targetIp = server != null ? server.Ip : id;
        
        var success = await _cimService.KillProcessAsync(targetIp, pid);
        if (success) return Ok();
        return StatusCode(500, "Failed to terminate process.");
    }
}
