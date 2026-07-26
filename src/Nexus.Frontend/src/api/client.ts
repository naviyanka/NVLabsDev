import { MOCK_SERVERS, getMockProcesses, getMockServices, controlMockService, setMockServiceStartupType, getMockDisks, getMockVolumes, optimizeMockVolume, checkMockVolume, changeMockVolumeLabel, changeMockDriveLetter, extendMockVolume, formatMockVolume, getEvents, getFirewallRules, addMockFirewallRule, deleteMockFirewallRule, updateMockFirewallRule, getLocalUsers, getLocalGroups, toggleMockUserStatus, toggleMockUserLockout, resetMockUserPassword, updateMockUserGroups, createMockUser, deleteMockUser, createMockGroup, deleteMockGroup, updateMockGroupMembers, type LocalUser, type LocalGroup, getCertificates, getMockCertificates, importMockCertificate, deleteMockCertificate, generateMockSelfSignedCert, renewMockCertificate, getNetworkAdapters, getDevices, getVMs, controlVM, createMockVM, updateMockVMSettings, checkpointMockVMAction, createMockVirtualSwitch, deleteMockVirtualSwitch, renameMockVirtualSwitch, updateMockVirtualSwitch, attachVmToMockSwitch, detachVmFromMockSwitch, getVirtualSwitches, getReplicaPartnerships, createMockReplicaPartnership, swapMockReplicaDirection, failoverMockReplica, toggleMockReplicaPause, deleteMockReplicaPartnership, updateMockReplicaPartnership, resyncMockReplicaPartnership, getMockFilesSources, getMockFilesList, createMockFolder, deleteMockFile, renameMockFile, readMockTextFile, writeMockTextFile, addMockNetworkShare, getMockTasks, runMockTask, toggleMockTask, deleteMockTask, createMockTask, editMockTask, exportMockTaskXml, getMockApps, installMockApp, uninstallMockApp, uploadMockInstaller, SOFTWARE_CATALOG, getSoftwareCatalog, addSoftwareCatalogItem, updateSoftwareCatalogItem, deleteSoftwareCatalogItem, resetSoftwareCatalog, getMockRoles, installMockRole, uninstallMockRole, getMockUpdates, checkMockUpdates, installMockUpdates, getMockUpdateHistory, getMockRdpSessions, disconnectMockRdpSession, logoffMockRdpSession, sendMessageMockRdpSession, getMockRdpConfig, updateMockRdpConfig, getMockDefenderStatus, updateMockDefenderStatus, getMockDefenderThreats, updateMockDefenderThreat, getMockDefenderExclusions, addMockDefenderExclusion, deleteMockDefenderExclusion, getMockDefenderAsrRules, updateMockDefenderAsrRule, getMockRegistryContent, createMockRegistryKey, createMockRegistryValue, deleteMockRegistryValue, deleteMockRegistryKey, searchMockRegistry, generateRegFileExport, type RegistryContent, type RegistryNode, type RegistryValue, type RegistrySearchResult, type DefenderStatus, type DefenderThreat, type DefenderExclusion, type DefenderAsrRule, type WindowsRole, type WindowsUpdate, type UpdateHistoryItem, type RdpSession, type RdpSecurityConfig, type SoftwareCatalogItem, type TaskExecutionLog, type Server, type PerfSample, type Process, type Service, type Disk, type Volume, type ScheduledTask, type InstalledApp, type FirewallRule, type EventEntry, type EventLevel, type HyperVVM, type Device, type VirtualSwitch, type ReplicaPartnership } from "./mock";
export type { Server, PerfSample, Process, Service, Disk, Volume, ScheduledTask, TaskExecutionLog, InstalledApp, SoftwareCatalogItem, FirewallRule, EventEntry, EventLevel, HyperVVM, Device, VirtualSwitch, ReplicaPartnership, WindowsRole, WindowsUpdate, UpdateHistoryItem, RdpSession, RdpSecurityConfig, DefenderStatus, DefenderThreat, DefenderExclusion, DefenderAsrRule, LocalUser, LocalGroup, RegistryContent, RegistryNode, RegistryValue, RegistrySearchResult };
export { SOFTWARE_CATALOG, getSoftwareCatalog, addSoftwareCatalogItem, updateSoftwareCatalogItem, deleteSoftwareCatalogItem, resetSoftwareCatalog, getMockRoles, installMockRole, uninstallMockRole, getMockUpdates, checkMockUpdates, installMockUpdates, getMockUpdateHistory, getMockRdpSessions, disconnectMockRdpSession, logoffMockRdpSession, sendMessageMockRdpSession, getMockRdpConfig, updateMockRdpConfig, getMockDefenderStatus, updateMockDefenderStatus, getMockDefenderThreats, updateMockDefenderThreat, getMockDefenderExclusions, addMockDefenderExclusion, deleteMockDefenderExclusion, getMockDefenderAsrRules, updateMockDefenderAsrRule, searchMockRegistry, generateRegFileExport };

import { getApiUrl } from "@/lib/backend";

