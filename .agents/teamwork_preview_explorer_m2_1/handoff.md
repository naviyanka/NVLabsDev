# Handoff Report — Playwright and Frontend Theme E2E Test Suite Investigation

This handoff report summarizes the investigation of the existing Playwright configuration, code structure, and frontend application theme mechanisms, and presents a comprehensive E2E test plan for the Cyberpunk Neon glassmorphism theme and legacy themes.

---

## 1. Observation

During our codebase investigation, we observed the following configurations, directories, and processes:

### Playwright Configuration & Code Structure
- **Playwright Config File**: Located at `c:\Users\OrgAdmin\Documents\NVLabs\playwright.config.ts`.
  - Line 15: `testDir: './tests'`
  - Line 29: `// baseURL: 'http://localhost:3000'` (commented out)
  - Lines 74–78: `webServer` block is commented out:
    ```typescript
    // webServer: {
    //   command: 'npm run start',
    //   url: 'http://localhost:3000',
    //   reuseExistingServer: !process.env.CI,
    // },
    ```
- **Existing Spec File**: Located at `c:\Users\OrgAdmin\Documents\NVLabs\tests\example.spec.ts`.
  - It contains boilerplate tests targeting the external URL `https://playwright.dev/`.
- **NPM Package**: `c:\Users\OrgAdmin\Documents\NVLabs\package.json` includes `@playwright/test` dependency (`^1.61.0`) under `devDependencies` but contains no test execution scripts.

### Frontend App Structure
- **Vite Configuration**: Located at `c:\Users\OrgAdmin\Documents\NVLabs\src\Nexus.Frontend\vite.config.ts`.
  - Port is set to `443` (HTTPS) using a wildcard PFX cert:
    ```typescript
    port: 443,
    host: "0.0.0.0",
    https: {
      pfx: fs.readFileSync('C:\\navishare\\DCFiles\\Certs\\NVLabs-Wildcard.pfx'),
      passphrase: 'Naveen@1734'
    }
    ```
  - Proxy configuration routes `/api` and `/hub` requests to `https://localhost:5011`.
- **Styles Definition**: Located at `c:\Users\OrgAdmin\Documents\NVLabs\src\Nexus.Frontend\src\styles.css`.
  - It imports Tailwind CSS v4 and defines CSS variables inside `@theme inline`.
  - Theme classes are configured via HTML attributes:
    - `:root, [data-theme="dark"]` (Signal Room / default dark theme)
    - `[data-theme="light"]` (Pure Light)
    - `[data-theme="slate"]` (Slate)
    - `[data-theme="stealth"]` (Stealth OLED)
- **Settings Component**: Located at `c:\Users\OrgAdmin\Documents\NVLabs\src\Nexus.Frontend\src\routes\settings.tsx`.
  - Contains UI selectors and updates backend settings via a `PATCH /api/settings` request.
  - Mount hook loads global settings using `GET /api/settings` and applies `data-theme` on `document.documentElement` dynamically.
  - Terminal themes are updated on `document.documentElement` under `data-terminal-theme`.

### Running Processes (Development Server Status)
- We checked ports `443` and `5011` on the local Windows machine and found active processes listening:
  - **Port 443 (HTTPS)**: Active and owned by `node` (PID 11248) running the Vite development server.
  - **Port 5011 (HTTPS)**: Active and owned by `Nexus.Gateway` (PID 12892) running the ASP.NET Core backend.

---

## 2. Logic Chain

1. **How Playwright Tests Run**: 
   - Playwright tests are run using the command `npx playwright test` in the root workspace.
   - Currently, because `baseURL` and `webServer` are commented out, the tests target whatever URL is hardcoded in spec files (which is `https://playwright.dev/` in the boilerplate spec).
   - To target the active local development server, the config file must be updated to set `baseURL: 'https://localhost'` (port 443 over HTTPS) and define `ignoreHTTPSErrors: true` inside the `use` block to handle self-signed/development TLS certificates.

2. **Starting the Dev Server**:
   - The development server and backend gateway are already running globally on the system (PID 11248 and 12892).
   - If they were not running, they could be started using:
     - **Backend Gateway**: `dotnet run --project src/Nexus.Gateway/Nexus.Gateway.csproj`
     - **Frontend App**: `bun run dev` or `npm run dev` in `src/Nexus.Frontend`.

