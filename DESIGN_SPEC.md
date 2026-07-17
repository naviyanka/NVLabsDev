# NEXUS V2 Design Specification

Status: Phase 1 design checkpoint
Date: 2026-07-17
Design system: **Dark Fiber Switchboard**
Implementation status: specification only; no V2 screens built yet

## 1. Product design thesis

NEXUS V2 should feel like a fiber exchange at 02:00: quiet, precise, dense, and unmistakably alive.

It is not a collection of dashboard cards. It is an operational surface where every pixel answers one of four questions:

1. What is healthy now?
2. What changed?
3. What needs action?
4. What evidence proves the action worked?

Visual character comes from instrument-panel discipline, luminous data traces, exact typography, and motion tied to real events. No ornamental cyberpunk, glass blur, gradient wallpaper, fake telemetry, or generic gray shadcn composition.

### Signature device: Signal Spine

A 2 px vertical Signal Spine begins below the command bar and runs through the workspace. It represents current connection freshness:

- Mint continuous line: live SignalR connection.
- Blue pulse traveling down line: new telemetry received.
- Amber segmented line: delayed data.
- Red break with fault marker: connection failed.
- Gray dotted line: intentionally disconnected or never connected.

Spine persists across fleet, server, job, and security views. It creates identity while communicating truth. With reduced motion, traveling pulses become a static 400 ms brightness change.

## 2. Locked architecture confirmation

Phase 1 keeps all locked decisions from NEXUS_V2_TASK.md.

- SQLite remains control-plane persistence. Use foreign keys, WAL, bounded busy timeout, audit columns, optimistic concurrency, and batched telemetry writes.
- DPAPI vault uses CurrentUser under dedicated Windows service identity. No LocalMachine or service-identity fallback.
- Quartz.NET uses durable SQLite AdoJobStore; jobs survive restart and expose explicit state.
- Browser auth uses secure, httpOnly, SameSite=Strict cookies. No token storage in JavaScript and no query-string tokens.
- One frontend page tree, one component library, one visual system. No legacy/Horizon branching and no runtime theme duplication.

## 3. Design principles

### Truth before comfort

- Never replace failed data with zeros, old samples, or examples.
- Cached data remains visible only with explicit Last verified age and stale treatment.
- Error, empty, loading, stale, disconnected, and unauthorized are distinct states.
- Every action reports accepted, running, succeeded, failed, or canceled. Button clicked is not success.

### Dense, not cramped

- Default table row: 36 px.
- Default panel padding: 16 px.
- Major workspace gap: 12 px.
- Persistent chrome stays small; primary data receives space.
- Long labels truncate only when full value is available through focus or tooltip.

### Motion is evidence

- Motion occurs when real state changes.
- No perpetual shimmer after loading.
- No ambient particle effects.
- No count-up animation that implies samples between real values.

### Context survives navigation

- Selected fleet, server, time range, and incident remain visible while drilling down.
- Returning from detail restores table scroll, sort, filters, and selected row.
- Destructive action sheets pin target identity and never inherit a hidden target change.

## 4. Visual identity

### Color system

Dark-only V2 shell. High-contrast mode is an accessibility adaptation, not a second theme or component tree.

| Token | Hex | Usage |
|---|---:|---|
| ink.0 | #06080D | App background |
| ink.1 | #0A0F17 | Navigation and command bar |
| ink.2 | #0F1722 | Primary data surfaces |
| ink.3 | #152131 | Raised rows, active controls |
| line.soft | #1B2939 | Internal dividers |
| line.base | #29394D | Panel and input borders |
| line.strong | #3B536D | Focus-adjacent structure |
| text.primary | #E8EEF6 | Main copy |
| text.secondary | #9EACBE | Supporting copy |
| text.muted | #66778B | Disabled and tertiary metadata |
| signal.live | #55E1C1 | Live state and primary action |
| signal.blue | #53A7FF | Selection, links, incoming data |
| signal.amber | #FFB454 | Warning and pending state |
| signal.red | #FF5D73 | Critical and destructive state |
| signal.green | #78E08F | Completed and verified state |
| signal.violet | #A892FF | Scheduled and automation state |

Rules:

- Text never uses text.muted below 14 px unless contrast remains WCAG AA.
- Status always combines color with icon or shape and text.
- Gradients are reserved for live traces only: maximum two adjacent signal colors, never surface backgrounds.
- Critical red never decorates neutral UI.

