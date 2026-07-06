using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Models;

namespace Nexus.Gateway.Data;

public class NexusContext : DbContext
{
    public NexusContext(DbContextOptions<NexusContext> options) : base(options) { }

    public DbSet<Server> Servers { get; set; } = null!;
    public DbSet<PerfSample> PerfSamples { get; set; } = null!;
    public DbSet<ProcessModel> Processes { get; set; } = null!;
    public DbSet<DiskModel> Disks { get; set; } = null!;
    public DbSet<VolumeModel> Volumes { get; set; } = null!;
    public DbSet<InstalledAppEntity> InstalledApps { get; set; } = null!;
    public DbSet<WindowsRoleEntity> ServerRoles { get; set; } = null!;
    public DbSet<WindowsUpdateEntity> ServerUpdates { get; set; } = null!;
    public DbSet<NotificationEntity> Notifications { get; set; } = null!;
    public DbSet<AppSetting> AppSettings { get; set; } = null!;
    public DbSet<SecurityEventLog> SecurityEventLogs { get; set; } = null!;
    public DbSet<SecuritySnapshot> SecuritySnapshots { get; set; } = null!;
    public DbSet<PluginEntity> Plugins { get; set; } = null!;
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PerfSample>().HasIndex(p => new { p.ServerIp, p.T });
        modelBuilder.Entity<ProcessModel>().HasIndex(p => p.ServerIp);
        
        modelBuilder.Entity<DiskModel>().HasKey(d => d.DbId);
        modelBuilder.Entity<DiskModel>().HasIndex(d => d.ServerIp);
        
        modelBuilder.Entity<VolumeModel>().HasKey(v => v.DbId);
        modelBuilder.Entity<VolumeModel>().HasIndex(v => v.ServerIp);

        modelBuilder.Entity<InstalledAppEntity>().HasIndex(a => a.ServerIp);

        modelBuilder.Entity<SecurityEventLog>().HasIndex(e => e.ServerIp);
        modelBuilder.Entity<SecurityEventLog>().HasIndex(e => new { e.ServerIp, e.TimeCreated });
        
        modelBuilder.Entity<AppSetting>().HasData(new AppSetting { Id = "global" });

        modelBuilder.Entity<PluginEntity>().HasData(
            new PluginEntity { Id = "builtin-processes", Name = "Processes", Description = "Manage running processes", Icon = "app-window", Category = "Management", IsBuiltIn = true, IsActive = true, TargetRoute = "/processes" },
            new PluginEntity { Id = "builtin-services", Name = "Services", Description = "Manage Windows Services", Icon = "cog", Category = "Management", IsBuiltIn = true, IsActive = true, TargetRoute = "/services" },
            new PluginEntity { Id = "builtin-storage", Name = "Storage", Description = "Manage logical volumes and disks", Icon = "hard-drive", Category = "Management", IsBuiltIn = true, IsActive = true, TargetRoute = "/storage" },
            new PluginEntity { Id = "builtin-files", Name = "Files", Description = "File Explorer", Icon = "folder-open", Category = "Management", IsBuiltIn = true, IsActive = true, TargetRoute = "/files" },
            new PluginEntity { Id = "builtin-tasks", Name = "Scheduled Tasks", Description = "Task Scheduler", Icon = "calendar", Category = "Management", IsBuiltIn = true, IsActive = true, TargetRoute = "/tasks" },
            new PluginEntity { Id = "builtin-apps", Name = "Installed Apps", Description = "Installed Programs", Icon = "package", Category = "Management", IsBuiltIn = true, IsActive = true, TargetRoute = "/apps" },
            new PluginEntity { Id = "builtin-roles", Name = "Roles & Features", Description = "Windows Server Roles", Icon = "layers", Category = "Management", IsBuiltIn = true, IsActive = true, TargetRoute = "/roles" },
            new PluginEntity { Id = "builtin-updates", Name = "Windows Update", Description = "Patch Management", Icon = "refresh-cw", Category = "Management", IsBuiltIn = true, IsActive = true, TargetRoute = "/updates" },
            new PluginEntity { Id = "builtin-rdp", Name = "Remote Desktop", Description = "RDP Sessions", Icon = "monitor", Category = "Management", IsBuiltIn = true, IsActive = true, TargetRoute = "/remote-desktop" },
            
            new PluginEntity { Id = "builtin-firewall", Name = "Firewall", Description = "Windows Defender Firewall", Icon = "shield", Category = "Security", IsBuiltIn = true, IsActive = true, TargetRoute = "/firewall" },
            new PluginEntity { Id = "builtin-certs", Name = "Certificates", Description = "Certificate Manager", Icon = "badge-check", Category = "Security", IsBuiltIn = true, IsActive = true, TargetRoute = "/certificates" },
            new PluginEntity { Id = "builtin-users", Name = "Local Users & Groups", Description = "User Management", Icon = "users", Category = "Security", IsBuiltIn = true, IsActive = true, TargetRoute = "/users" },
            new PluginEntity { Id = "builtin-security", Name = "Security Events", Description = "Security Event Logs", Icon = "key-round", Category = "Security", IsBuiltIn = true, IsActive = true, TargetRoute = "/security" },

            new PluginEntity { Id = "builtin-networks", Name = "Networks", Description = "Network Interfaces", Icon = "network", Category = "Infrastructure", IsBuiltIn = true, IsActive = true, TargetRoute = "/networks" },
            new PluginEntity { Id = "builtin-devices", Name = "Devices", Description = "Device Manager", Icon = "cpu", Category = "Infrastructure", IsBuiltIn = true, IsActive = true, TargetRoute = "/devices" },
            new PluginEntity { Id = "builtin-registry", Name = "Registry", Description = "Registry Editor", Icon = "database-zap", Category = "Infrastructure", IsBuiltIn = true, IsActive = true, TargetRoute = "/registry" },
            new PluginEntity { Id = "builtin-vms", Name = "Virtual Machines", Description = "Hyper-V VMs", Icon = "server", Category = "Infrastructure", IsBuiltIn = true, IsActive = true, TargetRoute = "/vms" },
            new PluginEntity { Id = "builtin-vswitches", Name = "Virtual Switches", Description = "Hyper-V Switches", Icon = "git-branch", Category = "Infrastructure", IsBuiltIn = true, IsActive = true, TargetRoute = "/vswitches" },
            new PluginEntity { Id = "builtin-replica", Name = "Storage Replica", Description = "Storage Replica status", Icon = "copy-slash", Category = "Infrastructure", IsBuiltIn = true, IsActive = true, TargetRoute = "/storage-replica" },

            new PluginEntity { Id = "builtin-powershell", Name = "PowerShell", Description = "Interactive Terminal", Icon = "terminal", Category = "Advanced", IsBuiltIn = true, IsActive = true, TargetRoute = "/powershell" },
            new PluginEntity { Id = "builtin-events", Name = "Event Viewer", Description = "Windows Event Logs", Icon = "scroll-text", Category = "Advanced", IsBuiltIn = true, IsActive = true, TargetRoute = "/events" }
        );
    }
}
