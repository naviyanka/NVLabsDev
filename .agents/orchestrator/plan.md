# Plan: NEXUS Codebase Cleanup and Refactoring

## Objective
Identify and safely remove unused code, dead files, and obsolete dependencies across the React frontend and .NET 8 Gateway backend. Refactor messy logic to improve architecture, eliminate duplication, adhere to best practices, and verify that the application builds and runs successfully, passing all E2E tests.

## Milestones

### Milestone 1: Multi-Track Discovery and Analysis
- **Goal**: Research the codebase using `gitnexus` and `code-review-graph` MCP tools to find:
  - Unused frontend and backend files, dead code, and obsolete dependencies.
  - Messy logic, code duplication, and architectural improvements.
  - Existing E2E and unit test suites, test run commands, and startup procedures.
- **Agent**: `teamwork_preview_explorer` (Explorer)
- **Output**: `discovery_report.md` listing potential deletions, refactoring candidates, and startup/test commands.

### Milestone 2: Frontend Cleanup and Refactoring
- **Goal**: Safely delete identified unused frontend code/files and refactor complex React logic.
- **Verification**: `npm run build` in `src/Nexus.Frontend` must pass with zero errors. Run unit tests if present.
- **Agent**: `teamwork_preview_worker` (Worker) and `teamwork_preview_reviewer` (Reviewer)

### Milestone 3: Backend Cleanup and Refactoring
- **Goal**: Safely delete identified unused backend code/files and refactor messy .NET 8 logic.
- **Verification**: `dotnet build` in `src/Nexus.Gateway` must pass with zero errors. Run unit tests if present.
- **Agent**: `teamwork_preview_worker` (Worker) and `teamwork_preview_reviewer` (Reviewer)

### Milestone 4: End-to-End Integration Verification & Audit
- **Goal**: Start frontend and backend services, run full E2E Playwright tests to ensure all functionality is preserved, and execute forensic audit.
- **Verification**: Application starts, all E2E tests pass, and the forensic auditor reports CLEAN.
- **Agent**: `teamwork_preview_worker` (Worker), `teamwork_preview_challenger` (Challenger), and `teamwork_preview_auditor` (Auditor)

### Milestone 5: Walkthrough Documentation and Handoff
- **Goal**: Generate the final `walkthrough.md` report at the workspace root listing precisely what was removed, optimized, and why the refactoring is superior. Report completion to the Sentinel.
- **Agent**: `teamwork_preview_orchestrator` (Orchestrator)
- **Output**: `walkthrough.md` at workspace root.

## Execution Topology
```
           [Project Orchestrator]
                      │
           ┌──────────┴──────────┐
           ▼                     ▼
     [Frontend Clean & Refactor]  [Backend Clean & Refactor]
           │                     │
           └──────────┬──────────┘
                      ▼
               [Verification]
            (E2E Tests, Auditor)
                      ▼
               [Walkthrough]
```
