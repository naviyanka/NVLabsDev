# Phase 0 — Foundation

## Goal
Wire up dead settings, add DB/app cache clearing, and make maintenance windows functional. These are small, low-risk changes that complete existing half-built features.

## Features

### 0.1 Maintenance Windows (Alert Quiet Hours)

**Problem:** `AlertQuietHours` setting exists in AppSettings model but is never evaluated. Alerts fire 24/7 regardless.

**Implementation:**
- Backend: In `TelemetryBackgroundService.EvaluateAlertRules()`, before evaluating rules, check if current UTC time falls within quiet hours range
- Model: `AlertQuietHours` is a string like `"22:00-06:00"` (10 PM to 6 AM)
- Parse the range, compare against `DateTime.UtcNow.TimeOfDay`
- If inside quiet hours, skip all alert evaluation (or optionally: still log but don't broadcast/webhook)
- Frontend: Add an input field in Settings > Diagnostics for Alert Quiet Hours (time range picker)

**Files to modify:**
- `src/Nexus.Gateway/BackgroundServices/TelemetryBackgroundService.cs`
- `src/Nexus.Gateway/Controllers/AppSettingsController.cs` (add AlertQuietHours to PATCH handler)
- `src/Nexus.Frontend/src/components/settings/AlertRulesManager.tsx` (add quiet hours input)

### 0.2 Per-Server Maintenance Mode Toggle

**Problem:** No way to suppress alerts for a single server during planned maintenance.

**Implementation:**
- Backend: Add `MaintenanceMode` boolean field to `Server` model
- API: `POST /api/servers/{ip}/maintenance` toggles the flag
- TelemetryBackgroundService: Skip alert evaluation for servers where `MaintenanceMode == true`
- Frontend: Add a "Maintenance" toggle button on the server card/detail view
- Dashboard: Show a wrench badge on servers in maintenance mode

**Files to modify:**
- `src/Nexus.Gateway/Models/Server.cs`
- `src/Nexus.Gateway/Controllers/ServersController.cs`
- `src/Nexus.Gateway/BackgroundServices/TelemetryBackgroundService.cs`
- `src/Nexus.Frontend/src/themes/horizon/pages/HorizonServers.tsx`

### 0.3 Clear DB Cache & App Cache Endpoints

**Problem:** No way to clear accumulated telemetry/perf data without direct DB access.

**Implementation:**
- Backend: Add `POST /api/settings/clear-db-cache` (clears PerfSamples, Processes, Disks, Volumes, TelemetryHistory, Notifications, BackgroundJobs)
- Backend: Add `POST /api/settings/clear-app-cache` (clears LogEntries, SecurityEventLogs, SecuritySnapshots, InstalledApps, ServerRoles, ServerUpdates)
- Frontend: Add "Maintenance" section in Settings > Diagnostics with two danger-zone buttons

**Files to modify:**
- `src/Nexus.Gateway/Controllers/AppSettingsController.cs`
- `src/Nexus.Frontend/src/themes/horizon/pages/HorizonSettings.tsx` (add to diagnostics section)

---

## Validation Checklist

- [ ] AlertQuietHours suppresses alerts during configured window
- [ ] Per-server maintenance mode suppresses that server's alerts
- [ ] Dashboard shows maintenance badge
- [ ] Clear DB Cache removes telemetry/perf records
- [ ] Clear App Cache removes cached app/role/update data
- [ ] Both builds pass (frontend + backend)
- [ ] Existing alerts still work outside quiet hours
