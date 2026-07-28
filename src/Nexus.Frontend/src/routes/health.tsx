import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
import { getHealthClient, type SystemHealthData, type SubsystemHealth, type ApiModuleHealth } from "@/api/client";

export const Route = createFileRoute("/health")({
  component: HealthDashboardPage,
  head: () => ({
    meta: [
      { title: "System Health & API Telemetry — NEXUS" },
      { name: "description", content: "Real-time backend API health dashboard, subsystem latency pings, and infrastructure telemetry." }
    ]
  })
});

function HealthDashboardPage() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(3000); // 3 seconds
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    const data = await getHealthClient(true);
    if (data) {
      setHealthData(data);
      setLastUpdated(new Date());
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
    if (!healthData?.apiModules) return ["All"];
    const cats = new Set(healthData.apiModules.map(m => m.Category));
    return ["All", ...Array.from(cats)];
  }, [healthData]);

  const filteredModules = useMemo(() => {
    if (!healthData?.apiModules) return [];
    return healthData.apiModules.filter(m => {
      const matchesSearch = m.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.Route.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.Description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || m.Category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [healthData, searchQuery, selectedCategory]);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
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
    a.download = `nexus_health_telemetry_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !healthData) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-10 h-10 text-sky-400 animate-spin" />
        <p className="text-slate-400 font-mono text-sm">Measuring Gateway Subsystem Latency & Health...</p>
      </div>
    );
  }

  const overallStatus = healthData?.status || "Healthy";
  const overallColor = overallStatus === "Healthy" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
                       overallStatus === "Degraded" ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
                       "text-rose-400 border-rose-500/30 bg-rose-500/10";

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 space-y-8 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                Backend API Health & Ping Telemetry
                <span className={`text-xs px-3 py-1 rounded-full border font-mono font-medium ${overallColor}`}>
                  ● System {overallStatus.toUpperCase()}
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Real-time latency diagnostic matrix for 28 gateway controller modules & subsystem execution engines
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Refreshed: {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}</span>
          </div>

          <select
            value={autoRefreshInterval}
            onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
            aria-label="Auto Refresh Interval"
            className="bg-slate-900/80 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 font-mono cursor-pointer"
          >
            <option value={1000}>Auto Refresh: 1s</option>
            <option value={3000}>Auto Refresh: 3s</option>
            <option value={5000}>Auto Refresh: 5s</option>
            <option value={10000}>Auto Refresh: 10s</option>
            <option value={0}>Pause Auto Refresh</option>
          </select>

          <button
            onClick={() => fetchHealth(true)}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Now</span>
          </button>

          <button
            onClick={exportTelemetry}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Gateway Ping Latency</span>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              {healthData?.totalPingMs ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-mono">ms</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Overall diagnostic round-trip latency</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Gateway Uptime</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold font-mono text-sky-400">
              {formatUptime(healthData?.uptimeSeconds ?? 0)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Started: {new Date(Date.now() - (healthData?.uptimeSeconds || 0)*1000).toLocaleDateString()}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Process Memory</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-purple-400">
              {healthData?.memory?.workingSetMB ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-mono">MB</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Allocated: {healthData?.memory?.allocatedMB} MB | GC: {healthData?.memory?.gcTotalMB} MB</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Host System</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-slate-200 font-mono block truncate">
              {healthData?.system?.machineName}
            </span>
            <span className="text-xs text-slate-400 font-mono block mt-1">
              {healthData?.system?.processorCount} Cores • {healthData?.system?.is64BitOS ? "64-bit OS" : "32-bit OS"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 truncate">{healthData?.system?.os}</p>
        </div>
      </div>

      {/* Subsystem Health Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <span>Infrastructure Execution Subsystems</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {healthData?.subsystems?.length || 0} Core Engines Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthData?.subsystems?.map((sub, idx) => {
            const isHealthy = sub.status === "Healthy";
            const isDegraded = sub.status === "Degraded";
            const Icon = sub.name.includes("Database") ? Database :
                         sub.name.includes("PowerShell") ? Terminal :
                         sub.name.includes("Active Directory") ? ShieldCheck :
                         sub.name.includes("CIM") ? HardDrive :
                         sub.name.includes("SignalR") ? Radio : Zap;

            return (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-slate-800 text-sky-400 border border-slate-700">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-200">{sub.name}</h3>
                        <span className="text-[11px] font-mono text-slate-400">{sub.type}</span>
                      </div>
                    </div>

                    <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium flex items-center space-x-1 border ${
                      isHealthy ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      isDegraded ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}>
                      {isHealthy ? <CheckCircle2 className="w-3 h-3" /> :
                       isDegraded ? <AlertTriangle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{sub.status}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 font-mono leading-relaxed bg-slate-950/50 p-2 rounded border border-slate-900">
                    {sub.details}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Ping Latency:</span>
                  <span className={`font-bold ${sub.pingMs < 5 ? "text-emerald-400" : sub.pingMs < 20 ? "text-amber-400" : "text-rose-400"}`}>
                    {sub.pingMs} ms
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* API Controller Modules Health Matrix */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Server className="w-5 h-5 text-sky-400" />
              <span>Gateway API Controller Modules (28 Endpoints)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status and measured endpoint response latency for each REST controller module
            </p>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search modules or routes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 w-48 sm:w-64 font-mono placeholder:text-slate-500"
              />
            </div>

            <div className="flex space-x-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-md font-mono transition cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-sky-600 text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modules Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Module Name</th>
                  <th className="px-4 py-3">Base Route Signature</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Operational Status</th>
                  <th className="px-4 py-3 text-right">Endpoint Latency</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredModules.map((mod, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{mod.Name}</span>
                    </td>
                    <td className="px-4 py-3 text-sky-400 font-mono text-[11px] whitespace-nowrap">
                      {mod.Route}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {mod.Category}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium flex items-center space-x-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{mod.Status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400 whitespace-nowrap">
                      {mod.LatencyMs} ms
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-md truncate">
                      {mod.Description}
                    </td>
                  </tr>
                ))}
                {filteredModules.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500 font-mono">
                      No API controller modules match search criteria "{searchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
