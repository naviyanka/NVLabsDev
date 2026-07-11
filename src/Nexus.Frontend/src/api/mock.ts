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
}

// --- Services
export interface Service {
  name: string; displayName: string; status: "Running" | "Stopped" | "Paused";
  startupType: "Automatic" | "Manual" | "Disabled" | "Automatic (Delayed)";
  logOnAs: string; description: string;
}

// --- Storage
export interface Disk { id: string; model: string; sizeGB: number; bus: string; health: "Healthy"|"Warning"|"Failed"; partitions: { label: string; sizeGB: number; type: "System"|"Data"|"Recovery"|"Unallocated" }[]; }
export interface Volume { letter: string; label: string; fs: "NTFS"|"ReFS"|"FAT32"; sizeGB: number; usedGB: number; status: "Healthy"|"At Risk"; diskId: string; }

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
export interface FirewallRule { id: string; name: string; enabled: boolean; profile: "Domain"|"Private"|"Public"|"All"; protocol: "TCP"|"UDP"|"ICMP"|"Any"; localPort: string; remoteIp: string; action: "Allow"|"Block"; direction: "Inbound"|"Outbound"; }
const FW_NAMES = ["Remote Desktop","File and Printer Sharing","Windows Remote Management","SQL Server","IIS HTTPS","DNS","DHCP","SMB-In","WinRM-HTTPS","Hyper-V Replica HTTPS","Block Inbound SMBv1","Block RDP from Internet","Allow SSH","ICMPv4 Echo","Failover Cluster"];
export async function getFirewallRules(serverId: string): Promise<FirewallRule[]> {
  await delay();
  const base = serverId.charCodeAt(0);
  return FW_NAMES.map((name, i) => ({
    id: `${serverId}-fw-${i}`,
    name, enabled: rand(base + i) > 0.2,
    profile: (["Domain","Private","Public","All"] as const)[i % 4],
    protocol: (["TCP","UDP","ICMP","Any"] as const)[i % 4],
    localPort: ["3389","445","5985,5986","1433","443","53","67-68","Any"][i % 8],
    remoteIp: i % 3 === 0 ? "Any" : "192.168.0.0/24",
    action: name.startsWith("Block") ? "Block" : "Allow",
    direction: i % 5 === 0 ? "Outbound" : "Inbound",
  }));
}
export async function toggleFirewallRule(_s: string, _id: string, _enabled: boolean) { await delay(); }

// --- Users / Groups
export interface LocalUser { name: string; fullName: string; description: string; lastLogin: string; enabled: boolean; passwordNeverExpires: boolean; groups: string[]; }
export interface LocalGroup { name: string; description: string; members: string[]; }
export async function getLocalUsers(_serverId: string): Promise<LocalUser[]> {
  await delay();
  return [
    { name: "Administrator", fullName: "Built-in Administrator", description: "Built-in admin account", lastLogin: "2026-06-14T09:42:00Z", enabled: true,  passwordNeverExpires: true,  groups: ["Administrators"] },
    { name: "nexus-svc",    fullName: "NEXUS Service Account",   description: "Service account for NEXUS", lastLogin: "2026-06-15T03:01:00Z", enabled: true,  passwordNeverExpires: true,  groups: ["Administrators","Remote Management Users"] },
    { name: "backup-op",    fullName: "Backup Operator",         description: "Backup automation",         lastLogin: "2026-06-12T18:11:00Z", enabled: true,  passwordNeverExpires: false, groups: ["Backup Operators"] },
    { name: "guest",        fullName: "Guest",                   description: "Built-in guest account",    lastLogin: "—",                    enabled: false, passwordNeverExpires: false, groups: ["Guests"] },
    { name: "deploy",       fullName: "Deployment Bot",          description: "CI/CD deploys",             lastLogin: "2026-06-15T01:22:00Z", enabled: true,  passwordNeverExpires: true,  groups: ["Remote Management Users"] },
  ];
}
export async function getLocalGroups(_serverId: string): Promise<LocalGroup[]> {
  await delay();
  return [
    { name: "Administrators", description: "Full administrative access", members: ["Administrator","nexus-svc","NVLABS\\Domain Admins"] },
    { name: "Remote Management Users", description: "WinRM remote access", members: ["nexus-svc","deploy"] },
    { name: "Backup Operators", description: "Backup/restore privileges", members: ["backup-op"] },
    { name: "Users", description: "Standard users", members: ["NVLABS\\Domain Users"] },
    { name: "Guests", description: "Limited guest access", members: ["guest"] },
  ];
}

// --- Performance history
export interface PerfSample { t: number; cpu: number; mem: number; diskR: number; diskW: number; netIn: number; netOut: number; }

