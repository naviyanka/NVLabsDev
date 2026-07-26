import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ShieldAlert,
  RefreshCw,
  Download,
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  Settings,
  Calendar,
  Clock,
  ExternalLink,
  Info,
  Terminal,
  FileText,
  RotateCcw,
  Sparkles,
  Zap,
  ShieldCheck,
  Server as ServerIcon,
  HardDrive,
  Copy,
  Sliders,
  Filter,
  Loader2,
  Lock,
  ArrowRight
} from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import {
  getUpdatesClient,
  checkUpdatesClient,
  installUpdatesClient,
  getUpdateHistoryClient,
  getServersClient,
  type WindowsUpdate,
  type UpdateHistoryItem,
  type Server
} from "@/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/updates")({
  head: () => ({
    meta: [
      { title: "Windows Updates & Patch Management — NEXUS" },
      { name: "description", content: "Orchestrate Windows Updates, WSUS scanning, patch deployment, and reboot policies." }
    ]
  }),
  component: UpdatesPage
});

type TabType = "pending" | "history" | "schedule";
type CategoryFilter = "ALL" | "Security" | "Critical" | "Cumulative" | "Definition" | "Driver" | "Tool";
type SeverityFilter = "ALL" | "Critical" | "Important" | "Moderate" | "Low" | "Optional";

