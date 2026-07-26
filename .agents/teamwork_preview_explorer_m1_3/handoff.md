# Handoff Report: Connection Status Indicator Visual Design and Playwright E2E Mocking

## 1. Observation

During our read-only investigation, we observed the following in the codebase:

### A. Connection Status Badge and SignalR Connection
In `src/Nexus.Frontend/src/components/layout/Topbar.tsx`:
* **Line 21**: Tracks connection status using a local React state variable:
  ```typescript
  const [isLive, setIsLive] = useState(false);
  ```
* **Lines 72–108**: Establishes a local SignalR connection:
  ```typescript
  const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hub/notifications", {
      accessTokenFactory: () => localStorage.getItem("nexus_token") || ""
    })
    .withAutomaticReconnect()
    .build();
  // ...
  connection.onreconnecting(() => setIsLive(false));
  connection.onreconnected(() => setIsLive(true));
  connection.onclose(() => setIsLive(false));

  connection.start()
    .then(() => setIsLive(true))
    .catch(err => {
      console.error("SignalR Topbar Error: ", err);
      setIsLive(false);
    });
  ```
* **Lines 153–163**: Styles the badge dynamically using conditional classes and theme tokens:
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

In `src/Nexus.Frontend/src/routes/index.tsx` (Dashboard):
* **Lines 50–69**: Establishes a second duplicate SignalR hub connection:
  ```typescript
  const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hub/notifications", {
      accessTokenFactory: () => localStorage.getItem("nexus_token") || ""
    })
    .withAutomaticReconnect()
    .build();
  // ...
  connection.start().catch(err => console.error("SignalR Connection Error: ", err));
  ```

### B. Styling Variables & Design System
In `src/Nexus.Frontend/src/styles.css`:
* **Line 437**: `.nx-blink` pulses elements using the `nx-pulse` keyframe:
  ```css
  .nx-blink {
    animation: nx-pulse 1.4s ease-in-out infinite;
  }
  ```
* **Lines 84–291**: CSS custom properties for `--teal`, `--teal-low`, and `--crit` are defined in every single theme file/block:
  * **Dark Theme (Default)**: `--teal: #0effd0;`, `--teal-low: rgba(14, 255, 208, 0.09);`, `--crit: #ff3d5a;`
  * **Light Theme**: `--teal: #0d9488;`, `--teal-low: rgba(13, 148, 136, 0.09);`, `--crit: #dc2626;`
  * **Slate Theme**: `--teal: #818cf8;`, `--teal-low: rgba(129, 140, 248, 0.09);`, `--crit: #ef4444;`
  * **Stealth Theme**: `--teal: #3b82f6;`, `--teal-low: rgba(59, 130, 246, 0.09);`, `--crit: #dc2626;`
  * **Cyberpunk Theme**: `--teal: #e040fb;`, `--teal-low: rgba(224, 64, 251, 0.10);`, `--crit: #ff1a4b;`
  * **Infrared Theme**: `--teal: #6366f1;`, `--teal-low: rgba(99, 102, 241, 0.10);`, `--crit: #f43f5e;`

### C. Toasters and Actions
In `src/Nexus.Frontend/src/routes/__root.tsx`:
* **Lines 239, 252, 269**: Mounts Sonner toast container:
  ```typescript
  <Toaster theme="dark" position="top-right" richColors />
  ```

---

## 2. Logic Chain

1. **State Duplication & Inefficiency**: Observations show that `Topbar.tsx` and `Dashboard (routes/index.tsx)` initialize their own separate SignalR hub connections to `/hub/notifications`. When a user visits the dashboard, two independent WebSocket/SSE connections are opened, which is a redundant waste of resources and increases server load.
2. **Theme Synchronization**: Observations confirm that `--teal`, `--teal-low`, and `--crit` CSS custom properties are consistently defined across all 6 themes. Thus, using classes like `text-[var(--teal)]` and `bg-[var(--crit)]/10` in any context guarantees correct theme adaptation.
3. **No Connection-Loss Alerts**: Inspecting the event handlers in `Topbar.tsx` shows that `connection.onreconnecting`, `connection.onreconnected`, and `connection.onclose` only toggle the `isLive` state to render the badge, but do not invoke `toast(...)` to alert the user visually about the disconnection.
4. **Mocking Offline State**: Since the frontend retrieves everything via `/api` and web sockets over `/hub`, Playwright tests can mock backend offline states at the network level by intercepting the negotiation endpoint (`**/hub/notifications/negotiate**`) and other endpoints using `page.route()`, or using `context.setOffline(true)`.

