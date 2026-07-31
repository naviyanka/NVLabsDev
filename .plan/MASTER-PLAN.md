# NEXUS Platform — Master Feature Plan

## Vision
Transform NEXUS from a monitoring/management tool into a complete Windows Server fleet operations platform with automation, compliance, AI-assisted ops, and self-service capabilities.

---

## Phase Breakdown

| Phase | Focus Area | Features | Effort |
|-------|-----------|----------|--------|
| 0 | Foundation | Maintenance Windows, DB Cache Clear, Alert Quiet Hours wiring | Small |
| 1 | Automation | Scheduled Jobs / Runbooks | Medium |
| 2 | Access Control | RBAC (Role-Based Access Control) | Medium |
| 3 | Reporting | Patch Compliance Report, Server Comparison View | Medium |
| 4 | Dashboard | Customizable Dashboard Widgets | Medium |
| 5 | AI Ops | Natural Language → PowerShell, Anomaly Detection | Large |
| 6 | Plugins Tier 2 | DNS Manager, DHCP Monitor, IIS Manager | Medium |
| 7 | Remote Access | HTML5 RDP Gateway (Guacamole/FreeRDP) | Large |
| 8 | Compliance | Configuration Drift Detection, CIS Hardening | Large |
| 9 | Multi-Tenant | Multi-Domain/Forest Support, API Key Management | Large |
| 10 | Provisioning | PXE Boot, Golden Image, Zero-Touch Install | Large |

---

## Architecture Principles

1. **Backend-first**: Every feature starts with a working API endpoint before UI.
2. **Plugin-compatible**: New features register as plugins where possible (appear in sidebar, respect enable/disable).
3. **SignalR-aware**: Any long-running operation streams progress via SignalR.
4. **Audit-logged**: Mutating operations go through AuditLoggingMiddleware.
5. **Settings-driven**: Feature toggles stored in AppSettings, configurable from UI.
6. **Offline-capable frontend**: Frontend degrades gracefully when backend is unreachable.

---

## Tech Constraints

- Backend: .NET 8, Windows-only (CIM/WMI, WinRM), SQL Server or InMemory DB
- Frontend: React 19, TanStack Router, Vite 8, Tailwind CSS 4
- Real-time: SignalR (ASP.NET Core)
- AI: OpenAI-compatible API (Ollama, Groq, OpenAI, Gemini)
- Terminal: xterm.js + Porta.Pty (real PTY over WebSocket)

---

## Dependencies Between Phases

```
Phase 0 (Foundation) ─────┐
Phase 1 (Automation) ─────┤
Phase 2 (RBAC) ───────────┼── Phase 3+ can build on these
Phase 3 (Reporting) ──────┤
Phase 4 (Dashboard) ──────┘
Phase 5 (AI Ops) ← depends on Phase 1 (runbooks to auto-fix)
Phase 6 (Plugins) ← independent
Phase 7 (RDP) ← independent
Phase 8 (Compliance) ← depends on Phase 3 (reporting infrastructure)
Phase 9 (Multi-Tenant) ← depends on Phase 2 (RBAC)
Phase 10 (Provisioning) ← depends on Phase 1 (automation)
```

---

## Success Criteria Per Phase

Each phase is "done" when:
- Backend builds with 0 errors
- Frontend builds with 0 errors
- New endpoints return expected responses
- UI is functional and matches existing Horizon theme
- No regressions in existing features
