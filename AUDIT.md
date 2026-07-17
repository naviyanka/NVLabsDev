# NEXUS Phase 0 Audit

Date: 2026-07-17
Scope: current repository only; no redesign or production-code changes were made.

## Audit constraints

- Project instructions require code-review-graph/GitNexus queries before file scanning. No graph tools, MCP resources, graph artifact, or `.gitnexus` index were available in this session. The audit therefore used targeted repository inventory and static source inspection.
- Build verification was attempted without downloading dependencies. Gateway and Launcher builds could not start because `obj/project.assets.json` is absent. Frontend build could not start because `vite` is not installed. These are environment/dependency-state failures, not proof that source compiles or fails.
- Existing untracked `NEXUS_REDESIGN_BRIEF.md` was preserved.

## Executive summary

Current implementation does not match brief's stated platform architecture:

- Persistence is EF Core with SQL Server, not SQLite.
- No DPAPI credential vault exists. Remote operations run under Gateway Windows service identity.
- Quartz.NET is absent. Scheduling uses hosted loops plus in-memory `Task.Run` jobs.
- REST is primary transport. SignalR only broadcasts notifications; terminal uses separate raw WebSocket/PTTY transport.
- Six screens use entirely synthetic data, two fleet surfaces inject mock servers, one security chart invents values, and API client has 36 silent sentinel returns that erase failure information.
- Security posture has release-blocking flaws: unauthenticated notification read/write endpoints, broad authenticated remote-command injection surfaces, arbitrary UNC/file access through service identity, SSRF, bearer tokens in local storage and URLs, plaintext HTTP default, and security settings that are stored but not enforced.
- Backend and frontend contracts already disagree: settings UI sends `POST` while backend exposes `PATCH`; API-key and custom-notification endpoints do not exist.
- Test coverage is one Playwright resiliency test. No .NET unit/integration test project exists.

Recommendation: preserve selected query/mapping logic and UI primitives, but replace security boundary, API client, scheduler, credential handling, plugin execution, and duplicated page layer.

## 1. Existing architecture

### Repository layout

- `src/Nexus.Gateway`: ASP.NET Core 8 Windows-only API, 24 controllers, EF Core, JWT auth, SignalR, YARP, CIM/DCOM, WSMan, PowerShell, hosted workers.
- `src/Nexus.Frontend`: React 19 + TypeScript + TanStack Start/Router + Vite + Tailwind 4, 30 route components, React Query provider, SignalR client, xterm terminal.
- `src/Nexus.Launcher`: Windows GUI launcher that starts two Windows services and opens browser.
- `tests/resiliency.spec.ts`: only automated test file; Playwright outage/recovery scenario.
- `Packaging`: deployment assets; not part of runtime source audit.

### Backend composition

`src/Nexus.Gateway/Program.cs` is composition root:

- JWT bearer authentication and authenticated fallback policy: lines 25-63.
- EF contexts configured with same SQL Server connection: lines 66-68.
- CIM, PowerShell, server registry, plugin-job, notification services: lines 69-75.
- Three hosted workers: telemetry, log persistence, AD sync: lines 76-78.
- SignalR and HTTP client: lines 79-80.
- Dynamic YARP catch-all proxy to frontend: lines 84-137.
- Credentialed CORS: lines 140-149.
- Trust-all forwarded-header configuration: lines 152-159.
- Migrations/startup initialization: lines 163-186.
- Controllers, notification hub, hardcoded health endpoint, catch-all reverse proxy: lines 200-205.

Important production concern: fallback authorization applies globally, while catch-all YARP route has no anonymous metadata. Production login/static frontend access through Gateway is therefore likely challenged before login. Dev avoids this by serving Vite separately.

### Frontend composition

- File routing via generated TanStack route tree: `src/Nexus.Frontend/src/router.tsx`.
- Root installs theme shell, React Query provider, global fetch monkey patch, JWT injection, 401 redirect, and 5-second health polling: `src/Nexus.Frontend/src/routes/__root.tsx`.
- `HorizonLayout` is always mounted. Several legacy route components then switch to separate Horizon page components based on theme, creating duplicate implementations for dashboard, servers, login, PowerShell, plugins, plugin detail, and settings.
- React Query is provided but API access mostly uses direct `fetch` plus component-local effects/polling.
- Remote backend hosts and toggle live in browser local storage: `src/Nexus.Frontend/src/lib/backend.ts`.
- Both npm and Bun lockfiles exist, plus a separate root `package.json`; dependency state has multiple authorities.

