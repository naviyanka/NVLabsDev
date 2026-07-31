import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Plus, X, Save, RotateCcw, Cpu, HardDrive, Wifi, Bell, Server, Activity, Zap, BarChart3 } from "lucide-react";
import { getApiUrl } from "@/lib/backend";
import { toast } from "sonner";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { BarChart, Bar, AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard-custom")({
  head: () => ({ meta: [{ title: "Custom Dashboard — NEXUS" }] }),
  component: CustomDashboard,
});

interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  size: "sm" | "md" | "lg";
}

const WIDGET_CATALOG: { type: string; title: string; icon: any; desc: string; defaultSize: "sm" | "md" | "lg" }[] = [
  { type: "fleet-status", title: "Fleet Status", icon: Server, desc: "Online/offline/critical server counts", defaultSize: "sm" },
  { type: "cpu-top5", title: "CPU Top 5", icon: Cpu, desc: "Servers with highest CPU usage", defaultSize: "sm" },
  { type: "ram-top5", title: "RAM Top 5", icon: Activity, desc: "Servers with highest memory usage", defaultSize: "sm" },
  { type: "disk-top5", title: "Disk Top 5", icon: HardDrive, desc: "Servers with highest disk usage", defaultSize: "sm" },
  { type: "recent-alerts", title: "Recent Alerts", icon: Bell, desc: "Last 10 notifications", defaultSize: "md" },
  { type: "cpu-fleet-chart", title: "Fleet CPU Chart", icon: BarChart3, desc: "CPU usage bar chart for all servers", defaultSize: "lg" },
  { type: "alert-trend", title: "Alert Trend", icon: Zap, desc: "Alerts per day over last 7 days", defaultSize: "md" },
  { type: "uptime-leaders", title: "Uptime Leaders", icon: Wifi, desc: "Servers with longest uptime", defaultSize: "sm" },
];

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: "w1", type: "fleet-status", title: "Fleet Status", size: "sm" },
  { id: "w2", type: "cpu-top5", title: "CPU Top 5", size: "sm" },
  { id: "w3", type: "ram-top5", title: "RAM Top 5", size: "sm" },
  { id: "w4", type: "disk-top5", title: "Disk Top 5", size: "sm" },
  { id: "w5", type: "recent-alerts", title: "Recent Alerts", size: "md" },
  { id: "w6", type: "cpu-fleet-chart", title: "Fleet CPU Chart", size: "lg" },
];