export async function getAppsClient(serverId: string, refresh: boolean = false): Promise<InstalledApp[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/apps?refresh=${refresh}`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          ...item,
          sizeMB: typeof item.sizeMB === "number" ? item.sizeMB : (parseFloat(String(item.sizeMB)) || 0)
        }));
      }
    }
  } catch (e) {
    // Fail-safe graceful fallback when API is offline
  }
  return getMockApps(serverId);
}

export async function installAppClient(serverId: string, installerPath: string, args: string, sourceServerIp: string = ""): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/apps/install`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ installerPath, arguments: args, sourceServerIp })
    });
    if (res.ok) return true;
  } catch (e) {
    console.error("Failed to install app", e);
  }
  return installMockApp(serverId, installerPath, args);
}

export async function uploadInstallerClient(serverId: string, file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(getApiUrl(`/servers/${serverId}/apps/upload-installer`), {
      method: "POST",
      body: formData
    });
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      return data.path;
    }
  } catch (e) {
    console.error("Failed to upload installer", e);
  }
  return uploadMockInstaller(serverId, file);
}

export async function uninstallAppClient(serverId: string, uninstallString: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/apps/uninstall`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uninstallString })
    });
    if (res.ok) return true;
  } catch (e) {
    console.error("Failed to uninstall app", e);
  }
  return uninstallMockApp(serverId, uninstallString);
}
export async function getRolesClient(serverId: string, refresh: boolean = false): Promise<WindowsRole[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/roles?refresh=${refresh}`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    // Fail-safe graceful fallback
  }
  return getMockRoles(serverId);
}

export async function installRoleClient(serverId: string, name: string, featureType: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/roles/install`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, featureType })
    });
    if (res.ok) return true;
  } catch (e) {
    // Fallback to mock
  }
  return installMockRole(serverId, name);
}

export async function uninstallRoleClient(serverId: string, name: string, featureType: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/roles/uninstall`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, featureType })
    });
    if (res.ok) return true;
  } catch (e) {
    // Fallback to mock
  }
  return uninstallMockRole(serverId, name);
}

export async function getTasksClient(serverId: string): Promise<ScheduledTask[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/tasks`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    // Fail-safe graceful fallback
  }
  return getMockTasks(serverId);
}

export async function runTaskClient(serverId: string, taskPath: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/tasks/run`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskPath })
    });
    if (res.ok) return true;
  } catch (e) {
    console.error("Failed to run task", e);
  }
  return runMockTask(serverId, taskPath);
}

export async function getServersClient(): Promise<Server[]> {
  try {
    const res = await fetch(getApiUrl(`/servers`));
    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    }
  } catch (e) {
    // Graceful fail-safe fallback when gateway backend is unreachable
  }
  return MOCK_SERVERS; 
}

export async function addServerClient(data: { name: string; ip: string; role: string }) {
  await fetch(getApiUrl(`/servers`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

export async function editServerClient(ip: string, data: { name: string; ip: string; role: string }) {
  await fetch(getApiUrl(`/servers/${ip}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
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

export async function getPerformanceHistoryClient(serverId: string): Promise<PerfSample[]> {
  try {
    const res = await fetch(getApiUrl(`/performance/${serverId}`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      return await res.json();
    }
  } catch (e) {
    // Fail-safe graceful fallback when backend is unreachable
  }
  return [];
}

export async function getProcessesClient(serverId: string): Promise<Process[]> {
  try {
    const res = await fetch(getApiUrl(`/performance/${serverId}/processes`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    // Fail-safe graceful fallback when backend is unreachable
  }
  return getMockProcesses(serverId);
}

export async function getLiveProcessesClient(serverId: string): Promise<Process[]> {
  try {
    const res = await fetch(getApiUrl(`/performance/${serverId}/processes/live`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    // Fail-safe graceful fallback when backend is unreachable
  }
  return getMockProcesses(serverId);
}

export async function getProcessDetailsClient(serverId: string, pid: number): Promise<Process | null> {
  try {
    const res = await fetch(getApiUrl(`/performance/${serverId}/processes/${pid}`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      return await res.json();
    }
  } catch (e) {
    // Fail-safe graceful fallback
  }
  const mockProcs = getMockProcesses(serverId);
  return mockProcs.find(p => p.pid === pid) || null;
}

export async function killProcessClient(serverId: string, pid: number): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/performance/${serverId}/processes/${pid}`), {
      method: 'DELETE'
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function getServicesClient(serverId: string): Promise<Service[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/services`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    // Fail-safe graceful fallback
  }
  return getMockServices(serverId);
}

export async function controlServiceClient(serverId: string, name: string, action: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/services/${name}/${action}`), {
      method: 'POST'
    });
    if (res.ok) {
      controlMockService(serverId, name, action);
      return true;
    }
  } catch (e) {
    console.error("Failed to control service", e);
  }
  return controlMockService(serverId, name, action);
}

export async function setServiceStartupTypeClient(serverId: string, name: string, startupType: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/services/${name}/startup`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startupType })
    });
    if (res.ok) {
      setMockServiceStartupType(serverId, name, startupType);
      return true;
    }
  } catch (e) {
    console.error("Failed to update service startup type", e);
  }
  return setMockServiceStartupType(serverId, name, startupType);
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
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/files/sources`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}
  return getMockFilesSources(serverIp);
};

export const getFilesListClient = async (serverIp: string, path: string): Promise<FileItem[]> => {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/files/list?path=${encodeURIComponent(path)}`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      return await res.json();
    }
  } catch (e) {}
  return getMockFilesList(serverIp, path);
};

export const createFolderClient = async (serverIp: string, path: string, name: string): Promise<void> => {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/files/new-folder?path=${encodeURIComponent(path)}&name=${encodeURIComponent(name)}`), { method: "POST" });
    if (res.ok) return;
  } catch (e) {}
  createMockFolder(serverIp, path, name);
};

