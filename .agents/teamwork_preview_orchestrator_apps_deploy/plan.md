# Implementation & Verification Plan: Installed Apps Deployment

## Overview
This plan aims to implement cross-server silent software installation, remote session 0 bypass for interactive installer UI spawn, and ensure no regressions on WMI apps list retrieval.

## Workflow Phases
1. **Phase 1: Exploration & Codebase Analysis**
   - Spawn 3 Explorer agents in parallel to investigate:
     - Explorer 1: Frontend/backend interface for installed apps, current execution path for installations, and WMI retrieval.
     - Explorer 2: Remote file transfer mechanism (e.g., SMB/admin shares or built-in file copy) and remote execution of silent installers.
     - Explorer 3: Interactive process spawning on a remote machine bypassing Session 0 (WTSGetActiveConsoleSessionId, CreateProcessAsUser, etc. on the target machine, or WinRM / PsExec style runner).
   - Reconcile findings to establish exact code locations, architectural impacts, and interface contracts.

2. **Phase 2: E2E Test Suite Creation (Dual Track - E2E Testing)**
   - Spawn E2E Testing sub-orchestrator to design and write Playwright tests under `tests/` covering:
     - Tier 1: App installation triggers, silent vs interactive options.
     - Tier 2: Validation of edge cases (missing file, incorrect server, invalid arguments).
     - Tier 3: Cross-server installation combination (server selection flow).
     - Tier 4: Real-world scenario of remote silent install and remote interactive install.
   - Publish `TEST_READY.md`.

3. **Phase 3: Implementation (Dual Track - Implementation)**
   - Milestone 1: Remote file transfer and silent execution backend logic.
   - Milestone 2: Interactive bypass Session 0 UI execution.
   - Milestone 3: Frontend selection inputs and interactive mode toggle integration.

4. **Phase 4: Verification & Hardening**
   - Run full Playwright test suite against backend/frontend.
   - Adversarial Tier 5 coverage audit and verification.
