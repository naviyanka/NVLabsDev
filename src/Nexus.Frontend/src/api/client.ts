import { getApiUrl } from "@/lib/backend";

// --- Data Models & Interfaces ---
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

export interface Process {
  pid: number;
  name: string;
  cpu: number;
  memMB: number;
  memPct: number;
  handles: number;
  threads: number;
  user: string;
  status: string;
  commandLine?: string;
  executablePath?: string;
  category?: "System" | "Service" | "Application" | "Database";
  priority?: "Realtime" | "High" | "AboveNormal" | "Normal" | "BelowNormal" | "Idle";
}

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

export interface Disk {
  devicePath: string;
  sizeGB: number;
  health: string;
  model: string;
  busType: string;
  partitionStyle: string;
  drives: string[];
}

export interface Volume {
  letter: string;
  label: string;
  sizeGB: number;
  freeGB: number;
  usedGB: number;
  pctUsed: number;
  fileSystem: string;
  health: string;
  bitLocker?: boolean;
}

export interface ScheduledTask {
  name: string;
  path: string;
  state: "Ready" | "Running" | "Disabled" | "Unknown";
  lastRunTime: string;
  nextRunTime: string;
  author: string;
  description: string;
  status?: string;
}

export interface TaskExecutionLog {
  timestamp: string;
  resultCode: number;
  message: string;
}

export interface InstalledApp {
  id: string;
  name: string;
  publisher: string;
  version: string;
  installDate: string;
  sizeMB: number;
  uninstallString: string;
}

export interface SoftwareCatalogItem {
  id: string;
  name: string;
  publisher: string;
  version: string;
  category: "Utilities" | "Development" | "Runtimes" | "Browsers" | "Security" | "Database";
  description: string;
  downloadUrl: string;
  silentArgs: string;
  iconName: string;
  sizeMB: number;
}

export interface FirewallRule {
  id: string;
  name: string;
  enabled: boolean;
  action: "Allow" | "Block";
  direction: "Inbound" | "Outbound";
  protocol: string;
  localPort: string;
  remotePort: string;
  localAddress: string;
  remoteAddress: string;
  profile: "Domain" | "Private" | "Public" | "Any";
  program?: string;
  group?: string;
  description?: string;
}

export type EventLevel = "Error" | "Warning" | "Information" | "Critical";

export interface EventEntry {
  id: string;
  eventRecordID: number;
  timeCreated: string;
  logName: "System" | "Application" | "Security" | "Directory Service" | "DNS Server";
  levelName: EventLevel;
  source: string;
  eventID: number;
  taskCategory: string;
  message: string;
  user?: string;
  computer?: string;
}

export interface VMCheckpoint {
  id: string;
  name: string;
  creationTime: string;
  isParent: boolean;
}

export interface HyperVVM {
  id: string;
  name: string;
  status: "Running" | "Stopped" | "Paused" | "Off";
  cpuUsage: number;
  memoryMB: number;
  uptime: string;
  vcpus: number;
  generation: number;
  dynamicMemory: boolean;
  notes?: string;
  checkpoints?: VMCheckpoint[];
}

export interface Device {
  id: string;
  name: string;
  category: string;
  status: string;
  driverVersion: string;
  hardwareId: string;
}

export interface VirtualSwitch {
  id: string;
  name: string;
  switchType: "External" | "Internal" | "Private";
  netAdapterInterfaceDescription?: string;
  allowManagementOS: boolean;
  vlanId?: number;
  attachedVmIds?: string[];
  status?: string;
}

export interface ReplicaPartnership {
  id: string;
  sourceServer: string;
  targetServer: string;
  replicationGroup: string;
  status: "Synchronized" | "Replicating" | "Paused" | "Error" | "InitialSyncRequired";
  replicationType: "Synchronous" | "Asynchronous";
  logSizeGB: number;
  lastSyncTime: string;
  rpoSeconds: number;
}

export interface WindowsRole {
  name: string;
  displayName: string;
  installed: boolean;
  featureType: "Role" | "Feature";
  category: "Web" | "Infrastructure" | "Management" | "Security" | "Identity" | "Storage" | "Networking";
  description: string;
}

export interface WindowsUpdate {
  kbId: string;
  title: string;
  category: "Critical" | "Security" | "Definition" | "Feature" | "Driver" | "UpdateRollup";
  sizeMB: number;
  releaseDate: string;
  installed: boolean;
  mandatory: boolean;
  description?: string;
}

export interface UpdateHistoryItem {
  id: string;
  kbId: string;
  title: string;
  dateInstalled: string;
  result: "Succeeded" | "Failed" | "In Progress";
  supportUrl?: string;
}