### Typography

Self-host WOFF2 assets. No runtime Google Fonts request.

| Role | Typeface | Size / line | Weight |
|---|---|---:|---:|
| Page title | Barlow Semi Condensed | 30 / 34 px | 600 |
| Section title | Barlow Semi Condensed | 20 / 24 px | 600 |
| Panel title | IBM Plex Sans | 14 / 20 px | 600 |
| Body | IBM Plex Sans | 13 / 19 px | 400 |
| Control | IBM Plex Sans | 12 / 16 px | 500 |
| Label / eyebrow | Barlow Semi Condensed | 11 / 14 px | 600, uppercase |
| Data / logs | IBM Plex Mono | 12 / 18 px | 400 |
| KPI number | IBM Plex Mono | 26 / 30 px | 500 |

All numbers use tabular figures. IPs, hostnames, timestamps, IDs, paths, commands, versions, and metric values use IBM Plex Mono.

### Spacing and shape

- Base unit: 4 px.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40.
- Control heights: 28 compact, 32 default, 40 touch.
- Panel radius: 8 px.
- Overlay radius: 10 px.
- Button/input radius: 6 px.
- Pills reserved for status or filters, never general containers.
- Borders: 1 px. Active server selection adds 2 px blue inset, not a glow.
- Shadow only for overlays: 0 16px 48px rgb(0 0 0 / 0.42).

### Background texture

Workspace uses a 32 px square grid at 2.5% white opacity. Grid stops inside tables and text-heavy panels. It aligns topology and charts without making content noisy.

## 5. Application shell

Desktop dimensions:

- Navigation rail: 60 px collapsed, 220 px expanded.
- Command bar: 52 px tall.
- Connection strip: 28 px tall when degraded; hidden when healthy.
- Workspace padding: 16 px.
- Right context drawer: 380 px; resizable to 520 px.

Navigation groups:

1. Command: Fleet, Servers, Incidents
2. Operate: Jobs, Terminal, Plugins
3. Govern: Credentials, Security, Audit
4. System: Settings

Command bar:

- Left: breadcrumb and selected environment.
- Center: fleet/server search, opened with slash or Ctrl+K.
- Right: live connection state, running-job count, notification count, current identity.

No decorative logo header consumes vertical space. NEXUS mark lives in rail and collapses to an NX monogram.

## 6. Fleet view

Fleet view is table-first. Topology supports comprehension; it never replaces sortable inventory.

    ┌────┬─────────────────────────────────────────────────────────────────────────────────────────┐
    │ NX │ FLEET / PROD-WEST             Search servers, IPs, alerts…          LIVE  3 JOBS  ADMIN │
    ├────┼──┬──────────────────────────────────────────────────────────────────────────────────────┤
    │ ◎  │▓ │ 42 SERVERS   37 HEALTHY   3 DEGRADED   2 CRITICAL   LAST EVENT 08s                  │
    │ ▦  │▓ ├───────────────────────────────────────────────┬──────────────────────────────────────┤
    │ ⚡ │▓ │ FLEET MATRIX                                  │ INCIDENT RAIL                        │
    │ >_ │▓ │ Name       State  CPU  MEM  Disk  Last seen   │ 09:41  SQL-02 disk latency critical │
    │ ◈  │▓ │ DC-01      ● LIVE  24   61   44    02s        │ 09:39  WEB-07 patch job failed       │
    │ ⚿  │▓ │ SQL-02     ◆ CRIT  91   83   96    01s        │ 09:31  DC-03 connection restored     │
    │ ⛨  │▓ │ WEB-07     ▲ WARN  55   47   52    07s        │                                      │
    │ ⚙  │▓ │ …                                             │ [Open incident focus]                │
    │    │▓ ├───────────────────────────────────────────────┴──────────────────────────────────────┤
    │    │▓ │ TOPOLOGY TRACE       PROD-WEST ── DC ── APP ── SQL         traffic + health overlay  │
    └────┴──┴──────────────────────────────────────────────────────────────────────────────────────┘
           ↑ Signal Spine

### Fleet header

- Shows total registered servers and counts by real current state.
- Last event is age of newest accepted live event, not browser clock.
- Clicking state count applies table filter.
- If live channel fails, counts freeze and show timestamp; they do not become zero.

### Fleet matrix

