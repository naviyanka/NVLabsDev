using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;
using System;

namespace Nexus.Gateway.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UtilsController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public UtilsController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost("test-url")]
        public async Task<IActionResult> TestUrl([FromBody] TestUrlRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Url)) return BadRequest("URL is required");
            if (!Uri.TryCreate(request.Url, UriKind.Absolute, out var uriResult) || (uriResult.Scheme != Uri.UriSchemeHttp && uriResult.Scheme != Uri.UriSchemeHttps))
            {
                return BadRequest("Invalid URL");
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(5);
                var requestMsg = new HttpRequestMessage(HttpMethod.Head, request.Url);
                var response = await client.SendAsync(requestMsg);
                if (response.IsSuccessStatusCode)
                {
                    return Ok(new { valid = true, statusCode = (int)response.StatusCode });
                }
                
                // Fallback to GET if HEAD fails
                var getRequest = new HttpRequestMessage(HttpMethod.Get, request.Url);
                var getResponse = await client.SendAsync(getRequest, HttpCompletionOption.ResponseHeadersRead);
                return Ok(new { valid = getResponse.IsSuccessStatusCode, statusCode = (int)getResponse.StatusCode });
            }
            catch (Exception ex)
            {
                return Ok(new { valid = false, error = ex.Message });
            }
        }
    }

    public class TestUrlRequest
    {
        public string Url { get; set; } = string.Empty;
    }
}
