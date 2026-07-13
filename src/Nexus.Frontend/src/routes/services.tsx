import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Play, Square, RotateCw, ChevronUp, ChevronDown, X } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getServicesClient, controlServiceClient, type Service } from "@/api/client";

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "Services — NEXUS" }, { name: "description", content: "Manage Windows services across your fleet." }] }),
  component: ServicesPage,
});

function ServicesPage() {
  const [server, setServer] = useState("nexus01");
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<Service | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(true);
  
  const [sortCol, setSortCol] = useState<keyof Service>("displayName");
  const [sortAsc, setSortAsc] = useState(true);

  // Modals
  const [actionTarget, setActionTarget] = useState<{ action: string, service: Service } | null>(null);

  const loadServices = () => {
    getServicesClient(server)
      .then((data) => {
        setServices(data);
        if (selected) {
          const updatedSelected = data.find(s => s.name === selected.name);
          if (updatedSelected) setSelected(updatedSelected);
        }
      })
      .catch(err => {
        console.error("Failed to load services", err);
      });
  };

  useEffect(() => {
    let id: number | undefined;
    loadServices();
    if (auto) id = window.setInterval(loadServices, 5000);
    return () => { if (id) window.clearInterval(id); };
  }, [server, auto]);

  const handleActionConfirm = async () => {
    if (!actionTarget) return;
    const { action, service } = actionTarget;
    setLoading(true);
    setActionTarget(null);
    try {
      await controlServiceClient(server, service.name, action);
      setTimeout(() => loadServices(), 500); 
      setTimeout(() => loadServices(), 2500);
    } catch (err) {
      console.error("Failed to control service", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (col: keyof Service) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const SortIcon = ({ col }: { col: keyof Service }) => {
    if (sortCol !== col) return null;
    return sortAsc ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
  };

  const filtered = useMemo(() => {
    let res = services.filter((s) =>
      (statusFilter === "all" || s.status === statusFilter) &&
      (q === "" || s.displayName.toLowerCase().includes(q.toLowerCase()) || s.name.toLowerCase().includes(q.toLowerCase()))
    );
    res.sort((a, b) => {
      let valA = a[sortCol];
      let valB = b[sortCol];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });
    return res;
  }, [services, q, statusFilter, sortCol, sortAsc]);

  return (
    <PageWrapper>
      <PageHeader eyebrow="Management" title="Services" subtitle={`${services.length} services on ${server.toUpperCase()}`} />
      <ServerSelector value={server} onChange={setServer} />
      <div className="grid grid-cols-[1fr_360px] gap-5">
        <div className="nx-card overflow-hidden flex flex-col h-[calc(100vh-200px)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-c)] p-3">
            <div className="flex gap-2">
              <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search by name…" className="mono w-60 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[12px] placeholder:text-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none transition-colors" />
              <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="mono rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2 py-1.5 text-[11px] text-[var(--text)] outline-none transition-colors focus:border-[var(--amber)]">
                <option value="all">All status</option><option>Running</option><option>Stopped</option><option>Paused</option>
              </select>
            </div>
            <label className="mono flex items-center gap-1.5 text-[11px] text-[var(--text-sub)] cursor-pointer hover:text-white transition-colors">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-[var(--amber)]" />
              Auto-refresh 5s
            </label>
          </div>
          <div className="flex-1 overflow-y-auto outline-none" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
            <table className="w-full text-[12px] select-none">
              <thead className="sticky top-0 bg-[var(--bg-card)]/95 backdrop-blur-sm shadow-[0_1px_0_var(--border-c)] z-10">
                <tr className="eyebrow text-left text-[var(--text-sub)]">
                  <th className="px-4 py-2 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('name')} title="Sort by Name">Name <SortIcon col="name"/></th>
                  <th className="py-2 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('displayName')} title="Sort by Display Name">Display Name <SortIcon col="displayName"/></th>
                  <th className="py-2 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('status')} title="Sort by Status">Status <SortIcon col="status"/></th>
                  <th className="py-2 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('startupType')} title="Sort by Startup">Startup <SortIcon col="startupType"/></th>
                  <th className="py-2 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('logOnAs')} title="Sort by Log On As">Log On As <SortIcon col="logOnAs"/></th>
                </tr>
              </thead>
              <tbody className="mono">
                {filtered.map((s) => (
                  <tr 
                    key={s.name} 
                    onClick={() => setSelected(s)} 
                    title={`Click to view details for ${s.name}`}
                    className={"cursor-pointer border-b border-[var(--border-dim)] transition-colors " + (selected?.name === s.name ? "bg-[var(--amber-low)]/40 hover:bg-[var(--amber-low)]/50" : "hover:bg-[var(--amber-low)]/10")}>
                    <td className={"px-4 py-2 text-[var(--text)] transition-colors " + (selected?.name === s.name ? "border-l-2 border-[var(--amber)] font-medium text-[var(--amber)]" : "border-l-2 border-transparent")}>{s.name}</td>
                    <td className="text-[var(--text-sub)]">{s.displayName}</td>
                    <td><StatusBadge status={s.status.toLowerCase() === 'running' ? 'online' : s.status.toLowerCase() === 'stopped' ? 'offline' : 'warning'} label={s.status} /></td>
                    <td className="text-[var(--text-sub)]">{s.startupType}</td>
                    <td className="text-[var(--text-sub)]">{s.logOnAs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="nx-card h-[calc(100vh-200px)] flex flex-col p-5 overflow-y-auto">
          {selected ? (
            <>
              <div className="eyebrow pb-1">Service Detail</div>
              <h3 className="display text-[16px] font-semibold">{selected.displayName}</h3>
              <div className="mono pt-1 text-[11px] text-[var(--text-sub)]">{selected.name}</div>
              <p className="pt-3 text-[12px] leading-relaxed text-[var(--text-sub)]">{selected.description || "No description provided."}</p>

              <div className="my-5 flex gap-1.5">
                <ActionBtn 
                  icon={Play} 
                  label="Start" 
                  title="Start service"
                  onClick={() => setActionTarget({ action: "start", service: selected })} 
                  disabled={loading || selected.status === "Running"} 
                />
                <ActionBtn 
                  icon={Square} 
                  label="Stop" 
                  title={selected.acceptStop ? "Stop service" : "Service cannot be stopped"}
                  onClick={() => setActionTarget({ action: "stop", service: selected })} 
                  disabled={loading || selected.status === "Stopped" || selected.acceptStop === false} 
                />
                <ActionBtn 
                  icon={RotateCw} 
                  label="Restart" 
                  title={selected.acceptStop ? "Restart service" : "Service cannot be restarted"}
                  onClick={() => setActionTarget({ action: "restart", service: selected })} 
                  disabled={loading || selected.status === "Stopped" || selected.acceptStop === false} 
                />
              </div>

              <div className="eyebrow pb-1">Executable Path</div>
              <div className="mono text-[11px] text-[var(--text)] bg-[var(--bg-surface)] p-2 rounded border border-[var(--border-dim)] break-all max-h-24 overflow-y-auto mb-4">
                {selected.pathName || "Unknown"}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="eyebrow pb-1">Process ID</div>
                  <div className="mono text-[13px] text-[var(--amber)]">{selected.processId || "None"}</div>
                </div>
                <div>
                  <div className="eyebrow pb-1">Capabilities</div>
                  <ul className="mono text-[11px] text-[var(--text-sub)] space-y-1">
                    <li>Can Stop: <span className={selected.acceptStop ? "text-[var(--teal)]" : "text-[var(--red)]"}>{selected.acceptStop ? "Yes" : "No"}</span></li>
                    <li>Can Pause: <span className={selected.acceptPause ? "text-[var(--teal)]" : "text-[var(--red)]"}>{selected.acceptPause ? "Yes" : "No"}</span></li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-[12px] text-[var(--text-sub)]">Select a service to view details.</div>
          )}
        </aside>
      </div>

      {/* Confirmation Modal */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className={`flex items-center justify-between border-b px-4 py-3 ${actionTarget.action === 'start' ? 'border-[var(--teal)]/30 bg-[var(--teal)]/10' : 'border-[var(--crit)]/30 bg-[var(--crit)]/10'}`}>
              <div className={`eyebrow flex items-center gap-2 ${actionTarget.action === 'start' ? 'text-[var(--teal)]' : 'text-[var(--crit)]'}`}>
                Confirm Service {actionTarget.action}
              </div>
              <button onClick={() => setActionTarget(null)} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-[var(--text)] mb-3">
                Are you sure you want to {actionTarget.action} the service <strong>{actionTarget.service.displayName}</strong>?
              </p>
              {actionTarget.action !== 'start' && (
                <p className="text-[12px] text-[var(--text-sub)] mb-5">
                  WARNING: Stopping or restarting a critical system service may cause other services to fail or the system to become unstable.
                </p>
              )}
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setActionTarget(null)} className="rounded px-4 py-1.5 text-[12px] font-medium text-[var(--text-sub)] transition-colors hover:text-white border border-transparent">Cancel</button>
                <button onClick={handleActionConfirm} className={`rounded px-4 py-1.5 text-[12px] font-semibold text-black transition-colors ${actionTarget.action === 'start' ? 'bg-[var(--teal)] hover:bg-[var(--teal-hover)]' : 'bg-[var(--crit)] text-white hover:bg-[var(--crit-hover)]'}`}>
                  Confirm {actionTarget.action}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </PageWrapper>
  );
}

function ActionBtn({ icon: Icon, label, title, onClick, disabled }: { icon: React.ComponentType<{ size?: number }>; label: string; title?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      title={title}
      className={"mono flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors " + (disabled ? "opacity-50 cursor-not-allowed text-[var(--text-sub)] bg-[var(--bg-surface)] border-[var(--border-c)]" : "border-[var(--border-c)] text-[var(--text-sub)] bg-[var(--bg-surface)] hover:border-[var(--amber)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)]")}>
      <Icon size={12} /> {label}
    </button>
  );
}
