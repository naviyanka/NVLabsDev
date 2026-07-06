# Handoff Report — Backend Explorer Investigation

## 1. Observation
*   **Unreferenced File**: `src/Nexus.Gateway/Data/servers.json` exists but a search across all `.cs` files returned no references:
    ```powershell
    Get-ChildItem -Filter *.cs -Recurse | Select-String "servers.json"
    ```
    Returned 0 matches.
*   **Unused Packages**: `src/Nexus.Gateway/Nexus.Gateway.csproj` contains references to:
    *   `Microsoft.CodeAnalysis.Common` (v4.8.0)
    *   `Microsoft.CodeAnalysis.CSharp` (v4.8.0)
    *   `Swashbuckle.AspNetCore` (v6.6.2)
    *   `Microsoft.AspNetCore.OpenApi` (v8.0.28)
    *   `System.DirectoryServices` (v10.0.9)
    A GitNexus FTS search for these libraries (e.g. `npx gitnexus query --repo NVLabs Swashbuckle`) returned references only within `Nexus.Gateway.csproj` and `deps.json`.
*   **Unused Controller Actions**: `NotificationsController.cs` has `PostCustom` at line 69-73:
    ```csharp
    [HttpPost("custom")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<IActionResult> PostCustom([FromServices] Nexus.Gateway.Services.NotificationService svc, [FromBody] CustomNotification req)
    ```
    And associated class `CustomNotification` (lines 76-80). FTS search for `notifications/custom` returned no frontend references.
*   **Process Spawning Duplication**: `ProcessStartInfo` is used to spawn `powershell` with `-EncodedCommand` or similar in 5 controllers:
    *   `AppsController.cs` (lines 56, 183, 275)
    *   `RolesController.cs` (lines 71, 180, 231)
    *   `SecurityController.cs` (line 78)
    *   `TasksController.cs` (lines 26, 128)
    *   `UpdatesController.cs` (lines 65, 182)
    All instances lack a timeout parameter on `await process.WaitForExitAsync()`.
*   **Database Schema Bootstrap**: `Program.cs` contains 30 raw SQL `ALTER TABLE` statements inside try-catch blocks on lines 116-147, e.g.:
    ```csharp
    try { db.Database.ExecuteSqlRaw("ALTER TABLE AppSettings ADD COLUMN AppSubtitle TEXT NOT NULL DEFAULT 'Horizon UI Shell';"); } catch {}
    ```
*   **Hardcoded Active Directory Domain**: `ActiveDirectoryService.cs` line 20 contains `new PrincipalContext(ContextType.Domain, "nvlabs.com")`.
*   **Build Failures**: `dotnet build` failed when the backend was running due to file lock on `Nexus.Gateway.exe`:
    ```
    C:\Program Files\dotnet\sdk\8.0.422\Microsoft.Common.CurrentVersion.targets(5321,5): error MSB3027: Could not copy "C:\Users\OrgAdmin\Documents\NVLabs\src\Nexus.Gateway\obj\Debug\net8.0\apphost.exe" to "bin\Debug\net8.0\Nexus.Gateway.exe". Exceeded retry count of 10. Failed. The file is locked by: "Nexus.Gateway (7196)"
    ```

## 2. Logic Chain
1.  Since `servers.json` is not referenced by any C# file in the codebase, it is a dead configuration file.
2.  Since NuGet packages for Roslyn (`Microsoft.CodeAnalysis`), Swagger (`Swashbuckle`), and OpenAPI are referenced in `.csproj` but not imported (`using`) or configured in `Program.cs`, they are obsolete dependencies that inflate the application footprint.
3.  Since `PostCustom` and `CustomNotification` are only defined in `NotificationsController.cs` and have no inbound calls from the client, they represent dead endpoint code.
4.  Since five controllers independently instantiate `new Process` for launching `powershell.exe` with near-identical arguments and wait indefinitely on execution, there is duplicate subprocess-spawning boilerplate and a potential risk of hanging threads.
5.  Since the database uses raw alter SQL statements on startup to append columns instead of running the Entity Framework Core migrations in `src/Nexus.Gateway/Migrations`, it is an initialization work-around.
6.  Since `dotnet build` failed solely because of process file locking (`Nexus.Gateway.exe` being used by PID 7196), the standard build command is verified as `dotnet build`, but requires the running application to be shut down.

## 3. Caveats
*   We did not perform runtime tests of Active Directory or WMI/CIM calls because they depend on remote machine availability and OS-specific domain memberships.
*   We assumed `PostCustom` is not called dynamically via string-constructed reflection routes, which is standard for REST APIs.

## 4. Conclusion
The .NET 8 Gateway backend is built via `dotnet build` and runs via `dotnet run`. It contains dead files (`servers.json`), dead code (`PostCustom` endpoint), 5 obsolete NuGet packages, duplicated high-overhead subprocess spawning for remote PowerShell tasks (with no timeouts), hardcoded AD domain configurations, and fragile database schema initialization in `Program.cs`.

## 5. Verification Method
*   **Build Verification**: Terminate the running backend process (`Stop-Process -Name Nexus.Gateway` or similar) and run `dotnet build` in `src/Nexus.Gateway`. It compiles cleanly with 0 errors.
*   **Symbol Check**: Inspect `src/Nexus.Gateway/Nexus.Gateway.csproj` to confirm package references, and `src/Nexus.Gateway/Program.cs` to verify database altering blocks.
