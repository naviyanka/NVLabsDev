# Phase 3 — Reporting & Comparison

## Goal
Add fleet-wide reporting for patch compliance and a server comparison view for detecting configuration drift between similar servers.

## Features

### 3.1 Patch Compliance Report

**Route: `/reports/patches`**

- Backend: `GET /api/reports/patch-compliance` — aggregates WindowsUpdateEntity data per server
- Shows: server name, last scan date, missing critical patches, missing important patches, compliance %
- Color-coded: green (100%), yellow (>80%), red (<80%)
- Export: CSV download button
- Filter: by server group, by severity

### 3.2 Server Comparison View

**Route: `/reports/compare`**

- Select 2-3 servers from dropdown
- Side-by-side table showing:
  - OS version, build number
  - Installed roles & features (highlight differences)
  - CPU/RAM/Disk specs
  - Network adapters
  - Last patch date
  - Uptime
- Diff highlighting: green for matching, red for divergent values
- Backend: `GET /api/reports/compare?servers=ip1,ip2,ip3`

### 3.3 Fleet Health Summary Report

**Route: `/reports/health`**

- Overall fleet metrics: total servers, online %, average CPU, average RAM
- Worst performers (top 5 by CPU, top 5 by RAM, top 5 by disk usage)
- Alert frequency chart (alerts per day over last 30 days)
- Uptime SLA calculation per server

## Validation Checklist

- [ ] Patch compliance report loads and shows per-server data
- [ ] CSV export works
- [ ] Server comparison highlights differences
- [ ] Health summary shows aggregated fleet metrics
- [ ] Reports respect server group filters
