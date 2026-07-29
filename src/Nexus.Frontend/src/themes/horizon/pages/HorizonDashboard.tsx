import React, { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getServersClient, getNotificationsClient, type Server, type Notification } from "@/api/client";
import { Server as ServerIcon, CheckCircle, XCircle, AlertTriangle, ChevronRight, Zap, RefreshCw, Activity, Terminal, Sparkles, Layers, ShieldCheck, Cpu, HardDrive } from "lucide-react";
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
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    try {
      const cachedSrvs = localStorage.getItem("nexus_cached_servers");
      if (cachedSrvs) setServers(JSON.parse(cachedSrvs));

      const cachedNotifs = localStorage.getItem("nexus_cached_notifs");
      if (cachedNotifs) setNotifications(JSON.parse(cachedNotifs));

      const userStr = localStorage.getItem("nexus-user");
      if (userStr) setUserName(JSON.parse(userStr).username || "Admin");
    } catch (e) {}

    loadData();

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
      {/* ─── Hero Banner with Mesh Gradient ─── */}
      <section
        className="relative w-full rounded-[1.2rem] overflow-hidden min-h-[200px] flex items-center p-8 md:p-10 border border-white/5"
        style={{
          backgroundColor: "var(--bg-void)",
          backgroundImage:
            "radial-gradient(at 0% 0%, hsl(222 47% 11% / 1) 0, transparent 50%), radial-gradient(at 100% 0%, hsl(231 48% 48% / 0.3) 0, transparent 50%), radial-gradient(at 50% 100%, hsl(222 47% 11% / 1) 0, transparent 50%)",
        }}
      >
        <div className="relative z-10 flex-1">
          <p className="text-[var(--text-sub)] text-xs font-semibold uppercase tracking-[0.15em] mb-1">
            Systems Overview
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text)] leading-tight">
            {greeting}, {userName}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-[var(--amber)] font-semibold text-sm">
            <ServerIcon size={16} className="fill-[var(--amber)]/20" />
            <span>{online} of {servers.length} servers active</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => navigate({ to: "/servers" })}
              className="bg-[var(--amber)] hover:brightness-110 text-black font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-[var(--amber)]/20 transition-all active:scale-95 text-xs flex items-center gap-2 cursor-pointer"
            >
              <ServerIcon size={14} /> View Fleet Management
            </button>
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="border border-white/10 bg-white/5 backdrop-blur-sm hover:border-[var(--amber)]/50 text-[var(--text)] font-semibold py-2.5 px-5 rounded-xl transition-all text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[var(--amber)]" : "text-[var(--amber)]"} />
              {isRefreshing ? "Refreshing..." : "Refresh Fleet"}
            </button>
          </div>
        </div>

        {/* Abstract decorative element */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none hidden lg:block">
          <ServerIcon size={180} strokeWidth={0.5} />
        </div>
      </section>

      {/* ─── KPI Cards ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Total Managed Nodes */}
        <div
          className="rounded-[1.2rem] p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-white/20 group"
          style={{
            background: "rgba(13, 28, 45, 0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="absolute top-0 left-0 w-12 h-1 bg-[var(--teal)] rounded-full ml-6 mt-0" />
          <div className="flex justify-between items-start mt-3">
            <div>
              <p className="text-[var(--text-sub)] text-sm font-medium mb-1">Managed Nodes</p>
              <h3 className="text-4xl font-bold text-[var(--text)]">{servers.length}</h3>
            </div>
            <div className="p-2 rounded-lg bg-[var(--teal)]/10">
              <ServerIcon size={20} className="text-[var(--teal)]" />
            </div>
          </div>
        </div>

        {/* Online & Healthy */}
        <div
          className="rounded-[1.2rem] p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-white/20 group"
          style={{
            background: "rgba(13, 28, 45, 0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="absolute top-0 left-0 w-12 h-1 bg-emerald-500 rounded-full ml-6 mt-0" />
          <div className="flex justify-between items-start mt-3">
            <div>
              <p className="text-[var(--text-sub)] text-sm font-medium mb-1">Online & Healthy</p>
              <h3 className="text-4xl font-bold text-emerald-400">{online}</h3>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle size={20} className="text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Warning */}
        <div
          className="rounded-[1.2rem] p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-white/20 group"
          style={{
            background: "rgba(13, 28, 45, 0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="absolute top-0 left-0 w-12 h-1 bg-[var(--amber)] rounded-full ml-6 mt-0" />
          <div className="flex justify-between items-start mt-3">
            <div>
              <p className="text-[var(--text-sub)] text-sm font-medium mb-1">Warning</p>
              <h3 className="text-4xl font-bold text-[var(--amber)]">{warning}</h3>
            </div>
            <div className="p-2 rounded-lg bg-[var(--amber)]/10">
              <AlertTriangle size={20} className="text-[var(--amber)]" />
            </div>
          </div>
        </div>

        {/* Critical Faults */}
        <div
          className="rounded-[1.2rem] p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-white/20 group"
          style={{
            background: "rgba(13, 28, 45, 0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="absolute top-0 left-0 w-12 h-1 bg-rose-500 rounded-full ml-6 mt-0" />
          <div className="flex justify-between items-start mt-3">
            <div>
              <p className="text-[var(--text-sub)] text-sm font-medium mb-1">Critical Faults</p>
              <h3 className="text-4xl font-bold text-rose-400">{offline}</h3>
            </div>
            <div className="relative">
              <div className="p-2 rounded-lg bg-rose-500/10">
                <XCircle size={20} className="text-rose-400" />
              </div>
              <span
                className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full"
                style={{
                  boxShadow: "0 0 0 0 rgba(244, 63, 94, 0.7)",
                  animation: "pulse-crit 2s infinite",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pulsing dot keyframes */}
      <style>{`
        @keyframes pulse-crit {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
        }
      `}</style>

      {/* ─── Quick Operations Bar ─── */}
      <section className="flex flex-wrap gap-3 items-center">
        <span className="text-[var(--text-sub)] text-xs font-bold uppercase tracking-[0.15em] mr-2">
          Quick Operations:
        </span>
        <button
          onClick={() => navigate({ to: "/vms" })}
          className="flex items-center gap-2 rounded-full border border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text)] px-5 py-2.5 text-sm font-semibold hover:bg-[var(--bg-card)] hover:border-[var(--text-sub)] transition-all cursor-pointer"
        >
          <Layers size={16} /> Hyper-V Manager
        </button>
        <button
          onClick={() => navigate({ to: "/updates" })}
          className="flex items-center gap-2 rounded-full border border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text)] px-5 py-2.5 text-sm font-semibold hover:bg-[var(--bg-card)] hover:border-[var(--text-sub)] transition-all cursor-pointer"
        >
          <RefreshCw size={16} /> Patch Status
        </button>
        <button
          onClick={() => navigate({ to: "/security" })}
          className="flex items-center gap-2 rounded-full border border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text)] px-5 py-2.5 text-sm font-semibold hover:bg-[var(--bg-card)] hover:border-[var(--text-sub)] transition-all cursor-pointer"
        >
          <ShieldCheck size={16} /> Security Logs
        </button>
        <button
          onClick={() => navigate({ to: "/powershell" })}
          className="flex items-center gap-2 rounded-full bg-[var(--amber)] text-black px-5 py-2.5 text-sm font-bold shadow-lg shadow-[var(--amber)]/20 hover:brightness-110 transition-all cursor-pointer"
        >
          <Terminal size={16} /> PowerShell Terminal
        </button>
      </section>

      {/* ─── AI Intelligence Card ─── */}
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

      {/* ─── 2-Column Main Content ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server Fleet Table (Left 2/3) */}
        <div
          className="lg:col-span-2 rounded-[1.2rem] overflow-hidden flex flex-col"
          style={{
            background: "rgba(13, 28, 45, 0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-lg font-bold text-[var(--text)]">Server Fleet</h2>
            <button
              onClick={() => navigate({ to: "/servers" })}
              className="text-[var(--amber)] text-sm font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All Nodes <ChevronRight size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            {loading && servers.length === 0 ? (
              <div className="p-6 space-y-4">
                <div className="nx-skeleton h-12 w-full rounded-lg"></div>
                <div className="nx-skeleton h-12 w-full rounded-lg"></div>
                <div className="nx-skeleton h-12 w-full rounded-lg"></div>
                <div className="nx-skeleton h-12 w-full rounded-lg"></div>
              </div>
            ) : servers.length === 0 ? (
              <div className="py-14 text-center text-sm text-[var(--text-sub)] space-y-3">
                <ServerIcon size={28} className="mx-auto text-[var(--text-sub)] opacity-40" />
                <p>No servers discovered in database.</p>
                <button
                  onClick={() => loadData(true)}
                  className="text-[var(--amber)] hover:underline font-bold text-xs cursor-pointer"
                >
                  Click to scan local node / AD domain
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[var(--text-sub)] text-[11px] uppercase tracking-[0.1em] font-bold border-b border-white/10 bg-[var(--bg-void)]/50">
                    <th className="px-6 py-4 font-bold">Node Name</th>
                    <th className="px-6 py-4 font-bold">IP Address</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold hidden md:table-cell">OS</th>
                    <th className="px-6 py-4 font-bold">CPU</th>
                    <th className="px-6 py-4 font-bold hidden sm:table-cell">RAM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {servers.slice(0, 5).map((srv, idx) => {
                    const isOnline = srv.status === "online";
                    const isWarn = srv.status === "warning";
                    const rowBg = idx % 2 === 1 ? "bg-[var(--bg-void)]/30" : "";
                    return (
                      <tr key={srv.ip || srv.id} className={`${rowBg} hover:bg-white/[0.03] transition-colors`}>
                        <td className="px-6 py-5 font-semibold text-[var(--text)] whitespace-nowrap">{srv.name}</td>
                        <td className="px-6 py-5 font-mono text-sm text-[var(--text-sub)]">{srv.ip}</td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight w-fit ${
                            isOnline
                              ? "bg-emerald-500/10 text-emerald-400"
                              : isWarn
                              ? "bg-[var(--amber)]/10 text-[var(--amber)]"
                              : "bg-rose-500/10 text-rose-400"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isOnline ? "bg-emerald-400" : isWarn ? "bg-[var(--amber)]" : "bg-rose-400"
                            }`} />
                            {srv.status === "online" ? "Online" : srv.status === "warning" ? "Warning" : "Critical"}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-[var(--text-sub)] hidden md:table-cell">{srv.os || "—"}</td>
                        <td className="px-6 py-5 text-sm text-[var(--text)]">{srv.cpu}%</td>
                        <td className="px-6 py-5 text-sm text-[var(--text-sub)] hidden sm:table-cell">{srv.mem}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Alerts (Right 1/3) */}
        <div
          className="rounded-[1.2rem] p-6 flex flex-col"
          style={{
            background: "rgba(13, 28, 45, 0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <h2 className="text-lg font-bold text-[var(--text)] mb-5">Recent Alerts</h2>

          <div className="space-y-3 flex-1">
            {alerts.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--text-sub)]">
                No critical alerts detected
              </div>
            ) : (
              alerts.map((n) => {
                const isCrit = n.type === "Critical" || n.type === "Error";
                const borderColor = isCrit
                  ? "border-l-rose-500 bg-rose-500/5"
                  : n.type === "Warning"
                  ? "border-l-[var(--amber)] bg-[var(--amber)]/5"
                  : "border-l-emerald-500 bg-emerald-500/5";
                const titleColor = isCrit
                  ? "text-rose-400"
                  : n.type === "Warning"
                  ? "text-[var(--amber)]"
                  : "text-emerald-400";

                return (
                  <div
                    key={n.id}
                    className={`pl-4 border-l-4 ${borderColor} py-3 pr-3 rounded-r-lg`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className={`text-sm font-bold ${titleColor}`}>
                        {n.type}: {n.serverIp ?? "System"}
                      </p>
                      <span className="text-[10px] text-[var(--text-ghost)] whitespace-nowrap ml-2">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-sub)] leading-relaxed">{n.message}</p>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => navigate({ to: "/security" })}
            className="w-full mt-5 py-3 bg-[var(--bg-surface)] rounded-xl text-sm font-bold text-[var(--text-sub)] hover:bg-[var(--bg-card)] hover:text-[var(--text)] transition-colors cursor-pointer border border-[var(--border-c)]"
          >
            View Alert History
          </button>
        </div>
      </section>

      {/* ─── Fleet Resource Load ─── */}
      <section
        className="rounded-[1.2rem] p-6 md:p-8"
        style={{
          background: "rgba(13, 28, 45, 0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">Fleet Resource Load</h2>
            <p className="text-sm text-[var(--text-sub)] mt-0.5">
              Aggregate resource consumption across all managed nodes
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--amber)]" />
              <span className="text-xs font-bold text-[var(--text-sub)]">CPU</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--teal)]" />
              <span className="text-xs font-bold text-[var(--text-sub)]">RAM</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CPU Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-sub)]">
                Average CPU Load
              </span>
              <span className="text-2xl font-bold text-[var(--text)]">{avgCpu}%</span>
            </div>
            <div className="h-3.5 bg-[var(--bg-void)] rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-[var(--amber)] rounded-full transition-all duration-700"
                style={{ width: `${avgCpu}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-ghost)] uppercase font-bold tracking-widest">
              <span>Idle ({100 - avgCpu}%)</span>
              <span>Active</span>
            </div>
          </div>

          {/* RAM Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-sub)]">
                Memory Allocation
              </span>
              <span className="text-2xl font-bold text-[var(--text)]">{avgRam}%</span>
            </div>
            <div className="h-3.5 bg-[var(--bg-void)] rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-[var(--teal)] rounded-full transition-all duration-700"
                style={{ width: `${avgRam}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-ghost)] uppercase font-bold tracking-widest">
              <span>Reserved</span>
              <span>Available ({100 - avgRam}%)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
