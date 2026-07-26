# Handoff Report: NEXUS System Integration & E2E Architecture

This hard handoff report outlines the findings, observations, logical deductions, and verification methods for the NEXUS system integration, E2E tests, and architecture.

---

## 1. Observation

### Codebase and Service Mapping
- **Vite Proxy settings**: In `src/Nexus.Frontend/vite.config.ts`, lines 21-32:
  ```typescript
      proxy: {
        '/api': {
          target: 'https://localhost:5011',
          ws: true,
          secure: false
        },
        '/hub': {
          target: 'https://localhost:5011',
          ws: true,
          secure: false
        }
      }
  ```
- **Kestrel appsettings.json ports**: In `src/Nexus.Gateway/appsettings.json`, lines 9-22:
  ```json
    "Kestrel": {
      "Endpoints": {
        "Http": {
          "Url": "http://0.0.0.0:5010"
        },
        "Https": {
          "Url": "https://0.0.0.0:5011",
          ...
        }
      }
    }
  ```
- **YARP Reverse Proxy in backend**: In `src/Nexus.Gateway/Program.cs`, lines 89-94:
  ```csharp
              new Yarp.ReverseProxy.Configuration.ClusterConfig
              {
                  ClusterId = "frontend_cluster",
                  Destinations = new Dictionary<string, Yarp.ReverseProxy.Configuration.DestinationConfig>(StringComparer.OrdinalIgnoreCase)
                  {
                      { "frontend", new Yarp.ReverseProxy.Configuration.DestinationConfig { Address = "http://127.0.0.1:5011" } }
                  }
              }
  ```

### E2E Testing Mismatch & Concurrency
- **Playwright parallel configuration**: In `playwright.config.ts`, line 17:
  ```typescript
  fullyParallel: true,
  ```
- **Playwright base URL**: In `playwright.config.ts`, line 28:
  ```typescript
  baseURL: 'https://localhost',
  ```
- **Duplicated JWT Helper in Spec Files**: E.g. in `tests/tier1.spec.ts`, lines 12-41 contains the exact `generateToken` code utilizing the hardcoded secret:
  ```typescript
  const secret = 'nexus-super-secret-key-1234567890-very-secure';
  ```
  The same generator function and secret are duplicated in `tests/tier2.spec.ts`, `tests/tier3.spec.ts`, and `tests/tier4.spec.ts`.
- **Cyberpunk Theme Button Mismatch**: In `tests/tier1.spec.ts`, line 106:
  ```typescript
  const cyberpunkBtn = page.locator('button:has-text("Cyberpunk Neon")');
  ```
  In the UI (`src/Nexus.Frontend/src/routes/settings.tsx`, line 160):
  ```typescript
  { id: "cyberpunk", name: "⚡ Ghost Wire", preview: "hsl(255,20%,4%)", accent: "#00e5ff" },
  ```
- **Verbatim Error from Test Run**: Command `npx playwright test tests/tier1.spec.ts --project=chromium` outputted:
  ```
  Error: expect(locator).toBeVisible() failed
  Locator: locator('button:has-text("Cyberpunk Neon")')
  Expected: visible
  Timeout: 2000ms
  Error: element(s) not found
  ```

---

## 2. Logic Chain

1. **Integration Mapping**: From the proxy settings in `vite.config.ts` and Kestrel endpoints in `appsettings.json`, we establish that in development, the frontend (port 443) proxies all REST/SignalR API traffic to Kestrel on port 5011.
2. **Production Mismatch**: From `Program.cs`, YARP proxies catch-all traffic to `http://127.0.0.1:5011`. Since `WinSW.xml` doesn't pass port configuration to Node, Node launches on the default Nitro port (3000), causing YARP connections to port 5011 to fail.
3. **Database Concurrency Race**: From `playwright.config.ts` (`fullyParallel: true`), we see tests run concurrently. Since they share a single physical SQLite database (`nexus.db`) and patch settings concurrently on the same record (`global`), they overwrite each other's state, causing random test failures.
4. **Consistent Cyberpunk Failures**: From `tests/tier1.spec.ts` (expecting `"Cyberpunk Neon"`) and `settings.tsx` (rendering `"⚡ Ghost Wire"`), the locator fails to find the button, making all theme-switching tests fail.

---

## 3. Caveats
- We assumed no custom network policies or local hosts bindings prevent binding to port 443 or loopback addresses.
- We did not compile the full installer using Inno Setup on the host, but rather analyzed the script configuration.

---

## 4. Conclusion
The NEXUS application has functional E2E tests and integration mapping, but suffers from three main problems:
1. **Broken production routing** due to a hardcoded YARP target (5011) that mismatches the default Node port (3000) and lacks dynamic configuration.
2. **Parallel test instability** due to shared-state collisions on the backend SQLite database.
3. **Consistent test failures** due to the UI name mismatch (`"⚡ Ghost Wire"` vs. `"Cyberpunk Neon"`).

---

## 5. Verification Method

- **Command to list tests**:
  `npx playwright test --list`
- **Command to reproduce the Cyberpunk test failure**:
  `npx playwright test tests/tier1.spec.ts --project=chromium`
- **Verification files**:
  - `playwright.config.ts` (concurrency and base url)
  - `src/Nexus.Frontend/src/routes/settings.tsx` (theme button text)
  - `tests/tier1.spec.ts` (test locator target)
