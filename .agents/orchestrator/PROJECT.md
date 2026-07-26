# Project: NEXUS Codebase Cleanup and Refactoring

## Architecture
- Frontend: React + Vite web application located in `src/Nexus.Frontend`.
- Backend Gateway: .NET 8 Gateway service located in `src/Nexus.Gateway`.
- Shared Interfaces: HTTP API endpoints exposed by the backend Gateway and consumed by the React frontend.
- Testing: Playwright integration/E2E test suite located in `tests/`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Multi-Track Discovery | Explore codebase for unused files, dead code, obsolete dependencies, tests, and build setups | None | DONE |
| 2 | Frontend Clean & Refactor | Remove dead frontend code, refactor theme button name to "Cyberpunk Neon", clean up package.json, verify build | M1 | DONE |
| 3 | Backend Clean & Refactor | Remove dead backend files/code, refactor PowerShell execution, DB schema bootstrap, and configuration injection, verify build | M1 | DONE |
| 4 | Test & Integration Refactor | Fix Playwright concurrency database conflicts, extract JWT auth helpers, fix WinSW port configuration and YARP dynamics | M2, M3 | PLANNED |
| 5 | Verification, Audit & Handoff | Run E2E tests, execute forensic auditor, generate walkthrough.md, report completion to Sentinel | M4 | PLANNED |

## Code Layout
- Frontend Root: `src/Nexus.Frontend`
- Backend Root: `src/Nexus.Gateway`
- E2E Tests: `tests/`
