import React, { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getServersClient, getNotificationsClient, type Server, type Notification } from "@/api/client";
import { Server as ServerIcon, CheckCircle, XCircle, AlertTriangle, ChevronRight } from "lucide-react";

export function HorizonDashboard() {
  const [servers, setServers] = useState<Server[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    const srvs = await getServersClient();
    setServers(srvs);
    setLoading(false);
  };

  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour >= 5 && hour < 12) greeting = "Good morning";
  else if (hour >= 12 && hour < 17) greeting = "Good afternoon";

  const [userName, setUserName] = useState(() => {
    try {
      const userStr = localStorage.getItem("nexus-user");
      return userStr ? JSON.parse(userStr).username || "Admin" : "Admin";
    } catch(e) { return "Admin"; }
  });

  useEffect(() => {
    loadData();
    getNotificationsClient().then(notifs => setNotifications(notifs));

    const id = setInterval(() => {
      loadData();
      getNotificationsClient().then(notifs => setNotifications(notifs));
    }, 10000);

    return () => clearInterval(id);
  }, []);

  const online = servers.filter((s) => s.status === "online").length;
  const offline = servers.filter((s) => s.status === "critical").length;
  const warning = servers.filter((s) => s.status === "warning").length;

  const alerts = notifications
    .filter((n) => n.type === "Critical" || n.type === "Warning" || n.type === "Error")
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-[var(--text-sub)] text-sm">
        Loading Horizon Fleet Data…
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 font-sans">
      {/* Hero Section */}
      <section className="relative w-full rounded-[1.5rem] overflow-hidden shadow-sm bg-[var(--bg-surface)] border border-[var(--border-c)] min-h-[220px] flex items-center p-6 md:p-12">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--amber-low)] to-transparent pointer-events-none opacity-50"></div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[var(--text)] mb-4 leading-tight">
            {greeting}, {userName}.<br />
            <span className="text-[var(--amber)]">{online} servers online</span>
          </h2>
          <button 
            onClick={() => navigate({ to: "/servers" })}
            className="bg-[var(--amber)] hover:opacity-90 text-white font-semibold py-3 px-8 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 mt-4"
          >
            View Fleet Management
          </button>
        </div>
      </section>

      {/* KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Total Servers */}
        <div className="bg-[var(--bg-surface)] rounded-[1.2rem] p-6 shadow-sm border border-[var(--border-c)] relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--teal)]"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-[var(--text-sub)] text-xs font-semibold uppercase tracking-widest">Total Servers</p>
            <ServerIcon size={20} className="text-[var(--teal)]" />
          </div>
          <h3 className="text-4xl font-extrabold text-[var(--text)]">{servers.length}</h3>
        </div>

        {/* Online */}
        <div className="bg-[var(--bg-surface)] rounded-[1.2rem] p-6 shadow-sm border border-[var(--border-c)] relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--ok)]"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-[var(--text-sub)] text-xs font-semibold uppercase tracking-widest">Online</p>
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

      {/* 2-Column Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Server Fleet Table (Left 2/3) */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] rounded-[1.5rem] shadow-sm border border-[var(--border-c)] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[var(--border-c)] flex justify-between items-center bg-[var(--amber-low)]/20">
            <h3 className="text-lg font-bold text-[var(--text)]">Server Fleet Status</h3>
            <button onClick={() => navigate({ to: "/servers" })} className="text-[var(--amber)] text-sm font-semibold hover:underline flex items-center gap-1">
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
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
                    <tr key={srv.ip} className="hover:bg-[var(--amber-low)]/30 transition-colors">
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
          </div>
        </div>

        {/* Recent Alerts (Right 1/3) */}
        <div className="bg-[var(--bg-surface)] rounded-[1.5rem] shadow-sm border border-[var(--border-c)] p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-6">Recent Alerts</h3>
            <div className="relative border-l-2 border-[var(--border-c)] ml-3 space-y-8 pb-4">
              {alerts.map((n) => (
                <div key={n.id} className="relative pl-6">
                  <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-[var(--bg-surface)] shadow-sm ${
                    n.type === "Critical" || n.type === "Error" ? "bg-[var(--crit)]" : "bg-[var(--warn)]"
                  }`}></span>
                  <p className="text-xs font-mono text-[var(--text-sub)] mb-1">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <h4 className="font-semibold text-[var(--text)] text-sm">{n.type} Alert: {n.serverIp ?? "System"}</h4>
                  <p className="text-xs text-[var(--text-sub)] mt-1 leading-snug">{n.message}</p>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="py-12 text-center text-xs text-[var(--text-sub)]">No critical alerts detected ✓</div>
              )}
            </div>
          </div>
          <button 
            onClick={() => navigate({ to: "/events" })}
            className="w-full mt-6 py-2.5 border border-[var(--border-c)] rounded-full text-xs font-semibold text-[var(--text-sub)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] transition-colors"
          >
            View Alert History
          </button>
        </div>
      </section>
    </div>
  );
}
