// NEXUS mock API — swap URLs for real endpoints later, contracts stay identical.

export const delay = (ms = 400 + Math.random() * 400) =>
  new Promise<void>((r) => setTimeout(r, ms));

export type ServerStatus = "online" | "warning" | "critical" | "offline";

export interface Server {
  id: string;
  name: string;
  ip: string;
  role: string;
  os: string;
  status: ServerStatus;
  cpu: number;
  mem: number;
  disk: number;
  uptime: string;
  site: string;
}

export const MOCK_SERVERS: Server[] = [
  { id: "dc01",    name: "DC01",    ip: "192.168.0.10", role: "Domain Controller", os: "Windows Server 2019", status: "online",   cpu: 34, mem: 61, disk: 45, uptime: "47d 3h", site: "nexuslab.local" },
  { id: "nexus01", name: "NEXUS01", ip: "192.168.0.20", role: "Management Server", os: "Windows Server 2022", status: "online",   cpu: 58, mem: 74, disk: 62, uptime: "12d 7h", site: "nexuslab.local" },
  { id: "sql01",   name: "SQL01",   ip: "192.168.0.30", role: "SQL Database",      os: "Windows Server 2019", status: "warning",  cpu: 87, mem: 82, disk: 78, uptime: "3d 14h",  site: "nexuslab.local" },
  { id: "web01",   name: "WEB01",   ip: "192.168.0.40", role: "IIS Web Server",    os: "Windows Server 2022", status: "online",   cpu: 22, mem: 45, disk: 33, uptime: "22d 1h",  site: "nexuslab.local" },
  { id: "fs01",    name: "FS01",    ip: "192.168.0.50", role: "File Server",       os: "Windows Server 2016", status: "critical", cpu: 96, mem: 91, disk: 95, uptime: "61d 9h",  site: "nexuslab.local" },
];

function rand(seed: number) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }

// --- Processes
export interface Process {
  pid: number; name: string; cpu: number; memMB: number; memPct: number;
  handles: number; threads: number; user: string; status: string;
  commandLine?: string; executablePath?: string;
  category?: "System" | "Service" | "Application" | "Database";
  priority?: "Realtime" | "High" | "AboveNormal" | "Normal" | "BelowNormal" | "Idle";
}

