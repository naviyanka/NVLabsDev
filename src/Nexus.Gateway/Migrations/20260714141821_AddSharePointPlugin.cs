using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Nexus.Gateway.Migrations
{
    /// <inheritdoc />
    public partial class AddSharePointPlugin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Plugins",
                columns: new[] { "Id", "Author", "Category", "Description", "Icon", "IsActive", "IsBuiltIn", "Name", "ScriptContent", "ScriptType", "SourceType", "TargetRoute" },
                values: new object[,]
                {
                    { "builtin-defender", "Custom", "Security", "Antivirus Management", "shield", true, true, "Windows Defender", "", "powershell", "inline", "/defender" },
                    { "builtin-sharepoint", "Custom", "Management", "Automate SharePoint deployments", "server", true, true, "SharePoint Setup", "", "powershell", "inline", "/sharepoint-setup" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-defender");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-sharepoint");
        }
    }
}
