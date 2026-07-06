using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexus.Gateway.Migrations
{
    /// <inheritdoc />
    public partial class AddInstalledApps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Disks",
                columns: table => new
                {
                    DbId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServerIp = table.Column<string>(type: "TEXT", nullable: false),
                    Id = table.Column<string>(type: "TEXT", nullable: true),
                    Model = table.Column<string>(type: "TEXT", nullable: false),
                    SizeGB = table.Column<double>(type: "REAL", nullable: false),
                    Bus = table.Column<string>(type: "TEXT", nullable: false),
                    Health = table.Column<string>(type: "TEXT", nullable: false),
                    PartitionsJson = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Disks", x => x.DbId);
                });

            migrationBuilder.CreateTable(
                name: "InstalledApps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServerIp = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Publisher = table.Column<string>(type: "TEXT", nullable: false),
                    Version = table.Column<string>(type: "TEXT", nullable: false),
                    InstallDate = table.Column<string>(type: "TEXT", nullable: false),
                    Location = table.Column<string>(type: "TEXT", nullable: false),
                    SizeMB = table.Column<string>(type: "TEXT", nullable: false),
                    UninstallString = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InstalledApps", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PerfSamples",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServerIp = table.Column<string>(type: "TEXT", nullable: false),
                    T = table.Column<long>(type: "INTEGER", nullable: false),
                    Cpu = table.Column<double>(type: "REAL", nullable: false),
                    Mem = table.Column<double>(type: "REAL", nullable: false),
                    DiskR = table.Column<double>(type: "REAL", nullable: false),
                    DiskW = table.Column<double>(type: "REAL", nullable: false),
                    NetIn = table.Column<double>(type: "REAL", nullable: false),
                    NetOut = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PerfSamples", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Processes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServerIp = table.Column<string>(type: "TEXT", nullable: false),
                    Pid = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Cpu = table.Column<double>(type: "REAL", nullable: false),
                    MemMB = table.Column<double>(type: "REAL", nullable: false),
                    MemPct = table.Column<double>(type: "REAL", nullable: false),
                    Handles = table.Column<int>(type: "INTEGER", nullable: false),
                    Threads = table.Column<int>(type: "INTEGER", nullable: false),
                    User = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Processes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Servers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Ip = table.Column<string>(type: "TEXT", nullable: false),
                    Role = table.Column<string>(type: "TEXT", nullable: false),
                    Os = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    Cpu = table.Column<double>(type: "REAL", nullable: false),
                    Mem = table.Column<double>(type: "REAL", nullable: false),
                    Disk = table.Column<double>(type: "REAL", nullable: false),
                    Uptime = table.Column<string>(type: "TEXT", nullable: false),
                    Site = table.Column<string>(type: "TEXT", nullable: false),
                    IsAdFetched = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Servers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Volumes",
                columns: table => new
                {
                    DbId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ServerIp = table.Column<string>(type: "TEXT", nullable: false),
                    Letter = table.Column<string>(type: "TEXT", nullable: false),
                    Label = table.Column<string>(type: "TEXT", nullable: false),
                    Fs = table.Column<string>(type: "TEXT", nullable: false),
                    SizeGB = table.Column<double>(type: "REAL", nullable: false),
                    UsedGB = table.Column<double>(type: "REAL", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    DiskId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Volumes", x => x.DbId);
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
                name: "IX_Volumes_ServerIp",
                table: "Volumes",
                column: "ServerIp");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Disks");

            migrationBuilder.DropTable(
                name: "InstalledApps");

            migrationBuilder.DropTable(
                name: "PerfSamples");

            migrationBuilder.DropTable(
                name: "Processes");

            migrationBuilder.DropTable(
                name: "Servers");

            migrationBuilder.DropTable(
                name: "Volumes");
        }
    }
}