const BASE_MOCK_PROCESSES: Process[] = [
  { pid: 0, name: "System Idle Process", cpu: 42.5, memMB: 0.1, memPct: 0.0, handles: 0, threads: 16, user: "NT AUTHORITY\\SYSTEM", status: "Running", category: "System", priority: "Normal", executablePath: "N/A", commandLine: "N/A" },
  { pid: 4, name: "System", cpu: 1.2, memMB: 18.4, memPct: 0.1, handles: 4820, threads: 340, user: "NT AUTHORITY\\SYSTEM", status: "Running", category: "System", priority: "Normal", executablePath: "C:\\Windows\\System32\\ntoskrnl.exe", commandLine: "ntoskrnl.exe" },
  { pid: 712, name: "services.exe", cpu: 0.4, memMB: 28.5, memPct: 0.2, handles: 850, threads: 18, user: "NT AUTHORITY\\SYSTEM", status: "Running", category: "System", priority: "High", executablePath: "C:\\Windows\\System32\\services.exe", commandLine: "C:\\Windows\\System32\\services.exe" },
  { pid: 720, name: "lsass.exe", cpu: 2.8, memMB: 142.1, memPct: 0.9, handles: 1450, threads: 52, user: "NT AUTHORITY\\SYSTEM", status: "Running", category: "System", priority: "High", executablePath: "C:\\Windows\\System32\\lsass.exe", commandLine: "C:\\Windows\\System32\\lsass.exe" },
  { pid: 1024, name: "svchost.exe (netsvcs)", cpu: 3.5, memMB: 198.4, memPct: 1.2, handles: 2300, threads: 78, user: "NT AUTHORITY\\SYSTEM", status: "Running", category: "Service", priority: "Normal", executablePath: "C:\\Windows\\System32\\svchost.exe", commandLine: "C:\\Windows\\System32\\svchost.exe -k netsvcs -p" },
  { pid: 1108, name: "svchost.exe (DcomLaunch)", cpu: 0.9, memMB: 86.2, memPct: 0.5, handles: 920, threads: 32, user: "NT AUTHORITY\\SYSTEM", status: "Running", category: "Service", priority: "Normal", executablePath: "C:\\Windows\\System32\\svchost.exe", commandLine: "C:\\Windows\\System32\\svchost.exe -k DcomLaunch -p" },
  { pid: 1820, name: "dns.exe", cpu: 1.4, memMB: 92.0, memPct: 0.6, handles: 910, threads: 28, user: "NT AUTHORITY\\SYSTEM", status: "Running", category: "Service", priority: "AboveNormal", executablePath: "C:\\Windows\\System32\\dns.exe", commandLine: "C:\\Windows\\System32\\dns.exe" },
  { pid: 2104, name: "dfssvc.exe", cpu: 0.3, memMB: 64.5, memPct: 0.4, handles: 620, threads: 14, user: "NT AUTHORITY\\SYSTEM", status: "Running", category: "Service", priority: "Normal", executablePath: "C:\\Windows\\System32\\dfssvc.exe", commandLine: "C:\\Windows\\System32\\dfssvc.exe" },
  { pid: 3088, name: "MsMpEng.exe", cpu: 5.8, memMB: 284.0, memPct: 1.8, handles: 1850, threads: 46, user: "NT AUTHORITY\\SYSTEM", status: "Running", category: "Service", priority: "Normal", executablePath: "C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\MsMpEng.exe", commandLine: "MsMpEng.exe -service" },
  { pid: 3412, name: "sqlservr.exe", cpu: 18.4, memMB: 2480.0, memPct: 15.5, handles: 18900, threads: 148, user: "NT SERVICE\\MSSQLSERVER", status: "Running", category: "Database", priority: "High", executablePath: "C:\\Program Files\\Microsoft SQL Server\\MSSQL15.MSSQLSERVER\\MSSQL\\Binn\\sqlservr.exe", commandLine: "sqlservr.exe -sMSSQLSERVER" },
  { pid: 4892, name: "w3wp.exe (NexusAppPool)", cpu: 8.1, memMB: 420.5, memPct: 2.6, handles: 3400, threads: 64, user: "IIS APPPOOL\\NexusApp", status: "Running", category: "Application", priority: "Normal", executablePath: "C:\\Windows\\System32\\inetsrv\\w3wp.exe", commandLine: "C:\\Windows\\System32\\inetsrv\\w3wp.exe -ap \"NexusAppPool\" -v \"v4.0\" -l \"webengine4.dll\"" },
  { pid: 5120, name: "explorer.exe", cpu: 1.8, memMB: 168.0, memPct: 1.0, handles: 2150, threads: 44, user: "NEXUSLAB\\Administrator", status: "Running", category: "Application", priority: "Normal", executablePath: "C:\\Windows\\explorer.exe", commandLine: "C:\\Windows\\explorer.exe" },
  { pid: 7812, name: "powershell.exe", cpu: 12.6, memMB: 215.2, memPct: 1.3, handles: 1480, threads: 22, user: "NEXUSLAB\\Administrator", status: "Running", category: "Application", priority: "Normal", executablePath: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", commandLine: "powershell.exe -NoExit -ExecutionPolicy Bypass -File C:\\Scripts\\NexusWorker.ps1" },
  { pid: 8104, name: "taskmgr.exe", cpu: 1.1, memMB: 52.4, memPct: 0.3, handles: 780, threads: 16, user: "NEXUSLAB\\Administrator", status: "Running", category: "Application", priority: "High", executablePath: "C:\\Windows\\System32\\taskmgr.exe", commandLine: "C:\\Windows\\System32\\taskmgr.exe /v" },
  { pid: 9024, name: "Nexus.Gateway.exe", cpu: 4.8, memMB: 134.0, memPct: 0.8, handles: 980, threads: 38, user: "NT AUTHORITY\\SYSTEM", status: "Running", category: "Application", priority: "High", executablePath: "C:\\Program Files\\Nexus\\Gateway\\Nexus.Gateway.exe", commandLine: "Nexus.Gateway.exe --urls http://0.0.0.0:5010" }
];

export function getMockProcesses(_serverId: string): Process[] {
  return BASE_MOCK_PROCESSES.map((p) => {
    // Add realistic jitter on CPU and RAM
    const jitterCpu = Math.max(0, p.cpu + (Math.random() * 2 - 1) * (p.cpu > 5 ? 2.5 : 0.4));
    const jitterMem = Math.max(0.1, p.memMB + (Math.random() * 4 - 2));
    return {
      ...p,
      cpu: Number(jitterCpu.toFixed(1)),
      memMB: Number(jitterMem.toFixed(1)),
      memPct: Number((jitterMem / 160).toFixed(1)) // based on 16GB RAM pool
    };
  });
}

// --- Services
export interface Service {
  name: string; 
  displayName: string; 
  status: string;
  startupType: string;
  logOnAs: string; 
  description: string;
  processId?: number; 
  pathName?: string;
  acceptStop?: boolean; 
  acceptPause?: boolean;
  category?: "Core Infrastructure" | "Security" | "Networking" | "Database / App" | "Management";
  dependencies?: string[];
}

let MOCK_SERVICES_STORE: Record<string, Service[]> = {};

function initMockServicesStore(serverId: string): Service[] {
  return [
    {
      name: "DNS",
      displayName: "DNS Server",
      status: "Running",
      startupType: "Automatic",
      logOnAs: "NT AUTHORITY\\SYSTEM",
      description: "Answers DNS name resolution queries and enables domain network communication.",
      processId: 1820,
      pathName: "C:\\Windows\\System32\\dns.exe",
      acceptStop: true,
      acceptPause: false,
      category: "Networking",
      dependencies: ["Afd", "Tcpip"]
    },
    {
      name: "NTDS",
      displayName: "Active Directory Domain Services",
      status: "Running",
      startupType: "Automatic",
      logOnAs: "NT AUTHORITY\\SYSTEM",
      description: "Provides directory service database storage, security authentication, and centralized management.",
      processId: 840,
      pathName: "C:\\Windows\\System32\\ntdsai.dll",
      acceptStop: false,
      acceptPause: false,
      category: "Core Infrastructure",
      dependencies: ["Kprobes", "Tcpip", "RPCSS"]
    },
    {
      name: "W32Time",
      displayName: "Windows Time",
      status: "Running",
      startupType: "Automatic",
      logOnAs: "NT AUTHORITY\\LocalService",
      description: "Maintains date and time synchronization on all clients and servers in the network.",
      processId: 1420,
      pathName: "C:\\Windows\\System32\\svchost.exe -k LocalService",
      acceptStop: true,
      acceptPause: false,
      category: "Core Infrastructure",
      dependencies: []
    },
    {
      name: "MSSQLSERVER",
      displayName: "SQL Server (MSSQLSERVER)",
      status: "Running",
      startupType: "Automatic",
      logOnAs: "NT SERVICE\\MSSQLSERVER",
      description: "Provides relational storage, transactional processing, and database engine services.",
      processId: 3412,
      pathName: "C:\\Program Files\\Microsoft SQL Server\\MSSQL15.MSSQLSERVER\\MSSQL\\Binn\\sqlservr.exe",
      acceptStop: true,
      acceptPause: true,
      category: "Database / App",
      dependencies: ["RPCSS"]
    },
    {
      name: "W3SVC",
      displayName: "World Wide Web Publishing Service",
      status: "Running",
      startupType: "Automatic",
      logOnAs: "NT AUTHORITY\\LocalSystem",
      description: "Provides Web connectivity and administration through Internet Information Services (IIS).",
      processId: 4892,
      pathName: "C:\\Windows\\System32\\svchost.exe -k iissvcs",
      acceptStop: true,
      acceptPause: true,
      category: "Database / App",
      dependencies: ["WAS", "HTTP"]
    },
    {
      name: "WinDefend",
      displayName: "Microsoft Defender Antivirus Service",
      status: "Running",
      startupType: "Automatic",
      logOnAs: "NT AUTHORITY\\SYSTEM",
      description: "Helps protect users from malware and security threats in real-time.",
      processId: 3088,
      pathName: "C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\MsMpEng.exe",
      acceptStop: false,
      acceptPause: false,
      category: "Security",
      dependencies: ["RpcSs"]
    },
    {
      name: "LanmanServer",
      displayName: "Server (SMB File Sharing)",
      status: "Running",
      startupType: "Automatic",
      logOnAs: "NT AUTHORITY\\SYSTEM",
      description: "Supports file, print, and named-pipe sharing over the network for this computer.",
      processId: 1024,
      pathName: "C:\\Windows\\System32\\svchost.exe -k netsvcs -p",
      acceptStop: true,
      acceptPause: true,
      category: "Networking",
      dependencies: ["SamSS", "Srv2"]
    },
    {
      name: "DHCPServer",
      displayName: "DHCP Server",
      status: "Running",
      startupType: "Automatic",
      logOnAs: "NT AUTHORITY\\NetworkService",
      description: "Allocates IP addresses and dynamically configures network settings for clients.",
      processId: 1640,
      pathName: "C:\\Windows\\System32\\dhcpsvc.dll",
      acceptStop: true,
      acceptPause: false,
      category: "Networking",
      dependencies: ["Tcpip", "Afd"]
    },
    {
      name: "TermService",
      displayName: "Remote Desktop Services",
      status: "Running",
      startupType: "Manual",
      logOnAs: "NT AUTHORITY\\NetworkService",
      description: "Allows users to connect interactively to a remote computer.",
      processId: 2180,
      pathName: "C:\\Windows\\System32\\svchost.exe -k termsvcs",
      acceptStop: true,
      acceptPause: false,
      category: "Management",
      dependencies: ["RPCSS"]
    },
    {
      name: "BITS",
      displayName: "Background Intelligent Transfer Service",
      status: "Stopped",
      startupType: "Manual",
      logOnAs: "NT AUTHORITY\\LocalSystem",
      description: "Transfers files in the background using idle network bandwidth.",
      pathName: "C:\\Windows\\System32\\svchost.exe -k netsvcs",
      acceptStop: true,
      acceptPause: false,
      category: "Management",
      dependencies: ["RpcSs"]
    },
    {
      name: "wuauserv",
      displayName: "Windows Update",
      status: "Stopped",
      startupType: "Manual",
      logOnAs: "NT AUTHORITY\\SYSTEM",
      description: "Enables the detection, download, and installation of updates for Windows and other applications.",
      pathName: "C:\\Windows\\System32\\svchost.exe -k netsvcs -p",
      acceptStop: true,
      acceptPause: false,
      category: "Management",
      dependencies: ["rpcss"]
    },
    {
      name: "Spooler",
      displayName: "Print Spooler",
      status: "Stopped",
      startupType: "Disabled",
      logOnAs: "NT AUTHORITY\\SYSTEM",
      description: "Loads files to memory for printing at a later time.",
      pathName: "C:\\Windows\\System32\\spoolsv.exe",
      acceptStop: true,
      acceptPause: false,
      category: "Core Infrastructure",
      dependencies: ["HTTP", "RPCSS"]
    },
    {
      name: "NexusGateway",
      displayName: "NEXUS Management Agent Service",
      status: "Running",
      startupType: "Automatic",
      logOnAs: "NT AUTHORITY\\SYSTEM",
      description: "NEXUS fleet telemetry collector, remote execution agent, and RPC heartbeat engine.",
      processId: 9024,
      pathName: "C:\\Program Files\\Nexus\\Gateway\\Nexus.Gateway.exe",
      acceptStop: true,
      acceptPause: true,
      category: "Management",
      dependencies: ["W32Time", "Tcpip"]
    },
    {
      name: "DFSR",
      displayName: "DFS Replication",
      status: "Running",
      startupType: "Automatic",
      logOnAs: "NT AUTHORITY\\SYSTEM",
      description: "Replicates files across multiple servers over local or wide area network connections.",
      processId: 2104,
      pathName: "C:\\Windows\\System32\\dfssvc.exe",
      acceptStop: true,
      acceptPause: false,
      category: "Core Infrastructure",
      dependencies: ["RPCSS"]
    },
    {
      name: "CertSvc",
      displayName: "Active Directory Certificate Services",
      status: "Stopped",
      startupType: "Manual",
      logOnAs: "NT AUTHORITY\\SYSTEM",
      description: "Issues and manages digital certificates used in PKI security systems.",
      pathName: "C:\\Windows\\System32\\certsrv.exe",
      acceptStop: true,
      acceptPause: false,
      category: "Security",
      dependencies: ["RPCSS"]
    }
  ];
}

export function getMockServices(serverId: string): Service[] {
  if (!MOCK_SERVICES_STORE[serverId]) {
    MOCK_SERVICES_STORE[serverId] = initMockServicesStore(serverId);
  }
  return MOCK_SERVICES_STORE[serverId];
}

export function controlMockService(serverId: string, name: string, action: string): boolean {
  const list = getMockServices(serverId);
  const svc = list.find(s => s.name.toLowerCase() === name.toLowerCase());
  if (!svc) return false;

  if (action === "start") {
    svc.status = "Running";
    svc.processId = svc.processId || Math.floor(1000 + Math.random() * 8000);
  } else if (action === "stop") {
    svc.status = "Stopped";
    svc.processId = undefined;
  } else if (action === "restart") {
    svc.status = "Running";
    svc.processId = Math.floor(1000 + Math.random() * 8000);
  } else if (action === "pause") {
    svc.status = "Paused";
  } else if (action === "resume") {
    svc.status = "Running";
  }
  return true;
}

export function setMockServiceStartupType(serverId: string, name: string, startupType: string): boolean {
  const list = getMockServices(serverId);
  const svc = list.find(s => s.name.toLowerCase() === name.toLowerCase());
  if (!svc) return false;
  svc.startupType = startupType;
  return true;
}

// --- Storage
export interface Disk { 
  id: string; 
  model: string; 
  sizeGB: number; 
  bus: string; 
  health: "Healthy" | "Warning" | "Failed"; 
  serialNumber?: string;
  mediaType?: "SSD" | "HDD" | "NVMe";
  partitionStyle?: "GPT" | "MBR";
  temperatureC?: number;
  partitions: { label: string; sizeGB: number; type: "System" | "Data" | "Recovery" | "Unallocated" }[]; 
}

export interface Volume { 
  letter: string; 
  label: string; 
  fs: "NTFS" | "ReFS" | "FAT32"; 
  sizeGB: number; 
  usedGB: number; 
  status: "Healthy" | "At Risk" | "Degraded"; 
  diskId: string; 
  bitLocker?: "Encrypted" | "Off" | "Encrypting";
  clusterSizeKB?: number;
  fragmentationPct?: number;
  deduplication?: boolean;
}

let MOCK_DISKS_STORE: Record<string, Disk[]> = {};
let MOCK_VOLUMES_STORE: Record<string, Volume[]> = {};

export function getMockDisks(serverId: string): Disk[] {
  if (!MOCK_DISKS_STORE[serverId]) {
    MOCK_DISKS_STORE[serverId] = [
      {
        id: "Disk 0",
        model: "Samsung SSD 980 PRO 1TB",
        sizeGB: 1024,
        bus: "NVMe",
        health: "Healthy",
        serialNumber: "S5GXNF0R109823X",
        mediaType: "NVMe",
        partitionStyle: "GPT",
        temperatureC: 38,
        partitions: [
          { label: "EFI System", sizeGB: 1, type: "System" },
          { label: "OSDisk (C:)", sizeGB: 950, type: "Data" },
          { label: "Recovery", sizeGB: 73, type: "Recovery" }
        ]
      },
      {
        id: "Disk 1",
        model: "Dell PERC H740P SAS RAID 10",
        sizeGB: 4096,
        bus: "SAS",
        health: "Healthy",
        serialNumber: "PERC-H740P-VOL-01",
        mediaType: "SSD",
        partitionStyle: "GPT",
        temperatureC: 32,
        partitions: [
          { label: "DataVol (D:)", sizeGB: 2048, type: "Data" },
          { label: "SQLData (E:)", sizeGB: 1500, type: "Data" },
          { label: "Unallocated", sizeGB: 548, type: "Unallocated" }
        ]
      },
      {
        id: "Disk 2",
        model: "Seagate Enterprise ST8000NM000A 8TB",
        sizeGB: 8192,
        bus: "iSCSI",
        health: "Warning",
        serialNumber: "WAD91823-ISCSI-8T",
        mediaType: "HDD",
        partitionStyle: "GPT",
        temperatureC: 44,
        partitions: [
          { label: "BackupStore (F:)", sizeGB: 8192, type: "Data" }
        ]
      }
    ];
  }
  return MOCK_DISKS_STORE[serverId];
}

export function getMockVolumes(serverId: string): Volume[] {
  if (!MOCK_VOLUMES_STORE[serverId]) {
    MOCK_VOLUMES_STORE[serverId] = [
      {
        letter: "C",
        label: "OSDisk",
        fs: "NTFS",
        sizeGB: 950,
        usedGB: 412,
        status: "Healthy",
        diskId: "Disk 0",
        bitLocker: "Encrypted",
        clusterSizeKB: 4,
        fragmentationPct: 1.2,
        deduplication: false
      },
      {
        letter: "D",
        label: "DataVol",
        fs: "ReFS",
        sizeGB: 2048,
        usedGB: 1340,
        status: "Healthy",
        diskId: "Disk 1",
        bitLocker: "Encrypted",
        clusterSizeKB: 64,
        fragmentationPct: 0.8,
        deduplication: true
      },
      {
        letter: "E",
        label: "SQLData",
        fs: "NTFS",
        sizeGB: 1500,
        usedGB: 1120,
        status: "Healthy",
        diskId: "Disk 1",
        bitLocker: "Off",
        clusterSizeKB: 64,
        fragmentationPct: 3.4,
        deduplication: false
      },
      {
        letter: "F",
        label: "BackupStore",
        fs: "ReFS",
        sizeGB: 8192,
        usedGB: 6850,
        status: "At Risk",
        diskId: "Disk 2",
        bitLocker: "Off",
        clusterSizeKB: 64,
        fragmentationPct: 7.8,
        deduplication: true
      }
    ];
  }
  return MOCK_VOLUMES_STORE[serverId];
}

export function optimizeMockVolume(serverId: string, letter: string): boolean {
  const vols = getMockVolumes(serverId);
  const v = vols.find(x => x.letter.toUpperCase() === letter.toUpperCase());
  if (v) {
    v.fragmentationPct = 0.0;
    return true;
  }
  return false;
}

export function checkMockVolume(serverId: string, letter: string): boolean {
  const vols = getMockVolumes(serverId);
  const v = vols.find(x => x.letter.toUpperCase() === letter.toUpperCase());
  if (v) {
    v.status = "Healthy";
    return true;
  }
  return false;
}

export function changeMockVolumeLabel(serverId: string, letter: string, newLabel: string): boolean {
  const vols = getMockVolumes(serverId);
  const v = vols.find(x => x.letter.toUpperCase() === letter.toUpperCase());
  if (v) {
    v.label = newLabel;
    return true;
  }
  return false;
}

export function changeMockDriveLetter(serverId: string, oldLetter: string, newLetter: string): boolean {
  const vols = getMockVolumes(serverId);
  const v = vols.find(x => x.letter.toUpperCase() === oldLetter.toUpperCase());
  if (v) {
    v.letter = newLetter.toUpperCase();
    return true;
  }
  return false;
}

export function extendMockVolume(serverId: string, letter: string, addGB: number): boolean {
  const vols = getMockVolumes(serverId);
  const v = vols.find(x => x.letter.toUpperCase() === letter.toUpperCase());
  if (v) {
    v.sizeGB += addGB;
    return true;
  }
  return false;
}

export function formatMockVolume(serverId: string, letter: string, fs: "NTFS" | "ReFS" | "FAT32"): boolean {
  const vols = getMockVolumes(serverId);
  const v = vols.find(x => x.letter.toUpperCase() === letter.toUpperCase());
  if (v) {
    v.fs = fs;
    v.usedGB = Math.round(v.sizeGB * 0.02); // Reset usage to 2% system files
    v.status = "Healthy";
    v.fragmentationPct = 0;
    return true;
  }
  return false;
}


// --- Events
export type EventLevel = "Error" | "Warning" | "Information" | "Critical" | "Verbose";
export interface EventEntry { id: string; time: string; level: EventLevel; source: string; eventId: number; category: string; message: string; xml?: string; }
const SOURCES = ["Service Control Manager","Microsoft-Windows-Kernel-General","Microsoft-Windows-Security-Auditing","Microsoft-Windows-WinINet","Disk","NTFS","Schannel","DNS Server","TermService","Microsoft-Windows-Hyper-V-VMMS"];
const MSGS = [
  "The service entered the running state.",
  "Volume shadow copy created successfully.",
  "Failed login attempt from 10.4.21.88 — bad credentials.",
  "Disk read error detected on volume D:.",
  "Certificate chain validation failed for endpoint backup.nexuslab.local.",
  "DNS zone transferred from primary.",
  "Remote Desktop session initiated for NVLABS\\Administrator.",
  "Update KB5034441 installed successfully.",
  "VM 'BUILD-AGENT-04' state changed to Running.",
  "Memory pressure threshold exceeded — recommend investigation.",
];
export async function getEvents(serverId: string, log: "Application"|"System"|"Security" = "System", limit = 60): Promise<EventEntry[]> {
  await delay(200);
  const base = serverId.charCodeAt(0) + log.length;
  return Array.from({ length: limit }, (_, i) => {
    const r = rand(base + i);
    const level: EventLevel = r > 0.85 ? "Critical" : r > 0.7 ? "Error" : r > 0.5 ? "Warning" : r > 0.05 ? "Information" : "Verbose";
    const t = new Date(Date.now() - i * 1000 * 60 * (1 + rand(i) * 30));
    return {
      id: `${serverId}-${log}-${i}`,
      time: t.toISOString(),
      level,
      source: SOURCES[i % SOURCES.length],
      eventId: 1000 + Math.floor(r * 8000),
      category: log,
      message: MSGS[i % MSGS.length],
      xml: `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="${SOURCES[i%SOURCES.length]}"/><EventID>${1000+Math.floor(r*8000)}</EventID><Level>${level}</Level></System></Event>`,
    };
  });
}

// --- Firewall
export interface FirewallRule {
  id: string;
  name: string;
  enabled: boolean;
  profile: "Domain"|"Private"|"Public"|"All";
  protocol: "TCP"|"UDP"|"ICMP"|"Any";
  localPort: string;
  remoteIp: string;
  action: "Allow"|"Block";
  direction: "Inbound"|"Outbound";
  description?: string;
  program?: string;
  localIp?: string;
  remotePort?: string;
}

const mockFirewallStore: Record<string, FirewallRule[]> = {};

const FW_INITIAL_TEMPLATES = [
  { name: "Remote Desktop (RDP-In)", profile: "Domain", protocol: "TCP", localPort: "3389", remoteIp: "10.0.0.0/8", action: "Allow", direction: "Inbound", description: "Allows incoming RDP connections for remote administration", program: "%SystemRoot%\\system32\\svchost.exe" },
  { name: "File and Printer Sharing (NB-Session-In)", profile: "Domain", protocol: "TCP", localPort: "139", remoteIp: "192.168.0.0/16", action: "Allow", direction: "Inbound", description: "NetBIOS Session Service for file sharing" },
  { name: "File and Printer Sharing (SMB-In)", profile: "Domain", protocol: "TCP", localPort: "445", remoteIp: "192.168.0.0/16", action: "Allow", direction: "Inbound", description: "Direct SMB over TCP/IP for file & printer sharing" },
  { name: "Windows Remote Management (HTTP-In)", profile: "Domain", protocol: "TCP", localPort: "5985", remoteIp: "10.0.0.0/8", action: "Allow", direction: "Inbound", description: "WinRM HTTP port for PowerShell Remoting & WMI" },
  { name: "WinRM HTTPS (5986-In)", profile: "Domain", protocol: "TCP", localPort: "5986", remoteIp: "10.0.0.0/8", action: "Allow", direction: "Inbound", description: "Encrypted WinRM HTTPS service" },
  { name: "SQL Server Default Instance (TCP-In)", profile: "Domain", protocol: "TCP", localPort: "1433", remoteIp: "192.168.1.0/24", action: "Allow", direction: "Inbound", description: "Inbound connection to MSSQLSERVER database engine" },
  { name: "IIS World Wide Web Publishing (HTTP-In)", profile: "All", protocol: "TCP", localPort: "80", remoteIp: "Any", action: "Allow", direction: "Inbound", description: "Inbound web traffic for IIS web server" },
  { name: "IIS Secure Web Publishing (HTTPS-In)", profile: "All", protocol: "TCP", localPort: "443", remoteIp: "Any", action: "Allow", direction: "Inbound", description: "Encrypted SSL/TLS Web traffic" },
  { name: "DNS Query Service (UDP-In)", profile: "Domain", protocol: "UDP", localPort: "53", remoteIp: "Any", action: "Allow", direction: "Inbound", description: "Domain Name System resolution queries" },
  { name: "Block Legacy Inbound SMBv1", profile: "All", protocol: "TCP", localPort: "445", remoteIp: "Any", action: "Block", direction: "Inbound", description: "Security hardening: Blocks unencrypted legacy SMBv1 requests" },
  { name: "Block RDP Direct Internet Exposure", profile: "Public", protocol: "TCP", localPort: "3389", remoteIp: "0.0.0.0/0", action: "Block", direction: "Inbound", description: "Prevents direct RDP brute force attacks from public internet" },
  { name: "ICMPv4 Echo Request (Ping-In)", profile: "Domain", protocol: "ICMP", localPort: "Any", remoteIp: "10.0.0.0/8", action: "Allow", direction: "Inbound", description: "Allows network diagnostics & ICMP ping responses" },
  { name: "SharePoint Central Admin (9443-In)", profile: "Private", protocol: "TCP", localPort: "9443", remoteIp: "10.0.0.0/8", action: "Allow", direction: "Inbound", description: "SharePoint Central Administration HTTPS portal" },
  { name: "Block Outbound Tor / Crypto Mining", profile: "All", protocol: "TCP", localPort: "8333, 9001, 9050", remoteIp: "Any", action: "Block", direction: "Outbound", description: "Prevent unauthorized crypto mining and darknet relay egress" },
  { name: "Hyper-V Live Migration (TCP-In)", profile: "Domain", protocol: "TCP", localPort: "6600", remoteIp: "192.168.0.0/24", action: "Allow", direction: "Inbound", description: "Hyper-V virtual machine migration traffic" }
];

export async function getFirewallRules(serverId: string): Promise<FirewallRule[]> {
  await delay();
  if (!mockFirewallStore[serverId]) {
    const base = serverId.charCodeAt(0);
    mockFirewallStore[serverId] = FW_INITIAL_TEMPLATES.map((tmpl, i) => ({
      id: `${serverId}-fw-${i + 1}`,
      name: tmpl.name,
      enabled: i !== 9, // SMBv1 block is active
      profile: tmpl.profile as any,
      protocol: tmpl.protocol as any,
      localPort: tmpl.localPort,
      remoteIp: tmpl.remoteIp,
      action: tmpl.action as any,
      direction: tmpl.direction as any,
      description: tmpl.description,
      program: tmpl.program || ""
    }));
  }
  return [...mockFirewallStore[serverId]];
}

export async function toggleFirewallRule(serverId: string, ruleId: string, enabled: boolean): Promise<boolean> {
  await delay();
  const rules = mockFirewallStore[serverId] || (await getFirewallRules(serverId));
  const rule = rules.find((r) => r.id === ruleId);
  if (rule) {
    rule.enabled = enabled;
    return true;
  }
  return false;
}

export async function addMockFirewallRule(serverId: string, newRule: Omit<FirewallRule, "id">): Promise<FirewallRule> {
  await delay();
  const rules = mockFirewallStore[serverId] || (await getFirewallRules(serverId));
  const created: FirewallRule = {
    ...newRule,
    id: `${serverId}-fw-${Date.now()}`
  };
  rules.unshift(created);
  return created;
}

export async function deleteMockFirewallRule(serverId: string, ruleId: string): Promise<boolean> {
  await delay();
  const rules = mockFirewallStore[serverId] || (await getFirewallRules(serverId));
  const idx = rules.findIndex((r) => r.id === ruleId);
  if (idx !== -1) {
    rules.splice(idx, 1);
    return true;
  }
  return false;
}

export async function updateMockFirewallRule(serverId: string, ruleId: string, patch: Partial<FirewallRule>): Promise<boolean> {
  await delay();
  const rules = mockFirewallStore[serverId] || (await getFirewallRules(serverId));
  const idx = rules.findIndex((r) => r.id === ruleId);
  if (idx !== -1) {
    rules[idx] = { ...rules[idx], ...patch };
    return true;
  }
  return false;
}

// --- Users / Groups
export interface LocalUser {
  name: string;
  fullName: string;
  description: string;
  lastLogin: string;
  enabled: boolean;
  passwordNeverExpires: boolean;
  userCannotChangePassword?: boolean;
  accountLockedOut?: boolean;
  badPasswordCount?: number;
  passwordLastSet?: string;
  groups: string[];
  sid?: string;
  createdDate?: string;
}

export interface LocalGroup {
  name: string;
  description: string;
  members: string[];
  sid?: string;
  isSystemGroup?: boolean;
}

export const INITIAL_USERS_STORE: Record<string, LocalUser[]> = {
  dc01: [
    {
      name: "Administrator",
      fullName: "Built-in Administrator",
      description: "Built-in account for administering the computer/domain",
      lastLogin: "2026-07-26T04:12:00Z",
      enabled: true,
      passwordNeverExpires: true,
      userCannotChangePassword: false,
      accountLockedOut: false,
      badPasswordCount: 0,
      passwordLastSet: "2025-01-01",
      groups: ["Administrators", "Remote Management Users"],
      sid: "S-1-5-21-3623811015-3361044348-30300820-500",
      createdDate: "2022-01-01"
    },
    {
      name: "nexus-svc",
      fullName: "NEXUS Service Account",
      description: "Dedicated service account for NEXUS automated orchestration engine",
      lastLogin: "2026-07-26T05:00:00Z",
      enabled: true,
      passwordNeverExpires: true,
      userCannotChangePassword: true,
      accountLockedOut: false,
      badPasswordCount: 0,
      passwordLastSet: "2025-03-15",
      groups: ["Administrators", "Remote Management Users", "IIS_IUSRS"],
      sid: "S-1-5-21-3623811015-3361044348-30300820-1001",
      createdDate: "2023-04-10"
    },
    {
      name: "jdoe",
      fullName: "John Doe",
      description: "Senior Infrastructure & Systems Specialist",
      lastLogin: "2026-07-25T16:45:00Z",
      enabled: true,
      passwordNeverExpires: false,
      userCannotChangePassword: false,
      accountLockedOut: false,
      badPasswordCount: 0,
      passwordLastSet: "2026-05-10",
      groups: ["Administrators", "Remote Desktop Users"],
      sid: "S-1-5-21-3623811015-3361044348-30300820-1002",
      createdDate: "2024-02-01"
    },
    {
      name: "mwilson",
      fullName: "Mark Wilson",
      description: "Tier 2 Helpdesk Support Lead",
      lastLogin: "2026-07-24T11:20:00Z",
      enabled: true,
      passwordNeverExpires: false,
      userCannotChangePassword: false,
      accountLockedOut: false,
      badPasswordCount: 0,
      passwordLastSet: "2026-06-01",
      groups: ["Users", "Remote Desktop Users"],
      sid: "S-1-5-21-3623811015-3361044348-30300820-1003",
      createdDate: "2024-08-15"
    },
    {
      name: "backup-op",
      fullName: "Backup Operator",
      description: "Service account for automated backup tasks & volume snapshots",
      lastLogin: "2026-07-26T02:30:00Z",
      enabled: true,
      passwordNeverExpires: true,
      userCannotChangePassword: false,
      accountLockedOut: false,
      badPasswordCount: 0,
      passwordLastSet: "2025-06-01",
      groups: ["Backup Operators"],
      sid: "S-1-5-21-3623811015-3361044348-30300820-1004",
      createdDate: "2023-01-10"
    },
    {
      name: "sec-audit",
      fullName: "Security Auditor Agent",
      description: "Automated compliance scanner and vulnerability inspector",
      lastLogin: "2026-07-25T22:00:00Z",
      enabled: true,
      passwordNeverExpires: true,
      userCannotChangePassword: true,
      accountLockedOut: false,
      badPasswordCount: 0,
      passwordLastSet: "2025-09-20",
      groups: ["Performance Log Users", "Users"],
      sid: "S-1-5-21-3623811015-3361044348-30300820-1005",
      createdDate: "2025-02-14"
    },
    {
      name: "guest",
      fullName: "Built-in Guest Account",
      description: "Built-in account for guest access to the computer/domain",
      lastLogin: "—",
      enabled: false,
      passwordNeverExpires: false,
      userCannotChangePassword: true,
      accountLockedOut: false,
      badPasswordCount: 0,
      passwordLastSet: "2022-01-01",
      groups: ["Guests"],
      sid: "S-1-5-21-3623811015-3361044348-30300820-501",
      createdDate: "2022-01-01"
    },
    {
      name: "temp-vendor",
      fullName: "Contractor Vendor User",
      description: "External consultant account (Locked out due to invalid password attempts)",
      lastLogin: "2026-07-10T14:15:00Z",
      enabled: false,
      passwordNeverExpires: false,
      userCannotChangePassword: false,
      accountLockedOut: true,
      badPasswordCount: 5,
      passwordLastSet: "2026-01-15",
      groups: ["Users"],
      sid: "S-1-5-21-3623811015-3361044348-30300820-1006",
      createdDate: "2026-01-15"
    }
  ]
};

export const INITIAL_GROUPS_STORE: Record<string, LocalGroup[]> = {
  dc01: [
    {
      name: "Administrators",
      description: "Administrators have complete and unrestricted access to the computer/domain",
      members: ["Administrator", "nexus-svc", "jdoe", "NVLABS\\Domain Admins"],
      sid: "S-1-5-32-544",
      isSystemGroup: true
    },
    {
      name: "Remote Management Users",
      description: "Members of this group can access Windows Management Instrumentation (WMI) and PowerShell Remoting",
      members: ["Administrator", "nexus-svc"],
      sid: "S-1-5-32-580",
      isSystemGroup: true
    },
    {
      name: "Remote Desktop Users",
      description: "Members in this group are granted the right to log on remotely via Terminal Services / RDP",
      members: ["jdoe", "mwilson"],
      sid: "S-1-5-32-555",
      isSystemGroup: true
    },
    {
      name: "Backup Operators",
      description: "Backup Operators can back up and restore files on the computer regardless of permissions",
      members: ["backup-op"],
      sid: "S-1-5-32-551",
      isSystemGroup: true
    },
    {
      name: "Users",
      description: "Users are prevented from making accidental or intentional system-wide changes",
      members: ["mwilson", "sec-audit", "temp-vendor", "NVLABS\\Domain Users"],
      sid: "S-1-5-32-545",
      isSystemGroup: true
    },
    {
      name: "Guests",
      description: "Guests have the same access as members of the Users group by default, with more restrictions",
      members: ["guest"],
      sid: "S-1-5-32-546",
      isSystemGroup: true
    },
    {
      name: "Performance Log Users",
      description: "Members of this group may schedule logging of performance counters and system telemetry",
      members: ["sec-audit"],
      sid: "S-1-5-32-559",
      isSystemGroup: true
    },
    {
      name: "IIS_IUSRS",
      description: "Built-in group used by Internet Information Services (IIS)",
      members: ["nexus-svc", "NT AUTHORITY\\IUSR"],
      sid: "S-1-5-32-568",
      isSystemGroup: true
    }
  ]
};

export function getAllMockUsers(serverId: string): LocalUser[] {
  const key = `NEXUS_USERS_${serverId || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to read users from localStorage", e);
  }
  return [...(INITIAL_USERS_STORE[serverId || "dc01"] || INITIAL_USERS_STORE["dc01"])];
}

export function saveMockUsers(serverId: string, users: LocalUser[]): void {
  const key = `NEXUS_USERS_${serverId || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(users));
}

export function getAllMockGroups(serverId: string): LocalGroup[] {
  const key = `NEXUS_GROUPS_${serverId || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to read groups from localStorage", e);
  }
  return [...(INITIAL_GROUPS_STORE[serverId || "dc01"] || INITIAL_GROUPS_STORE["dc01"])];
}

export function saveMockGroups(serverId: string, groups: LocalGroup[]): void {
  const key = `NEXUS_GROUPS_${serverId || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(groups));
}

export async function getLocalUsers(serverId: string): Promise<LocalUser[]> {
  await delay(150);
  return getAllMockUsers(serverId);
}

export async function getLocalGroups(serverId: string): Promise<LocalGroup[]> {
  await delay(150);
  return getAllMockGroups(serverId);
}

export function toggleMockUserStatus(serverId: string, username: string, enabled: boolean): boolean {
  const users = getAllMockUsers(serverId);
  const idx = users.findIndex(u => u.name.toLowerCase() === username.toLowerCase());
  if (idx !== -1) {
    users[idx].enabled = enabled;
    saveMockUsers(serverId, users);
    return true;
  }
  return false;
}

export function toggleMockUserLockout(serverId: string, username: string, locked: boolean): boolean {
  const users = getAllMockUsers(serverId);
  const idx = users.findIndex(u => u.name.toLowerCase() === username.toLowerCase());
  if (idx !== -1) {
    users[idx].accountLockedOut = locked;
    if (!locked) users[idx].badPasswordCount = 0;
    saveMockUsers(serverId, users);
    return true;
  }
  return false;
}

export function resetMockUserPassword(
  serverId: string, 
  username: string, 
  opts: { password?: string; passwordNeverExpires?: boolean; userCannotChangePassword?: boolean }
): boolean {
  const users = getAllMockUsers(serverId);
  const idx = users.findIndex(u => u.name.toLowerCase() === username.toLowerCase());
  if (idx !== -1) {
    if (opts.passwordNeverExpires !== undefined) users[idx].passwordNeverExpires = opts.passwordNeverExpires;
    if (opts.userCannotChangePassword !== undefined) users[idx].userCannotChangePassword = opts.userCannotChangePassword;
    users[idx].passwordLastSet = new Date().toISOString().split("T")[0];
    saveMockUsers(serverId, users);
    return true;
  }
  return false;
}

export function updateMockUserGroups(serverId: string, username: string, newGroups: string[]): boolean {
  const users = getAllMockUsers(serverId);
  const idx = users.findIndex(u => u.name.toLowerCase() === username.toLowerCase());
  if (idx === -1) return false;

  const oldGroups = users[idx].groups || [];
  users[idx].groups = newGroups;
  saveMockUsers(serverId, users);

  // Sync groups membership list
  const groups = getAllMockGroups(serverId);
  groups.forEach(g => {
    const isMemberNow = newGroups.includes(g.name);
    const wasMember = oldGroups.includes(g.name);
    if (isMemberNow && !g.members.includes(username)) {
      g.members.push(username);
    } else if (!isMemberNow && g.members.includes(username)) {
      g.members = g.members.filter(m => m !== username);
    }
  });
  saveMockGroups(serverId, groups);

  return true;
}

export function createMockUser(serverId: string, user: Partial<LocalUser>): boolean {
  const users = getAllMockUsers(serverId);
  if (users.some(u => u.name.toLowerCase() === (user.name || "").toLowerCase())) return false;

  const created: LocalUser = {
    name: user.name || "newuser",
    fullName: user.fullName || user.name || "New User",
    description: user.description || "Local user account",
    lastLogin: "—",
    enabled: user.enabled ?? true,
    passwordNeverExpires: user.passwordNeverExpires ?? false,
    userCannotChangePassword: user.userCannotChangePassword ?? false,
    accountLockedOut: false,
    badPasswordCount: 0,
    passwordLastSet: new Date().toISOString().split("T")[0],
    groups: user.groups && user.groups.length > 0 ? user.groups : ["Users"],
    sid: `S-1-5-21-3623811015-3361044348-30300820-${Math.floor(1000 + Math.random() * 8000)}`,
    createdDate: new Date().toISOString().split("T")[0]
  };

  users.unshift(created);
  saveMockUsers(serverId, users);

  // Sync into group membership lists
  const groups = getAllMockGroups(serverId);
  created.groups.forEach(gName => {
    const grp = groups.find(g => g.name === gName);
    if (grp && !grp.members.includes(created.name)) {
      grp.members.push(created.name);
    }
  });
  saveMockGroups(serverId, groups);

  return true;
}

export function deleteMockUser(serverId: string, username: string): boolean {
  const users = getAllMockUsers(serverId);
  const idx = users.findIndex(u => u.name.toLowerCase() === username.toLowerCase());
  if (idx !== -1) {
    users.splice(idx, 1);
    saveMockUsers(serverId, users);

    // Remove from all group membership lists
    const groups = getAllMockGroups(serverId);
    groups.forEach(g => {
      g.members = g.members.filter(m => m.toLowerCase() !== username.toLowerCase());
    });
    saveMockGroups(serverId, groups);
    return true;
  }
  return false;
}

export function createMockGroup(serverId: string, group: LocalGroup): boolean {
  const groups = getAllMockGroups(serverId);
  if (groups.some(g => g.name.toLowerCase() === group.name.toLowerCase())) return false;

  const created: LocalGroup = {
    name: group.name,
    description: group.description || "Custom security group",
    members: group.members || [],
    sid: `S-1-5-32-${Math.floor(600 + Math.random() * 300)}`,
    isSystemGroup: false
  };

  groups.push(created);
  saveMockGroups(serverId, groups);
  return true;
}

export function deleteMockGroup(serverId: string, groupName: string): boolean {
  const groups = getAllMockGroups(serverId);
  const idx = groups.findIndex(g => g.name.toLowerCase() === groupName.toLowerCase());
  if (idx !== -1) {
    if (groups[idx].isSystemGroup) return false; // Prevent deleting built-in system groups
    groups.splice(idx, 1);
    saveMockGroups(serverId, groups);

    // Remove group reference from users
    const users = getAllMockUsers(serverId);
    users.forEach(u => {
      u.groups = u.groups.filter(g => g.toLowerCase() !== groupName.toLowerCase());
    });
    saveMockUsers(serverId, users);

    return true;
  }
  return false;
}

export function updateMockGroupMembers(serverId: string, groupName: string, members: string[]): boolean {
  const groups = getAllMockGroups(serverId);
  const grp = groups.find(g => g.name.toLowerCase() === groupName.toLowerCase());
  if (!grp) return false;

  grp.members = members;
  saveMockGroups(serverId, groups);

  // Sync user object group lists
  const users = getAllMockUsers(serverId);
  users.forEach(u => {
    const isMember = members.includes(u.name);
    const hasGroup = u.groups.includes(grp.name);
    if (isMember && !hasGroup) u.groups.push(grp.name);
    else if (!isMember && hasGroup) u.groups = u.groups.filter(g => g !== grp.name);
  });
  saveMockUsers(serverId, users);

  return true;
}


// --- Security Center Data Engine
export interface OpenPort {
  localPort: number;
  protocol: string;
  processName: string;
  state: string;
  pid?: number;
}

export interface LocalAdmin {
  name: string;
  principalSource: string;
  expected: boolean;
}

export interface SecurityEvent {
  id: string;
  eventId: number;
  level: "Critical" | "Error" | "Warning" | "Information";
  timeCreated: string;
  message: string;
  status?: "Unreviewed" | "Reviewed" | "Resolved";
  source?: string;
  user?: string;
}

export interface SecurityComplianceCheck {
  id: string;
  title: string;
  category: "Identity" | "Network" | "Endpoint" | "Encryption" | "Auditing";
  description: string;
  passed: boolean;
  severity: "Critical" | "High" | "Medium" | "Low";
  recommendation: string;
  remediable: boolean;
}

export interface SecurityData {
  events: SecurityEvent[];
  openPorts: OpenPort[];
  localAdmins: LocalAdmin[];
  complianceChecks: SecurityComplianceCheck[];
  failedLogins24h: number;
  lastUpdated: string;
  activeThreatsCount: number;
  firewallProfilesActive: number;
}

export const INITIAL_SECURITY_STORE: Record<string, SecurityData> = {
  dc01: {
    lastUpdated: new Date().toISOString(),
    failedLogins24h: 14,
    activeThreatsCount: 0,
    firewallProfilesActive: 3,
    openPorts: [
      { localPort: 53, protocol: "UDP", processName: "dns.exe", state: "Listening", pid: 1420 },
      { localPort: 88, protocol: "TCP", processName: "lsass.exe", state: "Listening", pid: 684 },
      { localPort: 389, protocol: "TCP", processName: "lsass.exe", state: "Listening", pid: 684 },
      { localPort: 445, protocol: "TCP", processName: "System", state: "Listening", pid: 4 },
      { localPort: 5985, protocol: "TCP", processName: "System", state: "Listening", pid: 4 },
      { localPort: 5986, protocol: "TCP", processName: "System", state: "Listening", pid: 4 },
      { localPort: 3389, protocol: "TCP", processName: "termctr.exe", state: "Established", pid: 2104 },
      { localPort: 8080, protocol: "TCP", processName: "nexus-agent.exe", state: "Listening", pid: 3120 }
    ],
    localAdmins: [
      { name: "Administrator", principalSource: "Local Account", expected: true },
      { name: "nexus-svc", principalSource: "Service Account", expected: true },
      { name: "jdoe", principalSource: "Active Directory User", expected: true },
      { name: "temp-vendor", principalSource: "Local Account", expected: false }
    ],
    complianceChecks: [
      {
        id: "CIS-1.1",
        title: "Credential Guard (LSA Isolation)",
        category: "Identity",
        description: "Isolated User Mode and virtualization-based protection for LSA credentials",
        passed: true,
        severity: "Critical",
        recommendation: "Ensure Virtualization-Based Security (VBS) is enabled in group policy.",
        remediable: true
      },
      {
        id: "CIS-2.3",
        title: "Remote Desktop Network Level Authentication (NLA)",
        category: "Network",
        description: "Requires NLA authentication prior to establishing RDP session handshake",
        passed: true,
        severity: "High",
        recommendation: "Enable NLA on Terminal Services server settings.",
        remediable: true
      },
      {
        id: "CIS-3.1",
        title: "Legacy SMBv1 Protocol Disabled",
        category: "Network",
        description: "SMBv1 is vulnerable to WannaCry ransomware and relay exploits",
        passed: true,
        severity: "Critical",
        recommendation: "Disable SMBv1 feature via PowerShell command.",
        remediable: true
      },
      {
        id: "CIS-4.2",
        title: "PowerShell Script Block Logging",
        category: "Auditing",
        description: "Captures full code content executed by PowerShell scripts into Event Log 4104",
        passed: false,
        severity: "Medium",
        recommendation: "Enable ScriptBlockLogging in Administrative Templates > Windows Components > Windows PowerShell.",
        remediable: true
      },
      {
        id: "CIS-5.0",
        title: "NTLMv1 Authentication Disabled",
        category: "Identity",
        description: "NTLMv1 uses weak DES encryption easily crackable in minutes",
        passed: false,
        severity: "High",
        recommendation: "Configure Network Security: Restrict NTLM: Incoming NTLM traffic to 'Deny all accounts'.",
        remediable: true
      },
      {
        id: "CIS-6.4",
        title: "BitLocker Operating System Drive Encryption",
        category: "Encryption",
        description: "XTS-AES 256-bit encryption protecting offline data access and cold-boot attacks",
        passed: true,
        severity: "Critical",
        recommendation: "Enable BitLocker on system volume C:.",
        remediable: false
      }
    ],
    events: [
      {
        id: "evt-101",
        eventId: 4625,
        level: "Warning",
        timeCreated: "2026-07-26T05:14:00Z",
        message: "An account failed to log on. Account: temp-vendor. Workstation: DEV-WKS-09. Reason: Unknown user name or bad password.",
        status: "Unreviewed",
        source: "Microsoft-Windows-Security-Auditing",
        user: "temp-vendor"
      },
      {
        id: "evt-102",
        eventId: 4672,
        level: "Information",
        timeCreated: "2026-07-26T05:00:00Z",
        message: "Special privileges assigned to new logon. Account: Administrator. PrivilegeList: SeDebugPrivilege, SeTcbPrivilege.",
        status: "Reviewed",
        source: "Microsoft-Windows-Security-Auditing",
        user: "Administrator"
      },
      {
        id: "evt-103",
        eventId: 4740,
        level: "Error",
        timeCreated: "2026-07-26T04:45:00Z",
        message: "A user account was locked out. Account: temp-vendor. Caller Computer Name: BFG-GATEWAY-02.",
        status: "Unreviewed",
        source: "Microsoft-Windows-Security-Auditing",
        user: "temp-vendor"
      },
      {
        id: "evt-104",
        eventId: 1102,
        level: "Critical",
        timeCreated: "2026-07-25T23:10:00Z",
        message: "The audit log was cleared by user: nexus-svc (Routine log rotation task).",
        status: "Resolved",
        source: "Microsoft-Windows-Eventlog",
        user: "nexus-svc"
      },
      {
        id: "evt-105",
        eventId: 4688,
        level: "Information",
        timeCreated: "2026-07-26T03:30:00Z",
        message: "A new process was created. New Process Name: C:\\Program Files\\NEXUS\\nexus-agent.exe.",
        status: "Reviewed",
        source: "Microsoft-Windows-Security-Auditing",
        user: "SYSTEM"
      }
    ]
  }
};

export function getMockSecurityData(serverId: string): SecurityData {
  const key = `NEXUS_SECURITY_${serverId || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.events)) return parsed;
    }
  } catch (e) {
    console.error("Failed to read security data from localStorage", e);
  }
  return { ...(INITIAL_SECURITY_STORE[serverId || "dc01"] || INITIAL_SECURITY_STORE["dc01"]) };
}

export function saveMockSecurityData(serverId: string, data: SecurityData): void {
  const key = `NEXUS_SECURITY_${serverId || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(data));
}

export function updateMockSecurityCompliance(serverId: string, checkId: string, passed: boolean): boolean {
  const secData = getMockSecurityData(serverId);
  const check = secData.complianceChecks.find(c => c.id === checkId);
  if (check) {
    check.passed = passed;
    secData.lastUpdated = new Date().toISOString();
    saveMockSecurityData(serverId, secData);
    return true;
  }
  return false;
}

export function updateMockSecurityEventStatus(serverId: string, eventId: string, status: "Reviewed" | "Resolved"): boolean {
  const secData = getMockSecurityData(serverId);
  const evt = secData.events.find(e => e.id === eventId || String(e.eventId) === eventId);
  if (evt) {
    evt.status = status;
    secData.lastUpdated = new Date().toISOString();
    saveMockSecurityData(serverId, secData);
    return true;
  }
  return false;
}

export function toggleMockLocalAdminExpected(serverId: string, adminName: string, expected: boolean): boolean {
  const secData = getMockSecurityData(serverId);
  const admin = secData.localAdmins.find(a => a.name.toLowerCase() === adminName.toLowerCase());
  if (admin) {
    admin.expected = expected;
    secData.lastUpdated = new Date().toISOString();
    saveMockSecurityData(serverId, secData);
    return true;
  }
  return false;
}


// --- Performance history
export interface PerfSample { t: number; cpu: number; mem: number; diskR: number; diskW: number; netIn: number; netOut: number; }

// --- Updates
export interface Update { id: string; kb: string; title: string; classification: string; sizeMB: number; severity: "Critical"|"Important"|"Optional"; status: "Pending"|"Installed"|"Failed"; }

// --- Tasks
export interface TaskExecutionLog {
  timestamp: string;
  event: string;
  code: number;
  details: string;
}

export interface ScheduledTask {
  name: string;
  path: string;
  status: "Ready" | "Running" | "Disabled" | "Failed";
  lastRun: string;
  lastResult: string;
  nextRun: string;
  triggers: string[];
  author?: string;
  description?: string;
  action?: string;
  runAsUser?: string;
  runWithHighestPrivileges?: boolean;
  hidden?: boolean;
  history?: TaskExecutionLog[];
}

const MOCK_TASKS_BY_SERVER: Record<string, ScheduledTask[]> = {
  dc01: [
    {
      name: "NexusWorker",
      path: "\\NEXUS\\Maintenance",
      status: "Ready",
      lastRun: "2026-07-26 03:30:00",
      lastResult: "0x0 (Operation completed successfully)",
      nextRun: "2026-07-26 04:30:00",
      triggers: ["At 03:30 AM every day", "On system startup"],
      author: "NEXUSLAB\\Administrator",
      description: "Executes background telemetric collection and syncs system state with NEXUS Gateway.",
      action: "powershell.exe -ExecutionPolicy Bypass -File C:\\Scripts\\NexusWorker.ps1",
      runAsUser: "NT AUTHORITY\\SYSTEM",
      runWithHighestPrivileges: true,
      hidden: false,
      history: [
        { timestamp: "2026-07-26 03:30:00", event: "Task Completed", code: 102, details: "Task completed successfully with exit code 0." },
        { timestamp: "2026-07-26 03:30:00", event: "Action Started", code: 200, details: "Executed action 'powershell.exe' (PID 9120)." },
        { timestamp: "2026-07-26 03:30:00", event: "Task Started", code: 100, details: "Task triggered by schedule at 03:30 AM." },
        { timestamp: "2026-07-25 03:30:00", event: "Task Completed", code: 102, details: "Task completed successfully with exit code 0." }
      ]
    },
    {
      name: "HealthCheck",
      path: "\\NEXUS\\Maintenance",
      status: "Ready",
      lastRun: "2026-07-26 04:00:00",
      lastResult: "0x0 (Operation completed successfully)",
      nextRun: "2026-07-26 04:15:00",
      triggers: ["Repeat every 15 minutes indefinitely"],
      author: "NEXUSLAB\\Administrator",
      description: "Performs CPU, memory, and disk health metrics verification.",
      action: "powershell.exe -File C:\\Scripts\\HealthCheck.ps1",
      runAsUser: "NT AUTHORITY\\SYSTEM",
      runWithHighestPrivileges: true,
      hidden: false,
      history: [
        { timestamp: "2026-07-26 04:00:00", event: "Task Completed", code: 102, details: "Completed in 1.2s." },
        { timestamp: "2026-07-26 03:45:00", event: "Task Completed", code: 102, details: "Completed in 1.1s." }
      ]
    },
    {
      name: "RotateLogs",
      path: "\\NEXUS\\Maintenance",
      status: "Ready",
      lastRun: "2026-07-26 00:00:00",
      lastResult: "0x0 (Operation completed successfully)",
      nextRun: "2026-07-27 00:00:00",
      triggers: ["Daily at 12:00 AM"],
      author: "NEXUSLAB\\Administrator",
      description: "Archives old log files in C:\\Logs to zip format and purges entries older than 30 days.",
      action: "powershell.exe -File C:\\Scripts\\RotateLogs.ps1",
      runAsUser: "NT AUTHORITY\\SYSTEM",
      runWithHighestPrivileges: true,
      hidden: false,
      history: [
        { timestamp: "2026-07-26 00:00:05", event: "Task Completed", code: 102, details: "Archived 14 log files." }
      ]
    },
    {
      name: "DailyBackup",
      path: "\\NEXUS\\Backups",
      status: "Ready",
      lastRun: "2026-07-26 02:30:00",
      lastResult: "0x0 (Operation completed successfully)",
      nextRun: "2026-07-27 02:30:00",
      triggers: ["Daily at 02:30 AM"],
      author: "NEXUSLAB\\BackupAdmin",
      description: "Replicates active database dumps to remote network share \\\\FS01\\Backups.",
      action: "robocopy.exe D:\\SQLData \\\\FS01\\\\Backups /MIR /LOG:C:\\Logs\\backup_job.log",
      runAsUser: "NEXUSLAB\\BackupAdmin",
      runWithHighestPrivileges: true,
      hidden: false,
      history: [
        { timestamp: "2026-07-26 02:30:00", event: "Task Completed", code: 102, details: "Synced 4.8 GB data to FS01." }
      ]
    },
    {
      name: "AD_Group_Sync",
      path: "\\NEXUS\\ActiveDirectory",
      status: "Ready",
      lastRun: "2026-07-26 02:00:00",
      lastResult: "0x0 (Operation completed successfully)",
      nextRun: "2026-07-26 06:00:00",
      triggers: ["Every 4 hours"],
      author: "NEXUSLAB\\Administrator",
      description: "Reconciles Active Directory domain security groups and nested membership rules.",
      action: "powershell.exe -Command \"Import-Module ActiveDirectory; Sync-ADGroupMembership\"",
      runAsUser: "NT AUTHORITY\\SYSTEM",
      runWithHighestPrivileges: true,
      hidden: false,
      history: [
        { timestamp: "2026-07-26 02:00:00", event: "Task Completed", code: 102, details: "Processed 128 groups." }
      ]
    },
    {
      name: "CertExpiryMonitor",
      path: "\\NEXUS\\Security",
      status: "Failed",
      lastRun: "2026-07-25 18:00:00",
      lastResult: "0x80070002 (The system cannot find the file specified)",
      nextRun: "2026-07-26 18:00:00",
      triggers: ["Daily at 06:00 PM"],
      author: "NEXUSLAB\\SecAdmin",
      description: "Checks local certificate store for certificates expiring within 30 days and sends alert email.",
      action: "powershell.exe -File C:\\Scripts\\CheckCertExpirations.ps1",
      runAsUser: "NT AUTHORITY\\SYSTEM",
      runWithHighestPrivileges: true,
      hidden: false,
      history: [
        { timestamp: "2026-07-25 18:00:02", event: "Action Failed", code: 201, details: "The system cannot find file C:\\Scripts\\CheckCertExpirations.ps1" }
      ]
    },
    {
      name: "ScheduledDefrag",
      path: "\\Microsoft\\Windows\\Defrag",
      status: "Ready",
      lastRun: "2026-07-20 01:15:00",
      lastResult: "0x0 (Operation completed successfully)",
      nextRun: "2026-07-27 01:15:00",
      triggers: ["At 01:15 AM every Wednesday"],
      author: "Microsoft Corporation",
      description: "Optimizes storage drive sectors and performs trim operations on SSD volumes.",
      action: "%windir%\\system32\\defrag.exe -c -h -o -$",
      runAsUser: "NT AUTHORITY\\SYSTEM",
      runWithHighestPrivileges: true,
      hidden: true,
      history: [
        { timestamp: "2026-07-20 01:15:00", event: "Task Completed", code: 102, details: "Drive trim completed on C:" }
      ]
    },
    {
      name: "ReportPolicies",
      path: "\\Microsoft\\Windows\\UpdateOrchestrator",
      status: "Disabled",
      lastRun: "2026-07-15 12:00:00",
      lastResult: "0x0 (Operation completed successfully)",
      nextRun: "Disabled",
      triggers: ["On event log ID 1001"],
      author: "Microsoft Corporation",
      description: "Reports Windows Update compliance policies to domain WSUS infrastructure.",
      action: "%windir%\\system32\\usoclient.exe ReportPolicies",
      runAsUser: "NT AUTHORITY\\SYSTEM",
      runWithHighestPrivileges: false,
      hidden: true,
      history: []
    }
  ]
};

export function getMockTasks(server: string): ScheduledTask[] {
  if (!MOCK_TASKS_BY_SERVER[server]) {
    // Clone dc01 tasks for other servers with customized paths
    MOCK_TASKS_BY_SERVER[server] = MOCK_TASKS_BY_SERVER.dc01.map(t => ({
      ...t,
      history: t.history ? [...t.history] : []
    }));
  }
  return MOCK_TASKS_BY_SERVER[server];
}

export function runMockTask(server: string, taskPath: string): boolean {
  const list = getMockTasks(server);
  const norm = taskPath.replace(/[\/\\]+/g, "\\");
  const task = list.find(t => {
    const fullP = (t.path.endsWith("\\") ? t.path + t.name : t.path + "\\" + t.name).replace(/[\/\\]+/g, "\\");
    return fullP === norm || t.name === taskPath;
  });

  if (!task) return false;

  task.status = "Running";
  setTimeout(() => {
    task.status = "Ready";
    task.lastRun = new Date().toISOString().slice(0, 19).replace("T", " ");
    task.lastResult = "0x0 (Operation completed successfully)";
    if (!task.history) task.history = [];
    task.history.unshift({
      timestamp: task.lastRun,
      event: "Task Completed",
      code: 102,
      details: "Manual trigger executed successfully by NEXUS Administrator."
    });
  }, 1200);

  return true;
}

export function toggleMockTask(server: string, taskPath: string, enable: boolean): boolean {
  const list = getMockTasks(server);
  const norm = taskPath.replace(/[\/\\]+/g, "\\");
  const task = list.find(t => {
    const fullP = (t.path.endsWith("\\") ? t.path + t.name : t.path + "\\" + t.name).replace(/[\/\\]+/g, "\\");
    return fullP === norm || t.name === taskPath;
  });

  if (!task) return false;
  task.status = enable ? "Ready" : "Disabled";
  if (!enable) task.nextRun = "Disabled";
  else task.nextRun = "Tomorrow at 02:00 AM";
  return true;
}

export function deleteMockTask(server: string, taskPath: string): boolean {
  const list = getMockTasks(server);
  const norm = taskPath.replace(/[\/\\]+/g, "\\");
  const idx = list.findIndex(t => {
    const fullP = (t.path.endsWith("\\") ? t.path + t.name : t.path + "\\" + t.name).replace(/[\/\\]+/g, "\\");
    return fullP === norm || t.name === taskPath;
  });

  if (idx === -1) return false;
  list.splice(idx, 1);
  return true;
}

export function createMockTask(server: string, newTask: ScheduledTask): boolean {
  const list = getMockTasks(server);
  const existing = list.find(t => t.name === newTask.name && t.path === newTask.path);
  if (existing) return false;

  list.push({
    ...newTask,
    status: newTask.status || "Ready",
    lastRun: "Never",
    lastResult: "0x0 (Ready)",
    nextRun: newTask.triggers[0] ? "Scheduled" : "Manual Only",
    history: [
      {
        timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
        event: "Task Created",
        code: 140,
        details: "Task registered in NEXUS Task Scheduler by " + (newTask.author || "Administrator")
      }
    ]
  });
  return true;
}

export function editMockTask(server: string, originalPath: string, updated: ScheduledTask): boolean {
  deleteMockTask(server, originalPath);
  return createMockTask(server, updated);
}

export function exportMockTaskXml(server: string, taskPath: string): string {
  const list = getMockTasks(server);
  const norm = taskPath.replace(/[\/\\]+/g, "\\");
  const task = list.find(t => {
    const fullP = (t.path.endsWith("\\") ? t.path + t.name : t.path + "\\" + t.name).replace(/[\/\\]+/g, "\\");
    return fullP === norm || t.name === taskPath;
  }) || list[0];

  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Date>${task.lastRun !== "Never" ? task.lastRun : "2026-07-26T00:00:00"}</Date>
    <Author>${task.author || "NEXUSLAB\\Administrator"}</Author>
    <Description>${task.description || "NEXUS Scheduled Task"}</Description>
    <URI>${task.path}\\${task.name}</URI>
  </RegistrationInfo>
  <Triggers>
    ${(task.triggers || []).map(tr => `<CalendarTrigger><StartBoundary>2026-07-26T00:00:00</StartBoundary><Enabled>true</Enabled><ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay></CalendarTrigger>`).join("\n    ")}
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>${task.runAsUser || "NT AUTHORITY\\SYSTEM"}</UserId>
      <RunLevel>${task.runWithHighestPrivileges ? "HighestAvailable" : "LeastPrivilege"}</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>true</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>${task.status !== "Disabled"}</Enabled>
    <Hidden>${task.hidden || false}</Hidden>
    <ExecutionTimeLimit>PT72H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${(task.action || "powershell.exe").split(" ")[0]}</Command>
      <Arguments>${(task.action || "").split(" ").slice(1).join(" ")}</Arguments>
    </Exec>
  </Actions>
</Task>`;
}


// --- Certificates
export interface Certificate {
  id: string;
  subject: string;
  issuer: string;
  from: string;
  to: string;
  thumbprint: string;
  purpose: string;
  store?: string;
  serialNumber?: string;
  sanList?: string[];
  signatureAlgorithm?: string;
  keyAlgorithm?: string;
  keySize?: number;
  isSelfSigned?: boolean;
  hasPrivateKey?: boolean;
  certPem?: string;
  friendlyName?: string;
}

export const INITIAL_CERTIFICATES_STORE: Record<string, Certificate[]> = {
  dc01: [
    {
      id: "cert-101",
      subject: "CN=dc01.nexuslab.local, O=NEXUS Enterprise, OU=Domain Controllers",
      issuer: "CN=NEXUS Root CA 2022, O=NEXUS Enterprise, C=US",
      from: "2025-01-12",
      to: "2027-01-12",
      thumbprint: "3A:B1:9C:F4:7D:11:88:CC:90:42:11:AB:91:7E:5F:6C:DE:88:01:22",
      purpose: "Server Authentication, KDC Authentication",
      store: "Personal",
      serialNumber: "7C:00:23:89:12:AA:BB:CC",
      sanList: ["dc01.nexuslab.local", "dc01", "ldap.nexuslab.local", "kerberos.nexuslab.local"],
      signatureAlgorithm: "SHA256withRSA",
      keyAlgorithm: "RSA",
      keySize: 2048,
      isSelfSigned: false,
      hasPrivateKey: true,
      friendlyName: "DC Active Directory Kerberos Cert",
      certPem: `-----BEGIN CERTIFICATE-----
MIIDezCCAmOgAwIBAgIUfAAIqLKj1234567890ANBgkqhkiG9w0BAQsFADBLMQsw
CQYDVQQGEwJVUzEZMBcGA1UECgwQTkVYVVMgRW50ZXJwcmlzZTEcMBoGA1UEAwwT
TkVYVVMgUm9vdCBDQSAyMDIyMB4XDTI1MDEwMTAwMDAwMFoXDTI3MDEwMTAwMDAw
MFowTDFDMEAGA1UEAww5ZGMwMS5uZXh1c2xhYi5sb2NhbDEZMBcGA1UECgwQTkVY
VVMgRW50ZXJwcmlzZTEUMBIGA1UECwwLRENzMIIBIjANBgkqhkiG9w0BAQEFAAOC
AQ8AMIIBCgKCAQEAuX9...
-----END CERTIFICATE-----`
    },
    {
      id: "cert-102",
      subject: "CN=*.nexuslab.local, O=NEXUS Enterprise, OU=Infrastructure",
      issuer: "CN=DigiCert Global G3 TLS RSA SHA256 2020 CA1, O=DigiCert Inc",
      from: "2025-08-01",
      to: "2026-08-01",
      thumbprint: "FF:01:7C:DE:88:91:42:11:AB:91:7E:5F:6C:3A:B1:9C:F4:7D:11:88",
      purpose: "Server Authentication, Client Authentication",
      store: "Personal",
      serialNumber: "0A:12:45:78:90:CD:EF:12",
      sanList: ["*.nexuslab.local", "nexuslab.local", "admin.nexuslab.local"],
      signatureAlgorithm: "SHA256withRSA",
      keyAlgorithm: "RSA",
      keySize: 4096,
      isSelfSigned: false,
      hasPrivateKey: true,
      friendlyName: "Wildcard Wildcard Domain TLS",
      certPem: `-----BEGIN CERTIFICATE-----
MIIFdTCCBF2gAwIBAgIQChKK811234567890ANBgkqhkiG9w0BAQsFADBoMQsw
CQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMS0wKwYDVQQDEyREaWdpQ2VydCBHbG9iYWwgRzMg...
-----END CERTIFICATE-----`
    },
    {
      id: "cert-103",
      subject: "CN=sql01.nexuslab.local, O=NEXUS Enterprise",
      issuer: "CN=NEXUS Intermediate CA 1, O=NEXUS Enterprise",
      from: "2024-02-14",
      to: "2026-08-10",
      thumbprint: "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD",
      purpose: "Server Authentication, SQL Data Encrypted Connection",
      store: "Personal",
      serialNumber: "34:56:78:90:AB:CD:EF:01",
      sanList: ["sql01.nexuslab.local", "sql01"],
      signatureAlgorithm: "SHA256withRSA",
      keyAlgorithm: "RSA",
      keySize: 2048,
      isSelfSigned: false,
      hasPrivateKey: true,
      friendlyName: "MSSQL Protocol Encryption Cert",
      certPem: `-----BEGIN CERTIFICATE-----
MIIDeTCCAmWgAwIBAgIQNL45811234567890ANBgkqhkiG9w0BAQsFADA4MRkw
...
-----END CERTIFICATE-----`
    },
    {
      id: "cert-104",
      subject: "CN=NEXUS Root CA 2022, O=NEXUS Enterprise, C=US",
      issuer: "CN=NEXUS Root CA 2022, O=NEXUS Enterprise, C=US",
      from: "2022-01-01",
      to: "2032-01-01",
      thumbprint: "11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44",
      purpose: "Root Certificate Authority, Cert Sign, CRL Sign",
      store: "Trusted Root CAs",
      serialNumber: "01",
      sanList: ["NEXUS Root CA"],
      signatureAlgorithm: "SHA384withRSA",
      keyAlgorithm: "RSA",
      keySize: 4096,
      isSelfSigned: true,
      hasPrivateKey: false,
      friendlyName: "NEXUS Enterprise Internal Trust Anchor",
      certPem: `-----BEGIN CERTIFICATE-----
MIIEczCCA12gAwIBAgIBATANBgkqhkiG9w0BAQsFADBLMQswCQYDVQQGEwJV...
-----END CERTIFICATE-----`
    },
    {
      id: "cert-105",
      subject: "CN=DigiCert Global Root G2, OU=www.digicert.com, O=DigiCert Inc, C=US",
      issuer: "CN=DigiCert Global Root G2, OU=www.digicert.com, O=DigiCert Inc, C=US",
      from: "2013-08-01",
      to: "2038-01-15",
      thumbprint: "43:48:A0:E9:E4:44:54:02:22:23:22:12:10:44:55:10:99:88:77:66",
      purpose: "Root CA, Web Server Authentication",
      store: "Trusted Root CAs",
      serialNumber: "03:39:B6:0E:D6:46:6D:77:00",
      sanList: [],
      signatureAlgorithm: "SHA256withRSA",
      keyAlgorithm: "RSA",
      keySize: 2048,
      isSelfSigned: true,
      hasPrivateKey: false,
      friendlyName: "DigiCert Public Trust Root G2"
    },
    {
      id: "cert-106",
      subject: "CN=NEXUS Intermediate CA 1, O=NEXUS Enterprise",
      issuer: "CN=NEXUS Root CA 2022, O=NEXUS Enterprise, C=US",
      from: "2022-03-01",
      to: "2028-03-01",
      thumbprint: "22:33:44:55:66:77:88:99:00:11:AA:BB:CC:DD:EE:FF:11:22:33:44",
      purpose: "Subordinate CA, Code Signing, Server Authentication",
      store: "Intermediate CAs",
      serialNumber: "02:A0:B1:C2",
      sanList: [],
      signatureAlgorithm: "SHA256withRSA",
      keyAlgorithm: "RSA",
      keySize: 2048,
      isSelfSigned: false,
      hasPrivateKey: false,
      friendlyName: "NEXUS Sub-CA 1"
    },
    {
      id: "cert-107",
      subject: "CN=legacy-vpn.nexuslab.local",
      issuer: "CN=NEXUS-CA",
      from: "2021-01-01",
      to: "2023-01-01",
      thumbprint: "DE:AD:BE:EF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF",
      purpose: "IPSec / VPN Authentication",
      store: "Personal",
      serialNumber: "99:88:77:66:55",
      sanList: ["vpn.nexuslab.local"],
      signatureAlgorithm: "SHA1withRSA",
      keyAlgorithm: "RSA",
      keySize: 1024,
      isSelfSigned: false,
      hasPrivateKey: true,
      friendlyName: "Legacy Expired VPN Gateway"
    }
  ],
  nexus01: [
    {
      id: "cert-201",
      subject: "CN=nexus01.nexuslab.local, O=NEXUS Enterprise",
      issuer: "CN=NEXUS Root CA 2022, O=NEXUS Enterprise, C=US",
      from: "2025-05-10",
      to: "2027-05-10",
      thumbprint: "88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:00:11",
      purpose: "Server Authentication, HTTPS Gateway",
      store: "Personal",
      serialNumber: "88:77:66:55:44:33",
      sanList: ["nexus01.nexuslab.local", "nexus01", "nexus-portal.local"],
      signatureAlgorithm: "SHA256withRSA",
      keyAlgorithm: "RSA",
      keySize: 2048,
      isSelfSigned: false,
      hasPrivateKey: true,
      friendlyName: "NEXUS Gateway Management Portal HTTPS"
    },
    {
      id: "cert-202",
      subject: "CN=NEXUS Root CA 2022, O=NEXUS Enterprise, C=US",
      issuer: "CN=NEXUS Root CA 2022, O=NEXUS Enterprise, C=US",
      from: "2022-01-01",
      to: "2032-01-01",
      thumbprint: "11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44",
      purpose: "Root CA",
      store: "Trusted Root CAs",
      serialNumber: "01",
      sanList: [],
      signatureAlgorithm: "SHA384withRSA",
      keyAlgorithm: "RSA",
      keySize: 4096,
      isSelfSigned: true,
      hasPrivateKey: false,
      friendlyName: "NEXUS Root CA"
    }
  ]
};

export function getMockCertificates(serverIp: string, storeName: string = "Personal"): Certificate[] {
  const key = `NEXUS_CERTS_${serverIp || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed: Certificate[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(c => !storeName || c.store === storeName || (!c.store && storeName === "Personal"));
      }
    }
  } catch (e) {
    console.error("Failed to read certificates from localStorage", e);
  }

  const initialList = INITIAL_CERTIFICATES_STORE[serverIp || "dc01"] || INITIAL_CERTIFICATES_STORE["dc01"];
  return initialList.filter(c => !storeName || c.store === storeName || (!c.store && storeName === "Personal"));
}

