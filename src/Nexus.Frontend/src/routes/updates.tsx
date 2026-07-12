import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { ShieldAlert, RefreshCw, Download, CheckSquare, ChevronUp, ChevronDown, X } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getUpdatesClient, checkUpdatesClient, installUpdatesClient, type WindowsUpdate } from "@/api/client";

export const Route = createFileRoute("/updates")({
  head: () => ({ meta: [{ title: "Windows Updates — NEXUS" }] }),
  component: UpdatesPage,
});

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmLabel = "Confirm", isCritical = false }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-3">
          <div className="eyebrow text-[var(--text)]">{title}</div>
          <button onClick={onCancel} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5">
          <p className="text-[13px] text-[var(--text)] mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="rounded px-4 py-1.5 text-[12px] font-medium text-[var(--text-sub)] hover:text-white">Cancel</button>
            <button 
              onClick={onConfirm} 
              className={`rounded px-4 py-1.5 text-[12px] font-semibold text-black transition-colors ${isCritical ? 'bg-[var(--crit)] hover:bg-[var(--crit)]/80 text-white' : 'bg-[var(--amber)] hover:bg-[var(--amber-hover)]'}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UpdatesPage() {
  const [server, setServer] = useState("dc");
  const [updates, setUpdates] = useState<WindowsUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [auto, setAuto] = useState(true);

  // Sorting
  const [sortCol, setSortCol] = useState<keyof WindowsUpdate>("title");
  const [sortAsc, setSortAsc] = useState(true);

  // Dialog state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({ isOpen: false, title: "", message: "", action: async () => {} });

  const fetchCachedUpdates = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getUpdatesClient(server);
      setUpdates(data);
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleCheckUpdates = async () => {
    setIsLoading(true);
    try {
      const data = await checkUpdatesClient(server);
      setUpdates(data);
      setSelected(new Set());
    } catch (e) {
      alert("Failed to check for updates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCachedUpdates(true);
    setSelected(new Set());
  }, [server]);

  // Auto-refresh cached updates to see when they clear out after install
  useEffect(() => {
    let id: number | undefined;
    if (auto && !isLoading) {
      id = window.setInterval(() => fetchCachedUpdates(false), 5000);
    }
    return () => { if (id) window.clearInterval(id); };
  }, [server, auto, isLoading]);

  const executeInstall = async (titles: string[]) => {
    setConfirmState(p => ({ ...p, isOpen: false }));
    setIsLoading(true);
    try {
      const success = await installUpdatesClient(server, titles);
      if (success) {
        // We do not wait for the long install job, the backend returns Accepted() and runs it in the background
        setUpdates(updates.filter(u => !titles.includes(u.title)));
        setSelected(new Set());
      } else {
        alert("Failed to start installation.");
      }
    } catch (e) {
      alert("An error occurred starting the installation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstallSelected = () => {
    if (selected.size === 0) return;
    setConfirmState({
      isOpen: true,
      title: "Confirm Installation",
      message: `Are you sure you want to install ${selected.size} updates on ${server.toUpperCase()}? This will run silently in the background.`,
      action: () => executeInstall(Array.from(selected))
    });
  };

  const handleInstallAll = () => {
    if (updates.length === 0) return;
    setConfirmState({
      isOpen: true,
      title: "Confirm Installation",
      message: `Are you sure you want to install all ${updates.length} updates on ${server.toUpperCase()}? This will run silently in the background.`,
      action: () => executeInstall(updates.map(u => u.title))
    });
  };

  const toggleSelect = (title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSel = new Set(selected);
    if (newSel.has(title)) newSel.delete(title);
    else newSel.add(title);
    setSelected(newSel);
  };

  const toggleAll = () => {
    if (selected.size === updates.length) setSelected(new Set());
    else setSelected(new Set(updates.map(u => u.title)));
  };

  const handleSort = (col: keyof WindowsUpdate) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const SortIcon = ({ col }: { col: keyof WindowsUpdate }) => {
    if (sortCol !== col) return null;
    return sortAsc ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
  };

  const sortedUpdates = useMemo(() => {
    let res = [...updates];
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
  }, [updates, sortCol, sortAsc]);

  return (
    <PageWrapper>
      <PageHeader 
        title="Windows Updates" 
        description="Check and install missing software updates across the fleet." 
        icon={Download} 
      />

      <div className="mt-6 flex items-center justify-between rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] p-2">
        <ServerSelector value={server} onChange={setServer} />
        <div className="flex items-center gap-4">
          <label className="mono flex items-center gap-1.5 text-[11px] text-[var(--text-sub)] cursor-pointer hover:text-white transition-colors">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-[var(--amber)]" />
            Auto-refresh 5s
          </label>
          <button 
            onClick={handleCheckUpdates} 
            disabled={isLoading}
            className="flex items-center gap-2 rounded bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] border border-[var(--border-dim)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-[var(--amber)]" : ""} />
            Check for Updates
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-[12px] text-[var(--text-sub)]">
          {updates.length} available updates
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleInstallSelected}
            disabled={selected.size === 0 || isLoading}
            className="rounded bg-[var(--bg-surface)] border border-[var(--border-dim)] px-3 py-1.5 text-[12px] font-medium transition-colors hover:border-[var(--amber)] hover:text-[var(--amber)] disabled:opacity-50 disabled:hover:border-[var(--border-dim)] disabled:hover:text-white"
          >
            Install Selected ({selected.size})
          </button>
          <button 
            onClick={handleInstallAll}
            disabled={updates.length === 0 || isLoading}
            className="rounded bg-[var(--amber)] px-4 py-1.5 text-[12px] font-bold text-black transition-colors hover:bg-[var(--amber-hover)] disabled:opacity-50 disabled:bg-[var(--bg-surface)] disabled:text-[var(--text-sub)]"
          >
            Install All
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] overflow-hidden">
        {isLoading && updates.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <RefreshCw size={24} className="animate-spin text-[var(--amber)] mb-4" />
            <div className="text-[14px] font-medium text-[var(--text)]">Checking for updates...</div>
            <div className="text-[12px] text-[var(--text-sub)] mt-1">This usually takes 20-30 seconds.</div>
          </div>
        ) : updates.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <CheckSquare size={32} className="text-[var(--teal)] mb-3" />
            <div className="text-[14px] font-medium text-[var(--text)]">Up to date</div>
            <div className="text-[12px] text-[var(--text-sub)] mt-1 max-w-md">
              No pending updates found for {server}.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] select-none">
              <thead className="border-b border-[var(--border-dim)] bg-[var(--bg-card)] text-[11px] uppercase tracking-wider text-[var(--text-sub)]">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input 
                      type="checkbox" 
                      checked={selected.size === updates.length && updates.length > 0}
                      onChange={toggleAll}
                      className="accent-[var(--amber)]"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('title')} title="Sort by Title">Title <SortIcon col="title"/></th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => handleSort('maxDownloadSize')} title="Sort by Size">Size <SortIcon col="maxDownloadSize"/></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-dim)]">
                {sortedUpdates.map((u) => {
                  const isSelected = selected.has(u.title);
                  return (
                    <tr 
                      key={u.title} 
                      onClick={() => toggleSelect(u.title)}
                      className={`group cursor-pointer transition-colors ${isSelected ? "bg-[var(--amber-low)]/40" : "hover:bg-[var(--amber-low)]/15"}`}
                    >
                      <td className={`px-4 py-3 border-l-2 ${isSelected ? "border-[var(--amber)]" : "border-transparent"}`}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => toggleSelect(u.title, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="accent-[var(--amber)] pointer-events-none"
                        />
                      </td>
                      <td className={`px-4 py-3 font-medium ${isSelected ? "text-[var(--amber)]" : "text-[var(--text)]"}`}>{u.title}</td>
                      <td className="px-4 py-3 text-[11px] text-[var(--text-sub)] max-w-md truncate" title={u.description}>{u.description}</td>
                      <td className="px-4 py-3 text-[11px] mono text-[var(--text-sub)]">
                        {(u.maxDownloadSize / 1024 / 1024).toFixed(1)} MB
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.action}
        onCancel={() => setConfirmState(p => ({ ...p, isOpen: false }))}
        confirmLabel="Install Updates"
      />
    </PageWrapper>
  );
}
