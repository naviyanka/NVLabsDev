import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useContext, useMemo } from "react";
import {
  Search,
  ShieldCheck,
  Download,
  Trash2,
  ShieldAlert,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Layers,
  Boxes,
  Server as ServerIcon,
  CircleAlert,
  Loader2,
  Undo2,
  Terminal,
  FileCode,
  Check,
  X,
  Info,
  Sparkles,
  CheckSquare,
  Square,
  Copy,
  Cpu,
  FileText,
  RotateCcw,
  Zap,
  HardDrive,
  Globe,
  Lock,
  Share2
} from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getRolesClient, installRoleClient, uninstallRoleClient, getServersClient, type WindowsRole, type Server } from "@/api/client";
import { toast } from "sonner";
import { ThemeContext } from "./__root";

export const Route = createFileRoute("/roles")({
  head: () => ({
    meta: [
      { title: "Roles & Features — NEXUS" },
      { name: "description", content: "Manage Windows Server Roles and Optional Features." }
    ]
  }),
  component: RolesPage
});

type FilterType = "all" | "role" | "feature" | "installed" | "available";

interface PresetSuite {
  id: string;
  name: string;
  icon: any;
  description: string;
  roles: string[];
}

const PRESET_SUITES: PresetSuite[] = [
  {
    id: "adds",
    name: "Domain Controller Suite",
    icon: Lock,
    description: "Active Directory Domain Services, DNS Server, and RSAT Administration Tools.",
    roles: ["AD-Domain-Services", "DNS", "RSAT"]
  },
  {
    id: "iis",
    name: "Web Server (IIS) Stack",
    icon: Globe,
    description: "IIS Web Server, IIS Management Tools, Common HTTP Features, and .NET 4.8.",
    roles: ["Web-Server", "Web-Mgmt-Tools", "Web-Common-Http", "NET-Framework-45-Features"]
  },
  {
    id: "hyperv",
    name: "Hyper-V Virtualization Cluster",
    icon: Cpu,
    description: "Hyper-V Virtualization hypervisor, Management Snap-ins, and Failover Clustering.",
    roles: ["Hyper-V", "Hyper-V-Tools", "Failover-Clustering"]
  },
  {
    id: "storage",
    name: "Enterprise File & Storage Server",
    icon: HardDrive,
    description: "File and Storage Services, SMB Shares, BitLocker Encryption, and DFS Namespaces.",
    roles: ["FileAndStorage-Services", "FS-FileServer", "FS-DFS-Namespace", "BitLocker"]
  }
];

