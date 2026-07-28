# NEXUS 🌌 Backend API & Frontend Integration Guide

This document provides complete technical documentation and visual architectural models for the **NEXUS** administration panel. It details how the **React 18 / Vite Frontend** communicates with the **ASP.NET Core 8 Backend Gateway (`Nexus.Gateway`)**, including REST API endpoints, WebSockets, Server-Sent Events (SSE), SignalR hubs, and native Windows integrations.

---

## 1. System Architecture & Visualization

### High-Level Architectural Flow

```mermaid
graph TD
    subgraph Frontend ["React 18 + Vite Frontend (Nexus.Frontend)"]
        UI["UI Layer / TanStack Routes<br/>(servers, apps, performance, files, etc.)"]
        API_Client["API Client Layer<br/>(src/api/client.ts)"]
        Term_Store["Terminal Store<br/>(src/lib/terminalStore.ts)"]
        SigR_Client["SignalR Hub Client<br/>(Topbar.tsx / HorizonLayout)"]
    end

    subgraph Proxy ["Proxy & Gateway Entry"]
        YARP["YARP / Kestrel Reverse Proxy<br/>(Port 5011 / 5173)"]
        JWT_Auth["JWT Bearer Authentication<br/>(Token Validation & Auth Middleware)"]
    end

    subgraph Backend ["ASP.NET Core 8 Backend (Nexus.Gateway)"]
        Controllers["REST Controllers (27 Modules)<br/>(Apps, Auth, Servers, Users, etc.)"]
        Term_WS["Terminal Controller (WebSocket)<br/>(/api/terminal/ws)"]
        PS_SSE["PowerShell Controller (SSE)<br/>(/api/powershell/run)"]
        SignalR_Hub["NotificationHub (SignalR)<br/>(/hub/notifications)"]
    end

    subgraph Infrastructure ["Infrastructure & Windows Services"]
        PS_Service["PowerShell Execution Service<br/>(IPowerShellExecutionService)"]
        CIM_Service["CIM / WMI Service<br/>(CimService)"]
        AD_Service["Active Directory Service<br/>(PrincipalContext / AD)"]
        PTY_Engine["Porta.Pty Engine<br/>(powershell.exe / PSSession)"]
        EF_Core["EF Core (SQLite / SQL Server)<br/>(NexusContext & NexusLogContext)"]
    end

    subgraph OS ["Windows OS & Hardware"]
        Win_Registry["Windows Registry"]
        Win_Services["Win32 Services & Tasks"]
        HyperV["Hyper-V Engine"]
        Win_Sec["Event Logs & Security"]
        SMB_FS["Administrative SMB (C$)"]
    end

    UI --> API_Client
    UI --> Term_Store
    UI --> SigR_Client

    API_Client -->|HTTP REST| YARP
    Term_Store -->|WebSocket| YARP
    SigR_Client -->|WebSockets / Long-Polling| YARP

    YARP --> JWT_Auth
    JWT_Auth --> Controllers
    JWT_Auth --> Term_WS
    JWT_Auth --> PS_SSE
    JWT_Auth --> SignalR_Hub

    Controllers --> PS_Service
    Controllers --> CIM_Service
    Controllers --> AD_Service
    Controllers --> EF_Core

    Term_WS --> PTY_Engine
    PS_SSE --> PS_Service

    PS_Service --> OS
    CIM_Service --> OS
    AD_Service --> OS
    PTY_Engine --> OS
    EF_Core --> OS
```

---

## 2. Real-Time Communication Sequence Diagrams

### A. Authentication Sequence (JWT Token Issuance)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as System Administrator
    participant FE as React Login Page (login.tsx)
    participant AuthCtrl as AuthController (/api/auth/login)
    participant AD as Windows AD / Machine Principal
    participant JWT as JwtSecurityTokenHandler

    Admin->>FE: Enter Username, Password & Scope (Local / Domain)
    FE->>AuthCtrl: POST /api/auth/login { scope, username, password, domain }
    alt Scope == "domain"
        AuthCtrl->>AD: PrincipalContext(Domain).ValidateCredentials()
        AD-->>AuthCtrl: Credentials Valid & User in 'Domain Admins'
    else Scope == "local"
        AuthCtrl->>AD: PrincipalContext(Machine).ValidateCredentials()
        AD-->>AuthCtrl: Credentials Valid & User in 'Administrators'
    end
    AuthCtrl->>JWT: GenerateJwtToken(username, role)
    JWT-->>AuthCtrl: Signed Bearer Token (8h expiration)
    AuthCtrl-->>FE: 200 OK { token }
    FE->>FE: Store Token & Attach to Headers for Future Requests