export const deleteFileClient = async (serverIp: string, path: string): Promise<void> => {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/files/delete?path=${encodeURIComponent(path)}`), { method: "DELETE" });
    if (res.ok) return;
  } catch (e) {}
  deleteMockFile(serverIp, path);
};

export const uploadFileClient = async (serverIp: string, path: string, file: File): Promise<void> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(getApiUrl(`/servers/${serverIp}/files/upload?path=${encodeURIComponent(path)}`), {
      method: "POST",
      body: formData,
    });
    if (res.ok) return;
  } catch (e) {}
  writeMockTextFile(serverIp, `${path}\\${file.name}`, `[Binary / Uploaded file contents for ${file.name}]`);
};

export const getDownloadUrl = (serverIp: string, path: string): string => {
  return getApiUrl(`/servers/${serverIp}/files/download?path=${encodeURIComponent(path)}`);
};

export const renameFileClient = async (serverIp: string, path: string, newName: string): Promise<void> => {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/files/rename?path=${encodeURIComponent(path)}&newName=${encodeURIComponent(newName)}`), { method: "POST" });
    if (res.ok) return;
  } catch (e) {}
  renameMockFile(serverIp, path, newName);
};

export const moveFileClient = async (serverIp: string, path: string, destPath: string): Promise<void> => {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/files/move?path=${encodeURIComponent(path)}&destPath=${encodeURIComponent(destPath)}`), { method: "POST" });
    if (res.ok) return;
  } catch (e) {}
  const fileName = path.split("\\").pop() || "item";
  deleteMockFile(serverIp, path);
  writeMockTextFile(serverIp, `${destPath}\\${fileName}`, readMockTextFile(serverIp, path));
};

export const copyFileClient = async (serverIp: string, path: string, destPath: string): Promise<void> => {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/files/copy?path=${encodeURIComponent(path)}&destPath=${encodeURIComponent(destPath)}`), { method: "POST" });
    if (res.ok) return;
  } catch (e) {}
  const fileName = path.split("\\").pop() || "item";
  writeMockTextFile(serverIp, `${destPath}\\${fileName}`, readMockTextFile(serverIp, path));
};

export const readTextFileClient = async (serverIp: string, path: string): Promise<string> => {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/files/read-text?path=${encodeURIComponent(path)}`));
    if (res.ok) {
      const data = await res.json();
      return data.content;
    }
  } catch (e) {}
  return readMockTextFile(serverIp, path);
};

export const writeTextFileClient = async (serverIp: string, path: string, content: string): Promise<void> => {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/files/write-text?path=${encodeURIComponent(path)}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    if (res.ok) return;
  } catch (e) {}
  writeMockTextFile(serverIp, path, content);
};

export const addNetworkShareClient = async (serverIp: string, name: string, uncPath: string): Promise<FileSource> => {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/files/shares`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, uncPath })
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return addMockNetworkShare(serverIp, name, uncPath);
};

export async function getDisksClient(serverId: string): Promise<Disk[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage/disks`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    // Fail-safe graceful fallback
  }
  return getMockDisks(serverId);
}

export async function getVolumesClient(serverId: string): Promise<Volume[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage/volumes`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    // Fail-safe graceful fallback
  }
  return getMockVolumes(serverId);
}

export async function optimizeVolumeClient(serverId: string, letter: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage/volumes/${letter}/optimize`), { method: "POST" });
    if (res.ok) return true;
  } catch (e) {}
  return optimizeMockVolume(serverId, letter);
}

export async function checkVolumeClient(serverId: string, letter: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage/volumes/${letter}/check`), { method: "POST" });
    if (res.ok) return true;
  } catch (e) {}
  return checkMockVolume(serverId, letter);
}

export async function changeVolumeLabelClient(serverId: string, letter: string, newLabel: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage/volumes/${letter}/label`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel })
    });
    if (res.ok) return true;
  } catch (e) {}
  return changeMockVolumeLabel(serverId, letter, newLabel);
}

export async function changeDriveLetterClient(serverId: string, oldLetter: string, newLetter: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage/volumes/${oldLetter}/letter`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newLetter })
    });
    if (res.ok) return true;
  } catch (e) {}
  return changeMockDriveLetter(serverId, oldLetter, newLetter);
}

export async function extendVolumeClient(serverId: string, letter: string, addGB: number): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage/volumes/${letter}/extend`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addGB })
    });
    if (res.ok) return true;
  } catch (e) {}
  return extendMockVolume(serverId, letter, addGB);
}

export async function formatVolumeClient(serverId: string, letter: string, fs: "NTFS" | "ReFS" | "FAT32"): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage/volumes/${letter}/format`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fs })
    });
    if (res.ok) return true;
  } catch (e) {}
  return formatMockVolume(serverId, letter, fs);
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

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: "Information",
    message: "NEXUS Management Service initialized on local node.",
    serverIp: "192.168.0.10",
    timestamp: new Date().toISOString(),
    isRead: false
  },
  {
    id: 2,
    type: "Warning",
    message: "High memory utilization (>80%) detected on SQL01.",
    serverIp: "192.168.0.30",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    isRead: false
  },
  {
    id: 3,
    type: "Critical",
    message: "Storage volume C: on FS01 reached 95% capacity.",
    serverIp: "192.168.0.50",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isRead: false
  }
];

