import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useContext } from "react";
import { Plus, Terminal, Monitor, MoreHorizontal, RefreshCw, Power, Trash2, PowerOff } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricBar } from "@/components/ui/MetricBar";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  getServersClient as getServers, 
  addServerClient as addServer, 
  deleteServerClient,
  restartServerClient,
  shutdownServerClient,
  type Server 
} from "@/api/client";
import { ThemeContext } from "./__root";
import { HorizonServers } from "../themes/horizon/pages/HorizonServers";

export const Route = createFileRoute("/servers")({
  head: () => ({ meta: [{ title: "Servers — NEXUS" }, { name: "description", content: "Manage your Windows Server fleet." }] }),
  component: ServersPage,
});

function ServersPage() {
  const { theme } = useContext(ThemeContext);
  if (theme === 'horizon') return <HorizonServers />;

  const [servers, setServers] = useState<Server[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [osFilters, setOsFilters] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIp, setNewIp] = useState("");
  const [newRole, setNewRole] = useState("");
  const [loading, setLoading] = useState(false);

  const loadServers = async () => {
    setLoading(true);
    try {
      const data = await getServers();
      setServers(data);
    } catch(e) {
      toast.error("Failed to load servers");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadServers(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addServer({ name: newName, ip: newIp, role: newRole });
      toast.success("Server added");
      setIsAdding(false);
      setNewName(""); setNewIp(""); setNewRole("");
      loadServers();
    } catch(e) {
      toast.error("Failed to add server");
    }
  };

  const toggleOs = (os: string) => {
    setOsFilters(prev =>
      prev.includes(os) ? prev.filter(x => x !== os) : [...prev, os]
    );
  };

  const osList = ["Windows Server 2016", "Windows Server 2019", "Windows Server 2022"];
  const filtered = servers.filter((s) =>
    (statusFilter === "all" || s.status === statusFilter) &&
    (osFilters.length === 0 || osFilters.includes(s.os)) &&
    (q === "" || s.name.toLowerCase().includes(q.toLowerCase()) || s.ip.includes(q) || s.role.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <PageWrapper>
      <PageHeader
        eyebrow="Infrastructure"
        title="Server Fleet"
        subtitle={`${servers.length} servers · ${servers.filter(s=>s.status==="online").length} online`}
        right={
          <div className="flex gap-2">
            <button onClick={loadServers} disabled={loading} className="mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:text-[var(--text)] transition-colors disabled:opacity-50">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button onClick={() => setIsAdding(true)} className="mono flex items-center gap-1.5 rounded-md border border-[var(--amber)] bg-[var(--amber-low)] px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black transition-colors">
              <Plus size={14} /> Add Server
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-[240px_1fr] gap-6">
        <aside className="nx-card h-fit p-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="mono mb-4 w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-2 text-[12px] placeholder:text-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none" />
          <div className="eyebrow pb-2">Status</div>
          <div className="space-y-1">
            {(["all","online","warning","critical"] as const).map((k) => {
              const count = k === "all" ? servers.length : servers.filter((s) => s.status === k).length;
              const active = statusFilter === k;
              return (
                <button key={k} onClick={() => setStatusFilter(k)} className={"flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] capitalize transition-colors " + (active ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]")}>
                  <span>{k}</span>
                  <span className="mono text-[10px]">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="eyebrow pb-2 pt-5">OS</div>
          <div className="space-y-1 text-[12px] text-[var(--text-sub)]">
            {["Windows Server 2016","Windows Server 2019","Windows Server 2022"].map((os) => (
              <label key={os} className="flex items-center gap-2 px-2.5 py-1">
                <input type="checkbox" defaultChecked className="accent-[var(--amber)]" />
                <span>{os.replace("Windows Server ","WS ")}</span>
              </label>
            ))}
          </div>
        </aside>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filtered.map((s) => <ServerCard key={s.id} s={s} onAction={loadServers} />)}
          {filtered.length === 0 && (
            <div className="nx-card col-span-full p-12 text-center text-[13px] text-[var(--text-sub)]">No servers match those filters.</div>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleAdd} className="nx-card w-[400px] p-6">
            <h3 className="mb-4 text-lg font-semibold">Add Server</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-[var(--text-sub)]">Hostname</label>
                <input required value={newName} onChange={e => setNewName(e.target.value)} className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none" placeholder="e.g. SRV-01" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-sub)]">IP Address</label>
                <input required value={newIp} onChange={e => setNewIp(e.target.value)} className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none" placeholder="e.g. 192.168.1.50" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-sub)]">Server Role</label>
                <input required value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none" placeholder="e.g. Database Server" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="rounded px-4 py-2 text-sm text-[var(--text-sub)] hover:text-[var(--text)]">Cancel</button>
              <button type="submit" className="rounded bg-[var(--amber)] px-4 py-2 text-sm font-medium text-black">Add</button>
            </div>
          </form>
        </div>
      )}
    </PageWrapper>
  );
}

function ServerCard({ s, onAction }: { s: Server; onAction: () => void }) {
  const stripe = s.status === "online" ? "var(--ok)" : s.status === "warning" ? "var(--warn)" : "var(--crit)";
  const navigate = useNavigate();

  const handleRestart = async () => {
    toast.info(`Restarting ${s.name}...`);
    const ok = await restartServerClient(s.ip);
    if (ok) { toast.success(`${s.name} is restarting`); onAction(); }
    else toast.error(`Failed to restart ${s.name}`);
  };

  const handleShutdown = async () => {
    toast.info(`Shutting down ${s.name}...`);
    const ok = await shutdownServerClient(s.ip);
    if (ok) { toast.success(`${s.name} is shutting down`); onAction(); }
    else toast.error(`Failed to shutdown ${s.name}`);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${s.name}?`)) return;
    const ok = await deleteServerClient(s.ip);
    if (ok) { toast.success(`${s.name} deleted`); onAction(); }
    else toast.error(`Failed to delete ${s.name}`);
  };

  return (
    <div className="nx-card relative overflow-hidden">
      <span className="absolute left-0 top-0 h-full w-[3px]" style={{ background: stripe }} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="display text-[18px] font-semibold">{s.name}</h3>
            <div className="mono pt-0.5 text-[11px] text-[var(--text-sub)]">{s.ip} · {s.os}</div>
          </div>
          <StatusBadge status={s.status} />
        </div>
        <div className="mono mt-2 inline-block rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] text-[var(--text-sub)]">{s.role}</div>

        <div className="mt-5 grid grid-cols-3 gap-4">
          <MetricBar label="CPU" value={s.cpu} warning={75} critical={90} />
          <MetricBar label="Mem" value={s.mem} warning={75} critical={90} />
          <MetricBar label="Disk" value={s.disk} warning={75} critical={90} />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub)]">Uptime · <span className="text-[var(--teal)]">{s.uptime}</span></span>
          <div className="flex gap-1.5">
            <IconAction icon={Monitor} label="Connect" onClick={() => navigate({ to: `/server/$serverId`, params: { serverId: s.ip } })} />
            <IconAction icon={Terminal} label="PowerShell" onClick={() => navigate({ to: "/powershell", search: { serverIp: s.ip } as any })} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button title="More" className="grid h-7 w-7 place-items-center rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)] transition-colors hover:border-[var(--amber)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] outline-none">
                  <MoreHorizontal size={13} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[var(--bg-card)] border-[var(--border-dim)]">
                <DropdownMenuItem onClick={handleRestart} className="cursor-pointer hover:bg-[var(--bg-surface)] text-[var(--text)]">
                  <RefreshCw className="mr-2 h-4 w-4" /> Restart
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShutdown} className="cursor-pointer hover:bg-[var(--bg-surface)] text-[var(--text)]">
                  <Power className="mr-2 h-4 w-4" /> Shutdown
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[var(--border-dim)]" />
                <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-[var(--crit)] hover:!bg-[var(--crit)]/10 hover:!text-[var(--crit)] transition-colors">
                  <Trash2 className="mr-2 h-4 w-4" /> Remove Server
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </div>
    </div>
  );
}

function IconAction({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ size?: number }>; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} title={label} className="grid h-7 w-7 place-items-center rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)] transition-colors hover:border-[var(--amber)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)]">
      <Icon size={13} />
    </button>
  );
}
