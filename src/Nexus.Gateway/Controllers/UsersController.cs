using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class UsersController : ControllerBase
{
    private readonly NexusContext _db;
    private static readonly string[] ValidRoles = { "Viewer", "Operator", "Admin", "SuperAdmin" };

    public UsersController(NexusContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NexusUser>>> GetAll()
    {
        var users = await _db.NexusUsers.OrderBy(u => u.Username).ToListAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<NexusUser>> GetById(string id)
    {
        var user = await _db.NexusUsers.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<NexusUser>> Create([FromBody] UserCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username))
            return BadRequest(new { message = "Username is required." });
        if (!ValidRoles.Contains(dto.Role))
            return BadRequest(new { message = $"Invalid role. Must be one of: {string.Join(", ", ValidRoles)}" });

        var exists = await _db.NexusUsers.AnyAsync(u => u.Username.ToLower() == dto.Username.ToLower());
        if (exists)
            return Conflict(new { message = "User already exists." });

        var user = new NexusUser
        {
            Id = Guid.NewGuid().ToString(),
            Username = dto.Username,
            Role = dto.Role,
            Source = dto.Source ?? "domain",
            Domain = dto.Domain ?? "",
            CreatedAt = DateTime.UtcNow
        };

        _db.NexusUsers.Add(user);
        await _db.SaveChangesAsync();
        return Ok(user);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<NexusUser>> Update(string id, [FromBody] UserUpdateDto dto)
    {
        var user = await _db.NexusUsers.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Role))
        {
            if (!ValidRoles.Contains(dto.Role))
                return BadRequest(new { message = $"Invalid role. Must be one of: {string.Join(", ", ValidRoles)}" });
            user.Role = dto.Role;
        }

        await _db.SaveChangesAsync();
        return Ok(user);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await _db.NexusUsers.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();

        // Prevent deleting self
        var currentUser = User.Identity?.Name;
        if (user.Username.Equals(currentUser, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Cannot delete your own account." });

        _db.NexusUsers.Remove(user);
        await _db.SaveChangesAsync();
        return Ok(new { message = "User deleted." });
    }

    [HttpGet("roles")]
    [AllowAnonymous]
    public ActionResult<string[]> GetRoles()
    {
        return Ok(ValidRoles);
    }
}

public class UserCreateDto
{
    public string Username { get; set; } = "";
    public string Role { get; set; } = "Viewer";
    public string? Source { get; set; }
    public string? Domain { get; set; }
}

public class UserUpdateDto
{
    public string? Role { get; set; }
}
