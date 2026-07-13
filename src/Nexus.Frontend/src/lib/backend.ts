const STORAGE_KEY = "nexus_backend_url";

/**
 * Get the configured backend base URL.
 * Returns empty string if not configured (local dev mode uses Vite proxy).
 */
export function getBackendUrl(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) || "";
}

/**
 * Set the backend base URL (e.g. "https://abc123.ngrok-free.app").
 * Strips trailing slashes for consistency.
 */
export function setBackendUrl(url: string): void {
  const clean = url.replace(/\/+$/, "");
  localStorage.setItem(STORAGE_KEY, clean);
  window.dispatchEvent(new CustomEvent("nexus-backend-url-changed"));
}

/**
 * Clear backend URL — reverts to local dev proxy mode.
 */
export function clearBackendUrl(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("nexus-backend-url-changed"));
}

/**
 * Check if a backend URL has been explicitly configured.
 */
export function isBackendConfigured(): boolean {
  return !!getBackendUrl();
}

/**
 * Build full API URL from a path like "/servers/localhost/services".
 * - Configured: "https://tunnel.example.com/api/servers/localhost/services"
 * - Not configured: "/api/servers/localhost/services" (Vite proxy handles it)
 */
export function getApiUrl(path: string): string {
  const base = getBackendUrl();
  if (!base) return `/api${path}`;
  return `${base}/api${path}`;
}

/**
 * Build full URL for any /api or /hub path.
 * Use for SignalR hubs: getFullUrl("/hub/notifications")
 * Use for raw API: getFullUrl("/api/health")
 */
export function getFullUrl(path: string): string {
  const base = getBackendUrl();
  if (!base) return path; // relative — Vite proxy handles it
  return `${base}${path}`;
}

/**
 * Build WebSocket URL from an HTTP path.
 * Converts http(s) base to ws(s).
 */
export function getWsUrl(path: string): string {
  const base = getBackendUrl();
  if (!base) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${path}`;
  }
  const wsBase = base.replace(/^http/, "ws");
  return `${wsBase}${path}`;
}

/**
 * Test if a backend URL is reachable by hitting /api/health.
 * Returns true if healthy, false otherwise.
 */
export async function testBackendConnection(url?: string): Promise<boolean> {
  const target = url || getBackendUrl();
  if (!target) return false;
  try {
    const cleanUrl = target.replace(/\/+$/, "");
    const res = await fetch(`${cleanUrl}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
