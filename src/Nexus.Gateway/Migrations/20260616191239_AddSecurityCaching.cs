using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexus.Gateway.Migrations
{
    /// <inheritdoc />
    public partial class AddSecurityCaching : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SecurityEventLogs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    ServerIp = table.Column<string>(type: "TEXT", nullable: false),
                    EventId = table.Column<int>(type: "INTEGER", nullable: false),
                    Level = table.Column<string>(type: "TEXT", nullable: false),
                    TimeCreated = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Message = table.Column<string>(type: "TEXT", nullable: false),
                    RecordId = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SecurityEventLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SecuritySnapshots",
                columns: table => new
                {
                    ServerIp = table.Column<string>(type: "TEXT", nullable: false),
                    OpenPortsJson = table.Column<string>(type: "TEXT", nullable: false),
                    LocalAdminsJson = table.Column<string>(type: "TEXT", nullable: false),
                    FailedLogins24h = table.Column<int>(type: "INTEGER", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SecuritySnapshots", x => x.ServerIp);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SecurityEventLogs_ServerIp",
                table: "SecurityEventLogs",
                column: "ServerIp");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityEventLogs_ServerIp_TimeCreated",
                table: "SecurityEventLogs",
                columns: new[] { "ServerIp", "TimeCreated" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SecurityEventLogs");

            migrationBuilder.DropTable(
                name: "SecuritySnapshots");
        }
    }
}
