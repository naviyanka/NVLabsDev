## 2026-07-02T20:07:01Z
You are the Frontend Refactoring Worker. Your task is to perform cleanup and refactoring in the React frontend (`src/Nexus.Frontend`) according to the discovery findings.

IMPORTANT RULES & CONSTRAINTS:
1. You MUST use gitnexus and code-review-graph MCP tools before any refactoring or deletion to understand the blast radius (impact).
2. DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work.
3. The frontend must build successfully with zero errors: verify by running `npm run build` in `src/Nexus.Frontend`.
4. Your working directory is `C:\Users\OrgAdmin\Documents\NVLabs\.agents\teamwork_preview_worker_m2_1`.

Tasks to perform:
1. Safely remove unused frontend files:
   - `src/routes/settings_old.tsx`
   - `src/components/dashboard/WidgetRegistry.tsx`
   - `src/lib/api/example.functions.ts`
   - `src/lib/config.server.ts`
   - `src/hooks/use-mobile.tsx`
   - The 43 unused UI components under `src/components/ui/` (e.g. accordion, alert, calendar, carousel, command, drawer, form, input, label, sidebar.tsx, skeleton, etc.). Verify which UI components are used: only `ServerSelector.tsx`, `sonner.tsx`, `StatusBadge.tsx`, `NxCard.tsx`, `dropdown-menu.tsx`, `MetricBar.tsx`, `RemoteFilePicker.tsx`, `tabs.tsx`, and `dialog.tsx` are actively used.
2. Clean up package.json by removing obsolete dependencies (like `xterm` [as `@xterm/xterm` is used instead], `zod`, and any of the unused Radix/UI packages like `@radix-ui/react-accordion` etc.). Run `npm install` in `src/Nexus.Frontend` to update the package lockfile.
3. Prune dead code within active files:
   - In `src/api/client.ts`: remove unused methods `createPsSession`, `destroyPsSession`, and `runPowerShellClient` (PowerShell uses direct websockets).
   - In `src/api/mock.ts`: remove all mock functions that are never called (leaving only the type declarations and static mock constant objects imported by active routes).
4. Refactor Settings Name Mismatch: In settings pages (`src/routes/settings.tsx` and `src/themes/horizon/pages/HorizonSettings.tsx` and other settings files), change the display name of the Cyberpunk theme option from `"⚡ Ghost Wire"` to `"Cyberpunk Neon"` to align with what the Playwright E2E tests search for.
5. Verify your changes do not break the frontend build by running `npm run build` in `src/Nexus.Frontend`.

Verification & Handoff:
- Document all files deleted/edited and the build command results in your handoff report (`handoff.md` in your directory).
- Send a completion message using the send_message tool to your caller agent.