export async function getNotificationsClient(): Promise<Notification[]> {
  try {
    const res = await fetch(getApiUrl(`/notifications`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    // Fail-safe graceful fallback when backend endpoint is not reachable
  }
  return MOCK_NOTIFICATIONS;
}

export const testNotificationClient = async (type: string, message: string) => {
  try {
    const t = localStorage.getItem("nexus_token");
    const res = await fetch(getApiUrl(`/notifications/test?type=${encodeURIComponent(type)}&message=${encodeURIComponent(message)}`), {
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
    const res = await fetch(getApiUrl(`/notifications/${id}`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function clearAllNotificationsClient(): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/notifications`), { method: "DELETE" });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function getUpdatesClient(serverIp: string): Promise<WindowsUpdate[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/updates`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    // Fallback gracefully to mock data
  }
  return getMockUpdates(serverIp);
}

export async function checkUpdatesClient(serverIp: string): Promise<WindowsUpdate[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/updates/check`), { method: "POST" });
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    // Fallback gracefully to mock data
  }
  return checkMockUpdates(serverIp);
}

export async function installUpdatesClient(serverIp: string, titles: string[]): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/updates/install`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updateTitles: titles })
    });
    if (res.ok || res.status === 202) {
      installMockUpdates(serverIp, titles);
      return true;
    }
  } catch (e) {
    // Fallback gracefully to mock data
  }
  return installMockUpdates(serverIp, titles);
}

export async function getUpdateHistoryClient(serverIp: string): Promise<UpdateHistoryItem[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/updates/history`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    // Fallback gracefully to mock data
  }
  return getMockUpdateHistory(serverIp);
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

export interface Certificate {
  id: string;
  thumbprint: string;
  subject: string;
  issuer: string;
  from: string;
  to: string;
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

export async function getCertificatesClient(serverIp: string, store: string = "Personal"): Promise<Certificate[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/certificates?store=${encodeURIComponent(store)}`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fallback to local store
  }
  return getMockCertificates(serverIp, store);
}

export interface LocalUser {
  name: string;
  fullName: string;
  lastLogin: string;
  enabled: boolean;
  passwordNeverExpires: boolean;
  groups: string[];
}

export interface LocalGroup {
  name: string;
  description: string;
  members: string[];
}

export async function getUsersClient(serverIp: string): Promise<LocalUser[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/users`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fallback to local store
  }
  return await getLocalUsers(serverIp);
}

export async function getGroupsClient(serverIp: string): Promise<LocalGroup[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/users/groups`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fallback to local store
  }
  return await getLocalGroups(serverIp);
}

import {
  getMockNetworkAdapters,
  updateMockNetworkAdapterConfig,
  controlMockNetworkAdapter,
  getMockRoutes,
  addMockRoute,
  deleteMockRoute,
  getMockDnsCache,
  type NetworkAdapter,
  type NetworkRoute,
  type DnsCacheEntry
} from "./mock";

export type { NetworkAdapter, NetworkRoute, DnsCacheEntry };

export async function getNetworksClient(serverIp: string): Promise<NetworkAdapter[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/networks`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fail-safe graceful fallback when backend API is offline
  }
  return getMockNetworkAdapters(serverIp);
}

export async function updateNetworkAdapterClient(
  serverIp: string,
  adapterName: string,
  config: Partial<NetworkAdapter>
): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/networks/${encodeURIComponent(adapterName)}/config`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return updateMockNetworkAdapterConfig(serverIp, adapterName, config);
}

export async function controlNetworkClient(serverIp: string, adapterName: string, action: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/networks/${encodeURIComponent(adapterName)}/${action}`), {
      method: "POST"
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return controlMockNetworkAdapter(serverIp, adapterName, action);
}

export async function getRoutesClient(serverIp: string): Promise<NetworkRoute[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/routes`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {
    // Fallback
  }
  return getMockRoutes(serverIp);
}

export async function addRouteClient(serverIp: string, route: NetworkRoute): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/routes`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(route)
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return addMockRoute(serverIp, route);
}

export async function deleteRouteClient(serverIp: string, destination: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/routes/${encodeURIComponent(destination)}`), {
      method: "DELETE"
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return deleteMockRoute(serverIp, destination);
}

export async function getDnsCacheClient(_serverIp: string): Promise<DnsCacheEntry[]> {
  return getMockDnsCache();
}


import {
  getMockSecurityData,
  updateMockSecurityCompliance,
  updateMockSecurityEventStatus,
  toggleMockLocalAdminExpected,
  type OpenPort,
  type LocalAdmin,
  type SecurityEvent,
  type SecurityComplianceCheck,
  type SecurityData
} from "./mock";

export type { OpenPort, LocalAdmin, SecurityEvent, SecurityComplianceCheck, SecurityData };

export async function getSecurityClient(serverIp: string, refresh = false): Promise<SecurityData | null> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/security?refresh=${refresh}`));
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.events)) return data;
    }
  } catch {
    // Fallback to local store
  }
  return getMockSecurityData(serverIp);
}

export async function updateComplianceCheckClient(serverIp: string, checkId: string, passed: boolean): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/security/compliance`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkId, passed })
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return updateMockSecurityCompliance(serverIp, checkId, passed);
}

