using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly NexusContext _db;

    public DashboardController(NexusContext db)
    {
        _db = db;
    }

    [HttpGet("layout")]
    public async Task<IActionResult> GetLayout()
    {
        var settings = await _db.AppSettings.FirstOrDefaultAsync(s => s.Id == "global");
        var layout = settings?.DashboardLayout ?? "";
        return Ok(new { layout });
    }

    [HttpPut("layout")]
    public async Task<IActionResult> SaveLayout([FromBody] DashboardLayoutDto dto)
    {
        var settings = await _db.AppSettings.FirstOrDefaultAsync(s => s.Id == "global");
        if (settings == null) return NotFound();

        settings.DashboardLayout = dto.Layout ?? "";
        await _db.SaveChangesAsync();
        return Ok(new { message = "Layout saved." });
    }
}

public class DashboardLayoutDto
{
    public string? Layout { get; set; }
}
