## 2026-07-02T20:15:47Z
You are the E2E & Integration Refactoring Worker. Your task is to resolve the identified E2E test flakiness, auth helper duplication, and production Windows service reverse proxy port mismatch.

IMPORTANT RULES & CONSTRAINTS:
1. You MUST use gitnexus and code-review-graph MCP tools before any refactoring or deletion to understand the blast radius (impact).
2. DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work.
3. Your working directory is `C:\Users\OrgAdmin\Documents\NVLabs\.agents\teamwork_preview_worker_m4_1`.

Tasks to perform:
1. Playwright Database Lock Fix:
   - Edit `playwright.config.ts` to run tests sequentially: set `fullyParallel: false` and set `workers: 1`. This prevents multiple parallel workers from writing/reading the SQLite database `nexus.db` concurrently and causing flaky test failures.
2. Auth Helper Deduplication:
   - Create a shared helper file at `tests/helpers/auth.ts`.
   - Extract the duplicated `generateToken`, `base64UrlEncode`, and `loginAndGoToSettings` functions from the four test specs (`tests/tier1.spec.ts`, `tests/tier2.spec.ts`, `tests/tier3.spec.ts`, `tests/tier4.spec.ts`) into this helper file.
   - Refactor all four test specs to import these helper functions, eliminating code duplication across the tests.
3. WinSW Frontend Port Configuration:
   - Inspect the `Packaging/` directory for the Windows Service Wrapper configuration file (e.g. `WinSW.xml` or `Packaging/Staging/Frontend/WinSW.xml` or similar, or look in `Configure-Setup.ps1`).
   - Ensure the XML or service setup passes the `PORT` environment variable (e.g., dynamically configured or default `5011` as per YARP backend proxy configuration) to the Node.js process so that in production it starts on the correct port and does not default to `3000`.
4. Run & Verify E2E Tests:
   - Concurrently start the backend gateway (`dotnet run --project src/Nexus.Gateway`) and the frontend dev server (`npm run dev` in `src/Nexus.Frontend`).
   - Run the full Playwright E2E suite: `npx playwright test`.
   - Verify that all tests pass successfully.

Verification & Handoff:
- Document all files modified and the output of the test run in your handoff report (`handoff.md`).
- Send a completion message using the send_message tool to your caller agent.