export interface RdpSession {
  sessionId: number;
  userName: string;
  sessionName: string;
  state: "Active" | "Disconnected" | "Idle" | "Listen";
  connectTime: string;
  idleTime: string;
  clientIp: string;
  clientName: string;
}

export interface RdpSecurityConfig {
  networkLevelAuth: boolean;
  allowRemoteConnections: boolean;
  securityLayer: "SSL" | "RDP" | "Negotiate";
  port: number;
  maxIdleTimeoutMinutes: number;
}

export interface DefenderStatus {
  realTimeProtectionEnabled: boolean;
  antivirusEnabled: boolean;
  antispywareEnabled: boolean;
  behaviorMonitorEnabled: boolean;
  ioavProtectionEnabled: boolean;
  nisEnabled: boolean;
  cloudProtectionEnabled: boolean;
  tamperProtectionEnabled: boolean;
  avSignatureVersion: string;
  avSignatureLastUpdated: string;
  fullScanAgeDays: number;
  quickScanAgeDays: number;
  engineVersion: string;
}

export interface DefenderThreat {
  id: string;
  threatName: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  category: "Malware" | "Trojan" | "Ransomware" | "PUA" | "Exploit";
  filePath: string;
  detectionTime: string;
  status: "Quarantined" | "Active" | "Removed" | "Allowed";
}

export interface DefenderExclusion {
  id: string;
  type: "Path" | "Process" | "Extension";
  value: string;
  addedBy: string;
  dateAdded: string;
}

export interface DefenderAsrRule {
  id: string;
  name: string;
  description: string;
  state: "Block" | "Audit" | "Disabled";
}

export interface LocalUser {
  name: string;
  fullName: string;
  description: string;
  enabled: boolean;
  locked: boolean;
  passwordNeverExpires: boolean;
  lastLogon: string;
  groups: string[];
}

export interface LocalGroup {
  name: string;
  description: string;
  members: string[];
}

export interface SecurityComplianceCheck {
  id: string;
  name: string;
  category: string;
  status: "Passed" | "Failed" | "Warning";
  description: string;
  remediation?: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  severity: "High" | "Medium" | "Low";
  source: string;
  description: string;
  status: "Active" | "Investigating" | "Resolved";
}

export interface OpenPort {
  port: number;
  protocol: string;
  service: string;
  state: "Listening" | "Open";
}

export interface LocalAdmin {
  username: string;
  lastLogon: string;
  isExpected: boolean;
}

export interface SecurityData {
  score: number;
  lastScanTime: string;
  complianceChecks: SecurityComplianceCheck[];
  events: SecurityEvent[];
  openPorts: OpenPort[];
  localAdmins: LocalAdmin[];
}

export interface RegistryValue {
  name: string;
  type: "REG_SZ" | "REG_DWORD" | "REG_QWORD" | "REG_MULTI_SZ" | "REG_BINARY" | "REG_EXPAND_SZ";
  value: string | number | string[];
}

export interface RegistryNode {
  name: string;
  path: string;
  hasChildren: boolean;
  subKeys?: string[];
  values?: RegistryValue[];
}

export interface RegistryContent {
  currentPath: string;
  subKeys: string[];
  values: RegistryValue[];
}

export interface RegistrySearchResult {
  path: string;
  type: "key" | "value";
  name: string;
  value?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "Critical" | "Warning" | "Info" | "Success";
  timestamp: string;
  read: boolean;
}

export interface FileItem {
  name: string;
  path: string;
  type: "file" | "directory";
  sizeBytes: number;
  lastModified: string;
  extension?: string;
  hidden?: boolean;
}

export interface FileSource {
  id: string;
  name: string;
  path: string;
  type: "local" | "smb" | "system";
}

export interface PerfSample {
  timestamp: string;
  cpu: number;
  mem: number;
  disk: number;
  netIn: number;
  netOut: number;
}

