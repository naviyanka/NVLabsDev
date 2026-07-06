import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Server as ServerIcon, ShieldAlert, RefreshCw, Download, CheckSquare } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getUpdatesClient, checkUpdatesClient, installUpdatesClient, type WindowsUpdate } from "@/api/client";

export const Route = createFileRoute("/updates")({
  head: () => ({ meta: [{ title: "Windows Updates — NEXUS" }] }),
  component: UpdatesPage,
});

function UpdatesPage() {
  const [server, setServer] = useState("dc");
  const [updates, setUpdates] = useState<WindowsUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchCachedUpdates = async () => {
    setIsLoading(true);
    const data = await getUpdatesClient(server);
    setUpdates(data);
    setSelected(new Set());
    setIsLoading(false);
  };

  const handleCheckUpdates = async () => {
    setIsLoading(true);
    const data = await checkUpdatesClient(server);
    setUpdates(data);
    setSelected(new Set());
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCachedUpdates();
  }, [server]);

  const handleInstallSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Install ${selected.size} updates on ${server}?`)) return;
    
    setIsLoading(true);
    const success = await installUpdatesClient(server, Array.from(selected));
    if (success) {
      alert("Installation started in the background. You will receive a notification when it completes.");
      // Optimistically remove from list
      setUpdates(updates.filter(u => !selected.has(u.title)));
      setSelected(new Set());
    } else {
      alert("Failed to start installation.");
    }
    setIsLoading(false);
  };

  const handleInstallAll = async () => {
    if (updates.length === 0) return;
    if (!confirm(`Install all ${updates.length} updates on ${server}?`)) return;
    
    setIsLoading(true);
    const success = await installUpdatesClient(server, updates.map(u => u.title));
    if (success) {
      alert("Installation started in the background. You will receive a notification when it completes.");
      setUpdates([]);
      setSelected(new Set());
    } else {
      alert("Failed to start installation.");
    }
    setIsLoading(false);
  };

  const toggleSelect = (title: string) => {
    const newSel = new Set(selected);
    if (newSel.has(title)) newSel.delete(title);
    else newSel.add(title);
    setSelected(newSel);
  };

  const toggleAll = () => {
    if (selected.size === updates.length) setSelected(new Set());
    else setSelected(new Set(updates.map(u => u.title)));
  };

  return (
    <PageWrapper>
      <PageHeader 
        title="Windows Updates" 
        description="Check and install missing software updates across the fleet." 
        icon={Download} 
      />

      <div className="mt-6 flex items-center justify-between rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] p-2">
        <ServerSelector value={server} onChange={setServer} />
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCheckUpdates} 
            disabled={isLoading}
            className="flex items-center gap-2 rounded bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] border border-[var(--border-dim)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
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
            className="rounded bg-[var(--bg-surface)] border border-[var(--border-dim)] px-3 py-1.5 text-[12px] font-medium disabled:opacity-50 hover:bg-[var(--bg-card)]"
          >
            Install Selected ({selected.size})
          </button>
          <button 
            onClick={handleInstallAll}
            disabled={updates.length === 0 || isLoading}
            className="rounded bg-[var(--blue)] px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50 hover:bg-[var(--blue-hover)]"
          >
            Install All
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] overflow-hidden">
        {isLoading && updates.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-[var(--text-sub)]">Checking for updates (this usually takes 20-30 seconds)...</div>
        ) : updates.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <CheckSquare size={32} className="text-[var(--green)] mb-3" />
            <div className="text-[14px] font-medium text-[var(--text)]">Up to date</div>
            <div className="text-[12px] text-[var(--text-sub)] mt-1 max-w-md">
              No pending updates found for {server}.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="border-b border-[var(--border-dim)] bg-[var(--bg-card)] text-[11px] uppercase tracking-wider text-[var(--text-sub)]">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input 
                      type="checkbox" 
                      checked={selected.size === updates.length && updates.length > 0}
                      onChange={toggleAll}
                      className="rounded border-[var(--border-dim)] bg-transparent"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-dim)]">
                {updates.map((u) => (
                  <tr key={u.title} className="group hover:bg-[var(--bg-card)] transition-colors">
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={selected.has(u.title)}
                        onChange={() => toggleSelect(u.title)}
                        className="rounded border-[var(--border-dim)] bg-transparent"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{u.title}</td>
                    <td className="px-4 py-3 text-[11px] text-[var(--text-sub)] max-w-md truncate" title={u.description}>{u.description}</td>
                    <td className="px-4 py-3 text-[11px] mono text-[var(--text-sub)]">
                      {(u.maxDownloadSize / 1024 / 1024).toFixed(1)} MB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
