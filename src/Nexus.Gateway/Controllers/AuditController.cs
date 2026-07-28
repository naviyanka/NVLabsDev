using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize(Roles = "Administrators,Domain Admins")]
public class AuditController : ControllerBase
{
    private readonly AuditLogService _auditService;
    private readonly ILogger<AuditController> _logger;

    public AuditController(AuditLogService auditService, ILogger<AuditController> logger)
    {
        _auditService = auditService;
        _logger = logger;
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? userId = null,
        [FromQuery] string? userName = null,
        [FromQuery] string? action = null,
        [FromQuery] string? resource = null,
        [FromQuery] string? httpMethod = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var filter = new AuditLogQueryFilter
        {
            Page = page,
            PageSize = Math.Min(pageSize, 200),
            UserId = userId,
            UserName = userName,
            Action = action,
            Resource = resource,
            HttpMethod = httpMethod,
            StartDate = startDate,
            EndDate = endDate
        };

        var result = await _auditService.QueryAsync(filter);
        return Ok(result);
    }

    [HttpGet("logs/{id}")]
    public async Task<IActionResult> GetLogById(string id)
    {
        var entry = await _auditService.GetByIdAsync(id);
        if (entry == null) return NotFound();
        return Ok(entry);
    }

    [HttpGet("integrity")]
    public async Task<IActionResult> VerifyIntegrity(
        [FromQuery] DateTime? start = null,
        [FromQuery] DateTime? end = null)
    {
        var result = await _auditService.VerifyIntegrityAsync(start, end);
        return Ok(result);
    }

    [HttpPost("purge")]
    public async Task<IActionResult> Purge([FromBody] PurgeRequest? request = null)
    {
        var retentionDays = request?.RetentionDays ?? 90;
        var purgedCount = await _auditService.PurgeExpiredAsync(retentionDays);
        _logger.LogInformation("Manual audit purge: removed {Count} entries older than {Days} days", purgedCount, retentionDays);
        return Ok(new { purgedCount, retentionDays });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _auditService.GetStatsAsync();
        return Ok(stats);
    }
}

public class PurgeRequest
{
    public int RetentionDays { get; set; } = 90;
}