export async function updateSecurityEventStatusClient(serverIp: string, eventId: string, status: "Reviewed" | "Resolved"): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/security/events/${eventId}/status`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return updateMockSecurityEventStatus(serverIp, eventId, status);
}

export async function toggleLocalAdminExpectedClient(serverIp: string, adminName: string, expected: boolean): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/security/local-admins/expected`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminName, expected })
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return toggleMockLocalAdminExpected(serverIp, adminName, expected);
}

export interface RegistryValue {
  name: string;
  type: string;
  data: string;
}

export interface RegistryNode {
  name: string;
  path: string;
  hasSubKeys: boolean;
}

export interface RegistryContent {
  subKeys: RegistryNode[];
  values: RegistryValue[];
}

export async function getRegistryContentClient(serverIp: string, path: string): Promise<RegistryContent> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/registry?path=${encodeURIComponent(path)}`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (data && (Array.isArray(data.subKeys) || Array.isArray(data.values))) return data;
    }
  } catch {
    // Fail-safe graceful fallback when backend API is offline
  }
  return getMockRegistryContent(serverIp, path);
}

// --- Firewall Client Endpoints
export async function getFirewallRulesClient(serverId: string): Promise<FirewallRule[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/firewall/rules`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.error("Failed to fetch firewall rules", e);
  }
  return await getFirewallRules(serverId);
}

export async function toggleFirewallRuleClient(serverId: string, ruleId: string, enabled: boolean): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/firewall/rules/${encodeURIComponent(ruleId)}/toggle`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled })
    });
    if (res.ok) return true;
  } catch (e) {
    console.error("Failed to toggle firewall rule", e);
  }
  return toggleFirewallRule(serverId, ruleId, enabled);
}

export async function addFirewallRuleClient(serverId: string, newRule: Omit<FirewallRule, "id">): Promise<FirewallRule | null> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/firewall/rules`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRule)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Failed to create firewall rule via API", e);
  }
  return await addMockFirewallRule(serverId, newRule);
}

export async function deleteFirewallRuleClient(serverId: string, ruleId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/firewall/rules/${encodeURIComponent(ruleId)}`), {
      method: "DELETE"
    });
    if (res.ok) return true;
  } catch (e) {
    console.error("Failed to delete firewall rule via API", e);
  }
  return await deleteMockFirewallRule(serverId, ruleId);
}

export async function updateFirewallRuleClient(serverId: string, ruleId: string, patch: Partial<FirewallRule>): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/firewall/rules/${encodeURIComponent(ruleId)}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (res.ok) return true;
  } catch (e) {
    console.error("Failed to update firewall rule via API", e);
  }
  return await updateMockFirewallRule(serverId, ruleId, patch);
}

// --- Events Client Endpoints
export async function getEventsClient(serverId: string, log: string = "System", limit: number = 60): Promise<EventEntry[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/events?log=${encodeURIComponent(log)}&limit=${limit}`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.error("Failed to fetch events", e);
  }
  return await getEvents(serverId, log as any, limit);
}

// --- Hyper-V Virtual Machines Client Endpoints
export async function getVMsClient(serverId: string): Promise<HyperVVM[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vms`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.error("Failed to fetch VMs", e);
  }
  return await getVMs(serverId);
}

export async function controlVMClient(serverId: string, vmId: string, action: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vms/${encodeURIComponent(vmId)}/${action}`), {
      method: "POST"
    });
    if (res.ok) return true;
  } catch {
    // Fallback to mock state handler
  }
  return await controlVM(serverId, vmId, action as any);
}

// --- Devices Client Endpoints
export async function getDevicesClient(serverId: string): Promise<Device[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/devices`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.error("Failed to fetch devices", e);
  }
  return await getDevices(serverId);
}

// --- Virtual Switches Client Endpoints
export async function getVirtualSwitchesClient(serverId: string): Promise<VirtualSwitch[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vswitches`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.error("Failed to fetch virtual switches", e);
  }
  return await getVirtualSwitches(serverId);
}

export async function renameVirtualSwitchClient(serverId: string, switchId: string, name: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vswitches/${encodeURIComponent(switchId)}/rename`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await renameMockVirtualSwitch(serverId, switchId, name);
}

export async function updateVirtualSwitchClient(serverId: string, switchId: string, updates: Partial<VirtualSwitch>): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vswitches/${encodeURIComponent(switchId)}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await updateMockVirtualSwitch(serverId, switchId, updates);
}

export async function attachVmToVirtualSwitchClient(serverId: string, switchId: string, vmName: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vswitches/${encodeURIComponent(switchId)}/attach-vm`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vmName })
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await attachVmToMockSwitch(serverId, switchId, vmName);
}

export async function detachVmFromVirtualSwitchClient(serverId: string, switchId: string, vmName: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vswitches/${encodeURIComponent(switchId)}/detach-vm`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vmName })
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await detachVmFromMockSwitch(serverId, switchId, vmName);
}

export async function deleteVirtualSwitchClient(serverId: string, switchId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vswitches/${encodeURIComponent(switchId)}`), {
      method: "DELETE"
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await deleteMockVirtualSwitch(serverId, switchId);
}