### Backend/frontend communication

- REST: all management CRUD and operations under `/api`.
- SignalR: `/hub/notifications`; server broadcasts `ReceiveNotification` to all authenticated hub clients.
- Raw WebSocket: `/api/terminal/ws`; streams a local or remote PowerShell PTY.
- Polling: fleet/health/settings/jobs and most screens poll or refetch independently.
- No SignalR stream exists for fleet telemetry, server health, job progress, or logs.
- YARP proxies non-API frontend requests to Node/TanStack frontend in packaged mode.

### Authentication and credential flow

Actual flow:

1. `/api/auth/login` validates local-machine or domain credentials with `PrincipalContext`.
2. User must belong to local `Administrators` or domain `Domain Admins`.
3. Gateway issues HS256 JWT valid for eight hours.
4. Frontend stores JWT in `localStorage`, globally patches `fetch` to attach it, and passes it in WebSocket/SignalR negotiation.
5. Remote CIM, WSMan, UNC, and PowerShell calls do not use per-server credentials. They inherit Gateway process/service identity.

No credential entity, vault service, `ProtectedData`, `DataProtectionScope`, `PSCredential`, `NetworkCredential`, or `SecureString` implementation exists. Brief's DPAPI vault is absent, not merely incomplete.

### Background work

- `TelemetryBackgroundService`: every 3 seconds queries all servers, updates state/processes, stores one metric sample, deletes samples older than 5 minutes.
- `AdSyncBackgroundService`: queries configured AD domain, inserts/updates servers, and fire-and-forgets WinRM enablement.
- `LogPersistenceService`: drains in-memory logs every 3 seconds and prunes records older than 3 days.
- `PluginBackgroundJobManager`: singleton in-memory dictionary, `Task.Run`, cancellation token, DB status row, plaintext script content, disk log.
- Update installation also launches untracked `Task.Run` work.

Quartz.NET package/configuration/jobs do not exist. Plugin jobs are not recoverable after restart; persisted rows are history, not durable scheduling state.

### Data layer

Provider: `Microsoft.EntityFrameworkCore.SqlServer` (`Nexus.Gateway.csproj`; `Program.cs:66-68`). Default connection is LocalDB SQL Server.

Main context tables:

- `AppSettings`
- `BackgroundJobs`
- `Disks`
- `InstalledApps`
- `Notifications`
- `PerfSamples`
- `Plugins`
- `Processes`
- `SecurityEventLogs`
- `SecuritySnapshots`
- `ServerRoles`
- `Servers`
- `ServerUpdates`
- `Volumes`

Log context tables:

- `LogEntries`
- `LogSettings`

Schema concerns:

- Server-related rows use plain `ServerIp` strings; no foreign keys enforce registry ownership or cascade behavior.
- `BackgroundJobs` stores full executable script content in plaintext.
- Webhook URLs are plaintext settings and returned by settings GET.
- Main and log contexts share one connection but use different migration sets. Startup calls `EnsureCreated()` for log context and `Migrate()` for main context. `EnsureCreated` does not safely compose with migrations and may leave log tables absent when database already exists.
- Model contains many configuration flags with no enforcement path.

## 2. Mock data and failure-masking inventory

### Runtime synthetic data

`src/Nexus.Frontend/src/api/mock.ts` is a live runtime dependency, not test-only fixture:

- Lines 3-4: artificial delay.
- Lines 22-28: five fabricated servers.
- Lines 55-86: fabricated event sources/messages and generated event history.
- Lines 90-105: fabricated firewall rules; toggle action is delay-only no-op.
- Lines 110-129: hardcoded local users/groups.
- Lines 142-151: hardcoded certificates.
- Lines 155-163: hardcoded network adapters/counters.
- Lines 173-185: hardcoded registry values.
- Lines 189-200: hardcoded devices.
- Lines 204-215: hardcoded Hyper-V VMs; control action is delay-only no-op.
- Lines 219-225: hardcoded virtual switches.
- Lines 230-236: hardcoded Storage Replica partnerships.

