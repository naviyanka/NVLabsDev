# Original User Request

## 2026-07-12T13:17:05Z

You are the teamwork_preview_orchestrator.
Your working directory is: c:\Users\nv\Documents\NVLabsDev\.agents\teamwork_preview_orchestrator_resiliency
Please read the user requirements in the original request file: c:\Users\nv\Documents\NVLabsDev\.agents\ORIGINAL_REQUEST.md
Specifically:
1. Make frontend resilient to backend outages (React routes do not crash on outage, buttons/inputs remain active).
2. Global connection status indicator (online/dead).
3. Toast notifications on backend-dependent actions when backend is offline.
4. Programmatic E2E test to verify (e.g., Playwright).

You must maintain a `plan.md` and `progress.md` in your working directory.
Coordinate with specialized subagents (explorers, workers, reviewers) to investigate, implement, and verify these changes.
Do not write code directly, delegate tasks to worker subagents.
When done, report completion to the Sentinel.
