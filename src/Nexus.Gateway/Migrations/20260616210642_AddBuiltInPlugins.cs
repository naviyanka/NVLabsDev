using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Nexus.Gateway.Migrations
{
    /// <inheritdoc />
    public partial class AddBuiltInPlugins : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsBuiltIn",
                table: "Plugins",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TargetRoute",
                table: "Plugins",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PluginCategories",
                table: "AppSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "AppSettings",
                keyColumn: "Id",
                keyValue: "global",
                column: "PluginCategories",
                value: "Management,Security,Infrastructure,Advanced");

            migrationBuilder.InsertData(
                table: "Plugins",
                columns: new[] { "Id", "Author", "Category", "Description", "Icon", "IsActive", "IsBuiltIn", "Name", "ScriptContent", "ScriptType", "SourceType", "TargetRoute" },
                values: new object[,]
                {
                    { "builtin-apps", "Custom", "Management", "Installed Programs", "package", true, true, "Installed Apps", "", "powershell", "inline", "/apps" },
                    { "builtin-certs", "Custom", "Security", "Certificate Manager", "badge-check", true, true, "Certificates", "", "powershell", "inline", "/certificates" },
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
                    { "builtin-storage", "Custom", "Management", "Manage logical volumes and disks", "hard-drive", true, true, "Storage", "", "powershell", "inline", "/storage" },
                    { "builtin-tasks", "Custom", "Management", "Task Scheduler", "calendar", true, true, "Scheduled Tasks", "", "powershell", "inline", "/tasks" },
                    { "builtin-updates", "Custom", "Management", "Patch Management", "refresh-cw", true, true, "Windows Update", "", "powershell", "inline", "/updates" },
                    { "builtin-users", "Custom", "Security", "User Management", "users", true, true, "Local Users & Groups", "", "powershell", "inline", "/users" },
                    { "builtin-vms", "Custom", "Infrastructure", "Hyper-V VMs", "server", true, true, "Virtual Machines", "", "powershell", "inline", "/vms" },
                    { "builtin-vswitches", "Custom", "Infrastructure", "Hyper-V Switches", "git-branch", true, true, "Virtual Switches", "", "powershell", "inline", "/vswitches" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-apps");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-certs");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-devices");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-events");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-files");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-firewall");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-networks");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-powershell");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-processes");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-rdp");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-registry");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-replica");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-roles");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-security");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-services");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-storage");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-tasks");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-updates");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-users");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-vms");

            migrationBuilder.DeleteData(
                table: "Plugins",
                keyColumn: "Id",
                keyValue: "builtin-vswitches");

            migrationBuilder.DropColumn(
                name: "IsBuiltIn",
                table: "Plugins");

            migrationBuilder.DropColumn(
                name: "TargetRoute",
                table: "Plugins");

            migrationBuilder.DropColumn(
                name: "PluginCategories",
                table: "AppSettings");
        }
    }
}
