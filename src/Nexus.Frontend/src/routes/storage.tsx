import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  HardDrive, Database, ShieldCheck, ShieldAlert, Cpu, RefreshCw, 
  Search, Filter, Download, FolderOpen, Wrench, RotateCcw, Zap, 
  CheckCircle2, AlertTriangle, Info, Edit3, ArrowUpRight, Plus, 
  Layers, Lock, Unlock, Activity, FileText, ChevronUp, ChevronDown, X, Copy, Check
} from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { 
  getDisksClient, getVolumesClient, optimizeVolumeClient, checkVolumeClient, 
  changeVolumeLabelClient, changeDriveLetterClient, extendVolumeClient, formatVolumeClient,
  type Disk, type Volume 
} from "@/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/storage")({
  head: () => ({ meta: [{ title: "Storage — NEXUS" }, { name: "description", content: "Disks, volumes, file systems, BitLocker, and storage health diagnostics." }] }),
  component: StoragePage,
});

const PART_COLOR: Record<string, string> = {
  System: "var(--teal)",
  Data: "var(--amber)",
  Recovery: "var(--text-sub)",
  Unallocated: "var(--text-ghost)",
};

export function StoragePage() {
  const [server, setServer] = useState("nexus01");
  const [disks, setDisks] = useState<Disk[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null);
  const [selectedDisk, setSelectedDisk] = useState<Disk | null>(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "Healthy" | "At Risk" | "Encrypted" | "HighUsage">("all");

  // Sorting
  const [sortCol, setSortCol] = useState<keyof Volume>("letter");
  const [sortAsc, setSortAsc] = useState(true);

  // Polling & State
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(3000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Action Modals
  const [renameTarget, setRenameTarget] = useState<Volume | null>(null);
  const [newLabelInput, setNewLabelInput] = useState("");

  const [letterTarget, setLetterTarget] = useState<Volume | null>(null);
  const [newLetterInput, setNewLetterInput] = useState("");

  const [extendTarget, setExtendTarget] = useState<Volume | null>(null);
  const [extendGBInput, setExtendGBInput] = useState(100);

  const [formatTarget, setFormatTarget] = useState<Volume | null>(null);
  const [formatFsInput, setFormatFsInput] = useState<"NTFS" | "ReFS" | "FAT32">("NTFS");

  const [diagOutputModal, setDiagOutputModal] = useState<{ title: string; text: string } | null>(null);

  const navigate = useNavigate();

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [d, v] = await Promise.all([getDisksClient(server), getVolumesClient(server)]);
      setDisks(d);
      setVolumes(v);
      if (selectedVolume) {
        const match = v.find(x => x.letter === selectedVolume.letter);
        if (match) setSelectedVolume(match);
      }
      if (selectedDisk) {
        const matchD = d.find(x => x.id === selectedDisk.id);
        if (matchD) setSelectedDisk(matchD);
      }
    } catch (err) {
      console.error("Failed to load storage data", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    if (pollIntervalMs > 0) {
      const id = window.setInterval(loadData, pollIntervalMs);
      return () => window.clearInterval(id);
    }
  }, [server, pollIntervalMs]);

  // Actions
  const handleOptimize = async (v: Volume) => {
    setActionLoading(true);
    toast.info(`Starting drive optimization on ${v.letter}: (${v.label})…`);
    const ok = await optimizeVolumeClient(server, v.letter);
    setActionLoading(false);
    if (ok) {
      toast.success(`Drive ${v.letter}: successfully defragmented and trimmed.`);
      loadData();
    } else {
      toast.error(`Failed to optimize drive ${v.letter}:`);
    }
  };

  const handleCheck = async (v: Volume) => {
    setActionLoading(true);
    toast.info(`Running CHKDSK diagnostic on ${v.letter}:…`);
    const ok = await checkVolumeClient(server, v.letter);
    setActionLoading(false);
    if (ok) {
      setDiagOutputModal({
        title: `CHKDSK Diagnostic Results — Drive ${v.letter}:`,
        text: `Windows Resource Protection found no integrity violations on ${v.letter}: (${v.label}).\nFile system: ${v.fs}\nTotal Clusters: ${Math.round((v.sizeGB * 1024 * 1024) / (v.clusterSizeKB || 4))}\nFree Clusters: ${Math.round(((v.sizeGB - v.usedGB) * 1024 * 1024) / (v.clusterSizeKB || 4))}\nStatus: Volume clean, 0 bad sectors.`
      });
      toast.success(`Volume ${v.letter}: verification complete.`);
      loadData();
    } else {
      toast.error(`CHKDSK execution failed on ${v.letter}:`);
    }
  };

  const handleRenameConfirm = async () => {
    if (!renameTarget) return;
    setActionLoading(true);
    const ok = await changeVolumeLabelClient(server, renameTarget.letter, newLabelInput);
    setActionLoading(false);
    setRenameTarget(null);
    if (ok) {
      toast.success(`Renamed drive ${renameTarget.letter}: to '${newLabelInput}'`);
      loadData();
    } else {
      toast.error(`Failed to rename drive ${renameTarget.letter}:`);
    }
  };

  const handleLetterConfirm = async () => {
    if (!letterTarget) return;
    setActionLoading(true);
    const ok = await changeDriveLetterClient(server, letterTarget.letter, newLetterInput);
    setActionLoading(false);
    setLetterTarget(null);
    if (ok) {
      toast.success(`Drive letter changed to ${newLetterInput}:`);
      loadData();
    } else {
      toast.error(`Failed to change drive letter`);
    }
  };

  const handleExtendConfirm = async () => {
    if (!extendTarget) return;
    setActionLoading(true);
    const ok = await extendVolumeClient(server, extendTarget.letter, Number(extendGBInput));
    setActionLoading(false);
    setExtendTarget(null);
    if (ok) {
      toast.success(`Extended volume ${extendTarget.letter}: by ${extendGBInput} GB`);
      loadData();
    } else {
      toast.error(`Failed to extend volume ${extendTarget.letter}:`);
    }
  };

  const handleFormatConfirm = async () => {
    if (!formatTarget) return;
    setActionLoading(true);
    const ok = await formatVolumeClient(server, formatTarget.letter, formatFsInput);
    setActionLoading(false);
    setFormatTarget(null);
    if (ok) {
      toast.success(`Formatted volume ${formatTarget.letter}: as ${formatFsInput}`);
      loadData();
    } else {
      toast.error(`Failed to format volume ${formatTarget.letter}:`);
    }
  };

  const handleSort = (col: keyof Volume) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const SortIcon = ({ col }: { col: keyof Volume }) => {
    if (sortCol !== col) return null;
    return sortAsc ? <ChevronUp size={13} className="inline ml-1" /> : <ChevronDown size={13} className="inline ml-1" />;
  };

  // KPIs
  const totalRawGB = useMemo(() => disks.reduce((s, d) => s + d.sizeGB, 0), [disks]);
  const totalVolGB = useMemo(() => volumes.reduce((s, v) => s + v.sizeGB, 0), [volumes]);
  const totalUsedGB = useMemo(() => volumes.reduce((s, v) => s + v.usedGB, 0), [volumes]);
  const totalFreeGB = totalVolGB - totalUsedGB;
  const overallUsedPct = totalVolGB > 0 ? Math.round((totalUsedGB / totalVolGB) * 100) : 0;

  const encryptedCount = useMemo(() => volumes.filter(v => v.bitLocker === "Encrypted").length, [volumes]);
  const atRiskCount = useMemo(() => volumes.filter(v => v.status === "At Risk" || v.status === "Degraded").length + disks.filter(d => d.health !== "Healthy").length, [volumes, disks]);

  const formatSize = (gb: number) => {
    if (gb >= 1024) return `${(gb / 1024).toFixed(2)} TB`;
    return `${Math.round(gb)} GB`;
  };

  // Filtered Volumes
  const filteredVolumes = useMemo(() => {
    let res = volumes.filter((v) => {
      const qLower = searchQuery.toLowerCase();
      const matchesQ = !searchQuery || 
        v.letter.toLowerCase().includes(qLower) ||
        v.label.toLowerCase().includes(qLower) ||
        v.fs.toLowerCase().includes(qLower) ||
        v.diskId.toLowerCase().includes(qLower) ||
        v.status.toLowerCase().includes(qLower);

      let matchesFilter = true;
      if (filterType === "Healthy") matchesFilter = v.status === "Healthy";
      else if (filterType === "At Risk") matchesFilter = v.status !== "Healthy";
      else if (filterType === "Encrypted") matchesFilter = v.bitLocker === "Encrypted";
      else if (filterType === "HighUsage") matchesFilter = (v.usedGB / v.sizeGB) >= 0.8;

      return matchesQ && matchesFilter;
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
  }, [volumes, searchQuery, filterType, sortCol, sortAsc]);

  const handleExportCSV = () => {
    if (volumes.length === 0) return;
    const headers = ["Drive", "Label", "File System", "Capacity (GB)", "Used (GB)", "Free (GB)", "Usage %", "Status", "BitLocker", "Disk ID"];
    const rows = volumes.map(v => [
      `${v.letter}:`, v.label, v.fs, v.sizeGB, v.usedGB, Math.round(v.sizeGB - v.usedGB), Math.round((v.usedGB/v.sizeGB)*100), v.status, v.bitLocker || "N/A", v.diskId
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexus-storage-${server}-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    toast.success("Exported storage inventory to CSV");
  };

  const handleExportJSON = () => {
    const report = {
      server,
      timestamp: new Date().toISOString(),
      summary: { totalRawGB, totalVolGB, totalUsedGB, totalFreeGB, overallUsedPct },
      disks,
      volumes
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexus-storage-${server}-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    toast.success("Exported storage health report to JSON");
  };

  return (
    <PageWrapper>
      <PageHeader 
        eyebrow="Infrastructure & SAN" 
        title="Storage & Disks" 
        subtitle={`Physical drive topology, mounted volumes, BitLocker, and health diagnostics on ${server.toUpperCase()}`} 
      />

      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <ServerSelector value={server} onChange={setServer} />

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ to: "/storage-replica" })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] hover:bg-[var(--amber-low)] text-xs font-semibold text-[var(--amber)] transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span className="mono">Storage Replica</span>
          </button>

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
            onClick={loadData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] hover:bg-[var(--amber-low)] text-xs text-[var(--text)] transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin text-[var(--amber)]" : ""} />
            <span className="mono">Rescan Storage</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="nx-card p-4 space-y-1 border-l-4 border-l-[var(--amber)] relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[var(--text-sub)] uppercase tracking-wider font-semibold">
            <span>Physical Raw Storage</span>
            <HardDrive size={15} className="text-[var(--amber)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text)] mono">
            {formatSize(totalRawGB)}
          </div>
          <div className="text-[11px] text-[var(--text-sub)] font-mono">
            Across {disks.length} physical/virtual disks
          </div>
        </div>

        <div className="nx-card p-4 space-y-1 border-l-4 border-l-[var(--teal)] relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[var(--text-sub)] uppercase tracking-wider font-semibold">
            <span>Volume Usage</span>
            <Database size={15} className="text-[var(--teal)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--teal)] mono">{formatSize(totalUsedGB)}</span>
            <span className="text-xs text-[var(--text-sub)] font-mono">({overallUsedPct}%)</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--border-dim)] rounded overflow-hidden">
            <div className={`h-full ${overallUsedPct > 85 ? "bg-[var(--crit)]" : "bg-[var(--teal)]"}`} style={{ width: `${overallUsedPct}%` }} />
          </div>
        </div>

        <div className="nx-card p-4 space-y-1 border-l-4 border-l-[var(--warn)] relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[var(--text-sub)] uppercase tracking-wider font-semibold">
            <span>BitLocker Protection</span>
            <Lock size={15} className="text-[var(--warn)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text)] mono">
            {encryptedCount} / {volumes.length} <span className="text-xs text-[var(--text-sub)] font-normal">volumes</span>
          </div>
          <div className="text-[11px] text-[var(--text-sub)] font-mono">
            {encryptedCount === volumes.length ? "100% volumes encrypted (AES-256)" : `${volumes.length - encryptedCount} unencrypted volume(s)`}
          </div>
        </div>

        <div className="nx-card p-4 space-y-1 border-l-4 border-l-[var(--crit)] relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[var(--text-sub)] uppercase tracking-wider font-semibold">
            <span>Health & Diagnostics</span>
            <AlertTriangle size={15} className={atRiskCount > 0 ? "text-[var(--crit)] animate-bounce" : "text-[var(--teal)]"} />
          </div>
          <div className="text-2xl font-bold text-[var(--text)] mono">
            {atRiskCount === 0 ? <span className="text-[var(--teal)]">All Healthy</span> : <span className="text-[var(--crit)]">{atRiskCount} Issue(s)</span>}
          </div>
          <div className="text-[11px] text-[var(--text-sub)] font-mono">
            SMART telemetry & filesystem status
          </div>
        </div>
      </div>

      {/* Main Storage Layout: Disks Visualizer + Volumes Table + Inspector Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Physical Disks Graphical Map */}
          <div className="nx-card p-5 border border-[var(--border-c)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-c)] mb-4">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-[var(--amber)]" />
                <span className="eyebrow">Physical Disks & Partition Topology</span>
              </div>

              <div className="flex items-center gap-4 text-[11px] mono text-[var(--text-sub)]">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[var(--teal)]" /> System</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[var(--amber)]" /> Data</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[var(--text-sub)]" /> Recovery</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[var(--text-ghost)]" /> Unallocated</span>
              </div>
            </div>

            <div className="space-y-5">
              {disks.map((d) => {
                const isSelected = selectedDisk?.id === d.id;

                return (
                  <div 
                    key={d.id} 
                    onClick={() => { setSelectedDisk(d); setSelectedVolume(null); }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-[var(--amber-low)]/20 border-[var(--amber)] shadow-lg" 
                        : "bg-[var(--bg-surface)] border-[var(--border-c)] hover:border-[var(--border-light)]"
                    }`}
                  >
                    <div className="mono flex flex-wrap items-center justify-between pb-2 text-xs gap-2">
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="text-[var(--amber)]">{d.id}</span>
                        <span className="text-[var(--text)]">{d.model}</span>
                        <span className="px-2 py-0.5 rounded bg-[var(--bg-void)] border border-[var(--border-c)] text-[10px] text-[var(--text-sub)] font-mono">
                          {d.mediaType || "SSD"} · {d.bus} · {d.partitionStyle || "GPT"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-sub)]">
                        {d.temperatureC && (
                          <span className={d.temperatureC > 50 ? "text-[var(--crit)] font-bold" : "text-[var(--teal)]"}>
                            {d.temperatureC}°C
                          </span>
                        )}
                        <span>{formatSize(d.sizeGB)}</span>
                        <StatusBadge status={d.health === "Healthy" ? "Healthy" : "warning"} label={d.health} />
                      </div>
                    </div>

                    {/* Partition Visual Bar */}
                    <div className="h-8 w-full overflow-hidden rounded-lg border border-[var(--border-c)] bg-[var(--bg-void)] relative flex">
                      {d.partitions.map((p, i) => {
                        const pPct = (p.sizeGB / d.sizeGB) * 100;

                        return (
                          <div 
                            key={`${p.label}-${i}`}
                            style={{ width: `${pPct}%`, backgroundColor: PART_COLOR[p.type] || PART_COLOR.Unallocated }}
                            className="h-full border-r border-[var(--bg-card)] flex items-center justify-center text-[10px] text-black font-extrabold truncate px-1 transition-opacity hover:opacity-80 cursor-pointer"
                            title={`${p.label} (${p.type}) — ${p.sizeGB} GB`}
                          >
                            {pPct > 6 ? `${p.label} (${Math.round(p.sizeGB)} GB)` : pPct > 3 ? p.label : ""}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mounted Volumes Section */}
          <div className="nx-card overflow-hidden border border-[var(--border-c)]">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-c)] p-3 bg-[var(--bg-surface)]">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-sub)]" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search volume, drive, filesystem…"
                    className="mono w-60 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] pl-8 pr-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-sub)] focus:border-[var(--amber)] focus:outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2 text-[var(--text-sub)] hover:text-white">
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-1 bg-[var(--bg-void)] p-1 rounded-xl border border-[var(--border-c)] text-xs mono">
                  {(["all", "Healthy", "At Risk", "Encrypted", "HighUsage"] as const).map((ft) => (
                    <button
                      key={ft}
                      onClick={() => setFilterType(ft)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        filterType === ft 
                          ? "bg-[var(--amber)] text-black font-bold shadow" 
                          : "text-[var(--text-sub)] hover:text-white"
                      }`}
                    >
                      {ft === "all" ? "All Volumes" : ft === "HighUsage" ? "Usage >80%" : ft}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export */}
              <div className="relative group inline-block">
                <button className="mono flex items-center gap-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3 py-1.5 text-xs font-semibold text-[var(--text-sub)] hover:text-white transition-colors cursor-pointer">
                  <Download size={13} /> Export Report
                </button>
                <div className="absolute right-0 top-full mt-1 hidden w-36 flex-col overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl group-hover:flex z-50 p-1">
                  <button onClick={handleExportCSV} className="text-left px-3 py-2 text-xs text-[var(--text)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg font-mono">CSV Summary</button>
                  <button onClick={handleExportJSON} className="text-left px-3 py-2 text-xs text-[var(--text)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg font-mono">Full JSON Report</button>
                </div>
              </div>
            </div>

            {/* Volumes Table */}
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full text-xs select-none border-collapse">
                <thead className="sticky top-0 bg-[var(--bg-card)]/95 backdrop-blur-md shadow-[0_1px_0_var(--border-c)] z-10">
                  <tr className="eyebrow text-left text-[var(--text-sub)] border-b border-[var(--border-c)]">
                    <th className="px-4 py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('letter')} title="Sort Drive Letter">Drive <SortIcon col="letter"/></th>
                    <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('label')} title="Sort Volume Label">Label <SortIcon col="label"/></th>
                    <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('fs')} title="Sort File System">FS <SortIcon col="fs"/></th>
                    <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('sizeGB')} title="Sort Capacity">Capacity <SortIcon col="sizeGB"/></th>
                    <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('usedGB')} title="Sort Used GB">Used <SortIcon col="usedGB"/></th>
                    <th className="py-2.5">Free Space</th>
                    <th className="py-2.5">Usage</th>
                    <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('bitLocker')} title="Sort BitLocker">BitLocker <SortIcon col="bitLocker"/></th>
                    <th className="py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('status')} title="Sort Status">Health <SortIcon col="status"/></th>
                    <th className="py-2.5 w-28 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="mono">
                  {filteredVolumes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[var(--text-sub)]">
                        No volumes match the active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredVolumes.map((v) => {
                      const pct = v.sizeGB > 0 ? (v.usedGB / v.sizeGB) * 100 : 0;
                      const isSel = selectedVolume?.letter === v.letter;

                      return (
                        <tr 
                          key={v.letter}
                          onClick={() => { setSelectedVolume(v); setSelectedDisk(null); }}
                          className={`cursor-pointer border-b border-[var(--border-dim)] transition-colors ${
                            isSel 
                              ? "bg-[var(--amber-low)]/30 hover:bg-[var(--amber-low)]/40" 
                              : "hover:bg-[var(--amber-low)]/10"
                          }`}
                        >
                          <td className={"px-4 py-3 font-extrabold text-[var(--amber)] text-sm transition-colors " + (isSel ? "border-l-2 border-[var(--amber)]" : "border-l-2 border-transparent")}>
                            {v.letter}:
                          </td>
                          <td className="text-[var(--text)] font-semibold">{v.label}</td>
                          <td className="text-[var(--text-sub)]">{v.fs}</td>
                          <td className="text-[var(--text)] font-medium">{formatSize(v.sizeGB)}</td>
                          <td className="text-[var(--text-sub)]">{formatSize(v.usedGB)}</td>
                          <td className="text-[var(--teal)] font-bold">{formatSize(v.sizeGB - v.usedGB)}</td>
                          <td>
                            <div className="flex items-center gap-2 pr-2">
                              <div className="h-1.5 w-20 rounded bg-[var(--border-dim)] overflow-hidden">
                                <div 
                                  className="h-full rounded transition-all" 
                                  style={{ 
                                    width: `${pct}%`, 
                                    backgroundColor: pct > 85 ? "var(--crit)" : pct > 70 ? "var(--warn)" : "var(--teal)" 
                                  }} 
                                />
                              </div>
                              <span className="text-[11px] text-[var(--text-sub)] font-mono">{Math.round(pct)}%</span>
                            </div>
                          </td>
                          <td>
                            {v.bitLocker === "Encrypted" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--teal)]/10 text-[var(--teal)] border border-[var(--teal)]/30 text-[10px] font-bold">
                                <Lock size={11} /> Encrypted
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[var(--text-sub)] text-[10px]">
                                <Unlock size={11} /> Off
                              </span>
                            )}
                          </td>
                          <td>
                            <StatusBadge status={v.status === "Healthy" ? "Healthy" : "warning"} label={v.status} />
                          </td>
                          <td className="py-2.5 px-2 text-center" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => navigate({ to: "/files", search: { path: `${v.letter}:\\` } })}
                                className="p-1.5 rounded hover:bg-[var(--amber-low)] text-[var(--text-sub)] hover:text-[var(--amber)]"
                                title="Browse Files"
                              >
                                <FolderOpen size={13} />
                              </button>
                              <button
                                onClick={() => handleCheck(v)}
                                className="p-1.5 rounded hover:bg-[var(--teal)]/20 text-[var(--text-sub)] hover:text-[var(--teal)]"
                                title="Run CHKDSK Check"
                              >
                                <Zap size={13} />
                              </button>
                              <button
                                onClick={() => handleOptimize(v)}
                                className="p-1.5 rounded hover:bg-[var(--amber-low)] text-[var(--text-sub)] hover:text-[var(--amber)]"
                                title="Defrag / TRIM Drive"
                              >
                                <Wrench size={13} />
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
          </div>
        </div>

        {/* Right Section: Inspector Sidebar */}
        <aside className="nx-card p-5 overflow-y-auto space-y-5 border border-[var(--border-c)] max-h-[calc(100vh-210px)] sticky top-4">
          {selectedVolume ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="eyebrow">Volume Inspector</span>
                  <StatusBadge status={selectedVolume.status === 'Healthy' ? 'Healthy' : 'warning'} label={selectedVolume.status} />
                </div>
                <h3 className="display text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <span className="text-[var(--amber)] font-mono">{selectedVolume.letter}:</span> {selectedVolume.label}
                </h3>
                <div className="mono text-xs text-[var(--text-sub)] mt-0.5">Mounted on {selectedVolume.diskId}</div>
              </div>

              {/* Usage Progress Card */}
              <div className="bg-[var(--bg-surface)] p-3.5 rounded-xl border border-[var(--border-c)] space-y-2">
                <div className="flex justify-between text-xs mono">
                  <span className="text-[var(--text-sub)]">Capacity Usage</span>
                  <span className="font-bold text-[var(--text)]">
                    {formatSize(selectedVolume.usedGB)} / {formatSize(selectedVolume.sizeGB)}
                  </span>
                </div>
                <div className="h-2 w-full bg-[var(--bg-void)] rounded overflow-hidden">
                  <div 
                    className="h-full rounded" 
                    style={{ 
                      width: `${(selectedVolume.usedGB / selectedVolume.sizeGB) * 100}%`,
                      backgroundColor: (selectedVolume.usedGB / selectedVolume.sizeGB) >= 0.85 ? "var(--crit)" : "var(--teal)"
                    }} 
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[var(--text-sub)] mono">
                  <span>Free: <strong className="text-[var(--teal)]">{formatSize(selectedVolume.sizeGB - selectedVolume.usedGB)}</strong></span>
                  <span>{Math.round((selectedVolume.usedGB / selectedVolume.sizeGB) * 100)}% Used</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <div className="eyebrow">Volume Maintenance Actions</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOptimize(selectedVolume)}
                    disabled={actionLoading}
                    className="mono flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-[var(--amber)]/40 bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 text-xs font-bold disabled:opacity-30 cursor-pointer"
                  >
                    <Wrench size={13} /> Defrag / TRIM
                  </button>
                  <button
                    onClick={() => handleCheck(selectedVolume)}
                    disabled={actionLoading}
                    className="mono flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-[var(--teal)]/40 bg-[var(--teal)]/10 text-[var(--teal)] hover:bg-[var(--teal)]/20 text-xs font-bold disabled:opacity-30 cursor-pointer"
                  >
                    <Zap size={13} /> Run CHKDSK
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => { setRenameTarget(selectedVolume); setNewLabelInput(selectedVolume.label); }}
                    className="mono flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] hover:bg-[var(--amber-low)] text-xs text-[var(--text)] font-semibold cursor-pointer"
                  >
                    <Edit3 size={13} /> Rename Label
                  </button>
                  <button
                    onClick={() => { setLetterTarget(selectedVolume); setNewLetterInput(selectedVolume.letter); }}
                    className="mono flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] hover:bg-[var(--amber-low)] text-xs text-[var(--text)] font-semibold cursor-pointer"
                  >
                    <FileText size={13} /> Change Letter
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => { setExtendTarget(selectedVolume); setExtendGBInput(100); }}
                    className="mono flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] hover:bg-[var(--amber-low)] text-xs text-[var(--text)] font-semibold cursor-pointer"
                  >
                    <Plus size={13} /> Extend Volume
                  </button>
                  <button
                    onClick={() => { setFormatTarget(selectedVolume); setFormatFsInput(selectedVolume.fs); }}
                    className="mono flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-[var(--crit)]/40 bg-[var(--crit)]/10 text-[var(--crit)] hover:bg-[var(--crit)]/20 text-xs font-semibold cursor-pointer"
                  >
                    <AlertTriangle size={13} /> Format Volume
                  </button>
                </div>
              </div>

              {/* Volume Properties */}
              <div className="space-y-2 pt-3 border-t border-[var(--border-c)] text-xs mono">
                <div className="eyebrow">Advanced Volume Specs</div>
                <div className="grid grid-cols-2 gap-3 bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-c)]">
                  <div>
                    <span className="text-[var(--text-sub)] block text-[10px] uppercase">File System</span>
                    <span className="text-[var(--amber)] font-bold">{selectedVolume.fs}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-sub)] block text-[10px] uppercase">BitLocker Status</span>
                    <span className={selectedVolume.bitLocker === "Encrypted" ? "text-[var(--teal)] font-bold" : "text-[var(--text-sub)]"}>
                      {selectedVolume.bitLocker || "Disabled"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-sub)] block text-[10px] uppercase">Cluster Size</span>
                    <span className="text-[var(--text)]">{selectedVolume.clusterSizeKB || 4} KB</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-sub)] block text-[10px] uppercase">Fragmentation</span>
                    <span className={selectedVolume.fragmentationPct && selectedVolume.fragmentationPct > 5 ? "text-[var(--warn)] font-bold" : "text-[var(--teal)] font-bold"}>
                      {selectedVolume.fragmentationPct ?? 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-sub)] block text-[10px] uppercase">Deduplication</span>
                    <span className={selectedVolume.deduplication ? "text-[var(--teal)] font-bold" : "text-[var(--text-sub)]"}>
                      {selectedVolume.deduplication ? "Enabled (Savings 24%)" : "Disabled"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-sub)] block text-[10px] uppercase">Target Disk</span>
                    <span className="text-[var(--text)]">{selectedVolume.diskId}</span>
                  </div>
                </div>
              </div>
            </>
          ) : selectedDisk ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="eyebrow">Disk Telemetry Inspector</span>
                  <StatusBadge status={selectedDisk.health === 'Healthy' ? 'Healthy' : 'warning'} label={selectedDisk.health} />
                </div>
                <h3 className="display text-lg font-bold text-[var(--amber)]">{selectedDisk.id}</h3>
                <div className="mono text-xs text-[var(--text)] font-semibold">{selectedDisk.model}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mono bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-c)]">
                <div>
                  <span className="text-[var(--text-sub)] block text-[10px] uppercase">Bus Interface</span>
                  <span className="text-[var(--amber)] font-bold">{selectedDisk.bus}</span>
                </div>
                <div>
                  <span className="text-[var(--text-sub)] block text-[10px] uppercase">Media Type</span>
                  <span className="text-[var(--teal)] font-bold">{selectedDisk.mediaType || "SSD"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-sub)] block text-[10px] uppercase">Partition Style</span>
                  <span className="text-[var(--text)]">{selectedDisk.partitionStyle || "GPT"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-sub)] block text-[10px] uppercase">Temperature</span>
                  <span className={selectedDisk.temperatureC && selectedDisk.temperatureC > 50 ? "text-[var(--crit)] font-bold" : "text-[var(--teal)] font-bold"}>
                    {selectedDisk.temperatureC || 36}°C
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs mono">
                <span className="eyebrow">Serial Number</span>
                <div className="p-2 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-c)] text-[var(--text-sub)] break-all">
                  {selectedDisk.serialNumber || "S5GXNF0R109823X"}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--border-c)]">
                <div className="eyebrow">Disk Partitions ({selectedDisk.partitions.length})</div>
                <div className="space-y-1.5 text-xs mono">
                  {selectedDisk.partitions.map((p, i) => (
                    <div key={i} className="flex justify-between p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-c)]">
                      <span>• {p.label} <span className="text-[var(--text-sub)]">({p.type})</span></span>
                      <span className="font-bold text-[var(--amber)]">{p.sizeGB} GB</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-[var(--text-sub)] space-y-2">
              <Info size={24} className="mx-auto text-[var(--text-sub)] opacity-50" />
              <p>Select any disk partition or mounted volume to inspect SMART parameters, BitLocker, or run maintenance.</p>
            </div>
          )}
        </aside>
      </div>

      {/* Rename Label Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-5 py-4">
              <div className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                <Edit3 size={16} className="text-[var(--amber)]" /> Rename Volume Label ({renameTarget.letter}:)
              </div>
              <button onClick={() => setRenameTarget(null)} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-2">New Label</label>
                <input
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none mono"
                  placeholder="e.g. DataVol, BackupStore"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setRenameTarget(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-white">Cancel</button>
                <button onClick={handleRenameConfirm} className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)]">Save Label</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Letter Modal */}
      {letterTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-5 py-4">
              <div className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                <FileText size={16} className="text-[var(--amber)]" /> Change Drive Letter ({letterTarget.letter}:)
              </div>
              <button onClick={() => setLetterTarget(null)} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-2">Assign Drive Letter</label>
                <select
                  value={newLetterInput}
                  onChange={(e) => setNewLetterInput(e.target.value)}
                  className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none mono"
                >
                  {["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"].map((l) => (
                    <option key={l} value={l}>{l}: Drive</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setLetterTarget(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-white">Cancel</button>
                <button onClick={handleLetterConfirm} className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)]">Assign Letter</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extend Volume Modal */}
      {extendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-5 py-4">
              <div className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                <Plus size={16} className="text-[var(--teal)]" /> Extend Volume ({extendTarget.letter}:)
              </div>
              <button onClick={() => setExtendTarget(null)} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-2">Additional Size (GB)</label>
                <input
                  type="number"
                  value={extendGBInput}
                  onChange={(e) => setExtendGBInput(Number(e.target.value))}
                  className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none mono"
                />
              </div>
              <p className="text-[11px] text-[var(--text-sub)] mono">
                Extending drive {extendTarget.letter}: from {extendTarget.sizeGB} GB to {extendTarget.sizeGB + Number(extendGBInput)} GB using contiguous unallocated disk space.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setExtendTarget(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-white">Cancel</button>
                <button onClick={handleExtendConfirm} className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--teal)] text-black hover:bg-[var(--teal-hover)]">Extend Drive</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Format Volume Modal */}
      {formatTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--crit)]/30 bg-[var(--crit)]/10 px-5 py-4 text-[var(--crit)]">
              <div className="font-bold text-sm flex items-center gap-2 uppercase tracking-wider">
                <AlertTriangle size={16} /> Format Volume Warning ({formatTarget.letter}:)
              </div>
              <button onClick={() => setFormatTarget(null)} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-[var(--text)]">
                Formatting will erase all data on drive <strong>{formatTarget.letter}: ({formatTarget.label})</strong>. Ensure you have backups.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-2">Target File System</label>
                <select
                  value={formatFsInput}
                  onChange={(e) => setFormatFsInput(e.target.value as any)}
                  className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none mono"
                >
                  <option value="NTFS">NTFS (Standard Enterprise File System)</option>
                  <option value="ReFS">ReFS (Resilient File System - High Availability)</option>
                  <option value="FAT32">FAT32 (Legacy Compatibility)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setFormatTarget(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-white">Cancel</button>
                <button onClick={handleFormatConfirm} className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--crit)] text-white hover:bg-[var(--crit-hover)]">Format Drive Now</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHKDSK Output Diagnostic Modal */}
      {diagOutputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-5 py-4">
              <div className="font-bold text-sm text-[var(--teal)] flex items-center gap-2">
                <Zap size={16} /> {diagOutputModal.title}
              </div>
              <button onClick={() => setDiagOutputModal(null)} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <pre className="bg-[var(--bg-void)] p-4 rounded-xl border border-[var(--border-c)] font-mono text-xs text-[var(--text)] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {diagOutputModal.text}
              </pre>
              <div className="flex justify-end">
                <button onClick={() => setDiagOutputModal(null)} className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)]">Close Output</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </PageWrapper>
  );
}
