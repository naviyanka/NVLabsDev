# Phase 5 — AI Ops & Intelligent Automation

## Goal
Extend the AI Copilot from passive analysis into active operations: natural language commands, anomaly detection, and incident correlation.

## Features

### 5.1 Natural Language → PowerShell

**Enhancement to Copilot Drawer:**
- User types: "Show me all stopped services on SQL01 that should be auto-starting"
- Copilot generates: `Get-Service | Where-Object { $_.Status -eq 'Stopped' -and $_.StartType -eq 'Automatic' }`
- Shows preview with "Run on SQL01" button
- On confirm: dispatches via existing PowerShell execution service
- Shows output in copilot chat

**Backend:** Add a `/api/copilot/generate-command` endpoint that:
- Takes natural language input + target server context
- Returns generated PowerShell command
- Includes safety classification (safe/destructive/unknown)

### 5.2 Anomaly Detection (Baseline Learning)

**New background service: `AnomalyDetectionService`**
- Runs every 5 minutes
- For each server, calculates rolling 7-day average and standard deviation for CPU, RAM, Disk
- If current value exceeds 2 standard deviations above mean for >5 minutes: generate anomaly alert
- Distinct from threshold alerts — these are statistical, adaptive

**Storage:** Add `ServerBaseline` entity:
```csharp
public class ServerBaseline
{
    public string ServerIp { get; set; }
    public string Metric { get; set; } // cpu, ram, disk
    public double Mean { get; set; }
    public double StdDev { get; set; }
    public DateTime CalculatedAt { get; set; }
}
```

### 5.3 Incident Correlation

**When an alert fires:**
- Copilot automatically gathers context:
  - Recent process changes (new processes started in last 10 min)
  - Recent service state changes
  - Recent Windows Event Log errors
  - Similar past alerts and their resolution
- Presents a "Root Cause Analysis" card in the notification panel
- Suggests remediation runbook if one matches the alert pattern

### 5.4 Auto-Remediation (with approval)

- Link alert rules to runbooks: "When CPU > 95% on any server for 5 min, run 'Restart IIS App Pool' runbook"
- Two modes:
  - Manual Approval: creates a pending action the admin must confirm
  - Auto-Execute: runs immediately (configurable per rule, behind `AutoRemediationPolicy` setting)

## Validation Checklist

- [ ] NL→PS generates correct commands for common queries
- [ ] Safety classification prevents destructive commands from auto-running
- [ ] Anomaly detection fires for statistical outliers
- [ ] Baselines update automatically from telemetry history
- [ ] Incident correlation provides relevant context
- [ ] Auto-remediation respects approval policy