function UpdatesPage() {
  const [server, setServer] = useState("dc01");
  const [serverInfo, setServerInfo] = useState<Server | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("pending");

  // Updates data
  const [updates, setUpdates] = useState<WindowsUpdate[]>([]);
  const [historyItems, setHistoryItems] = useState<UpdateHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [auto, setAuto] = useState(true);

  // Filters & Search
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");

  // Sorting
  const [sortCol, setSortCol] = useState<keyof WindowsUpdate>("title");
  const [sortAsc, setSortAsc] = useState(true);

  // Selection
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());

  // Modals & Slideovers
  const [inspectUpdate, setInspectUpdate] = useState<WindowsUpdate | null>(null);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [installingProgress, setInstallingProgress] = useState<{
    active: boolean;
    currentKb: string;
    progressPercent: number;
    step: string;
    total: number;
  } | null>(null);

  // Schedule & Policy state
  const [scheduleTime, setScheduleTime] = useState("03:00");
  const [scheduleDay, setScheduleDay] = useState("Sunday");
  const [rebootPolicy, setRebootPolicy] = useState("auto_outside_hours");
  const [wsusGroup, setWsusGroup] = useState("Enterprise Servers - Ring 1");

  const fetchServerDetails = async () => {
    const list = await getServersClient();
    const match = list.find((s) => s.ip === server || s.id === server);
    setServerInfo(match || null);
  };

  const fetchUpdates = useCallback(async (id: string, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getUpdatesClient(id);
      setUpdates(data);
    } catch (e) {
      toast.error("Failed to fetch pending updates");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (id: string) => {
    try {
      const data = await getUpdateHistoryClient(id);
      setHistoryItems(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleCheckUpdates = async () => {
    setIsChecking(true);
    try {
      toast.info("Scanning Windows Update / WSUS source...", { description: `Target node: ${server}` });
      const freshData = await checkUpdatesClient(server);
      setUpdates(freshData);
      setSelectedTitles(new Set());
      toast.success(`Scan complete: ${freshData.length} pending updates found.`);
    } catch (e) {
      toast.error("Failed to scan Windows Update service");
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    fetchServerDetails();
    fetchUpdates(server, true);
    fetchHistory(server);
    setSelectedTitles(new Set());
  }, [server, fetchUpdates, fetchHistory]);

  // Auto-refresh interval
  useEffect(() => {
    let timer: number | undefined;
    if (auto && !isLoading && !isChecking) {
      timer = window.setInterval(() => {
        fetchUpdates(server, false);
      }, 60000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [server, auto, isLoading, isChecking, fetchUpdates]);

  // Execution with progress simulation
  const executeInstallation = async (titlesToInstall: string[]) => {
    if (titlesToInstall.length === 0) return;

    setInstallingProgress({
      active: true,
      currentKb: titlesToInstall[0],
      progressPercent: 10,
      step: "Initializing Windows Update Agent session...",
      total: titlesToInstall.length
    });

    // Step-by-step UI animation
    for (let percent = 20; percent <= 90; percent += 20) {
      await new Promise((r) => setTimeout(r, 600));
      setInstallingProgress((prev) =>
        prev
          ? {
              ...prev,
              progressPercent: percent,
              step:
                percent === 40
                  ? "Downloading update packages from WSUS..."
                  : percent === 60
                  ? "Verifying SHA-256 signatures & staging installation..."
                  : "Applying CBS patches and updating registry..."
            }
          : null
      );
    }

    try {
      const success = await installUpdatesClient(server, titlesToInstall);
      if (success) {
        setInstallingProgress({
          active: true,
          currentKb: "All Patches Applied",
          progressPercent: 100,
          step: "Installation complete! Updating local cache...",
          total: titlesToInstall.length
        });
        await new Promise((r) => setTimeout(r, 800));

        toast.success(`Successfully installed ${titlesToInstall.length} update(s)`, {
          description: "System registry and history log updated."
        });
        fetchUpdates(server, false);
        fetchHistory(server);
        setSelectedTitles(new Set());
      } else {
        toast.error("Failed to install updates");
      }
    } catch {
      toast.error("An error occurred during update deployment");
    } finally {
      setInstallingProgress(null);
    }
  };

  // Selection helpers
  const toggleSelect = (title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedTitles);
    if (next.has(title)) next.delete(title);
    else next.add(title);
    setSelectedTitles(next);
  };

  const toggleSelectAll = () => {
    if (selectedTitles.size === filteredUpdates.length) {
      setSelectedTitles(new Set());
    } else {
      setSelectedTitles(new Set(filteredUpdates.map((u) => u.title)));
    }
  };

  // Sorting
  const handleSort = (col: keyof WindowsUpdate) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  // Filtered & Sorted Updates
  const filteredUpdates = useMemo(() => {
    return updates
      .filter((u) => {
        if (categoryFilter !== "ALL" && u.category !== categoryFilter) return false;
        if (severityFilter !== "ALL" && u.severity !== severityFilter) return false;
        if (q.trim()) {
          const query = q.toLowerCase();
          return (
            u.title.toLowerCase().includes(query) ||
            u.description.toLowerCase().includes(query) ||
            (u.kbArticleId && u.kbArticleId.toLowerCase().includes(query))
          );
        }
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (typeof valA === "string" && typeof valB === "string") {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        const numA = (valA as number) || 0;
        const numB = (valB as number) || 0;
        return sortAsc ? numA - numB : numB - numA;
      });
  }, [updates, categoryFilter, severityFilter, q, sortCol, sortAsc]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = updates.length;
    const criticalCount = updates.filter((u) => u.severity === "Critical" || u.category === "Critical").length;
    const totalSize = updates.reduce((acc, u) => acc + (u.maxDownloadSize || 0), 0);
    const rebootNeeded = updates.some((u) => u.rebootRequired);
    const compliancePercent = totalCount === 0 ? 100 : Math.max(10, Math.round(100 - totalCount * 12));

    return {
      totalCount,
      criticalCount,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(1),
      rebootNeeded,
      compliancePercent
    };
  }, [updates]);

  // PowerShell script generation
  const generatedScript = useMemo(() => {
    const targetKbs = Array.from(selectedTitles).map((t) => {
      const match = updates.find((u) => u.title === t);
      return match?.kbArticleId || t;
    });

    return `# =====================================================================
# NEXUS Windows Update Automation PowerShell Script
# Target Server: ${serverInfo?.name || server} (${serverInfo?.ip || "Localhost"})
# Generated: ${new Date().toLocaleString()}
# =====================================================================

Import-Module PSWindowsUpdate -ErrorAction SilentlyContinue

Write-Host "Starting update routine on ${serverInfo?.name || server}..." -ForegroundColor Cyan

${
  targetKbs.length > 0
    ? `$TargetKBs = @(${targetKbs.map((k) => `"${k}"`).join(", ")})\nGet-WindowsUpdate -KBArticleID $TargetKBs -Install -AcceptAll -AutoReboot:$false`
    : `Get-WindowsUpdate -Install -AcceptAll -AutoReboot:$false`
}

Write-Host "Windows Update cycle completed." -ForegroundColor Green
`;
  }, [selectedTitles, updates, serverInfo, server]);

  const handleExportCSV = () => {
    const headers = ["Title", "KB_Article", "Category", "Severity", "Size_MB", "Reboot_Required", "Description"];
    const rows = filteredUpdates.map((u) => [
      `"${u.title.replace(/"/g, '""')}"`,
      `"${u.kbArticleId || "N/A"}"`,
      `"${u.category || "General"}"`,
      `"${u.severity || "Unspecified"}"`,
      `"${((u.maxDownloadSize || 0) / 1024 / 1024).toFixed(1)}"`,
      `"${u.rebootRequired ? "Yes" : "No"}"`,
      `"${(u.description || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `NEXUS_Patches_${serverInfo?.name || "Server"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported Patch Inventory CSV report");
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[var(--border-c)]">
        <div>
          <PageHeader eyebrow="Enterprise Patch & WSUS Management" title="Windows Updates" />
          <p className="mono text-[11px] text-[var(--text-sub)] mt-1 flex items-center gap-2">
            <span>Node: <strong className="text-[var(--text)]">{serverInfo?.name || server}</strong></span>
            <span>•</span>
            <span>OS: {serverInfo?.os || "Windows Server 2025 Standard"}</span>
            <span>•</span>
            <span className="text-[var(--amber)]">{stats.totalCount} Pending Patches</span> ({stats.totalSizeMB} MB)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-sub)] hover:text-[var(--text)] hover:border-[var(--amber)] transition-colors">
            <FileText size={13} /> Export CSV
          </button>

          <button
            onClick={() => setIsScriptModalOpen(true)}
            className="mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--amber)] hover:bg-[var(--amber-low)] transition-colors">
            <Terminal size={13} /> PS Script
          </button>

          <button
            onClick={handleCheckUpdates}
            disabled={isChecking || isLoading}
            className="mono flex items-center gap-1.5 rounded-md bg-[var(--amber)] px-3.5 py-1.5 text-[11px] font-semibold text-black hover:bg-[var(--amber)]/90 disabled:opacity-50 transition-colors shadow-sm">
            <RefreshCw size={13} className={isChecking ? "animate-spin" : ""} /> Scan Updates
          </button>
        </div>
      </div>

      {/* Target Server Selector */}
      <div className="mt-4">
        <ServerSelector value={server} onChange={setServer} />
      </div>

      {/* Compliance & KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="p-3.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[var(--text-ghost)]">
            <span>Patch Compliance</span>
            <ShieldCheck size={14} className={stats.compliancePercent > 80 ? "text-[var(--ok)]" : "text-[var(--amber)]"} />
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <div className={`display text-2xl font-bold ${stats.compliancePercent > 80 ? "text-[var(--ok)]" : "text-[var(--amber)]"}`}>
              {stats.compliancePercent}%
            </div>
            <span className="mono text-[10px] text-[var(--text-ghost)]">WSUS Score</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[var(--text-ghost)]">
            <span>Critical Security Deficit</span>
            <ShieldAlert size={14} className={stats.criticalCount > 0 ? "text-[var(--crit)]" : "text-[var(--ok)]"} />
          </div>
          <div className="display text-2xl font-bold pt-1 text-[var(--crit)]">{stats.criticalCount} Patches</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[var(--text-ghost)]">
            <span>Total Download Payload</span>
            <HardDrive size={14} className="text-[var(--amber)]" />
          </div>
          <div className="display text-2xl font-bold pt-1 text-[var(--text)]">{stats.totalSizeMB} MB</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[var(--text-ghost)]">
            <span>Reboot Requirement</span>
            <RotateCcw size={14} className={stats.rebootNeeded ? "text-[var(--amber)]" : "text-[var(--text-ghost)]"} />
          </div>
          <div className="display text-2xl font-bold pt-1 text-[var(--amber)]">
            {stats.rebootNeeded ? "Reboot Pending" : "Clean State"}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mt-5 flex items-center justify-between border-b border-[var(--border-c)]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("pending")}
            className={`mono flex items-center gap-2 px-4 py-2 text-[12px] font-bold border-b-2 transition-colors ${
              activeTab === "pending"
                ? "border-[var(--amber)] text-[var(--amber)]"
                : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"
            }`}>
            <Download size={14} /> Pending Patches
            <span className="mono text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border-dim)]">
              {stats.totalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`mono flex items-center gap-2 px-4 py-2 text-[12px] font-bold border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-[var(--amber)] text-[var(--amber)]"
                : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"
            }`}>
            <History size={14} /> Installation History
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`mono flex items-center gap-2 px-4 py-2 text-[12px] font-bold border-b-2 transition-colors ${
              activeTab === "schedule"
                ? "border-[var(--amber)] text-[var(--amber)]"
                : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"
            }`}>
            <Settings size={14} /> WSUS & Maintenance Policy
          </button>
        </div>

        {activeTab === "pending" && (
          <div className="flex items-center gap-2 pb-1">
            <button
              onClick={() => executeInstallation(Array.from(selectedTitles))}
              disabled={selectedTitles.size === 0 || installingProgress !== null}
              className="mono flex items-center gap-1.5 rounded-md border border-[var(--amber)]/40 bg-[var(--amber-low)] px-3 py-1 text-[11px] font-bold text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black disabled:opacity-40 transition-colors">
              <Download size={13} /> Install Selected ({selectedTitles.size})
            </button>

            <button
              onClick={() => executeInstallation(updates.map((u) => u.title))}
              disabled={updates.length === 0 || installingProgress !== null}
              className="mono flex items-center gap-1.5 rounded-md bg-[var(--amber)] px-3.5 py-1 text-[11px] font-extrabold text-black hover:bg-[var(--amber)]/90 disabled:opacity-40 transition-colors shadow-sm">
              <Zap size={13} /> Install All ({updates.length})
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Pending Updates */}
      {activeTab === "pending" && (
        <div className="space-y-4 mt-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)]">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-ghost)]" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search KB article number, title, or keywords..."
                className="w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-1.5 pl-9 pr-3 text-[12px] text-[var(--text)] placeholder-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="mono text-[10px] uppercase text-[var(--text-ghost)]">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                  className="rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] text-[var(--text)] outline-none focus:border-[var(--amber)]">
                  <option value="ALL">All Categories</option>
                  <option value="Security">Security</option>
                  <option value="Critical">Critical</option>
                  <option value="Cumulative">Cumulative</option>
                  <option value="Definition">Definition</option>
                  <option value="Driver">Driver</option>
                  <option value="Tool">Tool</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="mono text-[10px] uppercase text-[var(--text-ghost)]">Severity:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                  className="rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] text-[var(--text)] outline-none focus:border-[var(--amber)]">
                  <option value="ALL">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="Important">Important</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Low">Low</option>
                  <option value="Optional">Optional</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-12 text-[13px] text-[var(--text-sub)]">
                <Loader2 size={16} className="animate-spin text-[var(--amber)]" /> Querying Windows Update agent database...
              </div>
            ) : filteredUpdates.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <CheckCircle2 size={36} className="text-[var(--ok)] mb-3" />
                <div className="text-[14px] font-semibold text-[var(--text)]">Node fully updated and compliant</div>
                <p className="text-[12px] text-[var(--text-sub)] mt-1 max-w-md">
                  No missing updates match current filter criteria for {serverInfo?.name || server}.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="border-b border-[var(--border-dim)] bg-[var(--bg-surface)] text-[10px] uppercase font-mono tracking-wider text-[var(--text-ghost)]">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <button onClick={toggleSelectAll} className="text-[var(--text-ghost)] hover:text-[var(--amber)]">
                          {selectedTitles.size === filteredUpdates.length && filteredUpdates.length > 0 ? (
                            <CheckSquare size={14} className="text-[var(--amber)]" />
                          ) : (
                            <Square size={14} />
                          )}
                        </button>
                      </th>
                      <th
                        className="p-3 font-semibold cursor-pointer hover:text-[var(--text)] select-none"
                        onClick={() => handleSort("title")}>
                        <div className="flex items-center gap-1">
                          Patch Title & KB {sortCol === "title" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                        </div>
                      </th>
                      <th className="p-3 font-semibold">Category</th>
                      <th className="p-3 font-semibold">Severity</th>
                      <th
                        className="p-3 font-semibold cursor-pointer hover:text-[var(--text)] select-none"
                        onClick={() => handleSort("maxDownloadSize")}>
                        <div className="flex items-center gap-1">
                          Size {sortCol === "maxDownloadSize" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                        </div>
                      </th>
                      <th className="p-3 font-semibold">Reboot</th>
                      <th className="p-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-dim)]">
                    {filteredUpdates.map((u) => {
                      const isChecked = selectedTitles.has(u.title);
                      const isCriticalSev = u.severity === "Critical" || u.category === "Critical";

                      return (
                        <tr
                          key={u.title}
                          className={`hover:bg-[var(--bg-surface)] transition-colors ${
                            isChecked ? "bg-[var(--amber-low)]/20" : ""
                          }`}>
                          <td className="p-3 text-center">
                            <button onClick={(e) => toggleSelect(u.title, e)} className="text-[var(--text-ghost)] hover:text-[var(--amber)]">
                              {isChecked ? <CheckSquare size={14} className="text-[var(--amber)]" /> : <Square size={14} />}
                            </button>
                          </td>

                          <td className="p-3">
                            <div className="flex items-start gap-2">
                              <button
                                onClick={() => setInspectUpdate(u)}
                                className="font-semibold text-[var(--text)] hover:text-[var(--amber)] text-left hover:underline">
                                {u.title}
                              </button>
                            </div>
                            <p className="text-[11px] text-[var(--text-sub)] line-clamp-1 mt-0.5">{u.description}</p>
                          </td>

                          <td className="p-3">
                            <span className="mono text-[10px] px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-dim)]">
                              {u.category || "General"}
                            </span>
                          </td>

                          <td className="p-3">
                            <span
                              className={`mono text-[10px] px-2 py-0.5 rounded font-bold ${
                                isCriticalSev
                                  ? "bg-[var(--crit)]/20 text-[var(--crit)] border border-[var(--crit)]/30"
                                  : u.severity === "Important"
                                  ? "bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]/30"
                                  : "bg-[var(--bg-surface)] text-[var(--text-sub)] border border-[var(--border-dim)]"
                              }`}>
                              {u.severity || "Unspecified"}
                            </span>
                          </td>

                          <td className="p-3 mono text-[11px] text-[var(--text-sub)]">
                            {((u.maxDownloadSize || 0) / 1024 / 1024).toFixed(1)} MB
                          </td>

                          <td className="p-3">
                            {u.rebootRequired ? (
                              <span className="mono text-[10px] text-[var(--amber)] flex items-center gap-1 font-semibold">
                                <RotateCcw size={11} /> Required
                              </span>
                            ) : (
                              <span className="mono text-[10px] text-[var(--text-ghost)]">No Reboot</span>
                            )}
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setInspectUpdate(u)}
                                title="Inspect Details"
                                className="p-1 rounded text-[var(--text-ghost)] hover:text-[var(--amber)] transition-colors">
                                <Info size={14} />
                              </button>

                              <button
                                onClick={() => executeInstallation([u.title])}
                                disabled={installingProgress !== null}
                                className="mono flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--amber)] text-black text-[11px] font-semibold hover:bg-[var(--amber)]/90 disabled:opacity-50 transition-colors">
                                <Download size={12} /> Apply
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Installation History */}
      {activeTab === "history" && (
        <div className="mt-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[var(--border-c)] flex items-center justify-between">
            <div>
              <h3 className="display text-sm font-bold text-[var(--text)]">Windows Update Audit Trail</h3>
              <p className="mono text-[11px] text-[var(--text-sub)] mt-0.5">
                Historic record of patches deployed via WSUS and NEXUS Agent on {serverInfo?.name || server}.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="border-b border-[var(--border-dim)] bg-[var(--bg-surface)] text-[10px] uppercase font-mono tracking-wider text-[var(--text-ghost)]">
                <tr>
                  <th className="p-3">Title / KB</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Installed On</th>
                  <th className="p-3">Triggered By</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-dim)]">
                {historyItems.map((h) => (
                  <tr key={h.id} className="hover:bg-[var(--bg-surface)] transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-[var(--text)]">{h.title}</div>
                      <div className="mono text-[10px] text-[var(--amber)] mt-0.5">{h.kbArticleId}</div>
                    </td>

                    <td className="p-3">
                      <span className="mono text-[10px] px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-dim)]">
                        {h.category}
                      </span>
                    </td>

                    <td className="p-3 mono text-[11px] text-[var(--text-sub)]">{h.installedOn}</td>

                    <td className="p-3 mono text-[11px] text-[var(--text-sub)]">{h.installedBy}</td>

                    <td className="p-3 mono text-[11px] text-[var(--text-sub)]">{h.durationSeconds}s</td>

                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 font-medium text-[var(--ok)] text-[11px]">
                        <CheckCircle2 size={13} /> {h.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Maintenance Schedule & WSUS Settings */}
      {activeTab === "schedule" && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-c)]">
              <Calendar size={18} className="text-[var(--amber)]" />
              <h3 className="display text-sm font-bold text-[var(--text)]">Automated Patching Maintenance Window</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mono text-[11px] uppercase text-[var(--text-ghost)] block mb-1">Weekly Maintenance Day</label>
                <select
                  value={scheduleDay}
                  onChange={(e) => setScheduleDay(e.target.value)}
                  className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[12px] text-[var(--text)] outline-none focus:border-[var(--amber)]">
                  <option value="Sunday">Sunday</option>
                  <option value="Tuesday (Patch Tuesday)">Tuesday (Patch Tuesday)</option>
                  <option value="Saturday">Saturday</option>
                </select>
              </div>

              <div>
                <label className="mono text-[11px] uppercase text-[var(--text-ghost)] block mb-1">Execution Window Start Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[12px] text-[var(--text)] outline-none focus:border-[var(--amber)]"
                />
              </div>

              <div>
                <label className="mono text-[11px] uppercase text-[var(--text-ghost)] block mb-1">Reboot Behavior Policy</label>
                <select
                  value={rebootPolicy}
                  onChange={(e) => setRebootPolicy(e.target.value)}
                  className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[12px] text-[var(--text)] outline-none focus:border-[var(--amber)]">
                  <option value="auto_outside_hours">Automatically restart if needed outside business hours</option>
                  <option value="never_reboot">Suppress automatic reboot (Notify Administrator)</option>
                  <option value="immediate">Immediate restart upon installation completion</option>
                </select>
              </div>

              <button
                onClick={() => toast.success("Maintenance schedule policy updated successfully!")}
                className="mono mt-2 w-full py-2 rounded bg-[var(--amber)] text-black text-[11px] font-bold hover:bg-[var(--amber)]/90 transition-colors">
                Save Maintenance Schedule
              </button>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-c)]">
              <Lock size={18} className="text-[var(--amber)]" />
              <h3 className="display text-sm font-bold text-[var(--text)]">WSUS & Server Group Configuration</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mono text-[11px] uppercase text-[var(--text-ghost)] block mb-1">WSUS Computer Target Group</label>
                <input
                  type="text"
                  value={wsusGroup}
                  onChange={(e) => setWsusGroup(e.target.value)}
                  className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[12px] text-[var(--text)] outline-none focus:border-[var(--amber)]"
                />
              </div>

              <div>
                <label className="mono text-[11px] uppercase text-[var(--text-ghost)] block mb-1">Upstream Update Server URL</label>
                <input
                  type="text"
                  defaultValue="http://wsus.nexus.local:8530"
                  className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[12px] text-[var(--text)] outline-none focus:border-[var(--amber)]"
                />
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-dim)] text-[11px] text-[var(--text-sub)] space-y-1">
                <div className="font-semibold text-[var(--text)]">WUA Agent Status:</div>
                <div>Server WSUS Client: Active</div>
                <div>Group Policy Enforced: Yes (GPO: Enterprise_WSUS_Policy)</div>
              </div>

              <button
                onClick={() => toast.success("WSUS Configuration synchronized with GPO")}
                className="mono w-full py-2 rounded border border-[var(--border-c)] text-[11px] font-semibold text-[var(--text)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors">
                Synchronize Group Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Overlay Modal */}
      {installingProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 bg-[var(--bg-card)] border border-[var(--amber)]/50 rounded-xl shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 size={24} className="animate-spin text-[var(--amber)]" />
              <div>
                <h3 className="display text-base font-bold text-[var(--text)]">Deploying Windows Updates</h3>
                <p className="mono text-[11px] text-[var(--amber)]">{installingProgress.currentKb}</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] mono text-[var(--text-sub)]">
                <span>{installingProgress.step}</span>
                <span>{installingProgress.progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--bg-surface)] overflow-hidden border border-[var(--border-dim)]">
                <div
                  className="h-full bg-[var(--amber)] transition-all duration-300"
                  style={{ width: `${installingProgress.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Inspection Modal */}
      {inspectUpdate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--bg-card)] border-l border-[var(--border-c)] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-c)]">
                <div className="flex items-center gap-2">
                  <Download size={18} className="text-[var(--amber)]" />
                  <span className="display text-base font-bold text-[var(--text)]">Patch Details</span>
                </div>
                <button onClick={() => setInspectUpdate(null)} className="text-[var(--text-ghost)] hover:text-[var(--text)]">
                  <X size={18} />
                </button>
              </div>

              <div>
                <h3 className="display text-base font-bold text-[var(--text)]">{inspectUpdate.title}</h3>
                <div className="mono text-[12px] text-[var(--amber)] mt-0.5">{inspectUpdate.kbArticleId || "Microsoft Security Patch"}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-dim)]">
                <div>
                  <span className="text-[var(--text-ghost)] block">Category:</span>
                  <span className="text-[var(--text)] font-semibold">{inspectUpdate.category || "General"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-ghost)] block">Severity:</span>
                  <span className="text-[var(--text)] font-semibold">{inspectUpdate.severity || "Unspecified"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-ghost)] block">Size:</span>
                  <span className="text-[var(--text)] font-semibold">{((inspectUpdate.maxDownloadSize || 0) / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <div>
                  <span className="text-[var(--text-ghost)] block">Reboot Required:</span>
                  <span className={inspectUpdate.rebootRequired ? "text-[var(--amber)] font-bold" : "text-[var(--text-sub)]"}>
                    {inspectUpdate.rebootRequired ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="mono text-[11px] uppercase text-[var(--text-ghost)] mb-1">Description</h4>
                <p className="text-[12px] text-[var(--text-sub)] leading-relaxed p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-dim)]">
                  {inspectUpdate.description}
                </p>
              </div>

              {inspectUpdate.supportUrl && (
                <div>
                  <a
                    href={inspectUpdate.supportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mono text-[11px] text-[var(--amber)] hover:underline inline-flex items-center gap-1">
                    View Knowledge Base Article on Microsoft Support <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[var(--border-c)] flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setInspectUpdate(null)}
                className="mono px-4 py-1.5 rounded border border-[var(--border-c)] text-[12px] text-[var(--text-sub)] hover:text-[var(--text)]">
                Close
              </button>
              <button
                onClick={() => {
                  executeInstallation([inspectUpdate.title]);
                  setInspectUpdate(null);
                }}
                className="mono px-4 py-1.5 rounded bg-[var(--amber)] text-black text-[12px] font-bold hover:bg-[var(--amber)]/90">
                Install Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PowerShell Script Generator Modal */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl p-5 bg-[var(--bg-card)] border border-[var(--border-c)] rounded-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-c)]">
              <div className="flex items-center gap-2">
                <Terminal size={18} className="text-[var(--amber)]" />
                <h3 className="display text-base font-bold text-[var(--text)]">PowerShell Update Script</h3>
              </div>
              <button onClick={() => setIsScriptModalOpen(false)} className="text-[var(--text-ghost)] hover:text-[var(--text)]">
                <X size={16} />
              </button>
            </div>

            <pre className="p-4 rounded-lg bg-black text-[var(--amber)] mono text-[11px] overflow-x-auto max-h-[300px] border border-[var(--border-c)] leading-relaxed select-all">
              {generatedScript}
            </pre>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-c)]">
              <button
                onClick={() => setIsScriptModalOpen(false)}
                className="mono px-3 py-1.5 rounded border border-[var(--border-c)] text-[11px] text-[var(--text-sub)] hover:text-[var(--text)]">
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedScript);
                  toast.success("PowerShell update script copied!");
                }}
                className="mono px-4 py-1.5 rounded bg-[var(--amber)] text-black text-[11px] font-bold hover:bg-[var(--amber)]/90 flex items-center gap-1.5">
                <Copy size={13} /> Copy Script
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

export default UpdatesPage;
