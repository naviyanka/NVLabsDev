using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RunbooksController : ControllerBase
{
    private readonly NexusContext _db;

    public RunbooksController(NexusContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Runbook>>> GetAll()
    {
        var runbooks = await _db.Runbooks.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return Ok(runbooks);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetById(string id)
    {
        var runbook = await _db.Runbooks.FirstOrDefaultAsync(r => r.Id == id);
        if (runbook == null) return NotFound();

        var executions = await _db.RunbookExecutions
            .Where(e => e.RunbookId == id)
            .OrderByDescending(e => e.StartedAt)
            .Take(50)
            .ToListAsync();

        return Ok(new { runbook, executions });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<Runbook>> Create([FromBody] RunbookCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Runbook name is required." });
        if (string.IsNullOrWhiteSpace(dto.Script))
            return BadRequest(new { message = "Script content is required." });

        var runbook = new Runbook
        {
            Id = Guid.NewGuid().ToString(),
            Name = dto.Name,
            Description = dto.Description ?? "",
            Script = dto.Script,
            CronExpression = dto.CronExpression ?? "",
            TargetServers = dto.TargetServers ?? "*",
            Enabled = dto.Enabled,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = User.Identity?.Name ?? "system"
        };

        _db.Runbooks.Add(runbook);
        await _db.SaveChangesAsync();
        return Ok(runbook);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<Runbook>> Update(string id, [FromBody] RunbookCreateDto dto)
    {
        var runbook = await _db.Runbooks.FirstOrDefaultAsync(r => r.Id == id);
        if (runbook == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Name)) runbook.Name = dto.Name;
        if (dto.Description != null) runbook.Description = dto.Description;
        if (dto.Script != null) runbook.Script = dto.Script;
        if (dto.CronExpression != null) runbook.CronExpression = dto.CronExpression;
        if (dto.TargetServers != null) runbook.TargetServers = dto.TargetServers;
        runbook.Enabled = dto.Enabled;

        await _db.SaveChangesAsync();
        return Ok(runbook);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Delete(string id)
    {
        var runbook = await _db.Runbooks.FirstOrDefaultAsync(r => r.Id == id);
        if (runbook == null) return NotFound();

        // Also remove execution history
        var executions = await _db.RunbookExecutions.Where(e => e.RunbookId == id).ToListAsync();
        _db.RunbookExecutions.RemoveRange(executions);
        _db.Runbooks.Remove(runbook);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Runbook deleted." });
    }

    [HttpPost("{id}/run")]
    [Authorize(Roles = "Operator,Admin,SuperAdmin")]
    public async Task<IActionResult> RunNow(string id, [FromServices] IPowerShellExecutionService ps)
    {
        var runbook = await _db.Runbooks.FirstOrDefaultAsync(r => r.Id == id);
        if (runbook == null) return NotFound();

        var servers = await ResolveTargets(runbook.TargetServers);
        var results = new List<object>();

        runbook.LastRunAt = DateTime.UtcNow;
        runbook.LastRunStatus = "Running";

        foreach (var serverIp in servers)
        {
            var execution = new RunbookExecution
            {
                RunbookId = runbook.Id,
                RunbookName = runbook.Name,
                ServerIp = serverIp,
                StartedAt = DateTime.UtcNow,
                Status = "Running"
            };
            _db.RunbookExecutions.Add(execution);
            await _db.SaveChangesAsync();

            try
            {
                var encoded = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(runbook.Script));
                var cmd = serverIp == "127.0.0.1" || serverIp == "localhost"
                    ? $"-NoProfile -ExecutionPolicy Bypass -EncodedCommand {encoded}"
                    : $"-NoProfile -ExecutionPolicy Bypass -Command \"Invoke-Command -ComputerName {serverIp} -ScriptBlock {{ [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{encoded}')) | Invoke-Expression }}\"";

                var result = await ps.ExecuteAsync(cmd, HttpContext.RequestAborted, 120000);

                execution.ExitCode = result.ExitCode;
                execution.Output = string.IsNullOrWhiteSpace(result.StandardOutput) ? result.StandardError : result.StandardOutput;
                execution.Status = result.ExitCode == 0 ? "Success" : "Failed";
                execution.CompletedAt = DateTime.UtcNow;

                results.Add(new { serverIp, status = execution.Status, exitCode = execution.ExitCode, output = execution.Output });
            }
            catch (Exception ex)
            {
                execution.Status = "Failed";
                execution.Output = ex.Message;
                execution.ExitCode = -1;
                execution.CompletedAt = DateTime.UtcNow;
                results.Add(new { serverIp, status = "Failed", exitCode = -1, output = ex.Message });
            }

            await _db.SaveChangesAsync();
        }

        runbook.LastRunStatus = results.All(r => ((dynamic)r).status == "Success") ? "Success" : "Failed";
        await _db.SaveChangesAsync();

        return Ok(new { runbookId = id, results });
    }

    [HttpGet("{id}/executions")]
    public async Task<ActionResult<IEnumerable<RunbookExecution>>> GetExecutions(string id, [FromQuery] int limit = 50)
    {
        var executions = await _db.RunbookExecutions
            .Where(e => e.RunbookId == id)
            .OrderByDescending(e => e.StartedAt)
            .Take(Math.Min(limit, 200))
            .ToListAsync();

        return Ok(executions);
    }

    private async Task<List<string>> ResolveTargets(string targetServers)
    {
        if (string.IsNullOrWhiteSpace(targetServers) || targetServers == "*")
        {
            var servers = await _db.Servers.ToListAsync();
            return servers.Select(s => s.Ip).ToList();
        }
        return targetServers.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
    }
}

public class RunbookCreateDto
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? Script { get; set; }
    public string? CronExpression { get; set; }
    public string? TargetServers { get; set; }
    public bool Enabled { get; set; } = true;
}
