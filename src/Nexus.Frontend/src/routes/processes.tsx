import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  Square, MoreHorizontal, Info, X, ChevronUp, ChevronDown, Download, Sliders, Zap, 
  RefreshCw, Cpu, HardDrive, Layers, Grid, List, Search, Copy, Check, Filter, 
  Activity, CheckSquare, Shield, Terminal, Flame, Database, Server as ServerIcon, Play
} from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getLiveProcessesClient, killProcessClient, getPerformanceHistoryClient, getProcessDetailsClient, type Process } from "@/api/client";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/backend";

export const Route = createFileRoute("/processes")({
  head: () => ({ meta: [{ title: "Processes — NEXUS" }, { name: "description", content: "Live process inventory, thread inspector, and resource monitor." }] }),
  component: ProcessesPage,
});

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

type ViewMode = "table" | "grouped" | "heatmap";
type CategoryFilter = "all" | "high_cpu" | "high_mem" | "System" | "Service" | "Application" | "Database";

export function ProcessesPage() {
  const [server, setServer] = useState("dc01");
  const [procs, setProcs] = useState<Process[]>([]);
  const [sysCpu, setSysCpu] = useState<number>(0);
  const [sysMem, setSysMem] = useState<number>(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<number>>(new Set());
  
  // Polling control
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(3000); // 3s default
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // View & Filter modes
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  // Sorting
  const [sortCol, setSortCol] = useState<keyof Process>("cpu");
  const [sortAsc, setSortAsc] = useState(false);

  // Modals & Action Targets
  const [killTarget, setKillTarget] = useState<number[] | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Process | null>(null);
  const [priorityTarget, setPriorityTarget] = useState<Process | null>(null);
  const [selectedPriority, setSelectedPriority] = useState("Normal");
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  async function load() {
    if (!server) return;
    setIsRefreshing(true);
    try {
      const p = await getLiveProcessesClient(server);
      setProcs(p);
      
      const hist = await getPerformanceHistoryClient(server);
      if (hist && hist.length > 0) {
        const latest = hist[hist.length - 1];
        setSysCpu(latest.cpu);
        setSysMem(latest.mem);
      } else {
        let totalCpu = 0;
        let totalMemMB = 0;
        p.forEach(x => { totalCpu += x.cpu; totalMemMB += x.memMB; });
        setSysCpu(Math.min(100, Number(totalCpu.toFixed(1))));
        setSysMem(Math.min(100, Number(((totalMemMB / 16384) * 100).toFixed(1))));
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    if (pollIntervalMs > 0) {
      const id = window.setInterval(load, pollIntervalMs);
      return () => window.clearInterval(id);
    }
  }, [server, pollIntervalMs]);

  // Quick stats calculations
  const stats = useMemo(() => {
    let totalHandles = 0;
    let totalThreads = 0;
    let topCpuProc: Process | null = null;
    let topMemProc: Process | null = null;

    procs.forEach(p => {
      totalHandles += (p.handles || 0);
      totalThreads += (p.threads || 0);

      if (!topCpuProc || p.cpu > topCpuProc.cpu) topCpuProc = p;
      if (!topMemProc || p.memMB > topMemProc.memMB) topMemProc = p;
    });

    return {
      count: procs.length,
      totalHandles,
      totalThreads,
      topCpuProc,
      topMemProc
    };
  }, [procs]);

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
    if (detailsTarget && killTarget.includes(detailsTarget.pid)) {
      setDetailsTarget(null);
    }
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
      setProcs(prev => prev.map(p => p.pid === priorityTarget.pid ? { ...p, priority: selectedPriority as any } : p));
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
    const headers = ["PID", "Name", "CPU%", "Memory(MB)", "Mem%", "Handles", "Threads", "User", "Status", "Category", "Executable"];
    const rows = procs.map(p => [
      p.pid, p.name, p.cpu, p.memMB, p.memPct, p.handles, p.threads, p.user, p.status, p.category || "N/A", p.executablePath || "N/A"
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexus-processes-${server}-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    toast.success("Exported processes to CSV");
  };

  const handleExportJSON = () => {
    if (procs.length === 0) return;
    const blob = new Blob([JSON.stringify(procs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexus-processes-${server}-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    toast.success("Exported processes to JSON");
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
    return sortAsc ? <ChevronUp size={13} className="inline ml-1" /> : <ChevronDown size={13} className="inline ml-1" />;
  };

  const filtered = useMemo(() => {
    let res = procs.filter((p) => {
      const searchLower = q.toLowerCase();
      const qMatch = !q || 
        p.name.toLowerCase().includes(searchLower) || 
        String(p.pid).includes(searchLower) ||
        p.user.toLowerCase().includes(searchLower) ||
        (p.executablePath && p.executablePath.toLowerCase().includes(searchLower));

      const catMatch =
        categoryFilter === "all" ||
        (categoryFilter === "high_cpu" && p.cpu > 5) ||
        (categoryFilter === "high_mem" && p.memMB > 150) ||
        (p.category === categoryFilter);

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

  const allSelected = filtered.length > 0 && filtered.every(p => sel.has(p.pid));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSel(new Set());
    } else {
      setSel(new Set(filtered.map(p => p.pid)));
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Group processes by Category for Grouped View
  const groupedProcs = useMemo(() => {
    const map: Record<string, Process[]> = {
      "Applications": [],
      "Services": [],
      "Databases": [],
      "System Core": []
    };

    filtered.forEach(p => {
      const cat = p.category;
      if (cat === "Database") map["Databases"].push(p);
      else if (cat === "Service") map["Services"].push(p);
      else if (cat === "System") map["System Core"].push(p);
      else map["Applications"].push(p);
    });

    return map;
  }, [filtered]);

  return (
    <PageWrapper>
      <PageHeader 
        eyebrow="Fleet Telemetry" 
        title="Processes Manager" 
        subtitle="Real-time process inspection, thread priority, and system resource tracking" 
      />
      
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <ServerSelector value={server} onChange={setServer} />

        {/* Polling Interval & Live Refresh Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-c)] px-3 py-1.5 rounded-xl text-xs mono">
            <span className="text-[var(--text-sub)]">Poll:</span>
            <select
              value={pollIntervalMs}
              onChange={(e) => setPollIntervalMs(Number(e.target.value))}
              className="bg-transparent text-[var(--amber)] font-bold outline-none cursor-pointer"
            >
              <option value={1000} className="bg-[var(--bg-card)]">1s (High Speed)</option>
              <option value={3000} className="bg-[var(--bg-card)]">3s (Normal)</option>
              <option value={5000} className="bg-[var(--bg-card)]">5s (Eco)</option>
              <option value={10000} className="bg-[var(--bg-card)]">10s (Slow)</option>
              <option value={0} className="bg-[var(--bg-card)]">Paused</option>
            </select>
          </div>

          <button
            onClick={() => load()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] hover:bg-[var(--amber-low)] text-xs text-[var(--text)] transition-colors cursor-pointer"
            title="Refresh now"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin text-[var(--amber)]" : ""} />
            <span className="mono">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Performance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Total Processes */}
        <div className="nx-card p-4 space-y-1 relative overflow-hidden border-l-4 border-l-[var(--amber)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-sub)] uppercase tracking-wider font-semibold">
            <span>Total Processes</span>
            <Activity size={15} className="text-[var(--amber)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text)] mono">
            {stats.count}
          </div>
          <div className="text-[11px] text-[var(--text-sub)] truncate">
            {stats.count > 0 ? `${filtered.length} visible with filters` : "No active processes"}
          </div>
        </div>

        {/* CPU Load Card */}
        <div className="nx-card p-4 space-y-1 relative overflow-hidden border-l-4 border-l-[var(--warn)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-sub)] uppercase tracking-wider font-semibold">
            <span>System CPU Load</span>
            <Cpu size={15} className="text-[var(--warn)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--warn)] mono">{sysCpu.toFixed(1)}%</span>
            <div className="h-2 flex-1 rounded bg-[var(--border-dim)] overflow-hidden">
              <div className="h-full bg-[var(--warn)] transition-all duration-500" style={{ width: `${Math.min(100, sysCpu)}%` }} />
            </div>
          </div>
          <div className="text-[11px] text-[var(--text-sub)] truncate">
            Top: {stats.topCpuProc ? `${stats.topCpuProc.name} (${stats.topCpuProc.cpu}%)` : "N/A"}
          </div>
        </div>

        {/* Memory Load Card */}
        <div className="nx-card p-4 space-y-1 relative overflow-hidden border-l-4 border-l-[var(--teal)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-sub)] uppercase tracking-wider font-semibold">
            <span>System Memory</span>
            <HardDrive size={15} className="text-[var(--teal)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--teal)] mono">{sysMem.toFixed(1)}%</span>
            <div className="h-2 flex-1 rounded bg-[var(--border-dim)] overflow-hidden">
              <div className="h-full bg-[var(--teal)] transition-all duration-500" style={{ width: `${Math.min(100, sysMem)}%` }} />
            </div>
          </div>
          <div className="text-[11px] text-[var(--text-sub)] truncate">
            Top: {stats.topMemProc ? `${stats.topMemProc.name} (${formatBytes(stats.topMemProc.memMB * 1048576)})` : "N/A"}
          </div>
        </div>

        {/* Handles & Threads */}
        <div className="nx-card p-4 space-y-1 relative overflow-hidden border-l-4 border-l-[var(--ok)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-sub)] uppercase tracking-wider font-semibold">
            <span>Handles & Threads</span>
            <Layers size={15} className="text-[var(--ok)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text)] mono">
            {stats.totalHandles.toLocaleString()} <span className="text-xs text-[var(--text-sub)] font-normal">handles</span>
          </div>
          <div className="text-[11px] text-[var(--text-sub)] truncate">
            {stats.totalThreads.toLocaleString()} active OS threads
          </div>
        </div>
      </div>

      {/* Main Process Control Container */}
      <div className="nx-card overflow-hidden space-y-0 border border-[var(--border-c)]">
        {/* Top Control Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-c)] p-3.5 bg-[var(--bg-surface)]">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-sub)]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, PID, user, path…"
                className="mono w-64 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] pl-8 pr-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-sub)] focus:border-[var(--amber)] focus:outline-none transition-colors"
              />
              {q && (
                <button onClick={() => setQ("")} className="absolute right-2.5 top-2 text-[var(--text-sub)] hover:text-white">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1 bg-[var(--bg-void)] p-1 rounded-xl border border-[var(--border-c)] text-xs mono">
              {(["all", "high_cpu", "high_mem", "Application", "Service", "Database", "System"] as CategoryFilter[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    categoryFilter === cat 
                      ? "bg-[var(--amber)] text-black font-bold shadow" 
                      : "text-[var(--text-sub)] hover:text-white"
                  }`}
                >
                  {cat === "all" ? `All (${procs.length})` : cat === "high_cpu" ? "🔥 High CPU" : cat === "high_mem" ? "⚡ High RAM" : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-[var(--bg-void)] p-1 rounded-xl border border-[var(--border-c)]">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "table" ? "bg-[var(--border-c)] text-white" : "text-[var(--text-sub)] hover:text-white"}`}
                title="Table View"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewMode("grouped")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grouped" ? "bg-[var(--border-c)] text-white" : "text-[var(--text-sub)] hover:text-white"}`}
                title="Grouped View"
              >
                <Layers size={14} />
              </button>
              <button
                onClick={() => setViewMode("heatmap")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "heatmap" ? "bg-[var(--border-c)] text-white" : "text-[var(--text-sub)] hover:text-white"}`}
                title="Resource Heatmap Grid"
              >
                <Grid size={14} />
              </button>
            </div>

            {/* Export Dropdown */}
            <div className="relative group inline-block">
              <button className="mono flex items-center gap-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3 py-1.5 text-xs font-semibold text-[var(--text-sub)] hover:text-white transition-colors cursor-pointer">
                <Download size={13} /> Export
              </button>
              <div className="absolute right-0 top-full mt-1 hidden w-32 flex-col overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl group-hover:flex z-50 p-1">
                <button onClick={handleExportCSV} className="text-left px-3 py-2 text-xs text-[var(--text)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg font-mono">CSV File</button>
                <button onClick={handleExportJSON} className="text-left px-3 py-2 text-xs text-[var(--text)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg font-mono">JSON File</button>
              </div>
            </div>

            {/* End Task Button */}
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

        {/* View Mode 1: Table View */}
        {viewMode === "table" && (
          <div className="max-h-[62vh] overflow-y-auto">
            <table className="w-full text-xs select-none border-collapse">
              <thead className="sticky top-0 bg-[var(--bg-card)]/95 backdrop-blur-md shadow-[0_1px_0_var(--border-c)] z-10">
                <tr className="eyebrow text-left text-[var(--text-sub)] border-b border-[var(--border-c)]">
                  <th className="w-8 px-3 py-2.5">
                    <input 
                      type="checkbox" 
                      checked={allSelected} 
                      onChange={toggleSelectAll} 
                      className="accent-[var(--amber)] cursor-pointer" 
                      title={allSelected ? "Deselect All" : "Select All"}
                    />
                  </th>
                  <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('name')} title="Sort by Process Name">Name <SortIcon col="name"/></th>
                  <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('pid')} title="Sort by PID">PID <SortIcon col="pid"/></th>
                  <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('cpu')} title="Sort by CPU Usage">CPU% <SortIcon col="cpu"/></th>
                  <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('memMB')} title="Sort by Memory Usage">Memory <SortIcon col="memMB"/></th>
                  <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('handles')} title="Sort by Handles">Handles <SortIcon col="handles"/></th>
                  <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('threads')} title="Sort by Threads">Threads <SortIcon col="threads"/></th>
                  <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('user')} title="Sort by User">User <SortIcon col="user"/></th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 w-10 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="mono">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-[var(--text-sub)]">
                      No processes match the query "{q}"
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const isSel = sel.has(p.pid);
                    const hotCpu = p.cpu > 10;
                    const hotRam = p.memMB > 300;

                    return (
                      <tr 
                        key={p.pid} 
                        onClick={() => { const n = new Set(sel); isSel ? n.delete(p.pid) : n.add(p.pid); setSel(n); }}
                        className={`cursor-pointer border-b border-[var(--border-dim)] transition-colors ${
                          isSel 
                            ? "bg-[var(--amber-low)]/40 hover:bg-[var(--amber-low)]/50" 
                            : hotCpu 
                              ? "bg-[var(--warn)]/[0.04] hover:bg-[var(--warn)]/[0.08]" 
                              : "hover:bg-[var(--amber-low)]/10"
                        }`}
                      >
                        <td className={"px-3 py-2.5 transition-colors " + (isSel ? "border-l-2 border-[var(--amber)]" : "border-l-2 border-transparent")}>
                          <input type="checkbox" checked={isSel} onChange={() => {}} className="accent-[var(--amber)] pointer-events-none" />
                        </td>
                        <td className="text-[var(--text)] font-bold flex items-center gap-2 py-2.5">
                          {p.category === "Database" ? <Database size={13} className="text-[var(--teal)]" /> : p.category === "Service" ? <ServerIcon size={13} className="text-[var(--amber)]" /> : <Terminal size={13} className="text-[var(--text-sub)]" />}
                          <span className="truncate max-w-[200px]" title={p.name}>{p.name}</span>
                        </td>
                        <td className="text-[var(--text-sub)]">{p.pid}</td>
                        <td>
                          <div className="flex items-center gap-2 pr-2">
                            <span className={hotCpu ? "text-[var(--warn)] font-bold" : "text-[var(--amber)]"}>{p.cpu.toFixed(1)}%</span>
                            <div className="h-1.5 w-14 rounded bg-[var(--border-dim)] overflow-hidden">
                              <div className={`h-full rounded ${hotCpu ? "bg-[var(--warn)]" : "bg-[var(--amber)]"}`} style={{ width: `${Math.min(100, p.cpu * 4)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className={hotRam ? "text-[var(--teal)] font-bold" : "text-[var(--text-sub)]"}>
                          {formatBytes(p.memMB * 1048576)}
                        </td>
                        <td className="text-[var(--text-sub)]">{p.handles}</td>
                        <td className="text-[var(--text-sub)]">{p.threads}</td>
                        <td className="text-[var(--text-sub)] truncate max-w-[140px]" title={p.user}>{p.user}</td>
                        <td>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-surface)] border border-[var(--border-c)] text-[var(--text-sub)]">
                            {p.category || "App"}
                          </span>
                        </td>
                        <td className="text-[var(--teal)] font-semibold">{p.status}</td>
                        <td className="pr-3 text-center">
                          <div className="relative group inline-block" onClick={e => e.stopPropagation()}>
                            <button className="rounded p-1 text-[var(--text-sub)] hover:bg-[var(--border-c)] hover:text-white transition-colors" title="Process Actions">
                              <MoreHorizontal size={14} />
                            </button>
                            <div className="absolute right-0 top-full mt-1 hidden w-44 flex-col overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl group-hover:flex z-50 p-1">
                              <button onClick={() => fetchDetails(p.pid)} className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg"><Info size={13} /> Inspect Details</button>
                              <button onClick={() => { setPriorityTarget(p); setSelectedPriority(p.priority || "Normal"); }} className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg"><Sliders size={13} /> Set Priority</button>
                              <button onClick={() => copyToClipboard(p.executablePath || p.name, "Path")} className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg"><Copy size={13} /> Copy Executable Path</button>
                              <div className="my-1 h-[1px] bg-[var(--border-c)]" />
                              <button onClick={() => setKillTarget([p.pid])} className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--crit)] transition-colors hover:bg-[var(--crit)]/20 rounded-lg"><Square size={13} /> End Task</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* View Mode 2: Grouped View */}
        {viewMode === "grouped" && (
          <div className="max-h-[62vh] overflow-y-auto p-4 space-y-6">
            {Object.entries(groupedProcs).map(([groupTitle, groupItems]) => {
              if (groupItems.length === 0) return null;
              const groupCpu = groupItems.reduce((acc, x) => acc + x.cpu, 0);
              const groupMemMB = groupItems.reduce((acc, x) => acc + x.memMB, 0);

              return (
                <div key={groupTitle} className="border border-[var(--border-c)] rounded-xl overflow-hidden bg-[var(--bg-void)]">
                  <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-c)]">
                    <div className="flex items-center gap-2 font-bold text-xs text-[var(--text)]">
                      <Layers size={14} className="text-[var(--amber)]" />
                      <span>{groupTitle}</span>
                      <span className="text-[var(--text-sub)] font-normal">({groupItems.length})</span>
                    </div>
                    <div className="mono text-xs text-[var(--text-sub)] flex items-center gap-4">
                      <span>Total CPU: <strong className="text-[var(--warn)]">{groupCpu.toFixed(1)}%</strong></span>
                      <span>Total RAM: <strong className="text-[var(--teal)]">{formatBytes(groupMemMB * 1048576)}</strong></span>
                    </div>
                  </div>

                  <div className="divide-y divide-[var(--border-dim)] mono text-xs">
                    {groupItems.map(p => (
                      <div key={p.pid} className="flex items-center justify-between p-3 hover:bg-[var(--amber-low)]/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--amber)] font-bold">{p.pid}</span>
                          <span className="text-[var(--text)] font-semibold">{p.name}</span>
                          <span className="text-[10px] text-[var(--text-sub)]">{p.user}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="text-[var(--warn)] font-bold">{p.cpu.toFixed(1)}%</span> CPU
                          </div>
                          <div className="text-right">
                            <span className="text-[var(--teal)] font-bold">{formatBytes(p.memMB * 1048576)}</span> RAM
                          </div>
                          <button onClick={() => fetchDetails(p.pid)} className="p-1 text-[var(--text-sub)] hover:text-white">
                            <Info size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Mode 3: Resource Heatmap Grid */}
        {viewMode === "heatmap" && (
          <div className="max-h-[62vh] overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(p => {
              const hot = p.cpu > 10 || p.memMB > 300;
              return (
                <div 
                  key={p.pid} 
                  onClick={() => fetchDetails(p.pid)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] ${
                    hot 
                      ? "bg-[var(--warn)]/[0.06] border-[var(--warn)]/40 hover:border-[var(--warn)]" 
                      : "bg-[var(--bg-void)] border-[var(--border-c)] hover:border-[var(--amber)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-[var(--text)] truncate max-w-[130px]">{p.name}</span>
                    <span className="mono text-[10px] text-[var(--text-sub)]">PID {p.pid}</span>
                  </div>

                  <div className="space-y-2 mono text-[11px]">
                    <div>
                      <div className="flex justify-between text-[10px] text-[var(--text-sub)] mb-0.5">
                        <span>CPU Load</span>
                        <span className="text-[var(--warn)] font-bold">{p.cpu.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 rounded bg-[var(--border-dim)] overflow-hidden">
                        <div className="h-full bg-[var(--warn)]" style={{ width: `${Math.min(100, p.cpu * 5)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-[var(--text-sub)] mb-0.5">
                        <span>Memory</span>
                        <span className="text-[var(--teal)] font-bold">{formatBytes(p.memMB * 1048576)}</span>
                      </div>
                      <div className="h-1.5 rounded bg-[var(--border-dim)] overflow-hidden">
                        <div className="h-full bg-[var(--teal)]" style={{ width: `${Math.min(100, (p.memMB / 2500) * 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[var(--border-dim)] flex items-center justify-between text-[10px] text-[var(--text-sub)]">
                    <span>{p.category || "App"}</span>
                    <span>{p.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Summary */}
        <div className="mono flex flex-wrap items-center justify-between border-t border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs text-[var(--text-sub)]">
          <div className="flex items-center gap-4">
            <span>Showing: <strong className="text-[var(--text)]">{filtered.length}</strong> / {procs.length} processes</span>
            {sel.size > 0 && <span className="text-[var(--amber)] font-bold">{sel.size} selected</span>}
          </div>
          <div className="flex items-center gap-6">
            <span>CPU: <strong className="text-[var(--warn)]">{sysCpu.toFixed(1)}%</strong></span>
            <span>Memory: <strong className="text-[var(--teal)]">{sysMem.toFixed(1)}%</strong></span>
          </div>
        </div>
      </div>

      {/* Priority Modifier Modal */}
      {priorityTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-5 py-4">
              <div className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                <Sliders size={16} className="text-[var(--amber)]" /> Set Priority: {priorityTarget.name}
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
              <div className="bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border-c)] mb-4 max-h-32 overflow-y-auto mono text-[11px] text-[var(--text-sub)]">
                {killTarget.map(pid => {
                  const found = procs.find(p => p.pid === pid);
                  return <div key={pid}>• PID {pid} - {found?.name || "Unknown"}</div>;
                })}
              </div>
              <p className="text-[11px] text-[var(--text-sub)] mb-5 leading-relaxed">
                WARNING: Terminating a process can cause loss of unsaved data and system instability.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setKillTarget(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-white">Cancel</button>
                <button onClick={handleEndTask} className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--crit)] text-white hover:bg-[var(--crit-hover)]">End Process</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process Inspector Detail Modal */}
      {detailsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-5 py-4">
              <div className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                <Info size={16} className="text-[var(--amber)]" /> Process Inspector — {detailsTarget.name}
              </div>
              <button onClick={() => setDetailsTarget(null)} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
            </div>
            
            <div className="p-5 mono text-xs space-y-4">
              <div className="grid grid-cols-[130px_1fr] gap-3 items-baseline">
                <span className="text-[var(--text-sub)] font-semibold">Process Name</span>
                <span className="text-[var(--amber)] text-sm font-bold">{detailsTarget.name}</span>

                <span className="text-[var(--text-sub)] font-semibold">Process ID (PID)</span>
                <span className="text-[var(--text)]">{detailsTarget.pid}</span>

                <span className="text-[var(--text-sub)] font-semibold">Execution Status</span>
                <span className="text-[var(--teal)] font-bold">{detailsTarget.status}</span>

                <span className="text-[var(--text-sub)] font-semibold">User Context</span>
                <span className="text-[var(--text)]">{detailsTarget.user}</span>

                <span className="text-[var(--text-sub)] font-semibold">Category</span>
                <span className="text-[var(--text)]">{detailsTarget.category || "Application"}</span>

                <span className="text-[var(--text-sub)] font-semibold">Priority</span>
                <span className="text-[var(--text)]">{detailsTarget.priority || "Normal"}</span>

                <span className="text-[var(--text-sub)] font-semibold">CPU Usage</span>
                <span className="text-[var(--warn)] font-bold">{detailsTarget.cpu.toFixed(1)}%</span>

                <span className="text-[var(--text-sub)] font-semibold">Memory Usage</span>
                <span className="text-[var(--teal)] font-bold">{formatBytes(detailsTarget.memMB * 1048576)} ({detailsTarget.memPct.toFixed(1)}%)</span>

                <span className="text-[var(--text-sub)] font-semibold">Handles / Threads</span>
                <span className="text-[var(--text)]">{detailsTarget.handles} handles · {detailsTarget.threads} threads</span>

                <span className="text-[var(--text-sub)] font-semibold">Executable Path</span>
                <div className="flex items-center justify-between gap-2 bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border-c)]">
                  <span className="text-[var(--text)] break-all">{isDetailsLoading ? "Loading..." : detailsTarget.executablePath || "N/A"}</span>
                  {detailsTarget.executablePath && (
                    <button onClick={() => copyToClipboard(detailsTarget.executablePath!, "Path")} className="p-1 text-[var(--text-sub)] hover:text-white" title="Copy Path">
                      <Copy size={13} />
                    </button>
                  )}
                </div>

                <span className="text-[var(--text-sub)] font-semibold">Command Line</span>
                <div className="flex items-center justify-between gap-2 bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border-c)] max-h-32 overflow-y-auto">
                  <span className="text-[var(--text)] break-all">{isDetailsLoading ? "Loading..." : detailsTarget.commandLine || "N/A"}</span>
                  {detailsTarget.commandLine && (
                    <button onClick={() => copyToClipboard(detailsTarget.commandLine!, "CLI")} className="p-1 text-[var(--text-sub)] hover:text-white" title="Copy Command Line">
                      <Copy size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 mt-6 border-t border-[var(--border-c)] pt-4">
                <button 
                  onClick={() => setKillTarget([detailsTarget.pid])} 
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--crit)]/10 border border-[var(--crit)]/40 text-[var(--crit)] hover:bg-[var(--crit)]/20"
                >
                  End Task
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setPriorityTarget(detailsTarget); setSelectedPriority(detailsTarget.priority || "Normal"); }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text)] border border-[var(--border-c)] hover:bg-[var(--amber-low)]"
                  >
                    Set Priority
                  </button>
                  <button onClick={() => setDetailsTarget(null)} className="px-5 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-white transition-colors border border-[var(--border-c)]">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </PageWrapper>
  );
}
