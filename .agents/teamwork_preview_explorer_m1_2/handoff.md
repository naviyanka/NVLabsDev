# Handoff Report: Route Loaders and Error Boundaries Investigation

## 1. Observation
We investigated the TanStack Router route structure, data-fetching code, and error handling mechanisms inside `src/Nexus.Frontend/src/routes/` and `src/Nexus.Frontend/src/api/`.

### Route Data-Fetching Inventory
No routes under `src/Nexus.Frontend/src/routes/` implement TanStack Router `loader` properties or use `useLoaderData`. Instead, they fetch data asynchronously on component mount/update using React `useEffect` hooks and local states.

The following routes fetch data:
1. **`__root.tsx`**
   - Fetches: `/api/settings` in `useEffect` (lines 203-227).
   - Error handling: `.catch(() => {})` suppresses errors.
2. **`index.tsx` (Dashboard)**
   - Fetches: `getServersClient()` and `getNotificationsClient()` in `useEffect` (lines 35-46).
   - Also connects to SignalR hub `/hub/notifications` (lines 51-64).
   - Error handling: No `.catch` block on notifications fetch; `loadData()` has no `try-catch` wrapper.
3. **`apps.tsx` (Installed Apps)**
   - Fetches: `getAppsClient(server, refresh)` (lines 35-47) in `useEffect`.
   - Error handling: Wrapped in `try-catch` to set `errorMsg` and `isLoading = false`.
   - Also fetches: `getServersClient()` in `handleInstall` (lines 98-99) without `try-catch`.
4. **`certificates.tsx` (Certificates)**
   - Fetches: `getCertificatesClient(server, store)` in `useEffect` (lines 32-39).
   - Error handling: No `.catch` block. If request fails, `setLoading(false)` is never called.
5. **`events.tsx` (Event Viewer)**
   - Fetches: `getServersClient()` in `fetchServers` (lines 38-41) and `getEvents()` in `fetchEvents` (lines 43-54) inside `useEffect`.
   - Error handling: `fetchEvents` wraps fetch in `try-catch`. `fetchServers` has no error handling.
6. **`files.tsx` (File Browser)**
   - Fetches: `getFilesSourcesClient(server)` in `fetchSources` (lines 217-227) and `getFilesListClient(server)` in `fetchFiles` (lines 229-242).
   - Error handling: Wrapped in `try-catch` blocks; logs to console but leaves `sources` / `files` empty without warning the user.
7. **`networks.tsx` (Networks)**
   - Fetches: `getNetworksClient(server)` in `fetchNetworks` in `useEffect` (lines 23-35).
   - Error handling: Wrapped in `try-catch` to clear loading state.
8. **`performance.tsx` (Performance)**
   - Fetches: `getPerformanceHistoryClient(server)` and `getProcessesClient(server)` in a `setInterval` loop in `useEffect` (lines 20-34).
   - Error handling: No `try-catch` block on `Promise.all` fetch.
9. **`plugin.$id.tsx` (Plugin Execution)**
   - Fetches: `/api/plugins` (lines 93-98) and `/api/plugins/${id}/jobs` (lines 100-116) in `useEffect`.
   - Error handling: Has `.catch(() => toast.error(...))` on details but none on job polling.
   - If details fetch fails, the page renders:
     ```tsx
     if (!plugin) return <PageWrapper><div className="text-[12px] text-[var(--text-sub)]">Loading plugin...</div></PageWrapper>;
     ```
     This causes a permanent loading state screen.
10. **`plugins.tsx` (Plugin Manager)**
    - Fetches: `/api/plugins` and `/api/settings` in `useEffect` (lines 56-72).
    - Error handling: `.catch(() => toast.error("Failed to load plugins"))`.
11. **`powershell.tsx` (Console)**
    - Fetches: `getServersClient()` in `useEffect` (lines 55-61).
    - Error handling: No `.catch` block.
