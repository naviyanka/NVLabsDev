# Discovery Phase Synthesis Report

Synthesized from findings by Frontend Explorer, Backend Explorer, and System Integration Explorer.

## 1. Unused and Dead Code/Files
### Frontend (`src/Nexus.Frontend`)
- **Dead files**: 
  - `src/routes/settings_old.tsx`
  - `src/components/dashboard/WidgetRegistry.tsx`
  - `src/lib/api/example.functions.ts`
  - `src/lib/config.server.ts`
  - `src/hooks/use-mobile.tsx`
- **Unused UI Components** (43 of 52 files in `src/components/ui/`):
  `accordion.tsx`, `alert-dialog.tsx`, `alert.tsx`, `aspect-ratio.tsx`, `avatar.tsx`, `badge.tsx`, `breadcrumb.tsx`, `button.tsx`, `calendar.tsx`, `card.tsx`, `carousel.tsx`, `chart.tsx`, `checkbox.tsx`, `collapsible.tsx`, `command.tsx`, `context-menu.tsx`, `drawer.tsx`, `form.tsx`, `hover-card.tsx`, `input-otp.tsx`, `input.tsx`, `label.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `pagination.tsx`, `popover.tsx`, `progress.tsx`, `radio-group.tsx`, `resizable.tsx`, `scroll-area.tsx`, `select.tsx`, `separator.tsx`, `sheet.tsx`, `sidebar.tsx` (unused, actual layout sidebar is in `src/components/layout/Sidebar.tsx`), `skeleton.tsx`, `slider.tsx`, `switch.tsx`, `table.tsx`, `textarea.tsx`, `toggle-group.tsx`, `toggle.tsx`, `tooltip.tsx`.
- **Dead functions in files**:
  - `src/api/client.ts`: `createPsSession`, `destroyPsSession`, `runPowerShellClient`.
  - `src/api/mock.ts`: All mock implementation functions (active codebase fetches live data; only imports types and static constants from `mock.ts`).
- **Obsolete dependencies in package.json**:
  - `xterm` (replaced by `@xterm/xterm`)
  - 10+ standard libraries and 22 Radix packages which are only used by dead UI components.

### Backend (`src/Nexus.Gateway`)
- **Dead files**:
  - `src/Nexus.Gateway/Data/servers.json` (contains `[]`, unused)
- **Dead code**:
  - `PostCustom` endpoint and `CustomNotification` class in `NotificationsController.cs`.
- **Obsolete dependencies in Nexus.Gateway.csproj**:
  - `Microsoft.CodeAnalysis.Common`
  - `Microsoft.CodeAnalysis.CSharp`
  - `Swashbuckle.AspNetCore`
  - `Microsoft.AspNetCore.OpenApi`
  - `System.DirectoryServices` (base package is unused, `AccountManagement` is used)

---

## 2. Messy Logic and Code Duplication
- **Horizon Theme Duplication**: Entire page layouts and states are mirrored under `src/themes/horizon/pages/` with conditional rendering checks `if (theme === 'horizon') return <HorizonPage />` at the root of every route page, duplicating logic, CRUD handlers, and useEffects.
- **PowerShell Subprocess Duplication**: 5 controllers (`AppsController`, `RolesController`, `SecurityController`, `TasksController`, `UpdatesController`) spawn external `powershell.exe` subprocesses using duplicate `ProcessStartInfo` boilerplate, missing timeouts and cancellation tokens, bypassing native `PowerShellSessionManager.cs`.
- **Brittle DB Schema Bootstrap**: `Program.cs` runs 30 raw SQL `ALTER TABLE AppSettings ADD COLUMN` commands wrapped in individual try-catch blocks on startup, swallowing exceptions. EF Core migrations are not run programmatically.
- **Hardcoded Domain**: `ActiveDirectoryService.cs` hardcodes domain `"nvlabs.com"`, ignoring database config.

---

## 3. Integration & Testing Failures
- **Database Concurrency Race**: Playwright is configured for fully parallel tests (`fullyParallel: true`), but all tests share a single SQLite database (`nexus.db`), causing state conflicts and test flakiness.
- **Cyberpunk Button Mismatch**: Tests look for button `"Cyberpunk Neon"`, but the UI renders `"⚡ Ghost Wire"`, causing all theme tests to fail with a timeout.
- **JWT Generator Duplication**: Token generator and login helpers are duplicated verbatim across all 4 test spec files.
- **Broken Production YARP Proxy**: YARP reverse proxies to `http://127.0.0.1:5011`, but Node.js runs on default port 3000 due to missing `PORT` env variables in `WinSW.xml`, causing a 502/routing error. Also, user-configured `WebBindingPort` from database settings is ignored by YARP.
