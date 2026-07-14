import { useState, useEffect } from "react";
import { getBackendUrl, setBackendUrl, testBackendConnection } from "@/lib/backend";
import { Server, Activity, X, Globe, Save } from "lucide-react";
import { toast } from "sonner";

export function BackendStatusModal({
  isOpen,
  onClose,
  isOnline,
}: {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
}) {
  const [url, setUrl] = useState(getBackendUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [pingResult, setPingResult] = useState<{ status: 'success' | 'error' | null, ms?: number, message?: string }>({ status: null });

  // Update input if the underlying value changes (or component opens)
  useEffect(() => {
    if (isOpen) {
      setUrl(getBackendUrl());
      setPingResult({ status: null });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setBackendUrl(url);
    toast.success("Backend URL saved. Testing connection...");
    handleTest();
  };

  const handleTest = async () => {
    setIsTesting(true);
    setPingResult({ status: null });
    const start = performance.now();
    try {
      // testBackendConnection will use the input URL if we pass it, or default to configured
      const success = await testBackendConnection(url);
      const end = performance.now();
      const ms = Math.round(end - start);
      
      if (success) {
        setPingResult({ status: 'success', ms, message: `Reachable (${ms}ms)` });
        if (!isOnline) {
          (window as any).__nexus_set_backend_online?.();
        }
      } else {
        setPingResult({ status: 'error', message: "Unreachable / Timeout" });
      }
    } catch (e) {
      setPingResult({ status: 'error', message: "Connection failed" });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-[var(--border-c)] flex items-center justify-between">
          <div className="flex items-center gap-3 text-[var(--text)]">
            <Activity className={isOnline ? "text-[var(--ok)]" : "text-[var(--crit)]"} size={20} />
            <h2 className="font-semibold text-lg">Backend Connection</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-void)] p-1.5 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center justify-center text-center p-6 bg-[var(--bg-void)] rounded-xl border border-[var(--border-c)]">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 border-4 ${
              isOnline ? 'border-[var(--ok)]/20 bg-[var(--ok)]/10 text-[var(--ok)]' : 'border-[var(--crit)]/20 bg-[var(--crit)]/10 text-[var(--crit)]'
            }`}>
              <Server size={32} />
            </div>
            <h3 className="font-bold text-lg text-[var(--text)]">
              {isOnline ? "Backend is Online" : "Backend is Offline"}
            </h3>
            <p className="text-[var(--text-sub)] text-sm mt-1">
              {isOnline 
                ? "NEXUS frontend is successfully communicating with the backend API." 
                : "Unable to reach the backend API. Features will be disabled."}
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-widest text-[var(--text-sub)]">
              Backend API URL
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" size={16} />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g. http://192.168.1.100:5010"
                  className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-[var(--amber)] focus:outline-none transition-colors"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={url === getBackendUrl() && !url}
                className="flex items-center gap-2 bg-[var(--amber-low)] text-[var(--amber)] hover:bg-[var(--amber)] hover:text-white px-4 rounded-lg font-medium transition-all disabled:opacity-50"
              >
                <Save size={16} />
                Save
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-c)] flex items-center justify-between">
            <div className="flex-1">
              {pingResult.status === 'success' && (
                <div className="flex items-center gap-2 text-[var(--ok)] text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-[var(--ok)] animate-pulse" />
                  {pingResult.message}
                </div>
              )}
              {pingResult.status === 'error' && (
                <div className="flex items-center gap-2 text-[var(--crit)] text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-[var(--crit)]" />
                  {pingResult.message}
                </div>
              )}
              {!pingResult.status && !isTesting && (
                <div className="text-[var(--text-sub)] text-sm">
                  Run a diagnostic ping to check latency.
                </div>
              )}
              {isTesting && (
                <div className="text-[var(--amber)] text-sm animate-pulse">
                  Pinging backend...
                </div>
              )}
            </div>
            
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="flex items-center gap-2 bg-[var(--bg-void)] border border-[var(--border-c)] hover:border-[var(--amber)] hover:text-[var(--amber)] text-[var(--text)] px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
              <Activity size={16} />
              {isTesting ? "Testing..." : "Test Connection"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