// --- Software Catalog Constant ---
export const SOFTWARE_CATALOG: SoftwareCatalogItem[] = [
  { id: "git", name: "Git for Windows", publisher: "The Git Development Team", version: "2.44.0", category: "Development", description: "Distributed version control system", downloadUrl: "https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe", silentArgs: "/VERYSILENT /NORESTART", iconName: "git-branch", sizeMB: 58.4 },
  { id: "7zip", name: "7-Zip Archiver", publisher: "Igor Pavlov", version: "23.01", category: "Utilities", description: "File archiver with high compression ratio", downloadUrl: "https://www.7-zip.org/a/7z2301-x64.exe", silentArgs: "/S", iconName: "package", sizeMB: 1.5 },
  { id: "nodejs", name: "Node.js (LTS)", publisher: "OpenJS Foundation", version: "20.12.2", category: "Runtimes", description: "JavaScript runtime environment built on V8", downloadUrl: "https://nodejs.org/dist/v20.12.2/node-v20.12.2-x64.msi", silentArgs: "/qn /norestart", iconName: "cpu", sizeMB: 30.2 },
  { id: "vscode", name: "Visual Studio Code", publisher: "Microsoft Corporation", version: "1.88.1", category: "Development", description: "Code editing redefined and optimized", downloadUrl: "https://update.code.visualstudio.com/1.88.1/win32-x64-user/stable", silentArgs: "/VERYSILENT /NORESTART", iconName: "code", sizeMB: 92.8 },
  { id: "pwsh7", name: "PowerShell 7 (x64)", publisher: "Microsoft Corporation", version: "7.4.2", category: "Utilities", description: "Cross-platform task automation and configuration management", downloadUrl: "https://github.com/PowerShell/PowerShell/releases/download/v7.4.2/PowerShell-7.4.2-win-x64.msi", silentArgs: "/qn /norestart", iconName: "terminal", sizeMB: 104.1 },
  { id: "chrome", name: "Google Chrome Enterprise", publisher: "Google LLC", version: "124.0.6367.78", category: "Browsers", description: "Enterprise web browser deployment", downloadUrl: "https://dl.google.com/tag/s/appguid%3D%7B8A69D345-D564-463C-AFF1-A69D9E530F96%7D/dl/chrome/install/googlechromestandaloneenterprise64.msi", silentArgs: "/qn /norestart", iconName: "globe", sizeMB: 110.5 }
];

// --- 100% Real REST API Client Wrappers ---

// Server Fleet Management
export async function getServersClient(): Promise<Server[]> {
  try {
    const res = await fetch(getApiUrl(`/servers`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch servers", e);
  }
  return [];
}

export async function addServerClient(data: { name: string; ip: string; role: string }): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to add server", e);
    return false;
  }
}

export async function editServerClient(ip: string, data: { name: string; ip: string; role: string }): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${ip}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to edit server", e);
    return false;
  }
}

export async function deleteServerClient(ip: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${ip}`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete server", e);
    return false;
  }
}

export async function restartServerClient(ip: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${ip}/restart`), { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to restart server", e);
    return false;
  }
}

export async function shutdownServerClient(ip: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${ip}/shutdown`), { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to shutdown server", e);
    return false;
  }
}

// Applications Management
export async function getAppsClient(serverId: string, refresh: boolean = false): Promise<InstalledApp[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/apps?refresh=${refresh}`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          ...item,
          sizeMB: typeof item.sizeMB === "number" ? item.sizeMB : (parseFloat(String(item.sizeMB)) || 0)
        }));
      }
    }
  } catch (e) {
    console.error("Failed to fetch apps", e);
  }
  return [];
}

export async function installAppClient(serverId: string, installerPath: string, args: string, sourceServerIp: string = ""): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/apps/install`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ installerPath, arguments: args, sourceServerIp })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to install app", e);
    return false;
  }
}

export async function uploadInstallerClient(serverId: string, file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(getApiUrl(`/servers/${serverId}/apps/upload-installer`), {
      method: "POST",
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      return data.path;
    }
  } catch (e) {
    console.error("Failed to upload installer", e);
  }
  return null;
}

export async function uninstallAppClient(serverId: string, uninstallString: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/apps/uninstall`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uninstallString })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to uninstall app", e);
    return false;
  }
}

export async function getSoftwareCatalog(): Promise<SoftwareCatalogItem[]> {
  try {
    const res = await fetch(getApiUrl(`/software-catalog`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.error("Failed to fetch software catalog", e);
  }
  return SOFTWARE_CATALOG;
}

export async function addSoftwareCatalogItem(item: Omit<SoftwareCatalogItem, "id">): Promise<SoftwareCatalogItem | null> {
  try {
    const res = await fetch(getApiUrl(`/software-catalog`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to add software catalog item", e);
  }
  return null;
}

export async function updateSoftwareCatalogItem(id: string, item: Partial<SoftwareCatalogItem>): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/software-catalog/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to update software catalog item", e);
    return false;
  }
}

export async function deleteSoftwareCatalogItem(id: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/software-catalog/${id}`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete software catalog item", e);
    return false;
  }
}

export async function resetSoftwareCatalog(): Promise<SoftwareCatalogItem[]> {
  try {
    const res = await fetch(getApiUrl(`/software-catalog/reset`), { method: "POST" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to reset software catalog", e);
  }
  return SOFTWARE_CATALOG;
}

// Windows Roles & Features
export async function getRolesClient(serverId: string, refresh: boolean = false): Promise<WindowsRole[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/roles?refresh=${refresh}`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch roles", e);
  }
  return [];
}

export async function installRoleClient(serverId: string, name: string, featureType: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/roles/install`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, featureType })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to install role", e);
    return false;
  }
}

export async function uninstallRoleClient(serverId: string, name: string, featureType: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/roles/uninstall`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, featureType })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to uninstall role", e);
    return false;
  }
}

