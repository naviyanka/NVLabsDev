import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useContext } from "react";
import { Search, ShieldCheck, Download, Trash2, ShieldAlert, RefreshCw, ChevronUp, ChevronDown, Layers, Boxes, Server as ServerIcon, CircleAlert, Loader2, Undo2 } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getRolesClient, installRoleClient, uninstallRoleClient, getServersClient, type WindowsRole, type Server } from "@/api/client";
import { toast } from "sonner";
import { ThemeContext } from "./__root";

export const Route = createFileRoute("/roles")({
  head: () => ({ meta: [{ title: "Roles & Features — NEXUS" }, { name: "description", content: "Manage Windows Server Roles and Optional Features." }] }),
  component: RolesPage,
});

type Category = "all" | "role" | "feature";

function RolesPage() {
  const { theme } = useContext(ThemeContext);

  const [server, setServer] = useState("");
  const [serverInfo, setServerInfo] = useState<Server | null>(null);
  const [roles, setRoles] = useState<WindowsRole[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const [sortCol, setSortCol] = useState<keyof WindowsRole>("displayName");
  const [sortAsc, setSortAsc] = useState(true);

  const fetchServers = async () => {
    const list = await getServersClient();
    if (list.length > 0) {
      setServer(list[0].ip);
      setServerInfo(list[0]);
    }
  };

  const fetchRoles = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const cachedData = await getRolesClient(id, false);
      if (cachedData && cachedData.length > 0) {
        setRoles(cachedData);
      }
      const freshData = await getRolesClient(id, true);
      setRoles(freshData);
    } catch {
      toast.error("Failed to load roles & features");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (server) fetchRoles(server);
  }, [server, fetchRoles]);

  useEffect(() => { fetchServers(); }, []);

  useEffect(() => {
    if (server) {
      getServersClient().then(list => {
        const s = list.find(x => x.ip === server || x.id === server);
        setServerInfo(s ?? null);
      });
      fetchRoles(server);
    }
  }, [server, fetchRoles]);

  const handleInstall = async (role: WindowsRole) => {
    if (!confirm(`Install ${role.displayName}? This may require a server restart.`)) return;
    const actionId = `install-${role.name}`;
    setPendingAction(actionId);
    try {
      const success = await installRoleClient(server, role.name, role.featureType);
      if (success) {
        toast.success(`${role.displayName} installed`, { description: "Refresh the list to confirm state." });
        fetchRoles(server);
      } else {
        toast.error(`Failed to install ${role.displayName}`, { description: "May require a restart or install sources." });
      }
    } catch {
      toast.error(`Install failed for ${role.displayName}`);
    } finally {
      setPendingAction(null);
    }
  };

  const handleUninstall = async (role: WindowsRole) => {
    if (!confirm(`Remove ${role.displayName}? Services depending on it may stop working.`)) return;
    const actionId = `uninstall-${role.name}`;
    setPendingAction(actionId);
    try {
      const success = await uninstallRoleClient(server, role.name, role.featureType);
      if (success) {
        toast.success(`${role.displayName} removed`, { description: "A restart may be required to complete removal." });
        fetchRoles(server);
      } else {
        toast.error(`Failed to remove ${role.displayName}`, { description: "May require a restart." });
      }
    } catch {
      toast.error(`Removal failed for ${role.displayName}`);
    } finally {
      setPendingAction(null);
    }
  };

  const handleSort = (col: keyof WindowsRole) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const isRole = (r: WindowsRole) => r.featureType === "Role" || r.featureType === "role";

  const counts = {
    all: roles.length,
    role: roles.filter(isRole).length,
    feature: roles.filter(r => !isRole(r)).length,
    installed: roles.filter(r => r.installState === "Installed").length,
  };

  const filtered = roles
    .filter(r => category === "all" || (category === "role" && isRole(r)) || (category === "feature" && !isRole(r)))
    .filter(r => r.displayName.toLowerCase().includes(q.toLowerCase()) || r.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      const aVal = String(a[sortCol]).toLowerCase();
      const bVal = String(b[sortCol]).toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

  const isServerOffline = serverInfo && serverInfo.status !== "online";

  if (theme === "horizon") {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6 font-sans">
        <HorizonHeader server={serverInfo} counts={counts} />
        <ServerSelector value={server} onChange={setServer} />
        <ControlBar q={q} setQ={setQ} category={category} setCategory={setCategory} counts={counts} onRefresh={handleRefresh} isLoading={isLoading} />
        {isServerOffline && <OfflineBanner status={serverInfo!.status} />}
        <RolesTable filtered={filtered} isLoading={isLoading} sortCol={sortCol} sortAsc={sortAsc} onSort={handleSort} onInstall={handleInstall} onUninstall={handleUninstall} pendingAction={pendingAction} hasQuery={q !== "" || category !== "all"} onClear={() => { setQ(""); setCategory("all"); }} />
      </div>
    );
  }

  return (
    <PageWrapper>
      <PageHeader eyebrow="Management" title="Roles & Features" />
      <ServerSelector value={server} onChange={setServer} />

      {serverInfo && (
        <div className="mono mt-3 flex items-center gap-2 text-[11px] text-[var(--text-sub)]">
          <ServerIcon size={12} /> {serverInfo.name} · {serverInfo.os} · <StatusBadge status={serverInfo.status} />
        </div>
      )}

      <ControlBar q={q} setQ={setQ} category={category} setCategory={setCategory} counts={counts} onRefresh={handleRefresh} isLoading={isLoading} />

      {isServerOffline && <OfflineBanner status={serverInfo!.status} />}

      <div className="mt-4 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] overflow-hidden">
        <RolesTable filtered={filtered} isLoading={isLoading} sortCol={sortCol} sortAsc={sortAsc} onSort={handleSort} onInstall={handleInstall} onUninstall={handleUninstall} pendingAction={pendingAction} hasQuery={q !== "" || category !== "all"} onClear={() => { setQ(""); setCategory("all"); }} />
      </div>
    </PageWrapper>
  );
}

