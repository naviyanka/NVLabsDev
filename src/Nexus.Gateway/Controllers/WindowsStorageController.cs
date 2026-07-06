using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{serverId}/storage")]
public class WindowsStorageController : ControllerBase
{
    private readonly NexusContext _db;
    private readonly CimService _cimService;

    public WindowsStorageController(NexusContext db, CimService cimService)
    {
        _db = db;
        _cimService = cimService;
    }

    [HttpGet("disks")]
    public async Task<ActionResult<IEnumerable<DiskModel>>> GetDisks(string serverId)
    {
        if (string.IsNullOrWhiteSpace(serverId)) return BadRequest();
        
        var server = await _db.Servers.FindAsync(serverId);
        var targetIp = server != null ? server.Ip : serverId;
        
        try
        {
            var data = await _cimService.GetDisksAsync(targetIp);
            if (data.Any() && data[0].Id != "MockDisk" && data[0].Id != "Drive C") // ensure not mock
            {
                var existing = _db.Disks.Where(d => d.ServerIp == targetIp);
                _db.Disks.RemoveRange(existing);
                foreach (var d in data) d.ServerIp = targetIp;
                await _db.Disks.AddRangeAsync(data);
                await _db.SaveChangesAsync();
                return Ok(data);
            }
        }
        catch { }

        // Fallback to DB
        var cached = _db.Disks.Where(d => d.ServerIp == targetIp).ToList();
        return Ok(cached);
    }

    [HttpGet("volumes")]
    public async Task<ActionResult<IEnumerable<VolumeModel>>> GetVolumes(string serverId)
    {
        if (string.IsNullOrWhiteSpace(serverId)) return BadRequest();
        
        var server = await _db.Servers.FindAsync(serverId);
        var targetIp = server != null ? server.Ip : serverId;
        
        try
        {
            var data = await _cimService.GetVolumesAsync(targetIp);
            if (data.Any() && data[0].DiskId != "MockDisk")
            {
                var existing = _db.Volumes.Where(v => v.ServerIp == targetIp);
                _db.Volumes.RemoveRange(existing);
                foreach (var v in data) v.ServerIp = targetIp;
                await _db.Volumes.AddRangeAsync(data);
                await _db.SaveChangesAsync();
                return Ok(data);
            }
        }
        catch { }

        // Fallback to DB
        var cached = _db.Volumes.Where(v => v.ServerIp == targetIp).ToList();
        return Ok(cached);
    }
}
