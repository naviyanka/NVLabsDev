## 2026-07-02T20:11:28Z
You are the Backend Refactoring Worker. Your task is to perform cleanup and refactoring in the .NET 8 Gateway backend (`src/Nexus.Gateway`) according to the discovery findings.

IMPORTANT RULES & CONSTRAINTS:
1. You MUST use gitnexus and code-review-graph MCP tools before any refactoring or deletion to understand the blast radius (impact).
2. DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work.
3. The backend must build successfully with zero errors: verify by running `dotnet build` in `src/Nexus.Gateway`.
4. Your working directory is `C:\Users\OrgAdmin\Documents\NVLabs\.agents\teamwork_preview_worker_m3_1`.

Tasks to perform:
1. Safely remove unused files:
   - Delete `src/Nexus.Gateway/Data/servers.json`.
   - Ensure SQLite temporary/journal files (`nexus.db-wal`, `nexus.db-shm`, etc.) are ignored in `.gitignore`.
2. Clean up package dependencies in `src/Nexus.Gateway/Nexus.Gateway.csproj` by deleting unreferenced package references:
   - `Microsoft.CodeAnalysis.Common`
   - `Microsoft.CodeAnalysis.CSharp`
   - `Swashbuckle.AspNetCore`
   - `Microsoft.AspNetCore.OpenApi`
   - `System.DirectoryServices` (Note: KEEP `System.DirectoryServices.AccountManagement` since it is used).
3. Prune dead code within active files:
   - In `src/Nexus.Gateway/Controllers/NotificationsController.cs`: delete endpoint `PostCustom` (lines 67-73) and the unused class `CustomNotification` (lines 76-80).
4. Refactor PowerShell process execution:
   - Inspect controllers `AppsController.cs`, `RolesController.cs`, `SecurityController.cs`, `TasksController.cs`, and `UpdatesController.cs` which manually spawn external `powershell.exe` subprocesses.
   - Extract the subprocess spawning logic into a shared helper service (e.g. `PowerShellExecutionService` / `IPowerShellExecutionService`) to eliminate code duplication.
   - Ensure the process execution in `PowerShellExecutionService` includes proper timeouts and cancellation support (e.g. utilizing `CancellationToken` in `WaitForExitAsync`) to prevent thread hangs or zombie processes.
5. Refactor Database Schema Bootstrap:
   - In `src/Nexus.Gateway/Program.cs` (lines 116-147), there is a brittle bootstrap pattern running 30 raw SQL `ALTER TABLE AppSettings ADD COLUMN ...` statements inside `try-catch` blocks.
   - Replace this boilerplate with a clean startup migration runner (e.g., executing `db.Database.Migrate()` to run pending migrations, or clean database initialization flow).
6. Inject Domain Configuration:
   - Modify `src/Nexus.Gateway/Services/ActiveDirectoryService.cs` to load the domain name dynamically from the database's `AppSettings` table (which has `DefaultDomainName` defined) rather than hardcoding `"nvlabs.com"`.
7. Dynamic YARP Reverse Proxy Port:
   - In `src/Nexus.Gateway/Program.cs`, YARP's destination address is hardcoded to `http://127.0.0.1:5011`.
   - Modify `Program.cs` so that the destination address port is dynamically loaded from the database's `WebBindingPort` setting at startup.
8. Verify your changes do not break the backend build by running `dotnet build` in `src/Nexus.Gateway`.

Verification & Handoff:
- Document all files deleted/edited and the build command results in your handoff report (`handoff.md` in your directory).
- Send a completion message using the send_message tool to your caller agent.
