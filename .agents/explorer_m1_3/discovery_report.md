# NEXUS System Integration & E2E Architecture Discovery Report

This report presents the findings from the investigation of the system integration, E2E testing framework, and general system architecture of the NEXUS application.

---

## 1. Frontend-Backend Interaction & Dependency Mapping

The NEXUS application consists of a React/TypeScript frontend (`src/Nexus.Frontend`) powered by TanStack Start (SSR) and a .NET 8 Web API backend gateway (`src/Nexus.Gateway`).

### Communication Protocols
- **REST APIs**: Used for all standard CRUD operations and commands. The frontend references a base API path of `/api` (configured in `src/Nexus.Frontend/src/api/client.ts`).
- **SignalR Websockets**: Used for real-time notifications. The frontend communicates with the backend hub at `/hub/notifications` (mapped in the backend's `Program.cs` via `app.MapHub<NotificationHub>("/hub/notifications")`).

### Port & Proxy Configuration

#### Development Mode (Concurrently Running)
- **Frontend Dev Server**: Vite runs on port **`443`** (HTTPS) using a wildcard PFX certificate (`C:\navishare\DCFiles\Certs\NVLabs-Wildcard.pfx`). It is configured with proxies in `vite.config.ts`:
  - `/api` requests proxy to `https://localhost:5011`
  - `/hub` requests proxy to `https://localhost:5011`
- **Backend Gateway**: Kestrel runs on ports **`5010`** (HTTP) and **`5011`** (HTTPS) (defined in `src/Nexus.Gateway/appsettings.json`).
- **Access Flow**: Developers and E2E tests access the UI via `https://localhost/` (defaulting to port 443). The Vite proxy forwards all API and WebSocket traffic to Kestrel on port `5011`.

#### Production Mode (Deployment Layout)
- **Backend Gateway**: Serves as the primary host, listening on a user-defined HTTPS Port (configured during installation, defaulting to port `443` or `5011` if overridden).
- **YARP Reverse Proxy**: Kestrel uses YARP (Yet Another Reverse Proxy) to route all catch-all traffic (`{**catch-all}`) to the local frontend Node.js service at `http://127.0.0.1:5011` (configured in `Program.cs`).
- **Frontend Service**: Runs as a separate Node.js server starting `dist/server/server.js` via the Windows Service Wrapper (`WinSW`).
- **Access Flow**: The user accesses the gateway (e.g. `https://localhost:5011/`). If the request matches API controllers or hubs, the gateway handles them directly. All other requests are proxied via YARP to the local Node.js frontend.

---

## 2. E2E Testing Framework Analysis

NEXUS uses **Playwright** for E2E testing, with tests situated under the `tests/` directory.

### Test Suites (Tiers)
Playwright is configured (in `playwright.config.ts`) to target `baseURL: 'https://localhost'` with `ignoreHTTPSErrors: true` and execute tests in parallel across three major browser engines: Chromium, Firefox, and WebKit.
There are a total of **72 tests** spread across four spec files:
1. **`tests/tier1.spec.ts` (Smoke & Theme Customization)**: Verifies that basic page navigation works and basic theme switches apply correctly (OLED, Pure Light, Slate, Cyberpunk, etc.).
2. **`tests/tier2.spec.ts` (Theme Boundary Tests)**: Focuses on edge cases such as invalid local storage values, rapid theme switching, and terminal theme settings.
3. **`tests/tier3.spec.ts` (Cross-Feature Combinations)**: Asserts co-existence of themes (e.g. Cyberpunk theme combined with the Matrix terminal theme, compact density, and disabled animations).
4. **`tests/tier4.spec.ts` (Real-world Application Scenarios)**: Tests complex user journeys including multitab synchronization, settings persistence, and first-time onboarding.

### Authentication Mechanism
The E2E tests do not perform a standard UI login flow. Instead, they authenticate by:
1. Generating a mock JWT token locally using `crypto` in the test file, signing it with the hardcoded secret `nexus-super-secret-key-1234567890-very-secure`.
2. Setting the token in browser `localStorage` under the key `nexus_token` before navigating to settings pages.
3. Sending REST PATCH requests directly using `page.request` (with the same JWT token in the `Authorization: Bearer` header) to pre-seed settings in the database.

### Test Execution Commands
- **Run all E2E tests**: `npx playwright test`
- **Run specific tier**: `npx playwright test tests/tier1.spec.ts`
- **Run in a specific browser**: `npx playwright test --project=chromium`
- **List all tests**: `npx playwright test --list`
- **Run in UI mode**: `npx playwright test --ui`

---

## 3. Startup & Configuration Procedures

### Development Environment Startup
To run the development environment, both the backend gateway and frontend dev server must be started concurrently:
1. **Start Backend**: Run `dotnet run --project src/Nexus.Gateway/Nexus.Gateway.csproj`. This starts Kestrel on port 5011 (HTTPS) and 5010 (HTTP).
2. **Start Frontend**: Run `npm run dev` in `src/Nexus.Frontend`. This starts the Vite dev server on port 443 (HTTPS), using the wildcard certificate.
3. **Execute E2E Tests**: Run `npx playwright test` while both services are running.

### Production Build & Service Startup
The packaging pipeline is structured around an Inno Setup installer:
1. **Build Staging**: Run `Packaging/Build-Setup.ps1`.
   - Backend is published as a self-contained win-x64 release to `Packaging/Staging/Backend`.
   - Frontend is compiled with `npm run build` and copied to `Packaging/Staging/Frontend`.
   - A standalone `node.exe` and `WinSW.exe` service wrapper are downloaded into the frontend staging folder.
2. **Compile Installer**: Inno Setup compiles `Packaging/NexusSetup.iss` into `Packaging/Output/Nexus_Setup.exe`.
3. **Installation & Configuration**:
   - The installer prompts the user for the **HTTPS Port** (default 443) and an SSL Certificate Thumbprint.
   - It runs `Configure-Setup.ps1`, which:
     - Binds the certificate to the selected port using `netsh http add sslcert`.
     - Updates `appsettings.json` dynamically to configure Kestrel's Https URL to `"https://*:$AppPort"`.
   - It registers two Windows Services using `sc.exe` and `WinSW.exe`:
     - **`Nexus Backend`**: Runs `Nexus.Gateway.exe`.
     - **`NexusFrontend`**: Runs `node.exe dist/server/server.js` using WinSW.

---

## 4. Assessment of System Architecture & Reliability Issues

During the investigation, several critical architectural bugs, security vulnerabilities, and reliability concerns were identified:

### Issue A: Shared-State Parallel Test Bleed (Critical Reliability Issue)
- **Observation**: `playwright.config.ts` has `fullyParallel: true` enabled. However, the E2E tests interact with a single, shared backend database (`src/Nexus.Gateway/nexus.db`).
- **Impact**: When multiple tests run concurrently (e.g. `1.1` and `1.5`), they send PATCH requests modifying the same global settings database record (`id = "global"`). This creates race conditions where a test writes a value, but another test overwrites it before the first test can assert it. This causes severe test flakiness and false-negative failures.
- **Remediation**: Either disable parallel execution (`workers: 1` or `fullyParallel: false` in config) or implement a database isolation mechanism (e.g. unique mock databases per worker/session, or resetting database state using a global hook).

### Issue B: Cyberpunk Theme Button Text Mismatch (E2E Failure)
- **Observation**: The E2E tests (`tier1.spec.ts` through `tier4.spec.ts`) look for a theme button with the text `"Cyberpunk Neon"` (e.g. `page.click('button:has-text("Cyberpunk Neon")')`). However, in both `src/routes/settings.tsx` and `HorizonSettings.tsx`, the cyberpunk theme button is labeled `"⚡ Ghost Wire"`.
- **Impact**: All 10+ E2E tests trying to interact with the Cyberpunk theme fail consistently with a 2000ms timeout waiting for the button locator.
- **Remediation**: Update either the E2E test files to target `"⚡ Ghost Wire"` or rename the UI button text to `"Cyberpunk Neon"`.

### Issue C: Cross-Feature Duplication & Security Exposure in Tests
- **Observation**: The JWT generator function (`generateToken`), URL encoder (`base64UrlEncode`), and login helper (`loginAndGoToSettings`) are duplicated verbatim in every single test spec file (`tier1.spec.ts` through `tier4.spec.ts`).
- **Impact**: Code duplication increases maintenance overhead. Furthermore, the JWT signing key `nexus-super-secret-key-1234567890-very-secure` is hardcoded across all test files and the backend `Program.cs`, which violates security best practices.
- **Remediation**: Extract the token generator and login helpers into a shared utility file (e.g., `tests/helpers/auth.ts`) and load the signing key from environment variables.

### Issue D: Broken Production Reverse Proxy Port Configuration (YARP Mismatch)
- **Observation**: 
  1. In `Program.cs`, YARP's reverse proxy target is hardcoded to `http://127.0.0.1:5011`.
  2. However, the frontend service configuration in `WinSW.xml` does not set a port environment variable, meaning the Node/Nitro process will start on its default port (`3000`).
  3. The `WebBindingPort` database column (default `5011`) and the settings UI field allow the user to modify the binding port, but neither the backend proxy target nor the Node.js frontend service actually reads or adapts to this setting.
- **Impact**: In production, the backend gateway will fail to proxy frontend traffic (returning 502 Bad Gateway), as YARP will send traffic to `127.0.0.1:5011` while the Node/Nitro server is listening on port `3000`.
- **Remediation**: 
  - Update `WinSW.xml` or `Configure-Setup.ps1` to pass the configured port as `PORT` to the Node process.
  - Dynamically load YARP's reverse proxy destination address from the database's `WebBindingPort` setting at startup instead of hardcoding `5011`.
