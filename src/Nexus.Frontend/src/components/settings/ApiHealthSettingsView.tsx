import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Cpu, 
  HardDrive, 
  Database, 
  Terminal, 
  Server, 
  ShieldCheck, 
  Zap, 
  Search, 
  Clock, 
  Layers, 
  Download,
  Wifi,
  Radio
} from "lucide-react";
import { getHealthClient, type SystemHealthData } from "@/api/client";
import { toast } from "sonner";

export function ApiHealthSettingsView() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(3000);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await getHealthClient(true);
      if (data) {
        setHealthData(data);
        setLastUpdated(new Date());
      } else {
        toast.error("Failed to connect to Gateway health endpoint");
      }
    } catch (e) {
      console.error("Health fetch error:", e);
    }
    setLoading(false);
    if (isManualRefresh) setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchHealth();
    if (autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchHealth();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [fetchHealth, autoRefreshInterval]);

  const categories = useMemo(() => {
    if (!healthData?.apiModules || !Array.isArray(healthData.apiModules)) return ["All"];
    const cats = new Set(healthData.apiModules.map(m => ((m as any).category || (m as any).Category || "Core")));
    return ["All", ...Array.from(cats)];
  }, [healthData]);

  const filteredModules = useMemo(() => {
    if (!healthData?.apiModules || !Array.isArray(healthData.apiModules)) return [];
    const q = (searchQuery || "").toLowerCase();
    return healthData.apiModules.filter(m => {
      const name = String((m as any).name || (m as any).Name || "").toLowerCase();
      const route = String((m as any).route || (m as any).Route || "").toLowerCase();
      const desc = String((m as any).description || (m as any).Description || "").toLowerCase();
      const cat = String((m as any).category || (m as any).Category || "Core");

      const matchesSearch = name.includes(q) || route.includes(q) || desc.includes(q);
      const matchesCategory = selectedCategory === "All" || cat === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [healthData, searchQuery, selectedCategory]);

  const formatUptime = (seconds: number) => {
    const sSec = seconds || 0;
    const d = Math.floor(sSec / (3600 * 24));
    const h = Math.floor((sSec % (3600 * 24)) / 3600);
    const m = Math.floor((sSec % 3600) / 60);
    const s = Math.floor(sSec % 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const exportTelemetry = () => {
    if (!healthData) return;
    const blob = new Blob([JSON.stringify(healthData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus_api_health_telemetry_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Health telemetry report exported");
  };

  if (loading && !healthData) {
    return (
      <div className="p-12 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[var(--amber)] animate-spin mx-auto" />
        <p className="text-xs font-mono text-[var(--text-sub)]">Measuring Gateway API ping latency & subsystem health...</p>
      </div>
    );
  }

  const overallStatus = healthData?.status || "Healthy";
  const overallBadgeClass = overallStatus === "Healthy" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                            overallStatus === "Degraded" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                            "bg-rose-500/10 text-rose-400 border-rose-500/30";

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-c)] pb-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[var(--amber-low)] border border-[var(--amber)]/30 text-[var(--amber)]">
                <Activity size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  API & Gateway Health Dashboard
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono font-bold ${overallBadgeClass}`}>
                    ● {overallStatus.toUpperCase()}
                  </span>
                </h3>
                <p className="text-xs text-[var(--text-sub)] mt-0.5">
                  Real-time latency metrics, ping times, and execution engine diagnostics for all 28 API modules
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[var(--bg-void)] border border-[var(--border-c)] px-3 py-1.5 rounded-xl text-xs font-mono text-[var(--text-sub)]">
              <Clock size={12} className="text-[var(--amber)]" />
              <span>{lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}</span>
            </div>

            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              aria-label="Auto Refresh Rate"
              className="bg-[var(--bg-void)] border border-[var(--border-c)] text-[var(--text)] text-xs rounded-xl px-3 py-1.5 focus:outline-none font-mono cursor-pointer"
            >
              <option value={1000}>1s Interval</option>
              <option value={3000}>3s Interval</option>
              <option value={5000}>5s Interval</option>
              <option value={10000}>10s Interval</option>
              <option value={0}>Paused</option>
            </select>

            <button
              onClick={() => fetchHealth(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 bg-[var(--amber)] text-black px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-[var(--amber-hover)] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              <span>Ping Now</span>
            </button>

            <button
              onClick={exportTelemetry}
              className="flex items-center gap-1.5 bg-[var(--bg-void)] border border-[var(--border-c)] text-[var(--text)] px-3 py-1.5 rounded-xl text-xs font-semibold hover:border-[var(--amber)] transition-all cursor-pointer"
            >
              <Download size={13} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Core Latency & Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="bg-[var(--bg-void)] p-4 rounded-xl border border-[var(--border-c)]">
            <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Gateway Latency</span>
              <Wifi size={14} className="text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-emerald-400">
                {healthData?.totalPingMs ?? 0}
              </span>
              <span className="text-xs text-[var(--text-sub)] font-mono">ms</span>
            </div>
            <p className="text-[10px] text-[var(--text-sub)] mt-1">Round-trip diagnostic ping</p>
          </div>

          <div className="bg-[var(--bg-void)] p-4 rounded-xl border border-[var(--border-c)]">
            <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Gateway Uptime</span>
              <Clock size={14} className="text-sky-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-extrabold font-mono text-sky-400">
                {formatUptime(healthData?.uptimeSeconds ?? 0)}
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-sub)] mt-1">Continuous uptime</p>
          </div>

          <div className="bg-[var(--bg-void)] p-4 rounded-xl border border-[var(--border-c)]">
            <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Process Memory</span>
              <Cpu size={14} className="text-purple-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-purple-400">
                {healthData?.memory?.workingSetMB ?? 0}
              </span>
              <span className="text-xs text-[var(--text-sub)] font-mono">MB</span>
            </div>
            <p className="text-[10px] text-[var(--text-sub)] mt-1">Allocated: {healthData?.memory?.allocatedMB ?? 0} MB</p>
          </div>

          <div className="bg-[var(--bg-void)] p-4 rounded-xl border border-[var(--border-c)]">
            <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Host System</span>
              <Server size={14} className="text-[var(--amber)]" />
            </div>
            <div className="mt-2">
              <span className="text-xs font-bold text-[var(--text)] font-mono block truncate">
                {healthData?.system?.machineName || "Local Host"}
              </span>
              <span className="text-[10px] text-[var(--text-sub)] font-mono block">
                {healthData?.system?.processorCount ?? 4} CPU Cores • {healthData?.system?.is64BitOS ? "64-bit" : "32-bit"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Subsystem Health Cards Grid */}
      <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-3">
          <h4 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
            <Layers size={16} className="text-[var(--amber)]" /> Subsystem Execution Engines ({healthData?.subsystems?.length || 0})
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {healthData?.subsystems?.map((sub: any, idx: number) => {
            const subName = String(sub.name || sub.Name || "Subsystem");
            const subType = String(sub.type || sub.Type || "Service");
            const subStatus = String(sub.status || sub.Status || "Healthy");
            const subPing = Number(sub.pingMs ?? sub.PingMs ?? 0);
            const subDetails = String(sub.details || sub.Details || "");

            const isHealthy = subStatus === "Healthy";
            const isDegraded = subStatus === "Degraded";
            const Icon = subName.includes("Database") ? Database :
                         subName.includes("PowerShell") ? Terminal :
                         subName.includes("Active Directory") ? ShieldCheck :
                         subName.includes("CIM") ? HardDrive :
                         subName.includes("SignalR") ? Radio : Zap;

            return (
              <div
                key={idx}
                className="bg-[var(--bg-void)] p-3.5 rounded-xl border border-[var(--border-c)] flex flex-col justify-between space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--amber)] border border-[var(--border-c)]">
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text)]">{subName}</div>
                      <div className="text-[10px] font-mono text-[var(--text-sub)]">{subType}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 border ${
                    isHealthy ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                    isDegraded ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                    "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  }`}>
                    {isHealthy ? <CheckCircle2 size={11} /> :
                     isDegraded ? <AlertTriangle size={11} /> : <XCircle size={11} />}
                    <span>{subStatus}</span>
                  </span>
                </div>

                <div className="text-[11px] text-[var(--text-sub)] font-mono bg-[var(--bg-surface)] p-2 rounded-lg border border-[var(--border-c)]/50 leading-tight">
                  {subDetails}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-sub)] pt-1 border-t border-[var(--border-c)]/40">
                  <span>Latency Ping:</span>
                  <span className={`font-bold ${subPing < 5 ? "text-emerald-400" : subPing < 20 ? "text-amber-400" : "text-rose-400"}`}>
                    {subPing} ms
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* API Controller Modules Matrix Table */}
      <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-c)] pb-4">
          <div>
            <h4 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Server size={16} className="text-[var(--teal)]" /> API Controller Modules Health Matrix ({filteredModules.length})
            </h4>
            <p className="text-xs text-[var(--text-sub)] mt-0.5">Response latency and status for all 27 ASP.NET Core Gateway controllers</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2 text-[var(--text-sub)]" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-xl bg-[var(--bg-void)] border border-[var(--border-c)] text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none w-44 font-mono"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter Category"
              className="bg-[var(--bg-void)] border border-[var(--border-c)] text-xs text-[var(--text)] rounded-xl px-2.5 py-1 focus:outline-none font-mono cursor-pointer"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-surface)] text-[var(--text-sub)] font-mono text-[10px] uppercase tracking-wider border-b border-[var(--border-c)]">
              <tr>
                <th className="px-3.5 py-2.5">Module Name</th>
                <th className="px-3.5 py-2.5">Base Route</th>
                <th className="px-3.5 py-2.5">Category</th>
                <th className="px-3.5 py-2.5">Status</th>
                <th className="px-3.5 py-2.5 text-right">Latency</th>
                <th className="px-3.5 py-2.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-c)]/40 font-mono text-[11px]">
              {filteredModules.map((mod: any, idx: number) => {
                const name = String(mod.name || mod.Name || "Module");
                const route = String(mod.route || mod.Route || "");
                const cat = String(mod.category || mod.Category || "Core");
                const status = String(mod.status || mod.Status || "Operational");
                const latency = Number(mod.latencyMs ?? mod.LatencyMs ?? 0);
                const desc = String(mod.description || mod.Description || "");

                return (
                  <tr key={idx} className="hover:bg-[var(--bg-surface)] transition-colors">
                    <td className="px-3.5 py-2 font-bold text-[var(--text)] whitespace-nowrap flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{name}</span>
                    </td>
                    <td className="px-3.5 py-2 text-[var(--amber)] whitespace-nowrap">{route}</td>
                    <td className="px-3.5 py-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-c)] text-[10px] text-[var(--text-sub)]">
                        {cat}
                      </span>
                    </td>
                    <td className="px-3.5 py-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        {status}
                      </span>
                    </td>
                    <td className="px-3.5 py-2 text-right font-bold text-emerald-400 whitespace-nowrap">
                      {latency} ms
                    </td>
                    <td className="px-3.5 py-2 text-[var(--text-sub)] max-w-xs truncate">
                      {desc}
                    </td>
                  </tr>
                );
              })}
              {filteredModules.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-[var(--text-sub)]">No API modules match "{searchQuery}"</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
