using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Models;

namespace Nexus.Gateway.Data;

public class LogEntry
{
    public int Id { get; set; }
    public DateTime Timestamp { get; set; }
    public string LogLevel { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class LogSetting
{
    public string Id { get; set; } = "global";
    public bool EnableBackendLogs { get; set; } = true;
}

public class NexusLogContext : DbContext
{
    public NexusLogContext(DbContextOptions<NexusLogContext> options) : base(options) { }
    public DbSet<LogEntry> LogEntries { get; set; } = null!;
    public DbSet<LogSetting> LogSettings { get; set; } = null!;
    public DbSet<AuditLogEntry> AuditLogEntries { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LogEntry>().HasIndex(e => e.Timestamp);
        modelBuilder.Entity<LogSetting>().HasData(new LogSetting { Id = "global", EnableBackendLogs = true });

        // Audit log indexes for efficient querying
        modelBuilder.Entity<AuditLogEntry>().HasIndex(e => e.Timestamp);
        modelBuilder.Entity<AuditLogEntry>().HasIndex(e => e.UserId);
        modelBuilder.Entity<AuditLogEntry>().HasIndex(e => e.Resource);
        modelBuilder.Entity<AuditLogEntry>().HasIndex(e => e.Action);
    }
}
