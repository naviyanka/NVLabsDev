# Phase 4 — Customizable Dashboard Widgets

## Goal
Replace the fixed dashboard layout with a configurable widget grid where users can add, remove, and rearrange metric cards.

## Features

### 4.1 Widget Registry

Available widgets:
- Fleet topology ring chart (existing)
- CPU heatmap (all servers, color-coded cells)
- RAM usage bar chart
- Disk space stacked bars
- Network throughput sparklines
- Recent alerts list
- Server status table (compact)
- Uptime leaderboard
- AI insights summary
- Quick actions panel (restart service, run script)

### 4.2 Layout Persistence

- Store widget layout in `DashboardLayout` setting (JSON string)
- Format: `[{ "id": "cpu-heatmap", "x": 0, "y": 0, "w": 6, "h": 4 }, ...]`
- Default layout for new users
- Reset to default button

### 4.3 Drag & Drop Grid

- Use CSS Grid with drag-drop (or react-grid-layout library)
- Widget add drawer: browse available widgets
- Each widget has a settings gear (e.g., select which server group to show)
- Responsive: collapses to single-column on mobile

### 4.4 Widget Components

Each widget is a self-contained React component that:
- Fetches its own data (via API or SignalR subscription)
- Has a loading skeleton
- Has an error state
- Respects the active theme palette

## Validation Checklist

- [ ] Can add/remove widgets from dashboard
- [ ] Layout persists across page reloads
- [ ] Drag-drop reordering works
- [ ] Each widget renders correctly in isolation
- [ ] Reset to default restores original layout
- [ ] Mobile responsive
