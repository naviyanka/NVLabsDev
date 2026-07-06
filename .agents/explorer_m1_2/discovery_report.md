# Discovery Report — Investigation of .NET 8 Gateway Backend

**Date**: 2026-07-02T20:06:40Z  
**Author**: Backend Explorer Agent  
**Target Directory**: `src/Nexus.Gateway`  

---

## Executive Summary
This report presents the findings from a read-only investigation of the .NET 8 Gateway backend (`src/Nexus.Gateway`) in the NEXUS application. The codebase serves as a management gateway connecting to remote Windows servers via CIM (DCOM/WinRM) and PowerShell. While functional, the codebase contains several areas of dead files, unused package dependencies, duplicate subprocess-spawning logic, hardcoded configurations, and database schema bootstrap anti-patterns.

---

## 1. Unused/Dead Files
The following files in the backend directory were identified as unused or dead:
*   **`src/Nexus.Gateway/Data/servers.json`**: This file contains only an empty JSON array `[]` and is not referenced, read, or written by any C# class or file in the gateway.
*   **SQLite Temporary/Journal Files** (e.g., `nexus_logs.db-wal`, `nexus_logs.db-shm`, `nexus.db-shm`, `nexus.db-wal`): These are generated dynamically at runtime by SQLite. While not code files, they are left in the repository and should be gitignored.

---

## 2. Dead/Unused Code (Endpoints, Classes, Methods)
We scanned the classes, interfaces, and methods in the codebase for unused symbols:
*   **Unused Controller Endpoint: `PostCustom`** in `src/Nexus.Gateway/Controllers/NotificationsController.cs` (lines 67-73).
    *   *Details*: This endpoint maps to `POST api/notifications/custom` and takes a `CustomNotification` body. The frontend client (`src/Nexus.Frontend`) does not reference or make requests to this endpoint (it only uses the `/test` endpoint for broadcasting test notifications).
    *   *Associated Unused Class*: `CustomNotification` class defined at the bottom of `NotificationsController.cs` (lines 76-80) is exclusively used by the `PostCustom` endpoint, making it dead code.
*   **WMI/CIM Mock Fallbacks**: The methods in `src/Nexus.Gateway/Services/CimService.cs` (such as `GetRealtimeMetricsAsync`, `GetProcessesAsync`, `GetServicesAsync`) catch exceptions and return randomized mock metrics when WMI queries fail (e.g., in non-Windows/development environments). While useful for offline UI testing, this behavior is a silent fallback that can obscure genuine connection failures or misconfigured credentials in production.

---

## 3. Obsolete/Unused Package Dependencies
The project file `src/Nexus.Gateway/Nexus.Gateway.csproj` includes several package dependencies that are completely unreferenced in the source code:
1.  **`Microsoft.CodeAnalysis.Common` (v4.8.0)**: Unused. No Roslyn compilation or script parsing is performed.
2.  **`Microsoft.CodeAnalysis.CSharp` (v4.8.0)**: Unused.
3.  **`Swashbuckle.AspNetCore` (v6.6.2)**: Unused. There is no Swagger generator (`AddSwaggerGen`) or Swagger UI middleware (`UseSwaggerUI`) registered in `Program.cs`.
4.  **`Microsoft.AspNetCore.OpenApi` (v8.0.28)**: Unused.
5.  **`System.DirectoryServices` (v10.0.9)**: Unused. The Active Directory service (`ActiveDirectoryService.cs`) uses `System.DirectoryServices.AccountManagement`, but the base `System.DirectoryServices` package is not imported or used.

---

## 4. Messy Logic and Code Duplication

### A. Spawning External `powershell.exe` Subprocesses
A major area of concern is that multiple controllers spawn external `powershell.exe` command processes using `ProcessStartInfo` to execute remote administration scripts:
*   `Controllers/AppsController.cs` (lines 56, 183, 275)
*   `Controllers/RolesController.cs` (lines 71, 180, 231)
*   `Controllers/SecurityController.cs` (line 78)
*   `Controllers/TasksController.cs` (lines 26, 128)
*   `Controllers/UpdatesController.cs` (lines 65, 182)