---

## 3. Caveats

* **Active WebSocket Reconnection Interception**: Intercepting negotiate is simple and effective for initial connections and fallback requests, but Playwright's `page.route()` does not provide native controls to arbitrarily drop a currently open WebSocket frame-by-frame. To test mid-session disconnection, `context.setOffline(true)` or restarting/aborting the websocket connection is the standard approach.

---

## 4. Conclusion

We recommend the following integration path and E2E testing structure:

### A. Recommended Visual & Architecture Integration Path

1. **Centralize Connection via Context**: 
   Replace duplicate SignalR client connections in `Topbar.tsx` and `index.tsx` with a central React context `SignalRContext` placed at the root level (`__root.tsx`).
   This context should export `isLive: boolean`, `connection: signalR.HubConnection | null`, and the shared `notifications: Notification[]` state.
2. **Add Toast Alerts on Reconnect/Disconnect events**:
   Update connection event handlers inside the central context (or topbar) to notify the user via Sonner toasts:
   ```typescript
   connection.onreconnecting(() => {
     setIsLive(false);
     toast.warning("Connection to server lost. Reconnecting...");
   });
   connection.onreconnected(() => {
     setIsLive(true);
     toast.success("Connection to server restored.");
   });
   connection.onclose(() => {
     setIsLive(false);
     toast.error("Connection to server closed.");
   });
   ```
3. **Apply Design Tokens**:
   Ensure the indicators continue using the existing design tokens:
   * **Live Indicator**: `text-[var(--teal)] bg-[var(--teal-low)] border-[var(--teal)]/30`
   * **Pulse Animation**: `.nx-blink` (which relies on `--teal` color for the dot)
   * **Offline Indicator**: `text-[var(--crit)] bg-[var(--crit)]/10 border-[var(--crit)]/30`

---

### B. Proposed E2E Test Structure (Playwright)

Create an E2E test file (e.g. `tests/connection-status.spec.ts`) containing:

```typescript
import { test, expect } from '@playwright/test';

test.describe('NEXUS Connection Status Indicator & Toasts', () => {
  
  test('Verify LIVE status badge renders under normal connection', async ({ page }) => {
    await page.goto('/');
    
    // Check badge displays LIVE with correct styles
    const liveBadge = page.locator('text=LIVE');
    await expect(liveBadge).toBeVisible();
    await expect(liveBadge).toHaveClass(/text-\[var\(--teal\)\]/);
    
    // Verify pulse dot has nx-blink animation class
    const blinkDot = liveBadge.locator('.nx-blink');
    await expect(blinkDot).toBeVisible();
  });

  test('Verify DEAD status badge and Sonner Toast alerts on backend offline', async ({ page }) => {
    // Intercept negotiate endpoint to simulate backend SignalR offline state
    await page.route('**/hub/notifications/negotiate**', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: 'Service Unavailable',
      });
    });

    // Go to dashboard
    await page.goto('/');

    // Check connection badge transitions to DEAD
    const deadBadge = page.locator('text=DEAD');
    await expect(deadBadge).toBeVisible();
    await expect(deadBadge).toHaveClass(/text-\[var\(--crit\)\]/);

    // Verify warning toast is shown
    const toast = page.locator('ol[data-sonner-toaster] li[data-sonner-toast]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Connection to server closed');
  });

  test('Verify client-side offline mode using context.setOffline', async ({ context, page }) => {
    await page.goto('/');
    
    // Confirm initially live
    await expect(page.locator('text=LIVE')).toBeVisible();

    // Turn browser offline
    await context.setOffline(true);

    // Confirm transitions to DEAD status
    await expect(page.locator('text=DEAD')).toBeVisible();
    
    // Confirm Sonner warning toast appears
    const toast = page.locator('ol[data-sonner-toaster] li[data-sonner-toast]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Connection to server lost');
  });
});
```

---

## 5. Verification Method

To verify the E2E tests, run the following:
1. Ensure the Playwright dependencies are installed by running `npm install` in the workspace root.
2. Run tests using command:
   ```bash
   npx playwright test tests/connection-status.spec.ts
   ```
3. Look at HTML report outputs if there are failures:
   ```bash
   npx playwright show-report
   ```