function CustomDashboard() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_LAYOUT);
  const [showCatalog, setShowCatalog] = useState(false);
  const [serverData, setServerData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [dirty, setDirty] = useState(false);

  // Load layout from backend
  useEffect(() => {
    fetch(getApiUrl("/dashboard/layout"))
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.layout) {
          try { setWidgets(JSON.parse(data.layout)); } catch { /* use default */ }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch live data
  useEffect(() => {
    const load = () => {
      fetch(getApiUrl("/servers")).then(r => r.ok ? r.json() : []).then(setServerData).catch(() => {});
      fetch(getApiUrl("/notifications")).then(r => r.ok ? r.json() : []).then(d => setAlerts(Array.isArray(d) ? d.slice(0, 10) : [])).catch(() => {});
      fetch(getApiUrl("/reports/health")).then(r => r.ok ? r.json() : null).then(setHealthData).catch(() => {});
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const saveLayout = async () => {
    try {
      await fetch(getApiUrl("/dashboard/layout"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: JSON.stringify(widgets) }),
      });
      toast.success("Dashboard layout saved");
      setDirty(false);
    } catch { toast.error("Failed to save layout"); }
  };

  const addWidget = (type: string) => {
    const catalog = WIDGET_CATALOG.find(w => w.type === type);
    if (!catalog) return;
    const newWidget: WidgetConfig = {
      id: "w" + Date.now(),
      type: catalog.type,
      title: catalog.title,
      size: catalog.defaultSize,
    };
    setWidgets(prev => [...prev, newWidget]);
    setDirty(true);
    setShowCatalog(false);
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    setDirty(true);
  };

  const resetLayout = () => {
    setWidgets(DEFAULT_LAYOUT);
    setDirty(true);
  };

  const sizeClass = (size: string) => {
    switch (size) {
      case "lg": return "col-span-1 md:col-span-2 lg:col-span-3";
      case "md": return "col-span-1 md:col-span-2 lg:col-span-2";
      default: return "col-span-1";
    }
  };

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Custom Dashboard" subtitle="Arrange widgets to build your monitoring view" />
        <div className="flex items-center gap-2">
          {dirty && (
            <button onClick={saveLayout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] cursor-pointer">
              <Save size={13} /> Save Layout
            </button>
          )}
          <button onClick={() => setShowCatalog(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--text)] hover:border-[var(--amber)] cursor-pointer">
            <Plus size={13} /> Add Widget
          </button>
          <button onClick={resetLayout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border-c)] text-[var(--text-sub)] hover:text-rose-400 hover:border-rose-400 cursor-pointer">
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map(w => (
          <div key={w.id} className={`${sizeClass(w.size)} bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-4 shadow-sm relative group`}>
            <button onClick={() => removeWidget(w.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-opacity">
              <X size={12} />
            </button>
            <WidgetRenderer type={w.type} title={w.title} servers={serverData} alerts={alerts} health={healthData} />
          </div>
        ))}
      </div>

      {/* Widget Catalog Modal */}
      {showCatalog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--text)]">Add Widget</h2>
              <button onClick={() => setShowCatalog(false)} className="text-[var(--text-sub)] hover:text-[var(--text)] cursor-pointer"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WIDGET_CATALOG.map(cat => (
                <button key={cat.type} onClick={() => addWidget(cat.type)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border-c)] hover:border-[var(--amber)] hover:bg-[var(--amber)]/5 transition-all cursor-pointer text-left">
                  <cat.icon size={18} className="text-[var(--amber)] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-[var(--text)]">{cat.title}</div>
                    <div className="text-[10px] text-[var(--text-sub)]">{cat.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

function WidgetRenderer({ type, title, servers, alerts, health }: { type: string; title: string; servers: any[]; alerts: any[]; health: any }) {
  const header = <h3 className="text-xs font-bold text-[var(--text-sub)] uppercase mb-3">{title}</h3>;

  switch (type) {
    case "fleet-status": {
      const online = servers.filter(s => s.status === "online").length;
      const warning = servers.filter(s => s.status === "warning").length;
      const critical = servers.filter(s => s.status === "critical").length;
      const offline = servers.filter(s => s.status === "offline").length;
      return <div>{header}<div className="grid grid-cols-2 gap-2 text-center"><Stat label="Online" value={online} color="text-emerald-400" /><Stat label="Warning" value={warning} color="text-amber-400" /><Stat label="Critical" value={critical} color="text-rose-400" /><Stat label="Offline" value={offline} color="text-[var(--text-sub)]" /></div></div>;
    }
    case "cpu-top5": {
      const top = [...servers].sort((a, b) => b.cpu - a.cpu).slice(0, 5);
      return <div>{header}<TopList items={top.map(s => ({ name: s.name, value: s.cpu }))} unit="%" /></div>;
    }
    case "ram-top5": {
      const top = [...servers].sort((a, b) => b.mem - a.mem).slice(0, 5);
      return <div>{header}<TopList items={top.map(s => ({ name: s.name, value: s.mem }))} unit="%" /></div>;
    }
    case "disk-top5": {
      const top = [...servers].sort((a, b) => b.disk - a.disk).slice(0, 5);
      return <div>{header}<TopList items={top.map(s => ({ name: s.name, value: s.disk }))} unit="%" /></div>;
    }
    case "recent-alerts": {
      return <div>{header}<div className="space-y-1.5 max-h-48 overflow-y-auto">{alerts.length === 0 ? <p className="text-xs text-[var(--text-sub)]">No recent alerts</p> : alerts.map((a: any, i: number) => (
        <div key={i} className="text-xs text-[var(--text-sub)] truncate border-b border-[var(--border-c)] pb-1 last:border-0">
          <span className={`font-bold mr-1 ${a.type === "Critical" || a.type === "Error" ? "text-rose-400" : a.type === "Warning" ? "text-amber-400" : "text-sky-400"}`}>[{a.type}]</span>{a.message}
        </div>
      ))}</div></div>;
    }
    case "cpu-fleet-chart": {
      const chartData = servers.filter(s => s.status !== "offline").map(s => ({ name: s.name, cpu: s.cpu })).slice(0, 15);
      return <div>{header}<ResponsiveContainer width="100%" height={160}><BarChart data={chartData}><CartesianGrid stroke="var(--border-dim)" strokeDasharray="2 4" /><XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-sub)" }} interval={0} angle={-30} textAnchor="end" height={50} /><YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--text-sub)" }} /><Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-c)", fontSize: 11 }} /><Bar dataKey="cpu" fill="var(--amber)" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>;
    }
    case "alert-trend": {
      const days = health?.alertsByDay?.slice(-7) || [];
      return <div>{header}{days.length > 0 ? <ResponsiveContainer width="100%" height={120}><AreaChart data={days}><CartesianGrid stroke="var(--border-dim)" strokeDasharray="2 4" /><XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-sub)" }} /><YAxis tick={{ fontSize: 9, fill: "var(--text-sub)" }} /><Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-c)", fontSize: 11 }} /><Area type="monotone" dataKey="count" stroke="var(--amber)" fill="var(--amber)" fillOpacity={0.15} /></AreaChart></ResponsiveContainer> : <p className="text-xs text-[var(--text-sub)]">No alert data</p>}</div>;
    }
    case "uptime-leaders": {
      const sorted = [...servers].filter(s => s.uptime).sort((a, b) => (b.uptime || "").localeCompare(a.uptime || "")).slice(0, 5);
      return <div>{header}<div className="space-y-1.5">{sorted.map((s, i) => <div key={i} className="flex items-center justify-between text-xs"><span className="text-[var(--text)] truncate">{s.name}</span><span className="text-emerald-400 font-mono">{s.uptime || "—"}</span></div>)}{sorted.length === 0 && <p className="text-xs text-[var(--text-sub)]">No data</p>}</div></div>;
    }
    default:
      return <div>{header}<p className="text-xs text-[var(--text-sub)]">Unknown widget type</p></div>;
  }
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return <div><p className={`text-xl font-extrabold ${color}`}>{value}</p><p className="text-[10px] text-[var(--text-sub)]">{label}</p></div>;
}

function TopList({ items, unit }: { items: { name: string; value: number }[]; unit: string }) {
  return <div className="space-y-1.5">{items.map((item, i) => (
    <div key={i} className="flex items-center justify-between text-xs">
      <span className="text-[var(--text)] truncate flex-1">{item.name}</span>
      <span className={`font-mono font-bold ml-2 ${item.value > 90 ? "text-rose-400" : item.value > 75 ? "text-amber-400" : "text-emerald-400"}`}>{item.value}{unit}</span>
    </div>
  ))}{items.length === 0 && <p className="text-xs text-[var(--text-sub)]">No data</p>}</div>;
}