function HorizonHeader({ server, counts }: { server: Server | null; counts: { all: number; role: number; feature: number; installed: number } }) {
  return (
    <div>
      <h2 className="text-3xl font-extrabold text-[var(--text)]">Roles & Features</h2>
      <p className="text-sm text-[var(--text-sub)] mt-1">
        {server ? `${server.name} · ${server.os}` : "Select a server"} · {counts.installed} installed of {counts.all}
      </p>
    </div>
  );
}

function ControlBar({
  q, setQ, category, setCategory, counts, onRefresh, isLoading,
}: {
  q: string; setQ: (v: string) => void; category: Category; setCategory: (c: Category) => void;
  counts: { all: number; role: number; feature: number }; onRefresh: () => void; isLoading: boolean;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] p-2">
      <div className="flex items-center gap-2">
        {([
          { v: "all", icon: Boxes, label: "All", n: counts.all },
          { v: "role", icon: ShieldCheck, label: "Server Roles", n: counts.role },
          { v: "feature", icon: Layers, label: "Optional Features", n: counts.feature },
        ] as const).map(opt => {
          const Icon = opt.icon;
          const active = category === opt.v;
          return (
            <button
              key={opt.v}
              onClick={() => setCategory(opt.v)}
              className={`mono flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] uppercase tracking-[0.15em] transition-colors ${active ? "bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]" : "text-[var(--text-sub)] border border-transparent hover:text-[var(--text)]"}`}
            >
              <Icon size={12} /> {opt.label} <span className="ml-1 rounded bg-[var(--bg-card)] px-1 text-[9px]">{opt.n}</span>
            </button>
          );
        })}
      </div>

      <div className="flex w-full max-w-sm items-center gap-2 rounded bg-[var(--bg-card)] px-2 py-1.5 border border-[var(--border-dim)]">
        <Search size={14} className="text-[var(--text-sub)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search roles or features..."
          className="w-full bg-transparent text-[12px] outline-none placeholder:text-[var(--text-dim)]"
        />
      </div>

      <button onClick={onRefresh} disabled={isLoading}
        className="flex items-center gap-2 rounded bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] border border-[var(--border-dim)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50">
        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
      </button>
    </div>
  );
}

function OfflineBanner({ status }: { status: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-md border border-[var(--warn)]/30 bg-[var(--warn)]/5 p-3 text-[12px] text-[var(--warn)]">
      <CircleAlert size={14} />
      Server is currently <span className="font-semibold capitalize">{status}</span> — role operations may fail or be queued.
    </div>
  );
}