```

---

### B. Interactive WebTerminal Flow (WebSocket + PTY)

```mermaid
sequenceDiagram
    autonumber
    actor User as Admin User
    participant TermUI as Web Terminal Component (xterm.js)
    participant TermStore as terminalStore.ts
    participant WS as TerminalController (/api/terminal/ws)
    participant PTY as Porta.Pty Engine
    participant Host as Remote Windows Server

    User->>TermUI: Open Terminal Tab for Server 'DC01'
    TermUI->>TermStore: connectTerminal(serverId)
    TermStore->>WS: WebSocket Connect: /api/terminal/ws?serverId=DC01&access_token=JWT
    WS->>WS: Validate JWT & Sanitize serverId
    WS->>PTY: SpawnAsync(powershell.exe)
    alt Remote Server
        PTY->>Host: Enter-PSSession -ComputerName 'DC01'
    end
    
    par Stream PTY Output to Frontend
        PTY-->>WS: ReaderStream (Binary Output)
        WS-->>TermUI: WebSocket Binary Frame
        TermUI->>TermUI: Render ANSI Terminal Output
    and Stream User Keys to PTY
        User->>TermUI: Type Command (e.g., 'Get-Process')
        TermUI-->>WS: WebSocket Binary Frame
        WS->>PTY: WriterStream.WriteAsync(buffer)
    end
```

---

### C. Live Notifications Sequence (SignalR)

```mermaid
sequenceDiagram
    autonumber
    participant Job as Background Task / Updates Service
    participant NotifSvc as NotificationService
    participant DB as NexusContext DB
    participant Hub as NotificationHub (/hub/notifications)
    participant FE as React Topbar Component

    Job->>NotifSvc: AddAndBroadcastNotificationAsync(type, message, serverIp)
    NotifSvc->>DB: Save Notification Entity
    NotifSvc->>Hub: Clients.All.SendAsync("ReceiveNotification", notification)
    Hub-->>FE: Real-Time SignalR Event Push
    FE->>FE: Update Bell Icon Badge & Display Toast Notification
