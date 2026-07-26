import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getReplicaPartnershipsClient as getReplicaPartnerships, swapReplicaDirectionClient, failoverReplicaClient, createReplicaPartnershipClient, type ReplicaPartnership } from "@/api/client";
import { ArrowRight, ArrowLeftRight, Plus, X, Database } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/storage-replica")({
  head: () => ({ meta: [{ title: "Storage Replica — NEXUS" }, { name: "description", content: "Block-level volume replication." }] }),
  component: SRPage,
});

function SRPage() {
  const [list, setList] = useState<ReplicaPartnership[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadPartnerships = () => { getReplicaPartnerships("dc01").then(setList); };
  useEffect(() => { loadPartnerships(); }, []);

  const handleSwap = async (id: string, source: string, dest: string) => {
    if (!confirm(`Swap replication direction between ${source} and ${dest}?`)) return;
    toast.info("Swapping replication direction...");
    const ok = await swapReplicaDirectionClient(source, id);
    if (ok) { toast.success("Replication direction swapped"); loadPartnerships(); }
    else toast.error("Failed to swap replication direction");
  };

  const handleFailover = async (id: string, source: string) => {
    if (!confirm(`Initiate failover for replica partnership ${id}?`)) return;
    toast.info("Initiating failover...");
    const ok = await failoverReplicaClient(source, id);
    if (ok) { toast.success("Failover executed successfully"); loadPartnerships(); }
    else toast.error("Failed to execute failover");
  };

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-4">
        <PageHeader eyebrow="Infrastructure" title="Storage Replica" subtitle="Synchronous & asynchronous volume replication" />
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--amber)] text-black px-4 py-2 text-sm font-semibold hover:bg-[var(--amber-hover)] transition-colors shadow-sm"
        >
          <Plus size={16} /> New Partnership
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {list.map((p) => (
          <div key={p.id} className="nx-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="mono text-[12px]">
                  <div className="text-[var(--amber)]">{p.sourceServer}</div>
                  <div className="text-[var(--text-sub)]">{p.sourceVol}</div>
                </div>
                <ArrowRight className="text-[var(--text-sub)]" size={16} />
                <div className="mono text-[12px]">
                  <div className="text-[var(--teal)]">{p.destServer}</div>
                  <div className="text-[var(--text-sub)]">{p.destVol}</div>
                </div>
              </div>
              <StatusBadge status={p.status}>{p.status}</StatusBadge>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4">
              <Cell label="Mode" value={p.mode} />
              <Cell label="Last Sync" value={new Date(p.lastSync).toLocaleString()} />
              <Cell label="Synced" value={`${(p.bytes / 1_000_000_000).toFixed(2)} GB`} color="var(--teal)" />
              <Cell label="Progress" value={`${p.progress}%`} color="var(--amber)" />
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded bg-[var(--border-dim)]">
              <div className="h-full" style={{ width: `${p.progress}%`, background: p.status === "Error" ? "var(--crit)" : "var(--teal)", boxShadow: "0 0 7px var(--teal)" }} />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => handleSwap(p.id, p.sourceServer, p.destServer)} className="mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:border-[var(--amber)] hover:text-[var(--amber)]"><ArrowLeftRight size={11} />Swap Direction</button>
              <button onClick={() => handleFailover(p.id, p.sourceServer)} className="mono rounded-md border border-[var(--crit)]/40 bg-[var(--crit)]/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--crit)] hover:bg-[var(--crit)] hover:text-black transition-colors">Failover</button>
            </div>
          </div>
        ))}
      </div>

      {isCreateOpen && (
        <CreatePartnershipModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false);
            loadPartnerships();
          }}
        />
      )}
    </PageWrapper>
  );
}

function CreatePartnershipModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [sourceServer, setSourceServer] = useState("DC01");
  const [destServer, setDestServer] = useState("FS01");
  const [sourceVol, setSourceVol] = useState("E:");
  const [destVol, setDestVol] = useState("E:");
  const [mode, setMode] = useState("Synchronous");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await createReplicaPartnershipClient(sourceServer, { destServer, sourceVol, destVol, mode });
      if (ok) {
        toast.success(`Storage Replica partnership created between ${sourceServer} and ${destServer}`);
        onCreated();
      } else {
        toast.error("Failed to create replica partnership");
      }
    } catch (e) {
      toast.error("Partnership creation error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-[var(--amber)]" />
            <h3 className="text-lg font-bold text-[var(--text)]">Create Storage Replica Partnership</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Source Server</label>
              <input
                required
                value={sourceServer}
                onChange={(e) => setSourceServer(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Source Volume</label>
              <input
                required
                value={sourceVol}
                onChange={(e) => setSourceVol(e.target.value)}
                placeholder="e.g. E:"
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Destination Server</label>
              <input
                required
                value={destServer}
                onChange={(e) => setDestServer(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Destination Volume</label>
              <input
                required
                value={destVol}
                onChange={(e) => setDestVol(e.target.value)}
                placeholder="e.g. E:"
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Replication Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            >
              <option value="Synchronous">Synchronous (Zero RPO - High LAN speed)</option>
              <option value="Asynchronous">Asynchronous (WAN / High latency link)</option>
            </select>
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Creating..." : "Create Partnership"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Cell({ label, value, color = "var(--text)" }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="eyebrow pb-0.5">{label}</div>
      <div className="mono text-[12px]" style={{ color }}>{value}</div>
    </div>
  );
}
