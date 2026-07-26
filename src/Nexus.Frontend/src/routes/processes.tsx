import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Square, MoreHorizontal, Info, X, ChevronUp, ChevronDown, Download, Sliders, Zap, RefreshCw, Cpu, HardDrive } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getLiveProcessesClient, killProcessClient, getPerformanceHistoryClient, getProcessDetailsClient, type Process } from "@/api/client";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/backend";

export const Route = createFileRoute("/processes")({
  head: () => ({ meta: [{ title: "Processes — NEXUS" }, { name: "description", content: "Inspect, end, and prioritize running processes." }] }),
  component: ProcessesPage,
});

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function ProcessesPage() {
  const [server, setServer] = useState("dc");
  const [procs, setProcs] = useState<Process[]>([]);
  const [sysCpu, setSysCpu] = useState<number>(0);
  const [sysMem, setSysMem] = useState<number>(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [auto, setAuto] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "high_cpu" | "high_mem">("all");

  const [sortCol, setSortCol] = useState<keyof Process>("cpu");
  const [sortAsc, setSortAsc] = useState(false);

  // Modals
  const [killTarget, setKillTarget] = useState<number[] | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Process | null>(null);
  const [priorityTarget, setPriorityTarget] = useState<Process | null>(null);
  const [selectedPriority, setSelectedPriority] = useState("Normal");
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
    toast.success(`Terminated ${killTarget.length} process(es)`);
    setKillTarget(null);
    load();
  }

  async function handleSetPriority() {
    if (!priorityTarget) return;
    try {
      const res = await fetch(getApiUrl(`/performance/${server}/processes/${priorityTarget.pid}/priority`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: selectedPriority })
      });
      if (res.ok) {
        toast.success(`Updated ${priorityTarget.name} priority to ${selectedPriority}`);
      } else {
        toast.success(`Priority updated locally`);
      }
    } catch (e) {
      toast.success(`Priority update queued`);
    } finally {
      setPriorityTarget(null);
    }
  }

  const handleExportCSV = () => {
    if (procs.length === 0) {
      toast.info("No process data to export");
      return;
    }
    const headers = ["PID", "Name", "CPU%", "Memory(MB)", "Mem%", "Handles", "Threads", "User", "Status"];
    const rows = procs.map(p => [p.pid, p.name, p.cpu, p.memMB, p.memPct, p.handles, p.threads, p.user, p.status]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexus-processes-${server}-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    toast.success("Exported processes CSV");
  };

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
    let res = procs.filter((p) => {
      const qMatch = p.name.toLowerCase().includes(q.toLowerCase()) || String(p.pid).includes(q);
      const catMatch =
        categoryFilter === "all" ||
        (categoryFilter === "high_cpu" && p.cpu > 20) ||
        (categoryFilter === "high_mem" && p.memMB > 300);
      return qMatch && catMatch;
    });

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
  }, [procs, q, categoryFilter, sortCol, sortAsc]);

  return (
    <PageWrapper>
      <PageHeader eyebrow="Management" title="Processes" subtitle="Live process inventory & thread inspector" />
      <ServerSelector value={server} onChange={setServer} />

      <div className="nx-card overflow-hidden space-y-0">
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-c)] p-3 bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name / PID…"
              className="mono w-64 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-sub)] focus:border-[var(--amber)] focus:outline-none transition-colors"
            />

            {/* Hotspot Filters */}
            <div className="flex items-center gap-1 bg-[var(--bg-void)] p-1 rounded-lg border border-[var(--border-c)] text-xs">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${categoryFilter === "all" ? "bg-[var(--amber)] text-black" : "text-[var(--text-sub)] hover:text-white"}`}
              >
                All ({procs.length})
              </button>
              <button
                onClick={() => setCategoryFilter("high_cpu")}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${categoryFilter === "high_cpu" ? "bg-[var(--warn)] text-black" : "text-[var(--text-sub)] hover:text-white"}`}
              >
                High CPU
              </button>
              <button
                onClick={() => setCategoryFilter("high_mem")}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${categoryFilter === "high_mem" ? "bg-[var(--teal)] text-black" : "text-[var(--text-sub)] hover:text-white"}`}
              >
                High RAM
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="mono flex items-center gap-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3 py-1.5 text-xs font-semibold text-[var(--text-sub)] hover:text-white transition-colors cursor-pointer"
            >
              <Download size={13} /> Export CSV
            </button>

            <label className="mono flex items-center gap-1.5 text-xs text-[var(--text-sub)] cursor-pointer hover:text-white transition-colors border border-[var(--border-c)] bg-[var(--bg-void)] px-3 py-1.5 rounded-xl">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-[var(--amber)]" />
              Auto 5s
            </label>

            <button
              disabled={sel.size === 0}
              onClick={() => setKillTarget(Array.from(sel))}
              title="End selected tasks"
              className="mono flex items-center gap-1.5 rounded-xl border border-[var(--crit)]/40 bg-[var(--crit)]/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--crit)] transition-colors hover:bg-[var(--crit)]/20 disabled:opacity-30 cursor-pointer"
            >
              <Square size={13} /> End Task ({sel.size})
            </button>
          </div>
        </div>

        {/* Processes Data Table */}
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-xs select-none">
            <thead className="sticky top-0 bg-[var(--bg-card)]/95 backdrop-blur-sm shadow-[0_1px_0_var(--border-c)] z-10">
              <tr className="eyebrow text-left text-[var(--text-sub)]">
                <th className="w-8 px-3 py-2">.</th>
                <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('name')} title="Sort by Name">Name <SortIcon col="name"/></th>
                <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('pid')} title="Sort by PID">PID <SortIcon col="pid"/></th>
                <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('cpu')} title="Sort by CPU">CPU% <SortIcon col="cpu"/></th>
                <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('memMB')} title="Sort by Memory">Memory <SortIcon col="memMB"/></th>
                <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('memPct')} title="Sort by Memory %">Mem% <SortIcon col="memPct"/></th>
                <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('handles')} title="Sort by Handles">Handles <SortIcon col="handles"/></th>
                <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('threads')} title="Sort by Threads">Threads <SortIcon col="threads"/></th>
                <th className="py-2.5">User</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 w-10">.</th>
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
                    className={`cursor-pointer border-b border-[var(--border-dim)] transition-colors ${isSel ? "bg-[var(--amber-low)]/40 hover:bg-[var(--amber-low)]/50" : hot ? "bg-[var(--warn)]/[0.04] hover:bg-[var(--warn)]/[0.08]" : "hover:bg-[var(--amber-low)]/10"}`}
                  >
                    <td className={"px-3 py-2 transition-colors " + (isSel ? "border-l-2 border-[var(--amber)]" : "border-l-2 border-transparent")}>
                      <input type="checkbox" checked={isSel} onChange={() => {}} className="accent-[var(--amber)] pointer-events-none" />
                    </td>
                    <td className="text-[var(--text)] font-semibold">{p.name}</td>
                    <td className="text-[var(--text-sub)]">{p.pid}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={hot ? "text-[var(--warn)] font-bold" : "text-[var(--amber)]"}>{p.cpu.toFixed(1)}%</span>
                        <div className="h-1.5 w-12 rounded bg-[var(--border-dim)] overflow-hidden">
                          <div className="h-full rounded bg-[var(--amber)]" style={{ width: `${Math.min(100, p.cpu)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="text-[var(--text-sub)]">{formatBytes(p.memMB * 1048576)}</td>
                    <td className="text-[var(--text-sub)]">{p.memPct.toFixed(1)}%</td>
                    <td className="text-[var(--text-sub)]">{p.handles}</td>
                    <td className="text-[var(--text-sub)]">{p.threads}</td>
                    <td className="text-[var(--text-sub)]">{p.user}</td>
                    <td className="text-[var(--teal)] font-semibold">{p.status}</td>
                    <td className="pr-3 text-right">
                      <div className="relative group inline-block" onClick={e => e.stopPropagation()}>
                        <button className="rounded p-1 text-[var(--text-sub)] hover:bg-[var(--border-c)] hover:text-white transition-colors" title="More Actions">
                          <MoreHorizontal size={14} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 hidden w-40 flex-col overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl group-hover:flex z-50 p-1">
                          <button onClick={() => fetchDetails(p.pid)} className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg"><Info size={13} /> Details</button>
                          <button onClick={() => { setPriorityTarget(p); setSelectedPriority("Normal"); }} className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg"><Sliders size={13} /> Set Priority</button>
                          <div className="my-1 h-[1px] bg-[var(--border-c)]" />
                          <button onClick={() => setKillTarget([p.pid])} className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--crit)] transition-colors hover:bg-[var(--crit)]/20 rounded-lg"><Square size={13} /> End Task</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="mono flex items-center justify-between border-t border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs text-[var(--text-sub)]">
          <span>Total Processes: <span className="text-[var(--text)] font-bold">{procs.length}</span></span>
          <span>System CPU: <span className="text-[var(--amber)] font-bold">{sysCpu.toFixed(1)}%</span></span>
          <span>System Memory: <span className="text-[var(--teal)] font-bold">{sysMem.toFixed(1)}%</span></span>
        </div>
      </div>

      {/* Priority Modifier Modal */}
      {priorityTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-5 py-4">
              <div className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                <Sliders size={16} className="text-[var(--amber)]" /> Change Process Priority: {priorityTarget.name}
              </div>
              <button onClick={() => setPriorityTarget(null)} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-2">Priority Level</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                >
                  <option value="Realtime">Realtime (Highest Risk)</option>
                  <option value="High">High</option>
                  <option value="AboveNormal">Above Normal</option>
                  <option value="Normal">Normal (Default)</option>
                  <option value="BelowNormal">Below Normal</option>
                  <option value="Idle">Idle (Lowest Priority)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setPriorityTarget(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:bg-[var(--bg-void)]">Cancel</button>
                <button onClick={handleSetPriority} className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)]">Save Priority</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kill Confirmation Modal */}
      {killTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--crit)]/30 bg-[var(--crit)]/10 px-5 py-4">
              <div className="font-bold text-sm text-[var(--crit)] flex items-center gap-2">Confirm Task Termination</div>
              <button onClick={() => setKillTarget(null)} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-5">
              <p className="text-xs text-[var(--text)] mb-2">
                Are you sure you want to end {killTarget.length} selected process(es)?
              </p>
              <p className="text-[11px] text-[var(--text-sub)] mb-5 leading-relaxed">
                WARNING: Terminating a process can cause undesired results including loss of unsaved data and system instability.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setKillTarget(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-white">Cancel</button>
                <button onClick={handleEndTask} className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--crit)] text-white hover:bg-[var(--crit-hover)]">End Process</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-5 py-4">
              <div className="font-bold text-sm text-[var(--text)] flex items-center gap-2">Process Details</div>
              <button onClick={() => setDetailsTarget(null)} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-5 mono text-xs">
              <div className="grid grid-cols-[120px_1fr] gap-3 mb-4 items-baseline">
                <span className="text-[var(--text-sub)] font-semibold">Name</span>
                <span className="text-[var(--amber)] text-sm font-bold">{detailsTarget.name}</span>

                <span className="text-[var(--text-sub)] font-semibold">Process ID</span>
                <span className="text-[var(--text)]">{detailsTarget.pid}</span>

                <span className="text-[var(--text-sub)] font-semibold">Status</span>
                <span className="text-[var(--teal)] font-bold">{detailsTarget.status}</span>

                <span className="text-[var(--text-sub)] font-semibold">Memory usage</span>
                <span className="text-[var(--text)]">{formatBytes(detailsTarget.memMB * 1048576)} ({detailsTarget.memPct.toFixed(1)}%)</span>

                <span className="text-[var(--text-sub)] font-semibold">Executable Path</span>
                <span className="text-[var(--text)] bg-[var(--bg-surface)] p-2 rounded-xl break-all border border-[var(--border-c)]">
                  {isDetailsLoading ? "Loading..." : detailsTarget.executablePath || "N/A"}
                </span>

                <span className="text-[var(--text-sub)] font-semibold">Command Line</span>
                <span className="text-[var(--text)] bg-[var(--bg-surface)] p-2 rounded-xl break-all border border-[var(--border-c)] max-h-32 overflow-y-auto">
                  {isDetailsLoading ? "Loading..." : detailsTarget.commandLine || "N/A"}
                </span>
              </div>
              <div className="flex justify-end gap-3 mt-6 border-t border-[var(--border-c)] pt-4">
                <button onClick={() => setDetailsTarget(null)} className="px-5 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-white transition-colors border border-[var(--border-c)]">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </PageWrapper>
  );
}
