# Handoff Report: NEXUS Frontend Resiliency Exploration (Milestone 1)

## 1. Observation

Direct observations and file paths from the read-only exploration of the codebase:

### React Frontend Directory & Routing
*   **Frontend Root**: `src/Nexus.Frontend`
*   **Source Code**: `src/Nexus.Frontend/src`
*   **Routing**: Uses TanStack Router. Configured in `src/Nexus.Frontend/src/router.tsx` and dynamically compiled in `src/Nexus.Frontend/src/routeTree.gen.ts`. Route paths are defined under `src/Nexus.Frontend/src/routes/`.
*   **Layout Components**:
    *   `src/Nexus.Frontend/src/routes/__root.tsx` - Contains `RootComponent` and `RootShell` wrapping all views.
    *   `src/Nexus.Frontend/src/components/layout/Topbar.tsx` - Navigation top-bar with existing connection status badge.
    *   `src/Nexus.Frontend/src/components/layout/Sidebar.tsx` - App sidebar.

### API Client & Fetch Interceptor
*   **Request Method**: The app uses native `fetch` directly for all API calls. Functions are defined in `src/Nexus.Frontend/src/api/client.ts`. Direct `fetch` requests are also scattered in component code (e.g. `Sidebar.tsx` line 40, `__root.tsx` line 203, `login.tsx` line 28).
*   **Global Interceptor**: Found in `src/Nexus.Frontend/src/routes/__root.tsx` (lines 26-68). It patches `window.fetch` to inject bearer tokens and handle `401 Unauthorized` responses:
    ```typescript
    if (typeof window !== "undefined" && !(window as any).__nexus_fetch_patched) {
      const originalFetch = window.fetch;
      window.fetch = async (input, init) => {
        // ... Token injection logic ...
        const response = await originalFetch(input, init);
        if (response.status === 401 && window.location.pathname !== "/login") {
          if (requestUrl.includes("/api/") || requestUrl.includes("/hub/")) {
            localStorage.removeItem("nexus_token");
            window.location.href = "/login";
          }
        }
        return response;
      };
      (window as any).__nexus_fetch_patched = true;
    }
    ```

### Toast Notifications
*   **Library**: `sonner` is utilized.
*   **Toaster Component**: Placed globally in `__root.tsx`'s root render layouts (e.g. lines 239, 252, 269).
*   **Usage**: Dispatched directly by importing `toast` from `"sonner"` in UI files (e.g., `Topbar.tsx` lines 92-95):
    ```typescript
    if (n.type === "Success") toast.success(n.message);
    else if (n.type === "Error" || n.type === "Critical") toast.error(n.message);
    ```

### Connection Status Indicator
*   **Indicator Component**: The `Topbar.tsx` component (lines 153-163) displays a connection status badge:
    ```typescript
    {isLive ? (
      <div className="mono flex items-center gap-1.5 rounded-full border border-[var(--teal)]/30 bg-[var(--teal-low)] px-2.5 py-1 text-[10px] tracking-[0.2em] text-[var(--teal)] transition-colors">
        <span className="nx-blink h-1.5 w-1.5 rounded-full bg-[var(--teal)]" />
        LIVE
      </div>
    ) : (
      <div className="mono flex items-center gap-1.5 rounded-full border border-[var(--crit)]/30 bg-[var(--crit)]/10 px-2.5 py-1 text-[10px] tracking-[0.2em] text-[var(--crit)] transition-colors">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--crit)]" />
        DEAD
      </div>
    )}
    ```
*   **Logic Coupling**: This state is strictly coupled to the SignalR Notification Hub (`/hub/notifications`) events (`onreconnecting`, `onreconnected`, `onclose`, and `start()`, lines 99-108). It does not reflect HTTP API/gateway availability.

### Playwright E2E Tests & Scripts
*   **Configuration**: `playwright.config.ts` exists in the workspace root, targeting the `./tests` directory.
*   **Test Cases**: The `./tests` directory does not exist on the filesystem, and no E2E tests currently exist. E2E tests are scheduled to be implemented in Milestone 2 (`PROJECT.md` line 14).
*   **Startup Script**: `start.ps1` in the workspace root starts:
    *   Backend: `dotnet run` under `src/Nexus.Gateway`
    *   Frontend: `npm run dev` under `src/Nexus.Frontend`
*   **Shutdown Script**: No script exists to stop the services.

