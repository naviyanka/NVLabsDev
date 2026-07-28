using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;

namespace Nexus.Gateway.Services;

public class AuditLogQueryFilter
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string? Action { get; set; }
    public string? Resource { get; set; }
    public string? HttpMethod { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class AuditLogQueryResult
{
    public List<AuditLogEntry> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class AuditIntegrityResult
{
    public bool IsValid { get; set; }
    public int TotalChecked { get; set; }
    public int ValidEntries { get; set; }
    public int InvalidEntries { get; set; }
    public string? FirstInvalidId { get; set; }
    public string? FirstInvalidTimestamp { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class AuditStats
{
    public int TotalEntries { get; set; }
    public List<DailyCount> DailyCounts { get; set; } = new();
    public List<TopItem> TopUsers { get; set; } = new();
    public List<TopItem> TopResources { get; set; } = new();
    public List<TopItem> TopActions { get; set; } = new();
}

public class DailyCount
{
    public string Date { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class TopItem
{
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class AuditLogService
{
    private readonly NexusLogContext _logDb;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(NexusLogContext logDb, ILogger<AuditLogService> logger)
    {
        _logDb = logDb;
        _logger = logger;
    }

    public async Task LogAsync(AuditLogEntry entry)
    {
        _logDb.AuditLogEntries.Add(entry);
        await _logDb.SaveChangesAsync();
    }

    public async Task<AuditLogQueryResult> QueryAsync(AuditLogQueryFilter filter)
    {
        var query = _logDb.AuditLogEntries.AsQueryable();

        if (!string.IsNullOrEmpty(filter.UserId))
            query = query.Where(e => e.UserId == filter.UserId);

        if (!string.IsNullOrEmpty(filter.UserName))
            query = query.Where(e => e.UserName.Contains(filter.UserName));

        if (!string.IsNullOrEmpty(filter.Action))
            query = query.Where(e => e.Action.Contains(filter.Action));

        if (!string.IsNullOrEmpty(filter.Resource))
            query = query.Where(e => e.Resource == filter.Resource);

        if (!string.IsNullOrEmpty(filter.HttpMethod))
            query = query.Where(e => e.HttpMethod == filter.HttpMethod);

        if (filter.StartDate.HasValue)
            query = query.Where(e => e.Timestamp >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            query = query.Where(e => e.Timestamp <= filter.EndDate.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(e => e.Timestamp)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new AuditLogQueryResult
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
        };
    }

    public async Task<AuditLogEntry?> GetByIdAsync(string id)
    {
        return await _logDb.AuditLogEntries.FindAsync(id);
    }

    public async Task<AuditIntegrityResult> VerifyIntegrityAsync(DateTime? startDate, DateTime? endDate)
    {
        var query = _logDb.AuditLogEntries.AsQueryable();

        if (startDate.HasValue)
            query = query.Where(e => e.Timestamp >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(e => e.Timestamp <= endDate.Value);

        var entries = await query.OrderBy(e => e.Timestamp).ToListAsync();

        if (entries.Count == 0)
        {
            return new AuditIntegrityResult
            {
                IsValid = true,
                TotalChecked = 0,
                ValidEntries = 0,
                InvalidEntries = 0,
                Message = "No entries found in the specified range."
            };
        }

        int validCount = 0;
        int invalidCount = 0;
        string? firstInvalidId = null;
        string? firstInvalidTimestamp = null;

        for (int i = 0; i < entries.Count; i++)
        {
            var entry = entries[i];
            var expectedPreviousHash = i > 0 ? entries[i - 1].Hash : null;

            // Verify the previous hash reference
            if (i > 0 && entry.PreviousHash != expectedPreviousHash)
            {
                invalidCount++;
                if (firstInvalidId == null)
                {
                    firstInvalidId = entry.Id;
                    firstInvalidTimestamp = entry.Timestamp.ToString("O");
                }
                continue;
            }

            // Recompute hash and verify
            var expectedHash = ComputeHash(entry);
            if (entry.Hash != expectedHash)
            {
                invalidCount++;
                if (firstInvalidId == null)
                {
                    firstInvalidId = entry.Id;
                    firstInvalidTimestamp = entry.Timestamp.ToString("O");
                }
            }
            else
            {
                validCount++;
            }
        }

        return new AuditIntegrityResult
        {
            IsValid = invalidCount == 0,
            TotalChecked = entries.Count,
            ValidEntries = validCount,
            InvalidEntries = invalidCount,
            FirstInvalidId = firstInvalidId,
            FirstInvalidTimestamp = firstInvalidTimestamp,
            Message = invalidCount == 0
                ? $"All {entries.Count} entries passed integrity verification."
                : $"Found {invalidCount} invalid entries out of {entries.Count} total."
        };
    }

    /// <summary>
    /// Purges audit log entries older than the specified retention period.
    ///
    /// KNOWN LIMITATION: Purging old entries severs the hash chain at the boundary.
    /// After purge, the first remaining entry's PreviousHash references a now-deleted entry.
    /// Integrity verification handles this by only checking PreviousHash for entries where i > 0
    /// within the queried range, but the logical chain is broken at the purge boundary.
    /// A production-grade fix would either: (a) store a "chain anchor" marker entry that records
    /// the last hash before purge, or (b) re-hash the first remaining entry with a null predecessor.
    /// For this admin-facing system, the current behavior is acceptable and documented.
    /// </summary>
    public async Task<int> PurgeExpiredAsync(int retentionDays)
    {
        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);
        var expiredEntries = await _logDb.AuditLogEntries
            .Where(e => e.Timestamp < cutoff)
            .ToListAsync();

        if (expiredEntries.Count > 0)
        {
            _logDb.AuditLogEntries.RemoveRange(expiredEntries);
            await _logDb.SaveChangesAsync();
            _logger.LogInformation("Purged {Count} audit log entries older than {Days} days", expiredEntries.Count, retentionDays);
        }

        return expiredEntries.Count;
    }

    public async Task<AuditStats> GetStatsAsync()
    {
        var totalEntries = await _logDb.AuditLogEntries.CountAsync();

        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

        var dailyCounts = await _logDb.AuditLogEntries
            .Where(e => e.Timestamp >= sevenDaysAgo)
            .GroupBy(e => e.Timestamp.Date)
            .Select(g => new DailyCount { Date = g.Key.ToString("yyyy-MM-dd"), Count = g.Count() })
            .OrderBy(d => d.Date)
            .ToListAsync();

        var topUsers = await _logDb.AuditLogEntries
            .Where(e => e.Timestamp >= sevenDaysAgo)
            .GroupBy(e => e.UserName)
            .Select(g => new TopItem { Name = g.Key, Count = g.Count() })
            .OrderByDescending(t => t.Count)
            .Take(10)
            .ToListAsync();

        var topResources = await _logDb.AuditLogEntries
            .Where(e => e.Timestamp >= sevenDaysAgo)
            .GroupBy(e => e.Resource)
            .Select(g => new TopItem { Name = g.Key, Count = g.Count() })
            .OrderByDescending(t => t.Count)
            .Take(10)
            .ToListAsync();

        var topActions = await _logDb.AuditLogEntries
            .Where(e => e.Timestamp >= sevenDaysAgo)
            .GroupBy(e => e.Action)
            .Select(g => new TopItem { Name = g.Key, Count = g.Count() })
            .OrderByDescending(t => t.Count)
            .Take(10)
            .ToListAsync();

        return new AuditStats
        {
            TotalEntries = totalEntries,
            DailyCounts = dailyCounts,
            TopUsers = topUsers,
            TopResources = topResources,
            TopActions = topActions
        };
    }

    private static string ComputeHash(AuditLogEntry entry)
    {
        var data = $"{entry.PreviousHash}|{entry.Id}|{entry.Timestamp:O}|{entry.UserId}|{entry.Action}|{entry.Resource}|{entry.HttpMethod}|{entry.RequestPath}|{entry.StatusCode}|{entry.DurationMs}";
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(data));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