Active consumers:

- `components/layout/Sidebar.tsx:10,39,165`: fabricated fleet totals shown in navigation.
- `routes/powershell.tsx:6,58`: real empty/error server response replaced by mock fleet.
- `routes/events.tsx:6,46`: entire event screen uses generated events.
- `routes/firewall.tsx:5,17`: entire firewall screen uses fake rules and no-op mutation.
- `routes/devices.tsx:6,19`: entire device screen uses fake devices.
- `routes/vms.tsx:7,18`: entire VM screen uses fake VMs and no-op controls.
- `routes/vswitches.tsx:5,17`: entire virtual-switch screen uses fake switches.
- `routes/storage-replica.tsx:6,15`: entire replica screen uses fake partnerships.
- `routes/security.tsx:67-73`: invents random hourly failed-login values from one aggregate count.
- `themes/horizon/pages/HorizonPowerShell.tsx:45,54,63`: uses `nexus01` when no real server exists, then attempts a session to that fabricated default.

Unused hardcoded mock functions remain dangerous because future imports can silently reactivate them. Type declarations in `mock.ts` are not themselves fake behavior, but contracts should move to a neutral module.

### Frontend API failure masking

`src/Nexus.Frontend/src/api/client.ts` logs failures and returns values indistinguishable from valid empty/not-found/false states. Exact sentinel locations:

- Empty arrays: lines 13, 76, 114, 138, 194, 204, 214, 246, 277, 367, 377, 402, 445, 455, 543, 568, 578, 605.
- `false`: lines 26, 59, 89, 103, 127, 163, 173, 183, 235, 257, 425, 434, 469, 616.
- `null`: lines 42, 45, 224.
- Empty registry object: line 644.

That is 36 failure-collapsing returns. Callers cannot distinguish “zero records,” “HTTP 401/500,” network failure, parse failure, and rejected action.

Additional masking:

- `routes/processes.tsx:44-55`: missing performance history is replaced by summed process metrics, so failure looks like real system telemetry.
- `themes/horizon/pages/HorizonSettings.tsx:108-162`: settings fetch failure is ignored; backend failures produce “Saved locally” messaging. Backend fields are not actually persisted locally.
- `routes/__root.tsx:269-289`: settings fetch failure is swallowed.
- `components/layout/Sidebar.tsx:42-45`: plugin fetch failure is swallowed while stale/empty navigation remains.
- `themes/horizon/HorizonLayout.tsx:110,125`: calls nonexistent custom-notification endpoint and swallows failure.

### Backend synthetic/stale fallbacks

- `Program.cs:203`: `/api/health` always returns `Healthy`; it does not check database, workers, frontend, or remote-management dependencies.
- `Services/CimService.cs:81-127`: realtime metric failure returns a zero-valued `PerfSample`, which telemetry persists as real data.
- `Services/CimService.cs:152`: unknown total memory becomes fabricated 8192 MB, altering process memory percentages.
- `Services/ActiveDirectoryService.cs:22-34`: database/config failure silently selects hardcoded `nvlabs.com`.
- `Services/ActiveDirectoryService.cs:45-58`: DNS failure stores computer name in field named `Ip`.
- `Controllers/WindowsStorageController.cs:28-45,56-73`: live CIM error/empty data returns cached DB data without freshness/error metadata.
- `Controllers/RolesController.cs:26-30`: unknown server is treated as Windows Server.
- `Services/CimService.cs` broadly converts remote failures into empty lists, `false`, or `null`; controllers frequently return those as successful HTTP responses.

### Test-only mock behavior

- `tests/resiliency.spec.ts:148-157` intercepts settings and returns a fake dark theme if backend fetch fails.
- Test's purpose is UI survival during backend outage, but it does not assert real error states for individual screens and therefore does not protect against silent empty-data behavior.

## 3. Security findings

Severity reflects release risk for a privileged Windows administration service.

### Critical

1. **Authenticated command injection across remote-operation endpoints.** Route/body values are interpolated into PowerShell or native command strings. Examples: `TasksController.cs:27,113-116`; `RolesController.cs:69,157-164,194-201`; `AppsController.cs:80,205-215,301`; `NetworksController.cs:108,154,182`; `RegistryController.cs:31-34,105`; `UpdatesController.cs:66,169`; `SharePointSetupController.cs:75-207`. Base64 encoding does not sanitize input. Validation is inconsistent and escaping only one quote type is not a PowerShell security boundary.

