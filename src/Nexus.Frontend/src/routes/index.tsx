import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useContext } from "react";
import { ChevronDown, ChevronUp, Monitor, Terminal, RefreshCw, ScrollText, Hexagon } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { NxCard } from "@/components/ui/NxCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricBar } from "@/components/ui/MetricBar";
import { getServersClient, getNotificationsClient, testNotificationClient, type Server, type Notification } from "@/api/client";
import * as signalR from "@microsoft/signalr";
import { ThemeContext } from "./__root";
import { HorizonDashboard } from "../themes/horizon/pages/HorizonDashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — NEXUS" },
      { name: "description", content: "Live network topology, fleet health, and event stream for your Windows Server estate." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { theme } = useContext(ThemeContext);
  if (theme === 'horizon') return <HorizonDashboard />;

  const [servers, setServers] = useState<Server[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(true);

  const loadData = async () => {
    const srvs = await getServersClient();
    setServers(srvs);
    if (srvs.length > 0 && !selected) setSelected(srvs[0].ip);
    setLoading(false);
  };

  useEffect(() => {
    // Initial fetch
    loadData();
    getNotificationsClient().then(notifs => setNotifications(notifs));

    // Poll for servers
    const id = setInterval(loadData, 10000);

    // Setup SignalR — re-read token on every (re)connect so refreshed tokens are used
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/hub/notifications", {
        accessTokenFactory: () => localStorage.getItem("nexus_token") || ""
      })
      .withAutomaticReconnect()
      .build();

    const MAX_NOTIFICATIONS = 100;
    connection.on("ReceiveNotification", (notification: Notification) => {
      // Cap array to prevent unbounded memory growth in long sessions
      setNotifications(prev => [notification, ...prev].slice(0, MAX_NOTIFICATIONS));
    });

    connection.start().catch(err => console.error("SignalR Connection Error: ", err));

    return () => {
      clearInterval(id);
      connection.stop();
    };
  }, []);

  const server = servers.find((s) => s.ip === selected) ?? servers[0];
  const online = servers.filter((s) => s.status === "online").length;
  const warning = servers.filter((s) => s.status === "warning").length;
  const critical = servers.filter((s) => s.status === "critical").length;

  const alerts = notifications
    .filter((n) => n.type === "Critical" || n.type === "Warning" || n.type === "Error")
    .slice(0, 5);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex h-64 items-center justify-center text-[var(--text-sub)] text-sm">Loading fleet data…</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="grid grid-cols-[380px_1fr] gap-6">
        {/* Topology */}
        <div className="nx-card p-5">
          <div className="eyebrow pb-1">Live Topology</div>
          <div className="display pb-4 text-[15px] font-semibold">nexuslab.local</div>
          <Topology servers={servers} selected={selected} onSelect={setSelected} />
          <div className="mt-4 flex items-center justify-center gap-4 text-[10px]">
            <Legend color="var(--ok)" label="Online" />
            <Legend color="var(--warn)" label="Warning" />
            <Legend color="var(--crit)" label="Critical" />
          </div>
        </div>

        {/* Command */}
        <div className="flex flex-col gap-5">
          {/* Server panel */}
          {server && (
            <div className="nx-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="eyebrow pb-1">Selected Node</div>
                  <h2 className="display text-[22px] font-semibold">{server.name}</h2>
                  <div className="mono pt-1 text-[11px] text-[var(--text-sub)]">
                    {server.role} · <span className="text-[var(--text)]">{server.ip}</span> · {server.os}
                  </div>
                </div>
                <StatusBadge status={server.status} />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-5">
                <MetricBar label="CPU" value={server.cpu} warning={75} critical={90} />
                <MetricBar label="Memory" value={server.mem} warning={75} critical={90} />
                <MetricBar label="Disk C:" value={server.disk} warning={75} critical={90} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <QuickAction icon={Monitor} label="Remote Desktop" onClick={() => navigate({ to: `/server/$serverId`, params: { serverId: server.ip } })} />
                <QuickAction icon={Terminal} label="PowerShell" onClick={() => navigate({ to: "/powershell", search: { serverIp: server.ip } as any })} />
                <QuickAction icon={RefreshCw} label="Restart Services" />
                <QuickAction icon={ScrollText} label="Event Viewer" onClick={() => navigate({ to: `/server/$serverId`, params: { serverId: server.ip } })} />
              </div>
            </div>
          )}

          {/* Fleet summary + alerts */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Online" count={online} color="var(--ok)" />
            <StatTile label="Warning" count={warning} color="var(--warn)" />
            <StatTile label="Critical" count={critical} color="var(--crit)" />
          </div>

          <NxCard eyebrow="Recent Alerts" title="Across fleet (last 24h)">
            <div className="divide-y divide-[var(--border-dim)]">
              {alerts.map((n) => (
                <div key={n.id} className="grid grid-cols-[80px_70px_1fr] items-center gap-3 py-2 text-[12px]">
                  <span className="mono text-[var(--text-sub)]">{new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <StatusBadge status={n.type === "Critical" || n.type === "Error" ? "critical" : "warning"}>{n.type}</StatusBadge>
                  <span className="truncate text-[var(--text)]">{n.message}</span>
                </div>
              ))}
              {alerts.length === 0 && <div className="py-6 text-center text-[12px] text-[var(--text-sub)]">No alerts in the last 24h ✓</div>}
            </div>
          </NxCard>
        </div>
      </div>

      {/* Notification Stream drawer */}
      <div className="mt-6 nx-card overflow-hidden">
        <div
          onClick={() => setDrawerOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-3 hover:bg-[var(--bg-surface)] cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Terminal size={14} className="text-[var(--amber)]" />
            <span className="eyebrow">Live Event Stream</span>
            <span className="nx-blink ml-2 h-1.5 w-1.5 rounded-full bg-[var(--teal)]" />
          </div>
          {drawerOpen ? <ChevronDown size={14} className="text-[var(--text-sub)]" /> : <ChevronUp size={14} className="text-[var(--text-sub)]" />}
        </div>
        {drawerOpen && (
          <div className="max-h-[260px] overflow-y-auto border-t border-[var(--border-c)] bg-[var(--bg-void)]/40">
            {notifications.length === 0 && (
              <div className="py-6 text-center text-[12px] text-[var(--text-sub)]">No notifications yet.</div>
            )}
            {notifications.map((n, i) => (
              <div
                key={n.id}
                className={"mono flex gap-3 px-5 py-1.5 text-[11px] " + (i % 2 ? "bg-[var(--bg-surface)]/40" : "")}
              >
                <span className="text-[var(--text-sub)]">[{new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}]</span>
                <span
                  className="w-[60px]"
                  style={{
                    color:
                      n.type === "Critical" || n.type === "Error" ? "var(--crit)" :
                      n.type === "Warning" ? "var(--warn)" : "var(--teal)",
                  }}
                >
                  [{n.type.toUpperCase().slice(0, 4)}]
                </span>
                <span className="w-[68px] text-[var(--amber)]">[{n.serverIp?.slice(0, 8) ?? "---"}]</span>
                <span className="flex-1 truncate text-[var(--text)]">{n.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="mono flex items-center gap-1.5 uppercase tracking-[0.2em] text-[var(--text-sub)]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="group flex items-center gap-2.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2.5 text-[12px] text-[var(--text-sub)] transition-colors hover:border-[var(--amber)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)]">
      <Icon size={14} />
      <span className="truncate">{label}</span>
    </button>
  );
}

function StatTile({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="nx-card p-4">
      <div className="eyebrow pb-1.5" style={{ color }}>{label}</div>
      <div className="display text-[28px] font-bold" style={{ color }}>{count}</div>
    </div>
  );
}

function Topology({ servers, selected, onSelect }: { servers: Server[]; selected: string | null; onSelect: (ip: string) => void }) {
  const size = 320, cx = size / 2, cy = size / 2, R = 112;
  const nodes = useMemo(() => servers.map((s, i) => {
    const angle = (i / Math.max(servers.length, 1)) * Math.PI * 2 - Math.PI / 2;
    return { ...s, x: cx + Math.cos(angle) * R, y: cy + Math.sin(angle) * R };
  }), [servers, cx, cy]);

  const colorFor = (s: string) =>
    s === "online" ? "var(--ok)" : s === "warning" ? "var(--warn)" : s === "critical" ? "var(--crit)" : "var(--text-sub)";

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="block">
      {/* rotating dashed ring */}
      <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: "nx-spin-slow 20s linear infinite" }}>
        <circle cx={cx} cy={cy} r={R + 24} fill="none" stroke="var(--amber)" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 6" />
      </g>
      {/* connections */}
      {nodes.map((n) => (
        <line key={"l" + n.ip} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={colorFor(n.status)} strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 4" />
      ))}
      {/* hub */}
      <g transform={`translate(${cx} ${cy})`}>
        <polygon points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" fill="var(--amber-low)" stroke="var(--amber)" strokeWidth="1.5" />
        <foreignObject x={-26} y={-12} width="52" height="24">
          <div className="mono grid h-full place-items-center text-[7.5px] uppercase tracking-[0.18em] text-[var(--amber)]">
            <Hexagon size={12} />
          </div>
        </foreignObject>
        <text textAnchor="middle" y={48} className="mono" fill="var(--amber)" fontSize="8" letterSpacing="2">NEXUS HUB</text>
      </g>
      {/* nodes */}
      {nodes.map((n) => {
        const isSel = n.ip === selected;
        return (
          <g key={n.ip} transform={`translate(${n.x} ${n.y})`} onClick={() => onSelect(n.ip)} className="cursor-pointer">
            {isSel && (
              <circle r={18} fill="none" stroke={colorFor(n.status)} strokeOpacity="0.7" strokeWidth="1.5" style={{ transformOrigin: "0 0", animation: "nx-ring-pulse 1.6s ease-out infinite" }} />
            )}
            <circle r={16} fill="var(--bg-surface)" stroke={colorFor(n.status)} strokeWidth={isSel ? 2 : 1.5} />
            <text textAnchor="middle" dy="3" className="mono" fill="var(--text)" fontSize="7">{n.name.slice(0, 8)}</text>
          </g>
        );
      })}
    </svg>
  );
}
