using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/keys")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class ApiKeysController : ControllerBase
{
    private readonly NexusContext _db;

    public ApiKeysController(NexusContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var keys = await _db.ApiKeys
            .OrderByDescending(k => k.CreatedAt)
            .Select(k => new
            {
                k.Id,
                k.Name,
                k.Prefix,
                k.Role,
                k.CreatedBy,
                k.CreatedAt,
                k.ExpiresAt,
                k.LastUsedAt,
                k.IsActive
            })
            .ToListAsync();

        return Ok(keys);
    }

    [HttpPost]
    public async Task<IActionResult> Generate([FromBody] CreateApiKeyDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Key name is required." });

        var validRoles = new[] { "Viewer", "Operator", "Admin", "SuperAdmin" };
        if (!validRoles.Contains(dto.Role))
            return BadRequest(new { message = $"Invalid role. Must be one of: {string.Join(", ", validRoles)}" });

        var plainKey = ApiKey.GenerateKey();
        var hashedKey = ApiKey.HashKey(plainKey);

        var apiKey = new ApiKey
        {
            Id = Guid.NewGuid().ToString(),
            Name = dto.Name,
            HashedKey = hashedKey,
            Prefix = plainKey[..12] + "...",
            Role = dto.Role,
            CreatedBy = User.Identity?.Name ?? "system",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = dto.ExpiresInDays > 0 ? DateTime.UtcNow.AddDays(dto.ExpiresInDays) : null,
            IsActive = true
        };

        _db.ApiKeys.Add(apiKey);
        await _db.SaveChangesAsync();

        // Return the plain key ONCE — it cannot be retrieved after this
        return Ok(new
        {
            id = apiKey.Id,
            name = apiKey.Name,
            key = plainKey,
            prefix = apiKey.Prefix,
            role = apiKey.Role,
            expiresAt = apiKey.ExpiresAt,
            message = "Save this key now. It will not be shown again."
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Revoke(string id)
    {
        var key = await _db.ApiKeys.FindAsync(id);
        if (key == null) return NotFound();

        key.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(new { message = $"API key '{key.Name}' revoked." });
    }

    [HttpDelete("{id}/permanent")]
    public async Task<IActionResult> Delete(string id)
    {
        var key = await _db.ApiKeys.FindAsync(id);
        if (key == null) return NotFound();

        _db.ApiKeys.Remove(key);
        await _db.SaveChangesAsync();
        return Ok(new { message = $"API key '{key.Name}' permanently deleted." });
    }
}

public class CreateApiKeyDto
{
    public string Name { get; set; } = "";
    public string Role { get; set; } = "Operator";
    public int ExpiresInDays { get; set; } = 0; // 0 = no expiration
}