// Scheduled Tasks
export async function getTasksClient(serverId: string): Promise<ScheduledTask[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/tasks`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch tasks", e);
  }
  return [];
}

export async function runTaskClient(serverId: string, taskPath: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/tasks/run`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskPath })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to run task", e);
    return false;
  }
}

export async function toggleTaskClient(serverId: string, taskPath: string, enable: boolean): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/tasks/toggle`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskPath, enable })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to toggle task", e);
    return false;
  }
}

export async function deleteTaskClient(serverId: string, taskPath: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/tasks`), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskPath })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete task", e);
    return false;
  }
}

export async function createTaskClient(serverId: string, task: Omit<ScheduledTask, "status">): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/tasks`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to create task", e);
    return false;
  }
}

export async function editTaskClient(serverId: string, originalPath: string, task: Partial<ScheduledTask>): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/tasks/edit`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalPath, ...task })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to edit task", e);
    return false;
  }
}

export async function exportTaskXmlClient(serverId: string, taskPath: string): Promise<string> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/tasks/export-xml?path=${encodeURIComponent(taskPath)}`));
    if (res.ok) {
      const data = await res.json();
      return data.xml || "";
    }
  } catch (e) {
    console.error("Failed to export task XML", e);
  }
  return "";
}

// Performance & Processes
export async function getPerformanceHistoryClient(serverId: string): Promise<PerfSample[]> {
  try {
    const res = await fetch(getApiUrl(`/performance/${serverId}`));
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch performance history", e);
  }
  return [];
}

export async function getProcessesClient(serverId: string): Promise<Process[]> {
  try {
    const res = await fetch(getApiUrl(`/performance/${serverId}/processes`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch processes", e);
  }
  return [];
}

export async function getLiveProcessesClient(serverId: string): Promise<Process[]> {
  try {
    const res = await fetch(getApiUrl(`/performance/${serverId}/processes/live`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch live processes", e);
  }
  return [];
}

export async function getProcessDetailsClient(serverId: string, pid: number): Promise<Process | null> {
  try {
    const res = await fetch(getApiUrl(`/performance/${serverId}/processes/${pid}`));
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch process details", e);
  }
  return null;
}

export async function killProcessClient(serverId: string, pid: number): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/performance/${serverId}/processes/${pid}`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    console.error("Failed to kill process", e);
    return false;
  }
}

// Windows Services
export async function getServicesClient(serverId: string): Promise<Service[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/services`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch services", e);
  }
  return [];
}

export async function controlServiceClient(serverId: string, name: string, action: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/services/${name}/${action}`), { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to control service", e);
    return false;
  }
}

export async function setServiceStartupTypeClient(serverId: string, name: string, startupType: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/services/${name}/startup`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startupType })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to set service startup type", e);
    return false;
  }
}

// Storage & Disks
export async function getDisksClient(serverId: string): Promise<Disk[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/disks`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch disks", e);
  }
  return [];
}

export async function getVolumesClient(serverId: string): Promise<Volume[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/volumes`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch volumes", e);
  }
  return [];
}

export async function optimizeVolumeClient(serverId: string, driveLetter: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/volumes/${driveLetter}/optimize`), { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to optimize volume", e);
    return false;
  }
}

export async function checkVolumeClient(serverId: string, driveLetter: string): Promise<string> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/volumes/${driveLetter}/check`), { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      return data.output || "Volume check completed.";
    }
  } catch (e) {
    console.error("Failed to check volume", e);
  }
  return "Error performing volume check.";
}

export async function changeVolumeLabelClient(serverId: string, driveLetter: string, label: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/volumes/${driveLetter}/label`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to change volume label", e);
    return false;
  }
}

export async function changeDriveLetterClient(serverId: string, currentLetter: string, newLetter: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/volumes/${currentLetter}/letter`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newLetter })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to change drive letter", e);
    return false;
  }
}

export async function extendVolumeClient(serverId: string, driveLetter: string, additionalGB: number): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/volumes/${driveLetter}/extend`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ additionalGB })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to extend volume", e);
    return false;
  }
}

