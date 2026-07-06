# Scope: E2E Testing Track

## Architecture
- Playwright E2E tests under `tests/` directory.
- Test runner runs Playwright tests targeting the frontend development server.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Setup Test Infra | Design test structure and custom commands | None | PLANNED |
| 2 | Write Test Cases | Write 24 Playwright tests covering Tier 1-4 | M1 | PLANNED |
| 3 | Publish TEST_READY | Verify tests and publish TEST_READY.md | M2 | PLANNED |

## Interface Contracts
- Tests must use standard CSS selectors and attributes (e.g. `data-theme="cyberpunk-neon"`).
- Opaque-box testing (no imports of frontend code).
