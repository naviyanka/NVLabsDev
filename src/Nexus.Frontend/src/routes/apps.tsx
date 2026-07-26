import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import {
  Search,
  Download,
  Trash2,
  Package,
  Layers,
  HardDrive,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Upload,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  FolderOpen,
  X,
  Play,
  CheckSquare,
  Square,
  Copy
} from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import {
  getAppsClient,
  installAppClient,
  uninstallAppClient,
  getServersClient,
  uploadInstallerClient,
  type InstalledApp,
  type SoftwareCatalogItem
} from "@/api/client";
import { RemoteFilePicker } from "@/components/ui/RemoteFilePicker";
import { SoftwareRepoManager } from "@/components/apps/SoftwareRepoManager";
import { toast } from "sonner";

export const Route = createFileRoute("/apps")({
  head: () => ({
    meta: [
      { title: "Installed Apps & Software Catalog — NEXUS" },
      { name: "description", content: "Software inventory, package manager repository, and remote silent application deployment." }
    ]
  }),
  component: AppsPage
});

type SortColumn = "name" | "publisher" | "version" | "installDate" | "sizeMB";
type SortOrder = "asc" | "desc";

function AppsPage() {
  const [server, setServer] = useState("dc01");
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [selApp, setSelApp] = useState<InstalledApp | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [updatesOnly, setUpdatesOnly] = useState<boolean>(false);
  const [checkedAppIds, setCheckedAppIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Modals & Drawers
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [installingPath, setInstallingPath] = useState("");
  const [installArgs, setInstallArgs] = useState("");
  const [sourceServerIp, setSourceServerIp] = useState("");
  const [installAll, setInstallAll] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchApps = async (refresh: boolean = false) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await getAppsClient(server, refresh);
      setApps(data);
      if (selApp) {
        const found = data.find((a) => a.id === selApp.id || a.name === selApp.name);
        setSelApp(found || null);
      }
    } catch (err) {
      setErrorMsg("Failed to fetch applications inventory.");
      setApps([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
    setCheckedAppIds([]);
  }, [server]);

  // Metrics
  const metrics = useMemo(() => {
    const totalCount = apps.length;
    const totalSizeMB = apps.reduce((acc, a) => {
      const val = typeof a.sizeMB === "number" ? a.sizeMB : (parseFloat(String(a.sizeMB)) || 0);
      return acc + (isNaN(val) || !isFinite(val) ? 0 : val);
    }, 0);
    const formattedSize = totalSizeMB >= 1024
      ? `${(totalSizeMB / 1024).toFixed(1)} GB`
      : `${Math.round(totalSizeMB)} MB`;
    const updatesCount = apps.filter((a) => a.updateAvailable).length;
    const microsoftAppsCount = apps.filter((a) => (a.publisher || "").toLowerCase().includes("microsoft")).length;
    return { totalCount, totalSizeMB, formattedSize, updatesCount, microsoftAppsCount };
  }, [apps]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    apps.forEach((a) => {
      if (a.category) cats.add(a.category);
    });
    return ["ALL", ...Array.from(cats).sort()];
  }, [apps]);

  // Filtered and Sorted apps
  const filteredApps = useMemo(() => {
    return apps.filter((a) => {
      if (selectedCategory !== "ALL" && a.category !== selectedCategory) {
        return false;
      }
      if (updatesOnly && !a.updateAvailable) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.publisher.toLowerCase().includes(q) ||
          a.version.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q) ||
          (a.category || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [apps, selectedCategory, updatesOnly, searchQuery]);

  const sortedApps = useMemo(() => {
    return [...filteredApps].sort((a, b) => {
      let valA: any = a[sortColumn] || "";
      let valB: any = b[sortColumn] || "";

      if (sortColumn === "sizeMB") {
        valA = Number(a.sizeMB) || 0;
        valB = Number(b.sizeMB) || 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredApps, sortColumn, sortOrder]);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortOrder("asc");
    }
  };

  const handleUninstall = async (app: InstalledApp) => {
    if (!confirm(`Are you sure you want to uninstall "${app.name}"?`)) return;
    const uninstallCmd = app.uninstallString || app.name;
    const success = await uninstallAppClient(server, uninstallCmd);
    if (success) {
      toast.success(`Successfully uninstalled "${app.name}".`);
      if (selApp?.id === app.id) setSelApp(null);
      await fetchApps(true);
    } else {
      toast.error("Failed to uninstall application.");
    }
  };

  const handleUpdateApp = async (app: InstalledApp) => {
    toast.info(`Triggering update for "${app.name}" to version ${app.latestVersion || "latest"}...`);
    setIsLoading(true);
    const mockInstallerPath = `C:\\NEXUS\\Updates\\${app.name.replace(/[^a-zA-Z0-9]/g, "")}_v${app.latestVersion || "update"}.msi`;
    const success = await installAppClient(server, mockInstallerPath, "/qn /norestart");
    if (success) {
      toast.success(`Updated "${app.name}" to latest version.`);
      await fetchApps(true);
    } else {
      toast.error(`Update failed for ${app.name}`);
    }
    setIsLoading(false);
  };

  // Remote installer select
  const handleSelectInstaller = (path: string, srcServer: string) => {
    setInstallingPath(path);
    setSourceServerIp(srcServer);
    if (path.toLowerCase().endsWith(".msi")) setInstallArgs("/qn /norestart");
    else if (path.toLowerCase().endsWith(".exe")) setInstallArgs("/S");
    else setInstallArgs("");
    setIsPickerOpen(false);
  };

  // File upload click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    toast.info(`Uploading ${file.name} to server...`);
    try {
      const path = await uploadInstallerClient(server, file);
      if (path) {
        setInstallingPath(path);
        setSourceServerIp(server);
        if (file.name.toLowerCase().endsWith(".msi")) setInstallArgs("/qn /norestart");
        else setInstallArgs("/S");
        toast.success(`Installer uploaded to ${path}`);
      } else {
        toast.error("Failed to upload installer.");
      }
    } catch (err) {
      toast.error("Upload error.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsLoading(false);
  };

  // Execute installation
  const handleInstall = async () => {
    if (!installingPath) return;
    setIsDeploying(true);

    try {
      if (installAll) {
        const servers = await getServersClient();
        toast.info(`Deploying installer silently across ${servers.length} domain servers...`);
        const promises = servers.map((s) => installAppClient(s.ip, installingPath, installArgs, sourceServerIp));
        const results = await Promise.allSettled(promises);
        const successCount = results.filter((r) => r.status === "fulfilled" && r.value === true).length;
        if (successCount === servers.length) {
          toast.success(`Silent install completed on all ${servers.length} servers.`);
        } else {
          toast.warning(`Silent install completed on ${successCount} out of ${servers.length} servers.`);
        }
      } else {
        toast.info(`Installing software on ${server}...`);
        const success = await installAppClient(server, installingPath, installArgs, sourceServerIp);
        if (success) {
          toast.success("Installation completed successfully.");
        } else {
          toast.error("Failed to install software.");
        }
      }
    } finally {
      setInstallingPath("");
      setInstallArgs("");
      setSourceServerIp("");
      setInstallAll(false);
      setIsDeploying(false);
      await fetchApps(true);
    }
  };

  // Deploy from Software Catalog Item
  const handleDeployCatalogItem = async (item: SoftwareCatalogItem) => {
    const mockPath = `C:\\NEXUS\\Repository\\${item.packageId}.msi`;
    setInstallingPath(mockPath);
    setInstallArgs(item.silentArgs);
    setIsCatalogOpen(false);
    toast.info(`Selected "${item.name}" from Software Repository.`);
  };

  // Checkbox row selections
  const toggleCheckApp = (id: string) => {
    setCheckedAppIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (checkedAppIds.length === sortedApps.length) {
      setCheckedAppIds([]);
    } else {
      setCheckedAppIds(sortedApps.map((a) => a.id));
    }
  };

  // Batch Uninstall
  const handleBatchUninstall = async () => {
    if (checkedAppIds.length === 0) return;
    if (!confirm(`Are you sure you want to uninstall ${checkedAppIds.length} selected applications?`)) return;

    toast.info(`Uninstalling ${checkedAppIds.length} applications...`);
    for (const id of checkedAppIds) {
      const app = apps.find((a) => a.id === id);
      if (app) {
        await uninstallAppClient(server, app.uninstallString || app.name);
      }
    }
    toast.success("Batch uninstall completed.");
    setCheckedAppIds([]);
    setSelApp(null);
    await fetchApps(true);
  };

  // Export CSV
  const exportCsv = () => {
    if (apps.length === 0) return;
    const targetList = checkedAppIds.length > 0 ? apps.filter((a) => checkedAppIds.includes(a.id)) : apps;
    const headers = ["Name", "Publisher", "Version", "Category", "Installed Date", "Location", "Size MB", "Architecture", "Uninstall String"];
    const rows = targetList.map(
      (a) =>
        `"${a.name}","${a.publisher}","${a.version}","${a.category || "General"}","${a.installDate}","${a.location}","${a.sizeMB}","${a.arch || "x64"}","${(a.uninstallString || "").replace(/"/g, '""')}"`
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `installed_apps_${server}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${targetList.length} application records to CSV.`);
  };

  // Helper copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard.`);
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortOrder === "asc" ? <ArrowUp size={12} className="text-[var(--amber)]" /> : <ArrowDown size={12} className="text-[var(--amber)]" />;
  };

  return (
    <PageWrapper>
      <PageHeader
        eyebrow="Management"
        title="Installed Applications"
        right={
          <>
            <input type="file" ref={fileInputRef} className="hidden" accept=".exe,.msi,.ps1" onChange={handleFileChange} />
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-[var(--amber)] px-3 py-1.5 text-[12px] font-semibold text-black hover:bg-[var(--amber)]/90 transition-colors shadow-sm">
              <Package size={14} /> Software Repo
            </button>
            <button
              onClick={exportCsv}
              disabled={apps.length === 0}
              className="flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] hover:border-[var(--amber)] hover:text-[var(--amber)] disabled:opacity-50 transition-colors">
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={() => fetchApps(true)}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-sub)] hover:text-[var(--text)] hover:border-[var(--amber)] disabled:opacity-50 transition-colors">
              <RefreshCw size={14} className={isLoading ? "animate-spin text-[var(--amber)]" : ""} /> Refresh
            </button>
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] hover:border-[var(--amber)] transition-colors">
              <Upload size={14} /> Upload Package
            </button>
            <button
              onClick={() => setIsPickerOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] hover:border-[var(--amber)] transition-colors">
              <FolderOpen size={14} /> Remote File...
            </button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <ServerSelector value={server} onChange={setServer} />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
        <div className="nx-card p-3 flex flex-col justify-between">
          <div className="eyebrow flex items-center justify-between">
            <span>Total Installed Apps</span>
            <Layers size={13} className="text-[var(--text-ghost)]" />
          </div>
          <div className="display text-xl font-bold pt-1">{metrics.totalCount}</div>
        </div>

        <div className="nx-card p-3 flex flex-col justify-between">
          <div className="eyebrow flex items-center justify-between">
            <span>Disk Footprint</span>
            <HardDrive size={13} className="text-[var(--text-ghost)]" />
          </div>
          <div className="display text-xl font-bold pt-1">{metrics.formattedSize}</div>
        </div>

        <div className="nx-card p-3 flex flex-col justify-between">
          <div className="eyebrow flex items-center justify-between">
            <span>Microsoft / Official</span>
            <ShieldCheck size={13} className="text-[var(--ok)]" />
          </div>
          <div className="display text-xl font-bold pt-1 text-[var(--ok)]">{metrics.microsoftAppsCount}</div>
        </div>

        <div className="nx-card p-3 flex flex-col justify-between">
          <div className="eyebrow flex items-center justify-between">
            <span>Updates Available</span>
            <AlertCircle size={13} className={metrics.updatesCount > 0 ? "text-[var(--amber)]" : "text-[var(--text-ghost)]"} />
          </div>
          <div className={`display text-xl font-bold pt-1 ${metrics.updatesCount > 0 ? "text-[var(--amber)]" : "text-[var(--text-sub)]"}`}>
            {metrics.updatesCount}
          </div>
        </div>
      </div>

      {/* Silent Installation Deployment Banner if installer path selected */}
      {installingPath && (
        <div className="nx-card p-4 mb-4 border border-[var(--amber)] bg-[var(--amber-low)]/20 shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--amber)]/30">
            <div className="eyebrow text-[var(--amber)] flex items-center gap-2">
              <Package size={14} /> Silent Software Installation
            </div>
            <button
              onClick={() => {
                setInstallingPath("");
                setInstallAll(false);
              }}
              className="text-[var(--text-ghost)] hover:text-[var(--text)]">
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end pt-1">
            <div>
              <label className="text-[10px] text-[var(--text-ghost)] uppercase block mb-1">Installer Source Path</label>
              <div className="mono text-[12px] p-2 bg-[var(--bg-surface)] rounded border border-[var(--border-c)] break-all text-[var(--amber)]">
                {installingPath}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-ghost)] uppercase block mb-1">Silent Arguments (e.g. /qn, /S, /quiet)</label>
              <input
                type="text"
                value={installArgs}
                onChange={(e) => setInstallArgs(e.target.value)}
                placeholder="/qn /norestart"
                className="w-full rounded bg-[var(--bg-surface)] border border-[var(--border-c)] px-3 py-1.5 text-[12px] mono focus:border-[var(--amber)] outline-none text-[var(--text)]"
              />
            </div>

            <div className="flex items-center gap-3 self-center pt-2 md:pt-0">
              <label className="flex items-center gap-2 text-[12px] text-[var(--text)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={installAll}
                  onChange={(e) => setInstallAll(e.target.checked)}
                  className="accent-[var(--amber)]"
                />
                <span>Deploy on all domain servers</span>
              </label>

              <button
                onClick={handleInstall}
                disabled={isDeploying}
                className="mono flex items-center gap-1.5 px-4 py-2 rounded bg-[var(--amber)] text-black text-[12px] font-semibold hover:bg-[var(--amber)]/90 disabled:opacity-50 transition-colors shadow-sm">
                <Play size={13} className={isDeploying ? "animate-spin" : ""} />
                {isDeploying ? "Deploying..." : "Start Install"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="nx-card p-3 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 min-w-[280px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-ghost)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by app name, publisher, location..."
              className="w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-1.5 pl-9 pr-3 text-[12px] text-[var(--text)] placeholder-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[var(--bg-surface)] p-1 rounded-md border border-[var(--border-c)]">
            <span className="mono text-[10px] text-[var(--text-ghost)] px-1.5 uppercase">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`mono rounded px-2.5 py-0.5 text-[10px] transition-colors ${
                  selectedCategory === cat
                    ? "bg-[var(--amber)] text-black font-semibold"
                    : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-card)]"
                }`}>
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setUpdatesOnly(!updatesOnly)}
            className={`mono flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] transition-colors ${
              updatesOnly
                ? "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)] font-medium"
                : "border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)] hover:text-[var(--text)]"
            }`}>
            <Sparkles size={12} /> Updates Only ({metrics.updatesCount})
          </button>
        </div>
      </div>

      {/* Batch Toolbar when checked */}
      {checkedAppIds.length > 0 && (
        <div className="nx-card p-2.5 mb-3 bg-[var(--amber-low)]/30 border border-[var(--amber)]/40 flex items-center justify-between">
          <div className="mono text-[11px] text-[var(--amber)] font-medium flex items-center gap-2">
            <CheckSquare size={14} /> {checkedAppIds.length} application(s) selected
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="mono flex items-center gap-1 rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1 text-[10px] text-[var(--text)] hover:border-[var(--amber)]">
              <Download size={11} /> Export Selected
            </button>
            <button
              onClick={handleBatchUninstall}
              className="mono flex items-center gap-1 rounded border border-[var(--crit)]/40 bg-[var(--crit)]/10 px-2.5 py-1 text-[10px] text-[var(--crit)] hover:bg-[var(--crit)] hover:text-black">
              <Trash2 size={11} /> Uninstall Selected
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Application Table + Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* Table Container */}
        <div className="nx-card overflow-hidden flex flex-col min-h-[500px] max-h-[700px]">
          <div className="overflow-auto flex-1">
            <table className="w-full text-[12px] text-left">
              <thead className="sticky top-0 bg-[var(--bg-card)] shadow-sm z-10 border-b border-[var(--border-c)]">
                <tr className="eyebrow">
                  <th className="px-3 py-2.5 w-8">
                    <button onClick={toggleSelectAll} className="text-[var(--text-ghost)] hover:text-[var(--text)]">
                      {checkedAppIds.length > 0 && checkedAppIds.length === sortedApps.length ? (
                        <CheckSquare size={14} className="text-[var(--amber)]" />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2.5 cursor-pointer select-none hover:text-[var(--text)]" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">
                      Application Name <SortIcon column="name" />
                    </div>
                  </th>
                  <th className="px-3 py-2.5 cursor-pointer select-none hover:text-[var(--text)]" onClick={() => handleSort("publisher")}>
                    <div className="flex items-center gap-1">
                      Publisher <SortIcon column="publisher" />
                    </div>
                  </th>
                  <th className="px-3 py-2.5 cursor-pointer select-none hover:text-[var(--text)]" onClick={() => handleSort("version")}>
                    <div className="flex items-center gap-1">
                      Version <SortIcon column="version" />
                    </div>
                  </th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5 cursor-pointer select-none hover:text-[var(--text)]" onClick={() => handleSort("installDate")}>
                    <div className="flex items-center gap-1">
                      Installed <SortIcon column="installDate" />
                    </div>
                  </th>
                  <th className="px-3 py-2.5 cursor-pointer select-none hover:text-[var(--text)]" onClick={() => handleSort("sizeMB")}>
                    <div className="flex items-center gap-1">
                      Size <SortIcon column="sizeMB" />
                    </div>
                  </th>
                  <th className="px-3 py-2.5 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="mono divide-y divide-[var(--border-dim)]">
                {isLoading && apps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[var(--text-sub)]">
                      <RefreshCw size={18} className="animate-spin inline-block mr-2 text-[var(--amber)]" />
                      Scanning installed applications on {server}...
                    </td>
                  </tr>
                ) : errorMsg ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[var(--crit)]">
                      {errorMsg}
                    </td>
                  </tr>
                ) : sortedApps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[var(--text-sub)]">
                      No applications found matching criteria.
                    </td>
                  </tr>
                ) : (
                  sortedApps.map((a) => {
                    const isChecked = checkedAppIds.includes(a.id);
                    const isSelected = selApp?.id === a.id;

                    return (
                      <tr
                        key={a.id}
                        onClick={() => setSelApp(a)}
                        className={`cursor-pointer transition-colors hover:bg-[var(--bg-surface)] ${
                          isSelected ? "bg-[var(--amber-low)]" : ""
                        }`}>
                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleCheckApp(a.id)} className="text-[var(--text-ghost)] hover:text-[var(--text)]">
                            {isChecked ? <CheckSquare size={14} className="text-[var(--amber)]" /> : <Square size={14} />}
                          </button>
                        </td>

                        <td className="px-3 py-2.5 max-w-[220px]">
                          <div className="font-semibold text-[var(--text)] truncate" title={a.name}>
                            {a.name}
                          </div>
                          <div className="text-[10px] text-[var(--text-ghost)] truncate">{a.location}</div>
                        </td>

                        <td className="px-3 py-2.5 text-[var(--text-sub)] max-w-[140px] truncate" title={a.publisher}>
                          {a.publisher}
                        </td>

                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-[var(--amber)] font-medium">{a.version}</span>
                          {a.updateAvailable && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-[var(--amber-low)] border border-[var(--amber)]/40 px-1 py-0.2 text-[9px] text-[var(--amber)] font-semibold">
                              Update ({a.latestVersion})
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-c)] text-[var(--text-sub)]">
                            {a.category || "General"}
                          </span>
                        </td>

                        <td className="px-3 py-2.5 whitespace-nowrap text-[var(--text-sub)] text-[11px]">{a.installDate}</td>

                        <td className="px-3 py-2.5 whitespace-nowrap text-[var(--text-sub)] font-mono">{a.sizeMB} MB</td>

                        <td className="px-3 py-2.5 text-right pr-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {a.updateAvailable && (
                              <button
                                onClick={() => handleUpdateApp(a)}
                                title="Update to Latest Version"
                                className="p-1 rounded text-[var(--amber)] hover:bg-[var(--amber-low)] transition-colors">
                                <Sparkles size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => handleUninstall(a)}
                              title="Uninstall Application"
                              className="p-1 rounded text-[var(--crit)] hover:bg-[var(--crit)]/10 transition-colors">
                              <Trash2 size={13} />
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

        {/* Application Inspector Drawer */}
        <aside className="nx-card p-4 h-fit sticky top-4">
          {selApp ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-[var(--border-dim)]">
                <div>
                  <div className="eyebrow pb-0.5">Application Inspector</div>
                  <h3 className="display text-base font-semibold break-words">{selApp.name}</h3>
                  <div className="mono text-[10px] text-[var(--text-sub)]">{selApp.publisher}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--amber-low)] border border-[var(--amber)]/40 text-[var(--amber)] font-mono">
                  {selApp.arch || "x64"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {selApp.updateAvailable && (
                  <button
                    onClick={() => handleUpdateApp(selApp)}
                    className="mono flex items-center gap-1 rounded bg-[var(--amber)] px-3 py-1.2 text-[10px] font-semibold text-black hover:bg-[var(--amber)]/90 transition-colors">
                    <Sparkles size={12} /> Update ({selApp.latestVersion})
                  </button>
                )}

                <button
                  onClick={() => handleUninstall(selApp)}
                  className="mono flex items-center gap-1 rounded border border-[var(--crit)]/40 bg-[var(--crit)]/10 px-3 py-1.2 text-[10px] uppercase text-[var(--crit)] hover:bg-[var(--crit)] hover:text-black transition-colors">
                  <Trash2 size={12} /> Uninstall
                </button>

                <button
                  onClick={() => copyToClipboard(selApp.location, "Install Location")}
                  className="mono flex items-center gap-1 rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1.2 text-[10px] text-[var(--text)] hover:border-[var(--amber)] transition-colors">
                  <Copy size={11} /> Copy Location
                </button>
              </div>

              {/* Detail fields */}
              <div className="space-y-3 mono text-[11px] pt-1 border-t border-[var(--border-dim)]">
                <div>
                  <span className="text-[var(--text-ghost)] block text-[10px] uppercase">Installed Version</span>
                  <span className="text-[var(--amber)] font-medium">{selApp.version}</span>
                </div>

                <div>
                  <span className="text-[var(--text-ghost)] block text-[10px] uppercase">Installation Directory</span>
                  <div className="bg-[var(--bg-surface)] p-2 rounded border border-[var(--border-c)] text-[10px] break-all text-[var(--text)]">
                    {selApp.location}
                  </div>
                </div>

                {selApp.uninstallString && (
                  <div>
                    <span className="text-[var(--text-ghost)] block text-[10px] uppercase">Uninstall String Command</span>
                    <div className="bg-[var(--bg-surface)] p-2 rounded border border-[var(--border-c)] text-[10px] break-all text-[var(--amber)]">
                      {selApp.uninstallString}
                    </div>
                  </div>
                )}

                {selApp.registryKey && (
                  <div>
                    <span className="text-[var(--text-ghost)] block text-[10px] uppercase">Windows Registry Path</span>
                    <div className="bg-[var(--bg-surface)] p-2 rounded border border-[var(--border-c)] text-[10px] break-all text-[var(--text-sub)]">
                      {selApp.registryKey}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-dim)]">
                  <div>
                    <span className="text-[var(--text-ghost)] block text-[10px] uppercase">Install Date</span>
                    <span className="text-[var(--text)]">{selApp.installDate}</span>
                  </div>

                  <div>
                    <span className="text-[var(--text-ghost)] block text-[10px] uppercase">Size on Disk</span>
                    <span className="text-[var(--text)]">{selApp.sizeMB} MB</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-[12px] text-[var(--text-sub)]">
              <Package size={24} className="mx-auto mb-2 text-[var(--text-ghost)] opacity-50" />
              Select an installed application from the list to view detailed registry paths, location specs, and trigger silent uninstall or updates.
            </div>
          )}
        </aside>
      </div>

      {/* Software Repository Catalog Modal */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="nx-card w-full max-w-4xl p-5 bg-[var(--bg-card)] border border-[var(--border-c)] rounded-xl shadow-2xl max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-c)] mb-3">
              <div>
                <h3 className="display text-base font-semibold flex items-center gap-2">
                  <Package size={18} className="text-[var(--amber)]" />
                  Software Package Repository & Deployment Hub
                </h3>
                <p className="mono text-[11px] text-[var(--text-sub)] mt-0.5">
                  Manage software packages, edit installer flags, or select software for 1-click silent deployment.
                </p>
              </div>
              <button onClick={() => setIsCatalogOpen(false)} className="text-[var(--text-ghost)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <SoftwareRepoManager onSelectDeploy={handleDeployCatalogItem} isModal={true} />
            </div>

            <div className="pt-3 border-t border-[var(--border-c)] flex items-center justify-end mt-3">
              <button
                onClick={() => setIsCatalogOpen(false)}
                className="mono rounded border border-[var(--border-c)] px-4 py-1.5 text-[12px] text-[var(--text-sub)] hover:text-[var(--text)]">
                Close Repository
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remote File Picker Modal */}
      <RemoteFilePicker targetServer={server} isOpen={isPickerOpen} onOpenChange={setIsPickerOpen} onSelect={handleSelectInstaller} />
    </PageWrapper>
  );
}
