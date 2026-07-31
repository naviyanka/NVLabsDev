# Phase 6 — Plugins Tier 2 (DNS, DHCP, IIS)

## Goal
Add three high-value management plugins that cover the most common Windows Server roles beyond the base OS.

## Features

### 6.1 DNS Manager

**Route: `/dns`**
**Backend: `DnsController`**

- `GET /api/dns/zones` — List DNS zones on selected DC
- `GET /api/dns/zones/{name}/records` — List records in a zone
- `POST /api/dns/zones/{name}/records` — Create A/AAAA/CNAME/MX/TXT record
- `DELETE /api/dns/zones/{name}/records/{id}` — Delete record
- Uses `DnsServer` PowerShell module: `Get-DnsServerZone`, `Get-DnsServerResourceRecord`, `Add-DnsServerResourceRecordA`, etc.

**Frontend:**
- Zone list sidebar
- Record table with type filter
- Add record modal (type-aware form fields)
- Delete confirmation

### 6.2 DHCP Scope Monitor

**Route: `/dhcp`**
**Backend: `DhcpController`**

- `GET /api/dhcp/scopes` — List DHCP scopes with utilization %
- `GET /api/dhcp/scopes/{id}/leases` — Active leases in a scope
- `GET /api/dhcp/reservations` — All reservations
- Uses `DhcpServer` PowerShell module

**Frontend:**
- Scope list with utilization bars (color-coded: green <70%, yellow <90%, red >90%)
- Lease table with MAC, IP, hostname, expiry
- Reservation management

**Alert integration:** Auto-create alert when scope utilization > 90%

### 6.3 IIS Manager

**Route: `/iis`**
**Backend: `IisController`**

- `GET /api/iis/sites` — List websites
- `GET /api/iis/app-pools` — List application pools
- `POST /api/iis/app-pools/{name}/recycle` — Recycle app pool
- `POST /api/iis/sites/{name}/stop` — Stop site
- `POST /api/iis/sites/{name}/start` — Start site
- Uses `WebAdministration` PowerShell module

**Frontend:**
- Sites table: name, bindings, status, app pool
- App pools table: name, .NET version, state, worker process count
- Quick actions: recycle, stop, start

## Validation Checklist

- [ ] DNS zones and records load from target DC
- [ ] Can add/delete DNS records
- [ ] DHCP scopes show utilization
- [ ] DHCP leases display correctly
- [ ] IIS sites and app pools listed
- [ ] Recycle/start/stop actions work
- [ ] All three register as plugins in sidebar
