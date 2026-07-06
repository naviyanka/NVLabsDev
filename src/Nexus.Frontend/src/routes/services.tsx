import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, Square, RotateCw } from "lucide-react";
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

  const loadServices = () => {
    getServicesClient(server).then((data) => {
      setServices(data);
      if (selected) {
        const updatedSelected = data.find(s => s.name === selected.name);
        if (updatedSelected) setSelected(updatedSelected);
      }
    });
  };

  useEffect(() => {
    loadServices();
  }, [server]);

  const handleAction = async (action: string) => {
    if (!selected) return;
    setLoading(true);
    await controlServiceClient(server, selected.name, action);
    // After action, refresh the list
    setTimeout(() => loadServices(), 500); 
    setTimeout(() => loadServices(), 2500); // Check again after it likely finished starting/stopping
    setLoading(false);
  };

  const filtered = services.filter((s) =>
    (statusFilter === "all" || s.status === statusFilter) &&
    (q === "" || s.displayName.toLowerCase().includes(q.toLowerCase()) || s.name.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <PageWrapper>
      <PageHeader eyebrow="Management" title="Services" subtitle={`${services.length} services on ${server.toUpperCase()}`} />
      <ServerSelector value={server} onChange={setServer} />
      <div className="grid grid-cols-[1fr_360px] gap-5">
        <div className="nx-card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-c)] p-3">
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search…" className="mono w-60 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[12px] focus:border-[var(--amber)] focus:outline-none" />
            <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="mono rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2 py-1.5 text-[11px] text-[var(--text)]">
              <option value="all">All status</option><option>Running</option><option>Stopped</option><option>Paused</option>
            </select>
          </div>
          <div className="max-h-[65vh] overflow-y-auto">
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-[var(--bg-card)]"><tr className="eyebrow border-b border-[var(--border-c)] text-left">
                <th className="px-3 py-2">Name</th><th>Display Name</th><th>Status</th><th>Startup</th><th>Log On As</th>
              </tr></thead>
              <tbody className="mono">
                {filtered.map((s) => (
                  <tr key={s.name} onClick={() => setSelected(s)} className={"cursor-pointer border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] " + (selected?.name === s.name ? "bg-[var(--amber-low)]" : "")}>
                    <td className="px-3 py-2 text-[var(--text)]">{s.name}</td>
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

        <aside className="nx-card h-fit p-5">
          {selected ? (
            <>
              <div className="eyebrow pb-1">Service Detail</div>
              <h3 className="display text-[16px] font-semibold">{selected.displayName}</h3>
              <div className="mono pt-1 text-[11px] text-[var(--text-sub)]">{selected.name}</div>
              <p className="pt-3 text-[12px] leading-relaxed text-[var(--text-sub)]">{selected.description}</p>

              <div className="my-4 flex gap-1.5">
                <ActionBtn icon={Play} label="Start" onClick={() => handleAction("start")} disabled={loading || selected.status === "Running"} />
                <ActionBtn icon={Square} label="Stop" onClick={() => handleAction("stop")} disabled={loading || selected.status === "Stopped"} />
                <ActionBtn icon={RotateCw} label="Restart" onClick={() => handleAction("restart")} disabled={loading || selected.status === "Stopped"} />
              </div>

              <div className="eyebrow pb-1">Depends on</div>
              <ul className="mono text-[11px] text-[var(--text-sub)]">
                <li>RPCSS</li><li>DcomLaunch</li>
              </ul>
              <div className="eyebrow pb-1 pt-3">Recovery</div>
              <ul className="mono text-[11px] text-[var(--text-sub)]">
                <li>1st failure: Restart service</li>
                <li>2nd failure: Restart service</li>
                <li>Subsequent: Take no action</li>
              </ul>
            </>
          ) : (
            <div className="py-12 text-center text-[12px] text-[var(--text-sub)]">Select a service to view details.</div>
          )}
        </aside>
      </div>
    </PageWrapper>
  );
}

function ActionBtn({ icon: Icon, label, onClick, disabled }: { icon: React.ComponentType<{ size?: number }>; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={"mono flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[var(--border-c)] px-2 py-1.5 text-[10px] uppercase tracking-[0.2em] " + (disabled ? "opacity-50 cursor-not-allowed text-[var(--text-sub)] bg-[var(--bg-surface)]" : "text-[var(--text-sub)] bg-[var(--bg-surface)] hover:border-[var(--amber)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)]")}>
      <Icon size={12} /> {label}
    </button>
  );
}