- Virtualized after 100 rows.
- Sticky header and pinned server identity column.
- Default sort: criticality, then last-seen age, then hostname.
- Columns: state, hostname, role, OS, CPU, memory, disk pressure, open incidents, running jobs, last verified.
- Metric cells show number plus 28 px microtrend. Missing microtrend displays NO SAMPLE, not flat zero line.
- Row selection opens context drawer without leaving fleet.
- Double-click or Enter opens full server detail.

### Topology trace

- Group servers by explicit site, tag, and role data only.
- Connections appear only when derived from real configured relationships.
- New incident emits one traveling pulse from server node to incident rail.
- Unknown relationships are omitted, never inferred visually.
- At 100+ nodes, aggregate by site/role with expandable clusters.

### Incident rail

- Maximum 20 live items in DOM; older items virtualized.
- New item enters with 160 ms vertical reveal and 600 ms left-edge afterglow.
- Acknowledgment shows actor and time.
- Selecting incident synchronizes server row, topology node, and time lens.

## 7. Server drill-down

    ┌────┬─────────────────────────────────────────────────────────────────────────────────────────┐
    │ NX │ FLEET / SQL-02                               LIVE  VERIFIED 2s AGO       ACTIONS ▾       │
    ├────┼──┬──────────────────────────────────────────────────────────────────────────────────────┤
    │    │▓ │ SQL-02  10.40.8.22  DATABASE  Windows Server 2022     ◆ CRITICAL     VAULT: SEALED  │
    │    │▓ ├───────────────┬───────────────┬───────────────┬──────────────────────────────────────┤
    │    │▓ │ CPU 91%       │ MEMORY 83%    │ DISK 96%      │ OPEN INCIDENTS 2                     │
    │    │▓ │ ╱╲╱ live      │ ╲╱╲ live      │ ▁▂▆█ live     │ disk latency · failed backup         │
    │    │▓ ├───────────────┴───────────────┴───────────────┴──────────────────────────────────────┤
    │    │▓ │ OVERVIEW  PERFORMANCE  PROCESSES  SERVICES  STORAGE  NETWORK  SECURITY  MORE ▾     │
    │    │▓ ├────────────────────────────────────────────────────────┬─────────────────────────────┤
    │    │▓ │ SYNCHRONIZED TIME-LENS                                │ ACTIVITY                    │
    │    │▓ │ CPU ─────────╮        ╭────                            │ 09:41 alert opened          │
    │    │▓ │ MEM ────╮  ╭─╯   ╭────╯                                │ 09:40 backup failed         │
    │    │▓ │ DISK ───╰──╯─────╯                                    │ 09:39 disk crossed 90%      │
    │    │▓ │        09:00      09:20      09:40                    │                             │
    └────┴──┴────────────────────────────────────────────────────────┴─────────────────────────────┘

### Identity band

Always shows:

- Hostname and immutable server ID.
- Resolved address.
- Role, OS, site/tags.
- Current health and last-verified age.
- Credential vault state: sealed, missing, invalid, expiring, or locked.
- Connection method actually used.

### Synchronized time lens

Hovering or keyboard-scrubbing one chart pins same timestamp across CPU, memory, disk, network, events, and jobs. A vertical hairline and shared tooltip expose exact observed samples. Interpolation is never labeled as observed data.

### Detail navigation

One server route tree:

- Overview
- Performance
- Processes
- Services
- Storage
- Files
- Network
- Security
- Events
- Registry
- Roles and features
- Updates
- Virtualization, only when capability detected
- Terminal

Unsupported capabilities do not appear disabled forever. A capability summary explains why a view is absent.

## 8. Jobs and automation

Jobs page communicates durable Quartz state, not UI-local progress.

### Job pipeline

- Horizontal stage rail: Queued → Acquiring credential → Connecting → Executing → Verifying → Completed.
- Each stage shows start, duration, actor, target, retry count, and evidence.
- Pending uses violet; running uses blue; verified uses green; failed uses red; canceled uses gray.
- Retry creates a new attempt linked to prior attempt. History is never overwritten.
- Misfire state is explicit and explains selected Quartz policy.

### Streaming logs

- Virtualized monospace viewport; 10,000 visible-line soft cap.
- New lines append without stealing scroll if user scrolled upward.
- Resume live button shows unread-line count.
- STDOUT, STDERR, audit, and system lines have distinct left markers; color is secondary.
- Search, severity filter, timestamp toggle, soft wrap, copy selected.
- Secret redaction occurs server-side. UI treats redaction token as non-revealable.
- Failed lines link to structured error drawer and related job stage.

