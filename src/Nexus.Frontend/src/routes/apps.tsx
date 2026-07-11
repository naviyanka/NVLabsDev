import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Search, Download, Trash2, Plus, RefreshCw, Upload, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getAppsClient, installAppClient, uninstallAppClient, getServersClient, uploadInstallerClient, type InstalledApp } from "@/api/client";
import { RemoteFilePicker } from "@/components/ui/RemoteFilePicker";

export const Route = createFileRoute("/apps")({
  head: () => ({ meta: [{ title: "Installed Apps — NEXUS" }, { name: "description", content: "Installed software inventory." }] }),
  component: AppsPage,
});

type SortColumn = "name" | "publisher" | "version" | "installDate" | "sizeMB";
type SortOrder = "asc" | "desc";

function AppsPage() {
  const [server, setServer] = useState("dc");
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [q, setQ] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [installingPath, setInstallingPath] = useState("");
  const [installArgs, setInstallArgs] = useState("");
  const [sourceServerIp, setSourceServerIp] = useState("");
  const [installAll, setInstallAll] = useState(false);
  
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchApps = async (refresh: boolean = false) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await getAppsClient(server, refresh);
      setApps(data);
    } catch (err) {
      setErrorMsg("Failed to fetch applications.");
      setApps([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchApps(); 
  }, [server]);

  const handleUninstall = async (app: InstalledApp) => {
    if (!confirm(`Are you sure you want to uninstall ${app.name}?`)) return;
    const success = await uninstallAppClient(server, app.uninstallString);
    if (success) {
      alert("Uninstall completed.");
      fetchApps(true);
    } else {
      alert("Failed to uninstall. The process might require interactive input or failed silently.");
    }
  };

  const handleSelectInstaller = (path: string, srcServer: string) => {
    setInstallingPath(path);
    setSourceServerIp(srcServer);
    setIsPickerOpen(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const path = await uploadInstallerClient(server, file);
      if (path) {
        setInstallingPath(path);
        setSourceServerIp(server); // uploaded directly to target
      } else {
        alert("Failed to upload installer.");
      }
    } catch (err) {
      alert("Failed to upload installer.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsLoading(false);
  };

  const handleInstall = async () => {
    if (!installingPath) return;
    setIsLoading(true);

    if (installAll) {
      const servers = await getServersClient();
      const promises = servers.map(s => installAppClient(s.ip, installingPath, installArgs, sourceServerIp));
      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === "fulfilled" && r.value === true).length;
      alert(`Install completed on ${successCount} out of ${servers.length} servers.`);
    } else {
      const success = await installAppClient(server, installingPath, installArgs, sourceServerIp);
      if (success) {
        alert("Install completed.");
      } else {
        alert("Failed to install. Ensure the installer can run silently.");
      }
    }

    setInstallingPath("");
    setInstallArgs("");
    setSourceServerIp("");
    setInstallAll(false);
    fetchApps(true);
    setIsLoading(false);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const exportCsv = () => {
    if (apps.length === 0) return;
    const headers = ["Name", "Publisher", "Version", "Installed", "Location", "Size MB"];
    const rows = apps.map(a => `"${a.name}","${a.publisher}","${a.version}","${a.installDate}","${a.location}","${a.sizeMB}"`);
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `apps_${server}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = apps.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) || a.publisher.toLowerCase().includes(q.toLowerCase()));
  
  const sorted = [...filtered].sort((a, b) => {
    let valA: any = a[sortColumn];
    let valB: any = b[sortColumn];
    
    if (sortColumn === "sizeMB") {
      valA = parseFloat(a.sizeMB) || 0;
      valB = parseFloat(b.sizeMB) || 0;
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

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
              onClick={exportCsv} 
              disabled={apps.length === 0}
              className="flex items-center gap-2 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] hover:border-[var(--amber)] hover:text-[var(--amber)] disabled:opacity-50"
            >
              <Download size={14} /> Export CSV
            </button>
            <button 
              onClick={() => fetchApps(true)} 
              disabled={isLoading}
              className="flex items-center gap-2 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] hover:border-[var(--amber)] hover:text-[var(--amber)] disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
            <button 
              onClick={handleUploadClick} 
              className="flex items-center gap-2 rounded-md bg-[var(--bg-surface)] border border-[var(--border-c)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] hover:border-[var(--amber)] hover:text-[var(--amber)]"
            >
              <Upload size={14} /> Upload
            </button>
            <button 
              onClick={() => setIsPickerOpen(true)} 
              className="flex items-center gap-2 rounded-md bg-[var(--amber)] px-3 py-1.5 text-[12px] font-semibold text-black hover:bg-[var(--amber-hover)]"
            >
              <Plus size={14} /> Install Remote
            </button>
          </>
        }
      />
      <ServerSelector value={server} onChange={setServer} />

      {installingPath && (
        <div className="nx-card p-4 mb-4 mt-4 border border-[var(--amber)]">
          <div className="eyebrow mb-2">Install Application</div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-[10px] text-[var(--text-sub)] uppercase">Installer Path</label>
              <div className="mono text-[12px]">{installingPath}</div>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-[var(--text-sub)] uppercase">Install Arguments (Optional)</label>
              <input 
                type="text" 
                value={installArgs} 
                onChange={e => setInstallArgs(e.target.value)} 
                placeholder={installingPath.toLowerCase().endsWith(".msi") ? "/qn /norestart" : "/S"} 
                className="w-full mt-1 rounded bg-[var(--bg-surface)] border border-[var(--border-c)] px-2 py-1 text-[12px] mono focus:border-[var(--amber)] outline-none"
              />
            </div>
            <div className="flex flex-col justify-end self-stretch pb-0.5 gap-2">
              <label className="flex items-center gap-2 text-[12px] text-[var(--text)]">
                <input type="checkbox" checked={installAll} onChange={e => setInstallAll(e.target.checked)} className="rounded border-[var(--border-c)]" />
                Install on all servers
              </label>
              <div className="flex items-center">
                <button 
                  onClick={handleInstall} 
                  disabled={isLoading}
                  className="h-7 px-4 rounded bg-[var(--amber)] text-black text-[12px] font-medium hover:bg-[var(--amber-hover)] disabled:opacity-50"
                >
                  Start Install
                </button>
                <button 
                  onClick={() => {
                    setInstallingPath("");
                    setInstallAll(false);
                  }}
                  className="h-7 px-3 ml-2 rounded border border-[var(--border-dim)] text-[var(--text-sub)] text-[12px] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="nx-card overflow-hidden mt-4">
        <div className="relative border-b border-[var(--border-c)] p-3">
          <Search size={13} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="mono w-72 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-1.5 pl-8 pr-2 text-[12px] focus:border-[var(--amber)] focus:outline-none" />
        </div>
        <div className="overflow-auto flex-1 h-[calc(100vh-250px)]">
          <table className="w-full text-[12px] relative">
            <thead className="sticky top-0 bg-[#0a0f18]/95 backdrop-blur-sm z-10 shadow-[0_1px_0_var(--border-c)]">
              <tr className="eyebrow text-left">
                <th className="px-4 py-2 cursor-pointer select-none hover:text-[var(--text)]" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-1">Name <SortIcon column="name" /></div>
                </th>
                <th className="cursor-pointer select-none hover:text-[var(--text)]" onClick={() => handleSort("publisher")}>
                  <div className="flex items-center gap-1">Publisher <SortIcon column="publisher" /></div>
                </th>
                <th className="cursor-pointer select-none hover:text-[var(--text)]" onClick={() => handleSort("version")}>
                  <div className="flex items-center gap-1">Version <SortIcon column="version" /></div>
                </th>
                <th className="cursor-pointer select-none hover:text-[var(--text)]" onClick={() => handleSort("installDate")}>
                  <div className="flex items-center gap-1">Installed <SortIcon column="installDate" /></div>
                </th>
                <th>Location</th>
                <th className="cursor-pointer select-none hover:text-[var(--text)]" onClick={() => handleSort("sizeMB")}>
                  <div className="flex items-center gap-1">Size <SortIcon column="sizeMB" /></div>
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="mono">
              {isLoading && apps.length === 0 ? (
                <tr><td colSpan={7} className="py-4 text-center text-[var(--text-sub)]">Loading apps...</td></tr>
              ) : errorMsg ? (
                <tr><td colSpan={7} className="py-4 text-center text-red-400">{errorMsg}</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={7} className="py-4 text-center text-[var(--text-sub)]">No apps found</td></tr>
              ) : (
                sorted.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] group">
                    <td className="px-4 py-2 text-[var(--text)]">{a.name}</td>
                    <td className="text-[var(--text-sub)]">{a.publisher}</td>
                    <td className="text-[var(--amber)]">{a.version}</td>
                    <td className="text-[var(--text-sub)]">{a.installDate}</td>
                    <td className="truncate text-[var(--text-sub)] max-w-[200px]" title={a.location}>{a.location}</td>
                    <td className="text-[var(--text-sub)] whitespace-nowrap">{a.sizeMB} MB</td>
                    <td className="pr-4 py-2 text-right">
                      <button 
                        onClick={() => handleUninstall(a)} 
                        title="Uninstall"
                        className="opacity-0 group-hover:opacity-100 text-[var(--text-sub)] hover:text-red-500 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RemoteFilePicker 
        targetServer={server} 
        isOpen={isPickerOpen} 
        onOpenChange={setIsPickerOpen} 
        onSelect={handleSelectInstaller} 
      />
    </PageWrapper>
  );
}