12. **`processes.tsx` (Processes)**
    - Fetches: `getLiveProcessesClient(server)` and `getPerformanceHistoryClient(server)` in `useEffect` (lines 38-51).
    - Error handling: Wrapped in `try-catch` to clear loading state.
13. **`registry.tsx` (Registry Editor)**
    - Fetches: `getRegistryContentClient(server)` in `useEffect` (lines 40-54).
    - Error handling: Wrapped in `try-catch` to clear loading state.
14. **`remote-desktop.tsx` (Remote Desktop)**
    - Fetches: `getServersClient()` in `useEffect` (lines 52-59).
    - Error handling: No `.catch` block.
15. **`roles.tsx` (Roles & Features)**
    - Fetches: `getServersClient()` and `getRolesClient(id)` in `useEffect` (lines 31-69).
    - Error handling: `fetchRoles` has `try-catch` block; `getServersClient` fetch has no `.catch` handler.
16. **`security.tsx` (Security Dashboard)**
    - Fetches: `/api/servers/${server}/security` in `useEffect` (lines 49-61).
    - Error handling: Wrapped in `try-catch` block.
17. **`servers.tsx` (Server Management)**
    - Fetches: `getServers()` in `useEffect` (lines 45-56).
    - Error handling: Wrapper has `try-catch` catching errors, but `getServers()` (which is `getServersClient`) catches its own error internally and returns `[]`, meaning `catch` in page component is never triggered.
18. **`services.tsx` (Services Manager)**
    - Fetches: `getServicesClient(server)` in `useEffect` (lines 28-36).
    - Error handling: No `.catch` block. If fetch fails, the loading spinner never stops.
19. **`settings.tsx` (Settings)**
    - Fetches: `/api/settings` and client info on mount (lines 71-96).
    - Error handling: Has `.catch(() => {})`.
20. **`storage.tsx` (Storage Manager)**
    - Fetches: `getDisksClient(server)` and `getVolumesClient(server)` in `useEffect` (lines 26-38).
    - Error handling: No `.catch` block.
21. **`tasks.tsx` (Task Scheduler)**
    - Fetches: `getTasksClient(server)` in `useEffect` (lines 22-34).
    - Error handling: Wrapped in `try-catch` to clear loading state.
22. **`updates.tsx` (Windows Update)**
    - Fetches: `getUpdatesClient(server)` in `useEffect` (lines 21-33).
    - Error handling: Wrapped in `try-catch` to clear loading state.
23. **`users.tsx` (Users & Groups)**
    - Fetches: `getUsersClient(server)` and `getGroupsClient(server)` in `useEffect` (lines 25-35).
    - Error handling: No `.catch` block. If `Promise.all` fails, the loading spinner hangs forever.

Mock Routes (fetch mock data from `@/api/mock` which does not throw):
- **`devices.tsx`**
- **`storage-replica.tsx`**
- **`vms.tsx`**
- **`vswitches.tsx`**

### API Client Global Handling
In `src/Nexus.Frontend/src/api/client.ts`, almost all fetching functions wrap the core `fetch` call in a local `try-catch` block:
```typescript
// Example: src/Nexus.Frontend/src/api/client.ts line 131-139
export async function getServersClient(): Promise<Server[]> {
  try {
    const res = await fetch(`${API_BASE}/servers`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch servers", e);
  }
  return []; 
}
```
*Effect:* Any network exception or HTTP failure (such as a 500 status code) is swallowed, logged to the console, and returns `[]`. Callers receive a resolved promise with `[]` and cannot distinguish failure from a successful empty response.

### Root Error Boundary Layout Crash
In `src/Nexus.Frontend/src/routes/__root.tsx`, lines 87-112 define a root `ErrorComponent` and register it on the root route context (line 153):
```typescript
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  ...
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-void)] px-4">
      {/* Renders full screen error interface */}
    </div>
  );
}
```
*Effect:* Because individual routes do not define their own `errorComponent` properties (verified by grep search for `errorComponent`), any rendering or component-mount error bubbles up to the root. When it triggers, the entire app layout (`Sidebar` and `Topbar`) is unmounted and replaced with the full-screen error view, trapping the user and forcing a page refresh or hard redirection.

