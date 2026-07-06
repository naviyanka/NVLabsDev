namespace Nexus.Gateway.Models;

public class AppSetting
{
    public string Id { get; set; } = "global";
    public string Language { get; set; } = "en-US";
    public string DefaultLandingPage { get; set; } = "dashboard";
    public int AutoRefreshInterval { get; set; } = 30;
    
    public string Theme { get; set; } = "dark";
    public string UiDensity { get; set; } = "comfortable";
    public bool AnimationsEnabled { get; set; } = true;

    public int AdSyncInterval { get; set; } = 60;
    public int SessionTimeout { get; set; } = 30;
    public bool MfaRequired { get; set; } = false;

    public int CpuAlertThreshold { get; set; } = 90;
    public int RamAlertThreshold { get; set; } = 90;
    public string NotificationEmail { get; set; } = "";
    public string WebhookUrl { get; set; } = "";

    public int TelemetryRetentionDays { get; set; } = 30;
    public string LogLevel { get; set; } = "info";

    public string PluginCategories { get; set; } = "Management,Security,Infrastructure,Advanced";

    // PowerShell terminal theme
    public string TerminalTheme { get; set; } = "nexus-dark";

    // Editable Dashboard Layout JSON
    public string DashboardLayout { get; set; } = "";
    
    // Branding
    public string AppName { get; set; } = "NEXUS";
    public string AppSubtitle { get; set; } = "Horizon UI Shell";
    public string CompanyLogoUrl { get; set; } = "";
    public string SidebarState { get; set; } = "expanded";
    public string AccentColor { get; set; } = "";

    // Infrastructure & Connection
    public int DefaultWinRmPort { get; set; } = 5985;
    public bool RequireHttpsForRemote { get; set; } = false;
    public int MaxConcurrentSessions { get; set; } = 10;

    // Advanced Alerting
    public int DiskAlertThreshold { get; set; } = 90;
    public string AlertQuietHours { get; set; } = "";
    public string DiscordWebhookUrl { get; set; } = "";
    public string SlackWebhookUrl { get; set; } = "";

    // Admin & Security Controls
    public bool MaintenanceMode { get; set; } = false;
    public bool AuditLoggingEnabled { get; set; } = false;

    // Local Environment & Deployment
    public bool IsFirstRunSetup { get; set; } = true;
    public string DataDirectoryPath { get; set; } = "";
    public int WebBindingPort { get; set; } = 5011;

    // General & UI Additions
    public string TimeZoneFormat { get; set; } = "UTC";
    public string DefaultViewMode { get; set; } = "list";
    public bool ShowStatusBadges { get; set; } = true;

    // Active Directory Additions
    public string DefaultDomainName { get; set; } = "nvlabs.com";
    public string TrustRelationshipPresets { get; set; } = "";

    // Automation & PowerShell
    public string PsExecutionPolicy { get; set; } = "RemoteSigned";
    public string ScriptLibraryPath { get; set; } = "";

    // Security & Authentication Additions
    public string AppLoginMethod { get; set; } = "Local";
    public bool EnableRbac { get; set; } = false;

    // Monitoring & Diagnostics Additions
    public int HealthCheckInterval { get; set; } = 60;
    public string LogFilePath { get; set; } = "";
}