// --- Updates
export interface Update { id: string; kb: string; title: string; classification: string; sizeMB: number; severity: "Critical"|"Important"|"Optional"; status: "Pending"|"Installed"|"Failed"; }

// --- Tasks
export interface ScheduledTask { name: string; path: string; status: "Ready"|"Running"|"Disabled"|"Failed"; lastRun: string; lastResult: string; nextRun: string; triggers: string[]; }

// --- Certificates
export interface Certificate { id: string; subject: string; issuer: string; from: string; to: string; thumbprint: string; purpose: string; }
export async function getCertificates(_s: string): Promise<Certificate[]> {
  await delay();
  return [
    { id: "1", subject: "CN=nexuslab.local", issuer: "CN=NEXUS-CA", from: "2025-01-12", to: "2027-01-12", thumbprint: "3A:B1:9C:F4:7D:11:88:CC:90:42:11:AB:91:7E:5F:6C:DE:88:01:22", purpose: "Server Authentication" },
    { id: "2", subject: "CN=*.web01.nexuslab.local", issuer: "CN=DigiCert Global G2", from: "2025-08-01", to: "2026-08-01", thumbprint: "FF:01:7C:DE:88:91:42:11:AB:91:7E:5F:6C:3A:B1:9C:F4:7D:11:88", purpose: "Server Authentication" },
    { id: "3", subject: "CN=sql01.nexuslab.local", issuer: "CN=NEXUS-CA", from: "2024-02-14", to: "2026-07-04", thumbprint: "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD", purpose: "Server Authentication, Client Authentication" },
    { id: "4", subject: "CN=NEXUS-CA", issuer: "CN=NEXUS-CA", from: "2022-01-01", to: "2032-01-01", thumbprint: "11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44", purpose: "Root CA" },
    { id: "5", subject: "CN=expired.nexuslab.local", issuer: "CN=NEXUS-CA", from: "2022-01-01", to: "2024-01-01", thumbprint: "DE:AD:BE:EF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF", purpose: "Server Authentication" },
  ];
}

// --- Networks
export interface NetworkAdapter { name: string; type: "Ethernet"|"WiFi"|"Virtual"; status: "Connected"|"Disconnected"; speedMbps: number; ipv4: string; subnet: string; gateway: string; dns: string[]; ipv6: string; mac: string; bytesIn: number; bytesOut: number; dhcp: boolean; }
export async function getNetworkAdapters(serverId: string): Promise<NetworkAdapter[]> {
  await delay();
  const base = serverId.charCodeAt(0);
  return [
    { name: "Ethernet 0", type: "Ethernet", status: "Connected", speedMbps: 10000, ipv4: MOCK_SERVERS.find(s=>s.id===serverId)?.ip ?? "192.168.0.1", subnet: "255.255.255.0", gateway: "192.168.0.1", dns: ["192.168.0.10","8.8.8.8"], ipv6: "fe80::1234:5678:9abc:def0/64", mac: "00:15:5D:01:0A:" + (10 + base % 90).toString(16).padStart(2,"0").toUpperCase(), bytesIn: 1_482_193_204, bytesOut: 884_002_192, dhcp: false },
    { name: "vEthernet (NEXUS Switch)", type: "Virtual", status: "Connected", speedMbps: 10000, ipv4: "172.16.0.1", subnet: "255.255.0.0", gateway: "0.0.0.0", dns: [], ipv6: "—", mac: "00:15:5D:99:00:01", bytesIn: 102_002_192, bytesOut: 22_002_192, dhcp: false },
    { name: "Ethernet 1 (Backup)", type: "Ethernet", status: "Disconnected", speedMbps: 1000, ipv4: "—", subnet: "—", gateway: "—", dns: [], ipv6: "—", mac: "00:15:5D:01:0B:01", bytesIn: 0, bytesOut: 0, dhcp: true },
  ];
}

// --- Apps
export interface InstalledApp { id: string; name: string; publisher: string; version: string; installDate: string; location: string; sizeMB: number; }

// --- Roles & Features
export interface RoleFeature { id: string; name: string; description: string; installed: boolean; kind: "Role"|"Feature"; sub?: string[]; }

