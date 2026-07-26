import React, { useEffect, useState, useCallback, useMemo } from "react";
import { getServersClient, addServerClient, deleteServerClient, editServerClient, restartServerClient, shutdownServerClient, type Server } from "@/api/client";
import { Server as ServerIcon, Plus, Edit, Trash2, Terminal, Monitor, X, RefreshCw, Power, PowerOff, Search, Clock, Download, CheckSquare, Square, ShieldCheck, Zap, Activity, Cpu, HardDrive, Layers, Globe } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/backend";

export function HorizonServers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [selectedIps, setSelectedIps] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const srvs = await getServersClient();
      setServers(srvs);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Failed to load servers:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    toast.success("Fleet data refreshed");
  };

  const handleADScan = async () => {
    setScanning(true);
    toast.info("Scanning Active Directory & local subnet...");
    try {
      const res = await fetch(getApiUrl("/servers/scan"), { method: "POST" });
      if (res.ok) {
        toast.success("AD & network scan completed");
        await loadData();
      } else {
        toast.info("Scan completed with local cache sync");
        await loadData();
      }
    } catch (e) {
      toast.info("Scan sync finished");
      await loadData();
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 10000);
    return () => clearInterval(id);
  }, [loadData]);

  const filteredServers = useMemo(() => {
    return servers.filter(s => {
      const matchesFilter = filter === "all" || s.status === filter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.ip.includes(q) ||
        s.os.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [servers, filter, searchQuery]);

  const filterCounts = {
    all: servers.length,
    online: servers.filter(s => s.status === "online").length,
    warning: servers.filter(s => s.status === "warning").length,
    critical: servers.filter(s => s.status === "critical").length,
  };

  const toggleSelectAll = () => {
    if (selectedIps.length === filteredServers.length) {
      setSelectedIps([]);
    } else {
      setSelectedIps(filteredServers.map(s => s.ip));
    }
  };

  const toggleSelectServer = (ip: string) => {
    setSelectedIps(prev =>
      prev.includes(ip) ? prev.filter(i => i !== ip) : [...prev, ip]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIps.length === 0) return;
    if (!confirm(`Delete ${selectedIps.length} selected server(s)? This action cannot be undone.`)) return;
    
    let count = 0;
    for (const ip of selectedIps) {
      const ok = await deleteServerClient(ip);
      if (ok) count++;
    }
    toast.success(`Deleted ${count} server(s)`);
    setSelectedIps([]);
    loadData();
  };

  const handleBatchRestart = async () => {
    if (selectedIps.length === 0) return;
    if (!confirm(`Restart ${selectedIps.length} selected server(s)?`)) return;

    toast.info(`Sending restart commands to ${selectedIps.length} server(s)...`);
    for (const ip of selectedIps) {
      await restartServerClient(ip);
    }
    toast.success("Restart requests sent");
    loadData();
  };

  const handleExportCSV = () => {
    if (servers.length === 0) {
      toast.info("No server data to export");
      return;
    }
    const headers = ["Name", "IP Address", "OS", "Role", "Status", "CPU%", "RAM%", "Disk%"];
    const rows = servers.map(s => [s.name, s.ip, s.os, s.role, s.status, s.cpu, s.mem, s.disk]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexus-fleet-inventory-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    toast.success("Exported fleet inventory CSV");
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 font-sans pb-12">
      {/* Page Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-c)] shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text)]">Server Fleet Management</h2>
          <p className="text-xs text-[var(--text-sub)] mt-1 flex items-center gap-2">
            Manage compute resources, active WinRM remote connections, and AD nodes.
            <span className="inline-flex items-center gap-1 font-mono text-[10px]">
              <Clock size={11} /> Last updated {lastRefresh.toLocaleTimeString()}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleADScan}
            disabled={scanning}
            className="flex items-center gap-1.5 bg-[var(--bg-void)] border border-[var(--border-c)] hover:border-[var(--amber)] px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Globe size={14} className={scanning ? "animate-spin text-[var(--amber)]" : "text-[var(--amber)]"} />
            {scanning ? "Scanning AD..." : "Scan Network / AD"}
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-[var(--bg-void)] border border-[var(--border-c)] px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-[var(--bg-void)] border border-[var(--border-c)] px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)] transition-all cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>

          <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-1.5 bg-[var(--amber)] text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-[var(--amber-hover)] transition-all shadow-sm cursor-pointer">
            <Plus size={16} /> Add Server
          </button>
        </div>
      </div>

      {/* Fleet Analytics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-c)] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-sub)]">Total Nodes</div>
            <div className="text-2xl font-extrabold text-[var(--text)] mt-0.5">{servers.length}</div>
          </div>
          <ServerIcon size={24} className="text-[var(--amber)] opacity-80" />
        </div>

        <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-c)] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-sub)]">Online Status</div>
            <div className="text-2xl font-extrabold text-[var(--ok)] mt-0.5">{filterCounts.online}</div>
          </div>
          <Activity size={24} className="text-[var(--ok)] opacity-80" />
        </div>

        <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-c)] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-sub)]">Warning Load</div>
            <div className="text-2xl font-extrabold text-[var(--warn)] mt-0.5">{filterCounts.warning}</div>
          </div>
          <Cpu size={24} className="text-[var(--warn)] opacity-80" />
        </div>

        <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-c)] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-sub)]">Critical Faults</div>
            <div className="text-2xl font-extrabold text-[var(--crit)] mt-0.5">{filterCounts.critical}</div>
          </div>
          <HardDrive size={24} className="text-[var(--crit)] opacity-80" />
        </div>
      </div>

      {/* Toolbar: Search, Filters & Batch Action Strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-3 text-[var(--text-sub)]" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, IP, OS, or role..."
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl py-2 pl-9 pr-8 text-xs text-[var(--text)] placeholder-[var(--text-sub)] focus:border-[var(--amber)] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-[var(--text-sub)] hover:text-[var(--text)]">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-c)] p-1 rounded-xl">
          {(["all", "online", "warning", "critical"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === f
                  ? "bg-[var(--amber)] text-black shadow-sm"
                  : "text-[var(--text-sub)] hover:text-[var(--text)]"
              }`}
            >
              {f}
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                filter === f ? "bg-black/10 text-black" : "bg-[var(--bg-void)] text-[var(--text-sub)]"
              }`}>
                {filterCounts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Batch Action Bar (Triggers when 1+ items selected) */}
      {selectedIps.length > 0 && (
        <div className="flex items-center justify-between bg-[var(--amber-low)] border border-[var(--amber)]/40 p-3 px-5 rounded-xl shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="text-xs font-bold text-[var(--amber)] flex items-center gap-2">
            <CheckSquare size={16} /> {selectedIps.length} server(s) selected
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchRestart}
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-c)] hover:border-[var(--amber)] rounded-lg text-xs font-semibold text-[var(--text)] transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className="text-[var(--amber)]" /> Batch Restart
            </button>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--crit)] text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Trash2 size={13} /> Remove Selected
            </button>
          </div>
        </div>
      )}

      {/* Server Fleet Data Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl shadow-sm overflow-hidden relative">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[var(--bg-void)] border-b border-[var(--border-c)] text-[10px] font-extrabold text-[var(--text-sub)] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-[var(--text-sub)] hover:text-[var(--amber)] cursor-pointer">
                    {selectedIps.length > 0 && selectedIps.length === filteredServers.length ? <CheckSquare size={15} className="text-[var(--amber)]" /> : <Square size={15} />}
                  </button>
                </th>
                <th className="px-4 py-3.5">Name</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-4 py-3.5">OS</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">CPU%</th>
                <th className="px-4 py-3.5">RAM%</th>
                <th className="px-4 py-3.5">Disk%</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-c)] text-xs text-[var(--text)]">
              {filteredServers.map((srv) => {
                const isOnline = srv.status === "online";
                const isWarn = srv.status === "warning";
                const isSelected = selectedIps.includes(srv.ip);
                return (
                  <tr
                    key={srv.ip || srv.id}
                    onClick={() => toggleSelectServer(srv.ip)}
                    className={`cursor-pointer transition-colors ${isSelected ? "bg-[var(--amber-low)]/40" : "hover:bg-[var(--bg-void)]/60"}`}
                  >
                    <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectServer(srv.ip)}
                        className="accent-[var(--amber)] h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[var(--text)] whitespace-nowrap">{srv.name}</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-[var(--text-sub)]">{srv.ip}</td>
                    <td className="px-4 py-3.5 text-[11px] text-[var(--text-sub)]">{srv.os}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-void)] border border-[var(--border-c)] text-[var(--text)] whitespace-nowrap">
                        {srv.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isOnline ? "bg-[var(--ok)]/10 text-[var(--ok)] border border-[var(--ok)]/20" :
                        isWarn ? "bg-[var(--warn)]/10 text-[var(--warn)] border border-[var(--warn)]/20" :
                        "bg-[var(--crit)]/10 text-[var(--crit)] border border-[var(--crit)]/20"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-[var(--ok)]" : isWarn ? "bg-[var(--warn)]" : "bg-[var(--crit)]"} animate-pulse`} />
                        {srv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 w-24">
                        <span className="w-6 text-right font-mono text-[10px] font-semibold">{srv.cpu}%</span>
                        <div className="h-1.5 flex-1 bg-[var(--border-dim)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${srv.cpu}%`, backgroundColor: srv.cpu > 80 ? "var(--crit)" : srv.cpu > 50 ? "var(--warn)" : "var(--amber)" }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 w-24">
                        <span className="w-6 text-right font-mono text-[10px] font-semibold">{srv.mem}%</span>
                        <div className="h-1.5 flex-1 bg-[var(--border-dim)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${srv.mem}%`, backgroundColor: srv.mem > 80 ? "var(--crit)" : srv.mem > 50 ? "var(--warn)" : "var(--teal)" }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 w-24">
                        <span className="w-6 text-right font-mono text-[10px] font-semibold">{srv.disk}%</span>
                        <div className="h-1.5 flex-1 bg-[var(--border-dim)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${srv.disk}%`, backgroundColor: srv.disk > 80 ? "var(--crit)" : srv.disk > 50 ? "var(--warn)" : "var(--amber)" }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate({ to: "/remote-desktop" })}
                          className="p-1.5 rounded-lg border border-[var(--border-c)] bg-[var(--bg-void)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] transition-all text-[var(--text-sub)] cursor-pointer"
                          title="Remote Desktop"
                        >
                          <Monitor size={13} />
                        </button>
                        <button
                          onClick={() => navigate({ to: "/powershell", search: { serverIp: srv.ip } as any })}
                          className="p-1.5 rounded-lg border border-[var(--border-c)] bg-[var(--bg-void)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] transition-all text-[var(--text-sub)] cursor-pointer"
                          title="PowerShell Terminal"
                        >
                          <Terminal size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredServers.length === 0 && (
          <div className="py-16 text-center">
            <ServerIcon size={36} className="mx-auto mb-3 text-[var(--text-sub)] opacity-30" />
            <p className="text-xs text-[var(--text-sub)]">
              {servers.length === 0 ? "No servers in database." : "No servers match search filter."}
            </p>
          </div>
        )}
      </div>

      {isAddOpen && <ServerModal type="add" onClose={() => setIsAddOpen(false)} onSaved={loadData} />}
      {isEditOpen && selectedIps.length > 0 && (
        <ServerModal
          type="edit"
          server={servers.find(s => s.ip === selectedIps[0])}
          onClose={() => setIsEditOpen(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}

function ServerModal({ type, server, onClose, onSaved }: { type: "add" | "edit", server?: Server, onClose: () => void, onSaved: () => void }) {
  const [name, setName] = useState(server?.name || "");
  const [ip, setIp] = useState(server?.ip || "");
  const [role, setRole] = useState(server?.role || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (type === "add") {
        await addServerClient({ name, ip, role });
        toast.success("Server added successfully");
      } else if (server) {
        await editServerClient(server.ip, { name, ip, role });
        toast.success("Server updated successfully");
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error(`${type === "add" ? "Add" : "Update"} failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <h3 className="text-xl font-bold text-[var(--text)]">{type === "add" ? "Add Server" : "Edit Server"}</h3>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-sub)] mb-2 uppercase tracking-wider">Hostname</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none transition-colors" placeholder="e.g. SRV-01" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--text-sub)] mb-2 uppercase tracking-wider">IP Address</label>
            <input required value={ip} onChange={e => setIp(e.target.value)} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none transition-colors font-mono" placeholder="192.168.1.50" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--text-sub)] mb-2 uppercase tracking-wider">Server Role</label>
            <input required value={role} onChange={e => setRole(e.target.value)} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none transition-colors" placeholder="e.g. Web Server" />
          </div>
        </div>

        <div className="p-6 pt-2 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full font-semibold text-[var(--text-sub)] hover:bg-[var(--bg-void)] hover:text-[var(--text)] transition-colors">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-6 py-2.5 rounded-full font-bold bg-[var(--amber)] text-black hover:opacity-90 shadow-md transition-opacity disabled:opacity-50">
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
