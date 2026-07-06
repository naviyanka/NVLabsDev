import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDisksClient, getVolumesClient, type Disk, type Volume } from "@/api/client";

export const Route = createFileRoute("/storage")({
  head: () => ({ meta: [{ title: "Storage — NEXUS" }, { name: "description", content: "Disks, volumes, and storage health." }] }),
  component: StoragePage,
});

const PART_COLOR: Record<string, string> = {
  System: "var(--amber)", Data: "var(--teal)", Recovery: "var(--text-sub)", Unallocated: "var(--text-ghost)",
};

function StoragePage() {
  const [server, setServer] = useState("dc");
  const [disks, setDisks] = useState<Disk[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);

  useEffect(() => { 
    getDisksClient(server).then(setDisks); 
    getVolumesClient(server).then(setVolumes); 
  }, [server]);

  const totalRaw = disks.reduce((s, d) => s + d.sizeGB, 0);
  const totalUsed = volumes.reduce((s, v) => s + v.usedGB, 0);
  const totalSize = volumes.reduce((s, v) => s + v.sizeGB, 0);

  const formatSize = (gb: number) => {
    if (gb < 1000) return `${Math.round(gb)} GB`;
    return `${(gb / 1024).toFixed(1)} TB`;
  };

  return (
    <PageWrapper>
      <PageHeader eyebrow="Management" title="Storage" />
      <ServerSelector value={server} onChange={setServer} />

      <div className="grid grid-cols-4 gap-3 pb-6">
        <Stat label="Total raw" value={formatSize(totalRaw)} />
        <Stat label="Used" value={formatSize(totalUsed)} color="var(--amber)" />
        <Stat label="Free" value={formatSize(totalSize - totalUsed)} color="#10b981" />
        <Stat label="Disks · Volumes" value={`${disks.length} · ${volumes.length}`} />
      </div>

      <div className="nx-card mb-5 p-5">
        <div className="eyebrow pb-3">Physical Disks</div>
        <div className="space-y-4">
          {disks.map((d) => {
            const total = d.partitions.reduce((s, p) => s + p.sizeGB, 0);
            return (
              <div key={d.id}>
                <div className="mono flex items-baseline justify-between pb-1.5 text-[11px]">
                  <span><span className="text-[var(--amber)]">{d.id}</span> <span className="text-[var(--text-sub)]">· {d.model} · {d.bus}</span></span>
                  <span className="text-[var(--text-sub)]">{d.sizeGB} GB · <StatusBadge status={d.health === "Healthy" ? "Healthy" : "warning"} label={d.health} /></span>
                </div>
                <div className="h-6 w-full overflow-hidden rounded border border-[var(--border-c)] bg-[var(--border-dim)] relative">
                  {(() => {
                    const diskVolumes = volumes.filter(v => d.partitions.some(p => p.label === v.letter));
                    const diskUsedGB = diskVolumes.reduce((s, v) => s + v.usedGB, 0);
                    const pct = d.sizeGB > 0 ? (diskUsedGB / d.sizeGB) * 100 : 0;
                    return (
                      <>
                        <div className="h-full" style={{ width: `${pct}%`, background: pct > 85 ? "var(--crit)" : pct > 70 ? "var(--warn)" : "#10b981" }} />
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mix-blend-difference">
                          {diskUsedGB > 0 ? `${Math.round(pct)}% Used` : "0% Used"}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="nx-card overflow-hidden">
        <table className="w-full text-[12px]">
          <thead><tr className="eyebrow border-b border-[var(--border-c)] text-left">
            <th className="px-4 py-2.5">Letter</th><th>Label</th><th>FS</th><th>Size</th><th>Used</th><th>Free</th><th>Usage</th><th>Status</th><th>Disk</th>
          </tr></thead>
          <tbody className="mono">
            {volumes.map((v) => {
              const pct = (v.usedGB / v.sizeGB) * 100;
              return (
                <tr key={v.letter} className="border-b border-[var(--border-dim)]">
                  <td className="px-4 py-2 text-[var(--amber)]">{v.letter}:</td>
                  <td className="text-[var(--text)]">{v.label}</td>
                  <td className="text-[var(--text-sub)]">{v.fs}</td>
                  <td className="text-[var(--text-sub)]">{v.sizeGB} GB</td>
                  <td className="text-[var(--text-sub)]">{v.usedGB} GB</td>
                  <td className="text-[var(--teal)]">{Math.round(v.sizeGB - v.usedGB)} GB</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-24 rounded bg-[var(--border-dim)]"><div className="h-full rounded" style={{ width: `${pct}%`, background: pct > 85 ? "var(--crit)" : pct > 70 ? "var(--warn)" : "#10b981" }} /></div>
                      <span className="text-[var(--text-sub)]">{Math.round(pct)}%</span>
                    </div>
                  </td>
                  <td><StatusBadge status={v.status === "Healthy" ? "Healthy" : "warning"} label={v.status} /></td>
                  <td className="text-[var(--text-sub)]">{v.diskId}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}

function Stat({ label, value, color = "var(--text)" }: { label: string; value: string; color?: string }) {
  return (
    <div className="nx-card p-4">
      <div className="eyebrow pb-1">{label}</div>
      <div className="display text-[20px] font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