2. **Arbitrary privileged script execution is protected by bypassable string blocklists.** Plugins persist script content and execute it with `PowerShell.AddScript` (`PowerShellSessionManager.cs:156`). `PluginsController.cs:32-38,70-92` accepts inline content without upload filter; upload filter at lines 48-62 is token matching and easily obfuscated. Run endpoint at lines 106-120 executes under service identity.

3. **File API exposes Gateway service identity to arbitrary UNC targets.** `WindowsFilesController.cs:64-87` rejects only literal traversal substrings and does not require `serverIp` to be registered. All read/write/delete/copy operations then use Gateway identity. `Rename` combines attacker-controlled rooted `newName` without revalidation (`:220-230`); upload trusts client filename (`:172-181`). This enables cross-host share access and destructive operations wherever service account has rights.

### High

4. **No DPAPI vault or per-server credential isolation.** All CIM/DCOM, WSMan, UNC, and PowerShell calls inherit process identity. Compromise grants service-account reach; least privilege and credential rotation are impossible.

5. **Anonymous notification disclosure and injection.** `NotificationsController.cs:21-37` exposes notifications without auth. Lines 59-65 allow anonymous arbitrary messages that are stored and broadcast to all authenticated clients. Attackers can read operational data, spam UI, and create deceptive alerts.

6. **Bearer tokens stored in browser local storage and placed in URLs.** Login stores JWT at `routes/login.tsx:41` and `themes/horizon/pages/HorizonLogin.tsx:41`. Terminal URLs include `access_token` at `routes/powershell.tsx:172-173` and `HorizonPowerShell.tsx:163-164`; backend explicitly accepts query token at `Program.cs:47-52`. XSS, browser history, proxy logs, diagnostics, and URL capture can disclose an eight-hour administrator token.

7. **Plaintext network exposure by default.** `appsettings.json:10-14` allows all hosts and binds HTTP on `0.0.0.0:5010`. HTTPS redirect/HSTS only activate when environment is recognized as production (`Program.cs:189-193`). Admin credentials and bearer tokens can cross network unencrypted.

8. **SSRF via URL tester.** `UtilsController.cs:21-48` allows authenticated callers to issue HEAD/GET to any HTTP(S) URL, including loopback, link-local, and internal services; redirects are not constrained.

9. **Security configuration is cosmetic.** `SessionTimeout`, `MfaRequired`, `RequireHttpsForRemote`, `MaxConcurrentSessions`, `AuditLoggingEnabled`, `AppLoginMethod`, and `EnableRbac` are stored (`Models/AppSetting.cs:15-16,43-44,54,75-76`) but not enforced. UI can imply protections that do not exist.

10. **No login throttling/lockout layer.** `AuthController.cs:22-66` exposes credential validation without ASP.NET rate limiter, per-account throttling, or service-level abuse controls. JWT has fixed eight-hour lifetime (`:84-90`), no refresh/revocation, and configured session timeout is ignored.

11. **PowerShell sessions are not bound to authenticated owner.** Global session IDs in `PowerShellSessionManager` can be executed or destroyed by any authenticated caller with an ID; controller never records or checks user ownership (`PowerShellController.cs:42-103`).

12. **Sensitive job scripts and logs are broadly exposed.** Full scripts persist in `BackgroundJobs.ScriptContent`; any authenticated user can enumerate jobs/logs and stop/retry them. No per-user or per-role authorization appears in `JobsController.cs`.

### Medium

13. **Trust-all proxy headers.** `Program.cs:152-159` clears known proxies/networks. Any direct client can spoof forwarded IP/protocol. This becomes high risk once IP/protocol drives policy, redirects, or auditing.

14. **Internal details returned to clients.** Raw exception messages are returned by file, network, registry, role, user, certificate, update, SharePoint, jobs, PowerShell, security, and URL-test endpoints. Representative locations: `WindowsFilesController.cs:60,131-357`; `PowerShellController.cs:102`; `SecurityController.cs:172`.