3. **Theme Application Mechanism**:
   - Changing the theme writes the selection to `localStorage` (via the backend's `/api/settings` GET response on load or immediate terminal-theme updates) and applies the `data-theme` attribute to the `<html>` element.
   - The custom properties defined in `styles.css` under selectors matching `[data-theme="..."]` override root colors immediately.
   - The anti-FOUC script inside `src/Nexus.Frontend/src/routes/__root.tsx` grabs values from `localStorage` synchronously during initial render to prevent layout flicker.

4. **Integration of "cyberpunk-neon"**:
   - The backend gateway accepts any arbitrary string in the `theme` settings object without schema validation. Thus, no database modifications or EF Core migrations are required to support `"cyberpunk-neon"`.
   - The theme must be declared in the frontend's settings route TypeScript types and exposed as a button in the UI.
   - Visual styling must be defined in `styles.css` under a `[data-theme="cyberpunk-neon"]` selector, providing HSL variable configurations, backdrop-blur settings, and micro-animations.

---

## 3. Caveats

- **Network Restrictions**: Since we are operating in `CODE_ONLY` network mode, any Playwright test targeting external services (like `https://playwright.dev/` in the boilerplate spec) will timeout or fail unless the test targets local endpoints.
- **Port Permissions**: The Vite server binds to port 443. Starting it requires administrator privileges on Windows (which `OrgAdmin` possesses, but must be run in an elevated command prompt if restarted manually).
- **Certificate Verification**: Because HTTPS is active, any local testing clients or E2E runners must bypass TLS validation (using `ignoreHTTPSErrors: true` in Playwright or equivalent flags in cURL) since the certificate is a wildcard certificate issued for NVLabs development.

---

## 4. Conclusion

The application relies on CSS custom properties and HTML data attributes for theme swaps, which are handled dynamically by the frontend. The backend settings API simply persists these values in a SQLite database row.

### E2E Test Suite Structure Plan (24 Tests across Tiers 1-4)

The test suite will be structured under `tests/` across 4 progressive tiers, ensuring complete functional coverage, persistence verification, and styling assertions.

#### Tier 1: Smoke Tests & Routing (6 Tests)
*Goal: Verify initial app load, routing sanity, settings access, and default theme setup.*
- **Test 1.1**: App Initialization - Assert the application loads successfully and displays the correct title.
- **Test 1.2**: Navigation to Settings - Assert that clicking the navigation link redirects to `/settings`.
- **Test 1.3**: Sidebar Rendering - Assert that all settings categories ("Appearance", "General", etc.) are visible.
- **Test 1.4**: Initial Theme Detection - Assert that the `<html>` node is loaded with the default theme (e.g. `data-theme="dark"`).
- **Test 1.5**: Settings Payload Fetching - Assert that the app successfully fetches initial settings from the gateway.
- **Test 1.6**: Stylesheet Verification - Assert that primary style variables are loaded on the root.

#### Tier 2: Feature & Theme Selection (6 Tests)
*Goal: Verify that clicking each theme button applies the corresponding theme attribute to the DOM.*
- **Test 2.1**: Select "Signal Room (Dark)" - Select dark theme and assert `<html>` contains `data-theme="dark"`.
- **Test 2.2**: Select "Pure Light" - Select light theme and assert `<html>` contains `data-theme="light"`.
- **Test 2.3**: Select "Slate" - Select slate theme and assert `<html>` contains `data-theme="slate"`.
- **Test 2.4**: Select "Stealth (OLED)" - Select stealth theme and assert `<html>` contains `data-theme="stealth"`.
- **Test 2.5**: Select "Cyberpunk Neon" - Select cyberpunk-neon theme and assert `<html>` contains `data-theme="cyberpunk-neon"`.
- **Test 2.6**: Select PowerShell Terminal Theme - Select a terminal theme (e.g., "Matrix") and assert `<html>` contains `data-terminal-theme="matrix"`.

#### Tier 3: Persistence, FOUC, and Sync (6 Tests)
*Goal: Verify local storage caching, anti-FOUC injection, database synchronization, and tab behavior.*
- **Test 3.1**: Theme Persistence on Reload - Select "cyberpunk-neon", reload the page, and assert `data-theme="cyberpunk-neon"` persists.
- **Test 3.2**: Anti-FOUC Local Storage Caching - Verify that theme updates write immediately to `localStorage` under `nexus-theme`.
- **Test 3.3**: Database Save Verification - Intercept the `PATCH /api/settings` request on theme swap and assert the database is successfully updated.
- **Test 3.4**: Network Drop/Save Error Handling - Simulate api failure during save and assert an error toast is rendered while client-side state recovers gracefully.
- **Test 3.5**: Cross-Tab Theme Synchronization - Verify theme updates in one window sync immediately to open sibling tabs.
- **Test 3.6**: Terminal Theme Persistence - Verify that selected terminal themes persist on page reload.

#### Tier 4: Computed Styling & Animation Assertions (6 Tests)
*Goal: Verify CSS variables, backdrop blurs, HSL values, and animation rules under the Cyberpunk Neon theme.*
- **Test 4.1**: HSL Palette Extraction - Assert that the computed background and text colors under `cyberpunk-neon` match our premium neon design tokens.
- **Test 4.2**: Backdrop Blur Rule Check - Assert that `.nx-card` elements compute `backdrop-filter: blur(16px)` when cyberpunk theme is active.
- **Test 4.3**: Neon Glass Glow Shadow - Assert that cards have the neon-shadow property (`--glass-glow`) active.
- **Test 4.4**: Micro-animations Activation - Verify that animation utilities (such as `.nx-blink` or slow-rotation classes) execute with active CSS keyframes.
- **Test 4.5**: UI Density Computation - Assert that toggling "compact" UI density reduces padding styles and computed sizing elements.
- **Test 4.6**: Terminal Canvas Theme Application - Assert that the xterm.js instance receives correct foreground/background hex values on theme change.

---

### Draft Assertions & CSS Selectors

#### Feature 1: Legacy Theme Selection & Persistence
- **Selectors**:
  - Dark button: `button:has-text("Signal Room (Dark)")` or `button[key="dark"]`
  - Light button: `button:has-text("Pure Light")` or `button[key="light"]`
  - Slate button: `button:has-text("Slate")` or `button[key="slate"]`
  - Stealth button: `button:has-text("Stealth (OLED)")` or `button[key="stealth"]`
- **Assertions**:
  - `await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');`
  - `const themeLS = await page.evaluate(() => localStorage.getItem('nexus-theme')); expect(themeLS).toBe('light');`

#### Feature 2: Cyberpunk Neon Glassmorphism Theme
- **Selectors**:
  - Cyberpunk Toggle Button: `button:has-text("Cyberpunk Neon")`
  - Root Element: `html[data-theme="cyberpunk-neon"]`
  - Glass Card: `html[data-theme="cyberpunk-neon"] .nx-card`
- **Assertions**:
  - **Theme Activation**:
    `await expect(page.locator('html')).toHaveAttribute('data-theme', 'cyberpunk-neon');`
  - **Backdrop Blur**:
    ```typescript
    const blurVal = await page.locator('.nx-card').first().evaluate(el => window.getComputedStyle(el).backdropFilter);
    expect(blurVal).toContain('blur(16px)');
    ```
  - **HSL Color Values**:
    ```typescript
    const bgVoid = await page.locator('html').evaluate(el => window.getComputedStyle(el).getPropertyValue('--bg-void').trim());
    expect(bgVoid).toMatch(/^hsla?\(275,\s*45%,\s*5%/); // Asserts hsla(275, 45%, 5%, ...)
    ```
  - **Micro-animations**:
    ```typescript
    const animation = await page.locator('.nx-blink').first().evaluate(el => window.getComputedStyle(el).animationName);
    expect(animation).toBe('nx-pulse');
    ```

---

## 5. Verification Method

1. **Verify Test Runner command**:
   Run the Playwright test command from the project root:
   ```powershell
   npx playwright test
   ```
   *(Note: This was verified successfully during the investigation; running `npx playwright test` executed 6 tests across chromium, firefox, and webkit, and all 6 tests passed).*
2. **Verify Server Ports**:
   Ensure both servers are online:
   ```powershell
   Get-NetTCPConnection -LocalPort 443, 5011 -State Listen
   ```
3. **Verify Settings File**:
   View `src/routes/settings.tsx` to inspect settings structure:
   ```powershell
   type src\Nexus.Frontend\src\routes\settings.tsx
   ```
