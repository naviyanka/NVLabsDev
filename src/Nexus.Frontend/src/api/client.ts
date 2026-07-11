import { type Server, type PerfSample, type Process, type Service, type Disk, type Volume, type ScheduledTask, type InstalledApp } from "./mock";
export type { Server, PerfSample, Process, Service, Disk, Volume, ScheduledTask, InstalledApp };

const API_BASE = "/api";

export async function getAppsClient(serverId: string, refresh: boolean = false): Promise<InstalledApp[]> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverId}/apps?refresh=${refresh}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch apps", e);
  }
  return [];
}

export async function installAppClient(serverId: string, installerPath: string, args: string, sourceServerIp: string = ""): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverId}/apps/install`, {
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
    const res = await fetch(`${API_BASE}/servers/${serverId}/apps/upload-installer`, {
      method: "POST",
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      return data.path;
    }
    return null;
  } catch (e) {
    console.error("Failed to upload installer", e);
    return null;
  }
}

export async function uninstallAppClient(serverId: string, uninstallString: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverId}/apps/uninstall`, {
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
export interface WindowsRole {
  name: string;
  displayName: string;
  installState: string;
  featureType: string;
}

export async function getRolesClient(serverId: string, refresh: boolean = false): Promise<WindowsRole[]> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverId}/roles?refresh=${refresh}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch roles", e);
  }
  return [];
}

export async function installRoleClient(serverId: string, name: string, featureType: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverId}/roles/install`, {
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
    const res = await fetch(`${API_BASE}/servers/${serverId}/roles/uninstall`, {
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

export async function getTasksClient(serverId: string): Promise<ScheduledTask[]> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverId}/tasks`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch tasks", e);
  }
  return [];
}

export async function runTaskClient(serverId: string, taskPath: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverId}/tasks/run`, {
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

export async function getServersClient(): Promise<Server[]> {
  try {
    const res = await fetch(`${API_BASE}/servers`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch servers", e);
  }
  return []; 
}

export async function addServerClient(data: { name: string; ip: string; role: string }) {
  await fetch(`${API_BASE}/servers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

export async function editServerClient(ip: string, data: { name: string; ip: string; role: string }) {
  await fetch(`${API_BASE}/servers/${ip}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

export async function deleteServerClient(ip: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/servers/${ip}`, { method: "DELETE" });
    return res.ok;
  } catch (e) {
    console.error("Failed to delete server", e);
    return false;
  }
}

export async function restartServerClient(ip: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/servers/${ip}/restart`, { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to restart server", e);
    return false;
  }
}

export async function shutdownServerClient(ip: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/servers/${ip}/shutdown`, { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Failed to shutdown server", e);
    return false;
  }
}

export async function getPerformanceHistoryClient(serverId: string): Promise<PerfSample[]> {
  try {
    const res = await fetch(`${API_BASE}/performance/${serverId}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch performance", e);
  }
  return [];
}

export async function getProcessesClient(serverId: string): Promise<Process[]> {
  try {
    const res = await fetch(`${API_BASE}/performance/${serverId}/processes`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch processes", e);
  }
  return [];
}

export async function getLiveProcessesClient(serverId: string): Promise<Process[]> {
  try {
    const res = await fetch(`${API_BASE}/performance/${serverId}/processes/live`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch live processes", e);
  }
  return [];
}

export async function killProcessClient(serverId: string, pid: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/performance/${serverId}/processes/${pid}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to kill process", e);
    return false;
  }
}

export async function getServicesClient(serverId: string): Promise<Service[]> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverId}/services`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch services", e);
  }
  return [];
}

export async function controlServiceClient(serverId: string, name: string, action: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverId}/services/${name}/${action}`, {
      method: 'POST'
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to control service", e);
    return false;
  }
}

export interface FileSource {
  name: string;
  type: string;
  path: string;
}

export interface FileItem {
  name: string;
  type: string;
  size: number;
  modified: string;
  attrs: string;
}

export const getFilesSourcesClient = async (serverIp: string): Promise<FileSource[]> => {
  const res = await fetch(`${API_BASE}/servers/${serverIp}/files/sources`);
  if (!res.ok) return [];
  return res.json();
};

export const getFilesListClient = async (serverIp: string, path: string): Promise<FileItem[]> => {
  const res = await fetch(`${API_BASE}/servers/${serverIp}/files/list?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error("Failed to list files");
  return res.json();
};

