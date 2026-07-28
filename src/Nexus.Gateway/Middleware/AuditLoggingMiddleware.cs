using System.Diagnostics;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;

namespace Nexus.Gateway.Middleware;

public class AuditLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditLoggingMiddleware> _logger;

    private static readonly HashSet<string> SkipPrefixes = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/health",
        "/hub/"
    };

    private static readonly HashSet<string> SensitiveFields = new(StringComparer.OrdinalIgnoreCase)
    {
        "password",
        "token",
        "secret",
        "apiKey",
        "accessToken",
        "refreshToken"
    };

    public AuditLoggingMiddleware(RequestDelegate next, ILogger<AuditLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";

        // Skip non-API paths and excluded prefixes
        if (!path.StartsWith("/api", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        foreach (var prefix in SkipPrefixes)
        {
            if (path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }
        }

        // Only audit authenticated requests
        if (!context.User.Identity?.IsAuthenticated ?? true)
        {
            await _next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        string? requestBody = null;

        // Capture request body for write operations
        if (context.Request.Method != "GET" && context.Request.ContentLength > 0)
        {
            context.Request.EnableBuffering();
            using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
            requestBody = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;
            requestBody = SanitizeRequestBody(requestBody);
        }

        await _next(context);

        stopwatch.Stop();

        try
        {
            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? context.User.FindFirst("sub")?.Value
                      ?? "";
            var userName = context.User.FindFirst(ClaimTypes.Name)?.Value
                       ?? context.User.FindFirst("name")?.Value
                       ?? context.User.Identity?.Name
                       ?? "";

            var serverContext = ExtractServerContext(path, context.Request.RouteValues);
            var action = DeriveAction(context.Request.Method, path);
            var resource = DeriveResource(path);
            var resourceId = ExtractResourceId(path);

            var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                ipAddress = forwardedFor.Split(',')[0].Trim();
            }

            var userAgent = context.Request.Headers["User-Agent"].FirstOrDefault() ?? "";

            var entry = new AuditLogEntry
            {
                Id = Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow,
                UserId = userId,
                UserName = userName,
                Action = action,
                Resource = resource,
                ResourceId = resourceId,
                HttpMethod = context.Request.Method,
                RequestPath = path,
                StatusCode = context.Response.StatusCode,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                DurationMs = stopwatch.ElapsedMilliseconds,
                RequestBody = requestBody,
                ResponseSummary = $"{context.Response.StatusCode} {(context.Response.StatusCode >= 200 && context.Response.StatusCode < 300 ? "OK" : "Error")}",
                ServerContext = serverContext
            };

            // Compute hash chain
            //
            // KNOWN LIMITATION: Hash-chain concurrency
            // Under concurrent requests, multiple middleware instances may read the same "last" entry
            // before either writes, producing entries that both reference the same predecessor (a fork).
            // This is acceptable for low-traffic admin panels but becomes a correctness issue under
            // heavy concurrency. A production-grade fix would use a queue/serializer for audit writes
            // or optimistic concurrency with retry on the hash computation.
            using var scope = context.RequestServices.CreateScope();
            var logDb = scope.ServiceProvider.GetRequiredService<NexusLogContext>();

            var lastEntry = await logDb.AuditLogEntries
                .OrderByDescending(e => e.Timestamp)
                .Select(e => new { e.Hash })
                .FirstOrDefaultAsync();

            entry.PreviousHash = lastEntry?.Hash;
            entry.Hash = ComputeHash(entry);

            logDb.AuditLogEntries.Add(entry);
            await logDb.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to write audit log entry for {Path}", path);
        }
    }

    private static string ComputeHash(AuditLogEntry entry)
    {
        var data = $"{entry.PreviousHash}|{entry.Id}|{entry.Timestamp:O}|{entry.UserId}|{entry.Action}|{entry.Resource}|{entry.HttpMethod}|{entry.RequestPath}|{entry.StatusCode}|{entry.DurationMs}";
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(data));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string SanitizeRequestBody(string body)
    {
        if (string.IsNullOrWhiteSpace(body)) return body;

        try
        {
            using var doc = JsonDocument.Parse(body);
            var sanitized = SanitizeJsonElement(doc.RootElement);
            return JsonSerializer.Serialize(sanitized);
        }
        catch
        {
            // Not valid JSON, truncate if too large
            return body.Length > 1000 ? body[..1000] + "...[truncated]" : body;
        }
    }

    private static object? SanitizeJsonElement(JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                var dict = new Dictionary<string, object?>();
                foreach (var prop in element.EnumerateObject())
                {
                    if (SensitiveFields.Contains(prop.Name))
                    {
                        dict[prop.Name] = "[REDACTED]";
                    }
                    else
                    {
                        dict[prop.Name] = SanitizeJsonElement(prop.Value);
                    }
                }
                return dict;
            case JsonValueKind.Array:
                var list = new List<object?>();
                foreach (var item in element.EnumerateArray())
                {
                    list.Add(SanitizeJsonElement(item));
                }
                return list;
            case JsonValueKind.String:
                return element.GetString();
            case JsonValueKind.Number:
                return element.GetDecimal();
            case JsonValueKind.True:
                return true;
            case JsonValueKind.False:
                return false;
            default:
                return null;
        }
    }

    private static string? ExtractServerContext(string path, IReadOnlyDictionary<string, object?> routeValues)
    {
        // Try route values first
        if (routeValues.TryGetValue("serverId", out var serverId) && serverId != null)
            return serverId.ToString();
        if (routeValues.TryGetValue("ip", out var ip) && ip != null)
            return ip.ToString();

        // Try to extract from path pattern: /api/servers/{ip}/... or /api/performance/{serverId}/...
        var match = Regex.Match(path, @"/api/(?:servers|performance)/([^/]+)", RegexOptions.IgnoreCase);
        if (match.Success)
            return match.Groups[1].Value;

        return null;
    }

    private static string DeriveAction(string method, string path)
    {
        var resource = DeriveResource(path);
        var pascalResource = char.ToUpper(resource[0]) + resource[1..];

        return method.ToUpper() switch
        {
            "GET" => $"Read{pascalResource}",
            "POST" => $"Create{pascalResource}",
            "PUT" => $"Update{pascalResource}",
            "PATCH" => $"Update{pascalResource}",
            "DELETE" => $"Delete{pascalResource}",
            _ => $"{method}{pascalResource}"
        };
    }

    private static string DeriveResource(string path)
    {
        // Extract the primary resource from path: /api/{resource}/...
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length >= 2)
        {
            // Skip "api" prefix
            var resource = segments[1];
            return resource.ToLowerInvariant();
        }
        return "unknown";
    }

    private static string? ExtractResourceId(string path)
    {
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        // Pattern: /api/{resource}/{id} or /api/{resource}/{id}/...
        if (segments.Length >= 3)
        {
            return segments[2];
        }
        return null;
    }
}
