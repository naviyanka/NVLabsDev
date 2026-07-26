# Project: NEXUS Frontend Resiliency

## Architecture
- React Frontend (`src/Nexus.Frontend`) communicating with .NET Gateway Backend (`src/Nexus.Gateway`).
- Axios/Fetch-based API client for network requests.
- Toast notifications for backend error interceptors.
- Global Connection Status Indicator in the UI layout.
- Route-level and Component-level fallback states to prevent React crashes.

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|---|---|---|---|---|
| 1 | Exploration | Analyze codebase layout, routing, API client, existing toasts, existing tests. | None | DONE | bfcf3415-0fcc-44da-b967-450cfa55a68a, 81e7a700-0101-487d-9459-c3bf52ef19e2, 39e7d3f7-fcc2-49a5-ac95-db97095d5408 |
| 2 | E2E Testing Track | Design and establish the E2E test suite (Tiers 1-4) simulating backend outage, and publish `TEST_READY.md`. | M1 | DONE | ce1e7120-485a-43c0-a9b4-05ee50b23d48 |
| 3 | Implementation | Implement connection status indicator, global Axios/fetch interceptor for toast alerts, and route-level error resiliency. | M1 | DONE | ce1e7120-485a-43c0-a9b4-05ee50b23d48 |
| 4 | Verification | Run E2E tests, execute adversarial testing (Tier 5), and perform forensic audit verification. | M2, M3 | DONE | ed9f92d3-eb8a-40bd-ab63-34c67e4990ab |

## Interface Contracts
- Backend API endpoints used for checking connection status (e.g., `/health` or regular endpoints).
- API Client Interceptors: Intercept 5xx errors, network errors, timeouts, and set status to "offline".
- Toast Alerts: Display warning toast when backend action is triggered while connection is offline.
- Connection Status Indicator: Green when online, red when offline, checking periodically.
