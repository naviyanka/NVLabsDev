using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexus.Gateway.Migrations
{
    /// <inheritdoc />
    public partial class AddBackgroundJobs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BackgroundJobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PluginId = table.Column<string>(type: "TEXT", nullable: false),
                    ServerIp = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    StartTime = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndTime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ScriptType = table.Column<string>(type: "TEXT", nullable: false),
                    ScriptContent = table.Column<string>(type: "TEXT", nullable: false),
                    LogFilePath = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BackgroundJobs", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BackgroundJobs");
        }
    }
}
