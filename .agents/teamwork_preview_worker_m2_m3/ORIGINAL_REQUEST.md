## 2026-07-12T18:53:27Z
You are a worker subagent implementing frontend resiliency to backend outages.
Working directory: c:\Users\nv\Documents\NVLabsDev
Your task is to implement the following requirements:

1. **Backend Health Endpoint**:
   - In `src/Nexus.Gateway/Program.cs`, map an anonymous GET endpoint `/api/health` that returns 200 OK. E.g. `app.MapGet("/api/health", () => Results.Ok(new { status = "Healthy" })).AllowAnonymous();`. Place it before `app.Run()`.

2. **Global Connection Status State & Interceptor**:
   - In `src/Nexus.Frontend/src/routes/__root.tsx`:
     - Maintain a global state on `window` for `__nexus_backend_online` (defaults to true).
     - Implement global helpers `window.__nexus_set_backend_offline(method)` and `window.__nexus_set_backend_online()` which:
       - Update `window.__nexus_backend_online`.
       - Dispatch a custom event `"nexus-backend-status"` with `{ detail: { online: boolean } }`.
       - Show a Sonner toast notification on transition to offline: `"Connection to backend lost. Running in offline mode."`
       - Show a Sonner toast notification on transition to online: `"Backend connection restored."`
       - Show a Sonner toast notification when a non-GET (action) request is attempted while offline: `"Backend is dead/unreachable. Action failed."`
     - Enhance the `window.fetch` patch in `__root.tsx`:
       - Wrap the `originalFetch` call in a `try/catch`.
       - If it throws a network exception or returns a status >= 500, call `window.__nexus_set_backend_offline(init?.method)`.
       - If it succeeds (status < 500), call `window.__nexus_set_backend_online()`.
       - In case of a caught exception, re-throw the error so that callers' catch blocks resolve normally (preventing UI crashes).
     - Add a background poller in `RootComponent` using `setInterval` (every 5 seconds) that fetches `/api/health`. It must call `__nexus_set_backend_online()` on success, or `__nexus_set_backend_offline("GET")` on failure.

3. **Status Indicator & SignalR Integration**:
   - In `src/Nexus.Frontend/src/components/layout/Topbar.tsx`:
     - Initialize `isLive` state based on `window.__nexus_backend_online` (default `true`).
     - In `useEffect`, listen to `"nexus-backend-status"` custom event and call `setIsLive(e.detail.online)`.
     - Remove or update the SignalR event handlers (`onreconnecting`, `onreconnected`, `onclose`, `start().catch()`) so that instead of calling `setIsLive` directly, they call `window.__nexus_set_backend_offline()` or `window.__nexus_set_backend_online()` to feed into the global status.

4. **UI Resiliency & Infinite Loading Fixes**:
   - Examine `src/Nexus.Frontend/src/routes/users.tsx`, `services.tsx`, `certificates.tsx`, and `plugin.$id.tsx` to ensure data loading does not hang indefinitely if backend is offline.
     - Add proper error handling (e.g. `.catch()` or `finally` blocks) to reset loading state variables (e.g. `setLoading(false)` or `setIsLoading(false)`) if fetches reject.
     - In `plugin.$id.tsx`, if the details fetch fails, render a helpful error/empty message like `"Plugin data unavailable (backend offline)"` rather than sticking in a permanent `"Loading plugin..."` screen.

5. **Playwright E2E Verification Test**:
   - Write a new Playwright test file: `tests/resiliency.spec.ts`.
   - The test must verify:
     1. On startup, dashboard loads and status badge displays `LIVE` (green).
     2. Simulating backend outage by either killing the backend process on port 5010 (find PID and run taskkill, then verify port is dead) or using page.route() to mock 503/network failures.
        *Wait! The user specifically requested: "Create a programmatic UI test script (e.g., Playwright) that specifically kills the backend process, interacts with the frontend, and verifies that the toast notifications appear and the global status indicator turns red/offline."*
        So the test MUST:
        - Run a helper command to find the process ID using port 5010 and kill it.
        - Verify that the global status badge on the frontend turns to `DEAD` (red) and a toast notification is displayed.
        - Verify that navigation to other pages works smoothly without React crashes, and that other UI elements remain active.
        - Verify that attempting a backend action (e.g., stopping a service or triggering an action) displays a toast notification.
        - Restart the backend by spawning `dotnet run --project src/Nexus.Gateway`.
        - Verify that the status badge turns back to `LIVE` (green) and a restoration toast appears.
   - Run the E2E tests and ensure they pass.