// --- Storage Replica Client Endpoints
export async function getReplicaPartnershipsClient(serverId: string): Promise<ReplicaPartnership[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage-replica`));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.error("Failed to fetch replica partnerships", e);
  }
  return await getReplicaPartnerships(serverId);
}

export async function swapReplicaDirectionClient(serverId: string, partnershipId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage-replica/${encodeURIComponent(partnershipId)}/swap`), {
      method: "POST"
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await swapMockReplicaDirection(partnershipId);
}

export async function failoverReplicaClient(serverId: string, partnershipId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage-replica/${encodeURIComponent(partnershipId)}/failover`), {
      method: "POST"
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await failoverMockReplica(partnershipId);
}

export async function toggleReplicaPauseClient(serverId: string, partnershipId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage-replica/${encodeURIComponent(partnershipId)}/toggle-pause`), {
      method: "POST"
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await toggleMockReplicaPause(partnershipId);
}

export async function deleteReplicaPartnershipClient(serverId: string, partnershipId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage-replica/${encodeURIComponent(partnershipId)}`), {
      method: "DELETE"
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await deleteMockReplicaPartnership(partnershipId);
}

export async function updateReplicaPartnershipClient(serverId: string, partnershipId: string, updates: Partial<ReplicaPartnership>): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage-replica/${encodeURIComponent(partnershipId)}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await updateMockReplicaPartnership(partnershipId, updates);
}

export async function resyncReplicaPartnershipClient(serverId: string, partnershipId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/storage-replica/${encodeURIComponent(partnershipId)}/resync`), {
      method: "POST"
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await resyncMockReplicaPartnership(partnershipId);
}

export async function importCertificateClient(serverIp: string, certData: string, password?: string, storeName: string = "Personal"): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/certificates/import`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ certData, password, store: storeName })
    });
    if (res.ok) {
      importMockCertificate(serverIp, storeName, certData, password);
      return true;
    }
  } catch (e) {
    console.error("Failed to import certificate via API", e);
  }
  importMockCertificate(serverIp, storeName, certData, password);
  return true;
}

export async function deleteCertificateClient(serverIp: string, thumbprint: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/certificates/${encodeURIComponent(thumbprint)}`), {
      method: "DELETE"
    });
    if (res.ok) {
      deleteMockCertificate(serverIp, thumbprint);
      return true;
    }
  } catch (e) {
    console.error("Failed to delete certificate via API", e);
  }
  return deleteMockCertificate(serverIp, thumbprint);
}

export async function generateSelfSignedCertClient(
  serverIp: string, 
  storeName: string, 
  params: { commonName: string; san?: string[]; daysValid: number; keySize: number; friendlyName?: string; purpose?: string }
): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/certificates/self-signed`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, store: storeName })
    });
    if (res.ok) {
      generateMockSelfSignedCert(serverIp, storeName, params);
      return true;
    }
  } catch (e) {
    console.error("Failed to generate self-signed cert via API", e);
  }
  generateMockSelfSignedCert(serverIp, storeName, params);
  return true;
}

export async function renewCertificateClient(serverIp: string, thumbprint: string, extendYears: number = 2): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/certificates/${encodeURIComponent(thumbprint)}/renew`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extendYears })
    });
    if (res.ok) {
      renewMockCertificate(serverIp, thumbprint, extendYears);
      return true;
    }
  } catch (e) {
    console.error("Failed to renew cert via API", e);
  }
  return renewMockCertificate(serverIp, thumbprint, extendYears) !== null;
}

export async function createUserClient(serverIp: string, user: { name: string; fullName: string; description?: string; password?: string; groups?: string[]; enabled?: boolean; passwordNeverExpires?: boolean; userCannotChangePassword?: boolean }): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/users`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
    if (res.ok) {
      createMockUser(serverIp, user);
      return true;
    }
  } catch (e) {
    console.error("Failed to create user", e);
  }
  return createMockUser(serverIp, user);
}

export async function deleteUserClient(serverIp: string, username: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/users/${encodeURIComponent(username)}`), {
      method: "DELETE"
    });
    if (res.ok) {
      deleteMockUser(serverIp, username);
      return true;
    }
  } catch (e) {
    console.error("Failed to delete user", e);
  }
  return deleteMockUser(serverIp, username);
}

export async function setUserStatusClient(serverIp: string, username: string, enabled: boolean): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/users/${encodeURIComponent(username)}/status`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled })
    });
    if (res.ok) {
      toggleMockUserStatus(serverIp, username, enabled);
      return true;
    }
  } catch (e) {
    console.error("Failed to update user status", e);
  }
  return toggleMockUserStatus(serverIp, username, enabled);
}

export async function setUserLockoutClient(serverIp: string, username: string, locked: boolean): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/users/${encodeURIComponent(username)}/lockout`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked })
    });
    if (res.ok) {
      toggleMockUserLockout(serverIp, username, locked);
      return true;
    }
  } catch (e) {
    console.error("Failed to update user lockout state", e);
  }
  return toggleMockUserLockout(serverIp, username, locked);
}

