using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexus.ControlPlane.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialControlPlane : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "credential_profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false, collation: "NOCASE"),
                    UserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    Domain = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    ProtectedSecret = table.Column<byte[]>(type: "BLOB", nullable: false),
                    SecretVersion = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    ConcurrencyToken = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_credential_profiles", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_credential_profiles_Name",
                table: "credential_profiles",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "credential_profiles");
        }
    }
}
