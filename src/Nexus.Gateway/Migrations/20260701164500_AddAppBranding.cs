using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexus.Gateway.Migrations
{
    /// <inheritdoc />
    public partial class AddAppBranding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AppName",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AppSubtitle",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DashboardLayout",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TerminalTheme",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "AppSettings",
                keyColumn: "Id",
                keyValue: "global",
                columns: new[] { "AppName", "AppSubtitle", "DashboardLayout", "TerminalTheme" },
                values: new object[] { "NEXUS", "Horizon UI Shell", "", "nexus-dark" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AppName",
                table: "AppSettings");

            migrationBuilder.DropColumn(
                name: "AppSubtitle",
                table: "AppSettings");

            migrationBuilder.DropColumn(
                name: "DashboardLayout",
                table: "AppSettings");

            migrationBuilder.DropColumn(
                name: "TerminalTheme",
                table: "AppSettings");
        }
    }
}
