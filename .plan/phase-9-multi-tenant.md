# Phase 9 — Multi-Tenant & API Key Management

## Goal
Support managing multiple AD domains/forests from a single NEXUS instance and provide API keys for external automation tools.

## Features

### 9.1 Multi-Domain Support

**New entity: `ManagedDomain`**
```csharp
public class ManagedDomain
{
    public string Id { get; set; }
    public string DomainName { get; set; }
    public string FriendlyName { get; set; }
    public string ServiceAccountUsername { get; set; }
    public string ServiceAccountPasswordEncrypted { get; set; }
    public bool IsActive { get; set; }
    public DateTime LastSyncAt { get; set; }
}
```

- AD sync service iterates over all active domains
- Servers tagged with their source domain
- Domain selector in UI header
- Cross-domain server comparison

### 9.2 Trust Relationship Discovery

- Enumerate AD trust relationships
- Visualize forest/domain topology
- Import servers from trusted domains

### 9.3 API Key Management

**New entity: `ApiKey`**
```csharp
public class ApiKey
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string HashedKey { get; set; }
    public string Role { get; set; } // maps to RBAC role
    public string CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public bool IsActive { get; set; }
}
```

**API Key Authentication:**
- Accept `X-Api-Key` header alongside JWT
- Hash-compare against stored keys
- Rate limit per key
- Audit log shows which key was used

**UI: Settings > Security > API Keys**
- Generate new key (shown once, then hashed)
- List keys with last-used date
- Revoke/delete keys

## Validation Checklist

- [ ] Can add multiple domains to manage
- [ ] AD sync discovers servers from each domain
- [ ] Servers show their source domain
- [ ] API keys can authenticate to all endpoints
- [ ] Key rotation (create new, revoke old) works
- [ ] Audit trail shows API key identity
