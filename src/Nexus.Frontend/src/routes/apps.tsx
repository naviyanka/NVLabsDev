import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Download, Trash2, Plus, RefreshCw } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getAppsClient, installAppClient, uninstallAppClient, type InstalledApp } from "@/api/client";
import { RemoteFilePicker } from "@/components/ui/RemoteFilePicker";

export const Route = createFileRoute("/apps")({
  head: () => ({ meta: [{ title: "Installed Apps — NEXUS" }, { name: "description", content: "Installed software inventory." }] }),
  component: AppsPage,
});

function AppsPage() {
  const [server, setServer] = useState("dc");
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [q, setQ] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [installingPath, setInstallingPath] = useState("");
  const [installArgs, setInstallArgs] = useState("");
  const [sourceServerIp, setSourceServerIp] = useState("");

  const fetchApps = async (refresh: boolean = false) => {
    setIsLoading(true);
    const data = await getAppsClient(server, refresh);
    setApps(data);
    setIsLoading(false);
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

  const handleInstall = async () => {
    if (!installingPath) return;
    setIsLoading(true);
    const success = await installAppClient(server, installingPath, installArgs, sourceServerIp);
    if (success) {
      alert("Install completed.");
      setInstallingPath("");
      setInstallArgs("");
      setSourceServerIp("");
      fetchApps(true);
    } else {
      alert("Failed to install. Ensure the installer can run silently.");
    }
    setIsLoading(false);
  };

  const filtered = apps.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) || a.publisher.toLowerCase().includes(q.toLowerCase()));

  return (
    <PageWrapper>
      <PageHeader 
        eyebrow="Management" 
        title="Installed Applications"
        right={
          <>
            <button 
              onClick={() => fetchApps(true)} 
              disabled={isLoading}
              className="flex items-center gap-2 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] hover:border-[var(--amber)] hover:text-[var(--amber)] disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
            <button 
              onClick={() => setIsPickerOpen(true)} 
              className="flex items-center gap-2 rounded-md bg-[var(--amber)] px-3 py-1.5 text-[12px] font-semibold text-black hover:bg-[var(--amber-hover)]"
            >
              <Plus size={14} /> Install App
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
            <div className="flex items-end self-stretch pb-0.5">
              <button 
                onClick={handleInstall} 
                disabled={isLoading}
                className="h-7 px-4 rounded bg-[var(--amber)] text-black text-[12px] font-medium hover:bg-[var(--amber-hover)] disabled:opacity-50"
              >
                Start Install
              </button>
              <button 
                onClick={() => setInstallingPath("")} 
                className="h-7 px-3 ml-2 rounded border border-[var(--border-dim)] text-[var(--text-sub)] text-[12px] hover:text-[var(--text)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="nx-card overflow-hidden mt-4">
        <div className="relative border-b border-[var(--border-c)] p-3">
          <Search size={13} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="mono w-72 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-1.5 pl-8 pr-2 text-[12px] focus:border-[var(--amber)] focus:outline-none" />
        </div>
        <div className="overflow-x-auto max-h-[700px]">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-[var(--bg-card)] shadow-sm z-10">
              <tr className="eyebrow border-b border-[var(--border-c)] text-left">
                <th className="px-4 py-2">Name</th><th>Publisher</th><th>Version</th><th>Installed</th><th>Location</th><th>Size</th><th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="mono">
              {isLoading && apps.length === 0 ? (
                <tr><td colSpan={7} className="py-4 text-center text-[var(--text-sub)]">Loading apps...</td></tr>
              ) : apps.length === 0 ? (
                <tr><td colSpan={7} className="py-4 text-center text-[var(--text-sub)]">No apps found</td></tr>
              ) : (
                filtered.map((a) => (
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
