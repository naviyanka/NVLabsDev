using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{serverId}/services")]
public class WindowsServicesController : ControllerBase
{
    private readonly NexusContext _db;
    private readonly CimService _cimService;

    public WindowsServicesController(NexusContext db, CimService cimService)
    {
        _db = db;
        _cimService = cimService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ServiceModel>>> GetServices(string serverId)
    {
        if (string.IsNullOrWhiteSpace(serverId)) return BadRequest();
        
        var server = await _db.Servers.FindAsync(serverId);
        var targetIp = server != null ? server.Ip : serverId;
        
        var data = await _cimService.GetServicesAsync(targetIp);
        return Ok(data);
    }

    [HttpPost("{serviceName}/{actionName}")]
    public async Task<IActionResult> ControlService(string serverId, string serviceName, string actionName)
    {
        if (string.IsNullOrWhiteSpace(serverId)) return BadRequest();
        
        var server = await _db.Servers.FindAsync(serverId);
        var targetIp = server != null ? server.Ip : serverId;
        
        var success = await _cimService.ControlServiceAsync(targetIp, serviceName, actionName);
        if (success) return Ok();
        return StatusCode(500, "Failed to control service.");
    }
}
