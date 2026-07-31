# Phase 2 — Role-Based Access Control (RBAC)

## Goal
Replace the current all-or-nothing (Domain Admins / Local Admins) auth model with granular roles that limit what users can see and do.

## Roles

| Role | Permissions |
|------|------------|
| Viewer | Read-only dashboard, view servers, view telemetry, view logs |
| Operator | Viewer + restart services, run preset scripts, toggle maintenance |
| Admin | Operator + manage servers, manage runbooks, manage plugins, manage settings |
| SuperAdmin | Admin + manage users/roles, clear caches, access audit logs, delete servers |

## Features

### 2.1 User & Role Models

```csharp
public class NexusUser
{
    public string Id { get; set; }
    public string Username { get; set; }
    public string Role { get; set; } // Viewer, Operator, Admin, SuperAdmin
    public string Source { get; set; } // "domain" or "local"
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}
```

### 2.2 JWT Claims Enhancement

- On login, resolve user's NEXUS role from `NexusUser` table (fallback: SuperAdmin for Domain Admins, Admin for local Admins)
- Embed role in JWT claims
- Create `[Authorize(Roles = "Admin,SuperAdmin")]` decorators on destructive endpoints

### 2.3 Permission Middleware

- Create a `RbacAuthorizationFilter` that checks:
  - Route category (Management, Security, Infrastructure, Advanced)
  - Action type (Read, Write, Execute, Delete)
  - User role
- Only enforced when `EnableRbac` setting is true (backward compatible)

### 2.4 User Management UI

**New route: `/users`** (accessible only to SuperAdmin)
- List all NexusUser entries
- Assign/change roles
- Remove users
- AD user search for adding domain users

### 2.5 Frontend Role Gates

- Sidebar: hide menu items the user can't access
- Buttons: disable/hide destructive actions for Viewers/Operators
- Settings page: only visible to Admin+

## Validation Checklist

- [ ] Viewer cannot restart services or run scripts
- [ ] Operator can restart services but not delete servers
- [ ] Admin can manage runbooks but not clear audit logs
- [ ] SuperAdmin has full access
- [ ] UI hides unauthorized actions
- [ ] Existing users (pre-RBAC) default to SuperAdmin
- [ ] RBAC can be disabled via settings toggle (backward compat)
