import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  Play, Square, RotateCw, Pause, ChevronUp, ChevronDown, X, Search, Filter, 
  Layers, List, Grid, Download, RefreshCw, Server as ServerIcon, Shield, 
  Terminal, Cpu, CheckCircle2, AlertTriangle, Info, Sliders, Copy, Check, 
  Database, Network, Lock, Zap, ArrowRight, Activity
} from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getServicesClient, controlServiceClient, setServiceStartupTypeClient, type Service } from "@/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "Services — NEXUS" }, { name: "description", content: "Manage Windows services, startup types, dependencies, and lifecycle." }] }),
  component: ServicesPage,
});

type ViewMode = "table" | "grouped";
type CategoryFilter = "all" | "Running" | "Stopped" | "Automatic" | "Manual" | "Disabled" | "Core Infrastructure" | "Security" | "Networking" | "Database / App" | "Management";

export function ServicesPage() {
  const [server, setServer] = useState("nexus01");
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<Service | null>(null);
  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState<CategoryFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  
  // Selection for bulk operations
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());

  // Polling
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(3000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Sorting
  const [sortCol, setSortCol] = useState<keyof Service>("displayName");
  const [sortAsc, setSortAsc] = useState(true);

  // Modals & Action Targets
  const [actionTarget, setActionTarget] = useState<{ action: string; services: Service[] } | null>(null);
  const [startupTypeModalTarget, setStartupTypeModalTarget] = useState<Service[] | null>(null);
  const [newStartupType, setNewStartupType] = useState<string>("Automatic");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadServices = async () => {
    setIsRefreshing(true);
    try {
      const data = await getServicesClient(server);
      setServices(data);
      if (selected) {
        const updated = data.find(s => s.name === selected.name);
        if (updated) setSelected(updated);
      }
    } catch (err) {
      console.error("Failed to load services", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadServices();
    if (pollIntervalMs > 0) {
      const id = window.setInterval(loadServices, pollIntervalMs);
      return () => window.clearInterval(id);
    }
  }, [server, pollIntervalMs]);

  const handleActionConfirm = async () => {
    if (!actionTarget) return;
    const { action, services: targetSvcs } = actionTarget;
    setActionLoading(true);
    setActionTarget(null);

    let count = 0;
    for (const svc of targetSvcs) {
      const ok = await controlServiceClient(server, svc.name, action);
      if (ok) count++;
    }

    toast.success(`Successfully executed '${action}' on ${count} service(s)`);
    setActionLoading(false);
    loadServices();
  };

  const handleStartupTypeChange = async () => {
    if (!startupTypeModalTarget) return;
    setActionLoading(true);

    let count = 0;
    for (const svc of startupTypeModalTarget) {
      const ok = await setServiceStartupTypeClient(server, svc.name, newStartupType);
      if (ok) count++;
    }

    toast.success(`Updated startup type to '${newStartupType}' for ${count} service(s)`);
    setStartupTypeModalTarget(null);
    setActionLoading(false);
    loadServices();
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSort = (col: keyof Service) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const SortIcon = ({ col }: { col: keyof Service }) => {
    if (sortCol !== col) return null;
    return sortAsc ? <ChevronUp size={13} className="inline ml-1" /> : <ChevronDown size={13} className="inline ml-1" />;
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = services.length;
    const running = services.filter(s => s.status.toLowerCase() === "running").length;
    const stopped = services.filter(s => s.status.toLowerCase() === "stopped").length;
    const paused = services.filter(s => s.status.toLowerCase() === "paused").length;
    const auto = services.filter(s => s.startupType.toLowerCase().includes("auto")).length;
    const disabled = services.filter(s => s.startupType.toLowerCase() === "disabled").length;

    return { total, running, stopped, paused, auto, disabled };
  }, [services]);

  // Filter & Sort
  const filtered = useMemo(() => {
    let res = services.filter((s) => {
      const searchLower = q.toLowerCase();
      const qMatch = !q || 
        s.displayName.toLowerCase().includes(searchLower) ||
        s.name.toLowerCase().includes(searchLower) ||
        (s.processId && String(s.processId).includes(searchLower)) ||
        s.logOnAs.toLowerCase().includes(searchLower) ||
        (s.description && s.description.toLowerCase().includes(searchLower));

      let catMatch = true;
      if (filterCategory === "Running") catMatch = s.status.toLowerCase() === "running";
      else if (filterCategory === "Stopped") catMatch = s.status.toLowerCase() === "stopped";
      else if (filterCategory === "Automatic") catMatch = s.startupType.toLowerCase().includes("auto");
      else if (filterCategory === "Manual") catMatch = s.startupType.toLowerCase() === "manual";
      else if (filterCategory === "Disabled") catMatch = s.startupType.toLowerCase() === "disabled";
      else if (filterCategory !== "all") catMatch = s.category === filterCategory;

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
  }, [services, q, filterCategory, sortCol, sortAsc]);

  const allSelected = filtered.length > 0 && filtered.every(s => selectedNames.has(s.name));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedNames(new Set());
    } else {
      setSelectedNames(new Set(filtered.map(s => s.name)));
    }
  };

  const getSelectedServicesList = () => {
    return services.filter(s => selectedNames.has(s.name));
  };

  // Grouped Services
  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {
      "Core Infrastructure": [],
      "Security": [],
      "Networking": [],
      "Database / App": [],
      "Management": []
    };

    filtered.forEach(s => {
      const cat = s.category || "Management";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });

    return groups;
  }, [filtered]);

  const handleExportCSV = () => {
    if (services.length === 0) return;
    const headers = ["Name", "Display Name", "Status", "Startup Type", "Log On As", "PID", "Category", "Executable Path", "Description"];
    const rows = services.map(s => [
      s.name, s.displayName, s.status, s.startupType, s.logOnAs, s.processId || "N/A", s.category || "N/A", s.pathName || "N/A", s.description || ""
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexus-services-${server}-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    toast.success("Exported services to CSV");
  };

  const handleExportJSON = () => {
    if (services.length === 0) return;
    const blob = new Blob([JSON.stringify(services, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexus-services-${server}-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    toast.success("Exported services to JSON");
  };

  return (
    <PageWrapper>
      <PageHeader 
        eyebrow="Fleet Management" 
        title="Services Manager" 
        subtitle={`Service lifecycle, startup policy, dependency topology on ${server.toUpperCase()}`} 
      />

      {/* Top Bar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <ServerSelector value={server} onChange={setServer} />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-c)] px-3 py-1.5 rounded-xl text-xs mono">
            <span className="text-[var(--text-sub)]">Poll:</span>
            <select
              value={pollIntervalMs}
              onChange={(e) => setPollIntervalMs(Number(e.target.value))}
              className="bg-transparent text-[var(--amber)] font-bold outline-none cursor-pointer"
            >
              <option value={1000} className="bg-[var(--bg-card)]">1s (Realtime)</option>
              <option value={3000} className="bg-[var(--bg-card)]">3s (Normal)</option>
              <option value={5000} className="bg-[var(--bg-card)]">5s (Eco)</option>
              <option value={0} className="bg-[var(--bg-card)]">Paused</option>
            </select>
          </div>

          <button
            onClick={() => loadServices()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] hover:bg-[var(--amber-low)] text-xs text-[var(--text)] transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin text-[var(--amber)]" : ""} />
            <span className="mono">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="nx-card p-4 space-y-1 relative overflow-hidden border-l-4 border-l-[var(--amber)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-sub)] uppercase tracking-wider font-semibold">
            <span>Total Services</span>
            <ServerIcon size={15} className="text-[var(--amber)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text)] mono">
            {stats.total}
          </div>
          <div className="text-[11px] text-[var(--text-sub)] truncate">
            {filtered.length} visible with active filters
          </div>
        </div>

        <div className="nx-card p-4 space-y-1 relative overflow-hidden border-l-4 border-l-[var(--teal)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-sub)] uppercase tracking-wider font-semibold">
            <span>Running Services</span>
            <CheckCircle2 size={15} className="text-[var(--teal)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--teal)] mono">{stats.running}</span>
            <span className="text-xs text-[var(--text-sub)] font-mono">
              ({stats.total ? Math.round((stats.running / stats.total) * 100) : 0}%)
            </span>
          </div>
          <div className="h-1.5 w-full bg-[var(--border-dim)] rounded overflow-hidden">
            <div className="h-full bg-[var(--teal)]" style={{ width: `${stats.total ? (stats.running / stats.total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="nx-card p-4 space-y-1 relative overflow-hidden border-l-4 border-l-[var(--warn)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-sub)] uppercase tracking-wider font-semibold">
            <span>Auto-Start Policy</span>
            <Zap size={15} className="text-[var(--warn)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text)] mono">
            {stats.auto} <span className="text-xs text-[var(--text-sub)] font-normal">services</span>
          </div>
          <div className="text-[11px] text-[var(--text-sub)] truncate">
            {stats.disabled} disabled from startup
          </div>
        </div>

        <div className="nx-card p-4 space-y-1 relative overflow-hidden border-l-4 border-l-[var(--crit)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-sub)] uppercase tracking-wider font-semibold">
            <span>Stopped / Paused</span>
            <AlertTriangle size={15} className="text-[var(--crit)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--crit)] mono">
            {stats.stopped + stats.paused}
          </div>
          <div className="text-[11px] text-[var(--text-sub)] truncate">
            {stats.stopped} stopped · {stats.paused} paused
          </div>
        </div>
      </div>

      {/* Main Grid: Left Table/Grouped + Right Sidebar Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
        {/* Left Section */}
        <div className="nx-card overflow-hidden space-y-0 border border-[var(--border-c)]">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-c)] p-3.5 bg-[var(--bg-surface)]">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-sub)]" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Filter name, PID, user, description…"
                  className="mono w-60 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] pl-8 pr-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-sub)] focus:border-[var(--amber)] focus:outline-none transition-colors"
                />
                {q && (
                  <button onClick={() => setQ("")} className="absolute right-2.5 top-2 text-[var(--text-sub)] hover:text-white">
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-1 bg-[var(--bg-void)] p-1 rounded-xl border border-[var(--border-c)] text-xs mono overflow-x-auto max-w-[420px]">
                {(["all", "Running", "Stopped", "Automatic", "Manual", "Core Infrastructure", "Security", "Networking", "Database / App"] as CategoryFilter[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      filterCategory === cat 
                        ? "bg-[var(--amber)] text-black font-bold shadow" 
                        : "text-[var(--text-sub)] hover:text-white"
                    }`}
                  >
                    {cat === "all" ? "All" : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Switcher */}
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
                  title="Grouped Category View"
                >
                  <Layers size={14} />
                </button>
              </div>

              {/* Export */}
              <div className="relative group inline-block">
                <button className="mono flex items-center gap-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3 py-1.5 text-xs font-semibold text-[var(--text-sub)] hover:text-white transition-colors cursor-pointer">
                  <Download size={13} /> Export
                </button>
                <div className="absolute right-0 top-full mt-1 hidden w-32 flex-col overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl group-hover:flex z-50 p-1">
                  <button onClick={handleExportCSV} className="text-left px-3 py-2 text-xs text-[var(--text)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg font-mono">CSV File</button>
                  <button onClick={handleExportJSON} className="text-left px-3 py-2 text-xs text-[var(--text)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg font-mono">JSON File</button>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Batch Bar */}
          {selectedNames.size > 0 && (
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--amber-low)]/20 border-b border-[var(--border-c)] text-xs mono">
              <span className="text-[var(--amber)] font-bold">{selectedNames.size} services selected</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActionTarget({ action: "start", services: getSelectedServicesList() })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--teal)]/20 text-[var(--teal)] border border-[var(--teal)]/40 hover:bg-[var(--teal)]/30 font-bold cursor-pointer"
                >
                  <Play size={12} /> Start Selected
                </button>
                <button 
                  onClick={() => setActionTarget({ action: "stop", services: getSelectedServicesList() })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--crit)]/20 text-[var(--crit)] border border-[var(--crit)]/40 hover:bg-[var(--crit)]/30 font-bold cursor-pointer"
                >
                  <Square size={12} /> Stop Selected
                </button>
                <button 
                  onClick={() => setActionTarget({ action: "restart", services: getSelectedServicesList() })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--amber)]/20 text-[var(--amber)] border border-[var(--amber)]/40 hover:bg-[var(--amber)]/30 font-bold cursor-pointer"
                >
                  <RotateCw size={12} /> Restart Selected
                </button>
                <button 
                  onClick={() => setStartupTypeModalTarget(getSelectedServicesList())}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-surface)] text-[var(--text)] border border-[var(--border-c)] hover:bg-[var(--border-c)] cursor-pointer"
                >
                  <Sliders size={12} /> Change Startup
                </button>
                <button onClick={() => setSelectedNames(new Set())} className="text-[var(--text-sub)] hover:text-white ml-2">
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* View Mode 1: Table */}
          {viewMode === "table" && (
            <div className="max-h-[60vh] overflow-y-auto">
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
                    <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('name')} title="Sort by Name">Name <SortIcon col="name"/></th>
                    <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('displayName')} title="Sort by Display Name">Display Name <SortIcon col="displayName"/></th>
                    <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('status')} title="Sort by Status">Status <SortIcon col="status"/></th>
                    <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('startupType')} title="Sort by Startup">Startup <SortIcon col="startupType"/></th>
                    <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('logOnAs')} title="Sort by Account">Log On As <SortIcon col="logOnAs"/></th>
                    <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('processId')} title="Sort by PID">PID <SortIcon col="processId"/></th>
                    <th className="py-2.5 w-24 text-center">Controls</th>
                  </tr>
                </thead>
                <tbody className="mono">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[var(--text-sub)]">
                        No services match filter criteria
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => {
                      const isRowSel = selected?.name === s.name;
                      const isCheckSel = selectedNames.has(s.name);
                      const isRunning = s.status.toLowerCase() === "running";

                      return (
                        <tr 
                          key={s.name} 
                          onClick={() => setSelected(s)}
                          className={`cursor-pointer border-b border-[var(--border-dim)] transition-colors ${
                            isRowSel 
                              ? "bg-[var(--amber-low)]/40 hover:bg-[var(--amber-low)]/50" 
                              : "hover:bg-[var(--amber-low)]/10"
                          }`}
                        >
                          <td className={"px-3 py-2.5 transition-colors " + (isRowSel ? "border-l-2 border-[var(--amber)]" : "border-l-2 border-transparent")} onClick={e => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isCheckSel} 
                              onChange={() => {
                                const n = new Set(selectedNames);
                                isCheckSel ? n.delete(s.name) : n.add(s.name);
                                setSelectedNames(n);
                              }} 
                              className="accent-[var(--amber)] cursor-pointer" 
                            />
                          </td>
                          <td className="text-[var(--text)] font-bold flex items-center gap-2 py-2.5">
                            {s.category === "Security" ? <Shield size={13} className="text-[var(--crit)]" /> : s.category === "Networking" ? <Network size={13} className="text-[var(--teal)]" /> : s.category === "Database / App" ? <Database size={13} className="text-[var(--amber)]" /> : <Terminal size={13} className="text-[var(--text-sub)]" />}
                            <span className="truncate max-w-[140px]" title={s.name}>{s.name}</span>
                          </td>
                          <td className="text-[var(--text-sub)] truncate max-w-[200px]" title={s.displayName}>{s.displayName}</td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-[var(--teal)] animate-pulse" : "bg-[var(--crit)]"}`} />
                              <StatusBadge status={isRunning ? 'online' : s.status.toLowerCase() === 'stopped' ? 'offline' : 'warning'} label={s.status} />
                            </div>
                          </td>
                          <td className="text-[var(--text-sub)] font-medium">{s.startupType}</td>
                          <td className="text-[var(--text-sub)] truncate max-w-[130px]" title={s.logOnAs}>{s.logOnAs}</td>
                          <td className="text-[var(--amber)] font-bold">{s.processId || "—"}</td>
                          <td className="py-2.5 px-2 text-center" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              {isRunning ? (
                                <button 
                                  onClick={() => setActionTarget({ action: "stop", services: [s] })}
                                  disabled={s.acceptStop === false}
                                  className="p-1 rounded text-[var(--text-sub)] hover:text-[var(--crit)] hover:bg-[var(--crit)]/10 disabled:opacity-30"
                                  title="Stop Service"
                                >
                                  <Square size={13} />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => setActionTarget({ action: "start", services: [s] })}
                                  className="p-1 rounded text-[var(--text-sub)] hover:text-[var(--teal)] hover:bg-[var(--teal)]/10"
                                  title="Start Service"
                                >
                                  <Play size={13} />
                                </button>
                              )}
                              <button 
                                onClick={() => setActionTarget({ action: "restart", services: [s] })}
                                disabled={!isRunning || s.acceptStop === false}
                                className="p-1 rounded text-[var(--text-sub)] hover:text-[var(--amber)] hover:bg-[var(--amber-low)] disabled:opacity-30"
                                title="Restart Service"
                              >
                                <RotateCw size={13} />
                              </button>
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

          {/* View Mode 2: Grouped */}
          {viewMode === "grouped" && (
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
              {Object.entries(groupedServices).map(([category, items]) => {
                if (items.length === 0) return null;
                const runningCount = items.filter(i => i.status.toLowerCase() === "running").length;

                return (
                  <div key={category} className="border border-[var(--border-c)] rounded-xl overflow-hidden bg-[var(--bg-void)]">
                    <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-c)]">
                      <div className="flex items-center gap-2 font-bold text-xs text-[var(--text)]">
                        <Layers size={14} className="text-[var(--amber)]" />
                        <span>{category}</span>
                        <span className="text-[var(--text-sub)] font-normal">({items.length})</span>
                      </div>
                      <span className="mono text-xs text-[var(--teal)] font-bold">
                        {runningCount} / {items.length} Active
                      </span>
                    </div>

                    <div className="divide-y divide-[var(--border-dim)] mono text-xs">
                      {items.map(s => {
                        const isRunning = s.status.toLowerCase() === "running";
                        return (
                          <div 
                            key={s.name} 
                            onClick={() => setSelected(s)}
                            className="flex items-center justify-between p-3 hover:bg-[var(--amber-low)]/10 transition-colors cursor-pointer"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                                <span>{s.displayName}</span>
                                <span className="text-[10px] text-[var(--amber)] font-mono">({s.name})</span>
                              </div>
                              <p className="text-[11px] text-[var(--text-sub)] line-clamp-1 max-w-md">{s.description}</p>
                            </div>

                            <div className="flex items-center gap-4">
                              <StatusBadge status={isRunning ? 'online' : 'offline'} label={s.status} />
                              <span className="text-[10px] text-[var(--text-sub)]">{s.startupType}</span>
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                {isRunning ? (
                                  <button onClick={() => setActionTarget({ action: "stop", services: [s] })} className="p-1 hover:text-[var(--crit)]"><Square size={13} /></button>
                                ) : (
                                  <button onClick={() => setActionTarget({ action: "start", services: [s] })} className="p-1 hover:text-[var(--teal)]"><Play size={13} /></button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Bar */}
          <div className="mono flex flex-wrap items-center justify-between border-t border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs text-[var(--text-sub)]">
            <span>Showing: <strong className="text-[var(--text)]">{filtered.length}</strong> / {services.length} services</span>
            <span>Active: <strong className="text-[var(--teal)]">{stats.running}</strong> · Stopped: <strong className="text-[var(--crit)]">{stats.stopped}</strong></span>
          </div>
        </div>

        {/* Right Section: Detailed Inspector Sidebar */}
        <aside className="nx-card p-5 overflow-y-auto space-y-5 border border-[var(--border-c)] max-h-[calc(100vh-210px)] sticky top-4">
          {selected ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="eyebrow">Service Inspector</span>
                  <StatusBadge status={selected.status.toLowerCase() === 'running' ? 'online' : selected.status.toLowerCase() === 'stopped' ? 'offline' : 'warning'} label={selected.status} />
                </div>
                <h3 className="display text-base font-bold text-[var(--text)]">{selected.displayName}</h3>
                <div className="mono text-xs text-[var(--amber)] font-semibold mt-0.5">{selected.name}</div>
              </div>

              {/* Description */}
              <p className="text-xs leading-relaxed text-[var(--text-sub)] bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-c)]">
                {selected.description || "No service description provided by provider."}
              </p>

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="eyebrow">Lifecycle Actions</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setActionTarget({ action: "start", services: [selected] })}
                    disabled={actionLoading || selected.status === "Running"}
                    className="mono flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-[var(--teal)]/40 bg-[var(--teal)]/10 text-[var(--teal)] hover:bg-[var(--teal)]/20 text-xs font-bold disabled:opacity-30 cursor-pointer"
                  >
                    <Play size={13} /> Start
                  </button>
                  <button
                    onClick={() => setActionTarget({ action: "stop", services: [selected] })}
                    disabled={actionLoading || selected.status === "Stopped" || selected.acceptStop === false}
                    className="mono flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-[var(--crit)]/40 bg-[var(--crit)]/10 text-[var(--crit)] hover:bg-[var(--crit)]/20 text-xs font-bold disabled:opacity-30 cursor-pointer"
                  >
                    <Square size={13} /> Stop
                  </button>
                  <button
                    onClick={() => setActionTarget({ action: "restart", services: [selected] })}
                    disabled={actionLoading || selected.status === "Stopped" || selected.acceptStop === false}
                    className="mono flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-[var(--amber)]/40 bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 text-xs font-bold disabled:opacity-30 cursor-pointer"
                  >
                    <RotateCw size={13} /> Restart
                  </button>
                </div>
              </div>

              {/* Startup Type Configurator */}
              <div className="space-y-2">
                <div className="eyebrow">Startup Configuration</div>
                <div className="flex items-center gap-2">
                  <select
                    value={selected.startupType}
                    onChange={(e) => {
                      setNewStartupType(e.target.value);
                      setStartupTypeModalTarget([selected]);
                    }}
                    className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--text)] focus:border-[var(--amber)] focus:outline-none cursor-pointer"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Automatic (Delayed Start)">Automatic (Delayed Start)</option>
                    <option value="Manual">Manual</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              </div>

              {/* Executable Path */}
              <div className="space-y-1.5">
                <div className="eyebrow">Path to Executable</div>
                <div className="flex items-center justify-between gap-2 bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border-c)] text-xs mono">
                  <span className="text-[var(--text)] break-all max-h-20 overflow-y-auto">{selected.pathName || "N/A"}</span>
                  {selected.pathName && (
                    <button onClick={() => copyToClipboard(selected.pathName!, "Path")} className="p-1 text-[var(--text-sub)] hover:text-white" title="Copy Path">
                      <Copy size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-c)] text-xs mono">
                <div>
                  <span className="text-[var(--text-sub)] block text-[10px] uppercase">Process ID (PID)</span>
                  <span className="text-[var(--amber)] font-bold">{selected.processId || "None"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-sub)] block text-[10px] uppercase">Log On As</span>
                  <span className="text-[var(--text)] truncate block" title={selected.logOnAs}>{selected.logOnAs}</span>
                </div>
                <div>
                  <span className="text-[var(--text-sub)] block text-[10px] uppercase">Can Stop</span>
                  <span className={selected.acceptStop !== false ? "text-[var(--teal)] font-bold" : "text-[var(--crit)] font-bold"}>
                    {selected.acceptStop !== false ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-sub)] block text-[10px] uppercase">Can Pause</span>
                  <span className={selected.acceptPause ? "text-[var(--teal)] font-bold" : "text-[var(--text-sub)]"}>
                    {selected.acceptPause ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              {/* Dependencies */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-c)]">
                <div className="eyebrow">Service Dependencies</div>
                {selected.dependencies && selected.dependencies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mono text-[11px]">
                    {selected.dependencies.map(dep => (
                      <span key={dep} className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-c)] text-[var(--text-sub)] font-medium">
                        {dep}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-sub)] mono">No external service dependencies required.</p>
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-[var(--text-sub)] space-y-2">
              <Info size={24} className="mx-auto text-[var(--text-sub)] opacity-50" />
              <p>Select any service to inspect properties, configure startup policy, or manage lifecycle.</p>
            </div>
          )}
        </aside>
      </div>

      {/* Confirmation Modal */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className={`flex items-center justify-between border-b px-5 py-4 ${
              actionTarget.action === 'start' ? 'border-[var(--teal)]/30 bg-[var(--teal)]/10 text-[var(--teal)]' : 'border-[var(--crit)]/30 bg-[var(--crit)]/10 text-[var(--crit)]'
            }`}>
              <div className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                Confirm Service {actionTarget.action}
              </div>
              <button onClick={() => setActionTarget(null)} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-xs text-[var(--text)]">
                Are you sure you want to <strong>{actionTarget.action}</strong> {actionTarget.services.length} service(s)?
              </p>

              <div className="bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-c)] max-h-32 overflow-y-auto mono text-[11px] text-[var(--text-sub)] space-y-1">
                {actionTarget.services.map(s => (
                  <div key={s.name} className="flex justify-between">
                    <span>• {s.displayName}</span>
                    <span className="text-[var(--amber)]">({s.name})</span>
                  </div>
                ))}
              </div>

              {actionTarget.action !== "start" && (
                <div className="bg-[var(--crit)]/10 border border-[var(--crit)]/30 p-3 rounded-xl text-[11px] text-[var(--crit)] flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>WARNING: Stopping critical services may affect dependent domain features or remote connectivity.</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setActionTarget(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-white">Cancel</button>
                <button 
                  onClick={handleActionConfirm} 
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-black transition-colors ${
                    actionTarget.action === 'start' ? 'bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-black' : 'bg-[var(--crit)] text-white hover:bg-[var(--crit-hover)]'
                  }`}
                >
                  Confirm {actionTarget.action}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Startup Type Change Modal */}
      {startupTypeModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-5 py-4">
              <div className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                <Sliders size={16} className="text-[var(--amber)]" /> Configure Startup Type
              </div>
              <button onClick={() => setStartupTypeModalTarget(null)} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-[var(--text)]">
                Select the new startup policy for {startupTypeModalTarget.length} selected service(s):
              </p>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-2">Startup Type</label>
                <select
                  value={newStartupType}
                  onChange={(e) => setNewStartupType(e.target.value)}
                  className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none mono"
                >
                  <option value="Automatic">Automatic (Starts at OS Boot)</option>
                  <option value="Automatic (Delayed Start)">Automatic (Delayed Start)</option>
                  <option value="Manual">Manual (Started on demand)</option>
                  <option value="Disabled">Disabled (Prevented from starting)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setStartupTypeModalTarget(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-white">Cancel</button>
                <button onClick={handleStartupTypeChange} className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)]">Apply Startup Policy</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </PageWrapper>
  );
}
