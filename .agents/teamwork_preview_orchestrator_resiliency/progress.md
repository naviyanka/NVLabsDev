## Current Status
Last visited: 2026-07-12T13:40:20Z
- [x] Initial codebase exploration (M1) [done]
- [x] Establish E2E testing framework (M2) [done]
- [x] Implement resiliency features (M3) [done]
- [x] Verify resiliency and E2E tests (M4) [done]

## Iteration Status
Current iteration: 1 / 32

## Succession Status
Spawn count: 5 / 16

## Retrospective Notes
### What worked:
- Monkeypatching `window.fetch` inside `__root.tsx` acted as an extremely clean global interceptor for both REST API and SignalR endpoints.
- Introducing a background poller hitting an anonymous `/api/health` allowed the frontend to automatically recover connection status when the backend starts back up.
- Platform-specific process monitoring (Windows `taskkill` and `netstat`) inside Playwright allowed testing actual process death and recovery, ensuring the E2E verification is authentic and robust.
- Standardized catch/finally handlers across all route components prevented infinite loading spinner screens when APIs fail.

### Lessons learned:
- Decoupling API connection state via window events and listeners (`nexus-backend-status`) allows multiple components (like `Topbar` and custom hooks) to coordinate status without complex React state prop-drilling or context complexity.
- Testing process management inside test runners is highly reliable but requires careful pathing and process isolation.

