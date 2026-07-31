# Phase 8 — Configuration Drift & CIS Compliance

## Goal
Detect when servers deviate from their expected configuration baseline and provide CIS benchmark scoring.

## Features

### 8.1 Configuration Snapshots

**New entity: `ConfigSnapshot`**
```csharp
public class ConfigSnapshot
{
    public int Id { get; set; }
    public string ServerIp { get; set; }
    public DateTime CapturedAt { get; set; }
    public string InstalledRolesJson { get; set; }
    public string ServicesJson { get; set; }
    public string FirewallRulesHash { get; set; }
    public string RegistryKeysJson { get; set; }
    public string LocalUsersJson { get; set; }
    public bool IsBaseline { get; set; }
}
```

### 8.2 Drift Detection Service

**Background service: `DriftDetectionService`**
- Runs daily (configurable)
- Takes current snapshot of each server
- Compares against the marked baseline snapshot
- Generates drift alerts for differences:
  - New/removed roles
  - New/stopped services
  - Changed firewall rules
  - New local admin accounts

### 8.3 CIS Benchmark Checks

**Implement key CIS Level 1/2 checks:**
- Password policy compliance
- Audit policy settings
- Service hardening (unnecessary services disabled)
- Firewall profile enabled
- SMBv1 disabled
- TLS 1.2+ enforcement
- Local admin account renamed

**Scoring:** Each check = pass/fail/not-applicable. Score = passed / total applicable × 100%

### 8.4 Compliance Dashboard

**Route: `/compliance`**
- Per-server CIS score donut chart
- Fleet average compliance score
- Drill-down into failed checks with remediation guidance
- "Fix" button that runs the remediation PowerShell (with confirmation)

## Validation Checklist

- [ ] Can capture a baseline snapshot for a server
- [ ] Drift detection identifies new services/roles
- [ ] CIS checks run and return pass/fail
- [ ] Compliance score calculated correctly
- [ ] Remediation scripts fix identified issues
- [ ] Drift alerts appear in notification feed
