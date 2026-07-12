import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDisksClient, getVolumesClient, type Disk, type Volume } from "@/api/client";
import { ChevronUp, ChevronDown, MoreHorizontal, FolderOpen } from "lucide-react";

export const Route = createFileRoute("/storage")({
  head: () => ({ meta: [{ title: "Storage — NEXUS" }, { name: "description", content: "Disks, volumes, and storage health." }] }),
  component: StoragePage,
});

const PART_COLOR: Record<string, string> = {
  System: "var(--teal)", Data: "var(--amber)", Recovery: "var(--text-sub)", Unallocated: "var(--text-ghost)",
};

function StoragePage() {
  const [server, setServer] = useState("dc");
  const [disks, setDisks] = useState<Disk[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [auto, setAuto] = useState(true);
  
  const [sortCol, setSortCol] = useState<keyof Volume>("letter");
  const [sortAsc, setSortAsc] = useState(true);
  const navigate = useNavigate();

  const loadData = () => {
    getDisksClient(server).then(setDisks); 
    getVolumesClient(server).then(setVolumes);
  };

  useEffect(() => { 
    let id: number | undefined;
    loadData();
    if (auto) id = window.setInterval(loadData, 5000);
    return () => { if (id) window.clearInterval(id); };
  }, [server, auto]);

  const handleSort = (col: keyof Volume) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const SortIcon = ({ col }: { col: keyof Volume }) => {
    if (sortCol !== col) return null;
    return sortAsc ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
  };

  const sortedVolumes = useMemo(() => {
    let res = [...volumes];
    res.sort((a, b) => {
      let valA = a[sortCol];
      let valB = b[sortCol];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      valA = (valA as number) || 0; valB = (valB as number) || 0;
      return sortAsc ? valA - valB : valB - valA;
    });
    return res;
  }, [volumes, sortCol, sortAsc]);

  const totalRaw = disks.reduce((s, d) => s + d.sizeGB, 0);
  const totalUsed = volumes.reduce((s, v) => s + v.usedGB, 0);
  const totalSize = volumes.reduce((s, v) => s + v.sizeGB, 0);

  const formatSize = (gb: number) => {
    if (gb < 1000) return `${Math.round(gb)} GB`;
    return `${(gb / 1024).toFixed(1)} TB`;
  };

  return (
    <PageWrapper>
      <PageHeader eyebrow="Management" title="Storage" subtitle={`${disks.length} disks, ${volumes.length} volumes on ${server.toUpperCase()}`} />
      <ServerSelector value={server} onChange={setServer} />

      <div className="grid grid-cols-4 gap-3 pb-6">
        <Stat label="Total raw" value={formatSize(totalRaw)} />
        <Stat label="Used" value={formatSize(totalUsed)} color="var(--amber)" />
        <Stat label="Free" value={formatSize(totalSize - totalUsed)} color="#10b981" />
        <Stat label="Disks · Volumes" value={`${disks.length} · ${volumes.length}`} />
      </div>

      <div className="nx-card mb-5 p-5">
        <div className="flex items-center justify-between pb-3">
          <div className="eyebrow">Physical Disks Map</div>
          <div className="flex items-center gap-4 text-[11px] mono text-[var(--text-sub)]">
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[var(--teal)]"></div> System</span>
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[var(--amber)]"></div> Data</span>
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[var(--text-sub)]"></div> Recovery</span>
          </div>
        </div>
        <div className="space-y-5">
          {disks.map((d) => {
            return (
              <div key={d.id}>
                <div className="mono flex items-baseline justify-between pb-1.5 text-[11px]">
                  <span><span className="text-[var(--text)] font-semibold">{d.id}</span> <span className="text-[var(--text-sub)]">· {d.model} · {d.bus}</span></span>
                  <span className="text-[var(--text-sub)]">{d.sizeGB} GB · <StatusBadge status={d.health === "Healthy" ? "Healthy" : "warning"} label={d.health} /></span>
                </div>
                <div className="h-8 w-full overflow-hidden rounded border border-[var(--border-dim)] bg-[var(--bg-surface)] relative flex group">
                  {d.partitions.map((p, i) => {
                    const pPct = (p.sizeGB / d.sizeGB) * 100;
                    return (
                      <div 
                        key={`${p.label}-${i}`}
                        style={{ width: `${pPct}%`, backgroundColor: PART_COLOR[p.type] || PART_COLOR.Unallocated }}
                        className="h-full border-r border-[var(--bg-card)] flex items-center justify-center text-[10px] text-black font-semibold truncate px-1 transition-opacity hover:opacity-80 cursor-default"
                        title={`${p.label} (${p.type}) - ${p.sizeGB} GB`}
                      >
                        {pPct > 5 ? p.label : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="nx-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-c)] p-3">
          <div className="eyebrow px-2">Mounted Volumes</div>
          <label className="mono flex items-center gap-1.5 text-[11px] text-[var(--text-sub)] cursor-pointer hover:text-white transition-colors">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-[var(--amber)]" />
            Auto-refresh 5s
          </label>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-[12px] select-none">
            <thead>
              <tr className="eyebrow border-b border-[var(--border-c)] text-left text-[var(--text-sub)]">
                <th className="px-4 py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('letter')} title="Sort by Letter">Letter <SortIcon col="letter"/></th>
                <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('label')} title="Sort by Label">Label <SortIcon col="label"/></th>
                <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('fs')} title="Sort by File System">FS <SortIcon col="fs"/></th>
                <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('sizeGB')} title="Sort by Total Size">Size <SortIcon col="sizeGB"/></th>
                <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('usedGB')} title="Sort by Used Space">Used <SortIcon col="usedGB"/></th>
                <th className="py-2.5">Free</th>
                <th className="py-2.5">Usage</th>
                <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('status')} title="Sort by Status">Status <SortIcon col="status"/></th>
                <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('diskId')} title="Sort by Disk">Disk <SortIcon col="diskId"/></th>
                <th className="py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="mono">
              {sortedVolumes.map((v) => {
                const pct = v.sizeGB > 0 ? (v.usedGB / v.sizeGB) * 100 : 0;
                return (
                  <tr key={v.letter} className="border-b border-[var(--border-dim)] transition-colors hover:bg-[var(--amber-low)]/10">
                    <td className="px-4 py-3 text-[var(--amber)] font-medium border-l-2 border-transparent transition-colors hover:border-[var(--amber)]">{v.letter}:</td>
                    <td className="text-[var(--text)]">{v.label}</td>
                    <td className="text-[var(--text-sub)]">{v.fs}</td>
                    <td className="text-[var(--text-sub)]">{v.sizeGB} GB</td>
                    <td className="text-[var(--text-sub)]">{v.usedGB} GB</td>
                    <td className="text-[var(--teal)]">{Math.round(v.sizeGB - v.usedGB)} GB</td>
                    <td>
                      <div className="flex items-center gap-2 pr-4">
                        <div className="h-1.5 w-24 rounded bg-[var(--border-dim)] overflow-hidden">
                          <div className="h-full rounded" style={{ width: `${pct}%`, background: pct > 85 ? "var(--crit)" : pct > 70 ? "var(--warn)" : "#10b981" }} />
                        </div>
                        <span className="text-[var(--text-sub)] text-[10px] w-8 text-right">{Math.round(pct)}%</span>
                      </div>
                    </td>
                    <td><StatusBadge status={v.status === "Healthy" ? "Healthy" : "warning"} label={v.status} /></td>
                    <td className="text-[var(--text-sub)]">{v.diskId}</td>
                    <td className="pr-3 text-right">
                      <div className="relative group inline-block" onClick={e => e.stopPropagation()}>
                        <button className="rounded p-1 text-[var(--text-sub)] hover:bg-[var(--border-c)] hover:text-white transition-colors" title="More Actions">
                          <MoreHorizontal size={14} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 hidden w-36 flex-col overflow-hidden rounded border border-[var(--border-c)] bg-[var(--bg-card)] shadow-xl group-hover:flex z-50">
                          <button onClick={() => navigate({ to: "/files", search: { path: `${v.letter}:\\` } })} className="flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)]">
                            <FolderOpen size={14} /> Browse Files
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}

function Stat({ label, value, color = "var(--text)" }: { label: string; value: string; color?: string }) {
  return (
    <div className="nx-card p-4 transition-colors hover:border-[var(--border-c)]">
      <div className="eyebrow pb-1">{label}</div>
      <div className="display text-[22px] font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
