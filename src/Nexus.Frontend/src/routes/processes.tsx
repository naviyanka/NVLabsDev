import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Square, MoreHorizontal, Info, X, ChevronUp, ChevronDown } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getLiveProcessesClient, killProcessClient, getPerformanceHistoryClient, getProcessDetailsClient, type Process } from "@/api/client";

export const Route = createFileRoute("/processes")({
  head: () => ({ meta: [{ title: "Processes — NEXUS" }, { name: "description", content: "Inspect, end, and prioritize running processes." }] }),
  component: ProcessesPage,
});

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function ProcessesPage() {
  const [server, setServer] = useState("dc");
  const [procs, setProcs] = useState<Process[]>([]);
  const [sysCpu, setSysCpu] = useState<number>(0);
  const [sysMem, setSysMem] = useState<number>(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [auto, setAuto] = useState(true);

  const [sortCol, setSortCol] = useState<keyof Process>("cpu");
  const [sortAsc, setSortAsc] = useState(false);

  // Modals
  const [killTarget, setKillTarget] = useState<number[] | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Process | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  async function load() {
    if (!server) return;
    const p = await getLiveProcessesClient(server);
    setProcs(p);
    
    const hist = await getPerformanceHistoryClient(server);
    if (hist && hist.length > 0) {
      const latest = hist[hist.length - 1];
      setSysCpu(latest.cpu);
      setSysMem(latest.mem);
    } else {
      // Fallback
      let totalCpu = 0;
      let totalMemPct = 0;
      p.forEach(x => { totalCpu += x.cpu; totalMemPct += x.memPct; });
      setSysCpu(Math.min(100, totalCpu));
      setSysMem(Math.min(100, totalMemPct));
    }
  }

  useEffect(() => {
    let id: number | undefined;
    load();
    if (auto) id = window.setInterval(load, 5000);
    return () => { if (id) window.clearInterval(id); };
  }, [server, auto]);

  async function handleEndTask() {
    if (!killTarget) return;
    for (const pid of killTarget) {
      await killProcessClient(server, pid);
      setSel(prev => {
        const n = new Set(prev);
        n.delete(pid);
        return n;
      });
    }
    setKillTarget(null);
    load();
  }

  async function fetchDetails(pid: number) {
    setIsDetailsLoading(true);
    const existing = procs.find(p => p.pid === pid);
    if (existing) {
      setDetailsTarget({ ...existing });
      const det = await getProcessDetailsClient(server, pid);
      if (det) {
        setDetailsTarget({ ...existing, ...det });
      }
    }
    setIsDetailsLoading(false);
  }

  const handleSort = (col: keyof Process) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  };

  const SortIcon = ({ col }: { col: keyof Process }) => {
    if (sortCol !== col) return null;
    return sortAsc ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
  };

  const filtered = useMemo(() => {
    let res = procs.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || String(p.pid).includes(q));
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
  }, [procs, q, sortCol, sortAsc]);

  return (
    <PageWrapper>
      <PageHeader eyebrow="Management" title="Processes" subtitle="Live process inventory" />
      <ServerSelector value={server} onChange={setServer} />
      <div className="nx-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-c)] p-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name / PID…" className="mono w-72 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[12px] placeholder:text-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none transition-colors" />
          <div className="flex items-center gap-2">
            <label className="mono flex items-center gap-1.5 text-[11px] text-[var(--text-sub)] cursor-pointer hover:text-white transition-colors">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-[var(--amber)]" />
              Auto-refresh 5s
            </label>
            <button disabled={sel.size === 0} onClick={() => setKillTarget(Array.from(sel))} title="End selected tasks" className="mono flex items-center gap-1.5 rounded-md border border-[var(--crit)]/40 bg-[var(--crit)]/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--crit)] transition-colors hover:bg-[var(--crit)]/20 disabled:opacity-30">
              <Square size={12} /> End Task
            </button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-[12px] select-none">
            <thead className="sticky top-0 bg-[var(--bg-card)]/95 backdrop-blur-sm shadow-[0_1px_0_var(--border-c)] z-10">
              <tr className="eyebrow text-left text-[var(--text-sub)]">
                <th className="w-8 px-3 py-2"></th>
                <th className="py-2 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('name')} title="Sort by Name">Name <SortIcon col="name"/></th>
                <th className="py-2 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('pid')} title="Sort by PID">PID <SortIcon col="pid"/></th>
                <th className="py-2 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('cpu')} title="Sort by CPU">CPU% <SortIcon col="cpu"/></th>
                <th className="py-2 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('memMB')} title="Sort by Memory">Memory <SortIcon col="memMB"/></th>
                <th className="py-2 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('memPct')} title="Sort by Memory %">Mem% <SortIcon col="memPct"/></th>
                <th className="py-2 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('handles')} title="Sort by Handles">Handles <SortIcon col="handles"/></th>
                <th className="py-2 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('threads')} title="Sort by Threads">Threads <SortIcon col="threads"/></th>
                <th className="py-2">User</th>
                <th className="py-2">Status</th>
                <th className="py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="mono">
              {filtered.map((p) => {
                const isSel = sel.has(p.pid);
                const hot = p.cpu > 50;
                return (
                  <tr 
                    key={p.pid} 
                    onClick={() => { const n = new Set(sel); isSel ? n.delete(p.pid) : n.add(p.pid); setSel(n); }}
                    title={`Click to select ${p.name}`}
                    className={`cursor-pointer border-b border-[var(--border-dim)] transition-colors ${isSel ? "bg-[var(--amber-low)]/40 hover:bg-[var(--amber-low)]/50" : hot ? "bg-[var(--warn)]/[0.04] hover:bg-[var(--warn)]/[0.08]" : "hover:bg-[var(--amber-low)]/10"}`}>
                    <td className={"px-3 py-1.5 transition-colors " + (isSel ? "border-l-2 border-[var(--amber)]" : "border-l-2 border-transparent")}>
                      <input type="checkbox" checked={isSel} onChange={() => {}} className="accent-[var(--amber)] pointer-events-none" />
                    </td>
                    <td className="text-[var(--text)]">{p.name}</td>
                    <td className="text-[var(--text-sub)]">{p.pid}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={hot ? "text-[var(--warn)]" : "text-[var(--amber)]"}>{p.cpu.toFixed(1)}</span>
                        <div className="h-1 w-12 rounded bg-[var(--border-dim)]"><div className="h-full rounded bg-[var(--amber)]" style={{ width: `${Math.min(100, p.cpu)}%` }} /></div>
                      </div>
                    </td>
                    <td className="text-[var(--text-sub)]">{formatBytes(p.memMB * 1048576)}</td>
                    <td className="text-[var(--text-sub)]">{p.memPct.toFixed(1)}%</td>
                    <td className="text-[var(--text-sub)]">{p.handles}</td>
                    <td className="text-[var(--text-sub)]">{p.threads}</td>
                    <td className="text-[var(--text-sub)]">{p.user}</td>
                    <td className="text-[var(--teal)]">{p.status}</td>
                    <td className="pr-3 text-right">
                      <div className="relative group inline-block" onClick={e => e.stopPropagation()}>
                        <button className="rounded p-1 text-[var(--text-sub)] hover:bg-[var(--border-c)] hover:text-white transition-colors" title="More Actions">
                          <MoreHorizontal size={14} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 hidden w-36 flex-col overflow-hidden rounded border border-[var(--border-c)] bg-[var(--bg-card)] shadow-xl group-hover:flex z-50">
                          <button onClick={() => fetchDetails(p.pid)} className="flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)]"><Info size={14} /> Details</button>
                          <div className="my-1 h-[1px] bg-[var(--border-dim)]" />
                          <button onClick={() => setKillTarget([p.pid])} className="flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--crit)] transition-colors hover:bg-[var(--crit)]/20"><Square size={14} /> End Task</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mono flex items-center justify-between border-t border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-2 text-[11px] text-[var(--text-sub)]">
          <span>Total Processes: <span className="text-[var(--text)]">{procs.length}</span></span>
          <span>System CPU: <span className="text-[var(--amber)]">{sysCpu.toFixed(1)}%</span></span>
          <span>System Memory: <span className="text-[var(--teal)]">{sysMem.toFixed(1)}%</span></span>
        </div>
      </div>

      {/* Kill Confirmation Modal */}
      {killTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--crit)]/30 bg-[var(--crit)]/10 px-4 py-3">
              <div className="eyebrow text-[var(--crit)] flex items-center gap-2">Confirm Task Termination</div>
              <button onClick={() => setKillTarget(null)} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-[var(--text)] mb-3">
                Are you sure you want to end {killTarget.length} selected process(es)?
              </p>
              <p className="text-[12px] text-[var(--text-sub)] mb-5">
                WARNING: Terminating a process can cause undesired results including loss of data and system instability. The process will not be given the chance to save its state or data before it is terminated.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setKillTarget(null)} className="rounded px-4 py-1.5 text-[12px] font-medium text-[var(--text-sub)] transition-colors hover:text-white">Cancel</button>
                <button onClick={handleEndTask} className="rounded bg-[var(--crit)] px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--crit-hover)]">End Process</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-3">
              <div className="eyebrow text-[var(--text)] flex items-center gap-2">Process Details</div>
              <button onClick={() => setDetailsTarget(null)} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-5 mono text-[12px]">
              <div className="grid grid-cols-[120px_1fr] gap-3 mb-4 items-baseline">
                <span className="text-[var(--text-sub)]">Name</span>
                <span className="text-[var(--amber)] text-[14px]">{detailsTarget.name}</span>

                <span className="text-[var(--text-sub)]">Process ID</span>
                <span className="text-[var(--text)]">{detailsTarget.pid}</span>

                <span className="text-[var(--text-sub)]">Status</span>
                <span className="text-[var(--teal)]">{detailsTarget.status}</span>

                <span className="text-[var(--text-sub)]">Memory usage</span>
                <span className="text-[var(--text)]">{formatBytes(detailsTarget.memMB * 1048576)} ({detailsTarget.memPct.toFixed(1)}%)</span>

                <span className="text-[var(--text-sub)]">Path</span>
                <span className="text-[var(--text)] bg-[var(--bg-surface)] p-2 rounded break-all border border-[var(--border-c)]">
                  {isDetailsLoading ? "Loading..." : detailsTarget.executablePath || "N/A"}
                </span>

                <span className="text-[var(--text-sub)]">Command Line</span>
                <span className="text-[var(--text)] bg-[var(--bg-surface)] p-2 rounded break-all border border-[var(--border-c)] max-h-32 overflow-y-auto">
                  {isDetailsLoading ? "Loading..." : detailsTarget.commandLine || "N/A"}
                </span>
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t border-[var(--border-dim)] pt-4">
                <button onClick={() => setDetailsTarget(null)} className="rounded px-4 py-1.5 text-[12px] font-medium text-[var(--text-sub)] hover:text-white transition-colors border border-[var(--border-c)]">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </PageWrapper>
  );
}
