using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Services;

namespace Nexus.Gateway.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ActiveDirectoryController : ControllerBase
    {
        private readonly ActiveDirectoryService _adService;

        public ActiveDirectoryController(ActiveDirectoryService adService)
        {
            _adService = adService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q)) return Ok(new List<string>());
            var users = await _adService.SearchUsersAsync(q);
            return Ok(users);
        }
    }
}
