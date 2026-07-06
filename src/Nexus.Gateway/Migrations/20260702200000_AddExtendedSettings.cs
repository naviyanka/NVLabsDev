using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexus.Gateway.Migrations
{
    /// <inheritdoc />
    public partial class AddExtendedSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CompanyLogoUrl",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SidebarState",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "expanded");

            migrationBuilder.AddColumn<string>(
                name: "AccentColor",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "DefaultWinRmPort",
                table: "AppSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: 5985);

            migrationBuilder.AddColumn<bool>(
                name: "RequireHttpsForRemote",
                table: "AppSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "MaxConcurrentSessions",
                table: "AppSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: 10);

            migrationBuilder.AddColumn<int>(
                name: "DiskAlertThreshold",
                table: "AppSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: 90);

            migrationBuilder.AddColumn<string>(
                name: "AlertQuietHours",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DiscordWebhookUrl",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SlackWebhookUrl",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "MaintenanceMode",
                table: "AppSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AuditLoggingEnabled",
                table: "AppSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFirstRunSetup",
                table: "AppSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "DataDirectoryPath",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "WebBindingPort",
                table: "AppSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: 5011);

            migrationBuilder.AddColumn<string>(
                name: "TimeZoneFormat",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "UTC");

            migrationBuilder.AddColumn<string>(
                name: "DefaultViewMode",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "list");

            migrationBuilder.AddColumn<bool>(
                name: "ShowStatusBadges",
                table: "AppSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultDomainName",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "nvlabs.com");

            migrationBuilder.AddColumn<string>(
                name: "TrustRelationshipPresets",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PsExecutionPolicy",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "RemoteSigned");

            migrationBuilder.AddColumn<string>(
                name: "ScriptLibraryPath",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AppLoginMethod",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "Local");

            migrationBuilder.AddColumn<bool>(
                name: "EnableRbac",
                table: "AppSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "HealthCheckInterval",
                table: "AppSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: 60);

            migrationBuilder.AddColumn<string>(
                name: "LogFilePath",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            // Seed defaults for existing rows
            migrationBuilder.UpdateData(
                table: "AppSettings",
                keyColumn: "Id",
                keyValue: "global",
                columns: new[] { "CompanyLogoUrl", "SidebarState", "AccentColor", "IsFirstRunSetup", "DataDirectoryPath", "TimeZoneFormat", "DefaultViewMode", "DefaultDomainName", "TrustRelationshipPresets", "PsExecutionPolicy", "ScriptLibraryPath", "AppLoginMethod", "LogFilePath", "AlertQuietHours", "DiscordWebhookUrl", "SlackWebhookUrl" },
                values: new object[] { "", "expanded", "", true, "", "UTC", "list", "nvlabs.com", "", "RemoteSigned", "", "Local", "", "", "", "" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "CompanyLogoUrl", table: "AppSettings");
            migrationBuilder.DropColumn(name: "SidebarState", table: "AppSettings");
            migrationBuilder.DropColumn(name: "AccentColor", table: "AppSettings");
            migrationBuilder.DropColumn(name: "DefaultWinRmPort", table: "AppSettings");
            migrationBuilder.DropColumn(name: "RequireHttpsForRemote", table: "AppSettings");
            migrationBuilder.DropColumn(name: "MaxConcurrentSessions", table: "AppSettings");
            migrationBuilder.DropColumn(name: "DiskAlertThreshold", table: "AppSettings");
            migrationBuilder.DropColumn(name: "AlertQuietHours", table: "AppSettings");
            migrationBuilder.DropColumn(name: "DiscordWebhookUrl", table: "AppSettings");
            migrationBuilder.DropColumn(name: "SlackWebhookUrl", table: "AppSettings");
            migrationBuilder.DropColumn(name: "MaintenanceMode", table: "AppSettings");
            migrationBuilder.DropColumn(name: "AuditLoggingEnabled", table: "AppSettings");
            migrationBuilder.DropColumn(name: "IsFirstRunSetup", table: "AppSettings");
            migrationBuilder.DropColumn(name: "DataDirectoryPath", table: "AppSettings");
            migrationBuilder.DropColumn(name: "WebBindingPort", table: "AppSettings");
            migrationBuilder.DropColumn(name: "TimeZoneFormat", table: "AppSettings");
            migrationBuilder.DropColumn(name: "DefaultViewMode", table: "AppSettings");
            migrationBuilder.DropColumn(name: "ShowStatusBadges", table: "AppSettings");
            migrationBuilder.DropColumn(name: "DefaultDomainName", table: "AppSettings");
            migrationBuilder.DropColumn(name: "TrustRelationshipPresets", table: "AppSettings");
            migrationBuilder.DropColumn(name: "PsExecutionPolicy", table: "AppSettings");
            migrationBuilder.DropColumn(name: "ScriptLibraryPath", table: "AppSettings");
            migrationBuilder.DropColumn(name: "AppLoginMethod", table: "AppSettings");
            migrationBuilder.DropColumn(name: "EnableRbac", table: "AppSettings");
            migrationBuilder.DropColumn(name: "HealthCheckInterval", table: "AppSettings");
            migrationBuilder.DropColumn(name: "LogFilePath", table: "AppSettings");
        }
    }
}