function RolesPage() {
  const { theme } = useContext(ThemeContext);

  const [server, setServer] = useState("");
  const [serverInfo, setServerInfo] = useState<Server | null>(null);
  const [roles, setRoles] = useState<WindowsRole[]>([]);
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Sorting
  const [sortCol, setSortCol] = useState<keyof WindowsRole>("displayName");
  const [sortAsc, setSortAsc] = useState(true);

  // Selection & Batch
  const [selectedRoleNames, setSelectedRoleNames] = useState<string[]>([]);

  // Modal & Drawer State
  const [inspectRole, setInspectRole] = useState<WindowsRole | null>(null);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [scriptMode, setScriptMode] = useState<"install" | "uninstall">("install");

  const fetchServers = async () => {
    const list = await getServersClient();
    if (list.length > 0) {
      setServer(list[0].ip);
      setServerInfo(list[0]);
    }
  };

  const fetchRoles = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const cachedData = await getRolesClient(id, false);
      if (cachedData && cachedData.length > 0) {
        setRoles(cachedData);
      }
      const freshData = await getRolesClient(id, true);
      setRoles(freshData);
    } catch {
      toast.error("Failed to load roles & features");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (server) fetchRoles(server);
  }, [server, fetchRoles]);

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (server) {
      getServersClient().then((list) => {
        const s = list.find((x) => x.ip === server || x.id === server);
        setServerInfo(s ?? null);
      });
      fetchRoles(server);
      setSelectedRoleNames([]);
    }
  }, [server, fetchRoles]);

  const handleInstall = async (role: WindowsRole) => {
    if (!confirm(`Install ${role.displayName}? This may require a server restart.`)) return;
    const actionId = `install-${role.name}`;
    setPendingAction(actionId);
    try {
      const success = await installRoleClient(server, role.name, role.featureType);
      if (success) {
        toast.success(`${role.displayName} installed`, { description: "State updated successfully." });
        fetchRoles(server);
      } else {
        toast.error(`Failed to install ${role.displayName}`);
      }
    } catch {
      toast.error(`Install failed for ${role.displayName}`);
    } finally {
      setPendingAction(null);
    }
  };

  const handleUninstall = async (role: WindowsRole) => {
    if (!confirm(`Remove ${role.displayName}? Services depending on it may stop working.`)) return;
    const actionId = `uninstall-${role.name}`;
    setPendingAction(actionId);
    try {
      const success = await uninstallRoleClient(server, role.name, role.featureType);
      if (success) {
        toast.success(`${role.displayName} removed`, { description: "A restart may be required." });
        fetchRoles(server);
      } else {
        toast.error(`Failed to remove ${role.displayName}`);
      }
    } catch {
      toast.error(`Removal failed for ${role.displayName}`);
    } finally {
      setPendingAction(null);
    }
  };

  // Batch operations
  const handleBatchInstall = async () => {
    if (selectedRoleNames.length === 0) return;
    if (!confirm(`Batch install ${selectedRoleNames.length} roles/features on ${serverInfo?.name || server}?`)) return;

    setPendingAction("batch");
    let countSuccess = 0;
    for (const name of selectedRoleNames) {
      const role = roles.find((r) => r.name === name);
      if (role) {
        const ok = await installRoleClient(server, role.name, role.featureType);
        if (ok) countSuccess++;
      }
    }
    setPendingAction(null);
    toast.success(`Batch install completed`, { description: `Successfully installed ${countSuccess} of ${selectedRoleNames.length} items.` });
    setSelectedRoleNames([]);
    fetchRoles(server);
  };

  const handleBatchUninstall = async () => {
    if (selectedRoleNames.length === 0) return;
    if (!confirm(`Batch remove ${selectedRoleNames.length} roles/features from ${serverInfo?.name || server}?`)) return;

    setPendingAction("batch");
    let countSuccess = 0;
    for (const name of selectedRoleNames) {
      const role = roles.find((r) => r.name === name);
      if (role) {
        const ok = await uninstallRoleClient(server, role.name, role.featureType);
        if (ok) countSuccess++;
      }
    }
    setPendingAction(null);
    toast.success(`Batch removal completed`, { description: `Successfully removed ${countSuccess} of ${selectedRoleNames.length} items.` });
    setSelectedRoleNames([]);
    fetchRoles(server);
  };

  const handleApplyPresetSuite = async (suite: PresetSuite) => {
    if (!confirm(`Deploy "${suite.name}" preset suite to ${serverInfo?.name || server}?\n\nIncludes: ${suite.roles.join(", ")}`)) return;
    setPendingAction("preset");
    let installed = 0;
    for (const rName of suite.roles) {
      const role = roles.find((r) => r.name.toLowerCase() === rName.toLowerCase());
      if (role) {
        const ok = await installRoleClient(server, role.name, role.featureType);
        if (ok) installed++;
      }
    }
    setPendingAction(null);
    toast.success(`Applied "${suite.name}" Suite`, { description: `Provisioned ${installed} of ${suite.roles.length} roles.` });
    fetchRoles(server);
  };

  const isRole = (r: WindowsRole) => r.featureType === "Role" || r.featureType === "role";

  const categories = useMemo(() => {
    const set = new Set<string>();
    roles.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [roles]);

  const counts = useMemo(() => {
    return {
      all: roles.length,
      rolesCount: roles.filter(isRole).length,
      featuresCount: roles.filter((r) => !isRole(r)).length,
      installedCount: roles.filter((r) => r.installState === "Installed").length,
      availableCount: roles.filter((r) => r.installState !== "Installed").length,
      restartRequiredCount: roles.filter((r) => r.installState === "Installed" && r.restartRequired).length
    };
  }, [roles]);

  const handleSort = (col: keyof WindowsRole) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const filtered = useMemo(() => {
    return roles
      .filter((r) => {
        if (filterType === "role" && !isRole(r)) return false;
        if (filterType === "feature" && isRole(r)) return false;
        if (filterType === "installed" && r.installState !== "Installed") return false;
        if (filterType === "available" && r.installState === "Installed") return false;
        if (categoryFilter !== "ALL" && r.category !== categoryFilter) return false;

        if (q.trim()) {
          const query = q.toLowerCase();
          return (
            r.displayName.toLowerCase().includes(query) ||
            r.name.toLowerCase().includes(query) ||
            (r.category && r.category.toLowerCase().includes(query)) ||
            (r.description && r.description.toLowerCase().includes(query))
          );
        }
        return true;
      })
      .sort((a, b) => {
        const aVal = String(a[sortCol] || "").toLowerCase();
        const bVal = String(b[sortCol] || "").toLowerCase();
        if (aVal < bVal) return sortAsc ? -1 : 1;
        if (aVal > bVal) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [roles, filterType, categoryFilter, q, sortCol, sortAsc]);

  const handleToggleSelectAll = () => {
    if (selectedRoleNames.length === filtered.length) {
      setSelectedRoleNames([]);
    } else {
      setSelectedRoleNames(filtered.map((r) => r.name));
    }
  };

  const handleToggleSelect = (name: string) => {
    setSelectedRoleNames((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const handleExportCSV = () => {
    const headers = ["DisplayName", "SystemName", "FeatureType", "InstallState", "Category", "RestartRequired", "Description"];
    const rows = filtered.map((r) => [
      `"${r.displayName}"`,
      `"${r.name}"`,
      `"${r.featureType}"`,
      `"${r.installState}"`,
      `"${r.category || "General"}"`,
      `"${r.restartRequired ? "Yes" : "No"}"`,
      `"${(r.description || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `NEXUS_Roles_${serverInfo?.name || "Server"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported Roles & Features CSV report");
  };

  const generatedPsScript = useMemo(() => {
    const targetNames = selectedRoleNames.length > 0 ? selectedRoleNames : filtered.map((r) => r.name);
    const cmd = scriptMode === "install" ? "Install-WindowsFeature" : "Uninstall-WindowsFeature";
    return `# =====================================================================
# NEXUS Windows Server Role Management Deployment Script
# Target Server: ${serverInfo?.name || server} (${serverInfo?.ip || "Localhost"})
# Date: ${new Date().toLocaleString()}
# =====================================================================

$RolesList = @(
${targetNames.map((n) => `  "${n}"`).join(",\n")}
)

Write-Host "Executing ${cmd} on target server..." -ForegroundColor Cyan

${cmd} -Name $RolesList -IncludeManagementTools -Restart:$false

Write-Host "Operation completed. Check Get-WindowsFeature for state." -ForegroundColor Green
`;
  }, [selectedRoleNames, filtered, scriptMode, serverInfo, server]);

  const isServerOffline = serverInfo && serverInfo.status !== "online";

  return (
    <PageWrapper>
      {/* Header & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[var(--border-c)]">
        <div>
          <PageHeader eyebrow="Windows Server Administration" title="Roles & Optional Features" />
          <p className="mono text-[11px] text-[var(--text-sub)] mt-1 flex items-center gap-2">
            <span>Server: <strong className="text-[var(--text)]">{serverInfo?.name || server}</strong></span>
            <span>•</span>
            <span>OS: {serverInfo?.os || "Windows Server 2025"}</span>
            <span>•</span>
            <span className="text-[var(--amber)]">{counts.installedCount} Installed</span> / {counts.all} Total Packages
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            title="Export CSV Audit Report"
            className="mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-sub)] hover:text-[var(--text)] hover:border-[var(--amber)] transition-colors">
            <FileText size={13} /> Export CSV
          </button>

          <button
            onClick={() => setIsScriptModalOpen(true)}
            className="mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--amber)] hover:bg-[var(--amber-low)] transition-colors">
            <Terminal size={13} /> PowerShell Script
          </button>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="mono flex items-center gap-1.5 rounded-md bg-[var(--amber)] px-3.5 py-1.5 text-[11px] font-semibold text-black hover:bg-[var(--amber)]/90 disabled:opacity-50 transition-colors shadow-sm">
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Target Server Selector */}
      <div className="mt-4">
        <ServerSelector value={server} onChange={setServer} />
      </div>

      {isServerOffline && <OfflineBanner status={serverInfo!.status} />}

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="p-3.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[var(--text-ghost)]">
            <span>Total Roles & Features</span>
            <Boxes size={14} className="text-[var(--amber)]" />
          </div>
          <div className="display text-2xl font-bold pt-1 text-[var(--text)]">{counts.all}</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[var(--text-ghost)]">
            <span>Active Installed Roles</span>
            <ShieldCheck size={14} className="text-[var(--ok)]" />
          </div>
          <div className="display text-2xl font-bold pt-1 text-[var(--ok)]">{counts.installedCount}</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[var(--text-ghost)]">
            <span>Available Features</span>
            <Layers size={14} className="text-[var(--text-sub)]" />
          </div>
          <div className="display text-2xl font-bold pt-1 text-[var(--text)]">{counts.availableCount}</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[var(--text-ghost)]">
            <span>Pending Restarts</span>
            <RotateCcw size={14} className="text-[var(--amber)]" />
          </div>
          <div className="display text-2xl font-bold pt-1 text-[var(--amber)]">{counts.restartRequiredCount}</div>
        </div>
      </div>

      {/* Deployment Preset Suites Section */}
      <div className="mt-5 p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-[var(--amber)]" />
          <h3 className="display text-sm font-bold text-[var(--text)]">Standard Windows Server Role Deployment Suites</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_SUITES.map((suite) => {
            const Icon = suite.icon;
            return (
              <div
                key={suite.id}
                className="p-3 rounded-lg border border-[var(--border-dim)] bg-[var(--bg-surface)] hover:border-[var(--amber)] transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded bg-[var(--amber-low)] text-[var(--amber)]">
                      <Icon size={14} />
                    </div>
                    <span className="display text-xs font-bold text-[var(--text)]">{suite.name}</span>
                  </div>
                  <p className="mono text-[10px] text-[var(--text-sub)] line-clamp-2">{suite.description}</p>
                </div>
                <button
                  onClick={() => handleApplyPresetSuite(suite)}
                  disabled={pendingAction !== null}
                  className="mono mt-3 w-full py-1 rounded bg-[var(--bg-card)] border border-[var(--border-c)] text-[10px] font-semibold text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black transition-colors flex items-center justify-center gap-1">
                  <Zap size={11} /> Deploy Suite
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)]">
        {/* Type Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-[var(--bg-surface)] p-1 rounded-md border border-[var(--border-c)]">
          {(
            [
              { v: "all", label: "All Packages", n: counts.all },
              { v: "role", label: "Server Roles", n: counts.rolesCount },
              { v: "feature", label: "Optional Features", n: counts.featuresCount },
              { v: "installed", label: "Installed", n: counts.installedCount },
              { v: "available", label: "Available", n: counts.availableCount }
            ] as const
          ).map((tab) => (
            <button
              key={tab.v}
              onClick={() => setFilterType(tab.v)}
              className={`mono rounded px-2.5 py-1 text-[11px] transition-colors flex items-center gap-1.5 ${
                filterType === tab.v
                  ? "bg-[var(--amber)] text-black font-bold"
                  : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-card)]"
              }`}>
              {tab.label}
              <span className="mono text-[9px] opacity-80">({tab.n})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-ghost)]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search role name, system ID, description..."
            className="w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-1.5 pl-9 pr-3 text-[12px] text-[var(--text)] placeholder-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <span className="mono text-[10px] uppercase text-[var(--text-ghost)]">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[11px] text-[var(--text)] focus:border-[var(--amber)] outline-none">
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Multi-Select Action Bar (Shows if items selected) */}
      {selectedRoleNames.length > 0 && (
        <div className="mt-3 p-3 rounded-xl border border-[var(--amber)]/50 bg-[var(--amber-low)] flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="mono text-[12px] font-bold text-[var(--amber)] flex items-center gap-2">
            <CheckSquare size={16} />
            <span>{selectedRoleNames.length} Roles/Features Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchInstall}
              disabled={pendingAction !== null}
              className="mono px-3 py-1 rounded bg-[var(--amber)] text-black text-[11px] font-bold hover:bg-[var(--amber)]/90 transition-colors flex items-center gap-1">
              <Download size={12} /> Batch Install Selected
            </button>

            <button
              onClick={handleBatchUninstall}
              disabled={pendingAction !== null}
              className="mono px-3 py-1 rounded bg-[var(--crit)]/20 text-[var(--crit)] border border-[var(--crit)]/30 text-[11px] font-bold hover:bg-[var(--crit)]/30 transition-colors flex items-center gap-1">
              <Trash2 size={12} /> Batch Remove Selected
            </button>

            <button
              onClick={() => setSelectedRoleNames([])}
              className="mono text-[11px] text-[var(--text-sub)] hover:text-[var(--text)] px-2 py-1">
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Roles & Features Data Table */}
      <div className="mt-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-[13px] text-[var(--text-sub)]">
            <Loader2 size={16} className="animate-spin text-[var(--amber)]" /> Loading server roles & features inventory…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <ShieldAlert size={36} className="text-[var(--text-ghost)] mb-3" />
            <div className="text-[14px] font-semibold text-[var(--text)]">No matching roles or features found</div>
            <p className="text-[12px] text-[var(--text-sub)] mt-1 max-w-md">
              Try adjusting search terms or changing category/status filters.
            </p>
            <button
              onClick={() => {
                setQ("");
                setFilterType("all");
                setCategoryFilter("ALL");
              }}
              className="mono mt-4 flex items-center gap-1 text-[11px] uppercase tracking-[0.15em] text-[var(--amber)] hover:underline font-semibold">
              <Undo2 size={12} /> Reset all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="border-b border-[var(--border-dim)] bg-[var(--bg-surface)] text-[10px] uppercase font-mono tracking-wider text-[var(--text-ghost)]">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <button onClick={handleToggleSelectAll} className="text-[var(--text-ghost)] hover:text-[var(--amber)]">
                      {selectedRoleNames.length === filtered.length && filtered.length > 0 ? (
                        <CheckSquare size={14} className="text-[var(--amber)]" />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                  </th>
                  <th
                    className="p-3 font-semibold cursor-pointer hover:text-[var(--text)] select-none"
                    onClick={() => handleSort("displayName")}>
                    <div className="flex items-center gap-1">
                      Display Name {sortCol === "displayName" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                  </th>
                  <th
                    className="p-3 font-semibold cursor-pointer hover:text-[var(--text)] select-none"
                    onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">
                      System ID {sortCol === "name" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                  </th>
                  <th
                    className="p-3 font-semibold cursor-pointer hover:text-[var(--text)] select-none"
                    onClick={() => handleSort("featureType")}>
                    <div className="flex items-center gap-1">
                      Type {sortCol === "featureType" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                  </th>
                  <th
                    className="p-3 font-semibold cursor-pointer hover:text-[var(--text)] select-none"
                    onClick={() => handleSort("category")}>
                    <div className="flex items-center gap-1">
                      Category {sortCol === "category" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                  </th>
                  <th
                    className="p-3 font-semibold cursor-pointer hover:text-[var(--text)] select-none"
                    onClick={() => handleSort("installState")}>
                    <div className="flex items-center gap-1">
                      Status {sortCol === "installState" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                  </th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-dim)]">
                {filtered.map((role) => {
                  const installed = role.installState === "Installed";
                  const pending = pendingAction === `install-${role.name}` || pendingAction === `uninstall-${role.name}`;
                  const isChecked = selectedRoleNames.includes(role.name);

                  return (
                    <tr
                      key={role.name}
                      className={`hover:bg-[var(--bg-surface)] transition-colors ${
                        isChecked ? "bg-[var(--amber-low)]/20" : ""
                      }`}>
                      <td className="p-3 text-center">
                        <button onClick={() => handleToggleSelect(role.name)} className="text-[var(--text-ghost)] hover:text-[var(--amber)]">
                          {isChecked ? <CheckSquare size={14} className="text-[var(--amber)]" /> : <Square size={14} />}
                        </button>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={15} className={installed ? "text-[var(--amber)]" : "text-[var(--text-ghost)]"} />
                          <div>
                            <button
                              onClick={() => setInspectRole(role)}
                              className="font-semibold text-[var(--text)] hover:text-[var(--amber)] text-left hover:underline">
                              {role.displayName}
                            </button>
                            {role.parentName && (
                              <div className="mono text-[10px] text-[var(--text-ghost)]">Parent: {role.parentName}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3 mono text-[11px] text-[var(--amber)]">{role.name}</td>

                      <td className="p-3">
                        <span className="mono text-[10px] px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-dim)] uppercase">
                          {isRole(role) ? "Server Role" : "Feature"}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="mono text-[11px] text-[var(--text-sub)]">{role.category || "General"}</span>
                      </td>

                      <td className="p-3">
                        {installed ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-[var(--ok)] text-[11px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ok)]" /> Installed
                          </span>
                        ) : (
                          <span className="mono text-[11px] text-[var(--text-ghost)]">Available</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setInspectRole(role)}
                            title="Inspect Details"
                            className="p-1 rounded text-[var(--text-ghost)] hover:text-[var(--amber)] hover:bg-[var(--bg-surface)] transition-colors">
                            <Info size={14} />
                          </button>

                          {pending ? (
                            <Loader2 size={14} className="animate-spin text-[var(--amber)]" />
                          ) : installed ? (
                            <button
                              onClick={() => handleUninstall(role)}
                              disabled={pendingAction !== null}
                              className="mono flex items-center gap-1 px-2 py-1 rounded bg-[var(--crit)]/10 text-[var(--crit)] border border-[var(--crit)]/20 text-[11px] font-semibold hover:bg-[var(--crit)]/20 disabled:opacity-50 transition-colors">
                              <Trash2 size={12} /> Remove
                            </button>
                          ) : (
                            <button
                              onClick={() => handleInstall(role)}
                              disabled={pendingAction !== null}
                              className="mono flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--amber)] text-black text-[11px] font-semibold hover:bg-[var(--amber)]/90 disabled:opacity-50 transition-colors">
                              <Download size={12} /> Install
                            </button>
                          )}
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

      {/* Role Details Slideover Drawer */}
      {inspectRole && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[var(--bg-card)] border-l border-[var(--border-c)] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-c)]">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-[var(--amber)]" />
                  <span className="display text-base font-bold text-[var(--text)]">Role Inspector</span>
                </div>
                <button onClick={() => setInspectRole(null)} className="text-[var(--text-ghost)] hover:text-[var(--text)]">
                  <X size={18} />
                </button>
              </div>

              <div>
                <h3 className="display text-lg font-extrabold text-[var(--text)]">{inspectRole.displayName}</h3>
                <div className="mono text-[12px] text-[var(--amber)] mt-0.5">{inspectRole.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-dim)]">
                <div>
                  <span className="text-[var(--text-ghost)] block">Type:</span>
                  <span className="text-[var(--text)] font-semibold">{inspectRole.featureType}</span>
                </div>
                <div>
                  <span className="text-[var(--text-ghost)] block">Category:</span>
                  <span className="text-[var(--text)] font-semibold">{inspectRole.category || "General"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-ghost)] block">Status:</span>
                  <span className={inspectRole.installState === "Installed" ? "text-[var(--ok)] font-bold" : "text-[var(--text-sub)]"}>
                    {inspectRole.installState}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-ghost)] block">Restart Required:</span>
                  <span className={inspectRole.restartRequired ? "text-[var(--amber)] font-bold" : "text-[var(--text-sub)]"}>
                    {inspectRole.restartRequired ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="mono text-[11px] uppercase text-[var(--text-ghost)] mb-1">Description</h4>
                <p className="text-[12px] text-[var(--text-sub)] leading-relaxed p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-dim)]">
                  {inspectRole.description || "No official description available for this Windows component."}
                </p>
              </div>

              {inspectRole.dependencies && inspectRole.dependencies.length > 0 && (
                <div>
                  <h4 className="mono text-[11px] uppercase text-[var(--text-ghost)] mb-1">Prerequisite Dependencies</h4>
                  <div className="flex flex-wrap gap-1">
                    {inspectRole.dependencies.map((dep) => (
                      <span key={dep} className="mono text-[10px] px-2 py-0.5 rounded bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]/30">
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="mono text-[11px] uppercase text-[var(--text-ghost)] mb-1">PowerShell Command Snippet</h4>
                <div className="p-3 rounded-lg bg-black/80 border border-[var(--border-c)] mono text-[11px] text-[var(--amber)] relative group">
                  <code>
                    Install-WindowsFeature -Name "{inspectRole.name}" -IncludeManagementTools
                  </code>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-c)] flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setInspectRole(null)}
                className="mono px-4 py-1.5 rounded border border-[var(--border-c)] text-[12px] text-[var(--text-sub)] hover:text-[var(--text)]">
                Close
              </button>
              {inspectRole.installState === "Installed" ? (
                <button
                  onClick={() => {
                    handleUninstall(inspectRole);
                    setInspectRole(null);
                  }}
                  className="mono px-4 py-1.5 rounded bg-[var(--crit)] text-white text-[12px] font-bold hover:bg-[var(--crit)]/90">
                  Remove Role
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleInstall(inspectRole);
                    setInspectRole(null);
                  }}
                  className="mono px-4 py-1.5 rounded bg-[var(--amber)] text-black text-[12px] font-bold hover:bg-[var(--amber)]/90">
                  Install Role
                </button>
              )}
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
                <h3 className="display text-base font-bold text-[var(--text)]">PowerShell Deployment Script Generator</h3>
              </div>
              <button onClick={() => setIsScriptModalOpen(false)} className="text-[var(--text-ghost)] hover:text-[var(--text)]">
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="mono text-[11px] text-[var(--text-sub)]">
                Targeting: {selectedRoleNames.length > 0 ? `${selectedRoleNames.length} selected roles` : `${filtered.length} filtered roles`}
              </span>

              <div className="flex items-center gap-1 bg-[var(--bg-surface)] p-1 rounded border border-[var(--border-c)]">
                <button
                  onClick={() => setScriptMode("install")}
                  className={`mono text-[10px] px-2 py-0.5 rounded ${
                    scriptMode === "install" ? "bg-[var(--amber)] text-black font-bold" : "text-[var(--text-sub)]"
                  }`}>
                  Install Command
                </button>
                <button
                  onClick={() => setScriptMode("uninstall")}
                  className={`mono text-[10px] px-2 py-0.5 rounded ${
                    scriptMode === "uninstall" ? "bg-[var(--crit)] text-white font-bold" : "text-[var(--text-sub)]"
                  }`}>
                  Uninstall Command
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-lg bg-black text-[var(--amber)] mono text-[11px] overflow-x-auto max-h-[300px] border border-[var(--border-c)] leading-relaxed select-all">
              {generatedPsScript}
            </pre>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-c)]">
              <button
                onClick={() => setIsScriptModalOpen(false)}
                className="mono px-3 py-1.5 rounded border border-[var(--border-c)] text-[11px] text-[var(--text-sub)] hover:text-[var(--text)]">
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedPsScript);
                  toast.success("PowerShell script copied to clipboard!");
                }}
                className="mono px-4 py-1.5 rounded bg-[var(--amber)] text-black text-[11px] font-bold hover:bg-[var(--amber)]/90 transition-colors flex items-center gap-1.5">
                <Copy size={13} /> Copy Script
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

function OfflineBanner({ status }: { status: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--warn)]/30 bg-[var(--warn)]/5 p-3 text-[12px] text-[var(--warn)] font-mono">
      <CircleAlert size={16} />
      <span>
        Server is currently <strong className="capitalize">{status}</strong> — role installation tasks will be queued for WinRM execution when connection restores.
      </span>
    </div>
  );
}