```

---

## 3. Frontend-Backend API Integration Matrix

The following matrix documents all **28 API Modules**, their endpoint signatures, functionality, HTTP methods, payloads, backend implementations, and exact React route/component mappings.

| Domain | Controller Module | HTTP Endpoint Signature | Method | Description & Execution Logic | Frontend Component Integration |
|---|---|---|---|---|---|
| **Auth** | `AuthController` | `/api/auth/login` | `POST` | Authenticates against Local Admin or AD Domain Admins; returns JWT token. | `routes/login.tsx`, `routes/__root.tsx` |
| **Security** | `SecurityController` | `/api/servers/{ip}/security` | `GET` | Fetches Security Event logs, open TCP ports, local admins, and failed logons. | `routes/security.tsx` |
| **Servers** | `ServersController` | `/api/servers` | `GET` | Retrieves list of managed servers with status and telemetry. | `routes/servers.tsx`, `HorizonServers.tsx` |
| **Servers** | `ServersController` | `/api/servers` | `POST` | Adds a server manually to management inventory. | `routes/servers.tsx` |
| **Servers** | `ServersController` | `/api/servers/{ip}` | `PUT` | Updates existing server metadata. | `routes/servers.tsx` |
| **Servers** | `ServersController` | `/api/servers/{ip}` | `DELETE` | Removes server from management inventory. | `routes/servers.tsx` |
| **Servers** | `ServersController` | `/api/servers/{ip}/restart` | `POST` | Reboots server via CIM `Win32_OperatingSystem`. | `routes/servers.tsx`, `HorizonServers.tsx` |
| **Servers** | `ServersController` | `/api/servers/{ip}/shutdown` | `POST` | Shuts down server via CIM `Win32_OperatingSystem`. | `routes/servers.tsx`, `HorizonServers.tsx` |
| **Servers** | `ServersController` | `/api/servers/{ip}/disks` | `GET` | Queries physical disks via WMI/CIM. | `routes/storage.tsx` |
| **Performance**| `PerformanceController` | `/api/performance/{id}` | `GET` | Gets 60 telemetry samples (CPU, RAM, Disk, Net). | `routes/performance.tsx` |
| **Performance**| `PerformanceController` | `/api/performance/{id}/processes` | `GET` | Gets top CPU processes from DB telemetry. | `routes/performance.tsx` |
| **Performance**| `PerformanceController` | `/api/performance/{id}/processes/live` | `GET` | Queries live process list via CIM. | `routes/processes.tsx` |
| **Performance**| `PerformanceController` | `/api/performance/{id}/processes/{pid}` | `GET` | Gets process details by PID via CIM. | `routes/processes.tsx` |
| **Performance**| `PerformanceController` | `/api/performance/{id}/processes/{pid}` | `DELETE` | Terminates process via CIM `Win32_Process.Terminate()`. | `routes/processes.tsx` |
| **Devices** | `DevicesController` | `/api/servers/{serverId}/devices` | `GET` | Queries PnP hardware devices via PowerShell `Get-PnpDevice`. | `routes/devices.tsx` |
| **Terminal** | `TerminalController` | `/api/terminal/ws` | `WebSocket`| Real-time PTY PowerShell terminal stream (`Porta.Pty`). | `lib/terminalStore.ts` |
| **PowerShell**| `PowerShellController` | `/api/powershell/session` | `POST` | Creates persistent background PowerShell session. | `HorizonPowerShell.tsx` |
| **PowerShell**| `PowerShellController` | `/api/powershell/session/{id}`| `DELETE` | Destroys persistent PowerShell session. | `HorizonPowerShell.tsx` |
| **PowerShell**| `PowerShellController` | `/api/powershell/run` | `POST` | Streams PowerShell output via **Server-Sent Events (SSE)**. | `HorizonPowerShell.tsx` |
| **RDP** | `RdpController` | `/api/servers/{serverId}/rdp/sessions` | `GET` | Queries active RDP user sessions via `qwinsta`. | `routes/remote-desktop.tsx` |
| **RDP** | `RdpController` | `/api/servers/{serverId}/rdp/sessions/{id}/disconnect` | `POST` | Disconnects RDP session via `tsdiscon`. | `routes/remote-desktop.tsx` |
| **RDP** | `RdpController` | `/api/servers/{serverId}/rdp/sessions/{id}/logoff` | `POST` | Logs off RDP session via `logoff`. | `routes/remote-desktop.tsx` |
| **RDP** | `RdpController` | `/api/servers/{serverId}/rdp/sessions/{id}/message` | `POST` | Sends pop-up message to session user via `msg.exe`. | `routes/remote-desktop.tsx` |
| **RDP** | `RdpController` | `/api/servers/{serverId}/rdp/config` | `GET` / `PUT` | Reads & updates RDP security registry settings. | `routes/remote-desktop.tsx` |
| **Files** | `WindowsFilesController`| `/api/servers/{ip}/files/sources` | `GET` | Lists drive letters (`C:`, `D:`) & SMB shares. | `routes/files.tsx`, `RemoteFilePicker.tsx` |
| **Files** | `WindowsFilesController`| `/api/servers/{ip}/files/list` | `GET` | Browses folder contents over Administrative SMB (`C$`). | `routes/files.tsx`, `RemoteFilePicker.tsx` |
| **Files** | `WindowsFilesController`| `/api/servers/{ip}/files/new-folder` | `POST` | Creates folder on remote server. | `routes/files.tsx` |
| **Files** | `WindowsFilesController`| `/api/servers/{ip}/files/delete` | `DELETE` | Deletes file or directory on target server. | `routes/files.tsx` |
| **Files** | `WindowsFilesController`| `/api/servers/{ip}/files/upload` | `POST` | Uploads file up to 1GB to target path. | `routes/files.tsx`, `RemoteFilePicker.tsx` |
| **Files** | `WindowsFilesController`| `/api/servers/{ip}/files/download` | `GET` | Downloads file or streams folder as `.zip` archive. | `routes/files.tsx` |
| **Files** | `WindowsFilesController`| `/api/servers/{ip}/files/rename` | `POST` | Renames file/folder. | `routes/files.tsx` |
| **Files** | `WindowsFilesController`| `/api/servers/{ip}/files/move` | `POST` | Moves file/folder across volumes. | `routes/files.tsx` |
| **Files** | `WindowsFilesController`| `/api/servers/{ip}/files/copy` | `POST` | Copies file/folder recursively. | `routes/files.tsx` |
| **Files** | `WindowsFilesController`| `/api/servers/{ip}/files/read-text` | `GET` | Reads text file content. | `routes/files.tsx` |
| **Files** | `WindowsFilesController`| `/api/servers/{ip}/files/write-text`| `POST` | Overwrites text file content. | `routes/files.tsx` |
| **Storage** | `WindowsStorageController`| `/api/servers/{serverId}/storage/disks` | `GET` | Physical disk storage metrics (Health, BusType, Size). | `routes/storage.tsx` |
| **Storage** | `WindowsStorageController`| `/api/servers/{serverId}/storage/volumes`| `GET` | Volume storage metrics (FileSystem, FreeSpace). | `routes/storage.tsx` |
| **Active Directory** | `ActiveDirectoryController`| `/api/activedirectory/search` | `GET` | Searches AD users by SAM account name or display name. | `routes/users.tsx` |
| **Local Users**| `UsersController` | `/api/servers/{ip}/users` | `GET` | Lists local user accounts, last login, groups. | `routes/users.tsx` |
| **Local Users**| `UsersController` | `/api/servers/{ip}/users/groups` | `GET` | Lists local security groups and members. | `routes/users.tsx` |
| **Roles** | `RolesController` | `/api/servers/{ip}/roles` | `GET` | Queries Windows Features/Roles (`Get-WindowsFeature`). | `routes/roles.tsx` |
| **Roles** | `RolesController` | `/api/servers/{ip}/roles/install` | `POST` | Installs Windows role/feature. | `routes/roles.tsx` |
| **Roles** | `RolesController` | `/api/servers/{ip}/roles/uninstall` | `POST` | Uninstalls Windows role/feature. | `routes/roles.tsx` |
| **Services** | `WindowsServicesController`| `/api/servers/{serverId}/services` | `GET` | Lists Windows services via CIM `Win32_Service`. | `routes/services.tsx` |
| **Services** | `WindowsServicesController`| `/api/servers/{serverId}/services/{svc}/{act}` | `POST` | Controls service (`start`, `stop`, `restart`). | `routes/services.tsx` |
| **Tasks** | `TasksController` | `/api/servers/{ip}/tasks` | `GET` | Lists Scheduled Tasks (`schtasks /query`). | `routes/tasks.tsx` |
| **Tasks** | `TasksController` | `/api/servers/{ip}/tasks/run` | `POST` | Runs scheduled task on demand (`schtasks /run`). | `routes/tasks.tsx` |
| **Registry** | `RegistryController` | `/api/servers/{ip}/registry` | `GET` | Browses Windows Registry hives (`HKLM`, `HKCU`, etc.). | `routes/registry.tsx` |
| **Certificates**| `CertificatesController`| `/api/servers/{ip}/certificates` | `GET` | Lists digital certificates from LocalMachine store. | `routes/certificates.tsx` |
| **Networks** | `NetworksController` | `/api/servers/{ip}/networks` | `GET` | Network adapter IP, DNS, MAC, speed & throughput. | `routes/networks.tsx` |
| **Networks** | `NetworksController` | `/api/servers/{ip}/networks/{name}/{act}` | `POST` | Controls network adapter (`enable`, `disable`, `renew`). | `routes/networks.tsx` |
| **Apps** | `AppsController` | `/api/servers/{ip}/apps` | `GET` | Lists installed applications from Registry. | `routes/apps.tsx`, `SoftwareRepoManager.tsx` |
| **Apps** | `AppsController` | `/api/servers/{ip}/apps/install` | `POST` | Installs MSI/EXE package with SMB copy option. | `routes/apps.tsx` |
| **Apps** | `AppsController` | `/api/servers/{ip}/apps/upload-installer` | `POST` | Uploads installer up to 2GB to `C:\Windows\Temp`. | `routes/apps.tsx`, `RemoteFilePicker.tsx` |
| **Apps** | `AppsController` | `/api/servers/{ip}/apps/uninstall` | `POST` | Uninstalls app via uninstall string. | `routes/apps.tsx` |
| **Updates** | `UpdatesController` | `/api/servers/{ip}/updates` | `GET` | Gets cached missing Windows updates. | `routes/updates.tsx` |
| **Updates** | `UpdatesController` | `/api/servers/{ip}/updates/check` | `POST` | Searches for missing updates via COM searcher. | `routes/updates.tsx` |
| **Updates** | `UpdatesController` | `/api/servers/{ip}/updates/install` | `POST` | Triggers background download and installation. | `routes/updates.tsx` |
| **Hyper-V** | `VmsController` | `/api/servers/{serverId}/vms` | `GET` | Lists Hyper-V VMs via `Get-VM`. | `routes/vms.tsx` |
| **Hyper-V** | `VmsController` | `/api/servers/{serverId}/vms/{vmId}/{act}` | `POST` | Controls VM (`start`, `stop`, `pause`, `resume`). | `routes/vms.tsx` |
| **Hyper-V** | `VmsController` | `/api/servers/{serverId}/vms/{vmId}` | `DELETE` | Removes Hyper-V VM (`Remove-VM -Force`). | `routes/vms.tsx` |
| **Hyper-V** | `VmsController` | `/api/servers/{serverId}/vswitches` | `GET` | Lists Hyper-V Virtual Switches. | `routes/vswitches.tsx` |
| **Plugins** | `PluginsController` | `/api/plugins` | `GET` / `POST` | Lists & creates automation plugins. | `routes/plugin.$id.tsx`, `HorizonPlugin.tsx` |
| **Plugins** | `PluginsController` | `/api/plugins/{id}/upload` | `POST` | Uploads script file with dangerous command filter. | `routes/plugin.$id.tsx` |
| **Plugins** | `PluginsController` | `/api/plugins/{id}/run` | `POST` | Executes plugin concurrently across target servers. | `routes/plugin.$id.tsx` |
| **Jobs** | `JobsController` | `/api/jobs` | `GET` | Lists background jobs and reads execution logs. | `routes/plugin.$id.tsx` |
| **SharePoint**| `SharePointSetupController`| `/api/plugins/SharePointSetup/execute` | `POST` | Runs automated SharePoint & SQL Server deployment. | `routes/sharepoint-setup.tsx` |
| **Settings** | `AppSettingsController` | `/api/settings` | `GET` / `POST` | Manages global app settings, themes, density & logs. | `routes/settings.tsx`, `HorizonSettings.tsx` |
| **Notifications**| `NotificationsController`| `/api/notifications` | `GET` / `DELETE`| Manages notifications DB entities. | `Topbar.tsx`, `routes/index.tsx` |
| **SignalR** | `NotificationHub` | `/hub/notifications` | `SignalR` | Real-time push notification broadcast. | `Topbar.tsx`, `HorizonLayout.tsx` |
| **Utils** | `UtilsController` | `/api/utils/test-url` | `POST` | Tests external URL reachability via HTTP HEAD/GET. | `lib/backend.ts` |
| **Health** | Minimal API | `/api/health` | `GET` | Anonymous backend health check (`{ status: "Healthy" }`).| `lib/backend.ts` |

---

## 4. Detailed Component & Integration Guide

### 1. Centralized API Client (`src/api/client.ts`)
The React application routes interact with backend REST endpoints through `src/api/client.ts`. Key wrapper helper functions include:
- `getServersClient()`, `addServerClient()`, `restartServerClient()`
- `getPerformanceHistoryClient()`, `getProcessesClient()`, `killProcessClient()`
- `getFilesSourcesClient()`, `getFilesListClient()`, `uploadFileClient()`, `downloadFileClient()`
- `getRolesClient()`, `installRoleClient()`, `uninstallRoleClient()`
- `getUpdatesClient()`, `checkUpdatesClient()`, `installUpdatesClient()`
- `getVmsClient()`, `controlVmClient()`, `deleteVmClient()`

### 2. Authentication Interceptor (`src/routes/__root.tsx`)
All HTTP requests triggered by TanStack Router or fetch clients pass through root interceptors:
- Token auto-injection: `Authorization: Bearer <jwtToken>`
- Automatic redirect to `/login` when receiving `401 Unauthorized` responses.
- Backend URL dynamic resolution (`/api/...` relative proxy or absolute gateway URL).

### 3. Real-time Terminal Store (`src/lib/terminalStore.ts`)
Handles multi-tab web terminal sessions:
- Maintains active WebSocket connection references.
- Auto-reconnects on transient network drops.
- Encodes ANSI key strings into Uint8Arrays before writing to WebSocket frames.

---

## 5. Summary & Verification

This guide covers all **28 backend controller modules**, SignalR real-time hubs, WebSocket PTY shell controllers, and their 1:1 frontend component bindings.

To test end-to-end connectivity locally:
1. Start the .NET Gateway: `cd src/Nexus.Gateway && dotnet run` (Listens on port `5011`).
2. Start the Vite Frontend: `cd src/Nexus.Frontend && npm run dev` (Listens on port `5173`).
3. Verify `/api/health` returns `200 OK` with `{ "status": "Healthy" }`.
