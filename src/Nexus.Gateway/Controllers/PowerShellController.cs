using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/powershell")]
[Authorize]
public class PowerShellController : ControllerBase
{
    private readonly PowerShellSessionManager _sessionManager;
    private readonly Nexus.Gateway.Data.NexusContext _db;

    public PowerShellController(PowerShellSessionManager sessionManager, Nexus.Gateway.Data.NexusContext db)
    {
        _sessionManager = sessionManager;
        _db = db;
    }

    private string ResolveHostname(string ipOrName)
    {
        var server = _db.Servers.FirstOrDefault(s => s.Ip == ipOrName || s.Id == ipOrName.ToLower());
        return server?.Name ?? ipOrName;
    }

    public class CreateSessionRequest
    {
        public string ServerId { get; set; } = string.Empty;
    }

    public class RunRequest
    {
        public string SessionId { get; set; } = string.Empty;
        public string ServerId { get; set; } = string.Empty;
        public string Command { get; set; } = string.Empty;
    }

    /// <summary>
    /// Create a new persistent PowerShell session for a server.
    /// </summary>
    [HttpPost("session")]
    public IActionResult CreateSession([FromBody] CreateSessionRequest req)
    {
        var hostname = ResolveHostname(req.ServerId);
        var sessionId = _sessionManager.CreateSession(hostname);
        return Ok(new { sessionId });
    }

    /// <summary>
    /// Destroy a persistent PowerShell session.
    /// </summary>
    [HttpDelete("session/{sessionId}")]
    public IActionResult DestroySession(string sessionId)
    {
        _sessionManager.DestroySession(sessionId);
        return Ok(new { destroyed = true });
    }

    /// <summary>
    /// Execute a command in a persistent session.
    /// Falls back to creating a new session if sessionId is missing or expired.
    /// </summary>
    [HttpPost("run")]
    public async Task Run([FromBody] RunRequest req)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");

        if (string.IsNullOrWhiteSpace(req.Command))
        {
            await Response.WriteAsync($"data: {System.Text.Json.JsonSerializer.Serialize(new { type = "end", sessionId = req.SessionId })}\n\n");
            return;
        }

        try
        {
            var sessionId = req.SessionId;
            if (string.IsNullOrWhiteSpace(sessionId) || !_sessionManager.SessionExists(sessionId))
            {
                var hostname = ResolveHostname(req.ServerId);
                sessionId = _sessionManager.CreateSession(hostname);
                // Send the new sessionId down so the client knows it
                await Response.WriteAsync($"data: {System.Text.Json.JsonSerializer.Serialize(new { type = "session", sessionId })}\n\n");
                await Response.Body.FlushAsync();
            }

            await foreach (var chunk in _sessionManager.ExecuteStreamAsync(sessionId, req.Command, HttpContext.RequestAborted))
            {
                bool isErr = chunk.StartsWith("ERR:");
                string content = isErr ? chunk.Substring(4) : chunk.Substring(4);
                
                await Response.WriteAsync($"data: {System.Text.Json.JsonSerializer.Serialize(new { type = isErr ? "error" : "output", content })}\n\n");
                await Response.Body.FlushAsync();
            }

            await Response.WriteAsync($"data: {System.Text.Json.JsonSerializer.Serialize(new { type = "end", sessionId })}\n\n");
        }
        catch (Exception ex)
        {
            await Response.WriteAsync($"data: {System.Text.Json.JsonSerializer.Serialize(new { type = "error", content = ex.Message })}\n\n");
            await Response.WriteAsync($"data: {System.Text.Json.JsonSerializer.Serialize(new { type = "end" })}\n\n");
        }
    }
}
