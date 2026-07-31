# Phase 1 — Scheduled Jobs / Runbooks

## Goal
Allow users to create, schedule, and manage recurring PowerShell scripts that run automatically against target servers on a cron-like schedule.

## Features

### 1.1 Runbook Model & Database

**New entities:**
```csharp
public class Runbook
{
    public string Id { get; set; } // GUID
    public string Name { get; set; }
    public string Description { get; set; }
    public string Script { get; set; } // PowerShell script content
    public string CronExpression { get; set; } // "0 2 * * 0" = Sunday 2 AM
    public string TargetServers { get; set; } // comma-separated IPs or "*" for all
    public bool Enabled { get; set; } = true;
    public DateTime? LastRunAt { get; set; }
    public string LastRunStatus { get; set; } // Success, Failed, Running
    public string LastRunOutput { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
}

public class RunbookExecution
{
    public int Id { get; set; }
    public string RunbookId { get; set; }
    public string ServerIp { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int ExitCode { get; set; }
    public string Output { get; set; }
    public string Status { get; set; } // Running, Success, Failed
}
```

### 1.2 Runbook Scheduler Background Service

**`RunbookSchedulerService : BackgroundService`**
- Runs every 60 seconds
- Loads all enabled runbooks
- Evaluates cron expressions against current time
- For due runbooks: spawns PowerShell execution per target server
- Records RunbookExecution entries
- Sends SignalR notification on completion/failure

### 1.3 Runbook API Controller

**`RunbooksController`**
- `GET /api/runbooks` — List all runbooks
- `GET /api/runbooks/{id}` — Get runbook details + recent executions
- `POST /api/runbooks` — Create new runbook
- `PUT /api/runbooks/{id}` — Update runbook
- `DELETE /api/runbooks/{id}` — Delete runbook
- `POST /api/runbooks/{id}/run` — Manual trigger (run now)
- `GET /api/runbooks/{id}/executions` — Execution history

### 1.4 Frontend — Runbooks Page

**New route: `/runbooks`**
- List view: Name, schedule (human-readable), last run time, status badge
- Create/Edit modal: Name, description, script editor (Monaco-like textarea), cron builder, target server selector
- Execution history drawer: output logs, duration, exit codes
- Manual "Run Now" button per runbook

**Register as plugin:** Add `builtin-runbooks` to NexusContext seed data.

---

## Cron Parsing

Use NCrontab NuGet package (`NCrontab.Signed`) or implement basic cron matching for: minute, hour, day-of-month, month, day-of-week.

## Validation Checklist

- [ ] Can create a runbook with script + cron + targets
- [ ] Scheduler fires runbook at correct time
- [ ] Execution output is stored and viewable
- [ ] Manual "Run Now" works
- [ ] Failed executions show error output
- [ ] SignalR notification on completion
- [ ] Runbook appears in plugin sidebar
