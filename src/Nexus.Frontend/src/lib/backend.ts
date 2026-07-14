export interface BackendHost {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
}

export interface BackendPingResult {
  reachable: boolean;
  pingMs: number | null;
  statusCode: number | null;
  error?: string;
}

const STORAGE_KEY = "nexus_backend_hosts";
const GLOBAL_TOGGLE_KEY = "nexus_backend_enabled";

/**
 * Get all configured backend hosts.
 */
export function getBackendHosts(): BackendHost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  
  // Legacy migration
  if (typeof window !== "undefined") {
    const legacyUrl = localStorage.getItem("nexus_backend_url");
    if (legacyUrl) {
      const legacyHost: BackendHost = {
        id: "legacy",
        name: "Legacy Backend",
        url: legacyUrl,
        isActive: true
      };
      localStorage.removeItem("nexus_backend_url");
      setBackendHosts([legacyHost]);
      return [legacyHost];
    }
  }
  
  return [];
}

/**
 * Save the entire list of backend hosts.
 */
export function setBackendHosts(hosts: BackendHost[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hosts));
  window.dispatchEvent(new CustomEvent("nexus-backend-url-changed"));
}

/**
 * Check if the global "Use Remote Backend" toggle is enabled.
 */
export function isBackendEnabledGlobally(): boolean {
  if (typeof window === "undefined") return false;
  const val = localStorage.getItem(GLOBAL_TOGGLE_KEY);
  return val === null ? true : val === "true"; // Default to true if not set
}

/**
 * Set the global "Use Remote Backend" toggle.
 */
export function setBackendEnabledGlobally(enabled: boolean): void {
  localStorage.setItem(GLOBAL_TOGGLE_KEY, enabled.toString());
  window.dispatchEvent(new CustomEvent("nexus-backend-url-changed"));
}

/**
 * Set the backend base URL (e.g. "https://abc123.ngrok-free.app").
 * Legacy wrapper: adds it as the active host.
 */
export function setBackendUrl(url: string): void {
  const clean = url.replace(/\/+$/, "");
  setBackendEnabledGlobally(true);
  const current = getBackendHosts().map(h => ({ ...h, isActive: false }));
  current.push({
    id: Date.now().toString(),
    name: "Custom URL",
    url: clean,
    isActive: true
  });
  setBackendHosts(current);
}

/**
 * Clear backend URL — reverts to local dev proxy mode.
 * Legacy wrapper: disables remote backends.
 */
export function clearBackendUrl(): void {
  setBackendEnabledGlobally(false);
}

/**
 * Get the currently active backend URL.
 * Returns empty string if globally disabled or no active host.
 */
export function getBackendUrl(): string {
  if (!isBackendEnabledGlobally()) return "";
  const active = getBackendHosts().find(h => h.isActive);
  return active ? active.url.replace(/\/+$/, "") : "";
}

/**
 * Check if a backend URL has been explicitly configured AND is active.
 */
export function isBackendConfigured(): boolean {
  return !!getBackendUrl();
}

/**
 * Build full API URL from a path like "/servers/localhost/services".
 * If not configured, returns a dummy offline URL that fetch interceptor will block.
 */
export function getApiUrl(path: string): string {
  if (!isBackendEnabledGlobally()) return `http://offline.local/api${path}`;
  const active = getBackendHosts().find(h => h.isActive);
  const base = active ? active.url.replace(/\/+$/, "") : "";
  return base ? `${base}/api${path}` : `/api${path}`;
}

/**
 * Build full URL for any /api or /hub path.
 * Use for SignalR hubs: getFullUrl("/hub/notifications")
 */
export function getFullUrl(path: string): string {
  if (!isBackendEnabledGlobally()) return `http://offline.local${path}`;
  const active = getBackendHosts().find(h => h.isActive);
  const base = active ? active.url.replace(/\/+$/, "") : "";
  return base ? `${base}${path}` : path;
}

/**
 * Build WebSocket URL from an HTTP path.
 * Converts http(s) base to ws(s).
 */
export function getWsUrl(path: string): string {
  if (!isBackendEnabledGlobally()) return `ws://offline.local${path}`;
  const active = getBackendHosts().find(h => h.isActive);
  const base = active ? active.url.replace(/\/+$/, "") : "";
  const target = base || window.location.origin;
  const wsBase = target.replace(/^http/, "ws");
  return `${wsBase}${path}`;
}

/**
 * Test if a backend URL is reachable by hitting /api/health and measure ping.
 */
export async function testBackendConnection(url?: string): Promise<BackendPingResult> {
  const target = url || getBackendUrl();
  if (!target) return { reachable: false, pingMs: null, statusCode: null, error: "No URL provided" };
  
  const cleanUrl = target.replace(/\/+$/, "");
  const startTime = performance.now();
  
  try {
    const res = await fetch(`${cleanUrl}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    
    const endTime = performance.now();
    
    return {
      reachable: res.ok,
      pingMs: Math.round(endTime - startTime),
      statusCode: res.status,
    };
  } catch (err: any) {
    return {
      reachable: false,
      pingMs: null,
      statusCode: null,
      error: err.message || "Connection failed"
    };
  }
}
