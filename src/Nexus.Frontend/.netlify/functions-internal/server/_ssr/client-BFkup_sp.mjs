//#region node_modules/.nitro/vite/services/ssr/assets/client-BFkup_sp.js
var STORAGE_KEY = "nexus_backend_url";
/**
* Get the configured backend base URL.
* Returns empty string if not configured (local dev mode uses Vite proxy).
*/
function getBackendUrl() {
	if (typeof window === "undefined") return "";
	return localStorage.getItem(STORAGE_KEY) || "";
}
/**
* Set the backend base URL (e.g. "https://abc123.ngrok-free.app").
* Strips trailing slashes for consistency.
*/
function setBackendUrl(url) {
	const clean = url.replace(/\/+$/, "");
	localStorage.setItem(STORAGE_KEY, clean);
	window.dispatchEvent(new CustomEvent("nexus-backend-url-changed"));
}
/**
* Clear backend URL — reverts to local dev proxy mode.
*/
function clearBackendUrl() {
	localStorage.removeItem(STORAGE_KEY);
	window.dispatchEvent(new CustomEvent("nexus-backend-url-changed"));
}
/**
* Build full API URL from a path like "/servers/localhost/services".
* - Configured: "https://tunnel.example.com/api/servers/localhost/services"
* - Not configured: "/api/servers/localhost/services" (Vite proxy handles it)
*/
function getApiUrl(path) {
	const base = getBackendUrl();
	if (!base) return `/api${path}`;
	return `${base}/api${path}`;
}
/**
* Build full URL for any /api or /hub path.
* Use for SignalR hubs: getFullUrl("/hub/notifications")
* Use for raw API: getFullUrl("/api/health")
*/
function getFullUrl(path) {
	const base = getBackendUrl();
	if (!base) return path;
	return `${base}${path}`;
}
/**
* Build WebSocket URL from an HTTP path.
* Converts http(s) base to ws(s).
*/
function getWsUrl(path) {
	const base = getBackendUrl();
	if (!base) return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${path}`;
	return `${base.replace(/^http/, "ws")}${path}`;
}
/**
* Test if a backend URL is reachable by hitting /api/health.
* Returns true if healthy, false otherwise.
*/
async function testBackendConnection(url) {
	const target = url || getBackendUrl();
	if (!target) return false;
	try {
		const cleanUrl = target.replace(/\/+$/, "");
		return (await fetch(`${cleanUrl}/api/health`, {
			method: "GET",
			signal: AbortSignal.timeout(5e3)
		})).ok;
	} catch {
		return false;
	}
}
async function getAppsClient(serverId, refresh = false) {
	try {
		const res = await fetch(getApiUrl(`/servers/${serverId}/apps?refresh=${refresh}`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch apps", e);
	}
	return [];
}
async function installAppClient(serverId, installerPath, args, sourceServerIp = "") {
	try {
		return (await fetch(getApiUrl(`/servers/${serverId}/apps/install`), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				installerPath,
				arguments: args,
				sourceServerIp
			})
		})).ok;
	} catch (e) {
		console.error("Failed to install app", e);
		return false;
	}
}
async function uploadInstallerClient(serverId, file) {
	try {
		const formData = new FormData();
		formData.append("file", file);
		const res = await fetch(getApiUrl(`/servers/${serverId}/apps/upload-installer`), {
			method: "POST",
			body: formData
		});
		if (res.ok) return (await res.json()).path;
		return null;
	} catch (e) {
		console.error("Failed to upload installer", e);
		return null;
	}
}
async function uninstallAppClient(serverId, uninstallString) {
	try {
		return (await fetch(getApiUrl(`/servers/${serverId}/apps/uninstall`), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ uninstallString })
		})).ok;
	} catch (e) {
		console.error("Failed to uninstall app", e);
		return false;
	}
}
async function getRolesClient(serverId, refresh = false) {
	try {
		const res = await fetch(getApiUrl(`/servers/${serverId}/roles?refresh=${refresh}`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch roles", e);
	}
	return [];
}
async function installRoleClient(serverId, name, featureType) {
	try {
		return (await fetch(getApiUrl(`/servers/${serverId}/roles/install`), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name,
				featureType
			})
		})).ok;
	} catch (e) {
		console.error("Failed to install role", e);
		return false;
	}
}
async function uninstallRoleClient(serverId, name, featureType) {
	try {
		return (await fetch(getApiUrl(`/servers/${serverId}/roles/uninstall`), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name,
				featureType
			})
		})).ok;
	} catch (e) {
		console.error("Failed to uninstall role", e);
		return false;
	}
}
async function getTasksClient(serverId) {
	try {
		const res = await fetch(getApiUrl(`/servers/${serverId}/tasks`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch tasks", e);
	}
	return [];
}
async function runTaskClient(serverId, taskPath) {
	try {
		return (await fetch(getApiUrl(`/servers/${serverId}/tasks/run`), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ taskPath })
		})).ok;
	} catch (e) {
		console.error("Failed to run task", e);
		return false;
	}
}
async function getServersClient() {
	try {
		const res = await fetch(getApiUrl(`/servers`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch servers", e);
	}
	return [];
}
async function addServerClient(data) {
	await fetch(getApiUrl(`/servers`), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data)
	});
}
async function editServerClient(ip, data) {
	await fetch(getApiUrl(`/servers/${ip}`), {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data)
	});
}
async function deleteServerClient(ip) {
	try {
		return (await fetch(getApiUrl(`/servers/${ip}`), { method: "DELETE" })).ok;
	} catch (e) {
		console.error("Failed to delete server", e);
		return false;
	}
}
async function restartServerClient(ip) {
	try {
		return (await fetch(getApiUrl(`/servers/${ip}/restart`), { method: "POST" })).ok;
	} catch (e) {
		console.error("Failed to restart server", e);
		return false;
	}
}
async function shutdownServerClient(ip) {
	try {
		return (await fetch(getApiUrl(`/servers/${ip}/shutdown`), { method: "POST" })).ok;
	} catch (e) {
		console.error("Failed to shutdown server", e);
		return false;
	}
}
async function getPerformanceHistoryClient(serverId) {
	try {
		const res = await fetch(getApiUrl(`/performance/${serverId}`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch performance", e);
	}
	return [];
}
async function getProcessesClient(serverId) {
	try {
		const res = await fetch(getApiUrl(`/performance/${serverId}/processes`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch processes", e);
	}
	return [];
}
async function getLiveProcessesClient(serverId) {
	try {
		const res = await fetch(getApiUrl(`/performance/${serverId}/processes/live`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch live processes", e);
	}
	return [];
}
async function getProcessDetailsClient(serverId, pid) {
	try {
		const res = await fetch(getApiUrl(`/performance/${serverId}/processes/${pid}`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch process details", e);
	}
	return null;
}
async function killProcessClient(serverId, pid) {
	try {
		return (await fetch(getApiUrl(`/performance/${serverId}/processes/${pid}`), { method: "DELETE" })).ok;
	} catch (e) {
		console.error("Failed to kill process", e);
		return false;
	}
}
async function getServicesClient(serverId) {
	try {
		const res = await fetch(getApiUrl(`/servers/${serverId}/services`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch services", e);
	}
	return [];
}
async function controlServiceClient(serverId, name, action) {
	try {
		return (await fetch(getApiUrl(`/servers/${serverId}/services/${name}/${action}`), { method: "POST" })).ok;
	} catch (e) {
		console.error("Failed to control service", e);
		return false;
	}
}
var getFilesSourcesClient = async (serverIp) => {
	const res = await fetch(getApiUrl(`/servers/${serverIp}/files/sources`));
	if (!res.ok) return [];
	return res.json();
};
var getFilesListClient = async (serverIp, path) => {
	const res = await fetch(getApiUrl(`/servers/${serverIp}/files/list?path=${encodeURIComponent(path)}`));
	if (!res.ok) throw new Error("Failed to list files");
	return res.json();
};
var createFolderClient = async (serverIp, path, name) => {
	const res = await fetch(getApiUrl(`/servers/${serverIp}/files/new-folder?path=${encodeURIComponent(path)}&name=${encodeURIComponent(name)}`), { method: "POST" });
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.message || "Failed to create folder");
	}
};
var deleteFileClient = async (serverIp, path) => {
	const res = await fetch(getApiUrl(`/servers/${serverIp}/files/delete?path=${encodeURIComponent(path)}`), { method: "DELETE" });
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.message || "Failed to delete");
	}
};
var uploadFileClient = async (serverIp, path, file) => {
	const formData = new FormData();
	formData.append("file", file);
	const res = await fetch(getApiUrl(`/servers/${serverIp}/files/upload?path=${encodeURIComponent(path)}`), {
		method: "POST",
		body: formData
	});
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.message || "Failed to upload");
	}
};
var getDownloadUrl = (serverIp, path) => {
	return getApiUrl(`/servers/${serverIp}/files/download?path=${encodeURIComponent(path)}`);
};
var renameFileClient = async (serverIp, path, newName) => {
	const res = await fetch(getApiUrl(`/servers/${serverIp}/files/rename?path=${encodeURIComponent(path)}&newName=${encodeURIComponent(newName)}`), { method: "POST" });
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.message || "Failed to rename");
	}
};
var moveFileClient = async (serverIp, path, destPath) => {
	const res = await fetch(getApiUrl(`/servers/${serverIp}/files/move?path=${encodeURIComponent(path)}&destPath=${encodeURIComponent(destPath)}`), { method: "POST" });
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.message || "Failed to move");
	}
};
var copyFileClient = async (serverIp, path, destPath) => {
	const res = await fetch(getApiUrl(`/servers/${serverIp}/files/copy?path=${encodeURIComponent(path)}&destPath=${encodeURIComponent(destPath)}`), { method: "POST" });
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.message || "Failed to copy");
	}
};
var readTextFileClient = async (serverIp, path) => {
	const res = await fetch(getApiUrl(`/servers/${serverIp}/files/read-text?path=${encodeURIComponent(path)}`));
	if (!res.ok) throw new Error("Failed to read text file");
	return (await res.json()).content;
};
var writeTextFileClient = async (serverIp, path, content) => {
	if (!(await fetch(getApiUrl(`/servers/${serverIp}/files/write-text?path=${encodeURIComponent(path)}`), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ content })
	})).ok) throw new Error("Failed to write text file");
};
async function getDisksClient(serverId) {
	try {
		const res = await fetch(getApiUrl(`/servers/${serverId}/storage/disks`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch disks", e);
	}
	return [];
}
async function getVolumesClient(serverId) {
	try {
		const res = await fetch(getApiUrl(`/servers/${serverId}/storage/volumes`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch volumes", e);
	}
	return [];
}
async function getNotificationsClient() {
	try {
		const res = await fetch(getApiUrl(`/notifications`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch notifications", e);
	}
	return [];
}
var testNotificationClient = async (type, message) => {
	try {
		const t = localStorage.getItem("nexus_token");
		const res = await fetch(getApiUrl(`/notifications/test?type=${encodeURIComponent(type)}&message=${encodeURIComponent(message)}`), {
			method: "POST",
			headers: { Authorization: `Bearer ${t}` }
		});
		if (!res.ok) console.error("Test notification failed with status", res.status);
	} catch (err) {
		console.error("Test notification fetch error:", err);
	}
};
async function clearNotificationClient(id) {
	try {
		return (await fetch(getApiUrl(`/notifications/${id}`), { method: "DELETE" })).ok;
	} catch (e) {
		return false;
	}
}
async function clearAllNotificationsClient() {
	try {
		return (await fetch(getApiUrl(`/notifications`), { method: "DELETE" })).ok;
	} catch (e) {
		return false;
	}
}
async function getUpdatesClient(serverIp) {
	try {
		const res = await fetch(getApiUrl(`/servers/${serverIp}/updates`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch updates", e);
	}
	return [];
}
async function checkUpdatesClient(serverIp) {
	try {
		const res = await fetch(getApiUrl(`/servers/${serverIp}/updates/check`), { method: "POST" });
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to check updates", e);
	}
	return [];
}
async function installUpdatesClient(serverIp, titles) {
	try {
		const res = await fetch(getApiUrl(`/servers/${serverIp}/updates/install`), {
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
async function getCertificatesClient(serverIp, store = "Personal") {
	try {
		const res = await fetch(getApiUrl(`/servers/${serverIp}/certificates?store=${encodeURIComponent(store)}`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch certificates", e);
	}
	return [];
}
async function getUsersClient(serverIp) {
	try {
		const res = await fetch(getApiUrl(`/servers/${serverIp}/users`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch users", e);
	}
	return [];
}
async function getGroupsClient(serverIp) {
	try {
		const res = await fetch(getApiUrl(`/servers/${serverIp}/users/groups`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch groups", e);
	}
	return [];
}
async function getNetworksClient(serverIp) {
	try {
		const res = await fetch(getApiUrl(`/servers/${serverIp}/networks`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch networks", e);
	}
	return [];
}
async function controlNetworkClient(serverIp, adapterName, action) {
	try {
		return (await fetch(getApiUrl(`/servers/${serverIp}/networks/${encodeURIComponent(adapterName)}/${action}`), { method: "POST" })).ok;
	} catch (e) {
		console.error("Failed to control network adapter", e);
		return false;
	}
}
async function getRegistryContentClient(serverIp, path) {
	try {
		const res = await fetch(getApiUrl(`/servers/${serverIp}/registry?path=${encodeURIComponent(path)}`));
		if (res.ok) return await res.json();
	} catch (e) {
		console.error("Failed to fetch registry", e);
	}
	return {
		subKeys: [],
		values: []
	};
}
//#endregion
export { uploadFileClient as $, getRolesClient as A, installUpdatesClient as B, getLiveProcessesClient as C, getProcessDetailsClient as D, getPerformanceHistoryClient as E, getUsersClient as F, restartServerClient as G, moveFileClient as H, getVolumesClient as I, shutdownServerClient as J, runTaskClient as K, getWsUrl as L, getServicesClient as M, getTasksClient as N, getProcessesClient as O, getUpdatesClient as P, uninstallRoleClient as Q, installAppClient as R, getGroupsClient as S, getNotificationsClient as T, readTextFileClient as U, killProcessClient as V, renameFileClient as W, testNotificationClient as X, testBackendConnection as Y, uninstallAppClient as Z, getDisksClient as _, clearNotificationClient as a, getFilesSourcesClient as b, copyFileClient as c, deleteServerClient as d, uploadInstallerClient as et, editServerClient as f, getCertificatesClient as g, getBackendUrl as h, clearBackendUrl as i, getServersClient as j, getRegistryContentClient as k, createFolderClient as l, getAppsClient as m, checkUpdatesClient as n, controlNetworkClient as o, getApiUrl as p, setBackendUrl as q, clearAllNotificationsClient as r, controlServiceClient as s, addServerClient as t, writeTextFileClient as tt, deleteFileClient as u, getDownloadUrl as v, getNetworksClient as w, getFullUrl as x, getFilesListClient as y, installRoleClient as z };