export async function resetUserPasswordClient(
  serverIp: string, 
  username: string, 
  opts: { password?: string; passwordNeverExpires?: boolean; userCannotChangePassword?: boolean }
): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/users/${encodeURIComponent(username)}/reset-password`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts)
    });
    if (res.ok) {
      resetMockUserPassword(serverIp, username, opts);
      return true;
    }
  } catch (e) {
    console.error("Failed to reset password", e);
  }
  return resetMockUserPassword(serverIp, username, opts);
}

export async function updateUserGroupsClient(serverIp: string, username: string, groups: string[]): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/users/${encodeURIComponent(username)}/groups`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groups })
    });
    if (res.ok) {
      updateMockUserGroups(serverIp, username, groups);
      return true;
    }
  } catch (e) {
    console.error("Failed to update user groups", e);
  }
  return updateMockUserGroups(serverIp, username, groups);
}

export async function createGroupClient(serverIp: string, group: LocalGroup): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/users/groups`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(group)
    });
    if (res.ok) {
      createMockGroup(serverIp, group);
      return true;
    }
  } catch (e) {
    console.error("Failed to create group", e);
  }
  return createMockGroup(serverIp, group);
}

export async function deleteGroupClient(serverIp: string, groupName: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/users/groups/${encodeURIComponent(groupName)}`), {
      method: "DELETE"
    });
    if (res.ok) {
      deleteMockGroup(serverIp, groupName);
      return true;
    }
  } catch (e) {
    console.error("Failed to delete group", e);
  }
  return deleteMockGroup(serverIp, groupName);
}

export async function updateGroupMembersClient(serverIp: string, groupName: string, members: string[]): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/users/groups/${encodeURIComponent(groupName)}/members`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members })
    });
    if (res.ok) {
      updateMockGroupMembers(serverIp, groupName, members);
      return true;
    }
  } catch (e) {
    console.error("Failed to update group members", e);
  }
  return updateMockGroupMembers(serverIp, groupName, members);
}

export async function createRegistryKeyClient(serverIp: string, path: string, keyName: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/registry/new-key`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, keyName })
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return createMockRegistryKey(serverIp, path, keyName);
}

export async function createRegistryValueClient(serverIp: string, path: string, name: string, type: string, data: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/registry/value`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, name, type, data })
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return createMockRegistryValue(serverIp, path, name, type as any, data);
}

export async function deleteRegistryValueClient(serverIp: string, path: string, name: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/registry/value?path=${encodeURIComponent(path)}&name=${encodeURIComponent(name)}`), {
      method: "DELETE"
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return deleteMockRegistryValue(serverIp, path, name);
}

export async function deleteRegistryKeyClient(serverIp: string, path: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/registry/key?path=${encodeURIComponent(path)}`), {
      method: "DELETE"
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return deleteMockRegistryKey(serverIp, path);
}

export async function toggleTaskClient(serverId: string, taskPath: string, enable: boolean): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/tasks/toggle`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskPath, enable })
    });
    if (res.ok) return true;
  } catch (e) {
    console.error("Failed to toggle task", e);
  }
  return toggleMockTask(serverId, taskPath, enable);
}

export async function deleteTaskClient(serverId: string, taskPath: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/tasks/delete`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskPath })
    });
    if (res.ok) return true;
  } catch (e) {
    console.error("Failed to delete task", e);
  }
  return deleteMockTask(serverId, taskPath);
}

export async function createTaskClient(serverId: string, task: ScheduledTask): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/tasks/create`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task)
    });
    if (res.ok) return true;
  } catch (e) {
    console.error("Failed to create task", e);
  }
  return createMockTask(serverId, task);
}

export async function editTaskClient(serverId: string, originalPath: string, updatedTask: ScheduledTask): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/tasks/edit`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalPath, task: updatedTask })
    });
    if (res.ok) return true;
  } catch (e) {
    console.error("Failed to edit task", e);
  }
  return editMockTask(serverId, originalPath, updatedTask);
}

export async function exportTaskXmlClient(serverId: string, taskPath: string): Promise<string> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/tasks/xml?path=${encodeURIComponent(taskPath)}`));
    if (res.ok) return await res.text();
  } catch (e) {
    console.error("Failed to fetch task XML", e);
  }
  return exportMockTaskXml(serverId, taskPath);
}

export async function createVMClient(serverId: string, config: { name: string; os?: string; memoryMb: number; vcpu: number; vswitch: string; vhdxSizeGb: number; generation?: 1|2; dynamicMemory?: boolean; isoPath?: string; notes?: string }): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vms`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await createMockVM(serverId, config);
}

export async function updateVMSettingsClient(serverId: string, vmId: string, updates: Partial<HyperVVM>): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vms/${encodeURIComponent(vmId)}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await updateMockVMSettings(serverId, vmId, updates);
}

export async function deleteVMClient(serverId: string, vmId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vms/${encodeURIComponent(vmId)}`), {
      method: "DELETE"
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await controlVM(serverId, vmId, "delete");
}

export async function checkpointVMClient(serverId: string, vmId: string, action: "create" | "apply" | "delete", snapshotName?: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vms/${encodeURIComponent(vmId)}/checkpoint`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, snapshotName })
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await checkpointMockVMAction(serverId, vmId, action, snapshotName);
}

export async function createVirtualSwitchClient(serverId: string, config: { name: string; type: "External"|"Internal"|"Private"; adapterName?: string; notes?: string }): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverId}/vswitches`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await createMockVirtualSwitch(serverId, config);
}

