using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServersController : ControllerBase
{
    private readonly ServerService _serverService;

    public ServersController(ServerService serverService)
    {
        _serverService = serverService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Server>>> GetServers()
    {
        var servers = await _serverService.GetServersAsync();
        return Ok(servers);
    }

    [HttpPost]
    public async Task<ActionResult> AddServer([FromBody] ServerCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Ip))
        {
            return BadRequest("IP Address is required.");
        }
        await _serverService.AddManualServerAsync(dto);
        return Ok();
    }

    [HttpPut("{ip}")]
    public async Task<ActionResult> EditServer(string ip, [FromBody] ServerCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Ip))
        {
            return BadRequest("IP Address is required.");
        }
        var updated = await _serverService.UpdateServerAsync(ip, dto);
        if (updated == null) return NotFound();
        return Ok();
    }

    [HttpDelete("{ip}")]
    public async Task<IActionResult> DeleteServer(string ip)
    {
        var ok = await _serverService.DeleteServerAsync(ip);
        if (ok) return Ok();
        return NotFound();
    }

    [HttpPost("{ip}/restart")]
    public async Task<IActionResult> RestartServer(string ip, [FromServices] CimService cimService)
    {
        var ok = await cimService.RestartServerAsync(ip);
        if (ok) return Ok();
        return StatusCode(500, "Failed to restart server");
    }

    [HttpPost("{ip}/shutdown")]
    public async Task<IActionResult> ShutdownServer(string ip, [FromServices] CimService cimService)
    {
        var ok = await cimService.ShutdownServerAsync(ip);
        if (ok) return Ok();
        return StatusCode(500, "Failed to shutdown server");
    }

    [HttpGet("{ip}/disks")]
    public async Task<IActionResult> GetDisks(string ip, [FromServices] CimService cimService)
    {
        var disks = await cimService.GetDisksAsync(ip);
        return Ok(disks);
    }
}