## 9. Terminal

- Terminal is full-height workspace, not a card.
- Session tabs show server, credential identity label, connection method, and owner.
- Session target is immutable after connection.
- New session requires registered server and valid vault credential.
- Browser receives short-lived, cookie-authenticated WebSocket upgrade; no token appears in URL.
- Reconnect never silently creates a different session. User chooses reconnect or start new.
- Persistent security banner states target and privilege context.
- Command history is client-memory-only unless audited history is explicitly enabled and enforced.

## 10. Credentials

Credential UI never renders secret value after submission.

Credential list columns:

- Display name
- Bound servers/count
- Account identity
- DPAPI scope: CurrentUser
- Last validated
- Validation status
- Rotation due
- Last modified by

Actions:

- Add: secret entered once; paste allowed; reveal requires hold-to-view before submit.
- Validate: controlled authentication probe against selected registered server.
- Rotate: create encrypted version; retain old version until new validation succeeds, then retire it.
- Delete: blocked while server bindings exist.
- Export: not offered.

Vault state appears in server identity band and action confirmation.

## 11. Security and destructive action UX

### Action levels

| Level | Examples | Interaction |
|---|---|---|
| L0 Read | Refresh metrics, open logs | Immediate |
| L1 Reversible | Start service, resume job | Inline confirmation with target |
| L2 Disruptive | Kill process, restart service, install role | Action drawer with impact and credential |
| L3 Destructive | Shutdown server, delete file, remove server | Re-auth + type exact hostname + final confirm |

Action drawer always displays target hostname, immutable ID, address, operation scope, credential identity label, actor role, preconditions, expected verification, and audit-record notice.

Bulk action requires explicit selected-target list. No all-filtered-servers implicit behavior.

### Authentication screens

- Login is visually quiet: NEXUS mark, local/domain choice, identity fields, server certificate status.
- Failed login uses generic message plus retry delay; never reveals account existence.
- Lockout countdown uses server-provided time.
- Session-expiry sheet offers re-auth without losing read-only context.
- MFA field appears only when backend policy actually requires it.

## 12. Component language

### Instrument frame

Replacement for generic card:

- 1 px line.base border.
- 8 px radius.
- 3 px top-left status segment.
- Header height 36 px.
- Optional right-aligned freshness stamp.
- No shadow in canvas.

### Status mark

- Live: filled circle.
- Warning: triangle.
- Critical: diamond.
- Offline: hollow ring.
- Unknown: dashed ring.
- Scheduled: hexagon.

Label format: icon + uppercase state + age where useful.

### Metric cell

- Label at 11 px.
- Value in mono 26 px.
- Unit at 11 px.
- 28 px microtrend.
- Sample age below trend.
- Threshold band only when threshold is real configuration.

### Structured error panel

Contains human summary, error category, target, timestamp, correlation ID, safe retry, and Copy diagnostics with redacted technical detail. Raw exception messages never render directly.

### Command palette

Searches registered servers, routes, jobs, incidents, and permitted actions. Results group by entity type. Destructive actions cannot execute directly; palette opens action drawer.

## 13. State model

Every data-bound screen implements:

| State | Visual treatment | Required behavior |
|---|---|---|
| Loading | Stable skeleton matching final geometry | No fake labels or numbers |
| Empty | Neutral instrument frame | Explain valid emptiness; offer real next action |
| Error | Structured error panel | Preserve filters; retry safely |
| Populated | Normal live surface | Show freshness and source |
| Stale | Amber segmented spine, age stamp, muted charts | Keep last data only with explicit stale label |
| Unauthorized | Lock panel | Explain needed role; no retry loop |
| Disconnected | Broken red/gray spine | Freeze timestamped data; block mutations |

Mutation buttons remain disabled until target, permission, connection, and credential preconditions are known.

## 14. Real-time behavior

Required event families:

- Fleet/server health changes
- Metric samples
- Incident create/update/acknowledge
- Job state/progress
- Log append
- Notification delivery
- Session termination/security events

Event contract names and payloads are finalized with backend implementation; frontend does not invent fallback payloads.

### Timing

- Numeric crossfade: 180 ms, cubic-bezier(.2,.8,.2,1).
- New row/event reveal: 160 ms.
- Live trace draw: 240 ms.
- Signal Spine pulse: 800 ms.
- Critical onset: one 220 ms border flash, then static.
- Drawer open: 220 ms.
- Tooltip delay: 80 ms.

