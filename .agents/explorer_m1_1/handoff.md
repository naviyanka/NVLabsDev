# Handoff Report

## 1. Observation
* **Unused Source Files:** Running GitNexus Cypher query `MATCH (f:File) WHERE f.filePath STARTS WITH 'src/Nexus.Frontend/src' AND NOT ()-[:CodeRelation {type: 'IMPORTS'}]->(f) RETURN f.filePath` returned 46 files that have 0 incoming imports. This included files like:
  * `src/Nexus.Frontend/src/lib/api/example.functions.ts`
  * `src/Nexus.Frontend/src/components/dashboard/WidgetRegistry.tsx`
  * 34 UI components under `src/components/ui/` (e.g. `toggle-group.tsx`, `textarea.tsx`, etc.)
* **Transitively Unused Files:**
  * Running Cypher query `MATCH (a:File)-[:CodeRelation {type: 'IMPORTS'}]->(b:File {name: 'config.server.ts'}) RETURN a.filePath` showed `config.server.ts` is only imported by `example.functions.ts` (which is dead).
  * Running Cypher query `MATCH (a:File) WHERE a.content CONTAINS 'use-mobile' OR a.content CONTAINS 'useMobile' RETURN a.filePath` showed `use-mobile.tsx` is only imported by `src/components/ui/sidebar.tsx` (which is dead).
  * Standard UI components like `button.tsx`, `label.tsx`, `input.tsx`, `separator.tsx`, `sheet.tsx`, `skeleton.tsx`, `toggle.tsx`, and `tooltip.tsx` were only imported by other unused UI component files (verified via Cypher queries).
* **Unused Code:**
  * Cypher query `MATCH (f:Function) WHERE f.filePath STARTS WITH 'src/Nexus.Frontend' AND NOT ()-[:CodeRelation {type: 'CALLS'}]->(f) RETURN f.name, f.filePath` returned PowerShell client functions (`createPsSession`, `destroyPsSession`, `runPowerShellClient`) in `src/Nexus.Frontend/src/api/client.ts` and mock API endpoints in `src/Nexus.Frontend/src/api/mock.ts`.
  * Checked `src/routes/powershell.tsx` and `src/themes/horizon/pages/HorizonPowerShell.tsx` and confirmed both use WebSocket endpoints directly: `const wsUrl = \`\${protocol}//\${wsHost}/api/terminal/ws?serverId=\${session.serverId}&access_token=\${token}\`;`.
* **Unused Dependencies:**
  * Checked `src/Nexus.Frontend/package.json` for dependencies and ran Cypher checks against source code contents.
  * Legcay package `"xterm": "^5.3.0"` was declared alongside modern `"@xterm/xterm": "^6.0.0"`. `powershell.tsx` and `HorizonPowerShell.tsx` only import from `"@xterm/xterm"`.
  * Packages like `class-variance-authority`, `zod`, `react-day-picker`, `date-fns`, `embla-carousel-react`, `input-otp`, `react-resizable-panels`, `vaul`, `cmdk`, `react-hook-form`, `@hookform/resolvers`, and Radix packages were only referenced in unused UI/API files.
* **Code Duplication:**
  * Checked route imports: `npx gitnexus cypher -r NVLabs "MATCH (a:File)-[:CodeRelation {type: 'IMPORTS'}]->(b:File) WHERE a.filePath STARTS WITH 'src/Nexus.Frontend/src/routes/' AND b.filePath STARTS WITH 'src/Nexus.Frontend/src/themes/horizon/pages/' RETURN a.name, b.name"` returned 7 page-to-horizon mappings.
  * Inspected both `src/routes/servers.tsx` and `src/themes/horizon/pages/HorizonServers.tsx` and observed duplicated React state hooks, `useEffect` fetch loops, alert notifications, and CRUD event handler logic.
* **Build Verification:**
  * Ran `npm run build` in `src/Nexus.Frontend` and it finished successfully: `✓ built in 4.50s` (client bundle) and `✓ built in 2.03s` (server environment).

## 2. Logic Chain
1. *Assertion:* If a source file has 0 incoming `IMPORTS` relationships from any active application entry points or layouts, it is unused.
   * *Evidence:* `example.functions.ts` has 0 incoming imports. Thus it is unused.
2. *Assertion:* If a file is only imported by unused files, it is transitively unused.
   * *Evidence:* `config.server.ts` is only imported by `example.functions.ts` (which is unused). Hence, `config.server.ts` is transitively unused.
3. *Assertion:* If a dependency is only imported by unused or transitively unused files, it is an obsolete dependency.
   * *Evidence:* `class-variance-authority` is only imported by unused UI components like `button.tsx` and `badge.tsx`. Hence, it is an obsolete dependency.
4. *Assertion:* If HTTP API client functions are never called by any component or page, they are dead code.
   * *Evidence:* `createPsSession` is in `client.ts` but has 0 incoming `CALLS` relations and does not appear in any other file. The UI uses WebSockets directly. Thus, these HTTP terminal functions are dead.
5. *Assertion:* Mirroring page files for the Horizon theme creates massive code duplication.
   * *Evidence:* `servers.tsx` and `HorizonServers.tsx` both define distinct `useState` and `useEffect` fetches for the same server resources, meaning state and networking logic is duplicated.

## 3. Caveats
* **Tests:** We did not check if the unused UI components are referenced in any automated test suites (e.g. Playwright tests under `/tests`), as our scope was restricted to investigating the frontend directory `src/Nexus.Frontend`.
* **Dynamic Imports:** Although TanStack Start imports routes dynamically via static mapping in `routeTree.gen.ts`, we verified that `settings_old.tsx` is not linked anywhere in the UI.

## 4. Conclusion
The NEXUS frontend contains substantial dead weight:
* **44 unused source files** (mostly Shadcn UI components).
* **4 dead logical helper/config files** (`settings_old.tsx`, `WidgetRegistry.tsx`, `example.functions.ts`, `config.server.ts`).
* **22 Radix UI packages** and **10 standard packages** are obsolete and can be pruned.
* **PowerShell HTTP helper APIs** in `client.ts` are dead and replaced by WebSockets.
* Duplicated UI logic between default and Horizon layouts represents a major refactoring opportunity.

## 5. Verification Method
1. **Re-run the build:**
   ```bash
   cd src/Nexus.Frontend
   npm run build
   ```
2. **Review imports via Cypher:**
   Execute raw Cypher queries via the local `gitnexus` CLI to confirm there are no other incoming relationships to the identified files:
   ```bash
   npx gitnexus cypher -r NVLabs "MATCH (a:File)-[:CodeRelation {type: 'IMPORTS'}]->(b:File {name: 'WidgetRegistry.tsx'}) RETURN a.filePath"
   ```
   This should return an empty result `[]`.
