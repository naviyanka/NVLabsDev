# NEXUS 🌌

NEXUS is a modern, web-based Windows Server and Active Directory administration panel designed to replace legacy tools. Built with a lightning-fast React frontend and a robust .NET 8 backend, it provides real-time monitoring, process management, and domain administration through a sleek, highly customizable interface.

![Nexus Dashboard](https://via.placeholder.com/1200x600?text=Nexus+Dashboard) *(Replace with actual screenshot)*

## ✨ Features & Capabilities

NEXUS comes packed with a comprehensive suite of tools to manage every aspect of your Windows Server environment:

### Core Administration
- **Dashboard & Performance**: Live CPU, memory, network, and disk monitoring via SignalR.
- **Server Management**: Add and manage multiple remote Windows servers from a single pane of glass.
- **Active Directory (Users & Groups)**: Manage AD users, groups, and domain policies directly from your browser.
- **PowerShell Terminal**: Fully functional, built-in web terminal for direct PowerShell execution.

### System & Compute
- **Processes**: View, filter, and kill running processes (Task Manager equivalent).
- **Services**: Start, stop, restart, and configure startup types for Windows Services.
- **Scheduled Tasks**: Manage, run, and modify Windows Task Scheduler jobs.
- **Roles & Features**: Install or remove Windows Server roles and features remotely.
- **Virtual Machines (Hyper-V)**: Manage Hyper-V VMs and Virtual Switches.

### Storage & Files
- **Storage Management**: Manage disks, volumes, and Storage Replicas.
- **File Explorer**: Browse and manage the remote server's file system.

### Security & Networking
- **Windows Defender Security**: Monitor and trigger Defender scans.
- **Windows Firewall**: Manage inbound and outbound firewall rules.
- **Certificates**: View and manage the Windows Certificate Store.
- **Network Configuration**: View adapters, IP settings, and network topology.
- **Remote Desktop**: RDP launcher integration for quick server access.

### Maintenance & Troubleshooting
- **Event Viewer**: Browse and filter Windows Event Logs.
- **Registry Editor**: Navigate and modify the Windows Registry.
- **Windows Updates**: Check for and install Windows updates.
- **Installed Apps**: View and manage installed software.
- **Device Manager**: View hardware devices and their status.

### Customization & Extensibility
- **Plugin System**: Extend NEXUS by developing and installing custom plugins.
- **Theming System**: Multiple built-in themes including Horizon, Cyberpunk, Stealth, Light, and Dark mode.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TanStack Router, TailwindCSS, Lucide Icons.
- **Backend**: .NET 8 Web API, SignalR, Entity Framework Core (SQLite).
- **System Integration**: Native Windows PowerShell Execution Service, Active Directory Services.

---

## 🚀 Getting Started (Development)

Want to build and modify NEXUS on your local machine?

### Prerequisites
- Node.js (v18+)
- .NET 8 SDK
- A Windows environment (for PowerShell and AD features to work properly)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/NVLabsDev.git
cd NVLabsDev
```

### 2. Start the Backend
Entity Framework will automatically create the SQLite database (`nexus.db`) on the first run.
```bash
cd src/Nexus.Gateway
dotnet run
```

### 3. Start the Frontend
In a new terminal window:
```bash
cd src/Nexus.Frontend
npm install
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 📦 Deployment & Installation (Production)

Deploying NEXUS to your own server for domain management is simple. 

### Option 1: Standalone Build
1. Build the backend: `dotnet publish -c Release`
2. Build the frontend: `npm run build`
3. Serve the frontend statically, or use the built-in .NET host. 

### Option 2: Using the Installer (Recommended)
NEXUS comes with a custom installer built to handle port configurations, SSL certificates, and Windows Service registration.

1. Open `src/Nexus.Installer` in Visual Studio.
2. Compile the installer project.
3. Run `Nexus.Installer.exe` on your target Windows Server.
4. The installer will prompt you to:
   - Select the URL / FQDN to bind the application to.
   - Choose an existing SSL certificate or generate a self-signed cert.
   - Install NEXUS as a background Windows Service.

Once installed, simply browse to your configured URL (e.g., `https://nexus.yourdomain.local`).

---

## 🧑‍💻 How to Modify and Contribute

NEXUS is designed to be highly modular.

- **Adding a new frontend route**: Check out `src/Nexus.Frontend/src/routes`. We use TanStack Router for file-based routing.
- **Modifying backend logic**: Look into `src/Nexus.Gateway/Controllers` for API endpoints and `src/Nexus.Gateway/Services` for core business logic.
- **Adding PowerShell Scripts**: The backend uses `IPowerShellExecutionService` to run scripts safely. You can add new PS scripts in the backend services and expose them via API.

## 📝 License
MIT License
