import React, { useState, useEffect } from "react";
import { getBackendUrl, isBackendEnabledGlobally, testBackendConnection } from "@/lib/backend";
import { Activity, Server, RefreshCw } from "lucide-react";

export type ApiStatus = "online" | "offline" | "idle";

interface BackendStatusMonitorProps {
  onClick?: () => void;
  showText?: boolean;
  showLatency?: boolean;
  className?: string;
}

export function BackendStatusMonitor({
  onClick,
  showText = true,
  showLatency = true,
  className = "",
}: BackendStatusMonitorProps) {
  const [status, setStatus] = useState<ApiStatus>("idle");
  const [latency, setLatency] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    if (isChecking) return;
    setIsChecking(true);
    
    if (!isBackendEnabledGlobally()) {
      setStatus("idle");
      setLatency(null);
      setIsChecking(false);
      return;
    }

    const start = performance.now();
    try {
      const url = getBackendUrl();
      const res = await testBackendConnection(url);
      
      if (res.reachable) {
        setStatus("online");
        setLatency(res.pingMs ?? 0);
      } else {
        setStatus("offline");
        setLatency(null);
      }
    } catch {
      setStatus("offline");
      setLatency(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    const handleStatusEvent = (e: any) => {
      if (e.detail?.online !== undefined) {
        setStatus(e.detail.online ? "online" : "offline");
      }
    };

    window.addEventListener("nexus-backend-status", handleStatusEvent);
    window.addEventListener("nexus-backend-url-changed", checkStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("nexus-backend-status", handleStatusEvent);
      window.removeEventListener("nexus-backend-url-changed", checkStatus);
    };
  }, []);

  const getStatusLabel = () => {
    if (isChecking && status === "idle") return "Checking API...";
    switch (status) {
      case "online":
        return "API Connected";
      case "offline":
        return "API Disconnected";
      case "idle":
        return "API Idle / Standby";
    }
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={`Backend API Status: ${status.toUpperCase()}${latency !== null ? ` (${latency}ms)` : ""}`}
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[var(--border-c)] bg-[var(--bg-surface)] hover:bg-[var(--bg-card)] transition-all ${
        onClick ? "cursor-pointer hover:border-[var(--border-dim)]" : ""
      } ${className}`}
    >
      <span className={`nx-status-dot ${status}`} data-status={status} />

      {showText && (
        <span className="text-xs font-medium font-mono text-[var(--text)] flex items-center gap-1.5">
          {getStatusLabel()}
        </span>
      )}

      {showLatency && status === "online" && latency !== null && (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-void)] text-[var(--text-sub)] border border-[var(--border-c)]">
          {latency}ms
        </span>
      )}

      {isChecking && (
        <RefreshCw size={11} className="animate-spin text-[var(--text-sub)] ml-0.5" />
      )}
    </div>
  );
}