15. **Unvalidated remote target selection.** Most controllers accept arbitrary route `ip/serverId` rather than resolving a registered server record. This expands command execution, CIM, WSMan, and UNC access beyond managed fleet.

16. **Webhook secrets stored/returned as ordinary settings.** `AppSetting` contains webhook URLs; settings GET returns whole entity (`AppSettingsController.cs:20-30`). No protection-at-rest or redaction exists.

17. **Insecure operational defaults and side effects.** Adding/discovering a server automatically attempts to enable WinRM (`ServerService.cs:69-71`; `AdSyncBackgroundService.cs:46`) without explicit approval, durable audit record, or rollback.

18. **Hardcoded test signing key.** `tests/resiliency.spec.ts:38` falls back to `nexus-super-secret-key-1234567890-very-secure` and forges administrator JWTs. Runtime rejects missing key, but any environment reusing test fallback becomes trivially forgeable.

19. **Untrusted remote backend can receive admin token.** Browser permits arbitrary backend URL in local storage and global fetch wrapper attaches JWT to any URL containing `/api/` or `/hub/` (`routes/__root.tsx:71-88`). Selecting a malicious host exfiltrates token by design.

20. **Launcher pins a dependency with a known high-severity vulnerability.** `Nexus.Launcher.csproj` references `System.Text.Json` 8.0.4. `dotnet restore` reports NU1903 / GHSA-8g4q-xg66-9fp4. V2 must remove the redundant package pin or upgrade to a patched supported version before Launcher is shipped.

## 4. Functional and architectural instability

- Frontend settings save uses `POST /api/settings` (`HorizonSettings.tsx:154-157`); backend only exposes `PATCH` (`AppSettingsController.cs:33`). Save fails and UI reports local fallback.
- UI calls `/api/settings/keys` and `/api/settings/keys/{id}` (`HorizonSettings.tsx:570,597`); no backend endpoints/models exist.
- UI calls `/api/notifications/custom` (`HorizonLayout.tsx:110,125`); backend has no matching endpoint.
- Notification GET and test endpoints intentionally bypass global auth while clients still send tokens.
- Global `fetch` monkey patch is application-wide mutable state, duplicated across HMR, and mixes auth, offline gating, and redirects outside API abstraction.
- Health status considers every response below 500 “online,” including 401/404 (`routes/__root.tsx:313-320`).
- API client ignores non-OK bodies and structured errors, so endpoint contracts are effectively boolean/empty-array based.
- Old and Horizon page trees duplicate logic and styling, causing divergent fixes.
- Settings model exposes many controls absent from update controller and absent from runtime behavior.
- Plugin metadata seeds routes for features whose screens are mock-only.
- `TelemetryBackgroundService` performs sequential fleet polling every 3 seconds. Runtime grows linearly with servers and can overlap intended cadence; no per-host concurrency/timeout policy or backpressure exists.
- Fire-and-forget tasks escape host lifecycle and error supervision (`ServerService`, AD sync, plugin manager, updates).
- Package references mix .NET 8 target with Microsoft.Extensions/System.DirectoryServices 10.0.9, increasing compatibility risk.

## 5. Reuse assessment

### Reuse after hardening

- **CIM query/mapping knowledge:** WMI classes, property mapping, disk/volume/process/service transformations in `CimService` are valuable. Reuse query intent, not current error semantics/session/auth implementation.
- **AD discovery/login concepts:** `PrincipalContext` validation and group checks provide a base. Add throttling, explicit domain policy, cancellation, logging, and modern auth/session controls.
- **EF entity vocabulary:** server, telemetry, notification, plugin, and job concepts help define future domain model. Rebuild schema constraints and migrations.
- **SignalR notification path:** authenticated hub plus `IHubContext` broadcast is small and coherent. Remove anonymous write/read holes and add audience scoping.
- **UI primitives and visual work:** `NxCard`, `MetricBar`, `StatusBadge`, `PageWrapper`, Horizon CSS tokens, xterm integration, and TanStack route shell are candidates.
- **Frontend catastrophic SSR error wrapper:** `server.ts`, `start.ts`, and error-rendering helpers are isolated and purposeful.
- **Memory log batching/pruning concept:** bounded dequeue and batched retention logic can survive behind one properly migrated store.

