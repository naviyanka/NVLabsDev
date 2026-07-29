using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/alert-rules")]
[Authorize]
public class AlertRulesController : ControllerBase
{
    private readonly NexusContext _db;

    public AlertRulesController(NexusContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var rules = await _db.AlertRules.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return Ok(rules);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AlertRule rule)
    {
        rule.Id = 0;
        rule.CreatedAt = DateTime.UtcNow;
        _db.AlertRules.Add(rule);
        await _db.SaveChangesAsync();
        return Ok(rule);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] AlertRule rule)
    {
        var existing = await _db.AlertRules.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = rule.Name;
        existing.Metric = rule.Metric;
        existing.Comparison = rule.Comparison;
        existing.Threshold = rule.Threshold;
        existing.DurationSeconds = rule.DurationSeconds;
        existing.ServerIp = rule.ServerIp;
        existing.Channel = rule.Channel;
        existing.Enabled = rule.Enabled;

        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var rule = await _db.AlertRules.FindAsync(id);
        if (rule == null) return NotFound();
        _db.AlertRules.Remove(rule);
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }
}