---

## 2. Logic Chain
1. Individual pages load data via `useEffect` + local loading states (e.g. `loading`, `isLoading`).
2. Multiple route components (like `certificates.tsx`, `users.tsx`, `services.tsx`, `index.tsx`) lack `.catch` handlers or fail to reset loading indicators in their fetch pipelines.
3. Therefore, any unhandled promise rejection or fetch rejection inside `useEffect` leaves these pages in an infinite loading state (visual freeze/white-screen equivalent).
4. The API client functions (`client.ts`) catch fetch/JSON errors internally and return default empty structures (like `[]` or `{}`).
5. Consequently, components successfully resolve the data-fetching promise even during API down-time but receive empty state, rendering empty layouts ("No items found") with zero notification to the user about connection issues.
6. If an unexpected response triggers a runtime rendering crash (e.g. attempting to read properties of undefined elements in layouts), the exception bubbles up.
7. Since sub-routes specify no local error boundary (`errorComponent`), the root error boundary is triggered, unmounting the global navigation wrapper (Sidebar/Topbar) and white-screening the entire interface.

---

## 3. Caveats
- We did not write or execute unit or integration tests, as this is a read-only investigation.
- We assume the backend API might fail with standard network faults (timeout, DNS resolution failure) or 500 Internal Server Errors, which would cause `fetch` to reject or return `res.ok = false`.
- Alternative mock data functions in `@/api/mock` resolve statically and are not prone to network failure, though their structure mimics the client responses.

---

## 4. Conclusion
The NEXUS frontend is vulnerable to:
1. **Infinite loading freezes** during page transitions or mounts if API calls fail inside `useEffect` blocks.
2. **False Empty States**, where a backend outage displays a misleading success state with zero records, hiding connection problems.
3. **Total application layout collapse** (sidebar/navigation removal) due to route errors bubbling up to the full-screen root-level `ErrorComponent`.

### Recommended Strategy
To secure route components and make them resilient:
1. **Add Route-Level and Sub-Route error components:** Implement `errorComponent: LocalErrorFallback` on individual route configurations or use a layout-level `Outlet` wrapper to confine error crashes within the main content area, keeping `Sidebar` and `Topbar` interactive and allowing normal navigation.
2. **Differentiate empty states from network errors in API layer:** Modify `client.ts` functions to re-throw exceptions or return typed tuple-like structures `{ data: T[], error: string | null }` instead of silent empty arrays.
3. **Transition to React Query (`@tanstack/react-query`):** Utilize the pre-installed `@tanstack/react-query` library (already set up in `__root.tsx`) by replacing manual `useEffect` + `useState` logic with `useQuery()`. This natively manages `isLoading`, `isError`, `error`, and automatic background retries, guaranteeing proper state transition on failure.
4. **Implement robust UI Fallbacks:** Inside route components, ensure `finally` blocks always set loading states to `false`, and render structured alerts or retry widgets inline rather than crashing the page.

---

## 5. Verification Method
1. **Inspect Route Definitions:** Check `src/Nexus.Frontend/src/routes/` to verify that no file uses route-level `errorComponent` options (only `__root.tsx`).
2. **Inspect API Call Pipelines:** Check `src/Nexus.Frontend/src/api/client.ts` to confirm that all fetch functions swallow exceptions internally.
3. **Trigger Runtime Crash:** Mock a route response to throw an error during rendering (e.g. `throw new Error("Render failure")` inside `UsersPage`) and navigate to `/users`. Observe that the root `ErrorComponent` takes over the entire viewport and destroys the layout.
4. **Simulate API Network Failure:** Modify the backend port or simulate a network drop so that `/api/servers` returns a 500 status. Observe that the Dashboard page hangs indefinitely in a loading state or renders an empty topology without showing a network warning.