export async function formatVolumeClient(serverId: string, driveLetter: string, fileSystem: string, label: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/volumes/${driveLetter}/format`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileSystem, label })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to format volume", e);
    return false;
  }
}

// Security Audit & Compliance Center
export async function getSecurityClient(serverId: string): Promise<SecurityData | null> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/security`));
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch security data", e);
  }
  return null;
}

export async function updateComplianceCheckClient(serverId: string, checkId: string, status: "Passed" | "Failed" | "Warning"): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/security/compliance/${checkId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to update compliance check", e);
    return false;
  }
}

export async function updateSecurityEventStatusClient(serverId: string, eventId: string, status: "Active" | "Investigating" | "Resolved"): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/security/events/${eventId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to update security event status", e);
    return false;
  }
}

export async function toggleLocalAdminExpectedClient(serverId: string, username: string, isExpected: boolean): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/security/admins/${username}/expected`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isExpected })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to toggle local admin expected status", e);
    return false;
  }
}

// Events & Security Logs
export async function getEventsClient(serverId: string): Promise<EventEntry[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/events`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch events", e);
  }
  return [];
}

// Firewall Management
export async function getFirewallRulesClient(serverId: string): Promise<FirewallRule[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/firewall`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch firewall rules", e);
  }
  return [];
}

export async function addFirewallRuleClient(serverId: string, rule: Omit<FirewallRule, "id">): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/firewall`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to add firewall rule", e);
    return false;
  }
}

export async function deleteFirewallRuleClient(serverId: string, ruleId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/firewall/${ruleId}`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete firewall rule", e);
    return false;
  }
}

export async function updateFirewallRuleClient(serverId: string, ruleId: string, rule: Partial<FirewallRule>): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/firewall/${ruleId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to update firewall rule", e);
    return false;
  }
}

// Local Users & Groups
export async function getUsersClient(serverId: string): Promise<LocalUser[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/users`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch users", e);
  }
  return [];
}

export async function getGroupsClient(serverId: string): Promise<LocalGroup[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/groups`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch groups", e);
  }
  return [];
}

export async function toggleUserStatusClient(serverId: string, username: string, enable: boolean): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/users/${username}/status`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enable })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to toggle user status", e);
    return false;
  }
}

export async function toggleUserLockoutClient(serverId: string, username: string, unlock: boolean): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/users/${username}/lockout`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unlock })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to toggle user lockout", e);
    return false;
  }
}

// Aliases for compatibility
export const setUserStatusClient = toggleUserStatusClient;
export const setUserLockoutClient = toggleUserLockoutClient;

export async function resetUserPasswordClient(serverId: string, username: string, newPass: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/users/${username}/reset-password`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: newPass })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to reset user password", e);
    return false;
  }
}

export async function updateUserGroupsClient(serverId: string, username: string, groups: string[]): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/users/${username}/groups`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groups })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to update user groups", e);
    return false;
  }
}

export async function createUserClient(serverId: string, user: Partial<LocalUser> & { password?: string }): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/users`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to create user", e);
    return false;
  }
}

export async function deleteUserClient(serverId: string, username: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/users/${username}`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete user", e);
    return false;
  }
}

export async function createGroupClient(serverId: string, group: Partial<LocalGroup>): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/groups`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(group)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to create group", e);
    return false;
  }
}

export async function deleteGroupClient(serverId: string, groupName: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/groups/${groupName}`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete group", e);
    return false;
  }
}

export async function updateGroupMembersClient(serverId: string, groupName: string, members: string[]): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/groups/${groupName}/members`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to update group members", e);
    return false;
  }
}

// Certificates
export async function getCertificatesClient(serverId: string): Promise<any[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/certificates`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch certificates", e);
  }
  return [];
}

export async function importCertificateClient(serverId: string, pfxBase64: string, pass: string, storeName: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/certificates/import`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pfxBase64, password: pass, storeName })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to import certificate", e);
    return false;
  }
}

export async function deleteCertificateClient(serverId: string, thumbprint: string, storeName: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/certificates/${thumbprint}?storeName=${encodeURIComponent(storeName)}`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete certificate", e);
    return false;
  }
}

export async function generateSelfSignedCertClient(serverId: string, subjectName: string, dnsNames: string[], validYears: number, storeName: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/certificates/generate-self-signed`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectName, dnsNames, validYears, storeName })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to generate self-signed certificate", e);
    return false;
  }
}

export async function renewCertificateClient(serverId: string, thumbprint: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/certificates/${thumbprint}/renew`), { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to renew certificate", e);
    return false;
  }
}

// Network Adapters
export async function getNetworkAdaptersClient(serverId: string): Promise<any[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/networks`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch network adapters", e);
  }
  return [];
}

export const getNetworksClient = getNetworkAdaptersClient;