export async function createReplicaPartnershipClient(sourceServer: string, config: { 
  destServer: string; 
  sourceVol: string; 
  sourceLogVol?: string;
  destVol: string; 
  destLogVol?: string;
  mode: "Synchronous" | "Asynchronous";
  replicationGroup?: string;
  logSizeGb?: number;
  encryption?: boolean;
}): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${sourceServer}/storage-replica`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }
  return await createMockReplicaPartnership(config);
}

// --- RDP Sessions & Configuration
export async function getRdpSessionsClient(serverIp: string): Promise<RdpSession[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/rdp/sessions`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    // Fallback gracefully to mock data
  }
  return getMockRdpSessions(serverIp);
}

export async function disconnectRdpSessionClient(serverIp: string, sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/rdp/sessions/${sessionId}/disconnect`), { method: "POST" });
    if (res.ok) {
      disconnectMockRdpSession(serverIp, sessionId);
      return true;
    }
  } catch (e) {
    // Fallback gracefully
  }
  return disconnectMockRdpSession(serverIp, sessionId);
}

export async function logoffRdpSessionClient(serverIp: string, sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/rdp/sessions/${sessionId}/logoff`), { method: "DELETE" });
    if (res.ok) {
      logoffMockRdpSession(serverIp, sessionId);
      return true;
    }
  } catch (e) {
    // Fallback gracefully
  }
  return logoffMockRdpSession(serverIp, sessionId);
}

export async function sendMessageRdpSessionClient(serverIp: string, sessionId: string, messageText: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/rdp/sessions/${sessionId}/message`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: messageText })
    });
    if (res.ok) {
      sendMessageMockRdpSession(serverIp, sessionId, messageText);
      return true;
    }
  } catch (e) {
    // Fallback gracefully
  }
  return sendMessageMockRdpSession(serverIp, sessionId, messageText);
}

export async function getRdpConfigClient(serverIp: string): Promise<RdpSecurityConfig> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/rdp/config`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (data) return data;
    }
  } catch (e) {
    // Fallback
  }
  return getMockRdpConfig(serverIp);
}

export async function updateRdpConfigClient(serverIp: string, config: Partial<RdpSecurityConfig>): Promise<RdpSecurityConfig> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/rdp/config`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (data) {
        updateMockRdpConfig(serverIp, config);
        return data;
      }
    }
  } catch (e) {
    // Fallback
  }
  return updateMockRdpConfig(serverIp, config);
}

// --- Windows Defender Client Wrappers
export async function getDefenderStatusClient(serverIp: string): Promise<DefenderStatus> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/defender/status`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (data) return data;
    }
  } catch (e) {
    // Fallback
  }
  return getMockDefenderStatus(serverIp);
}

export async function updateDefenderStatusClient(serverIp: string, partial: Partial<DefenderStatus>): Promise<DefenderStatus> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/defender/status`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial)
    });
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (data) {
        updateMockDefenderStatus(serverIp, partial);
        return data;
      }
    }
  } catch (e) {
    // Fallback
  }
  return updateMockDefenderStatus(serverIp, partial);
}

export async function getDefenderThreatsClient(serverIp: string): Promise<DefenderThreat[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/defender/threats`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    // Fallback
  }
  return getMockDefenderThreats(serverIp);
}

export async function updateDefenderThreatClient(serverIp: string, threatId: string, action: "Quarantine" | "Remove" | "Allow"): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/defender/threats/${threatId}/action`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    if (res.ok) {
      updateMockDefenderThreat(serverIp, threatId, action);
      return true;
    }
  } catch (e) {
    // Fallback
  }
  return updateMockDefenderThreat(serverIp, threatId, action);
}

export async function getDefenderExclusionsClient(serverIp: string): Promise<DefenderExclusion[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/defender/exclusions`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    // Fallback
  }
  return getMockDefenderExclusions(serverIp);
}

export async function addDefenderExclusionClient(serverIp: string, item: Omit<DefenderExclusion, "id" | "dateAdded" | "addedBy">): Promise<DefenderExclusion> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/defender/exclusions`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (data) {
        addMockDefenderExclusion(serverIp, item);
        return data;
      }
    }
  } catch (e) {
    // Fallback
  }
  return addMockDefenderExclusion(serverIp, item);
}

export async function deleteDefenderExclusionClient(serverIp: string, exclusionId: string): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/defender/exclusions/${exclusionId}`), {
      method: "DELETE"
    });
    if (res.ok) {
      deleteMockDefenderExclusion(serverIp, exclusionId);
      return true;
    }
  } catch (e) {
    // Fallback
  }
  return deleteMockDefenderExclusion(serverIp, exclusionId);
}

export async function getDefenderAsrRulesClient(serverIp: string): Promise<DefenderAsrRule[]> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/defender/asr`));
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    // Fallback
  }
  return getMockDefenderAsrRules(serverIp);
}

export async function updateDefenderAsrRuleClient(serverIp: string, ruleId: string, state: "Block" | "Audit" | "Disabled"): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl(`/servers/${serverIp}/defender/asr/${ruleId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state })
    });
    if (res.ok) {
      updateMockDefenderAsrRule(serverIp, ruleId, state);
      return true;
    }
  } catch (e) {
    // Fallback
  }
  return updateMockDefenderAsrRule(serverIp, ruleId, state);
}

