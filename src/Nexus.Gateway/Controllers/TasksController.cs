using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Models;
using System.Diagnostics;
using System.Text.RegularExpressions;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{ip}/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ILogger<TasksController> _logger;
    private readonly IPowerShellExecutionService _ps;

    public TasksController(ILogger<TasksController> logger, IPowerShellExecutionService ps)
    {
        _logger = logger;
        _ps = ps;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ScheduledTaskModel>>> GetTasks(string ip)
    {
        try
        {
            var result = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -Command \"schtasks /query /s {ip} /fo LIST /v; exit $LASTEXITCODE\"", HttpContext.RequestAborted);
            var output = result.StandardOutput;

            var tasks = new List<ScheduledTaskModel>();
            var lines = output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            
            ScheduledTaskModel? currentTask = null;

            foreach (var line in lines)
            {
                if (line.StartsWith("Folder:"))
                {
                    if (currentTask != null && !string.IsNullOrEmpty(currentTask.Name))
                    {
                        tasks.Add(currentTask);
                    }
                    currentTask = new ScheduledTaskModel();
                    continue;
                }

                if (currentTask == null) continue;

                var match = Regex.Match(line, @"^([^:]+):\s*(.*)$");
                if (!match.Success) continue;

                var key = match.Groups[1].Value.Trim();
                var value = match.Groups[2].Value.Trim();

                switch (key)
                {
                    case "TaskName":
                        var parts = value.Split('\\', StringSplitOptions.RemoveEmptyEntries);
                        currentTask.Name = parts.Length > 0 ? parts.Last() : value;
                        currentTask.Path = value.Substring(0, value.Length - currentTask.Name.Length);
                        if (string.IsNullOrEmpty(currentTask.Path)) currentTask.Path = "\\";
                        break;
                    case "Next Run Time":
                        currentTask.NextRun = value == "N/A" ? "—" : value;
                        break;
                    case "Last Run Time":
                        currentTask.LastRun = value == "N/A" ? "—" : value;
                        break;
                    case "Last Result":
                        if (value == "0") currentTask.LastResult = "0x0";
                        else currentTask.LastResult = value == "N/A" ? "—" : value;
                        break;
                    case "Status":
                        currentTask.Status = value;
                        break;
                    case "Scheduled Task State":
                        if (value == "Disabled") currentTask.Status = "Disabled";
                        break;
                    case "Schedule Type":
                        if (value != "N/A" && !string.IsNullOrEmpty(value))
                        {
                            currentTask.Triggers.Add(value);
                        }
                        break;
                    case "Start Time":
                        if (value != "N/A" && !string.IsNullOrEmpty(value) && currentTask.Triggers.Any())
                        {
                            currentTask.Triggers[currentTask.Triggers.Count - 1] += $" at {value}";
                        }
                        break;
                }
            }

            if (currentTask != null && !string.IsNullOrEmpty(currentTask.Name))
            {
                tasks.Add(currentTask);
            }

            return Ok(tasks.Where(t => !string.IsNullOrEmpty(t.Name)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get scheduled tasks for {Ip}", ip);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("run")]
    public async Task<IActionResult> RunTask(string ip, [FromBody] RunTaskRequest request)
    {
        try
        {
            var taskPath = request.TaskPath;
            if (string.IsNullOrEmpty(taskPath)) return BadRequest("Task path is required");

            var result = await _ps.ExecuteAsync($"-NoProfile -ExecutionPolicy Bypass -Command \"schtasks /run /s {ip} /tn \\\"{taskPath}\\\"; exit $LASTEXITCODE\"", HttpContext.RequestAborted);

            if (result.ExitCode == 0)
            {
                return Ok();
            }
            
            var err = result.StandardError;
            return StatusCode(500, $"Failed to start task: {err}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to run scheduled task for {Ip}", ip);
            return StatusCode(500, "Internal server error");
        }
    }
}
