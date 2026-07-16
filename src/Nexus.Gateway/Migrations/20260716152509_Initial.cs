using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Nexus.Gateway.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppSettings",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Language = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DefaultLandingPage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AutoRefreshInterval = table.Column<int>(type: "int", nullable: false),
                    Theme = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UiDensity = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AnimationsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AdSyncInterval = table.Column<int>(type: "int", nullable: false),
                    SessionTimeout = table.Column<int>(type: "int", nullable: false),
                    MfaRequired = table.Column<bool>(type: "bit", nullable: false),
                    CpuAlertThreshold = table.Column<int>(type: "int", nullable: false),
                    RamAlertThreshold = table.Column<int>(type: "int", nullable: false),
                    NotificationEmail = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WebhookUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TelemetryRetentionDays = table.Column<int>(type: "int", nullable: false),
                    LogLevel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PluginCategories = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TerminalTheme = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DashboardLayout = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AppName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AppSubtitle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CompanyLogoUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SidebarState = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AccentColor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DefaultWinRmPort = table.Column<int>(type: "int", nullable: false),
                    RequireHttpsForRemote = table.Column<bool>(type: "bit", nullable: false),
                    MaxConcurrentSessions = table.Column<int>(type: "int", nullable: false),
                    DiskAlertThreshold = table.Column<int>(type: "int", nullable: false),
                    AlertQuietHours = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DiscordWebhookUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SlackWebhookUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MaintenanceMode = table.Column<bool>(type: "bit", nullable: false),
                    AuditLoggingEnabled = table.Column<bool>(type: "bit", nullable: false),
                    IsFirstRunSetup = table.Column<bool>(type: "bit", nullable: false),
                    DataDirectoryPath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WebBindingPort = table.Column<int>(type: "int", nullable: false),
                    TimeZoneFormat = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DefaultViewMode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShowStatusBadges = table.Column<bool>(type: "bit", nullable: false),
                    DefaultDomainName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TrustRelationshipPresets = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PsExecutionPolicy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ScriptLibraryPath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AppLoginMethod = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EnableRbac = table.Column<bool>(type: "bit", nullable: false),
                    HealthCheckInterval = table.Column<int>(type: "int", nullable: false),
                    LogFilePath = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BackgroundJobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PluginId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ServerIp = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ScriptType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ScriptContent = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LogFilePath = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BackgroundJobs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Disks",
                columns: table => new
                {
                    DbId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServerIp = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Id = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Model = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SizeGB = table.Column<double>(type: "float", nullable: false),
                    Bus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Health = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PartitionsJson = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Disks", x => x.DbId);
                });

            migrationBuilder.CreateTable(
                name: "InstalledApps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServerIp = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Publisher = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Version = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InstallDate = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Location = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SizeMB = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UninstallString = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InstalledApps", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ServerIp = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PerfSamples",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServerIp = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    T = table.Column<long>(type: "bigint", nullable: false),
                    Cpu = table.Column<double>(type: "float", nullable: false),
                    Mem = table.Column<double>(type: "float", nullable: false),
                    DiskR = table.Column<double>(type: "float", nullable: false),
                    DiskW = table.Column<double>(type: "float", nullable: false),
                    NetIn = table.Column<double>(type: "float", nullable: false),
                    NetOut = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PerfSamples", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Plugins",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Icon = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ScriptType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SourceType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ScriptContent = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Author = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsBuiltIn = table.Column<bool>(type: "bit", nullable: false),
                    TargetRoute = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Plugins", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Processes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServerIp = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Pid = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cpu = table.Column<double>(type: "float", nullable: false),
                    MemMB = table.Column<double>(type: "float", nullable: false),
                    MemPct = table.Column<double>(type: "float", nullable: false),
                    Handles = table.Column<int>(type: "int", nullable: false),
                    Threads = table.Column<int>(type: "int", nullable: false),
                    User = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CommandLine = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExecutablePath = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Processes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SecurityEventLogs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ServerIp = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    EventId = table.Column<int>(type: "int", nullable: false),
                    Level = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TimeCreated = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RecordId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SecurityEventLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SecuritySnapshots",
                columns: table => new
                {
                    ServerIp = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    OpenPortsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LocalAdminsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FailedLogins24h = table.Column<int>(type: "int", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SecuritySnapshots", x => x.ServerIp);
                });

            migrationBuilder.CreateTable(
                name: "ServerRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServerIp = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InstallState = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FeatureType = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServerRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Servers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Ip = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Os = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cpu = table.Column<double>(type: "float", nullable: false),
                    Mem = table.Column<double>(type: "float", nullable: false),
                    Disk = table.Column<double>(type: "float", nullable: false),
                    Uptime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Site = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsAdFetched = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Servers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ServerUpdates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServerIp = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MaxDownloadSize = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServerUpdates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Volumes",
                columns: table => new
                {
                    DbId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServerIp = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Letter = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Fs = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SizeGB = table.Column<double>(type: "float", nullable: false),
                    UsedGB = table.Column<double>(type: "float", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DiskId = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Volumes", x => x.DbId);
                });

            migrationBuilder.InsertData(
                table: "AppSettings",
                columns: new[] { "Id", "AccentColor", "AdSyncInterval", "AlertQuietHours", "AnimationsEnabled", "AppLoginMethod", "AppName", "AppSubtitle", "AuditLoggingEnabled", "AutoRefreshInterval", "CompanyLogoUrl", "CpuAlertThreshold", "DashboardLayout", "DataDirectoryPath", "DefaultDomainName", "DefaultLandingPage", "DefaultViewMode", "DefaultWinRmPort", "DiscordWebhookUrl", "DiskAlertThreshold", "EnableRbac", "HealthCheckInterval", "IsFirstRunSetup", "Language", "LogFilePath", "LogLevel", "MaintenanceMode", "MaxConcurrentSessions", "MfaRequired", "NotificationEmail", "PluginCategories", "PsExecutionPolicy", "RamAlertThreshold", "RequireHttpsForRemote", "ScriptLibraryPath", "SessionTimeout", "ShowStatusBadges", "SidebarState", "SlackWebhookUrl", "TelemetryRetentionDays", "TerminalTheme", "Theme", "TimeZoneFormat", "TrustRelationshipPresets", "UiDensity", "WebBindingPort", "WebhookUrl" },
                values: new object[] { "global", "", 60, "", true, "Local", "NEXUS", "Horizon UI Shell", false, 30, "", 90, "", "", "nvlabs.com", "dashboard", "list", 5985, "", 90, false, 60, true, "en-US", "", "info", false, 10, false, "", "Management,Security,Infrastructure,Advanced", "RemoteSigned", 90, false, "", 30, true, "expanded", "", 30, "nexus-dark", "dark", "UTC", "", "comfortable", 5011, "" });

            migrationBuilder.InsertData(
                table: "Plugins",
                columns: new[] { "Id", "Author", "Category", "Description", "Icon", "IsActive", "IsBuiltIn", "Name", "ScriptContent", "ScriptType", "SourceType", "TargetRoute" },
                values: new object[,]
                {
                    { "builtin-apps", "Custom", "Management", "Installed Programs", "package", true, true, "Installed Apps", "", "powershell", "inline", "/apps" },
                    { "builtin-certs", "Custom", "Security", "Certificate Manager", "badge-check", true, true, "Certificates", "", "powershell", "inline", "/certificates" },
                    { "builtin-defender", "Custom", "Security", "Antivirus Management", "shield", true, true, "Windows Defender", "", "powershell", "inline", "/defender" },
                    { "builtin-devices", "Custom", "Infrastructure", "Device Manager", "cpu", true, true, "Devices", "", "powershell", "inline", "/devices" },
                    { "builtin-events", "Custom", "Advanced", "Windows Event Logs", "scroll-text", true, true, "Event Viewer", "", "powershell", "inline", "/events" },
                    { "builtin-files", "Custom", "Management", "File Explorer", "folder-open", true, true, "Files", "", "powershell", "inline", "/files" },
                    { "builtin-firewall", "Custom", "Security", "Windows Defender Firewall", "shield", true, true, "Firewall", "", "powershell", "inline", "/firewall" },
                    { "builtin-networks", "Custom", "Infrastructure", "Network Interfaces", "network", true, true, "Networks", "", "powershell", "inline", "/networks" },
                    { "builtin-powershell", "Custom", "Advanced", "Interactive Terminal", "terminal", true, true, "PowerShell", "", "powershell", "inline", "/powershell" },
                    { "builtin-processes", "Custom", "Management", "Manage running processes", "app-window", true, true, "Processes", "", "powershell", "inline", "/processes" },
                    { "builtin-rdp", "Custom", "Management", "RDP Sessions", "monitor", true, true, "Remote Desktop", "", "powershell", "inline", "/remote-desktop" },
                    { "builtin-registry", "Custom", "Infrastructure", "Registry Editor", "database-zap", true, true, "Registry", "", "powershell", "inline", "/registry" },
                    { "builtin-replica", "Custom", "Infrastructure", "Storage Replica status", "copy-slash", true, true, "Storage Replica", "", "powershell", "inline", "/storage-replica" },
                    { "builtin-roles", "Custom", "Management", "Windows Server Roles", "layers", true, true, "Roles & Features", "", "powershell", "inline", "/roles" },
                    { "builtin-security", "Custom", "Security", "Security Event Logs", "key-round", true, true, "Security Events", "", "powershell", "inline", "/security" },
                    { "builtin-services", "Custom", "Management", "Manage Windows Services", "cog", true, true, "Services", "", "powershell", "inline", "/services" },
                    { "builtin-sharepoint", "Custom", "Management", "Automate SharePoint deployments", "server", true, true, "SharePoint Setup", "", "powershell", "inline", "/sharepoint-setup" },
                    { "builtin-storage", "Custom", "Management", "Manage logical volumes and disks", "hard-drive", true, true, "Storage", "", "powershell", "inline", "/storage" },
                    { "builtin-tasks", "Custom", "Management", "Task Scheduler", "calendar", true, true, "Scheduled Tasks", "", "powershell", "inline", "/tasks" },
                    { "builtin-updates", "Custom", "Management", "Patch Management", "refresh-cw", true, true, "Windows Update", "", "powershell", "inline", "/updates" },
                    { "builtin-users", "Custom", "Security", "User Management", "users", true, true, "Local Users & Groups", "", "powershell", "inline", "/users" },
                    { "builtin-vms", "Custom", "Infrastructure", "Hyper-V VMs", "server", true, true, "Virtual Machines", "", "powershell", "inline", "/vms" },
                    { "builtin-vswitches", "Custom", "Infrastructure", "Hyper-V Switches", "git-branch", true, true, "Virtual Switches", "", "powershell", "inline", "/vswitches" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Disks_ServerIp",
                table: "Disks",
                column: "ServerIp");

            migrationBuilder.CreateIndex(
                name: "IX_InstalledApps_ServerIp",
                table: "InstalledApps",
                column: "ServerIp");

            migrationBuilder.CreateIndex(
                name: "IX_PerfSamples_ServerIp_T",
                table: "PerfSamples",
                columns: new[] { "ServerIp", "T" });

            migrationBuilder.CreateIndex(
                name: "IX_Processes_ServerIp",
                table: "Processes",
                column: "ServerIp");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityEventLogs_ServerIp",
                table: "SecurityEventLogs",
                column: "ServerIp");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityEventLogs_ServerIp_TimeCreated",
                table: "SecurityEventLogs",
                columns: new[] { "ServerIp", "TimeCreated" });

            migrationBuilder.CreateIndex(
                name: "IX_Volumes_ServerIp",
                table: "Volumes",
                column: "ServerIp");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppSettings");

            migrationBuilder.DropTable(
                name: "BackgroundJobs");

            migrationBuilder.DropTable(
                name: "Disks");

            migrationBuilder.DropTable(
                name: "InstalledApps");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "PerfSamples");

            migrationBuilder.DropTable(
                name: "Plugins");

            migrationBuilder.DropTable(
                name: "Processes");

            migrationBuilder.DropTable(
                name: "SecurityEventLogs");

            migrationBuilder.DropTable(
                name: "SecuritySnapshots");

            migrationBuilder.DropTable(
                name: "ServerRoles");

            migrationBuilder.DropTable(
                name: "Servers");

            migrationBuilder.DropTable(
                name: "ServerUpdates");

            migrationBuilder.DropTable(
                name: "Volumes");
        }
    }
}