export async function updateNetworkAdapterClient(serverId: string, adapterId: string, settings: any): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/networks/${adapterId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to update network adapter", e);
    return false;
  }
}

export async function controlNetworkClient(serverId: string, adapterId: string, action: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/networks/${adapterId}/${action}`), { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to control network adapter", e);
    return false;
  }
}

export async function getRoutesClient(serverId: string): Promise<any[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/networks/routes`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch routes", e);
  }
  return [];
}

export async function addRouteClient(serverId: string, route: any): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/networks/routes`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(route)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to add route", e);
    return false;
  }
}

export async function deleteRouteClient(serverId: string, destination: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/networks/routes/${destination}`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete route", e);
    return false;
  }
}

export async function getDnsCacheClient(serverId: string): Promise<any[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/networks/dns-cache`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch DNS cache", e);
  }
  return [];
}

// Devices & Drivers
export async function getDevicesClient(serverId: string): Promise<Device[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/devices`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch devices", e);
  }
  return [];
}

// Virtual Machines (Hyper-V)
export async function getVMsClient(serverId: string): Promise<HyperVVM[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vms`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch VMs", e);
  }
  return [];
}

export async function controlVMClient(serverId: string, vmId: string, action: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vms/${vmId}/${action}`), { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to control VM", e);
    return false;
  }
}

export async function createVMClient(serverId: string, vm: Partial<HyperVVM>): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vms`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vm)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to create VM", e);
    return false;
  }
}

export async function updateVMSettingsClient(serverId: string, vmId: string, settings: Partial<HyperVVM>): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vms/${vmId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to update VM settings", e);
    return false;
  }
}

export async function deleteVMClient(serverId: string, vmId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vms/${vmId}`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete VM", e);
    return false;
  }
}

export async function checkpointVMClient(serverId: string, vmId: string, action: "create" | "apply" | "delete", snapshotName?: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vms/${vmId}/checkpoints`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, snapshotName })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to checkpoint VM", e);
    return false;
  }
}

// Virtual Switches
export async function getVirtualSwitchesClient(serverId: string): Promise<VirtualSwitch[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vswitches`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch virtual switches", e);
  }
  return [];
}

export async function createVirtualSwitchClient(serverId: string, vswitch: Partial<VirtualSwitch>): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vswitches`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vswitch)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to create virtual switch", e);
    return false;
  }
}

export async function deleteVirtualSwitchClient(serverId: string, switchId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vswitches/${switchId}`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete virtual switch", e);
    return false;
  }
}

export async function renameVirtualSwitchClient(serverId: string, switchId: string, newName: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vswitches/${switchId}/rename`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newName })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to rename virtual switch", e);
    return false;
  }
}

export async function updateVirtualSwitchClient(serverId: string, switchId: string, settings: Partial<VirtualSwitch>): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vswitches/${switchId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to update virtual switch", e);
    return false;
  }
}

export async function attachVmToSwitchClient(serverId: string, switchId: string, vmId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vswitches/${switchId}/attach/${vmId}`), { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to attach VM to switch", e);
    return false;
  }
}

export async function detachVmFromSwitchClient(serverId: string, switchId: string, vmId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vswitches/${switchId}/detach/${vmId}`), { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to detach VM from switch", e);
    return false;
  }
}

export const attachVmToVirtualSwitchClient = attachVmToSwitchClient;
export const detachVmFromVirtualSwitchClient = detachVmFromSwitchClient;

// Storage Replica
export async function getReplicaPartnershipsClient(serverId: string): Promise<ReplicaPartnership[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage-replica`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch storage replica partnerships", e);
  }
  return [];
}

export async function createReplicaPartnershipClient(serverId: string, partnership: Partial<ReplicaPartnership>): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage-replica`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partnership)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to create storage replica partnership", e);
    return false;
  }
}

export async function swapReplicaDirectionClient(serverId: string, partnershipId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage-replica/${partnershipId}/swap`), { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to swap replica direction", e);
    return false;
  }
}

export async function failoverReplicaClient(serverId: string, partnershipId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage-replica/${partnershipId}/failover`), { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to failover replica", e);
    return false;
  }
}

export async function toggleReplicaPauseClient(serverId: string, partnershipId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage-replica/${partnershipId}/toggle-pause`), { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to toggle replica pause", e);
    return false;
  }
}

export async function deleteReplicaPartnershipClient(serverId: string, partnershipId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage-replica/${partnershipId}`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete replica partnership", e);
    return false;
  }
}

export async function updateReplicaPartnershipClient(serverId: string, partnershipId: string, settings: Partial<ReplicaPartnership>): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage-replica/${partnershipId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to update replica partnership", e);
    return false;
  }
}

export async function resyncReplicaPartnershipClient(serverId: string, partnershipId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage-replica/${partnershipId}/resync`), { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to resync replica partnership", e);
    return false;
  }
}