### Backend Gateway Endpoints
*   **Backend Project**: `src/Nexus.Gateway` (ASP.NET Core Web API on .NET 8).
*   **Controllers**: Located under `src/Nexus.Gateway/Controllers/` (e.g. `AppSettingsController.cs`, `AuthController.cs`, `ServersController.cs`).
*   **Health Checks**: No ASP.NET Core Health Checks middleware or `/health` endpoint is configured.
*   **Authorization Policy**: `Program.cs` line 53 enforces JwtBearer authentication globally as a fallback policy. The only anonymous endpoint in the system is `/api/auth/login` (via `[AllowAnonymous]` in `AuthController.cs` line 23).

---

## 2. Logic Chain

1. **Global Interception**:
   * *Observation*: Raw `fetch` is used throughout the app for all requests rather than a unified client class instance.
   * *Observation*: `__root.tsx` implements a global patch overriding `window.fetch`.
   * *Inference*: The only clean way to intercept all network requests globally (to detect backend outages) without refactoring every individual fetch call is to enhance the existing `window.fetch` patch in `__root.tsx`.

2. **Outage Detection**:
   * *Observation*: When the backend is offline, `fetch` calls will fail to resolve and throw a `TypeError` (e.g., "Failed to fetch"). When the backend is partially online but returning proxy/gateway errors, it returns HTTP status codes like `502 Bad Gateway`, `503 Service Unavailable`, or `504 Gateway Timeout`.
   * *Inference*: Wrapping the inner `originalFetch` call in the monkeypatched `window.fetch` with a `try/catch` block and inspecting the HTTP response status code is sufficient to intercept connection loss.

3. **Status Indicator Decoupling**:
   * *Observation*: The `Topbar.tsx` `LIVE`/`DEAD` status badge is bound solely to the SignalR WebSocket connection state (`isLive`).
   * *Inference*: SignalR connectivity does not guarantee general HTTP API availability. Decoupling or augmenting the status indicator requires a global HTTP connectivity state context or custom events that can be listened to inside `Topbar.tsx` or any layout level.

4. **Health Checking**:
   * *Observation*: No `/health` endpoint exists. All endpoints besides `/api/auth/login` require authentication.
   * *Inference*: When the user is authenticated, periodic background polling can hit `GET /api/settings` to determine backend health. If unauthenticated, `POST /api/auth/login` or a custom `/health` endpoint must be used.

---

## 3. Caveats

*   **First-Paint Requests**: The `window.fetch` override is executed as a module-level side-effect inside `__root.tsx`. Any API request fired before `__root.tsx` is loaded will bypass the interceptor.
*   **SignalR vs. HTTP**: The current connection status badge reflects only SignalR. If SignalR reconnects successfully, it sets `isLive` to `true`, even if REST APIs are failing or timed out.
*   **No E2E Tests**: Playwright is configured, but the test suite is non-existent. Test scenarios will need to be written from scratch in Milestone 2.

---

## 4. Conclusion

The NEXUS application codebase is fully prepared for frontend resiliency implementation. The optimal strategy consists of:
1.  **Interceptor Patching**: Enhance the `window.fetch` patch in `__root.tsx` to trap `TypeError` network exceptions and `5xx` gateway responses.
2.  **State Management**: Introduce a React context (e.g. `ConnectionContext`) or event-driven hook to broadcast connectivity state (online/offline).
3.  **UI Feedback**:
    *   Augment the status badge in `Topbar.tsx` to reflect both HTTP and SignalR connectivity.
    *   Inject `sonner` alerts when user interactions fail due to network loss.
4.  **Test Suite Creation**: Create Playwright test cases under `./tests` in Milestone 2 using mock service workers or network disconnection simulation (`page.route()`).

---

## 5. Verification Method

### Files to Inspect
*   `src/Nexus.Frontend/src/routes/__root.tsx` - Look at the `window.fetch` patch on lines 26-68.
*   `src/Nexus.Frontend/src/components/layout/Topbar.tsx` - Look at lines 153-163 for the status indicator and lines 72-113 for SignalR.
*   `src/Nexus.Gateway/Program.cs` - Confirm lack of health check mappings and presence of authentication policies.

### Run Environment
1. Start both servers:
   ```powershell
   ./start.ps1
   ```
2. Open DevTools in the browser at `http://localhost:5173`.
3. Check the console and network tab to observe the raw fetch requests hitting `/api/settings` and `/api/plugins` upon dashboard load.
4. Verify the tests directory does not exist:
   ```powershell
   Test-Path ./tests
   ```
   (Should return `False`)
