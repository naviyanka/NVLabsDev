import React, { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getServersClient, getNotificationsClient, type Server, type Notification } from "@/api/client";
import { Server as ServerIcon, CheckCircle, XCircle, AlertTriangle, ChevronRight, Zap, RefreshCw, Activity, Terminal, Sparkles, Layers, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/backend";
import { getFrontendSettings } from "@/lib/frontendSettings";
import { AiIntelligenceCard } from "@/components/ai/AiIntelligenceCard";

export function HorizonDashboard() {
  const [servers, setServers] = useState<Server[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [greeting, setGreeting] = useState("Good day");
  const [userName, setUserName] = useState("Admin");
  const [loading, setLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadData = async (isManual: boolean = false) => {
    if (isManual) setIsRefreshing(true);

    try {
      const [srvsRes, notifsRes] = await Promise.allSettled([
        getServersClient(),
        getNotificationsClient()
      ]);

      if (srvsRes.status === "fulfilled" && Array.isArray(srvsRes.value)) {
        setServers(srvsRes.value);
        try { localStorage.setItem("nexus_cached_servers", JSON.stringify(srvsRes.value)); } catch(e) {}
      }

      if (notifsRes.status === "fulfilled" && Array.isArray(notifsRes.value)) {
        setNotifications(notifsRes.value);
        try { localStorage.setItem("nexus_cached_notifs", JSON.stringify(notifsRes.value)); } catch(e) {}
      }

      if (isManual) toast.success("Fleet topology refreshed");
    } catch (e) {
      console.warn("Error refreshing dashboard data", e);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Determine greeting on client
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Read cached values and user on client
    try {
      const cachedSrvs = localStorage.getItem("nexus_cached_servers");
      if (cachedSrvs) setServers(JSON.parse(cachedSrvs));

      const cachedNotifs = localStorage.getItem("nexus_cached_notifs");
      if (cachedNotifs) setNotifications(JSON.parse(cachedNotifs));

      const userStr = localStorage.getItem("nexus-user");
      if (userStr) setUserName(JSON.parse(userStr).username || "Admin");
    } catch (e) {}

    loadData();
    
    // Read user-configured refresh interval from settings (default 30s)
    const fs = getFrontendSettings();
    const intervalSec = fs.autoRefreshInterval || 30;
    const id = setInterval(() => loadData(false), intervalSec * 1000);

    return () => clearInterval(id);
  }, []);

  const online = servers.filter((s) => s.status === "online").length;
  const offline = servers.filter((s) => s.status === "critical").length;
  const warning = servers.filter((s) => s.status === "warning").length;

  const avgCpu = servers.length ? Math.round(servers.reduce((acc, s) => acc + (srvCpu(s) || 0), 0) / servers.length) : 0;
  const avgRam = servers.length ? Math.round(servers.reduce((acc, s) => acc + (s.mem || 0), 0) / servers.length) : 0;

  function srvCpu(s: Server): number {
    return s.cpu || 0;
  }

  const alerts = notifications
    .filter((n) => n.type === "Critical" || n.type === "Warning" || n.type === "Error")
    .slice(0, 5);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 font-sans pb-12">
      {/* Hero Section */}
      <section className="relative w-full rounded-[1.5rem] overflow-hidden shadow-sm bg-[var(--bg-surface)] border border-[var(--border-c)] min-h-[220px] flex items-center p-6 md:p-10 justify-between">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--amber-low)] via-transparent to-[var(--teal-low)] pointer-events-none opacity-40"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--amber-low)] border border-[var(--amber)]/30 text-[var(--amber)] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={13} /> NEXUS Command Center
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[var(--text)] leading-tight">
            {greeting}, {userName}.<br />
            <span className="text-[var(--amber)]">{online} of {servers.length} servers active</span>
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button 
              onClick={() => navigate({ to: "/servers" })}
              className="bg-[var(--amber)] hover:opacity-90 text-black font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all active:scale-95 text-xs flex items-center gap-2 cursor-pointer"
            >
              <ServerIcon size={14} /> View Fleet Management
            </button>
            <button 
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="border border-[var(--border-c)] bg-[var(--bg-void)] hover:border-[var(--amber)] text-[var(--text)] font-semibold py-2.5 px-5 rounded-xl transition-all text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[var(--amber)]" : "text-[var(--amber)]"} />
              {isRefreshing ? "Refreshing..." : "Refresh Fleet"}
            </button>
            <button 
              onClick={() => navigate({ to: "/powershell" })}
              className="border border-[var(--border-c)] bg-[var(--bg-void)] hover:border-[var(--amber)] text-[var(--text)] font-semibold py-2.5 px-5 rounded-xl transition-all text-xs flex items-center gap-2 cursor-pointer"
            >
              <Terminal size={14} className="text-[var(--amber)]" /> PowerShell Terminal
            </button>
          </div>
        </div>

        {/* Real-time Fleet Telemetry Card */}
        <div className="hidden lg:flex flex-col gap-3 relative z-10 bg-[var(--bg-void)] border border-[var(--border-c)] p-5 rounded-2xl w-72 shadow-lg font-mono text-xs">
          <div className="flex items-center justify-between text-[var(--text-sub)] text-[10px] uppercase font-bold tracking-wider">
            <span>Fleet Resource Load</span>
            <Activity size={12} className="text-[var(--teal)] animate-pulse" />
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[var(--text-sub)]">Avg CPU:</span>
                <span className="font-bold text-[var(--text)]">{avgCpu}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--border-c)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--amber)] transition-all duration-500" style={{ width: `${avgCpu}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[var(--text-sub)]">Avg RAM:</span>
                <span className="font-bold text-[var(--text)]">{avgRam}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--border-c)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--teal)] transition-all duration-500" style={{ width: `${avgRam}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Total Servers */}
        <div className="bg-[var(--bg-surface)] rounded-[1.2rem] p-6 shadow-sm border border-[var(--border-c)] relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--teal)]"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-[var(--text-sub)] text-xs font-semibold uppercase tracking-widest">Total Managed Nodes</p>
            <ServerIcon size={20} className="text-[var(--teal)]" />
          </div>
          <h3 className="text-4xl font-extrabold text-[var(--text)]">{servers.length}</h3>
        </div>

        {/* Online */}
        <div className="bg-[var(--bg-surface)] rounded-[1.2rem] p-6 shadow-sm border border-[var(--border-c)] relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--ok)]"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-[var(--text-sub)] text-xs font-semibold uppercase tracking-widest">Online & Healthy</p>
            <CheckCircle size={20} className="text-[var(--ok)]" />
          </div>
          <h3 className="text-4xl font-extrabold text-[var(--text)]">{online}</h3>
        </div>

        {/* Warning */}
        <div className="bg-[var(--bg-surface)] rounded-[1.2rem] p-6 shadow-sm border border-[var(--border-c)] relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--warn)]"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-[var(--text-sub)] text-xs font-semibold uppercase tracking-widest">Warning Load</p>
            <AlertTriangle size={20} className="text-[var(--warn)]" />
          </div>
          <h3 className="text-4xl font-extrabold text-[var(--text)]">{warning}</h3>
        </div>

        {/* Critical Alerts */}
        <div className="bg-[var(--bg-surface)] rounded-[1.2rem] p-6 shadow-sm border border-[var(--border-c)] relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--crit)]"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-[var(--text-sub)] text-xs font-semibold uppercase tracking-widest flex items-center gap-2">
              Critical Faults
              <span className="w-2 h-2 bg-[var(--crit)] rounded-full animate-pulse"></span>
            </p>
            <XCircle size={20} className="text-[var(--crit)]" />
          </div>
          <h3 className="text-4xl font-extrabold text-[var(--crit)]">{offline}</h3>
        </div>
      </section>

      {/* Gemini AI Fleet Diagnostic Intelligence */}
      <AiIntelligenceCard
        title="Fleet Diagnostic Intelligence"
        type="metrics"
        dataToAnalyze={{
          totalManagedNodes: servers.length,
          onlineCount: online,
          offlineCount: offline,
          warningCount: warning,
          averageCpuUtilizationPercent: avgCpu,
          averageRamUtilizationPercent: avgRam,
          activeAlerts: alerts,
          serversSummary: servers.map((s) => ({
            id: s.id,
            name: s.name,
            ip: s.ip,
            status: s.status,
            os: s.os,
            cpu: s.cpu,
            mem: s.mem,
            roles: s.roles,
          })),
        }}
        contextMessage="Run full topology check and provide actionable performance optimizations and security precautions."
        defaultPromptLabel="Generate AI Infrastructure Assessment"
      />

      {/* Quick Launch Operations Action Bar */}
      <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-4 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
            <Zap size={16} className="text-[var(--amber)]" /> Rapid Operations Command Bar
          </h3>
          <p className="text-xs text-[var(--text-sub)] mt-0.5">Execute quick administrative actions across the server topology.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate({ to: "/vms" })}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] text-[var(--text)] px-3.5 py-2 text-xs font-semibold hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors cursor-pointer"
          >
            <Layers size={14} /> Hyper-V Manager
          </button>
          <button
            onClick={() => navigate({ to: "/updates" })}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] text-[var(--text)] px-3.5 py-2 text-xs font-semibold hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors cursor-pointer"
          >
            <RefreshCw size={14} /> Patch Status
          </button>
          <button
            onClick={() => navigate({ to: "/security" })}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] text-[var(--text)] px-3.5 py-2 text-xs font-semibold hover:border-emerald-400 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <ShieldCheck size={14} /> Security Logs
          </button>
        </div>
      </section>

      {/* 2-Column Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Server Fleet Table (Left 2/3) */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] rounded-[1.5rem] shadow-sm border border-[var(--border-c)] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[var(--border-c)] flex justify-between items-center bg-[var(--amber-low)]/20">
            <h3 className="text-lg font-bold text-[var(--text)]">Server Fleet Status</h3>
            <button onClick={() => navigate({ to: "/servers" })} className="text-[var(--amber)] text-sm font-semibold hover:underline flex items-center gap-1 cursor-pointer">
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            {loading && servers.length === 0 ? (
              <div className="p-6 space-y-4">
                <div className="nx-skeleton h-10 w-full rounded-lg"></div>
                <div className="nx-skeleton h-10 w-full rounded-lg"></div>
                <div className="nx-skeleton h-10 w-full rounded-lg"></div>
                <div className="nx-skeleton h-10 w-full rounded-lg"></div>
              </div>
            ) : servers.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-sub)] space-y-2">
                <ServerIcon size={24} className="mx-auto text-[var(--text-sub)] opacity-50" />
                <p>No servers discovered in database.</p>
                <button
                  onClick={() => loadData(true)}
                  className="text-[var(--amber)] hover:underline font-bold text-xs"
                >
                  Click to scan local node / AD domain
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-void)] text-[var(--text-sub)] text-[11px] uppercase tracking-widest font-bold border-b border-[var(--border-c)]">
                    <th className="p-2 md:p-4 md:pl-6 w-12 md:w-16"></th>
                    <th className="p-2 md:p-4">Name</th>
                    <th className="p-2 md:p-4">IP Address</th>
                    <th className="p-2 md:p-4 w-32 md:w-48">CPU Usage</th>
                    <th className="p-2 md:p-4 hidden sm:table-cell">RAM</th>
                    <th className="p-2 md:p-4 md:pr-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-c)]">
                  {servers.slice(0, 5).map((srv) => {
                    const init = srv.name.slice(0, 2).toUpperCase();
                    const isOnline = srv.status === "online";
                    const isWarn = srv.status === "warning";
                    return (
                      <tr key={srv.ip || srv.id} className="hover:bg-[var(--amber-low)]/30 transition-colors">
                        <td className="p-2 md:p-4 md:pl-6 text-center">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[var(--amber-low)] text-[var(--amber)] flex items-center justify-center font-bold text-[10px] md:text-xs mx-auto border border-[var(--amber)]/20">
                            {init}
                          </div>
                        </td>
                        <td className="p-2 md:p-4 font-bold text-[var(--text)] whitespace-nowrap">{srv.name}</td>
                        <td className="p-2 md:p-4 font-mono text-[10px] md:text-xs text-[var(--text-sub)]">{srv.ip}</td>
                        <td className="p-2 md:p-4">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-full h-1.5 bg-[var(--border-dim)] rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full" 
                                style={{ 
                                  width: `${srv.cpu}%`, 
                                  backgroundColor: srv.cpu > 80 ? "var(--crit)" : srv.cpu > 50 ? "var(--warn)" : "var(--amber)" 
                                }}
                              ></div>
                            </div>
                            <span className="text-[10px] md:text-xs font-semibold text-[var(--text-sub)] w-6 md:w-8">{srv.cpu}%</span>
                          </div>
                        </td>
                        <td className="p-2 md:p-4 text-[10px] md:text-xs text-[var(--text-sub)] hidden sm:table-cell">{srv.mem}% <span className="hidden md:inline">(Used)</span></td>
                        <td className="p-2 md:p-4 md:pr-6 text-right">
                          <span className={`inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold ${
                            isOnline ? "bg-[var(--ok)]/10 text-[var(--ok)] border border-[var(--ok)]/20" :
                            isWarn ? "bg-[var(--warn)]/10 text-[var(--warn)] border border-[var(--warn)]/20" :
                            "bg-[var(--crit)]/10 text-[var(--crit)] border border-[var(--crit)]/20"
                          }`}>
                            {srv.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Alerts & Active Jobs (Right 1/3) */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface)] rounded-[1.5rem] shadow-sm border border-[var(--border-c)] p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-[var(--text)] mb-6">Recent Alerts</h3>
              <div className="relative border-l-2 border-[var(--border-c)] ml-3 space-y-6 pb-2">
                {alerts.map((n) => (
                  <div key={n.id} className="relative pl-6">
                    <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-[var(--bg-surface)] shadow-sm ${
                      n.type === "Critical" || n.type === "Error" ? "bg-[var(--crit)]" : "bg-[var(--warn)]"
                    }`}></span>
                    <p className="text-xs font-mono text-[var(--text-sub)] mb-0.5">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <h4 className="font-semibold text-[var(--text)] text-xs">{n.type} Alert: {n.serverIp ?? "System"}</h4>
                    <p className="text-[11px] text-[var(--text-sub)] mt-0.5 leading-snug">{n.message}</p>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div className="py-8 text-center text-xs text-[var(--text-sub)]">No critical alerts detected ✓</div>
                )}
              </div>
            </div>
            <button 
              onClick={() => navigate({ to: "/security" })}
              className="w-full mt-6 py-2 border border-[var(--border-c)] rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] transition-colors cursor-pointer"
            >
              View Alert History
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