export function getAllMockCertificates(serverIp: string): Certificate[] {
  const key = `NEXUS_CERTS_${serverIp || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed: Certificate[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to read certificates from localStorage", e);
  }
  return [...(INITIAL_CERTIFICATES_STORE[serverIp || "dc01"] || INITIAL_CERTIFICATES_STORE["dc01"])];
}

export function saveMockCertificates(serverIp: string, certs: Certificate[]): void {
  const key = `NEXUS_CERTS_${serverIp || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(certs));
}

export async function getCertificates(s: string): Promise<Certificate[]> {
  await delay(150);
  return getAllMockCertificates(s);
}

export function deleteMockCertificate(serverIp: string, thumbprint: string): boolean {
  const all = getAllMockCertificates(serverIp);
  const filtered = all.filter(c => c.thumbprint.toLowerCase() !== thumbprint.toLowerCase() && c.id !== thumbprint);
  if (filtered.length !== all.length) {
    saveMockCertificates(serverIp, filtered);
    return true;
  }
  return false;
}

export function importMockCertificate(serverIp: string, storeName: string, certData: string, password?: string): Certificate {
  const all = getAllMockCertificates(serverIp);
  
  // Try to parse CN or subject from data or construct realistic cert
  let subjectName = "CN=imported-cert-" + Math.floor(Math.random() * 1000) + ".nexuslab.local";
  if (certData.includes("CN=")) {
    const match = certData.match(/CN=([^,\n]+)/);
    if (match) subjectName = `CN=${match[1]}`;
  }

  const hexBytes = () => Array.from({ length: 20 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase()).join(":");
  const serialHex = Array.from({ length: 8 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase()).join(":");

  const now = new Date();
  const future = new Date();
  future.setFullYear(now.getFullYear() + 2);

  const created: Certificate = {
    id: `cert-${Date.now()}`,
    subject: subjectName,
    issuer: password ? "CN=PFX Import CA" : "CN=Custom PEM Import",
    from: now.toISOString().split("T")[0],
    to: future.toISOString().split("T")[0],
    thumbprint: hexBytes(),
    purpose: "Server Authentication, Client Authentication",
    store: storeName || "Personal",
    serialNumber: serialHex,
    sanList: [subjectName.replace("CN=", "")],
    signatureAlgorithm: "SHA256withRSA",
    keyAlgorithm: "RSA",
    keySize: 2048,
    isSelfSigned: false,
    hasPrivateKey: !!password || certData.includes("PRIVATE KEY"),
    friendlyName: subjectName.replace("CN=", "") + " (Imported)",
    certPem: certData.startsWith("-----BEGIN") ? certData : `-----BEGIN CERTIFICATE-----\n${certData}\n-----END CERTIFICATE-----`
  };

  all.unshift(created);
  saveMockCertificates(serverIp, all);
  return created;
}

export function generateMockSelfSignedCert(serverIp: string, storeName: string, params: { commonName: string; san?: string[]; daysValid: number; keySize: number; friendlyName?: string; purpose?: string }): Certificate {
  const all = getAllMockCertificates(serverIp);

  const hexBytes = () => Array.from({ length: 20 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase()).join(":");
  const serialHex = Array.from({ length: 8 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase()).join(":");

  const now = new Date();
  const future = new Date();
  future.setDate(now.getDate() + (params.daysValid || 365));

  const cn = params.commonName.startsWith("CN=") ? params.commonName : `CN=${params.commonName}`;

  const created: Certificate = {
    id: `cert-${Date.now()}`,
    subject: cn,
    issuer: cn,
    from: now.toISOString().split("T")[0],
    to: future.toISOString().split("T")[0],
    thumbprint: hexBytes(),
    purpose: params.purpose || "Server Authentication",
    store: storeName || "Personal",
    serialNumber: serialHex,
    sanList: params.san && params.san.length > 0 ? params.san : [params.commonName.replace("CN=", "")],
    signatureAlgorithm: "SHA256withRSA",
    keyAlgorithm: "RSA",
    keySize: params.keySize || 2048,
    isSelfSigned: true,
    hasPrivateKey: true,
    friendlyName: params.friendlyName || `${params.commonName} (Self-Signed)`,
    certPem: `-----BEGIN CERTIFICATE-----
MIIDeTCCAmWgAwIBAgIQC${serialHex.replace(/:/g,"")}ANBgkqhkiG9w0BAQsFADA
MAoGA1UEAwwD${btoa(params.commonName).slice(0,10)}MB4XDTI2MDcwMTAwMDAwMFoXDTI4
MDcwMTAwMDAwMFowE4ERMA8GA1UEAwwD${btoa(params.commonName).slice(0,10)}MIIBIjANBg
kqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END CERTIFICATE-----`
  };

  all.unshift(created);
  saveMockCertificates(serverIp, all);
  return created;
}

export function renewMockCertificate(serverIp: string, thumbprint: string, extendYears: number = 2): Certificate | null {
  const all = getAllMockCertificates(serverIp);
  const idx = all.findIndex(c => c.thumbprint.toLowerCase() === thumbprint.toLowerCase() || c.id === thumbprint);
  if (idx === -1) return null;

  const cert = all[idx];
  const newFrom = new Date().toISOString().split("T")[0];
  const newToDate = new Date();
  newToDate.setFullYear(newToDate.getFullYear() + extendYears);

  const hexBytes = () => Array.from({ length: 20 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase()).join(":");

  const updated: Certificate = {
    ...cert,
    from: newFrom,
    to: newToDate.toISOString().split("T")[0],
    thumbprint: hexBytes()
  };

  all[idx] = updated;
  saveMockCertificates(serverIp, all);
  return updated;
}


// --- Networks Persistence & Advanced Features
export interface NetworkAdapter {
  name: string;
  description: string;
  type: "Ethernet" | "WiFi" | "Virtual" | "Bonded";
  status: "Connected" | "Disconnected" | "Disabled";
  speedMbps: number;
  ipv4: string;
  subnet: string;
  gateway: string;
  dns: string[];
  ipv6: string;
  mac: string;
  bytesIn: number;
  bytesOut: number;
  dhcp: boolean;
  mtu?: number;
  vlanId?: number;
  gatewayLatencyMs?: number;
}

export interface NetworkRoute {
  destination: string;
  netmask: string;
  gateway: string;
  interfaceName: string;
  metric: number;
  type: "Static" | "Dynamic" | "Direct";
}

export interface DnsCacheEntry {
  hostname: string;
  recordType: "A" | "AAAA" | "CNAME" | "MX" | "TXT";
  data: string;
  ttl: number;
}

export const INITIAL_NETWORKS_STORE: Record<string, NetworkAdapter[]> = {
  dc01: [
    {
      name: "Ethernet 0 (Primary LAN)",
      description: "Intel(R) 82574L Gigabit Network Connection",
      type: "Ethernet",
      status: "Connected",
      speedMbps: 10000,
      ipv4: "192.168.0.10",
      subnet: "255.255.255.0",
      gateway: "192.168.0.1",
      dns: ["192.168.0.10", "1.1.1.1"],
      ipv6: "fe80::1234:5678:9abc:def0/64",
      mac: "00:15:5D:01:0A:10",
      bytesIn: 4_821_932_040,
      bytesOut: 2_884_002_192,
      dhcp: false,
      mtu: 1500,
      vlanId: 10,
      gatewayLatencyMs: 1
    },
    {
      name: "Ethernet 1 (SAN / iSCSI)",
      description: "Intel(R) Ethernet Server Adapter I350-T2",
      type: "Ethernet",
      status: "Connected",
      speedMbps: 10000,
      ipv4: "10.0.50.15",
      subnet: "255.255.255.0",
      gateway: "10.0.50.1",
      dns: ["10.0.50.1"],
      ipv6: "fe80::9876:5432:10fe:dcba/64",
      mac: "00:15:5D:01:0B:15",
      bytesIn: 12_402_192_000,
      bytesOut: 18_902_192_000,
      dhcp: false,
      mtu: 9000,
      vlanId: 50,
      gatewayLatencyMs: 2
    },
    {
      name: "vEthernet (NEXUS Switch)",
      description: "Hyper-V Virtual Ethernet Adapter #2",
      type: "Virtual",
      status: "Connected",
      speedMbps: 10000,
      ipv4: "172.16.0.1",
      subnet: "255.255.0.0",
      gateway: "0.0.0.0",
      dns: [],
      ipv6: "—",
      mac: "00:15:5D:99:00:01",
      bytesIn: 102_002_192,
      bytesOut: 22_002_192,
      dhcp: false,
      mtu: 1500,
      gatewayLatencyMs: 0
    },
    {
      name: "Ethernet 2 (Failover Standby)",
      description: "Broadcom NetXtreme Gigabit Ethernet",
      type: "Ethernet",
      status: "Disconnected",
      speedMbps: 1000,
      ipv4: "—",
      subnet: "—",
      gateway: "—",
      dns: [],
      ipv6: "—",
      mac: "00:15:5D:01:0C:02",
      bytesIn: 0,
      bytesOut: 0,
      dhcp: true,
      mtu: 1500
    }
  ]
};

export const INITIAL_ROUTES_STORE: Record<string, NetworkRoute[]> = {
  dc01: [
    { destination: "0.0.0.0", netmask: "0.0.0.0", gateway: "192.168.0.1", interfaceName: "Ethernet 0 (Primary LAN)", metric: 25, type: "Static" },
    { destination: "10.0.50.0", netmask: "255.255.255.0", gateway: "On-link", interfaceName: "Ethernet 1 (SAN / iSCSI)", metric: 10, type: "Direct" },
    { destination: "172.16.0.0", netmask: "255.255.0.0", gateway: "On-link", interfaceName: "vEthernet (NEXUS Switch)", metric: 15, type: "Direct" },
    { destination: "192.168.0.0", netmask: "255.255.255.0", gateway: "On-link", interfaceName: "Ethernet 0 (Primary LAN)", metric: 25, type: "Direct" },
    { destination: "224.0.0.0", netmask: "240.0.0.0", gateway: "On-link", interfaceName: "Ethernet 0 (Primary LAN)", metric: 25, type: "Dynamic" }
  ]
};

export const INITIAL_DNS_CACHE: DnsCacheEntry[] = [
  { hostname: "dc01.nexus.local", recordType: "A", data: "192.168.0.10", ttl: 86400 },
  { hostname: "gateway.nexus.local", recordType: "A", data: "192.168.0.1", ttl: 3600 },
  { hostname: "storage.nexus.local", recordType: "A", data: "10.0.50.15", ttl: 7200 },
  { hostname: "k8s-master.nexus.local", recordType: "A", data: "172.16.0.100", ttl: 1800 },
  { hostname: "google-public-dns-a.google.com", recordType: "A", data: "8.8.8.8", ttl: 300 },
  { hostname: "one.one.one.one", recordType: "A", data: "1.1.1.1", ttl: 300 }
];

export function getMockNetworkAdapters(serverId: string): NetworkAdapter[] {
  const key = `NEXUS_NETWORKS_${serverId || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to parse network adapters from localStorage", e);
  }
  return INITIAL_NETWORKS_STORE[serverId] ? [...INITIAL_NETWORKS_STORE[serverId]] : [...INITIAL_NETWORKS_STORE.dc01];
}

export function saveMockNetworkAdapters(serverId: string, adapters: NetworkAdapter[]): void {
  const key = `NEXUS_NETWORKS_${serverId || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(adapters));
}

export function updateMockNetworkAdapterConfig(
  serverId: string, 
  adapterName: string, 
  config: Partial<NetworkAdapter>
): boolean {
  const list = getMockNetworkAdapters(serverId);
  const target = list.find(a => a.name === adapterName);
  if (target) {
    Object.assign(target, config);
    saveMockNetworkAdapters(serverId, list);
    return true;
  }
  return false;
}

export function controlMockNetworkAdapter(serverId: string, adapterName: string, action: string): boolean {
  const list = getMockNetworkAdapters(serverId);
  const target = list.find(a => a.name === adapterName);
  if (!target) return false;

  if (action === "enable") {
    target.status = "Connected";
  } else if (action === "disable") {
    target.status = "Disabled";
  } else if (action === "release") {
    target.ipv4 = "0.0.0.0";
    target.subnet = "0.0.0.0";
    target.gateway = "0.0.0.0";
  } else if (action === "renew") {
    target.status = "Connected";
    target.ipv4 = target.ipv4 === "0.0.0.0" ? "192.168.0." + (Math.floor(Math.random() * 200) + 20) : target.ipv4;
    target.subnet = "255.255.255.0";
    target.gateway = "192.168.0.1";
  }
  saveMockNetworkAdapters(serverId, list);
  return true;
}

export function getMockRoutes(serverId: string): NetworkRoute[] {
  const key = `NEXUS_ROUTES_${serverId || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to read routes", e);
  }
  return INITIAL_ROUTES_STORE[serverId] || INITIAL_ROUTES_STORE.dc01;
}

export function addMockRoute(serverId: string, route: NetworkRoute): boolean {
  const routes = getMockRoutes(serverId);
  routes.push(route);
  localStorage.setItem(`NEXUS_ROUTES_${serverId || "dc01"}`, JSON.stringify(routes));
  return true;
}

export function deleteMockRoute(serverId: string, destination: string): boolean {
  let routes = getMockRoutes(serverId);
  routes = routes.filter(r => r.destination !== destination);
  localStorage.setItem(`NEXUS_ROUTES_${serverId || "dc01"}`, JSON.stringify(routes));
  return true;
}

export function getMockDnsCache(): DnsCacheEntry[] {
  return [...INITIAL_DNS_CACHE];
}

export async function getNetworkAdapters(serverId: string): Promise<NetworkAdapter[]> {
  await delay(120);
  return getMockNetworkAdapters(serverId);
}


// --- Apps
export interface InstalledApp {
  id: string;
  name: string;
  publisher: string;
  version: string;
  installDate: string;
  location: string;
  sizeMB: number;
  category?: string;
  arch?: "x64" | "x86" | "arm64";
  uninstallString?: string;
  registryKey?: string;
  updateAvailable?: boolean;
  latestVersion?: string;
}

export interface SoftwareCatalogItem {
  id: string;
  name: string;
  publisher: string;
  version: string;
  category: string;
  description: string;
  sizeMB: number;
  silentArgs: string;
  packageId: string;
}

export const INITIAL_SOFTWARE_CATALOG: SoftwareCatalogItem[] = [
  {
    id: "7zip",
    name: "7-Zip 24.07 (x64)",
    publisher: "Igor Pavlov",
    version: "24.07",
    category: "Utilities",
    description: "High-compression file archiver with AES-256 encryption.",
    sizeMB: 5.2,
    silentArgs: "/S",
    packageId: "7zip.7zip"
  },
  {
    id: "notepadpp",
    name: "Notepad++ v8.6.8",
    publisher: "Don Ho",
    version: "8.6.8",
    category: "Development",
    description: "Popular source code editor and Notepad replacement.",
    sizeMB: 12.4,
    silentArgs: "/S",
    packageId: "Notepad++.Notepad++"
  },
  {
    id: "git",
    name: "Git 2.45.2 for Windows",
    publisher: "The Git Development Team",
    version: "2.45.2",
    category: "Development",
    description: "Distributed version control system for software development.",
    sizeMB: 58.1,
    silentArgs: "/VERYSILENT /NORESTART",
    packageId: "Git.Git"
  },
  {
    id: "sysinternals",
    name: "Sysinternals Suite 2024.06",
    publisher: "Microsoft Corporation",
    version: "2024.06",
    category: "System Tools",
    description: "Comprehensive troubleshooting and administration suite.",
    sizeMB: 48.0,
    silentArgs: "-acceptEula /quiet",
    packageId: "Microsoft.SysinternalsSuite"
  },
  {
    id: "wireshark",
    name: "Wireshark 4.2.5",
    publisher: "The Wireshark Development Team",
    version: "4.2.5",
    category: "Networking",
    description: "World's foremost network protocol analyzer.",
    sizeMB: 84.5,
    silentArgs: "/S /NPF=off",
    packageId: "WiresharkFoundation.Wireshark"
  },
  {
    id: "pwsh7",
    name: "PowerShell 7.4.3 (x64)",
    publisher: "Microsoft Corporation",
    version: "7.4.3",
    category: "Management",
    description: "Cross-platform task automation and configuration framework.",
    sizeMB: 102.0,
    silentArgs: "/quiet ENABLE_PSREMOTING=1",
    packageId: "Microsoft.PowerShell"
  },
  {
    id: "python",
    name: "Python 3.12.4 (64-bit)",
    publisher: "Python Software Foundation",
    version: "3.12.4",
    category: "Development",
    description: "Interpreted high-level programming language environment.",
    sizeMB: 28.5,
    silentArgs: "/quiet InstallAllUsers=1 PrependPath=1",
    packageId: "Python.Python.3.12"
  },
  {
    id: "chrome",
    name: "Google Chrome Enterprise",
    publisher: "Google LLC",
    version: "126.0.6478.127",
    category: "Web & Enterprise",
    description: "Enterprise standalone browser with group policy controls.",
    sizeMB: 112.0,
    silentArgs: "/qn /norestart",
    packageId: "Google.Chrome"
  }
];

const REPO_STORAGE_KEY = "NEXUS_SOFTWARE_REPO_CATALOG";

export function getSoftwareCatalog(): SoftwareCatalogItem[] {
  try {
    const saved = localStorage.getItem(REPO_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to read software catalog from localStorage", e);
  }
  return [...INITIAL_SOFTWARE_CATALOG];
}

export function saveSoftwareCatalog(catalog: SoftwareCatalogItem[]): void {
  try {
    localStorage.setItem(REPO_STORAGE_KEY, JSON.stringify(catalog));
  } catch (e) {
    console.error("Failed to save software catalog to localStorage", e);
  }
}

export function addSoftwareCatalogItem(item: Omit<SoftwareCatalogItem, "id"> & { id?: string }): SoftwareCatalogItem {
  const catalog = getSoftwareCatalog();
  const newItem: SoftwareCatalogItem = {
    ...item,
    id: item.id || "pkg-" + Date.now().toString(36)
  };
  catalog.unshift(newItem);
  saveSoftwareCatalog(catalog);
  return newItem;
}

export function updateSoftwareCatalogItem(id: string, updated: Partial<SoftwareCatalogItem>): boolean {
  const catalog = getSoftwareCatalog();
  const idx = catalog.findIndex((i) => i.id === id);
  if (idx !== -1) {
    catalog[idx] = { ...catalog[idx], ...updated };
    saveSoftwareCatalog(catalog);
    return true;
  }
  return false;
}

export function deleteSoftwareCatalogItem(id: string): boolean {
  const catalog = getSoftwareCatalog();
  const filtered = catalog.filter((i) => i.id !== id);
  if (filtered.length !== catalog.length) {
    saveSoftwareCatalog(filtered);
    return true;
  }
  return false;
}

export function resetSoftwareCatalog(): SoftwareCatalogItem[] {
  saveSoftwareCatalog(INITIAL_SOFTWARE_CATALOG);
  return [...INITIAL_SOFTWARE_CATALOG];
}

export const SOFTWARE_CATALOG: SoftwareCatalogItem[] = INITIAL_SOFTWARE_CATALOG;

const MOCK_APPS_BY_SERVER: Record<string, InstalledApp[]> = {
  dc01: [
    {
      id: "app-nexus-agent",
      name: "NEXUS Agent Service",
      publisher: "NEXUS Labs Inc.",
      version: "3.4.102",
      installDate: "2026-01-10",
      location: "C:\\Program Files\\NEXUS\\Agent",
      sizeMB: 145.2,
      category: "Management",
      arch: "x64",
      uninstallString: "MsiExec.exe /X{8F290000-1122-3344-5566-778899AABBCC}",
      registryKey: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{NEXUS-Agent}",
      updateAvailable: false
    },
    {
      id: "app-dotnet-8",
      name: "Microsoft .NET Host - 8.0.6 (x64)",
      publisher: "Microsoft Corporation",
      version: "8.0.6.33715",
      installDate: "2025-11-14",
      location: "C:\\Program Files\\dotnet",
      sizeMB: 210.0,
      category: "Runtimes",
      arch: "x64",
      uninstallString: "MsiExec.exe /X{12345678-ABCD-EF01-2345-6789ABCDEF01}",
      registryKey: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{DotNetHost8}",
      updateAvailable: true,
      latestVersion: "8.0.7"
    },
    {
      id: "app-vc-redist",
      name: "Microsoft Visual C++ 2015-2022 Redistributable (x64)",
      publisher: "Microsoft Corporation",
      version: "14.38.33130.0",
      installDate: "2025-08-20",
      location: "C:\\Windows\\System32",
      sizeMB: 24.8,
      category: "Runtimes",
      arch: "x64",
      uninstallString: "C:\\ProgramData\\Package Cache\\{vc_redist.x64}\\VC_redist.x64.exe /uninstall",
      registryKey: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{VC2015-2022}",
      updateAvailable: false
    },
    {
      id: "app-pwsh7",
      name: "PowerShell 7.4.2 (x64)",
      publisher: "Microsoft Corporation",
      version: "7.4.2",
      installDate: "2026-02-01",
      location: "C:\\Program Files\\PowerShell\\7",
      sizeMB: 102.0,
      category: "Management",
      arch: "x64",
      uninstallString: "MsiExec.exe /X{99887766-5544-3322-1100-AABBCCDDEEFF}",
      registryKey: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{PowerShell7}",
      updateAvailable: true,
      latestVersion: "7.4.3"
    },
    {
      id: "app-git",
      name: "Git 2.43.0",
      publisher: "The Git Development Team",
      version: "2.43.0",
      installDate: "2025-09-05",
      location: "C:\\Program Files\\Git",
      sizeMB: 58.1,
      category: "Development",
      arch: "x64",
      uninstallString: "C:\\Program Files\\Git\\unins000.exe",
      registryKey: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Git_is1",
      updateAvailable: true,
      latestVersion: "2.45.2"
    },
    {
      id: "app-notepadpp",
      name: "Notepad++ (64-bit x64)",
      publisher: "Don Ho",
      version: "8.6.2",
      installDate: "2025-10-12",
      location: "C:\\Program Files\\Notepad++",
      sizeMB: 12.4,
      category: "Utilities",
      arch: "x64",
      uninstallString: "C:\\Program Files\\Notepad++\\uninstall.exe",
      registryKey: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Notepad++",
      updateAvailable: true,
      latestVersion: "8.6.8"
    },
    {
      id: "app-7zip",
      name: "7-Zip 23.01 (x64)",
      publisher: "Igor Pavlov",
      version: "23.01",
      installDate: "2025-06-15",
      location: "C:\\Program Files\\7-Zip",
      sizeMB: 5.2,
      category: "Utilities",
      arch: "x64",
      uninstallString: "C:\\Program Files\\7-Zip\\Uninstall.exe",
      registryKey: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\7-Zip",
      updateAvailable: true,
      latestVersion: "24.07"
    },
    {
      id: "app-sysinternals",
      name: "Sysinternals Suite",
      publisher: "Microsoft Corporation",
      version: "2024.02",
      installDate: "2026-03-10",
      location: "C:\\Tools\\Sysinternals",
      sizeMB: 48.0,
      category: "System Tools",
      arch: "x64",
      uninstallString: "cmd.exe /c rmdir /s /q C:\\Tools\\Sysinternals",
      registryKey: "HKLM\\SOFTWARE\\Sysinternals",
      updateAvailable: false
    }
  ]
};

export function getMockApps(serverId: string): InstalledApp[] {
  if (!MOCK_APPS_BY_SERVER[serverId]) {
    MOCK_APPS_BY_SERVER[serverId] = MOCK_APPS_BY_SERVER.dc01.map(a => ({ ...a }));
  }
  return MOCK_APPS_BY_SERVER[serverId];
}

export function installMockApp(serverId: string, installerPath: string, args: string): boolean {
  const list = getMockApps(serverId);
  const fileName = installerPath.split(/[/\\]/).pop() || "CustomApplication.exe";
  const appName = fileName.replace(/\.(exe|msi|ps1)$/i, "");

  const newApp: InstalledApp = {
    id: "app-" + Date.now(),
    name: appName.charAt(0).toUpperCase() + appName.slice(1),
    publisher: "Package Installer",
    version: "1.0.0",
    installDate: new Date().toISOString().slice(0, 10),
    location: `C:\\Program Files\\${appName}`,
    sizeMB: Math.floor(Math.random() * 80) + 10,
    category: "Installed Software",
    arch: "x64",
    uninstallString: `C:\\Program Files\\${appName}\\uninstall.exe`,
    registryKey: `HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{${appName}}`,
    updateAvailable: false
  };

  list.unshift(newApp);
  return true;
}

export function uninstallMockApp(serverId: string, uninstallString: string): boolean {
  const list = getMockApps(serverId);
  const idx = list.findIndex(a => a.uninstallString === uninstallString || uninstallString.includes(a.id) || uninstallString.includes(a.name));
  if (idx !== -1) {
    list.splice(idx, 1);
    return true;
  }
  if (list.length > 0) {
    list.pop();
    return true;
  }
  return false;
}

export function uploadMockInstaller(serverId: string, file: File): string {
  return `C:\\NEXUS\\Uploads\\${file.name}`;
}

// --- Roles & Features
export interface RoleFeature { id: string; name: string; description: string; installed: boolean; kind: "Role"|"Feature"; sub?: string[]; }

// --- Registry Engine & Persistence
export interface RegistryValue { 
  name: string; 
  type: "REG_SZ" | "REG_DWORD" | "REG_QWORD" | "REG_BINARY" | "REG_MULTI_SZ" | "REG_EXPAND_SZ"; 
  data: string; 
}

export interface RegistryNode {
  name: string;
  path: string;
  hasSubKeys?: boolean;
}

export interface RegistryContent {
  subKeys: RegistryNode[];
  values: RegistryValue[];
}

export interface RegistrySearchResult {
  path: string;
  type: "Key" | "Value";
  valueName?: string;
  valueType?: string;
  data?: string;
}

const DEFAULT_REGISTRY_TREE: Record<string, { subKeys: string[]; values: RegistryValue[] }> = {
  "HKEY_LOCAL_MACHINE": {
    subKeys: ["HARDWARE", "SAM", "SECURITY", "SOFTWARE", "SYSTEM"],
    values: [{ name: "(Default)", type: "REG_SZ", data: "(value not set)" }]
  },
  "HKEY_LOCAL_MACHINE\\SOFTWARE": {
    subKeys: ["Classes", "Microsoft", "NEXUS", "Policies", "RegisteredApplications"],
    values: [
      { name: "(Default)", type: "REG_SZ", data: "(value not set)" },
      { name: "RegisteredOrganization", type: "REG_SZ", data: "NEXUS Managed Infrastructure" }
    ]
  },
  "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft": {
    subKeys: ["Windows", "Windows NT", "NET Framework Setup", "PowerShell"],
    values: [{ name: "(Default)", type: "REG_SZ", data: "(value not set)" }]
  },
  "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT": {
    subKeys: ["CurrentVersion"],
    values: [{ name: "(Default)", type: "REG_SZ", data: "(value not set)" }]
  },
  "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion": {
    subKeys: ["ProfileList", "Winlogon", "Server"],
    values: [
      { name: "(Default)", type: "REG_SZ", data: "(value not set)" },
      { name: "ProductName", type: "REG_SZ", data: "Windows Server 2022 Datacenter" },
      { name: "CurrentBuild", type: "REG_SZ", data: "20348" },
      { name: "CurrentBuildNumber", type: "REG_SZ", data: "20348" },
      { name: "DisplayVersion", type: "REG_SZ", data: "21H2" },
      { name: "EditionID", type: "REG_SZ", data: "ServerDatacenter" },
      { name: "InstallDate", type: "REG_DWORD", data: "0x65F1BB20 (1710326560)" },
      { name: "PathName", type: "REG_EXPAND_SZ", data: "%SystemRoot%" },
      { name: "RegisteredOwner", type: "REG_SZ", data: "NEXUS Enterprise Admin" },
      { name: "SystemRoot", type: "REG_SZ", data: "C:\\Windows" },
      { name: "UBR", type: "REG_DWORD", data: "0x00000A18 (2584)" }
    ]
  },
  "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\ProfileList": {
    subKeys: ["S-1-5-18", "S-1-5-19", "S-1-5-20", "S-1-5-21-1004336348-1177238915-682003330-500"],
    values: [
      { name: "(Default)", type: "REG_SZ", data: "(value not set)" },
      { name: "ProfilesDirectory", type: "REG_EXPAND_SZ", data: "%SystemDrive%\\Users" }
    ]
  },
  "HKEY_LOCAL_MACHINE\\SOFTWARE\\NEXUS": {
    subKeys: ["Agent", "Security", "Telemetry"],
    values: [{ name: "(Default)", type: "REG_SZ", data: "(value not set)" }]
  },
  "HKEY_LOCAL_MACHINE\\SOFTWARE\\NEXUS\\Agent": {
    subKeys: ["Modules", "Logs"],
    values: [
      { name: "(Default)", type: "REG_SZ", data: "(value not set)" },
      { name: "AgentVersion", type: "REG_SZ", data: "2.8.4-RELEASE" },
      { name: "ClusterId", type: "REG_SZ", data: "NEXUS-PROD-EAST-01" },
      { name: "HeartbeatIntervalSec", type: "REG_DWORD", data: "0x0000001E (30)" },
      { name: "EnableRealtimeMetrics", type: "REG_DWORD", data: "0x00000001 (1)" },
      { name: "AllowedManagementIPs", type: "REG_MULTI_SZ", data: "192.168.0.0/24\n10.0.0.0/16\n172.16.0.1" },
      { name: "ServicePrincipalToken", type: "REG_BINARY", data: "4e 45 58 55 53 2d 53 45 43 55 52 45 2d 54 4f 4b 45 4e" }
    ]
  },
  "HKEY_LOCAL_MACHINE\\SYSTEM": {
    subKeys: ["ControlSet001", "CurrentControlSet", "Setup"],
    values: [{ name: "(Default)", type: "REG_SZ", data: "(value not set)" }]
  },
  "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet": {
    subKeys: ["Control", "Hardware Profiles", "Services"],
    values: [{ name: "(Default)", type: "REG_SZ", data: "(value not set)" }]
  },
  "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control": {
    subKeys: ["ComputerName", "CrashControl", "FileSystem", "Session Manager", "Terminal Server"],
    values: [
      { name: "(Default)", type: "REG_SZ", data: "(value not set)" },
      { name: "CurrentUser", type: "REG_SZ", data: "SYSTEM" },
      { name: "SystemStartOptions", type: "REG_SZ", data: "NOEXECUTE=OPTIN" }
    ]
  },
  "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\ComputerName\\ComputerName": {
    subKeys: [],
    values: [
      { name: "(Default)", type: "REG_SZ", data: "(value not set)" },
      { name: "ComputerName", type: "REG_SZ", data: "DC01-NEXUS" }
    ]
  },
  "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server": {
    subKeys: ["WinStations"],
    values: [
      { name: "(Default)", type: "REG_SZ", data: "(value not set)" },
      { name: "fDenyTSConnections", type: "REG_DWORD", data: "0x00000000 (0)" },
      { name: "AllowRemoteRPC", type: "REG_DWORD", data: "0x00000001 (1)" }
    ]
  },
  "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services": {
    subKeys: ["Dhcp", "Dnscache", "EventLog", "LanmanServer", "NEXUSAgent", "W32Time"],
    values: [{ name: "(Default)", type: "REG_SZ", data: "(value not set)" }]
  },
  "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\NEXUSAgent": {
    subKeys: ["Parameters", "Security"],
    values: [
      { name: "(Default)", type: "REG_SZ", data: "(value not set)" },
      { name: "DisplayName", type: "REG_SZ", data: "NEXUS Orchestration Agent" },
      { name: "ImagePath", type: "REG_EXPAND_SZ", data: "%SystemRoot%\\System32\\nexus-agent.exe" },
      { name: "Start", type: "REG_DWORD", data: "0x00000002 (2)" },
      { name: "Type", type: "REG_DWORD", data: "0x00000010 (16)" },
      { name: "ErrorControl", type: "REG_DWORD", data: "0x00000001 (1)" }
    ]
  },
  "HKEY_CURRENT_USER": {
    subKeys: ["AppEvents", "Console", "Control Panel", "Environment", "SOFTWARE"],
    values: [{ name: "(Default)", type: "REG_SZ", data: "(value not set)" }]
  },
  "HKEY_CURRENT_USER\\Environment": {
    subKeys: [],
    values: [
      { name: "(Default)", type: "REG_SZ", data: "(value not set)" },
      { name: "Path", type: "REG_EXPAND_SZ", data: "%USERPROFILE%\\AppData\\Local\\Microsoft\\WindowsApps;" },
      { name: "TEMP", type: "REG_EXPAND_SZ", data: "%USERPROFILE%\\AppData\\Local\\Temp" },
      { name: "TMP", type: "REG_EXPAND_SZ", data: "%USERPROFILE%\\AppData\\Local\\Temp" }
    ]
  },
  "HKEY_CURRENT_USER\\SOFTWARE": {
    subKeys: ["Microsoft", "NEXUS"],
    values: [{ name: "(Default)", type: "REG_SZ", data: "(value not set)" }]
  },
  "HKEY_CURRENT_USER\\SOFTWARE\\NEXUS": {
    subKeys: ["Preferences"],
    values: [
      { name: "(Default)", type: "REG_SZ", data: "(value not set)" },
      { name: "Theme", type: "REG_SZ", data: "Dark" },
      { name: "AutoRefreshInterval", type: "REG_DWORD", data: "0x00000005 (5)" }
    ]
  },
  "HKEY_CLASSES_ROOT": {
    subKeys: [".exe", ".dll", ".json", ".log", "Directory", "Drive"],
    values: [{ name: "(Default)", type: "REG_SZ", data: "(value not set)" }]
  },
  "HKEY_USERS": {
    subKeys: [".DEFAULT", "S-1-5-18", "S-1-5-19", "S-1-5-20", "S-1-5-21-1004336348-1177238915-682003330-500"],
    values: [{ name: "(Default)", type: "REG_SZ", data: "(value not set)" }]
  },
  "HKEY_CURRENT_CONFIG": {
    subKeys: ["Software", "System"],
    values: [{ name: "(Default)", type: "REG_SZ", data: "(value not set)" }]
  }
};

function getMockRegistryStore(serverId: string): Record<string, { subKeys: string[]; values: RegistryValue[] }> {
  const key = `NEXUS_REGISTRY_${serverId || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to load registry store", e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_REGISTRY_TREE));
}

function saveMockRegistryStore(serverId: string, store: Record<string, { subKeys: string[]; values: RegistryValue[] }>): void {
  const key = `NEXUS_REGISTRY_${serverId || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(store));
}

export async function getMockRegistryContent(serverId: string, path: string): Promise<RegistryContent> {
  await delay(100);
  const normalizedPath = (path || "HKEY_LOCAL_MACHINE").replace(/\/+/g, "\\").trim();
  const store = getMockRegistryStore(serverId);
  
  const node = store[normalizedPath];
  if (!node) {
    // Return empty if path does not exist
    return { subKeys: [], values: [{ name: "(Default)", type: "REG_SZ", data: "(value not set)" }] };
  }

  const subKeys: RegistryNode[] = node.subKeys.map(skName => {
    const fullChildPath = `${normalizedPath}\\${skName}`;
    const childNode = store[fullChildPath];
    return {
      name: skName,
      path: fullChildPath,
      hasSubKeys: childNode ? childNode.subKeys.length > 0 : true
    };
  });

  return {
    subKeys,
    values: node.values
  };
}

export async function createMockRegistryKey(serverId: string, parentPath: string, keyName: string): Promise<boolean> {
  await delay(120);
  const store = getMockRegistryStore(serverId);
  const normalizedParent = parentPath.replace(/\/+/g, "\\").trim();
  const newPath = `${normalizedParent}\\${keyName.trim()}`;

  if (!store[normalizedParent]) {
    store[normalizedParent] = { subKeys: [], values: [{ name: "(Default)", type: "REG_SZ", data: "(value not set)" }] };
  }

  if (!store[normalizedParent].subKeys.includes(keyName.trim())) {
    store[normalizedParent].subKeys.push(keyName.trim());
  }

  store[newPath] = {
    subKeys: [],
    values: [{ name: "(Default)", type: "REG_SZ", data: "(value not set)" }]
  };

  saveMockRegistryStore(serverId, store);
  return true;
}

export async function createMockRegistryValue(
  serverId: string, 
  path: string, 
  name: string, 
  type: RegistryValue["type"], 
  data: string
): Promise<boolean> {
  await delay(120);
  const store = getMockRegistryStore(serverId);
  const normalizedPath = path.replace(/\/+/g, "\\").trim();

  if (!store[normalizedPath]) {
    store[normalizedPath] = { subKeys: [], values: [] };
  }

  const existingIdx = store[normalizedPath].values.findIndex(v => v.name === name);
  const entry: RegistryValue = { name, type, data };

  if (existingIdx >= 0) {
    store[normalizedPath].values[existingIdx] = entry;
  } else {
    store[normalizedPath].values.push(entry);
  }

  saveMockRegistryStore(serverId, store);
  return true;
}

export async function deleteMockRegistryValue(serverId: string, path: string, name: string): Promise<boolean> {
  await delay(100);
  const store = getMockRegistryStore(serverId);
  const normalizedPath = path.replace(/\/+/g, "\\").trim();

  if (store[normalizedPath]) {
    store[normalizedPath].values = store[normalizedPath].values.filter(v => v.name !== name);
    saveMockRegistryStore(serverId, store);
    return true;
  }
  return false;
}

export async function deleteMockRegistryKey(serverId: string, path: string): Promise<boolean> {
  await delay(120);
  const store = getMockRegistryStore(serverId);
  const normalizedPath = path.replace(/\/+/g, "\\").trim();

  if (store[normalizedPath]) {
    delete store[normalizedPath];
    
    // Remove from parent subKeys array
    const lastSlash = normalizedPath.lastIndexOf("\\");
    if (lastSlash > 0) {
      const parentPath = normalizedPath.slice(0, lastSlash);
      const childName = normalizedPath.slice(lastSlash + 1);
      if (store[parentPath]) {
        store[parentPath].subKeys = store[parentPath].subKeys.filter(k => k !== childName);
      }
    }

    saveMockRegistryStore(serverId, store);
    return true;
  }
  return false;
}

export function searchMockRegistry(serverId: string, query: string): RegistrySearchResult[] {
  if (!query || query.trim().length < 2) return [];
  const store = getMockRegistryStore(serverId);
  const q = query.toLowerCase().trim();
  const results: RegistrySearchResult[] = [];

  for (const [keyPath, node] of Object.entries(store)) {
    if (keyPath.toLowerCase().includes(q)) {
      results.push({ path: keyPath, type: "Key" });
    }

    for (const val of node.values) {
      if (val.name.toLowerCase().includes(q) || val.data.toLowerCase().includes(q)) {
        results.push({
          path: keyPath,
          type: "Value",
          valueName: val.name,
          valueType: val.type,
          data: val.data
        });
      }
    }

    if (results.length >= 100) break; // cap search results
  }

  return results;
}

export function generateRegFileExport(serverId: string, path: string): string {
  const store = getMockRegistryStore(serverId);
  const normalizedPath = path.replace(/\/+/g, "\\").trim();
  
  let output = `Windows Registry Editor Version 5.00\n\n[${normalizedPath}]\n`;

  const node = store[normalizedPath];
  if (node) {
    for (const val of node.values) {
      const escapedName = val.name === "(Default)" ? "@" : `"${val.name.replace(/"/g, '\\"')}"`;
      if (val.type === "REG_SZ") {
        output += `${escapedName}="${val.data.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"\n`;
      } else if (val.type === "REG_DWORD") {
        const hexVal = val.data.startsWith("0x") ? val.data.split(" ")[0].slice(2) : "00000000";
        output += `${escapedName}=dword:${hexVal.padStart(8, "0")}\n`;
      } else if (val.type === "REG_EXPAND_SZ") {
        output += `${escapedName}=hex(2):${val.data.split("").map(c => c.charCodeAt(0).toString(16).padStart(2, "0") + ",00").join(",")},00,00\n`;
      } else {
        output += `${escapedName}="${val.data}"\n`;
      }
    }
  }

  return output;
}

export async function getRegistryKeys(_s: string, _path: string): Promise<RegistryValue[]> {
  const res = await getMockRegistryContent(_s, _path);
  return res.values;
}


// --- Devices
export interface Device { category: string; name: string; manufacturer: string; status: "OK"|"Warning"|"Disabled"; driverVersion: string; driverDate: string; }
export async function getDevices(_s: string): Promise<Device[]> {
  await delay();
  return [
    { category: "Processors", name: "Intel(R) Xeon(R) Gold 6248R CPU @ 3.00GHz", manufacturer: "Intel", status: "OK", driverVersion: "10.0.20348.1", driverDate: "2024-04-12" },
    { category: "Disk drives", name: "Samsung SSD 980 PRO 1TB", manufacturer: "Samsung", status: "OK", driverVersion: "10.0.20348.1", driverDate: "2024-03-08" },
    { category: "Display adapters", name: "Microsoft Hyper-V Video", manufacturer: "Microsoft", status: "OK", driverVersion: "10.0.20348.169", driverDate: "2024-06-20" },
    { category: "Network adapters", name: "Intel(R) 82574L Gigabit Network Connection", manufacturer: "Intel", status: "OK", driverVersion: "12.18.9.23", driverDate: "2023-11-02" },
    { category: "Network adapters", name: "Microsoft Hyper-V Network Adapter", manufacturer: "Microsoft", status: "OK", driverVersion: "10.0.20348.1", driverDate: "2024-02-19" },
    { category: "System devices", name: "ACPI Fixed Feature Button", manufacturer: "Microsoft", status: "OK", driverVersion: "10.0.20348.1", driverDate: "2024-02-19" },
    { category: "System devices", name: "Unknown Device", manufacturer: "—", status: "Warning", driverVersion: "—", driverDate: "—" },
  ];
}

// --- VMs & Hyper-V
export interface VMCheckpoint {
  id: string;
  name: string;
  createdAt: string;
  isCurrent?: boolean;
}

export interface HyperVVM { 
  id: string; 
  name: string; 
  status: "Running" | "Stopped" | "Paused" | "Saved"; 
  os: string; 
  cpu: number; 
  memMB: number; 
  uptime: string;
  generation?: 1 | 2;
  vCPUs?: number;
  vswitch?: string;
  vhdxPath?: string;
  vhdxSizeGB?: number;
  dynamicMemory?: boolean;
  isoPath?: string;
  ipAddress?: string;
  notes?: string;
  checkpoints?: VMCheckpoint[];
  integrationServices?: {
    heartbeat: boolean;
    kvp: boolean;
    shutdown: boolean;
    timeSync: boolean;
    vss: boolean;
  };
  historyCPU?: number[];
  historyRAM?: number[];
}

const INITIAL_VMS: Record<string, HyperVVM[]> = {
  nexus01: [
    { 
      id: "vm1", name: "BUILD-AGENT-01", status: "Running", os: "Windows Server 2022", cpu: 28, memMB: 8192, uptime: "12d 4h",
      generation: 2, vCPUs: 4, vswitch: "NEXUS-External", vhdxPath: "C:\\Hyper-V\\Virtual Hard Disks\\BUILD-AGENT-01.vhdx", vhdxSizeGB: 120, dynamicMemory: true,
      ipAddress: "192.168.1.110", notes: "Primary CI/CD agent host",
      checkpoints: [
        { id: "cp-101", name: "Pre-VS2022-BuildTools", createdAt: "2026-06-10 14:30", isCurrent: true },
        { id: "cp-100", name: "Base OS Install", createdAt: "2026-05-01 09:00" }
      ],
      integrationServices: { heartbeat: true, kvp: true, shutdown: true, timeSync: true, vss: true },
      historyCPU: [15, 22, 45, 28, 30, 24, 28], historyRAM: [62, 64, 70, 68, 65, 66, 68]
    },
    { 
      id: "vm2", name: "BUILD-AGENT-02", status: "Running", os: "Windows Server 2022", cpu: 41, memMB: 8192, uptime: "12d 4h",
      generation: 2, vCPUs: 4, vswitch: "NEXUS-External", vhdxPath: "C:\\Hyper-V\\Virtual Hard Disks\\BUILD-AGENT-02.vhdx", vhdxSizeGB: 120, dynamicMemory: true,
      ipAddress: "192.168.1.111", notes: "Secondary build agent",
      checkpoints: [
        { id: "cp-201", name: "Clean Snapshot", createdAt: "2026-06-01 10:00", isCurrent: true }
      ],
      integrationServices: { heartbeat: true, kvp: true, shutdown: true, timeSync: true, vss: true },
      historyCPU: [30, 35, 60, 52, 41, 38, 41], historyRAM: [50, 55, 60, 58, 62, 60, 61]
    },
    { 
      id: "vm3", name: "ANSIBLE-CTL", status: "Stopped", os: "Ubuntu 22.04 LTS", cpu: 0, memMB: 4096, uptime: "—",
      generation: 2, vCPUs: 2, vswitch: "Lab-Internal", vhdxPath: "C:\\Hyper-V\\Virtual Hard Disks\\ANSIBLE-CTL.vhdx", vhdxSizeGB: 60, dynamicMemory: false,
      ipAddress: "10.0.0.45", notes: "Linux configuration management control node",
      checkpoints: [],
      integrationServices: { heartbeat: false, kvp: true, shutdown: true, timeSync: true, vss: false },
      historyCPU: [0, 0, 0, 0, 0, 0, 0], historyRAM: [0, 0, 0, 0, 0, 0, 0]
    },
    { 
      id: "vm4", name: "JUMPBOX-DMZ", status: "Paused", os: "Windows Server 2019", cpu: 0, memMB: 2048, uptime: "—",
      generation: 1, vCPUs: 2, vswitch: "Isolated", vhdxPath: "C:\\Hyper-V\\Virtual Hard Disks\\JUMPBOX-DMZ.vhdx", vhdxSizeGB: 80, dynamicMemory: false,
      ipAddress: "172.16.10.5", notes: "DMZ admin jumpbox",
      checkpoints: [
        { id: "cp-401", name: "Hardened Baseline", createdAt: "2026-04-12 11:20", isCurrent: true }
      ],
      integrationServices: { heartbeat: true, kvp: true, shutdown: true, timeSync: true, vss: true },
      historyCPU: [10, 12, 0, 0, 0, 0, 0], historyRAM: [40, 42, 42, 42, 42, 42, 42]
    },
    { 
      id: "vm5", name: "TEST-SQL", status: "Saved", os: "Windows Server 2022", cpu: 0, memMB: 16384, uptime: "—",
      generation: 2, vCPUs: 8, vswitch: "Isolated", vhdxPath: "C:\\Hyper-V\\Virtual Hard Disks\\TEST-SQL.vhdx", vhdxSizeGB: 300, dynamicMemory: true,
      ipAddress: "172.16.10.20", notes: "SQL Server 2022 Staging DB",
      checkpoints: [
        { id: "cp-501", name: "Pre-Migration-Dump", createdAt: "2026-07-01 16:00", isCurrent: true }
      ],
      integrationServices: { heartbeat: true, kvp: true, shutdown: true, timeSync: true, vss: true },
      historyCPU: [0, 0, 0, 0, 0, 0, 0], historyRAM: [80, 80, 80, 80, 80, 80, 80]
    },
    { 
      id: "vm6", name: "DEV-DESKTOP", status: "Running", os: "Windows 11 Enterprise", cpu: 12, memMB: 8192, uptime: "3d 1h",
      generation: 2, vCPUs: 4, vswitch: "Lab-Internal", vhdxPath: "C:\\Hyper-V\\Virtual Hard Disks\\DEV-DESKTOP.vhdx", vhdxSizeGB: 150, dynamicMemory: true,
      ipAddress: "10.0.0.88", notes: "Remote workstation environment",
      checkpoints: [],
      integrationServices: { heartbeat: true, kvp: true, shutdown: true, timeSync: true, vss: true },
      historyCPU: [5, 18, 25, 14, 8, 11, 12], historyRAM: [45, 52, 58, 54, 50, 48, 51]
    }
  ]
};

export async function getVMs(s: string): Promise<HyperVVM[]> {
  await delay(200);
  const key = INITIAL_VMS[s] ? s : "nexus01";
  if (!INITIAL_VMS[key]) {
    INITIAL_VMS[key] = INITIAL_VMS.nexus01.map(v => ({ ...v }));
  }
  return INITIAL_VMS[key];
}

export async function controlVM(s: string, id: string, action: "start"|"stop"|"pause"|"checkpoint"|"turnoff"|"restart"|"save"|"delete"): Promise<boolean> {
  await delay(300);
  const list = await getVMs(s);
  const vm = list.find(v => v.id === id);
  if (!vm) return false;

  if (action === "start") {
    vm.status = "Running";
    vm.cpu = Math.floor(Math.random() * 20) + 5;
    vm.uptime = "0d 0h 1m";
  } else if (action === "stop" || action === "turnoff") {
    vm.status = "Stopped";
    vm.cpu = 0;
    vm.uptime = "—";
  } else if (action === "pause") {
    vm.status = "Paused";
    vm.cpu = 0;
  } else if (action === "save") {
    vm.status = "Saved";
    vm.cpu = 0;
  } else if (action === "restart") {
    vm.status = "Running";
    vm.cpu = Math.floor(Math.random() * 30) + 10;
    vm.uptime = "0d 0h 1m";
  } else if (action === "checkpoint") {
    if (!vm.checkpoints) vm.checkpoints = [];
    vm.checkpoints.unshift({
      id: "cp-" + Date.now(),
      name: `Snapshot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      isCurrent: true
    });
  } else if (action === "delete") {
    const idx = list.findIndex(v => v.id === id);
    if (idx !== -1) list.splice(idx, 1);
  }
  return true;
}

export async function createMockVM(s: string, config: { name: string; os?: string; memoryMb: number; vcpu: number; vswitch: string; vhdxSizeGb: number; generation?: 1|2; dynamicMemory?: boolean; isoPath?: string; notes?: string }): Promise<boolean> {
  await delay(400);
  const list = await getVMs(s);
  const newVm: HyperVVM = {
    id: "vm-" + Date.now(),
    name: config.name,
    status: "Stopped",
    os: config.os || "Windows Server 2022",
    cpu: 0,
    memMB: config.memoryMb,
    uptime: "—",
    generation: config.generation || 2,
    vCPUs: config.vcpu,
    vswitch: config.vswitch,
    vhdxPath: `C:\\Hyper-V\\Virtual Hard Disks\\${config.name}.vhdx`,
    vhdxSizeGB: config.vhdxSizeGb,
    dynamicMemory: config.dynamicMemory ?? true,
    isoPath: config.isoPath,
    notes: config.notes || "Newly deployed virtual machine",
    checkpoints: [],
    integrationServices: { heartbeat: true, kvp: true, shutdown: true, timeSync: true, vss: true },
    historyCPU: [0, 0, 0, 0, 0, 0, 0],
    historyRAM: [0, 0, 0, 0, 0, 0, 0]
  };
  list.unshift(newVm);
  return true;
}

export async function updateMockVMSettings(s: string, vmId: string, updates: Partial<HyperVVM>): Promise<boolean> {
  await delay(300);
  const list = await getVMs(s);
  const vm = list.find(v => v.id === vmId);
  if (!vm) return false;
  Object.assign(vm, updates);
  return true;
}

export async function checkpointMockVMAction(s: string, vmId: string, action: "create" | "apply" | "delete", snapshotIdOrName?: string): Promise<boolean> {
  await delay(300);
  const list = await getVMs(s);
  const vm = list.find(v => v.id === vmId);
  if (!vm) return false;

  if (!vm.checkpoints) vm.checkpoints = [];

  if (action === "create") {
    vm.checkpoints.forEach(c => c.isCurrent = false);
    vm.checkpoints.unshift({
      id: "cp-" + Date.now(),
      name: snapshotIdOrName || `Manual Checkpoint (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      isCurrent: true
    });
  } else if (action === "apply") {
    vm.checkpoints.forEach(c => c.isCurrent = (c.id === snapshotIdOrName || c.name === snapshotIdOrName));
  } else if (action === "delete") {
    vm.checkpoints = vm.checkpoints.filter(c => c.id !== snapshotIdOrName && c.name !== snapshotIdOrName);
  }
  return true;
}

// --- Virtual switches
export interface VirtualSwitch { 
  id: string; 
  name: string; 
  type: "External" | "Internal" | "Private"; 
  adapter?: string; 
  vms: string[]; 
  notes?: string;
  vlanId?: number;
  vlanMode?: "Untagged" | "Access" | "Trunk";
  sriovEnabled?: boolean;
  dhcpGuard?: boolean;
  routerGuard?: boolean;
  macSpoofing?: boolean;
  minBandwidthMbps?: number;
  maxBandwidthMbps?: number;
  allowManagementOS?: boolean;
  teamingMode?: "None" | "SwitchEmbeddedTeaming" | "LACP";
  trafficStats?: {
    rxMbps: number;
    txMbps: number;
    packetsPerSec: number;
    droppedPackets: number;
  };
}

const MOCK_VSWITCHES: Record<string, VirtualSwitch[]> = {
  nexus01: [
    { 
      id: "s1", name: "NEXUS-External", type: "External", adapter: "Intel(R) Ethernet Connection i219-LM (10GbE)", vms: ["BUILD-AGENT-01","BUILD-AGENT-02"], notes: "Physical LAN adapter bridged switch with SET teaming",
      vlanId: 10, vlanMode: "Access", sriovEnabled: true, dhcpGuard: true, routerGuard: true, macSpoofing: false, minBandwidthMbps: 100, maxBandwidthMbps: 10000, allowManagementOS: true, teamingMode: "SwitchEmbeddedTeaming",
      trafficStats: { rxMbps: 342.8, txMbps: 189.4, packetsPerSec: 42100, droppedPackets: 0 }
    },
    { 
      id: "s2", name: "Lab-Internal", type: "Internal", adapter: "Internal Host Adapter", vms: ["ANSIBLE-CTL", "DEV-DESKTOP"], notes: "Host-only isolated management network",
      vlanId: 20, vlanMode: "Access", sriovEnabled: false, dhcpGuard: true, routerGuard: false, macSpoofing: false, minBandwidthMbps: 0, maxBandwidthMbps: 1000, allowManagementOS: true, teamingMode: "None",
      trafficStats: { rxMbps: 12.4, txMbps: 8.2, packetsPerSec: 1450, droppedPackets: 0 }
    },
    { 
      id: "s3", name: "Isolated", type: "Private", vms: ["TEST-SQL","JUMPBOX-DMZ"], notes: "Private inter-VM isolated virtual switch",
      vlanId: undefined, vlanMode: "Untagged", sriovEnabled: false, dhcpGuard: false, routerGuard: false, macSpoofing: true, minBandwidthMbps: 0, maxBandwidthMbps: 0, allowManagementOS: false, teamingMode: "None",
      trafficStats: { rxMbps: 88.1, txMbps: 88.1, packetsPerSec: 9800, droppedPackets: 0 }
    },
  ]
};

export async function getVirtualSwitches(s: string): Promise<VirtualSwitch[]> {
  await delay(200);
  const key = MOCK_VSWITCHES[s] ? s : "nexus01";
  if (!MOCK_VSWITCHES[key]) {
    MOCK_VSWITCHES[key] = MOCK_VSWITCHES.nexus01.map(sw => ({ ...sw }));
  }
  return MOCK_VSWITCHES[key];
}

export async function createMockVirtualSwitch(s: string, config: { 
  name: string; 
  type: "External" | "Internal" | "Private"; 
  adapter?: string; 
  notes?: string;
  vlanId?: number;
  vlanMode?: "Untagged" | "Access" | "Trunk";
  sriovEnabled?: boolean;
  minBandwidthMbps?: number;
  maxBandwidthMbps?: number;
  allowManagementOS?: boolean;
  teamingMode?: "None" | "SwitchEmbeddedTeaming" | "LACP";
}): Promise<boolean> {
  await delay(300);
  const list = await getVirtualSwitches(s);
  list.push({
    id: "sw-" + Date.now(),
    name: config.name,
    type: config.type,
    adapter: config.adapter || (config.type === "External" ? "Broadcom NetXtreme Gigabit Ethernet" : undefined),
    vms: [],
    notes: config.notes || "Virtual Switch",
    vlanId: config.vlanId,
    vlanMode: config.vlanMode || (config.vlanId ? "Access" : "Untagged"),
    sriovEnabled: config.sriovEnabled ?? false,
    dhcpGuard: true,
    routerGuard: true,
    macSpoofing: false,
    minBandwidthMbps: config.minBandwidthMbps || 0,
    maxBandwidthMbps: config.maxBandwidthMbps || 0,
    allowManagementOS: config.allowManagementOS ?? (config.type !== "Private"),
    teamingMode: config.teamingMode || "None",
    trafficStats: { rxMbps: 0, txMbps: 0, packetsPerSec: 0, droppedPackets: 0 }
  });
  return true;
}

export async function renameMockVirtualSwitch(s: string, id: string, newName: string): Promise<boolean> {
  await delay(200);
  const list = await getVirtualSwitches(s);
  const sw = list.find(item => item.id === id);
  if (sw) {
    sw.name = newName;
    return true;
  }
  return false;
}

export async function updateMockVirtualSwitch(s: string, id: string, updates: Partial<VirtualSwitch>): Promise<boolean> {
  await delay(250);
  const list = await getVirtualSwitches(s);
  const sw = list.find(item => item.id === id);
  if (sw) {
    Object.assign(sw, updates);
    return true;
  }
  return false;
}

export async function attachVmToMockSwitch(s: string, switchId: string, vmName: string): Promise<boolean> {
  await delay(200);
  const list = await getVirtualSwitches(s);
  const sw = list.find(item => item.id === switchId);
  if (sw && !sw.vms.includes(vmName)) {
    sw.vms.push(vmName);
    return true;
  }
  return false;
}

export async function detachVmFromMockSwitch(s: string, switchId: string, vmName: string): Promise<boolean> {
  await delay(200);
  const list = await getVirtualSwitches(s);
  const sw = list.find(item => item.id === switchId);
  if (sw) {
    sw.vms = sw.vms.filter(v => v !== vmName);
    return true;
  }
  return false;
}

export async function deleteMockVirtualSwitch(s: string, id: string): Promise<boolean> {
  await delay(300);
  const list = await getVirtualSwitches(s);
  const idx = list.findIndex(sw => sw.id === id);
  if (idx !== -1) {
    list.splice(idx, 1);
    return true;
  }
  return false;
}

// --- Storage Replica
export interface ReplicaPartnership { 
  id: string; 
  name?: string;
  sourceServer: string; 
  sourceVol: string; 
  sourceLogVol?: string;
  destServer: string; 
  destVol: string; 
  destLogVol?: string;
  status: "Healthy" | "Syncing" | "Error" | "Paused" | "Initial Copy" | "Suspended"; 
  mode: "Synchronous" | "Asynchronous"; 
  replicationGroup?: string;
  lastSync: string; 
  bytes: number; 
  totalBytes: number;
  progress: number; 
  transferRateMbps?: number;
  latencyMs?: number;
  rpoSeconds?: number;
  autoFailover?: boolean;
  encryption?: boolean;
  logSizeGb?: number;
  healthDetails?: string;
}

let MOCK_REPLICA_PARTNERSHIPS: ReplicaPartnership[] = [
  { 
    id: "r1", 
    name: "FS01-to-FS02-DataVol",
    sourceServer: "FS01", 
    sourceVol: "G:", 
    sourceLogVol: "L:",
    destServer: "FS02", 
    destVol: "G:", 
    destLogVol: "L:",
    status: "Healthy",  
    mode: "Synchronous",  
    replicationGroup: "RG-FILESHARE-01",
    lastSync: new Date(Date.now() - 2 * 60 * 1000).toISOString(), 
    bytes: 524288000000, 
    totalBytes: 524288000000,
    progress: 100,
    transferRateMbps: 450,
    latencyMs: 1.2,
    rpoSeconds: 0,
    autoFailover: true,
    encryption: true,
    logSizeGb: 16,
    healthDetails: "Continuous zero-RPO block replication active across 10GbE inter-rack interconnect."
  },
  { 
    id: "r2", 
    name: "SQL01-to-SQL02-LogsAndDB",
    sourceServer: "SQL01", 
    sourceVol: "L:", 
    sourceLogVol: "M:",
    destServer: "SQL02", 
    destVol: "L:", 
    destLogVol: "M:",
    status: "Syncing", 
    mode: "Asynchronous", 
    replicationGroup: "RG-SQLCLUSTER-DR",
    lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(), 
    bytes: 340000000000, 
    totalBytes: 500000000000,
    progress: 68,
    transferRateMbps: 180,
    latencyMs: 12.4,
    rpoSeconds: 5,
    autoFailover: false,
    encryption: true,
    logSizeGb: 32,
    healthDetails: "Resyncing delta logs following scheduled WAN link maintenance."
  },
  { 
    id: "r3", 
    name: "DC01-to-DC02-SysVol",
    sourceServer: "DC01", 
    sourceVol: "S:", 
    sourceLogVol: "X:",
    destServer: "DC02", 
    destVol: "S:", 
    destLogVol: "X:",
    status: "Error",   
    mode: "Asynchronous", 
    replicationGroup: "RG-DOMAIN-DC02",
    lastSync: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), 
    bytes: 200000, 
    totalBytes: 100000000000,
    progress: 12,
    transferRateMbps: 0,
    latencyMs: 999,
    rpoSeconds: 86400,
    autoFailover: false,
    encryption: false,
    logSizeGb: 8,
    healthDetails: "Replication stream disconnected. Destination log volume G: full or unreachable."
  },
];

export async function getReplicaPartnerships(serverId?: string): Promise<ReplicaPartnership[]> {
  await delay(200);
  return MOCK_REPLICA_PARTNERSHIPS;
}

export async function createMockReplicaPartnership(config: {
  sourceServer: string;
  sourceVol: string;
  sourceLogVol?: string;
  destServer: string;
  destVol: string;
  destLogVol?: string;
  mode: "Synchronous" | "Asynchronous";
  replicationGroup?: string;
  logSizeGb?: number;
  encryption?: boolean;
}): Promise<boolean> {
  await delay(300);
  const newId = "r-" + Date.now();
  MOCK_REPLICA_PARTNERSHIPS.push({
    id: newId,
    name: `${config.sourceServer}-to-${config.destServer}-${config.sourceVol.replace(":", "")}`,
    sourceServer: config.sourceServer,
    sourceVol: config.sourceVol,
    sourceLogVol: config.sourceLogVol || "L:",
    destServer: config.destServer,
    destVol: config.destVol,
    destLogVol: config.destLogVol || "L:",
    status: "Initial Copy",
    mode: config.mode,
    replicationGroup: config.replicationGroup || `RG-${config.sourceServer}-${config.destServer}`,
    lastSync: new Date().toISOString(),
    bytes: 0,
    totalBytes: 250000000000,
    progress: 5,
    transferRateMbps: config.mode === "Synchronous" ? 350 : 120,
    latencyMs: config.mode === "Synchronous" ? 2.5 : 18.0,
    rpoSeconds: config.mode === "Synchronous" ? 0 : 30,
    autoFailover: false,
    encryption: config.encryption ?? true,
    logSizeGb: config.logSizeGb || 16,
    healthDetails: "Initial block copy in progress."
  });
  return true;
}

export async function swapMockReplicaDirection(id: string): Promise<boolean> {
  await delay(300);
  const p = MOCK_REPLICA_PARTNERSHIPS.find(item => item.id === id);
  if (p) {
    const prevSource = p.sourceServer;
    const prevSourceVol = p.sourceVol;
    const prevSourceLog = p.sourceLogVol;

    p.sourceServer = p.destServer;
    p.sourceVol = p.destVol;
    p.sourceLogVol = p.destLogVol;

    p.destServer = prevSource;
    p.destVol = prevSourceVol;
    p.destLogVol = prevSourceLog;

    p.name = `${p.sourceServer}-to-${p.destServer}-${p.sourceVol.replace(":", "")}`;
    p.lastSync = new Date().toISOString();
    p.healthDetails = "Replication direction reversed successfully.";
    return true;
  }
  return false;
}

export async function failoverMockReplica(id: string): Promise<boolean> {
  await delay(400);
  const p = MOCK_REPLICA_PARTNERSHIPS.find(item => item.id === id);
  if (p) {
    p.status = "Healthy";
    p.progress = 100;
    p.bytes = p.totalBytes;
    p.lastSync = new Date().toISOString();
    p.healthDetails = "Planned failover completed. Destination volume mounted read-write.";
    return true;
  }
  return false;
}

export async function toggleMockReplicaPause(id: string): Promise<boolean> {
  await delay(200);
  const p = MOCK_REPLICA_PARTNERSHIPS.find(item => item.id === id);
  if (p) {
    if (p.status === "Paused" || p.status === "Suspended") {
      p.status = "Healthy";
      p.healthDetails = "Replication stream resumed.";
    } else {
      p.status = "Paused";
      p.healthDetails = "Replication suspended by administrator.";
    }
    return true;
  }
  return false;
}

export async function deleteMockReplicaPartnership(id: string): Promise<boolean> {
  await delay(300);
  MOCK_REPLICA_PARTNERSHIPS = MOCK_REPLICA_PARTNERSHIPS.filter(p => p.id !== id);
  return true;
}

export async function updateMockReplicaPartnership(id: string, updates: Partial<ReplicaPartnership>): Promise<boolean> {
  await delay(250);
  const p = MOCK_REPLICA_PARTNERSHIPS.find(item => item.id === id);
  if (p) {
    Object.assign(p, updates);
    return true;
  }
  return false;
}

export async function resyncMockReplicaPartnership(id: string): Promise<boolean> {
  await delay(350);
  const p = MOCK_REPLICA_PARTNERSHIPS.find(item => item.id === id);
  if (p) {
    p.status = "Syncing";
    p.progress = 85;
    p.lastSync = new Date().toISOString();
    p.healthDetails = "Block resynchronization and consistency verification triggered.";
    return true;
  }
  return false;
}

// --- Plugins
export interface Plugin { id: string; name: string; author: string; version: string; category: "Security"|"Storage"|"Monitoring"|"Network"|"Management"|"Custom"; enabled: boolean; updateAvailable: boolean; description: string; }

// --- PowerShell
export interface PSResult { command: string; output: string; error?: string; }

// --- Server Settings
export interface ServerSettings { computerName: string; domain: string; timezone: string; locale: string; winrmEnabled: boolean; rdpEnabled: boolean; sshEnabled: boolean; updatePolicy: "Automatic"|"Download only"|"Notify"|"Manual"; activeHoursFrom: string; activeHoursTo: string; powerPlan: "Balanced"|"High Performance"|"Power Saver"; uacLevel: number; refreshInterval: 5|10|30|60; defaultServer: string; theme: "Signal Room"|"Pure Dark"|"Slate"|"Stealth"; sessionTimeout: number; }

// --- Mock File System Storage
export interface FileSource { name: string; type: string; path: string; }
export interface FileItem { name: string; type: string; size: number; modified: string; attrs: string; }

const MOCK_FILE_SOURCES: Record<string, FileSource[]> = {
  dc01: [
    { name: "C: (System)", type: "Disk", path: "C:" },
    { name: "D: (Data)", type: "Disk", path: "D:" },
    { name: "\\\\FS01\\SYSVOL", type: "Share", path: "\\\\FS01\\SYSVOL" },
    { name: "\\\\FS01\\NETLOGON", type: "Share", path: "\\\\FS01\\NETLOGON" },
    { name: "\\\\FS01\\CompanyDocs", type: "Share", path: "\\\\FS01\\CompanyDocs" },
  ],
  nexus01: [
    { name: "C: (System)", type: "Disk", path: "C:" },
    { name: "E: (Storage)", type: "Disk", path: "E:" },
    { name: "\\\\FS01\\CompanyDocs", type: "Share", path: "\\\\FS01\\CompanyDocs" },
    { name: "\\\\FS01\\Backups", type: "Share", path: "\\\\FS01\\Backups" },
  ]
};

const MOCK_FILE_TREE: Record<string, FileItem[]> = {
  "C:": [
    { name: "Windows", type: "folder", size: 0, modified: "2026-07-20 14:10", attrs: "d----" },
    { name: "Program Files", type: "folder", size: 0, modified: "2026-07-18 09:22", attrs: "d----" },
    { name: "Scripts", type: "folder", size: 0, modified: "2026-07-25 11:05", attrs: "d----" },
    { name: "Logs", type: "folder", size: 0, modified: "2026-07-26 03:45", attrs: "d----" },
    { name: "NexusWorker.ps1", type: "ps1", size: 3420, modified: "2026-07-25 18:30", attrs: "-a---" },
    { name: "server_config.json", type: "json", size: 1280, modified: "2026-07-24 10:15", attrs: "-a---" },
    { name: "backup_plan.md", type: "md", size: 850, modified: "2026-07-22 16:40", attrs: "-a---" },
  ],
  "C:\\Windows": [
    { name: "System32", type: "folder", size: 0, modified: "2026-07-20 14:10", attrs: "d----" },
    { name: "SysWOW64", type: "folder", size: 0, modified: "2026-07-20 14:10", attrs: "d----" },
    { name: "Logs", type: "folder", size: 0, modified: "2026-07-26 01:00", attrs: "d----" },
    { name: "explorer.exe", type: "exe", size: 4890000, modified: "2026-06-10 08:00", attrs: "-a--h" },
    { name: "win.ini", type: "ini", size: 512, modified: "2026-05-12 11:30", attrs: "-a---" },
  ],
  "C:\\Windows\\System32": [
    { name: "drivers", type: "folder", size: 0, modified: "2026-07-15 10:00", attrs: "d----" },
    { name: "inetsrv", type: "folder", size: 0, modified: "2026-07-18 12:30", attrs: "d----" },
    { name: "cmd.exe", type: "exe", size: 322000, modified: "2026-06-10 08:00", attrs: "-a---" },
    { name: "ntoskrnl.exe", type: "exe", size: 11200000, modified: "2026-06-10 08:00", attrs: "-a---" },
    { name: "hosts", type: "txt", size: 820, modified: "2026-07-21 09:14", attrs: "-a---" },
  ],
  "C:\\Scripts": [
    { name: "NexusWorker.ps1", type: "ps1", size: 3420, modified: "2026-07-25 18:30", attrs: "-a---" },
    { name: "HealthCheck.ps1", type: "ps1", size: 2150, modified: "2026-07-24 16:20", attrs: "-a---" },
    { name: "RotateLogs.ps1", type: "ps1", size: 1890, modified: "2026-07-23 09:10", attrs: "-a---" },
    { name: "deploy.bat", type: "bat", size: 640, modified: "2026-07-20 11:00", attrs: "-a---" },
    { name: "tasks_schedule.json", type: "json", size: 2450, modified: "2026-07-26 02:00", attrs: "-a---" },
  ],
  "C:\\Logs": [
    { name: "syslog_2026-07-26.log", type: "log", size: 48920, modified: "2026-07-26 04:05", attrs: "-a---" },
    { name: "nexus_gateway.log", type: "log", size: 128400, modified: "2026-07-26 04:08", attrs: "-a---" },
    { name: "iis_w3wp.log", type: "log", size: 85200, modified: "2026-07-26 03:50", attrs: "-a---" },
    { name: "audit_security.csv", type: "csv", size: 34100, modified: "2026-07-25 23:59", attrs: "-a---" },
  ],
  "D:": [
    { name: "Backups", type: "folder", size: 0, modified: "2026-07-25 02:00", attrs: "d----" },
    { name: "SQLData", type: "folder", size: 0, modified: "2026-07-26 00:30", attrs: "d----" },
    { name: "SharedDocs", type: "folder", size: 0, modified: "2026-07-24 15:45", attrs: "d----" },
    { name: "database_full_backup.bak", type: "bak", size: 4850000000, modified: "2026-07-25 02:30", attrs: "-a---" },
  ],
  "D:\\Backups": [
    { name: "DC01_SystemState_2026.zip", type: "zip", size: 1420000000, modified: "2026-07-25 02:15", attrs: "-a---" },
    { name: "NEXUS01_App_2026-07-24.zip", type: "zip", size: 890000000, modified: "2026-07-24 02:15", attrs: "-a---" },
    { name: "manifest.json", type: "json", size: 1120, modified: "2026-07-25 02:20", attrs: "-a---" },
  ],
  "\\\\FS01\\CompanyDocs": [
    { name: "IT Policies", type: "folder", size: 0, modified: "2026-07-10 10:00", attrs: "d----" },
    { name: "Architecture", type: "folder", size: 0, modified: "2026-07-22 14:00", attrs: "d----" },
    { name: "Infrastructure_Diagram.png", type: "png", size: 1420000, modified: "2026-07-18 16:30", attrs: "-a---" },
    { name: "Disaster_Recovery_Plan.md", type: "md", size: 12400, modified: "2026-07-24 11:20", attrs: "-a---" },
    { name: "Subnet_Allocation.csv", type: "csv", size: 4200, modified: "2026-07-25 09:15", attrs: "-a---" },
  ],
  "\\\\FS01\\SYSVOL": [
    { name: "nexuslab.local", type: "folder", size: 0, modified: "2026-07-01 08:00", attrs: "d----" },
    { name: "Policies", type: "folder", size: 0, modified: "2026-07-15 10:30", attrs: "d----" },
    { name: "scripts", type: "folder", size: 0, modified: "2026-07-20 09:10", attrs: "d----" },
    { name: "GPO_Map.xml", type: "xml", size: 18400, modified: "2026-07-21 15:00", attrs: "-a---" },
  ],
};

const MOCK_TEXT_CONTENTS: Record<string, string> = {
  "NexusWorker.ps1": `# NEXUS Server Management Worker Script
Param (
  [string]$ServerName = "DC01",
  [int]$IntervalSec = 30
)

Write-Host "Initializing NEXUS Management Agent on $ServerName..." -ForegroundColor Green
$Services = @("NexusGateway", "W3SVC", "MSSQLSERVER", "WinRM")

foreach ($svc in $Services) {
  $status = Get-Service -Name $svc -ErrorAction SilentlyContinue
  if ($status) {
    Write-Host "Service $svc is $($status.Status)" -ForegroundColor Cyan
  } else {
    Write-Host "Service $svc not installed." -ForegroundColor Yellow
  }
}

Write-Host "Health check completed successfully." -ForegroundColor Green`,

  "server_config.json": `{
  "ServerId": "DC01",
  "Domain": "nexuslab.local",
  "Environment": "Production",
  "ApiPort": 5010,
  "MaxWorkerThreads": 32,
  "EnableAuditLogging": true,
  "Storage": {
    "TelemetryPath": "C:\\\\Logs\\\\syslog_2026-07-26.log",
    "BackupLocation": "D:\\\\Backups"
  },
  "Security": {
    "TLSVersion": "1.3",
    "RequireMFA": true,
    "BitLockerEnforced": true
  }
}`,

  "backup_plan.md": `# NEXUS Infrastructure Backup Standard Operating Procedure

## Overview
Automated backup jobs run daily across Domain Controllers, SQL instances, and File Storage nodes.

## Backup Schedules
1. System State & Active Directory: Daily at 01:00 AM (DC01_SystemState_*.zip)
2. SQL Database Transaction Logs: Every 15 minutes to D:\\SQLData
3. Full SQL Dump: Daily at 02:30 AM (database_full_backup.bak)
4. Volume Replication: Real-time Storage Replica synchronous mirror on G: drive

## Verification Checklist
- [x] Test restore on isolated sandbox VM
- [x] Confirm AES-256 BitLocker encryption on backup targets
- [x] Validate checksum hashes against manifest.json`,

  "syslog_2026-07-26.log": `2026-07-26 04:00:00 [INFO] NEXUS Agent Service started (PID 9024).
2026-07-26 04:00:12 [INFO] Listening for HTTP/2 management connections on port 5010.
2026-07-26 04:01:05 [INFO] Authenticated user 'NEXUSLAB\\Administrator' via Kerberos ticket.
2026-07-26 04:02:18 [WARN] Memory utilization reached 78% on node DC01.
2026-07-26 04:03:45 [INFO] CHKDSK diagnostic executed on Volume C: - 0 bad sectors found.
2026-07-26 04:05:00 [INFO] Storage Replica partnership 'r1' status: Synchronous Healthy.`,

  "hosts": `# Copyright (c) 1993-2009 Microsoft Corp.
127.0.0.1       localhost
::1             localhost
192.168.0.10    dc01.nexuslab.local dc01
192.168.0.20    nexus01.nexuslab.local nexus01
192.168.0.30    sql01.nexuslab.local sql01
192.168.0.40    web01.nexuslab.local web01
192.168.0.50    fs01.nexuslab.local fs01`,

  "GPO_Map.xml": `<?xml version="1.0" encoding="utf-8"?>
<GroupPolicyObjectsDomain domain="nexuslab.local">
  <GPO name="Default Domain Policy" id="{31B2F340-016D-11D2-945F-00C04FB984F9}" status="Enabled">
    <Setting category="PasswordPolicy" minLength="14" maxAgeDays="90" history="24" />
    <Setting category="AccountLockout" threshold="5" durationMinutes="30" />
  </GPO>
  <GPO name="NEXUS Server Hardening SOP" id="{89A2E101-44B2-4211-A89D-1189FF1109A2}" status="Enabled">
    <Setting category="Firewall" profile="Domain" state="On" />
    <Setting category="BitLocker" requireEncryption="True" method="AES256" />
  </GPO>
</GroupPolicyObjectsDomain>`
};

export function getMockFilesSources(server: string): FileSource[] {
  return MOCK_FILE_SOURCES[server] || MOCK_FILE_SOURCES.dc01;
}

export function getMockFilesList(_server: string, path: string): FileItem[] {
  const norm = path.replace(/[\/\\]+/g, "\\").replace(/\\$/, "");
  if (MOCK_FILE_TREE[norm]) return MOCK_FILE_TREE[norm];
  
  // Return intelligent default if path is subfolder or custom
  return [
    { name: "readme.txt", type: "txt", size: 450, modified: new Date().toISOString().slice(0, 16).replace("T", " "), attrs: "-a---" },
    { name: "settings.json", type: "json", size: 1024, modified: new Date().toISOString().slice(0, 16).replace("T", " "), attrs: "-a---" }
  ];
}

export function createMockFolder(_server: string, path: string, name: string): void {
  const norm = path.replace(/[\/\\]+/g, "\\").replace(/\\$/, "");
  if (!MOCK_FILE_TREE[norm]) MOCK_FILE_TREE[norm] = [];
  MOCK_FILE_TREE[norm].push({
    name,
    type: "folder",
    size: 0,
    modified: new Date().toISOString().slice(0, 16).replace("T", " "),
    attrs: "d----"
  });
}

export function deleteMockFile(_server: string, path: string): void {
  const parts = path.split("\\");
  const fileName = parts.pop();
  const parent = parts.join("\\");
  if (MOCK_FILE_TREE[parent]) {
    MOCK_FILE_TREE[parent] = MOCK_FILE_TREE[parent].filter(f => f.name !== fileName);
  }
}

export function renameMockFile(_server: string, path: string, newName: string): void {
  const parts = path.split("\\");
  const fileName = parts.pop();
  const parent = parts.join("\\");
  if (MOCK_FILE_TREE[parent]) {
    const item = MOCK_FILE_TREE[parent].find(f => f.name === fileName);
    if (item) item.name = newName;
  }
}

export function readMockTextFile(_server: string, path: string): string {
  const parts = path.split("\\");
  const fileName = parts.pop() || "";
  if (MOCK_TEXT_CONTENTS[fileName]) return MOCK_TEXT_CONTENTS[fileName];
  return `# Contents of ${path}\n# Generated by NEXUS Management Agent\nCreated at: ${new Date().toISOString()}\nStatus: Normal`;
}

export function writeMockTextFile(_server: string, path: string, content: string): void {
  const parts = path.split("\\");
  const fileName = parts.pop() || "";
  const parent = parts.join("\\");
  MOCK_TEXT_CONTENTS[fileName] = content;
  if (MOCK_FILE_TREE[parent] && !MOCK_FILE_TREE[parent].some(f => f.name === fileName)) {
    const ext = fileName.includes(".") ? fileName.split(".").pop() || "txt" : "txt";
    MOCK_FILE_TREE[parent].push({
      name: fileName,
      type: ext,
      size: content.length,
      modified: new Date().toISOString().slice(0, 16).replace("T", " "),
      attrs: "-a---"
    });
  }
}

export function getMockRoles(serverId: string): WindowsRole[] {
  const key = `NEXUS_ROLES_${serverId || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to read roles from localStorage", e);
  }
  return [...INITIAL_WINDOWS_ROLES];
}

export function installMockRole(serverId: string, name: string): boolean {
  const roles = getMockRoles(serverId);
  const idx = roles.findIndex((r) => r.name.toLowerCase() === name.toLowerCase());
  if (idx !== -1) {
    roles[idx].installState = "Installed";
    // Also auto-install child features or dependencies if present
    const item = roles[idx];
    if (item.dependencies) {
      item.dependencies.forEach((dep) => {
        const dIdx = roles.findIndex((r) => r.name.toLowerCase() === dep.toLowerCase());
        if (dIdx !== -1) roles[dIdx].installState = "Installed";
      });
    }
    // Auto install children
    roles.forEach((r) => {
      if (r.parentName === item.name) r.installState = "Installed";
    });

    const key = `NEXUS_ROLES_${serverId || "dc01"}`;
    localStorage.setItem(key, JSON.stringify(roles));
    return true;
  }
  return false;
}

export function uninstallMockRole(serverId: string, name: string): boolean {
  const roles = getMockRoles(serverId);
  const idx = roles.findIndex((r) => r.name.toLowerCase() === name.toLowerCase());
  if (idx !== -1) {
    roles[idx].installState = "Available";
    // Uninstall children
    const item = roles[idx];
    roles.forEach((r) => {
      if (r.parentName === item.name) r.installState = "Available";
    });

    const key = `NEXUS_ROLES_${serverId || "dc01"}`;
    localStorage.setItem(key, JSON.stringify(roles));
    return true;
  }
  return false;
}

export interface WindowsRole {
  name: string;
  displayName: string;
  installState: string;
  featureType: string;
  category?: string;
  description?: string;
  restartRequired?: boolean;
  parentName?: string;
  dependencies?: string[];
}

export const INITIAL_WINDOWS_ROLES: WindowsRole[] = [
  {
    name: "AD-Domain-Services",
    displayName: "Active Directory Domain Services",
    installState: "Installed",
    featureType: "Role",
    category: "Active Directory",
    description: "Provides a distributed database for storing and managing information about network resources and user accounts.",
    restartRequired: true,
    dependencies: ["DNS", "RSAT-ADDS"]
  },
  {
    name: "DNS",
    displayName: "DNS Server",
    installState: "Installed",
    featureType: "Role",
    category: "Networking",
    description: "Resolves hostnames to IP addresses and manages domain name zone records across the enterprise.",
    restartRequired: false
  },
  {
    name: "DHCP",
    displayName: "DHCP Server",
    installState: "Installed",
    featureType: "Role",
    category: "Networking",
    description: "Automatically provisions IP addresses, subnet masks, default gateways, and DNS settings to network devices.",
    restartRequired: false
  },
  {
    name: "Web-Server",
    displayName: "Web Server (IIS)",
    installState: "Installed",
    featureType: "Role",
    category: "Web / IIS",
    description: "Provides a secure, manageable, and scalable infrastructure for hosting websites, services, and web applications.",
    restartRequired: false,
    dependencies: ["Web-Mgmt-Tools", "NET-Framework-45-Features"]
  },
  {
    name: "Web-Mgmt-Tools",
    displayName: "IIS Management Tools",
    installState: "Installed",
    featureType: "Feature",
    category: "Web / IIS",
    parentName: "Web-Server",
    description: "Includes IIS Management Console, management scripts, and remote administration tools."
  },
  {
    name: "Web-Common-Http",
    displayName: "Common HTTP Features",
    installState: "Installed",
    featureType: "Feature",
    category: "Web / IIS",
    parentName: "Web-Server",
    description: "Provides static content publishing, default document handling, directory browsing, and custom HTTP errors."
  },
  {
    name: "Hyper-V",
    displayName: "Hyper-V Virtualization",
    installState: "Available",
    featureType: "Role",
    category: "Virtualization",
    description: "Provides services and management infrastructure to create and manage hardware-virtualized machines.",
    restartRequired: true,
    dependencies: ["Hyper-V-Tools"]
  },
  {
    name: "Hyper-V-Tools",
    displayName: "Hyper-V Management Tools",
    installState: "Available",
    featureType: "Feature",
    category: "Virtualization",
    parentName: "Hyper-V",
    description: "Includes Hyper-V Manager MMC snap-in and PowerShell Hyper-V module."
  },
  {
    name: "FileAndStorage-Services",
    displayName: "File and Storage Services",
    installState: "Installed",
    featureType: "Role",
    category: "Storage",
    description: "Includes technologies that help set up and manage file servers, network shares, and storage arrays."
  },
  {
    name: "FS-FileServer",
    displayName: "File Server",
    installState: "Installed",
    featureType: "Feature",
    category: "Storage",
    parentName: "FileAndStorage-Services",
    description: "Manages network shared folders and enables file access over SMB and NFS protocols."
  },
  {
    name: "FS-DFS-Namespace",
    displayName: "DFS Namespaces",
    installState: "Available",
    featureType: "Feature",
    category: "Storage",
    parentName: "FileAndStorage-Services",
    description: "Enables grouping of shared folders located on different servers into one logically structured namespace."
  },
  {
    name: "Remote-Desktop-Services",
    displayName: "Remote Desktop Services (RDS)",
    installState: "Available",
    featureType: "Role",
    category: "Remote Access",
    description: "Allows users to connect to virtual desktops, RemoteApp programs, and session-based desktops.",
    restartRequired: true
  },
  {
    name: "Failover-Clustering",
    displayName: "Failover Clustering",
    installState: "Available",
    featureType: "Feature",
    category: "High Availability",
    description: "Allows multiple servers to work together to provide high availability and failover for critical applications.",
    restartRequired: false
  },
  {
    name: "BitLocker",
    displayName: "BitLocker Drive Encryption",
    installState: "Installed",
    featureType: "Feature",
    category: "Security",
    description: "Protects data on volume drives by providing full volume hardware or software encryption.",
    restartRequired: true
  },
  {
    name: "Windows-Defender",
    displayName: "Windows Defender Antivirus",
    installState: "Installed",
    featureType: "Feature",
    category: "Security",
    description: "Provides real-time protection against spyware, malware, viruses, and security threats."
  },
  {
    name: "UpdateServices",
    displayName: "Windows Server Update Services (WSUS)",
    installState: "Available",
    featureType: "Role",
    category: "Management",
    description: "Allows IT administrators to deploy the latest Microsoft product updates across domain computers.",
    restartRequired: true
  },
  {
    name: "RSAT",
    displayName: "Remote Server Administration Tools (RSAT)",
    installState: "Installed",
    featureType: "Feature",
    category: "Management",
    description: "Includes MMC snap-ins, PowerShell modules, command-line tools, and utilities for remote Windows Server administration."
  },
  {
    name: "NET-Framework-45-Features",
    displayName: ".NET Framework 4.8 Features",
    installState: "Installed",
    featureType: "Feature",
    category: "Frameworks",
    description: "Supports running and building legacy and enterprise .NET applications."
  },
  {
    name: "Telnet-Client",
    displayName: "Telnet Client",
    installState: "Available",
    featureType: "Feature",
    category: "Networking",
    description: "Allows local computer to connect to a remote Telnet server over TCP/IP port 23."
  },
  {
    name: "Web-WMI",
    displayName: "IIS Management Scripts and Tools",
    installState: "Installed",
    featureType: "Feature",
    category: "Web / IIS",
    parentName: "Web-Server",
    description: "Provides programmatic WMI interface and PowerShell scripting support for IIS web server configurations."
  }
];

export function addMockNetworkShare(server: string, name: string, uncPath: string): FileSource {
  if (!MOCK_FILE_SOURCES[server]) MOCK_FILE_SOURCES[server] = [...MOCK_FILE_SOURCES.dc01];
  const shareSource: FileSource = { name: `\\\\${name}`, type: "Share", path: uncPath };
  MOCK_FILE_SOURCES[server].push(shareSource);
  if (!MOCK_FILE_TREE[uncPath]) {
    MOCK_FILE_TREE[uncPath] = [
      { name: "Share_Info.txt", type: "txt", size: 240, modified: new Date().toISOString().slice(0, 16).replace("T", " "), attrs: "-a---" },
      { name: "Docs", type: "folder", size: 0, modified: new Date().toISOString().slice(0, 16).replace("T", " "), attrs: "d----" }
    ];
  }
  return shareSource;
}

export interface WindowsUpdate {
  title: string;
  description: string;
  maxDownloadSize: number;
  kbArticleId?: string;
  category?: "Security" | "Critical" | "Cumulative" | "Definition" | "Driver" | "Feature" | "Tool";
  severity?: "Critical" | "Important" | "Moderate" | "Low" | "Optional";
  rebootRequired?: boolean;
  publishDate?: string;
  supportUrl?: string;
}

export interface UpdateHistoryItem {
  id: string;
  title: string;
  kbArticleId: string;
  category: string;
  installedOn: string;
  installedBy: string;
  result: "Succeeded" | "Failed" | "In Progress";
  durationSeconds: number;
  serverIp: string;
}

export const INITIAL_WINDOWS_UPDATES: WindowsUpdate[] = [
  {
    title: "2026-07 Cumulative Update for Windows Server 2025 x64-based Systems (KB5034441)",
    description: "A security update is available that resolves vulnerabilities in Microsoft Windows. Includes system reliability improvements and security patches.",
    maxDownloadSize: 684212224,
    kbArticleId: "KB5034441",
    category: "Cumulative",
    severity: "Critical",
    rebootRequired: true,
    publishDate: "2026-07-14",
    supportUrl: "https://support.microsoft.com/help/5034441"
  },
  {
    title: "Security Intelligence Update for Microsoft Defender Antivirus - KB5034129 (Version 1.403.112)",
    description: "Updates the malware definition database and heuristics detection signatures for Microsoft Defender Antivirus engine.",
    maxDownloadSize: 84200100,
    kbArticleId: "KB5034129",
    category: "Definition",
    severity: "Critical",
    rebootRequired: false,
    publishDate: "2026-07-20",
    supportUrl: "https://support.microsoft.com/help/5034129"
  },
  {
    title: "2026-06 Security Update for .NET Framework 4.8.1 for Windows Server 2025 (KB5033920)",
    description: "A security issue has been identified in .NET Framework that could allow an unauthenticated attacker to cause remote code execution.",
    maxDownloadSize: 142500000,
    kbArticleId: "KB5033920",
    category: "Security",
    severity: "Important",
    rebootRequired: true,
    publishDate: "2026-06-25",
    supportUrl: "https://support.microsoft.com/help/5033920"
  },
  {
    title: "Critical Security Patch for OpenSSL & WinRM Transport Layer (KB5035520)",
    description: "Mitigates zero-day transport encryption vulnerabilities in WinRM over HTTPS and TLS 1.3 server handshake procedures.",
    maxDownloadSize: 320120000,
    kbArticleId: "KB5035520",
    category: "Critical",
    severity: "Critical",
    rebootRequired: true,
    publishDate: "2026-07-22",
    supportUrl: "https://support.microsoft.com/help/5035520"
  },
  {
    title: "Windows Malicious Software Removal Tool x64 - v5.121 (KB5032288)",
    description: "After the download, this tool runs once to check your computer for infection by specific, prevalent malicious software.",
    maxDownloadSize: 52428800,
    kbArticleId: "KB5032288",
    category: "Tool",
    severity: "Moderate",
    rebootRequired: false,
    publishDate: "2026-07-01",
    supportUrl: "https://support.microsoft.com/help/5032288"
  },
  {
    title: "Intel - Driver Update for Intel(R) Ethernet Server Adapter I350-T4 (v28.2)",
    description: "Provides updated network interface controller firmware and driver optimizations for PCIe v3.0 throughput on Windows Server.",
    maxDownloadSize: 18874368,
    kbArticleId: "KB5031044",
    category: "Driver",
    severity: "Optional",
    rebootRequired: false,
    publishDate: "2026-05-18",
    supportUrl: "https://support.microsoft.com/help/5031044"
  }
];

export const INITIAL_UPDATE_HISTORY: UpdateHistoryItem[] = [
  {
    id: "hist-001",
    title: "2026-06 Cumulative Update for Windows Server 2025 x64 (KB5033100)",
    kbArticleId: "KB5033100",
    category: "Cumulative",
    installedOn: "2026-06-15 03:14",
    installedBy: "NEXUS Orchestrator (SYSTEM)",
    result: "Succeeded",
    durationSeconds: 142,
    serverIp: "dc01"
  },
  {
    id: "hist-002",
    title: "Security Update for Microsoft Exchange Server 2019 CU14 (KB5032140)",
    kbArticleId: "KB5032140",
    category: "Security",
    installedOn: "2026-06-10 01:45",
    installedBy: "DomainAdmin@NEXUS.LOCAL",
    result: "Succeeded",
    durationSeconds: 210,
    serverIp: "dc01"
  },
  {
    id: "hist-003",
    title: "Windows Defender Antivirus Intelligence Update (KB2267602)",
    kbArticleId: "KB2267602",
    category: "Definition",
    installedOn: "2026-07-05 08:00",
    installedBy: "SYSTEM",
    result: "Succeeded",
    durationSeconds: 18,
    serverIp: "dc01"
  },
  {
    id: "hist-004",
    title: "Out-of-Band Security Fix for Hyper-V Virtualization Layer (KB5031900)",
    kbArticleId: "KB5031900",
    category: "Critical",
    installedOn: "2026-05-28 22:30",
    installedBy: "DomainAdmin@NEXUS.LOCAL",
    result: "Succeeded",
    durationSeconds: 88,
    serverIp: "dc01"
  }
];

export function getMockUpdates(serverIp: string): WindowsUpdate[] {
  const key = `NEXUS_UPDATES_${serverIp || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to read updates from localStorage", e);
  }
  return [...INITIAL_WINDOWS_UPDATES];
}

export function checkMockUpdates(serverIp: string): WindowsUpdate[] {
  // Simulate WSUS refresh by restoring or appending updates if empty
  const current = getMockUpdates(serverIp);
  let updatedList = current;
  if (current.length === 0) {
    updatedList = [...INITIAL_WINDOWS_UPDATES];
  }
  const key = `NEXUS_UPDATES_${serverIp || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(updatedList));
  return updatedList;
}

export function installMockUpdates(serverIp: string, titles: string[]): boolean {
  const current = getMockUpdates(serverIp);
  const remaining = current.filter((u) => !titles.includes(u.title));

  const key = `NEXUS_UPDATES_${serverIp || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(remaining));

  // Add to history
  const historyKey = `NEXUS_UPDATE_HISTORY_${serverIp || "dc01"}`;
  let historyList: UpdateHistoryItem[] = [];
  try {
    const savedHist = localStorage.getItem(historyKey);
    if (savedHist) historyList = JSON.parse(savedHist);
    else historyList = [...INITIAL_UPDATE_HISTORY];
  } catch {
    historyList = [...INITIAL_UPDATE_HISTORY];
  }

  titles.forEach((title) => {
    const matched = current.find((u) => u.title === title);
    historyList.unshift({
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: title,
      kbArticleId: matched?.kbArticleId || "KB" + Math.floor(1000000 + Math.random() * 9000000),
      category: matched?.category || "Security",
      installedOn: new Date().toISOString().slice(0, 16).replace("T", " "),
      installedBy: "NEXUS Admin Agent",
      result: "Succeeded",
      durationSeconds: Math.floor(30 + Math.random() * 90),
      serverIp: serverIp || "dc01"
    });
  });

  localStorage.setItem(historyKey, JSON.stringify(historyList));
  return true;
}

export function getMockUpdateHistory(serverIp: string): UpdateHistoryItem[] {
  const historyKey = `NEXUS_UPDATE_HISTORY_${serverIp || "dc01"}`;
  try {
    const savedHist = localStorage.getItem(historyKey);
    if (savedHist) {
      const parsed = JSON.parse(savedHist);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to read update history", e);
  }
  return [...INITIAL_UPDATE_HISTORY];
}

// --- RDP Active Sessions & Security
export interface RdpSession {
  sessionId: string;
  sessionName: string;
  userName: string;
  domain: string;
  state: "Active" | "Disconnected" | "Idle" | "Listen";
  clientIp: string;
  clientName: string;
  logonTime: string;
  idleTime: string;
  protocol: string;
  encryptionLevel: string;
}

export interface RdpSecurityConfig {
  rdpPort: number;
  nlaRequired: boolean;
  tlsEnforced: boolean;
  maxIdleTimeoutMins: number;
  maxDisconnectedTimeoutMins: number;
  shadowingPolicy: "Allowed with permission" | "Allowed without permission" | "View only" | "Disabled";
  firewallRuleEnabled: boolean;
  allowedSecurityGroups: string[];
}

export const INITIAL_RDP_SESSIONS: Record<string, RdpSession[]> = {
  dc01: [
    {
      sessionId: "1",
      sessionName: "rdp-tcp#0",
      userName: "Administrator",
      domain: "NEXUS",
      state: "Active",
      clientIp: "10.0.0.45",
      clientName: "ADMIN-LAPTOP-01",
      logonTime: "2026-07-26 01:12",
      idleTime: "00:02:15",
      protocol: "RDP 10.1 (AVC444)",
      encryptionLevel: "FIPS 140-2 (TLS 1.3)"
    },
    {
      sessionId: "2",
      sessionName: "rdp-tcp#1",
      userName: "mwilson",
      domain: "NEXUS",
      state: "Active",
      clientIp: "10.0.0.88",
      clientName: "SEC-STATION-02",
      logonTime: "2026-07-26 03:45",
      idleTime: "00:00:10",
      protocol: "RDP 10.1 (RemoteFX)",
      encryptionLevel: "High 128-bit"
    },
    {
      sessionId: "3",
      sessionName: "rdp-tcp#2",
      userName: "jsmith",
      domain: "NEXUS",
      state: "Disconnected",
      clientIp: "192.168.1.102",
      clientName: "HOME-PC",
      logonTime: "2026-07-25 18:20",
      idleTime: "09:14:30",
      protocol: "RDP 10.0",
      encryptionLevel: "High 128-bit"
    },
    {
      sessionId: "65536",
      sessionName: "services",
      userName: "SYSTEM",
      domain: "NT AUTHORITY",
      state: "Listen",
      clientIp: "127.0.0.1",
      clientName: "Localhost",
      logonTime: "2026-07-10 00:00",
      idleTime: "00:00:00",
      protocol: "RDP Listener",
      encryptionLevel: "TLS 1.3"
    }
  ],
  nexus01: [
    {
      sessionId: "1",
      sessionName: "rdp-tcp#0",
      userName: "sysadmin",
      domain: "NEXUS",
      state: "Active",
      clientIp: "10.0.2.14",
      clientName: "MGMT-WRK-01",
      logonTime: "2026-07-26 02:00",
      idleTime: "00:01:00",
      protocol: "RDP 10.1",
      encryptionLevel: "FIPS 140-2"
    }
  ]
};

export function getMockRdpSessions(serverIp: string): RdpSession[] {
  const key = `NEXUS_RDP_SESSIONS_${serverIp || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to read RDP sessions", e);
  }
  const defaultList = INITIAL_RDP_SESSIONS[serverIp || "dc01"] || INITIAL_RDP_SESSIONS["dc01"];
  return [...defaultList];
}

export function disconnectMockRdpSession(serverIp: string, sessionId: string): boolean {
  const current = getMockRdpSessions(serverIp);
  const updated = current.map((s) => (s.sessionId === sessionId ? { ...s, state: "Disconnected" as const } : s));
  const key = `NEXUS_RDP_SESSIONS_${serverIp || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(updated));
  return true;
}

export function logoffMockRdpSession(serverIp: string, sessionId: string): boolean {
  const current = getMockRdpSessions(serverIp);
  const updated = current.filter((s) => s.sessionId !== sessionId);
  const key = `NEXUS_RDP_SESSIONS_${serverIp || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(updated));
  return true;
}

export function sendMessageMockRdpSession(serverIp: string, sessionId: string, messageText: string): boolean {
  console.log(`[RDP MSG] Sent to session ${sessionId} on ${serverIp}: "${messageText}"`);
  return true;
}

export function getMockRdpConfig(serverIp: string): RdpSecurityConfig {
  const key = `NEXUS_RDP_CONFIG_${serverIp || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to read RDP config", e);
  }
  return {
    rdpPort: 3389,
    nlaRequired: true,
    tlsEnforced: true,
    maxIdleTimeoutMins: 60,
    maxDisconnectedTimeoutMins: 120,
    shadowingPolicy: "Allowed with permission",
    firewallRuleEnabled: true,
    allowedSecurityGroups: ["Remote Desktop Users", "Domain Admins", "NEXUS-Ops-Admins"]
  };
}

export function updateMockRdpConfig(serverIp: string, config: Partial<RdpSecurityConfig>): RdpSecurityConfig {
  const current = getMockRdpConfig(serverIp);
  const updated = { ...current, ...config };
  const key = `NEXUS_RDP_CONFIG_${serverIp || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

// --- Windows Defender Antivirus & Endpoint Protection
export interface DefenderStatus {
  realTimeProtectionEnabled: boolean;
  cloudProtectionEnabled: boolean;
  automaticSampleSubmission: "Always" | "Prompt" | "Never";
  behavioralMonitoringEnabled: boolean;
  tamperProtectionEnabled: boolean;
  scriptScanningEnabled: boolean;
  antivirusSignatureVersion: string;
  antivirusSignatureLastUpdated: string;
  engineVersion: string;
  platformVersion: string;
  lastQuickScanTime: string;
  lastFullScanTime: string;
  quickScanDurationSec: number;
  fullScanDurationSec: number;
  isScanning: boolean;
  scanTypeRunning?: "Quick" | "Full" | "Custom";
  scanProgressPct?: number;
  threatsActiveCount: number;
  threatsQuarantinedCount: number;
  controlledFolderAccess: "Enabled" | "Disabled" | "AuditMode";
}

export interface DefenderThreat {
  id: string;
  threatName: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  category: "Trojan" | "Ransomware" | "Adware" | "PUP" | "Exploit" | "Spyware";
  filePath: string;
  processName: string;
  status: "Active" | "Quarantined" | "Removed" | "Allowed" | "Blocked";
  detectionTime: string;
  sha256Hash: string;
  actionTaken: "Quarantined" | "Cleaned" | "Blocked" | "Pending Action";
}

export interface DefenderExclusion {
  id: string;
  type: "Folder" | "File" | "Extension" | "Process";
  value: string;
  dateAdded: string;
  addedBy: string;
}

export interface DefenderAsrRule {
  id: string;
  ruleName: string;
  guid: string;
  state: "Block" | "Audit" | "Disabled";
  description: string;
}

export const INITIAL_DEFENDER_STATUS: Record<string, DefenderStatus> = {
  dc01: {
    realTimeProtectionEnabled: true,
    cloudProtectionEnabled: true,
    automaticSampleSubmission: "Always",
    behavioralMonitoringEnabled: true,
    tamperProtectionEnabled: true,
    scriptScanningEnabled: true,
    antivirusSignatureVersion: "1.415.120.0",
    antivirusSignatureLastUpdated: "2026-07-26 02:15",
    engineVersion: "1.1.24060.7",
    platformVersion: "4.18.24060.7",
    lastQuickScanTime: "2026-07-26 01:00",
    lastFullScanTime: "2026-07-24 23:00",
    quickScanDurationSec: 42,
    fullScanDurationSec: 1840,
    isScanning: false,
    threatsActiveCount: 0,
    threatsQuarantinedCount: 2,
    controlledFolderAccess: "Enabled"
  },
  nexus01: {
    realTimeProtectionEnabled: true,
    cloudProtectionEnabled: true,
    automaticSampleSubmission: "Prompt",
    behavioralMonitoringEnabled: true,
    tamperProtectionEnabled: true,
    scriptScanningEnabled: true,
    antivirusSignatureVersion: "1.415.118.0",
    antivirusSignatureLastUpdated: "2026-07-25 18:30",
    engineVersion: "1.1.24060.7",
    platformVersion: "4.18.24060.7",
    lastQuickScanTime: "2026-07-25 09:30",
    lastFullScanTime: "2026-07-20 12:00",
    quickScanDurationSec: 38,
    fullScanDurationSec: 1620,
    isScanning: false,
    threatsActiveCount: 1,
    threatsQuarantinedCount: 3,
    controlledFolderAccess: "AuditMode"
  }
};

export const INITIAL_DEFENDER_THREATS: Record<string, DefenderThreat[]> = {
  dc01: [
    {
      id: "thr-101",
      threatName: "Win32/Mimikatz.A!dha",
      severity: "Critical",
      category: "Exploit",
      filePath: "C:\\Windows\\Temp\\debug_lsass.dmp",
      processName: "powershell.exe",
      status: "Quarantined",
      detectionTime: "2026-07-25 22:14",
      sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      actionTaken: "Quarantined"
    },
    {
      id: "thr-102",
      threatName: "PUA:Win32/SoftonicBundler",
      severity: "Low",
      category: "PUP",
      filePath: "C:\\Users\\Administrator\\Downloads\\tool_installer.exe",
      processName: "chrome.exe",
      status: "Quarantined",
      detectionTime: "2026-07-24 16:05",
      sha256Hash: "2a8e3f9104b281726a401c90038411b23908f1e29851726a911029e87f12bc81",
      actionTaken: "Quarantined"
    }
  ],
  nexus01: [
    {
      id: "thr-201",
      threatName: "Ransom:Win32/WannaCrypt.A",
      severity: "Critical",
      category: "Ransomware",
      filePath: "C:\\Shares\\Public\\receipt_doc_encrypt.exe",
      processName: "cmd.exe",
      status: "Active",
      detectionTime: "2026-07-26 03:22",
      sha256Hash: "84c82835a5d21bbcf75a61706d8ab549022e1219f6a0a0417f21678b688c2462",
      actionTaken: "Pending Action"
    },
    {
      id: "thr-202",
      threatName: "Trojan:Win32/Powload.BN",
      severity: "High",
      category: "Trojan",
      filePath: "C:\\Scripts\\temp\\drop.ps1",
      processName: "powershell.exe",
      status: "Quarantined",
      detectionTime: "2026-07-23 11:40",
      sha256Hash: "11984bc008272f10928a381c810e9823b18274191028e18291028e8191283182",
      actionTaken: "Quarantined"
    }
  ]
};

export const INITIAL_DEFENDER_EXCLUSIONS: Record<string, DefenderExclusion[]> = {
  dc01: [
    { id: "ex-1", type: "Folder", value: "C:\\Program Files\\Microsoft SQL Server\\MSSQL15.MSSQLSERVER", dateAdded: "2026-06-01", addedBy: "NEXUSLAB\\Administrator" },
    { id: "ex-2", type: "Extension", value: ".mdf", dateAdded: "2026-06-01", addedBy: "NEXUSLAB\\Administrator" },
    { id: "ex-3", type: "Extension", value: ".ldf", dateAdded: "2026-06-01", addedBy: "NEXUSLAB\\Administrator" },
    { id: "ex-4", type: "Process", value: "sqlservr.exe", dateAdded: "2026-06-01", addedBy: "NEXUSLAB\\Administrator" },
    { id: "ex-5", type: "Folder", value: "C:\\Logs\\nexus_gateway", dateAdded: "2026-07-10", addedBy: "NEXUSLAB\\Administrator" }
  ],
  nexus01: [
    { id: "ex-10", type: "Folder", value: "C:\\NexusApp\\Storage", dateAdded: "2026-07-05", addedBy: "NEXUSLAB\\sysadmin" },
    { id: "ex-11", type: "Process", value: "Nexus.Gateway.exe", dateAdded: "2026-07-05", addedBy: "NEXUSLAB\\sysadmin" }
  ]
};

export const INITIAL_DEFENDER_ASR_RULES: Record<string, DefenderAsrRule[]> = {
  dc01: [
    { id: "asr-1", ruleName: "Block executable content from email client and webmail", guid: "BE9BA2D0-1113-4AFA-8257-CD2B23B81F13", state: "Block", description: "Prevents users from launching dangerous attachments directly from email clients." },
    { id: "asr-2", ruleName: "Block Office applications from creating child processes", guid: "D4F940AB-401B-4EFC-AADC-AD5F3C50688A", state: "Block", description: "Stops macro-based attacks launched via Word, Excel, or PowerPoint." },
    { id: "asr-3", ruleName: "Block LSASS credential stealing", guid: "92E97092-2E00-4ACF-9270-10158F3070A7", state: "Block", description: "Blocks unauthorized processes from dumping Local Security Authority Subsystem Service memory." },
    { id: "asr-4", ruleName: "Block process creations originating from PSExec and WMI commands", guid: "D1E005A6-62EA-4FFE-8A56-513343446412", state: "Audit", description: "Monitors process spawning executed remotely over WMI or PSExec." },
    { id: "asr-5", ruleName: "Block untrusted and unsigned processes from USB drives", guid: "B2B3F034-9512-4543-A2E0-2D6F385DB2C2", state: "Block", description: "Prevents auto-run and malware execution from removable drives." }
  ],
  nexus01: [
    { id: "asr-1", ruleName: "Block executable content from email client and webmail", guid: "BE9BA2D0-1113-4AFA-8257-CD2B23B81F13", state: "Block", description: "Prevents users from launching dangerous attachments directly from email clients." },
    { id: "asr-2", ruleName: "Block Office applications from creating child processes", guid: "D4F940AB-401B-4EFC-AADC-AD5F3C50688A", state: "Block", description: "Stops macro-based attacks launched via Word, Excel, or PowerPoint." },
    { id: "asr-3", ruleName: "Block LSASS credential stealing", guid: "92E97092-2E00-4ACF-9270-10158F3070A7", state: "Block", description: "Blocks unauthorized processes from dumping Local Security Authority Subsystem Service memory." },
    { id: "asr-4", ruleName: "Block process creations originating from PSExec and WMI commands", guid: "D1E005A6-62EA-4FFE-8A56-513343446412", state: "Audit", description: "Monitors process spawning executed remotely over WMI or PSExec." },
    { id: "asr-5", ruleName: "Block untrusted and unsigned processes from USB drives", guid: "B2B3F034-9512-4543-A2E0-2D6F385DB2C2", state: "Disabled", description: "Prevents auto-run and malware execution from removable drives." }
  ]
};

export function getMockDefenderStatus(serverIp: string): DefenderStatus {
  const key = `NEXUS_DEFENDER_STATUS_${serverIp || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to read Defender status", e);
  }
  const defaultStatus = INITIAL_DEFENDER_STATUS[serverIp || "dc01"] || INITIAL_DEFENDER_STATUS["dc01"];
  return { ...defaultStatus };
}

export function updateMockDefenderStatus(serverIp: string, partial: Partial<DefenderStatus>): DefenderStatus {
  const current = getMockDefenderStatus(serverIp);
  const updated = { ...current, ...partial };
  const key = `NEXUS_DEFENDER_STATUS_${serverIp || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

export function getMockDefenderThreats(serverIp: string): DefenderThreat[] {
  const key = `NEXUS_DEFENDER_THREATS_${serverIp || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to read Defender threats", e);
  }
  const defaultThreats = INITIAL_DEFENDER_THREATS[serverIp || "dc01"] || INITIAL_DEFENDER_THREATS["dc01"];
  return [...defaultThreats];
}

export function updateMockDefenderThreat(serverIp: string, threatId: string, action: "Quarantine" | "Remove" | "Allow"): boolean {
  const current = getMockDefenderThreats(serverIp);
  const updated = current.map(t => {
    if (t.id === threatId) {
      if (action === "Quarantine") {
        return { ...t, status: "Quarantined" as const, actionTaken: "Quarantined" as const };
      } else if (action === "Remove") {
        return { ...t, status: "Removed" as const, actionTaken: "Cleaned" as const };
      } else if (action === "Allow") {
        return { ...t, status: "Allowed" as const, actionTaken: "Cleaned" as const };
      }
    }
    return t;
  });
  const key = `NEXUS_DEFENDER_THREATS_${serverIp || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(updated));

  const activeCount = updated.filter(t => t.status === "Active").length;
  const quarCount = updated.filter(t => t.status === "Quarantined").length;
  updateMockDefenderStatus(serverIp, { threatsActiveCount: activeCount, threatsQuarantinedCount: quarCount });

  return true;
}

export function getMockDefenderExclusions(serverIp: string): DefenderExclusion[] {
  const key = `NEXUS_DEFENDER_EXCLUSIONS_${serverIp || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to read Defender exclusions", e);
  }
  const defaultList = INITIAL_DEFENDER_EXCLUSIONS[serverIp || "dc01"] || INITIAL_DEFENDER_EXCLUSIONS["dc01"];
  return [...defaultList];
}

export function addMockDefenderExclusion(serverIp: string, item: Omit<DefenderExclusion, "id" | "dateAdded" | "addedBy">): DefenderExclusion {
  const current = getMockDefenderExclusions(serverIp);
  const newEx: DefenderExclusion = {
    ...item,
    id: `ex-${Date.now()}`,
    dateAdded: new Date().toISOString().split("T")[0],
    addedBy: "NEXUSLAB\\Administrator"
  };
  const updated = [newEx, ...current];
  const key = `NEXUS_DEFENDER_EXCLUSIONS_${serverIp || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(updated));
  return newEx;
}

export function deleteMockDefenderExclusion(serverIp: string, exclusionId: string): boolean {
  const current = getMockDefenderExclusions(serverIp);
  const updated = current.filter(x => x.id !== exclusionId);
  const key = `NEXUS_DEFENDER_EXCLUSIONS_${serverIp || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(updated));
  return true;
}

export function getMockDefenderAsrRules(serverIp: string): DefenderAsrRule[] {
  const key = `NEXUS_DEFENDER_ASR_${serverIp || "dc01"}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to read Defender ASR rules", e);
  }
  const defaultRules = INITIAL_DEFENDER_ASR_RULES[serverIp || "dc01"] || INITIAL_DEFENDER_ASR_RULES["dc01"];
  return [...defaultRules];
}

export function updateMockDefenderAsrRule(serverIp: string, ruleId: string, state: "Block" | "Audit" | "Disabled"): boolean {
  const current = getMockDefenderAsrRules(serverIp);
  const updated = current.map(r => r.id === ruleId ? { ...r, state } : r);
  const key = `NEXUS_DEFENDER_ASR_${serverIp || "dc01"}`;
  localStorage.setItem(key, JSON.stringify(updated));
  return true;
}




