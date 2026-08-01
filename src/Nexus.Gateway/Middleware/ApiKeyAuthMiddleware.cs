using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;

namespace Nexus.Gateway.Middleware;

/// <summary>
/// Middleware that authenticates requests via X-Api-Key header.
/// If a valid API key is provided, it creates a ClaimsPrincipal with the key's role.
/// If JWT auth already succeeded, this middleware is skipped.
/// </summary>
public class ApiKeyAuthMiddleware
{
    private readonly RequestDelegate _next;

    public ApiKeyAuthMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip if already authenticated via JWT
        if (context.User.Identity?.IsAuthenticated == true)
        {
            await _next(context);
            return;
        }

        // Check for X-Api-Key header
        if (!context.Request.Headers.TryGetValue("X-Api-Key", out var apiKeyHeader))
        {
            await _next(context);
            return;
        }

        var providedKey = apiKeyHeader.ToString();
        if (string.IsNullOrWhiteSpace(providedKey))
        {
            await _next(context);
            return;
        }

        // Resolve key from database
        var db = context.RequestServices.GetRequiredService<NexusContext>();
        var hashedKey = ApiKey.HashKey(providedKey);

        var apiKey = await db.ApiKeys.FirstOrDefaultAsync(k => k.HashedKey == hashedKey && k.IsActive);

        if (apiKey == null)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new { message = "Invalid or revoked API key." });
            return;
        }

        // Check expiration
        if (apiKey.ExpiresAt.HasValue && apiKey.ExpiresAt.Value < DateTime.UtcNow)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new { message = "API key has expired." });
            return;
        }

        // Update last used
        apiKey.LastUsedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        // Create authenticated principal
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, $"apikey:{apiKey.Name}"),
            new Claim(ClaimTypes.Role, apiKey.Role),
            new Claim("ApiKeyId", apiKey.Id)
        };

        var identity = new ClaimsIdentity(claims, "ApiKey");
        context.User = new ClaimsPrincipal(identity);

        await _next(context);
    }
}

public static class ApiKeyAuthMiddlewareExtensions
{
    public static IApplicationBuilder UseApiKeyAuth(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ApiKeyAuthMiddleware>();
    }
}
