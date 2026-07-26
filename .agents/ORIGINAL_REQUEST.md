# Original User Request

## Initial Request — 2026-06-24T22:47:03Z

Create a standalone, non-destructive theme engine and premium UI redesign using Stitch MCP, adding a new Cyberpunk Neon Glassmorphism theme toggle option without altering or removing existing working themes.

Working directory: C:\Users\OrgAdmin\Documents\NVLabs
Integrity mode: benchmark

## Requirements

### R1. Standalone Stitch MCP Theme Engine
Implement a new theme engine utilizing Stitch MCP (`create_design_system`, `generate_variants`, `apply_design_system`) to introduce a premium "Cyberpunk Neon Glassmorphism" theme featuring vibrant HSL tailored colors, deep void backgrounds, and sleek glass panels.

### R2. Strict Non-Interference
Ensure all existing themes (`dark`, `light`, `system`, terminal themes) remain completely untouched, active, and fully functional. The new theme must exist as an independent, side-by-side selectable option in the settings UI.

### R3. Premium Frontend Redesign Support
Equip the application layout and core UI components with dynamic glassmorphism support (`backdrop-blur`, borders) and micro-animations that activate exclusively when the new Cyberpunk theme is toggled.

### R4. Controlled MCP Infrastructure
You must use Stitch MCP to generate and apply the new design system tokens, and Playwright MCP to verify layout rendering and theme toggling.

## Acceptance Criteria

### Standalone Theme Integration
- [ ] Legacy theme tokens and classes remain 100% intact in `index.css` and `settings.tsx` with zero deletions or breaking modifications.
- [ ] Stitch MCP successfully generates and registers the new `cyberpunk-neon` design system.
- [ ] Toggle control in Settings successfully switches between legacy themes and the new Cyberpunk Neon Glassmorphism theme without errors.
- [ ] Playwright visual snapshots confirm vibrant HSL colors, glassmorphic backdrop filters (`backdrop-blur`), and dynamic micro-animations upon theme activation.

## Follow-up — 2026-07-02T19:58:13Z

# Teamwork Project Prompt — Draft

Review, suggest modifications, remove unused code, and actively refactor the entire NEXUS application (both .NET Gateway backend and Node.js React frontend) to prepare for a final production build.

Working directory: C:\Users\OrgAdmin\Documents\NVLabs
Integrity mode: benchmark

## Requirements

### R1. Codebase Cleanup
Identify and safely remove unused code, dead files, and obsolete dependencies across the frontend and backend. 

### R2. Active Refactoring
Refactor messy logic for better production quality. Prioritize improving the architecture, eliminating code duplication, and adhering to best practices for React and .NET 8.

### R3. Safe Exploration
You must heavily use the `gitnexus` and `code-review-graph` MCP tools to understand the blast radius (`impact`) of any deletions or refactoring BEFORE modifying files. 

## Acceptance Criteria

### Objective Verification
- [ ] Automated build scripts (`npm run build` in `src/Nexus.Frontend` and `dotnet build` in `src/Nexus.Gateway`) must pass entirely without errors after the cleanup and refactor.
- [ ] No required functionality is accidentally broken (the frontend and backend must successfully start).
- [ ] A final `walkthrough.md` report is generated listing precisely what was removed, optimized areas, and why the refactored code is superior.

## Follow-up — 2026-07-10T16:55:13Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Fix and enhance the Installed Apps deployment feature, ensuring robust cross-server silent installations and providing an explicit mechanism that spawns the installer UI on the target server in an interactive session.

Working directory: C:\Users\OrgAdmin\Documents\NVLabs
Integrity mode: benchmark

## Requirements

### R1. Cross-Server Silent Installation
Ensure the application can flawlessly install `.msi` and `.exe` software on a selected remote server (e.g., from DC to SPAPP), supporting proper remote file transfer and silent execution parameters. 

### R2. Interactive UI Spawn
Implement an explicit mechanism to bypass Session 0 isolation on remote servers. This should allow an installer UI to be spawned interactively on the target server's active user session (so the user gets the installation popup on their target machine).

## Acceptance Criteria

### Installation Integrity
- [ ] Playwright E2E tests pass, confirming an app can be successfully installed across servers.
- [ ] Playwright E2E tests verify the option to select "Interactive Mode" triggers the interactive installer bypassing Session 0.
- [ ] No regression on retrieving the apps list via WMI.

## Follow-up — 2026-07-12T13:16:33Z

<USER_REQUEST>
Make the frontend fully resilient to backend outages. All pages and buttons must remain interactive even when the backend is offline. Backend-dependent actions should gracefully degrade with toast notifications, and a global indicator must display the backend's real-time connection status (online/dead).

Working directory: c:\Users\nv\Documents\NVLabsDev
Integrity mode: development

## Requirements

### R1. Global Backend Status Indicator
Implement a persistent visual indicator on the frontend that actively monitors and displays whether the backend API is online or offline.

### R2. Resilient UI Components
Ensure all frontend pages render without crashing when initial backend data fetches fail. UI elements (buttons, inputs) should remain accessible.

### R3. Graceful Degradation & Toast Notifications
Intercept failed API calls (e.g., due to backend downtime) globally or per-action. Instead of failing silently or crashing, the app must display a user-friendly toast notification indicating that the backend is unreachable.

### R4. Programmatic Verification
Create a programmatic UI test script (e.g., Playwright) that specifically kills the backend process, interacts with the frontend, and verifies that the toast notifications appear and the global status indicator turns red/offline.

## Acceptance Criteria

### Resiliency
- [ ] Shutting down the backend process does not cause a white screen or React crash on any frontend route.
- [ ] Navigating between pages while the backend is dead works smoothly.

### Notifications
- [ ] Attempting a backend-dependent action (e.g., stopping a service, enabling a network adapter) while the backend is offline triggers a toast notification (e.g., "Backend is dead/unreachable").

### Status Indicator
- [ ] The global indicator turns red/offline within a reasonable timeframe when the backend drops, and green/online when it recovers.

### Verification
- [ ] A programmatic UI test passes by correctly identifying that the frontend gracefully handles backend failure.
</USER_REQUEST>

