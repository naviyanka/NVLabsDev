import React, { useEffect, useState, useCallback } from "react";
import { getServersClient, addServerClient, deleteServerClient, editServerClient, restartServerClient, shutdownServerClient, type Server } from "@/api/client";
import { Server as ServerIcon, Plus, Edit, Trash2, Terminal, Monitor, X, RefreshCw, Power, PowerOff, Search, Clock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function HorizonServers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 10000);
    return () => clearInterval(id);
  }, [loadData]);

  const filteredServers = servers.filter(s => {
    const matchesFilter =
      filter === "all" ||
      s.status === filter;
    const matchesSearch =
      searchQuery === "" ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ip.includes(searchQuery) ||
      s.os.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterCounts = {
    all: servers.length,
    online: servers.filter(s => s.status === "online").length,
    warning: servers.filter(s => s.status === "warning").length,
    critical: servers.filter(s => s.status === "critical").length,
  };

  const handleDelete = async () => {
    if (!selectedIp) return;
    const srv = servers.find(s => s.ip === selectedIp);
    if (!confirm(`Delete ${srv?.name}? This action cannot be undone.`)) return;
    try {
      const ok = await deleteServerClient(selectedIp);
      if (ok) {
        toast.success(`${srv?.name} deleted`);
        setSelectedIp(null);
        loadData();
      } else {
        toast.error(`Failed to delete ${srv?.name}`);
      }
    } catch (e) {
      toast.error(`Delete failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  };

  const handleRestart = async (ip: string, name: string) => {
    if (!confirm(`Restart ${name}?`)) return;
    toast.info(`Restarting ${name}...`);
    try {
      const ok = await restartServerClient(ip);
      if (ok) { toast.success(`${name} is restarting`); loadData(); }
      else toast.error(`Failed to restart ${name}`);
    } catch (e) {
      toast.error(`Restart failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  };

  const handleShutdown = async (ip: string, name: string) => {
    if (!confirm(`Shut down ${name}? This will power off the server.`)) return;
    toast.info(`Shutting down ${name}...`);
    try {
      const ok = await shutdownServerClient(ip);
      if (ok) { toast.success(`${name} is shutting down`); loadData(); }
      else toast.error(`Failed to shut down ${name}`);
    } catch (e) {
      toast.error(`Shutdown failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw size={24} className="animate-spin text-[var(--amber)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-sub)]">Loading Horizon Fleet…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 font-sans">
      {/* Page Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[var(--text)]">Server Fleet</h2>
          <p className="text-sm text-[var(--text-sub)] mt-1">
            Manage and monitor compute resources across all availability zones.
            <span className="inline-flex items-center gap-1.5 ml-3 text-[10px] text-[var(--text-sub)]">
              <Clock size={11} />
              Last updated {lastRefresh.toLocaleTimeString()}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-transparent border border-[var(--border-c)] px-4 py-2.5 rounded-full font-semibold text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 bg-[var(--amber)] text-white px-5 py-2.5 rounded-full font-semibold hover:opacity-90 transition-all shadow-sm">
            <Plus size={18} />
            Add Server
          </button>
          <button
            onClick={() => selectedIp ? setIsEditOpen(true) : toast.info("Select a server first")}
            className={`flex items-center gap-2 bg-transparent border border-[var(--border-c)] px-5 py-2.5 rounded-full font-semibold transition-colors ${selectedIp ? "text-[var(--text)] hover:bg-[var(--bg-surface)]" : "text-[var(--text-sub)] opacity-50 cursor-not-allowed"}`}
          >
            <Edit size={18} />
            Edit
          </button>
          <button
            onClick={() => selectedIp ? handleDelete() : toast.info("Select a server first")}
            className={`flex items-center gap-2 bg-transparent border border-[var(--border-c)] px-5 py-2.5 rounded-full font-semibold transition-colors ${selectedIp ? "text-[var(--text)] hover:bg-[var(--crit)]/10 hover:text-[var(--crit)] hover:border-[var(--crit)]/50" : "text-[var(--text-sub)] opacity-50 cursor-not-allowed"}`}
          >
            <Trash2 size={18} />
            Remove
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full md:max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, IP, OS, or role..."
          className="w-full bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-full py-2.5 pl-11 pr-4 text-sm text-[var(--text)] placeholder-[var(--text-sub)] focus:border-[var(--amber)] focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)] hover:text-[var(--text)]">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Segmented Control Filters with Counts */}
      <div className="flex flex-wrap md:inline-flex bg-[var(--bg-surface)] border border-[var(--border-c)] p-1.5 rounded-2xl md:rounded-full w-full md:w-max shadow-sm gap-1">
        {(["all", "online", "warning", "critical"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 md:flex-none justify-center px-3 md:px-5 py-2 rounded-full text-[10px] md:text-xs font-bold capitalize transition-all flex items-center gap-1 md:gap-2 ${
              filter === f
                ? "bg-[var(--amber)] text-white shadow-md"
                : "text-[var(--text-sub)] hover:text-[var(--text)]"
            }`}
          >
            {f}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              filter === f
                ? "bg-white/20 text-white"
                : "bg-[var(--bg-void)] text-[var(--text-sub)]"
            }`}>
              {filterCounts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Data Table Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-[1.5rem] shadow-sm overflow-hidden relative">
        <div className="h-1 w-full bg-[var(--amber)] absolute top-0 left-0"></div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[var(--bg-void)] border-b border-[var(--border-c)] text-[10px] md:text-[11px] font-extrabold text-[var(--text-sub)] uppercase tracking-wider">
              <tr>
                <th className="px-3 md:px-6 py-3 md:py-4">Name</th>
                <th className="px-3 md:px-6 py-3 md:py-4">IP Address</th>
                <th className="px-3 md:px-6 py-3 md:py-4">OS</th>
                <th className="px-3 md:px-6 py-3 md:py-4">Role</th>
                <th className="px-3 md:px-6 py-3 md:py-4">Status</th>
                <th className="px-3 md:px-6 py-3 md:py-4">CPU%</th>
                <th className="px-3 md:px-6 py-3 md:py-4">RAM%</th>
                <th className="px-3 md:px-6 py-3 md:py-4">Disk%</th>
                <th className="px-3 md:px-6 py-3 md:py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-c)] font-sans text-sm text-[var(--text)]">
              {filteredServers.map((srv) => {
                const isOnline = srv.status === "online";
                const isWarn = srv.status === "warning";
                const isSelected = selectedIp === srv.ip;
                return (
                  <tr
                    key={srv.ip}
                    onClick={() => setSelectedIp(srv.ip)}
                    className={`cursor-pointer transition-colors ${isSelected ? "bg-[var(--amber-low)]" : "hover:bg-[var(--bg-void)]/50"}`}
                  >
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <input type="radio" checked={isSelected} readOnly className="accent-[var(--amber)]" />
                        <span className="font-bold text-[var(--text)] whitespace-nowrap">{srv.name}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 font-mono text-[10px] md:text-xs text-[var(--text-sub)]">{srv.ip}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-2 text-[10px] md:text-xs text-[var(--text-sub)]">
                        <Terminal size={14} className="text-[var(--teal)] hidden md:block" />
                        {srv.os}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <span className="inline-flex items-center px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs font-semibold bg-[var(--bg-void)] border border-[var(--border-c)] text-[var(--text)] whitespace-nowrap">
                        {srv.role}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold ${
                        isOnline ? "bg-[var(--ok)]/10 text-[var(--ok)] border border-[var(--ok)]/20" :
                        isWarn ? "bg-[var(--warn)]/10 text-[var(--warn)] border border-[var(--warn)]/20" :
                        "bg-[var(--crit)]/10 text-[var(--crit)] border border-[var(--crit)]/20"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-[var(--ok)]" : isWarn ? "bg-[var(--warn)]" : "bg-[var(--crit)]"} animate-pulse`} />
                        {srv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-2 w-20 md:w-28">
                        <span className="w-6 md:w-8 text-right font-mono text-[10px] md:text-xs font-semibold">{srv.cpu}%</span>
                        <div className="h-1.5 flex-1 bg-[var(--border-dim)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${srv.cpu}%`, backgroundColor: srv.cpu > 80 ? "var(--crit)" : srv.cpu > 50 ? "var(--warn)" : "var(--amber)" }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-2 w-20 md:w-28">
                        <span className="w-6 md:w-8 text-right font-mono text-[10px] md:text-xs font-semibold">{srv.mem}%</span>
                        <div className="h-1.5 flex-1 bg-[var(--border-dim)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${srv.mem}%`, backgroundColor: srv.mem > 80 ? "var(--crit)" : srv.mem > 50 ? "var(--warn)" : "var(--teal)" }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-2 w-20 md:w-28">
                        <span className="w-6 md:w-8 text-right font-mono text-[10px] md:text-xs font-semibold">{srv.disk}%</span>
                        <div className="h-1.5 flex-1 bg-[var(--border-dim)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${srv.disk}%`, backgroundColor: srv.disk > 80 ? "var(--crit)" : srv.disk > 50 ? "var(--warn)" : "var(--amber)" }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate({ to: `/server/$serverId`, params: { serverId: srv.ip } }); }}
                          className="p-2 rounded-lg border border-[var(--border-c)] bg-[var(--bg-void)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] transition-all text-[var(--text-sub)]"
                          title="Remote Desktop"
                        >
                          <Monitor size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate({ to: "/powershell", search: { serverIp: srv.ip } as any }); }}
                          className="p-2 rounded-lg border border-[var(--border-c)] bg-[var(--bg-void)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] transition-all text-[var(--text-sub)]"
                          title="PowerShell"
                        >
                          <Terminal size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRestart(srv.ip, srv.name); }}
                          className="p-2 rounded-lg border border-[var(--border-c)] bg-[var(--bg-void)] hover:bg-[var(--ok)]/10 hover:text-[var(--ok)] transition-all text-[var(--text-sub)]"
                          title="Restart Server"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleShutdown(srv.ip, srv.name); }}
                          className="p-2 rounded-lg border border-[var(--border-c)] bg-[var(--bg-void)] hover:bg-[var(--crit)]/10 hover:text-[var(--crit)] transition-all text-[var(--text-sub)]"
                          title="Shutdown Server"
                        >
                          <PowerOff size={14} />
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
            <ServerIcon size={40} className="mx-auto mb-3 text-[var(--text-sub)] opacity-30" />
            <p className="text-sm text-[var(--text-sub)]">
              {servers.length === 0 ? "No servers registered yet." : "No servers match your search."}
            </p>
            {servers.length > 0 && (
              <button onClick={() => { setSearchQuery(""); setFilter("all"); }} className="mt-3 text-xs text-[var(--amber)] hover:underline">
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {isAddOpen && <ServerModal type="add" onClose={() => setIsAddOpen(false)} onSaved={loadData} />}
      {isEditOpen && selectedIp && (
        <ServerModal
          type="edit"
          server={servers.find(s => s.ip === selectedIp)}
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
          <button disabled={submitting} type="submit" className="px-6 py-2.5 rounded-full font-bold bg-[var(--amber)] text-white hover:opacity-90 shadow-md transition-opacity disabled:opacity-50">
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
