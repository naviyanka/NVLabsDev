# Phase 7 — HTML5 Remote Desktop Gateway

## Goal
Provide in-browser RDP access to managed servers without requiring mstsc.exe or VPN — a true single-pane-of-glass experience.

## Approach Options

### Option A: Apache Guacamole Integration
- Deploy Guacamole as a sidecar container
- NEXUS proxies WebSocket connections to guacd
- Pros: battle-tested, supports RDP/VNC/SSH
- Cons: requires Docker/container, Java dependency

### Option B: FreeRDP → WebSocket Bridge
- Use a .NET wrapper around FreeRDP to stream RDP frames
- Convert to canvas-renderable data on the client
- Pros: no external dependencies
- Cons: complex, performance-sensitive

### Option C: Windows Remote Desktop Web Client
- Microsoft's official RD Web Client (TypeScript/Canvas)
- Requires RD Gateway role configured
- Pros: native Microsoft solution, best RDP compatibility
- Cons: requires RD Gateway infrastructure

**Recommended: Option A (Guacamole)** — most practical, well-documented, supports multiple protocols.

## Implementation

### 7.1 Backend Proxy

- `RdpController` with WebSocket endpoint
- Authenticates user, resolves target server
- Opens WebSocket tunnel to Guacamole guacd daemon
- Passes Guacamole protocol messages between browser and guacd

### 7.2 Frontend Client

- Guacamole JavaScript client library (MIT licensed)
- Embed in a full-screen iframe/component at `/remote-desktop`
- Connection params: hostname, port, username, domain
- Clipboard sync, file transfer support

### 7.3 Session Management

- Track active RDP sessions
- Idle timeout (configurable)
- Max concurrent sessions limit
- Session recording (optional, for audit)

## Validation Checklist

- [ ] Can connect to a Windows Server via browser
- [ ] Mouse, keyboard, clipboard work
- [ ] Session terminates on idle timeout
- [ ] Multiple simultaneous sessions supported
- [ ] Works through NEXUS authentication (JWT)