// Windows File System Browser & Shares
export async function getFilesSourcesClient(serverId: string): Promise<FileSource[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/files/sources`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch file sources", e);
  }
  return [];
}

export async function getFilesListClient(serverId: string, path: string): Promise<FileItem[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/files/list?path=${encodeURIComponent(path)}`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch files list", e);
  }
  return [];
}

export async function createFolderClient(serverId: string, path: string, folderName: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/files/create-folder`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, folderName })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to create folder", e);
    return false;
  }
}

export async function deleteFileClient(serverId: string, path: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/files/delete`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete file", e);
    return false;
  }
}

export async function renameFileClient(serverId: string, oldPath: string, newName: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/files/rename`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPath, newName })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to rename file", e);
    return false;
  }
}

export async function readTextFileClient(serverId: string, path: string): Promise<string> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/files/read-text?path=${encodeURIComponent(path)}`));
    if (res.ok) {
      const data = await res.json();
      return data.content || "";
    }
  } catch (e) {
    console.error("Failed to read text file", e);
  }
  return "";
}

export async function writeTextFileClient(serverId: string, path: string, content: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/files/write-text`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to write text file", e);
    return false;
  }
}

export async function addNetworkShareClient(serverId: string, shareName: string, folderPath: string, description: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/files/add-share`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareName, folderPath, description })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to add network share", e);
    return false;
  }
}

export async function uploadFileClient(serverId: string, destinationPath: string, file: File): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("destinationPath", destinationPath);
    const res = await fetch(getApiUrl(`/servers/${serverId}/files/upload`), {
      method: "POST",
      body: formData
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to upload file", e);
    return false;
  }
}

export function getDownloadUrl(serverId: string, path: string): string {
  return getApiUrl(`/servers/${serverId}/files/download?path=${encodeURIComponent(path)}`);
}

export async function moveFileClient(serverId: string, sourcePath: string, targetPath: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/files/move`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourcePath, targetPath })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to move file", e);
    return false;
  }
}

export async function copyFileClient(serverId: string, sourcePath: string, targetPath: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/files/copy`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourcePath, targetPath })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to copy file", e);
    return false;
  }
}

export async function toggleFirewallRuleClient(serverId: string, ruleId: string, enable: boolean): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/firewall/${ruleId}/toggle`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enable })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to toggle firewall rule", e);
    return false;
  }
}

// Windows Updates
export async function getUpdatesClient(serverId: string, refresh: boolean = false): Promise<WindowsUpdate[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/updates?refresh=${refresh}`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch updates", e);
  }
  return [];
}

export async function checkUpdatesClient(serverId: string): Promise<WindowsUpdate[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/updates/check`), { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to check updates", e);
  }
  return [];
}

export async function installUpdatesClient(serverId: string, kbIds: string[]): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/updates/install`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kbIds })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to install updates", e);
    return false;
  }
}

export async function getUpdateHistoryClient(serverId: string): Promise<UpdateHistoryItem[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/updates/history`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch update history", e);
  }
  return [];
}

// Remote Desktop (RDP) Sessions & Config
export async function getRdpSessionsClient(serverId: string): Promise<RdpSession[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/rdp/sessions`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch RDP sessions", e);
  }
  return [];
}

export async function disconnectRdpSessionClient(serverId: string, sessionId: number): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/rdp/sessions/${sessionId}/disconnect`), { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to disconnect RDP session", e);
    return false;
  }
}

export async function logoffRdpSessionClient(serverId: string, sessionId: number): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/rdp/sessions/${sessionId}/logoff`), { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to logoff RDP session", e);
    return false;
  }
}

export async function sendMessageRdpSessionClient(serverId: string, sessionId: number, message: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/rdp/sessions/${sessionId}/message`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to send RDP message", e);
    return false;
  }
}

export async function getRdpConfigClient(serverId: string): Promise<RdpSecurityConfig | null> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/rdp/config`));
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch RDP config", e);
  }
  return null;
}

export async function updateRdpConfigClient(serverId: string, config: Partial<RdpSecurityConfig>): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/rdp/config`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to update RDP config", e);
    return false;
  }
}

// Windows Defender Security
export async function getDefenderStatusClient(serverId: string): Promise<DefenderStatus | null> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/defender/status`));
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch Defender status", e);
  }
  return null;
}

