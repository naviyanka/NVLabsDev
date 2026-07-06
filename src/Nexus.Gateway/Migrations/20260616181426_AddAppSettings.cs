using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexus.Gateway.Migrations
{
    /// <inheritdoc />
    public partial class AddAppSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppSettings",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Language = table.Column<string>(type: "TEXT", nullable: false),
                    DefaultLandingPage = table.Column<string>(type: "TEXT", nullable: false),
                    AutoRefreshInterval = table.Column<int>(type: "INTEGER", nullable: false),
                    Theme = table.Column<string>(type: "TEXT", nullable: false),
                    UiDensity = table.Column<string>(type: "TEXT", nullable: false),
                    AnimationsEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    AdSyncInterval = table.Column<int>(type: "INTEGER", nullable: false),
                    SessionTimeout = table.Column<int>(type: "INTEGER", nullable: false),
                    MfaRequired = table.Column<bool>(type: "INTEGER", nullable: false),
                    CpuAlertThreshold = table.Column<int>(type: "INTEGER", nullable: false),
                    RamAlertThreshold = table.Column<int>(type: "INTEGER", nullable: false),
                    NotificationEmail = table.Column<string>(type: "TEXT", nullable: false),
                    WebhookUrl = table.Column<string>(type: "TEXT", nullable: false),
                    TelemetryRetentionDays = table.Column<int>(type: "INTEGER", nullable: false),
                    LogLevel = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppSettings", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "AppSettings",
                columns: new[] { "Id", "AdSyncInterval", "AnimationsEnabled", "AutoRefreshInterval", "CpuAlertThreshold", "DefaultLandingPage", "Language", "LogLevel", "MfaRequired", "NotificationEmail", "RamAlertThreshold", "SessionTimeout", "TelemetryRetentionDays", "Theme", "UiDensity", "WebhookUrl" },
                values: new object[] { "global", 60, true, 30, 90, "dashboard", "en-US", "info", false, "", 90, 30, 30, "dark", "comfortable", "" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppSettings");
        }
    }
}