// --- Registry
export interface RegistryKey { name: string; type: "REG_SZ"|"REG_DWORD"|"REG_BINARY"|"REG_MULTI_SZ"|"REG_EXPAND_SZ"; data: string; }
export async function getRegistryKeys(_s: string, _path: string): Promise<RegistryKey[]> {
  await delay(150);
  return [
    { name: "(Default)", type: "REG_SZ", data: "(value not set)" },
    { name: "ProductName", type: "REG_SZ", data: "Windows Server 2022 Datacenter" },
    { name: "CurrentBuild", type: "REG_SZ", data: "20348" },
    { name: "InstallDate", type: "REG_DWORD", data: "0x65f1bb20 (1710326560)" },
    { name: "EditionID", type: "REG_SZ", data: "ServerDatacenter" },
    { name: "PathName", type: "REG_EXPAND_SZ", data: "%SystemRoot%" },
    { name: "RegisteredOwner", type: "REG_SZ", data: "NEXUS Labs" },
    { name: "InstallationType", type: "REG_SZ", data: "Server" },
  ];
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

// --- VMs
export interface HyperVVM { id: string; name: string; status: "Running"|"Stopped"|"Paused"|"Saved"; os: string; cpu: number; memMB: number; uptime: string; }
export async function getVMs(_s: string): Promise<HyperVVM[]> {
  await delay();
  return [
    { id: "vm1", name: "BUILD-AGENT-01", status: "Running", os: "Windows Server 2022", cpu: 28, memMB: 8192, uptime: "12d 4h" },
    { id: "vm2", name: "BUILD-AGENT-02", status: "Running", os: "Windows Server 2022", cpu: 41, memMB: 8192, uptime: "12d 4h" },
    { id: "vm3", name: "ANSIBLE-CTL", status: "Stopped", os: "Ubuntu 22.04", cpu: 0, memMB: 4096, uptime: "—" },
    { id: "vm4", name: "JUMPBOX-DMZ", status: "Paused", os: "Windows Server 2019", cpu: 0, memMB: 2048, uptime: "—" },
    { id: "vm5", name: "TEST-SQL", status: "Saved", os: "Windows Server 2022", cpu: 0, memMB: 16384, uptime: "—" },
    { id: "vm6", name: "DEV-DESKTOP", status: "Running", os: "Windows 11", cpu: 12, memMB: 8192, uptime: "3d 1h" },
  ];
}
export async function controlVM(_s: string, _id: string, _a: "start"|"stop"|"pause"|"checkpoint") { await delay(500); }

// --- Virtual switches
export interface VirtualSwitch { id: string; name: string; type: "External"|"Internal"|"Private"; adapter?: string; vms: string[]; }
export async function getVirtualSwitches(_s: string): Promise<VirtualSwitch[]> {
  await delay();
  return [
    { id: "s1", name: "NEXUS-External", type: "External", adapter: "Ethernet 0", vms: ["BUILD-AGENT-01","BUILD-AGENT-02"] },
    { id: "s2", name: "Lab-Internal",   type: "Internal", vms: ["DEV-DESKTOP"] },
    { id: "s3", name: "Isolated",       type: "Private",  vms: ["TEST-SQL","JUMPBOX-DMZ"] },
  ];
}

// --- Storage Replica
export interface ReplicaPartnership { id: string; sourceServer: string; sourceVol: string; destServer: string; destVol: string; status: "Syncing"|"Healthy"|"Error"; mode: "Synchronous"|"Asynchronous"; lastSync: string; bytes: number; progress: number; }
export async function getReplicaPartnerships(): Promise<ReplicaPartnership[]> {
  await delay();
  return [
    { id: "r1", sourceServer: "FS01", sourceVol: "G:", destServer: "FS02", destVol: "G:", status: "Healthy",  mode: "Synchronous",  lastSync: "2026-06-15T05:14:00Z", bytes: 4_402_193_204, progress: 100 },
    { id: "r2", sourceServer: "SQL01", sourceVol: "L:", destServer: "SQL02", destVol: "L:", status: "Syncing", mode: "Asynchronous", lastSync: "2026-06-15T05:00:00Z", bytes: 1_201_882_002, progress: 68 },
    { id: "r3", sourceServer: "DC01", sourceVol: "S:", destServer: "DC02", destVol: "S:", status: "Error",   mode: "Asynchronous", lastSync: "2026-06-14T22:11:00Z", bytes: 200_002, progress: 12 },
  ];
}

// --- Plugins
export interface Plugin { id: string; name: string; author: string; version: string; category: "Security"|"Storage"|"Monitoring"|"Network"|"Management"|"Custom"; enabled: boolean; updateAvailable: boolean; description: string; }

// --- PowerShell
export interface PSResult { command: string; output: string; error?: string; }

// --- Server Settings
export interface ServerSettings { computerName: string; domain: string; timezone: string; locale: string; winrmEnabled: boolean; rdpEnabled: boolean; sshEnabled: boolean; updatePolicy: "Automatic"|"Download only"|"Notify"|"Manual"; activeHoursFrom: string; activeHoursTo: string; powerPlan: "Balanced"|"High Performance"|"Power Saver"; uacLevel: number; refreshInterval: 5|10|30|60; defaultServer: string; theme: "Signal Room"|"Pure Dark"|"Slate"|"Stealth"; sessionTimeout: number; }