function RolesTable({
  filtered, isLoading, sortCol, sortAsc, onSort, onInstall, onUninstall, pendingAction, hasQuery, onClear,
}: {
  filtered: WindowsRole[]; isLoading: boolean; sortCol: keyof WindowsRole; sortAsc: boolean;
  onSort: (c: keyof WindowsRole) => void; onInstall: (r: WindowsRole) => void; onUninstall: (r: WindowsRole) => void;
  pendingAction: string | null; hasQuery: boolean; onClear: () => void;
}) {
  if (isLoading) {
    return <div className="flex items-center justify-center gap-2 p-8 text-[13px] text-[var(--text-sub)]"><Loader2 size={14} className="animate-spin" /> Loading roles & features…</div>;
  }
  if (filtered.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center">
        <ShieldAlert size={32} className="text-[var(--text-dim)] mb-3" />
        <div className="text-[14px] font-medium text-[var(--text)]">{hasQuery ? "No roles match your filters" : "No roles or features found"}</div>
        <div className="text-[12px] text-[var(--text-sub)] mt-1 max-w-md">
          {hasQuery ? "Try clearing the search or category filter." : "Make sure the server is online and accessible."}
        </div>
        {hasQuery && <button onClick={onClear} className="mono mt-3 flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-[var(--amber)] hover:underline"><Undo2 size={12} /> Clear filters</button>}
      </div>
    );
  }

  const SortIcon = ({ col }: { col: keyof WindowsRole }) =>
    sortCol === col ? (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

  const isRole = (r: WindowsRole) => r.featureType === "Role" || r.featureType === "role";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[12px]">
        <thead className="border-b border-[var(--border-dim)] bg-[var(--bg-card)] text-[11px] uppercase tracking-wider text-[var(--text-sub)]">
          <tr>
            <th className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors select-none" onClick={() => onSort("displayName")}>
              <div className="flex items-center gap-1">Display Name <SortIcon col="displayName" /></div>
            </th>
            <th className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors select-none" onClick={() => onSort("name")}>
              <div className="flex items-center gap-1">System Name <SortIcon col="name" /></div>
            </th>
            <th className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors select-none" onClick={() => onSort("featureType")}>
              <div className="flex items-center gap-1">Type <SortIcon col="featureType" /></div>
            </th>
            <th className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors select-none" onClick={() => onSort("installState")}>
              <div className="flex items-center gap-1">Status <SortIcon col="installState" /></div>
            </th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-dim)]">
          {filtered.map((role) => {
            const installed = role.installState === "Installed";
            const pending = pendingAction === `install-${role.name}` || pendingAction === `uninstall-${role.name}`;
            return (
              <tr key={role.name} className="hover:bg-[var(--bg-card)] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    <ShieldCheck size={14} className={installed ? "text-[var(--amber)]" : "text-[var(--text-dim)]"} />
                    {role.displayName}
                  </div>
                </td>
                <td className="px-4 py-3 mono text-[11px] text-[var(--text-sub)]">{role.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded bg-[var(--bg-card)] px-2 py-0.5 text-[10px] uppercase border border-[var(--border-dim)]">
                    {isRole(role) ? <ShieldCheck size={10} /> : <Layers size={10} />}
                    {isRole(role) ? "Server Role" : "Optional Feature"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {installed ? (
                    <span className="inline-flex items-center gap-1 font-medium text-[var(--ok)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--ok)]" /> Installed
                    </span>
                  ) : (
                    <span className="text-[var(--text-sub)]">Available</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {pending ? (
                      <Loader2 size={14} className="animate-spin text-[var(--text-sub)]" />
                    ) : installed ? (
                      <button
                        onClick={() => onUninstall(role)}
                        disabled={pendingAction !== null}
                        className="flex items-center gap-1.5 rounded bg-[var(--crit)]/10 px-2 py-1 text-[11px] font-medium text-[var(--crit)] hover:bg-[var(--crit)]/20 disabled:opacity-50"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => onInstall(role)}
                        disabled={pendingAction !== null}
                        className="flex items-center gap-1.5 rounded bg-[var(--amber-low)] border border-[var(--amber)] px-2 py-1 text-[11px] font-medium text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black disabled:opacity-50"
                      >
                        <Download size={12} /> Install
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default RolesPage;