SignalR updates batch to maximum four UI commits per second for high-frequency metrics. Alerts and job terminal states bypass batching.

Reduced-motion mode removes translation, trace drawing, blinking, and traveling pulses. State changes use instant color/icon updates plus announcement.

## 15. Responsive behavior

- At least 1440 px: full three-region fleet layout.
- 1100-1439 px: incident rail becomes collapsible right drawer.
- 768-1099 px: nav rail overlays; fleet table keeps identity plus four priority columns; remaining columns move into row drawer.
- Below 768 px: single-column operational view. Tables become labeled records; actions use full-screen sheet with 44 px controls.

No separate mobile page implementation.

## 16. Accessibility

- WCAG 2.2 AA minimum.
- Keyboard reaches every control, table row, chart sample, drawer, and dialog.
- Focus ring: 2 px signal.blue, 2 px outer offset.
- Live regions announce critical alerts, connection loss, completed/failed jobs; metric churn is not announced.
- Charts include data-table alternative and textual min/max/current summary.
- Status never depends on color alone.
- Target size: 40 px desktop for icon-only actions; 44 px touch.
- Forced-colors mode replaces luminous traces with system colors and explicit borders.

## 17. Performance budgets

- Initial authenticated shell JS: target under 250 KB gzip, excluding xterm loaded only on terminal route.
- Largest contentful paint: under 2.0 s on managed-LAN reference machine.
- Interaction latency: under 100 ms for filter/sort on 5,000 virtualized servers.
- SignalR processing must not render entire fleet for one server update.
- Charts retain full data in query cache only within selected window; downsample for display.
- Log viewport stays responsive at 100,000 received lines through virtualization and bounded client retention.

## 18. Route and ownership model

One route component per screen:

    /login
    /fleet
    /incidents
    /servers/:serverId/:capability
    /jobs
    /jobs/:jobId
    /terminal
    /plugins
    /plugins/:pluginId
    /credentials
    /security
    /audit
    /settings

Shared server capability panels compose inside server detail, not copied into themed pages. Route loaders call one typed API layer. React Query owns request cache, retries, cancellation, and invalidation. SignalR events update query cache through one event adapter.

## 19. Design token implementation contract

Initial semantic tokens:

    :root {
      --nx-ink-0: #06080d;
      --nx-ink-1: #0a0f17;
      --nx-ink-2: #0f1722;
      --nx-ink-3: #152131;
      --nx-line-soft: #1b2939;
      --nx-line: #29394d;
      --nx-line-strong: #3b536d;
      --nx-text: #e8eef6;
      --nx-text-secondary: #9eacbe;
      --nx-text-muted: #66778b;
      --nx-live: #55e1c1;
      --nx-blue: #53a7ff;
      --nx-warning: #ffb454;
      --nx-critical: #ff5d73;
      --nx-success: #78e08f;
      --nx-scheduled: #a892ff;
      --nx-space-1: 4px;
      --nx-space-2: 8px;
      --nx-space-3: 12px;
      --nx-space-4: 16px;
      --nx-radius-control: 6px;
      --nx-radius-panel: 8px;
    }

Components consume semantic tokens only. Feature code does not use raw hex colors or arbitrary Tailwind color classes.

## 20. Visual acceptance criteria

Before first screen is accepted:

1. Screenshot at 1600×1000 shows fleet identity, current health, critical incidents, and server inventory without scrolling.
2. No panel resembles default shadcn card styling.
3. Signal Spine truthfully reflects live, delayed, stale, failed, and disconnected states.
4. Loading, empty, error, populated, stale, unauthorized, and disconnected stories exist for each data surface.
5. Failed API request cannot look like valid empty data.
6. Keyboard-only user can search, select server, open incident, inspect chart sample, and close drawer.
7. Reduced-motion capture contains no traveling pulse, blinking, or sliding content.
8. Status remains understandable in monochrome screenshot.
9. One real SignalR event visibly updates corresponding row, trace, age, and activity entry.
10. L3 action cannot execute without immutable target display, re-auth, typed hostname, and verification plan.

## 21. Phase boundary

This document completes Phase 1 design direction. Next work starts with backend credential vault, not frontend screen implementation. Frontend screens wait for real backend contracts and are built one screen at a time against observed responses.