export async function updateDefenderStatusClient(serverId: string, partial: Partial<DefenderStatus>): Promise<DefenderStatus | null> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/defender/status`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to update Defender status", e);
  }
  return null;
}

export async function getDefenderThreatsClient(serverId: string): Promise<DefenderThreat[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/defender/threats`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch Defender threats", e);
  }
  return [];
}

export async function updateDefenderThreatClient(serverId: string, threatId: string, action: "Quarantine" | "Remove" | "Allow"): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/defender/threats/${threatId}/action`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to update Defender threat action", e);
    return false;
  }
}

export async function getDefenderExclusionsClient(serverId: string): Promise<DefenderExclusion[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/defender/exclusions`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch Defender exclusions", e);
  }
  return [];
}

export async function addDefenderExclusionClient(serverId: string, item: Omit<DefenderExclusion, "id" | "dateAdded" | "addedBy">): Promise<DefenderExclusion | null> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/defender/exclusions`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to add Defender exclusion", e);
  }
  return null;
}

export async function deleteDefenderExclusionClient(serverId: string, exclusionId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/defender/exclusions/${exclusionId}`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete Defender exclusion", e);
    return false;
  }
}

export async function getDefenderAsrRulesClient(serverId: string): Promise<DefenderAsrRule[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/defender/asr`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch Defender ASR rules", e);
  }
  return [];
}

export async function updateDefenderAsrRuleClient(serverId: string, ruleId: string, state: "Block" | "Audit" | "Disabled"): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/defender/asr/${ruleId}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to update Defender ASR rule", e);
    return false;
  }
}

// Windows Registry Editor
export async function getRegistryContentClient(serverId: string, path: string): Promise<RegistryContent | null> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/registry?path=${encodeURIComponent(path)}`));
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch registry content", e);
  }
  return null;
}

export async function createRegistryKeyClient(serverId: string, parentPath: string, keyName: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/registry/key`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentPath, keyName })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to create registry key", e);
    return false;
  }
}

export async function createRegistryValueClient(serverId: string, keyPath: string, value: RegistryValue): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/registry/value`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyPath, ...value })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to create registry value", e);
    return false;
  }
}

export async function deleteRegistryValueClient(serverId: string, keyPath: string, valueName: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/registry/value`), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyPath, valueName })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete registry value", e);
    return false;
  }
}

export async function deleteRegistryKeyClient(serverId: string, keyPath: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/registry/key`), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyPath })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete registry key", e);
    return false;
  }
}

export async function searchRegistryClient(serverId: string, rootPath: string, query: string): Promise<RegistrySearchResult[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/registry/search?rootPath=${encodeURIComponent(rootPath)}&q=${encodeURIComponent(query)}`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to search registry", e);
  }
  return [];
}

export const searchMockRegistry = searchRegistryClient;

export async function generateRegFileExport(serverId: string, keyPath: string): Promise<string> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/registry/export?path=${encodeURIComponent(keyPath)}`));
    if (res.ok) {
      const data = await res.json();
      return data.regContent || "";
    }
  } catch (e) {
    console.error("Failed to export .reg file", e);
  }
  return "";
}

// Notifications
export async function getNotificationsClient(): Promise<Notification[]> {
  try {
    const res = await fetch(getApiUrl(`/notifications`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error("Failed to fetch notifications", e);
  }
  return [];
}

export async function clearNotificationClient(id: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/notifications/${id}`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    console.error("Failed to clear notification", e);
    return false;
  }
}

export async function clearAllNotificationsClient(): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/notifications`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    console.error("Failed to clear all notifications", e);
    return false;
  }
}

export async function testNotificationClient(type: string = "Info"): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/notifications/test`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type })
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to trigger test notification", e);
    return false;
  }
}

// System Health API Client
export interface SubsystemHealth {
  name: string;
  type: string;
  status: "Healthy" | "Degraded" | "Unhealthy";
  pingMs: number;
  details: string;
}

export interface ApiModuleHealth {
  name: string;
  route: string;
  category: string;
  status: string;
  latencyMs: number;
  description: string;
}

export interface SystemHealthData {
  status: "Healthy" | "Degraded" | "Unhealthy";
  timestamp: string;
  uptimeSeconds: number;
  totalPingMs: number;
  version: string;
  memory: {
    allocatedMB: number;
    workingSetMB: number;
    gcTotalMB: number;
  };
  system: {
    os: string;
    machineName: string;
    processorCount: number;
    is64BitOS: boolean;
  };
  subsystems: SubsystemHealth[];
  apiModules: ApiModuleHealth[];
}

export async function getHealthClient(detailed: boolean = true): Promise<SystemHealthData | null> {
  try {
    const res = await fetch(getApiUrl(`/health?detailed=${detailed}`));
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch health data", e);
  }
  return null;
}

