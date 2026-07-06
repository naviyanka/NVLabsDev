import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeftRight } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getReplicaPartnerships, type ReplicaPartnership } from "@/api/mock";

export const Route = createFileRoute("/storage-replica")({
  head: () => ({ meta: [{ title: "Storage Replica — NEXUS" }, { name: "description", content: "Block-level volume replication." }] }),
  component: SRPage,
});

function SRPage() {
  const [list, setList] = useState<ReplicaPartnership[]>([]);
  useEffect(() => { getReplicaPartnerships().then(setList); }, []);

  return (
    <PageWrapper>
      <PageHeader eyebrow="Infrastructure" title="Storage Replica" subtitle="Synchronous & asynchronous volume replication" />
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
              <button className="mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:border-[var(--amber)] hover:text-[var(--amber)]"><ArrowLeftRight size={11} />Swap Direction</button>
              <button className="mono rounded-md border border-[var(--crit)]/40 bg-[var(--crit)]/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--crit)]">Failover</button>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
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