**Issues**:
1.  **Duplicate Boilerplate**: The code for base64 encoding the script blocks, setting up `ProcessStartInfo`, starting `powershell`, reading output streams, and calling `WaitForExitAsync()` is duplicated across all 5 controllers.
2.  **Bypassing Native Session Manager**: The project includes a dedicated `PowerShellSessionManager.cs` service that utilizes the native C# `System.Management.Automation` SDK (avoiding external process spawning and managing persistent runspaces). However, this service is only used by `PowerShellController.cs`, leaving other controllers to manually spawn high-overhead OS subprocesses.
3.  **Hanging/Leak Risks**: The asynchronous wait `await process.WaitForExitAsync()` does not specify a timeout or take a `CancellationToken`. If a remote WinRM connection hangs or a script blocks indefinitely, the backend task will hang forever, leaking processes and threads.

### B. Database Schema Bootstrap Anti-pattern
In `src/Nexus.Gateway/Program.cs` (lines 116-147), the app runs 30 raw SQL `ALTER TABLE AppSettings ADD COLUMN ...` statements inside `try-catch` blocks on startup:
```csharp
try { db.Database.ExecuteSqlRaw("ALTER TABLE AppSettings ADD COLUMN AppSubtitle TEXT NOT NULL DEFAULT 'Horizon UI Shell';"); } catch {}
try { db.Database.ExecuteSqlRaw("ALTER TABLE AppSettings ADD COLUMN PluginCategories TEXT NOT NULL DEFAULT 'Management,Security,Infrastructure,Advanced';"); } catch {}
...
```
*   *Issue*: This is a highly brittle database initialization practice. Entity Framework Core migrations exist under `src/Nexus.Gateway/Migrations` but are not executed programmatically on startup. Manually adding columns via raw SQL and swallowing exceptions is an anti-pattern that should be replaced by automatic migrations (`db.Database.Migrate()`).

### C. Hardcoded Configuration
*   **`ActiveDirectoryService.cs`**: The domain name `"nvlabs.com"` is hardcoded inside `GetDomainComputersAsync()` (lines 20, 56). While `Program.cs` initializes `DefaultDomainName` as a config option in the database `AppSettings`, this service does not read from it.

---

## 5. Build and Startup Instructions

### Build Command
The backend project is built using:
```powershell
dotnet build src/Nexus.Gateway
```
*   *Note*: Running `dotnet build` while the application is active will fail with error `MSB3021` / `MSB3027` because the executable `Nexus.Gateway.exe` is locked by the running process. The process must be stopped before recompiling.

### Startup Command
In local development, the backend is started using:
```powershell
dotnet run --project src/Nexus.Gateway
```
*   **Launch Profiles**:
    *   Configured in `src/Nexus.Gateway/Properties/launchSettings.json`.
    *   **HTTP**: Listens on `http://localhost:5010`.
    *   **HTTPS**: Listens on `https://localhost:7030`.
*   **Windows Service mode**:
    *   The backend is configured to support running as a Windows Service with service name `"Nexus Backend"` (`builder.Host.UseWindowsService(...)` in `Program.cs`).

---

## 6. Recommendations for Refactoring
1.  **Consolidate PowerShell Execution**: Extract PowerShell process execution into a shared `IPowerShellExecutionService` or refactor the controllers to utilize the native `PowerShellSessionManager`. Add proper timeouts and cancel tokens to `WaitForExitAsync()`.
2.  **Remove Obsolete Packages**: Clean up `Nexus.Gateway.csproj` by deleting references to `Microsoft.CodeAnalysis.*`, `Swashbuckle.*`, and `Microsoft.AspNetCore.OpenApi`.
3.  **Delete Dead Code/Files**: Remove the unused `Data/servers.json` file and delete the `PostCustom` / `CustomNotification` dead endpoints.
4.  **Use EF Core Migrations**: Clean up `Program.cs` by removing the manual `ALTER TABLE` statements and replacing them with a structured migration flow (`db.Database.Migrate()`).
5.  **Inject Configs**: Modify `ActiveDirectoryService` to take a configuration value or database setting for the Active Directory domain name instead of hardcoding `"nvlabs.com"`.