### Replace, not patch incrementally

- `api/mock.ts` runtime functions/data and every active import.
- `api/client.ts` sentinel-return design; replace with typed result/error contract and centralized transport.
- Global `window.fetch` monkey patch/offline global variables.
- Duplicate legacy/Horizon page implementations; select one component system and one data path.
- `PluginBackgroundJobManager`, plaintext script persistence, and command blocklists.
- Raw string-built PowerShell/`Invoke-Expression` execution paths.
- File API path/target authorization model.
- Current settings screen/API contract, especially nonexistent API keys and unenforced security toggles.
- Hardcoded health endpoint.
- Current initial migrations if target architecture returns to SQLite/DPAPI; schema needs credential, ownership, audit, concurrency, and FK design first.
- Current Playwright resiliency test as primary acceptance coverage; retain outage scenario only after it asserts explicit error states and uses supported auth fixtures.

### Throw away outright

- Mock fleet/events/firewall/users/certificates/networks/registry/devices/VM/switch/replica payloads.
- No-op mutation functions (`toggleFirewallRule`, `controlVM`).
- Fabricated security histogram and `nexus01` defaults.
- “Saved locally” claims for data not actually persisted.

## 6. Test and verification baseline

- No `.csproj` test project exists.
- No backend unit tests, endpoint integration tests, auth tests, migration tests, or command/path security tests exist.
- One Playwright spec exists and requires live local services; it kills/restarts process bound to port 5010.
- Playwright config has no `webServer`, so environment orchestration is embedded in test.
- Test forges JWT directly and uses mock settings response.
- Backend and Launcher build checks stopped before compilation because NuGet assets are absent.
- Frontend build check stopped because dependencies are absent (`vite` not found).
- No tests were run because dependencies are not installed and current Phase 0 did not authorize network restore/install.

## 7. Phase 0 exit criteria

Completed:

- Existing backend/frontend/communication/auth/credential/background/data architecture mapped.
- Runtime mock-data and failure-masking locations inventoried.
- Security issues identified with source locations.
- Reusable and replaceable areas classified.

Release blockers before any feature work:

1. Define actual persistence target (brief says SQLite; source uses SQL Server).
2. Design DPAPI-backed credential boundary and service-account privilege model.
3. Eliminate command-string interpolation and arbitrary target selection.
4. Remove anonymous notification endpoints and secure token transport.
5. Replace mock/sentinel API behavior with explicit errors.
6. Choose durable scheduler model; current code is not Quartz or restart-safe.
7. Establish backend unit/integration test projects and deterministic frontend test harness.

No Phase 1 design decisions or production implementation were performed.

## 8. Phase 1 architecture checkpoint

Reviewed against `NEXUS_V2_TASK.md` on 2026-07-17. All three locked decisions remain correct; no alternative architecture is proposed.

- **SQLite confirmed.** Use an EF Core control-plane database with foreign keys enabled, WAL mode, bounded busy timeout, audit columns, optimistic concurrency, and batched telemetry writes. Quartz tables remain durable but isolated from domain migrations. Avoid porting SQL Server schema unchanged.
- **DPAPI vault confirmed.** Protect every credential independently with DPAPI `CurrentUser` under a dedicated Windows service account whose profile is loaded. Never fall back to `LocalMachine` or bare service identity. Store only ciphertext, version, target binding, and non-secret metadata in SQLite.
- **Quartz.NET confirmed.** Use persistent `AdoJobStore` with SQLite, explicit job identities, misfire policy, concurrency controls, cancellation, retry classification, and restart recovery. Remove in-memory scheduling and fire-and-forget work.

Dependency restoration now succeeds for Gateway and Launcher. Frontend/root `npm ci` also succeeds, so npm/package-lock is canonical for current V2 work. New restore evidence produced security finding 20 above.

Baseline builds after restore:

- Gateway: succeeds with 0 warnings and 0 errors.
- Launcher: succeeds with 7 warnings; NU1903 confirms finding 20, while CA1416 shows the Windows-only launcher incorrectly targets `net8.0` instead of a Windows TFM.
- Frontend: succeeds. Output still emits a dedicated mock bundle and every legacy theme stylesheet, directly confirming mock-runtime and duplicate-theme findings.