export const createFolderClient = async (serverIp: string, path: string, name: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/servers/${serverIp}/files/new-folder?path=${encodeURIComponent(path)}&name=${encodeURIComponent(name)}`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to create folder");
  }
};

export const deleteFileClient = async (serverIp: string, path: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/servers/${serverIp}/files/delete?path=${encodeURIComponent(path)}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to delete");
  }
};

export const uploadFileClient = async (serverIp: string, path: string, file: File): Promise<void> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/servers/${serverIp}/files/upload?path=${encodeURIComponent(path)}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to upload");
  }
};

export const getDownloadUrl = (serverIp: string, path: string): string => {
  return `${API_BASE}/servers/${serverIp}/files/download?path=${encodeURIComponent(path)}`;
};

export const renameFileClient = async (serverIp: string, path: string, newName: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/servers/${serverIp}/files/rename?path=${encodeURIComponent(path)}&newName=${encodeURIComponent(newName)}`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to rename");
  }
};

export const moveFileClient = async (serverIp: string, path: string, destPath: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/servers/${serverIp}/files/move?path=${encodeURIComponent(path)}&destPath=${encodeURIComponent(destPath)}`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to move");
  }
};

export const copyFileClient = async (serverIp: string, path: string, destPath: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/servers/${serverIp}/files/copy?path=${encodeURIComponent(path)}&destPath=${encodeURIComponent(destPath)}`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to copy");
  }
};

export const readTextFileClient = async (serverIp: string, path: string): Promise<string> => {
  const res = await fetch(`${API_BASE}/servers/${serverIp}/files/read-text?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error("Failed to read text file");
  const data = await res.json();
  return data.content;
};

export const writeTextFileClient = async (serverIp: string, path: string, content: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/servers/${serverIp}/files/write-text?path=${encodeURIComponent(path)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });
  if (!res.ok) throw new Error("Failed to write text file");
};

export async function getDisksClient(serverId: string): Promise<Disk[]> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverId}/storage/disks`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch disks", e);
  }
  return [];
}

export async function getVolumesClient(serverId: string): Promise<Volume[]> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverId}/storage/volumes`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch volumes", e);
  }
  return [];
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  serverIp: string;
  timestamp: string;
  isRead: boolean;
}

export interface WindowsUpdate {
  title: string;
  description: string;
  maxDownloadSize: number;
}

export async function getNotificationsClient(): Promise<Notification[]> {
  try {
    const res = await fetch(`${API_BASE}/notifications`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch notifications", e);
  }
  return [];
}

export const testNotificationClient = async (type: string, message: string) => {
  try {
    const t = localStorage.getItem("nexus_token");
    const res = await fetch(`${API_BASE}/notifications/test?type=${encodeURIComponent(type)}&message=${encodeURIComponent(message)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${t}` }
    });
    if (!res.ok) {
      console.error("Test notification failed with status", res.status);
    }
  } catch (err: any) {
    console.error("Test notification fetch error:", err);
  }
};

export async function clearNotificationClient(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notifications/${id}`, { method: "DELETE" });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function clearAllNotificationsClient(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notifications`, { method: "DELETE" });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function getUpdatesClient(serverIp: string): Promise<WindowsUpdate[]> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverIp}/updates`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch updates", e);
  }
  return [];
}

export async function checkUpdatesClient(serverIp: string): Promise<WindowsUpdate[]> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverIp}/updates/check`, { method: "POST" });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to check updates", e);
  }
  return [];
}

export async function installUpdatesClient(serverIp: string, titles: string[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/servers/${serverIp}/updates/install`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updateTitles: titles })
    });
    return res.ok || res.status === 202;
  } catch (e) {
    console.error("Failed to install updates", e);
  }
  return false;
}

// --- PowerShell (persistent sessions)
export interface PSResult { command: string; output: string; error?: string; sessionId?: string; }

export interface AppSettings {
  language: string;
  defaultLandingPage: string;
  autoRefreshInterval: number;
  theme: string;
  uiDensity: string;
  animationsEnabled: boolean;
  adSyncInterval: number;
  sessionTimeout: number;
  mfaRequired: boolean;
  cpuAlertThreshold: number;
  ramAlertThreshold: number;
  notificationEmail: string;
  webhookUrl: string;
  telemetryRetentionDays: number;
  logLevel: string;
  pluginCategories: string;
  terminalTheme: string;
  dashboardLayout: string;
  appName: string;
  appSubtitle: string;
  companyLogoUrl: string;
  sidebarState: string;
  accentColor: string;
  defaultWinRmPort: number;
  requireHttpsForRemote: boolean;
  maxConcurrentSessions: number;

  diskAlertThreshold: number;
  alertQuietHours: string;
  discordWebhookUrl: string;
  slackWebhookUrl: string;
  maintenanceMode: boolean;
  auditLoggingEnabled: boolean;

  isFirstRunSetup: boolean;
  dataDirectoryPath: string;
  webBindingPort: number;
  timeZoneFormat: string;
  defaultViewMode: string;
  showStatusBadges: boolean;
  defaultDomainName: string;
  trustRelationshipPresets: string;
  psExecutionPolicy: string;
  scriptLibraryPath: string;
  appLoginMethod: string;
  enableRbac: boolean;
  healthCheckInterval: number;
  logFilePath: string;
}
