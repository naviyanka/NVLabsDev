import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { 
  Network, Plus, X, Search, RefreshCw, Trash2, Edit2, ShieldCheck, 
  Cpu, Activity, LayoutGrid, List, Layers, ArrowRight, Server, Terminal,
  Sliders, Lock, ShieldAlert, Zap, Radio, CheckCircle2, ChevronRight,
  HardDrive, Copy, Check, FileCode, ArrowDown, ArrowUp, Link2, Unlink
} from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { 
  getVirtualSwitchesClient as getVirtualSwitches, 
  renameVirtualSwitchClient, 
  deleteVirtualSwitchClient, 
  createVirtualSwitchClient, 
  updateVirtualSwitchClient,
  attachVmToVirtualSwitchClient,
  detachVmFromVirtualSwitchClient,
  getVMsClient,
  type VirtualSwitch,
  type HyperVVM
} from "@/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/vswitches")({
  head: () => ({ 
    meta: [
      { title: "Hyper-V Virtual Switches — NEXUS" }, 
      { name: "description", content: "Manage Hyper-V virtual network switches, SET teaming, VLANs, QoS bandwidth limits, and VM networking." }
    ] 
  }),
  component: VSwitchesPage,
});

const TYPE_COLOR: Record<string, { badge: string; border: string; text: string }> = {
  External: { badge: "bg-[var(--amber-low)] text-[var(--amber)]", border: "border-[var(--amber)]/40", text: "text-[var(--amber)]" },
  Internal: { badge: "bg-[var(--teal-low)] text-[var(--teal)]", border: "border-[var(--teal)]/40", text: "text-[var(--teal)]" },
  Private: { badge: "bg-[var(--bg-surface)] text-[var(--text-sub)]", border: "border-[var(--border-dim)]", text: "text-[var(--text-sub)]" },
};

function VSwitchesPage() {
  const [server, setServer] = useState("nexus01");
  const [switches, setSwitches] = useState<VirtualSwitch[]>([]);
  const [vms, setVms] = useState<HyperVVM[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Layout
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"topology" | "grid" | "table">("topology");

  // Drawers & Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSwitch, setSelectedSwitch] = useState<VirtualSwitch | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [swList, vmList] = await Promise.all([
        getVirtualSwitches(server),
        getVMsClient(server)
      ]);
      setSwitches(swList);
      setVms(vmList);

      if (selectedSwitch) {
        const updated = swList.find(s => s.id === selectedSwitch.id);
        if (updated) setSelectedSwitch(updated);
      }
    } catch {
      toast.error("Failed to load Virtual Switches");
    } finally {
      setLoading(false);
    }
  }, [server, selectedSwitch]);

  useEffect(() => {
    loadData();
  }, [loadData, server]);

  const handleRename = async (id: string, currentName: string) => {
    const newName = prompt(`Enter new name for virtual switch "${currentName}":`, currentName);
    if (!newName || newName === currentName) return;
    const ok = await renameVirtualSwitchClient(server, id, newName.trim());
    if (ok) {
      toast.success(`Renamed virtual switch to "${newName}"`);
      loadData();
    } else {
      toast.error("Failed to rename virtual switch");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete virtual switch "${name}"?\nConnected VMs may lose network connectivity.`)) return;
    const ok = await deleteVirtualSwitchClient(server, id);
    if (ok) {
      toast.success(`Deleted virtual switch "${name}"`);
      if (selectedSwitch?.id === id) setSelectedSwitch(null);
      loadData();
    } else {
      toast.error("Failed to delete virtual switch");
    }
  };

  const filteredSwitches = useMemo(() => {
    return switches.filter(s => {
      const matchesSearch = search === "" ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.adapter && s.adapter.toLowerCase().includes(search.toLowerCase())) ||
        (s.notes && s.notes.toLowerCase().includes(search.toLowerCase())) ||
        s.vms.some(v => v.toLowerCase().includes(search.toLowerCase()));

      const matchesType = typeFilter === "ALL" || s.type.toUpperCase() === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [switches, search, typeFilter]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalSwitches = switches.length;
    const externalCount = switches.filter(s => s.type === "External").length;
    const internalCount = switches.filter(s => s.type === "Internal").length;
    const privateCount = switches.filter(s => s.type === "Private").length;
    const totalConnectedVMs = switches.reduce((acc, s) => acc + s.vms.length, 0);
    const totalRx = switches.reduce((acc, s) => acc + (s.trafficStats?.rxMbps || 0), 0);
    const totalTx = switches.reduce((acc, s) => acc + (s.trafficStats?.txMbps || 0), 0);
    return { totalSwitches, externalCount, internalCount, privateCount, totalConnectedVMs, totalRx, totalTx };
  }, [switches]);

  return (
    <PageWrapper>
      <PageHeader 
        eyebrow="Virtual Infrastructure Networking" 
        title="Hyper-V Virtual Switches" 
        subtitle={`Managing network virtual switch topology and SET teaming on host: ${server.toUpperCase()}`}
      />

      {/* Top Bar: Selector, Actions & Host Resource Stats */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ServerSelector value={server} onChange={setServer} />
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-xl text-[var(--text-sub)] hover:text-[var(--text)] hover:border-[var(--amber)] transition-colors"
              title="Refresh Virtual Switch Status"
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-[var(--amber)]" : ""} />
            </button>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--amber)] text-black px-4 py-2 text-xs font-bold hover:bg-[var(--amber-hover)] transition-all shadow-md"
          >
            <Plus size={16} /> New Virtual Switch
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="nx-card p-3 flex flex-col justify-between border-l-4 border-l-[var(--amber)]">
            <span className="eyebrow text-[var(--text-sub)]">Total vSwitches</span>
            <span className="display text-xl font-bold text-[var(--text)] mt-1">{stats.totalSwitches}</span>
          </div>

          <div className="nx-card p-3 flex flex-col justify-between border-l-4 border-l-[var(--amber)]">
            <span className="eyebrow text-[var(--text-sub)]">External (Physical)</span>
            <span className="display text-xl font-bold text-[var(--amber)] mt-1">{stats.externalCount}</span>
          </div>

          <div className="nx-card p-3 flex flex-col justify-between border-l-4 border-l-[var(--teal)]">
            <span className="eyebrow text-[var(--text-sub)]">Internal / Private</span>
            <span className="display text-xl font-bold text-[var(--teal)] mt-1">{stats.internalCount + stats.privateCount}</span>
          </div>

          <div className="nx-card p-3 flex flex-col justify-between border-l-4 border-l-[var(--purple,#a855f7)]">
            <span className="eyebrow text-[var(--text-sub)]">Attached VMs</span>
            <span className="display text-xl font-bold text-[var(--text)] mt-1">{stats.totalConnectedVMs} VMs</span>
          </div>

          <div className="nx-card p-3 flex flex-col justify-between border-l-4 border-l-[var(--ok)]">
            <span className="eyebrow text-[var(--text-sub)]">Traffic (Rx)</span>
            <span className="display text-xl font-bold text-[var(--ok)] mt-1">{stats.totalRx.toFixed(1)} Mbps</span>
          </div>

          <div className="nx-card p-3 flex flex-col justify-between border-l-4 border-l-[var(--cyan,#06b6d4)]">
            <span className="eyebrow text-[var(--text-sub)]">Traffic (Tx)</span>
            <span className="display text-xl font-bold text-[var(--text)] mt-1">{stats.totalTx.toFixed(1)} Mbps</span>
          </div>
        </div>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-dim)] shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-sub)]" />
            <input
              type="text"
              placeholder="Search vSwitch, physical NIC, VM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-[var(--amber)] text-[var(--text)]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-sub)] hover:text-[var(--text)]">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
          >
            <option value="ALL">All Switch Types</option>
            <option value="EXTERNAL">External</option>
            <option value="INTERNAL">Internal</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>

        {/* View Mode Selector */}
        <div className="flex border border-[var(--border-dim)] rounded-xl p-0.5 bg-[var(--bg-surface)]">
          <button
            onClick={() => setViewMode("topology")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === "topology" 
                ? "bg-[var(--bg-card)] text-[var(--amber)] shadow-sm font-bold" 
                : "text-[var(--text-sub)] hover:text-[var(--text)]"
            }`}
          >
            <Layers size={14} /> Topology View
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === "grid" 
                ? "bg-[var(--bg-card)] text-[var(--amber)] shadow-sm font-bold" 
                : "text-[var(--text-sub)] hover:text-[var(--text)]"
            }`}
          >
            <LayoutGrid size={14} /> Cards
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === "table" 
                ? "bg-[var(--bg-card)] text-[var(--amber)] shadow-sm font-bold" 
                : "text-[var(--text-sub)] hover:text-[var(--text)]"
            }`}
          >
            <List size={14} /> Table
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: TOPOLOGY DIAGRAM VIEW */}
      {viewMode === "topology" && (
        <div className="space-y-6">
          {filteredSwitches.map((s) => {
            const connectedVmObjects = vms.filter(v => s.vms.includes(v.name));
            return (
              <div 
                key={s.id} 
                className="nx-card p-6 border border-[var(--border-dim)] hover:border-[var(--amber)]/50 transition-all duration-200 relative overflow-hidden"
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-dim)]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-dim)] text-[var(--amber)]">
                      <Network size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 
                          onClick={() => setSelectedSwitch(s)}
                          className="display text-base font-bold text-[var(--text)] hover:text-[var(--amber)] cursor-pointer"
                        >
                          {s.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${TYPE_COLOR[s.type]?.badge}`}>
                          {s.type}
                        </span>
                        {s.vlanId && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--purple,#a855f7)]/15 text-[var(--purple,#a855f7)] border border-[var(--purple,#a855f7)]/30">
                            VLAN {s.vlanId} ({s.vlanMode || "Access"})
                          </span>
                        )}
                        {s.sriovEnabled && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--ok)]/15 text-[var(--ok)] border border-[var(--ok)]/30">
                            SR-IOV
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-sub)] mt-0.5">{s.notes || "Virtual Switch Instance"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSwitch(s)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-dim)] text-xs font-semibold text-[var(--text)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors"
                    >
                      Inspect & Configure
                    </button>
                    <button
                      onClick={() => handleRename(s.id, s.name)}
                      className="p-1.5 text-[var(--text-sub)] hover:text-[var(--amber)] rounded-lg hover:bg-[var(--bg-surface)]"
                      title="Rename Switch"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="p-1.5 text-[var(--text-sub)] hover:text-[var(--crit)] rounded-lg hover:bg-[var(--bg-surface)]"
                      title="Delete Switch"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Topology Flow Graph */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center font-mono text-xs">
                  
                  {/* Left Column: Physical Adapter / Host Binding */}
                  <div className="p-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-dim)] space-y-2 relative">
                    <div className="eyebrow text-[var(--text-sub)] flex items-center justify-between">
                      <span>Physical Network Interface</span>
                      <Radio size={12} className="text-[var(--ok)] animate-pulse" />
                    </div>
                    <div className="font-bold text-[var(--text)] truncate">
                      {s.type === "External" ? (s.adapter || "Physical Ethernet Adapter") : s.type === "Internal" ? "Host Management OS Interface" : "Isolated Internal Bridge (No Host NIC)"}
                    </div>
                    <div className="text-[10px] text-[var(--text-sub)]">
                      Teaming: {s.teamingMode || "Single Adapter"}
                    </div>
                  </div>

                  {/* Middle Column: Virtual Switch Engine with Arrow lines */}
                  <div className="p-4 bg-[var(--amber-low)]/20 rounded-2xl border border-[var(--amber)]/40 text-center space-y-2 relative">
                    <div className="eyebrow text-[var(--amber)]">Virtual Switch Core</div>
                    <div className="font-bold text-[var(--text)] text-sm">{s.name}</div>
                    
                    {/* Live Throughput Metrics */}
                    <div className="flex items-center justify-center gap-4 text-[10px] text-[var(--text-sub)] pt-1">
                      <span className="flex items-center gap-1 text-[var(--ok)] font-bold">
                        <ArrowDown size={12} /> {s.trafficStats?.rxMbps || 0} Mbps
                      </span>
                      <span className="flex items-center gap-1 text-[var(--cyan,#06b6d4)] font-bold">
                        <ArrowUp size={12} /> {s.trafficStats?.txMbps || 0} Mbps
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Attached Virtual Machines */}
                  <div className="p-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-dim)] space-y-2">
                    <div className="eyebrow text-[var(--text-sub)] flex items-center justify-between">
                      <span>Connected VMs ({s.vms.length})</span>
                      <Server size={12} className="text-[var(--amber)]" />
                    </div>

                    {s.vms.length === 0 ? (
                      <div className="text-[11px] text-[var(--text-sub)] italic">No VMs bound to this switch</div>
                    ) : (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {s.vms.map(vmName => {
                          const vmObj = connectedVmObjects.find(v => v.name === vmName);
                          const isRunning = vmObj ? vmObj.status === "Running" : true;
                          return (
                            <div key={vmName} className="flex items-center justify-between p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-dim)] text-[11px]">
                              <span className="font-bold text-[var(--text)] truncate">{vmName}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${isRunning ? "bg-[var(--ok)]/20 text-[var(--ok)]" : "bg-[var(--text-sub)]/20 text-[var(--text-sub)]"}`}>
                                {vmObj ? vmObj.status : "Attached"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: CARDS GRID VIEW */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSwitches.map((s) => (
            <div key={s.id} className="nx-card p-5 border border-[var(--border-dim)] flex flex-col justify-between hover:border-[var(--amber)]/60 transition-all">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 onClick={() => setSelectedSwitch(s)} className="display text-base font-bold text-[var(--text)] hover:text-[var(--amber)] cursor-pointer">
                      {s.name}
                    </h3>
                    <div className="mono text-[11px] text-[var(--text-sub)] truncate mt-0.5">
                      {s.adapter || "Internal Virtual Adapter"}
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${TYPE_COLOR[s.type]?.badge}`}>
                    {s.type}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-sub)] italic mt-2 line-clamp-2">{s.notes || "Virtual network switch"}</p>

                {/* Features & Security Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                  {s.vlanId && (
                    <span className="px-2 py-0.5 rounded bg-[var(--purple,#a855f7)]/15 text-[var(--purple,#a855f7)] border border-[var(--purple,#a855f7)]/30">
                      VLAN {s.vlanId}
                    </span>
                  )}
                  {s.dhcpGuard && (
                    <span className="px-2 py-0.5 rounded bg-[var(--ok)]/15 text-[var(--ok)] border border-[var(--ok)]/30">
                      DHCP Guard
                    </span>
                  )}
                  {s.sriovEnabled && (
                    <span className="px-2 py-0.5 rounded bg-[var(--teal)]/15 text-[var(--teal)] border border-[var(--teal)]/30">
                      SR-IOV
                    </span>
                  )}
                </div>

                {/* Attached VMs list */}
                <div className="mt-4 pt-3 border-t border-[var(--border-dim)]">
                  <span className="eyebrow text-[var(--text-sub)] block mb-1.5">Attached Virtual Machines ({s.vms.length})</span>
                  {s.vms.length === 0 ? (
                    <span className="text-xs text-[var(--text-sub)] opacity-50">No VMs assigned</span>
                  ) : (
                    <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                      {s.vms.map(vmName => (
                        <span key={vmName} className="px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text)] border border-[var(--border-dim)]">
                          {vmName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--border-dim)] flex items-center justify-between">
                <button
                  onClick={() => setSelectedSwitch(s)}
                  className="text-xs text-[var(--amber)] font-bold hover:underline"
                >
                  Configure & Settings →
                </button>

                <div className="flex items-center gap-1">
                  <button onClick={() => handleRename(s.id, s.name)} className="p-1.5 text-[var(--text-sub)] hover:text-[var(--amber)]">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 text-[var(--text-sub)] hover:text-[var(--crit)]">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW MODE 3: TABLE VIEW */}
      {viewMode === "table" && (
        <div className="nx-card overflow-hidden border border-[var(--border-dim)] shadow-xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[var(--bg-card)] border-b border-[var(--border-dim)] text-[var(--text-sub)] eyebrow font-semibold">
              <tr>
                <th className="p-3">Switch Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Bound Physical Adapter</th>
                <th className="p-3">VLAN Mode</th>
                <th className="p-3">Bandwidth Limits</th>
                <th className="p-3">Attached VMs</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-mono divide-y border-[var(--border-dim)]">
              {filteredSwitches.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--bg-surface)]/60 transition-colors">
                  <td className="p-3 font-bold text-[var(--text)] hover:text-[var(--amber)] cursor-pointer" onClick={() => setSelectedSwitch(s)}>
                    {s.name}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${TYPE_COLOR[s.type]?.badge}`}>
                      {s.type}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--text-sub)]">{s.adapter || "None (Host-Only)"}</td>
                  <td className="p-3 text-[var(--purple,#a855f7)]">
                    {s.vlanId ? `VLAN ${s.vlanId} (${s.vlanMode || "Access"})` : "Untagged"}
                  </td>
                  <td className="p-3 text-[var(--teal)]">
                    {s.maxBandwidthMbps ? `Max ${s.maxBandwidthMbps} Mbps` : "Unlimited"}
                  </td>
                  <td className="p-3 text-[var(--text-sub)]">{s.vms.length} VMs</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedSwitch(s)} className="p-1 hover:text-[var(--amber)]" title="Inspect">
                        <Sliders size={14} />
                      </button>
                      <button onClick={() => handleRename(s.id, s.name)} className="p-1 hover:text-[var(--text)]" title="Rename">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(s.id, s.name)} className="p-1 hover:text-[var(--crit)]" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* INSPECTOR DRAWER */}
      {selectedSwitch && (
        <VSwitchInspectorDrawer
          server={server}
          switchObj={selectedSwitch}
          allVms={vms}
          onClose={() => setSelectedSwitch(null)}
          onRefresh={loadData}
        />
      )}

      {/* CREATE SWITCH WIZARD MODAL */}
      {isCreateOpen && (
        <CreateVSwitchModal
          server={server}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false);
            loadData();
          }}
        />
      )}
    </PageWrapper>
  );
}

// INSPECTOR DRAWER FOR DETAILED VIRTUAL SWITCH MANAGEMENT
function VSwitchInspectorDrawer({
  server,
  switchObj,
  allVms,
  onClose,
  onRefresh
}: {
  server: string;
  switchObj: VirtualSwitch;
  allVms: HyperVVM[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "vlan_qos" | "security" | "powershell">("overview");

  // Config form state
  const [notes, setNotes] = useState(switchObj.notes || "");
  const [vlanId, setVlanId] = useState<number | "">(switchObj.vlanId ?? "");
  const [vlanMode, setVlanMode] = useState<"Untagged" | "Access" | "Trunk">(switchObj.vlanMode || "Access");
  const [minBandwidth, setMinBandwidth] = useState(switchObj.minBandwidthMbps || 0);
  const [maxBandwidth, setMaxBandwidth] = useState(switchObj.maxBandwidthMbps || 0);
  const [sriovEnabled, setSriovEnabled] = useState(switchObj.sriovEnabled ?? false);
  const [dhcpGuard, setDhcpGuard] = useState(switchObj.dhcpGuard ?? true);
  const [routerGuard, setRouterGuard] = useState(switchObj.routerGuard ?? true);
  const [macSpoofing, setMacSpoofing] = useState(switchObj.macSpoofing ?? false);
  const [allowManagementOS, setAllowManagementOS] = useState(switchObj.allowManagementOS ?? true);
  const [submitting, setSubmitting] = useState(false);

  // Attach VM dropdown
  const [selectedVmToAttach, setSelectedVmToAttach] = useState("");

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await updateVirtualSwitchClient(server, switchObj.id, {
        notes,
        vlanId: vlanId === "" ? undefined : Number(vlanId),
        vlanMode,
        minBandwidthMbps: Number(minBandwidth),
        maxBandwidthMbps: Number(maxBandwidth),
        sriovEnabled,
        dhcpGuard,
        routerGuard,
        macSpoofing,
        allowManagementOS
      });
      if (ok) {
        toast.success("Virtual switch settings updated successfully");
        onRefresh();
      } else {
        toast.error("Failed to update virtual switch settings");
      }
    } catch {
      toast.error("Error saving switch configuration");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachVm = async () => {
    if (!selectedVmToAttach) return;
    const ok = await attachVmToVirtualSwitchClient(server, switchObj.id, selectedVmToAttach);
    if (ok) {
      toast.success(`Attached ${selectedVmToAttach} to ${switchObj.name}`);
      setSelectedVmToAttach("");
      onRefresh();
    } else {
      toast.error("Failed to attach VM");
    }
  };

  const handleDetachVm = async (vmName: string) => {
    if (!confirm(`Detach VM "${vmName}" from switch "${switchObj.name}"?`)) return;
    const ok = await detachVmFromVirtualSwitchClient(server, switchObj.id, vmName);
    if (ok) {
      toast.success(`Detached ${vmName}`);
      onRefresh();
    } else {
      toast.error("Failed to detach VM");
    }
  };

  const unattachedVms = allVms.filter(v => !switchObj.vms.includes(v.name));

  // Generated PowerShell command
  const psCommand = useMemo(() => {
    let cmd = `# Hyper-V PowerShell configuration script for ${switchObj.name}\n`;
    cmd += `Set-VMSwitch -Name "${switchObj.name}" -Notes "${notes}" -AllowManagementOS $${allowManagementOS}\n`;
    if (vlanId) {
      cmd += `Set-VMNetworkAdapterVlan -VMSwitchName "${switchObj.name}" -Access -VlanId ${vlanId}\n`;
    }
    if (maxBandwidth > 0) {
      cmd += `Set-VMSwitch -Name "${switchObj.name}" -DefaultQueueBandwidthPercentage ${Math.min(100, Math.floor((minBandwidth / (maxBandwidth || 10000)) * 100))}\n`;
    }
    return cmd;
  }, [switchObj.name, notes, allowManagementOS, vlanId, minBandwidth, maxBandwidth]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border-l border-[var(--border-c)] w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--amber-low)] text-[var(--amber)]">
              <Network size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text)]">{switchObj.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${TYPE_COLOR[switchObj.type]?.badge}`}>
                  {switchObj.type}
                </span>
              </div>
              <p className="text-xs text-[var(--text-sub)] font-mono mt-0.5">{switchObj.adapter || "Host Internal Switch"}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-[var(--text-sub)] hover:text-[var(--text)] rounded-full hover:bg-[var(--bg-void)]">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-dim)] px-5 bg-[var(--bg-surface)]/50 text-xs font-semibold gap-6">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${activeTab === "overview" ? "border-[var(--amber)] text-[var(--amber)] font-bold" : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"}`}
          >
            <Activity size={14} /> Overview & VMs
          </button>

          <button 
            onClick={() => setActiveTab("vlan_qos")}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${activeTab === "vlan_qos" ? "border-[var(--amber)] text-[var(--amber)] font-bold" : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"}`}
          >
            <Sliders size={14} /> VLAN & QoS
          </button>

          <button 
            onClick={() => setActiveTab("security")}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${activeTab === "security" ? "border-[var(--amber)] text-[var(--amber)] font-bold" : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"}`}
          >
            <ShieldCheck size={14} /> Security & Guard
          </button>

          <button 
            onClick={() => setActiveTab("powershell")}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${activeTab === "powershell" ? "border-[var(--amber)] text-[var(--amber)] font-bold" : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"}`}
          >
            <Terminal size={14} /> PowerShell
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: OVERVIEW & VM ATTACHMENT */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Traffic Stats Gauge */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-dim)] space-y-1">
                  <span className="eyebrow text-[var(--text-sub)]">Inbound Traffic (Rx)</span>
                  <div className="text-xl font-bold text-[var(--ok)] font-mono">{switchObj.trafficStats?.rxMbps || 0} Mbps</div>
                  <div className="text-[10px] text-[var(--text-sub)]">{switchObj.trafficStats?.packetsPerSec || 0} packets/sec</div>
                </div>

                <div className="p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-dim)] space-y-1">
                  <span className="eyebrow text-[var(--text-sub)]">Outbound Traffic (Tx)</span>
                  <div className="text-xl font-bold text-[var(--cyan,#06b6d4)] font-mono">{switchObj.trafficStats?.txMbps || 0} Mbps</div>
                  <div className="text-[10px] text-[var(--text-sub)]">0 dropped packets</div>
                </div>
              </div>

              {/* Connected VMs Management */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="eyebrow text-[var(--text-sub)]">Attached Virtual Machines ({switchObj.vms.length})</h4>
                </div>

                {/* Attach VM Form */}
                <div className="flex items-center gap-2 p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-dim)]">
                  <select
                    value={selectedVmToAttach}
                    onChange={(e) => setSelectedVmToAttach(e.target.value)}
                    className="flex-1 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
                  >
                    <option value="">-- Select VM to connect --</option>
                    {unattachedVms.map(v => (
                      <option key={v.id} value={v.name}>{v.name} ({v.os})</option>
                    ))}
                  </select>

                  <button
                    onClick={handleAttachVm}
                    disabled={!selectedVmToAttach}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[var(--amber)] text-black font-bold rounded-lg text-xs hover:bg-[var(--amber-hover)] disabled:opacity-50"
                  >
                    <Link2 size={13} /> Attach
                  </button>
                </div>

                {/* VM List */}
                <div className="space-y-2">
                  {switchObj.vms.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--text-sub)] border border-dashed border-[var(--border-dim)] rounded-xl">
                      No virtual machines bound to this virtual switch.
                    </div>
                  ) : (
                    switchObj.vms.map(vmName => {
                      const vmObj = allVms.find(v => v.name === vmName);
                      return (
                        <div key={vmName} className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-dim)] flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <Server size={14} className="text-[var(--amber)]" />
                            <span className="font-bold text-[var(--text)]">{vmName}</span>
                            {vmObj && (
                              <span className="text-[10px] text-[var(--text-sub)]">({vmObj.ipAddress || "Dynamic IP"})</span>
                            )}
                          </div>

                          <button
                            onClick={() => handleDetachVm(vmName)}
                            className="flex items-center gap-1 text-[11px] text-[var(--crit)] hover:underline"
                          >
                            <Unlink size={12} /> Detach
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Switch Notes / Location</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl p-3 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                  placeholder="e.g. DMZ Isolated VLAN Switch..."
                />
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={submitting}
                className="w-full py-2.5 bg-[var(--amber)] text-black font-bold rounded-xl text-xs hover:bg-[var(--amber-hover)] disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Overview Settings"}
              </button>
            </div>
          )}

          {/* TAB 2: VLAN & QOS BANDWIDTH */}
          {activeTab === "vlan_qos" && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="p-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-dim)] space-y-4">
                <h4 className="eyebrow text-[var(--amber)] flex items-center gap-1.5">
                  <Sliders size={14} /> VLAN Tagging Configuration
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">VLAN Mode</label>
                    <select
                      value={vlanMode}
                      onChange={(e) => setVlanMode(e.target.value as any)}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)]"
                    >
                      <option value="Untagged">Untagged (Native Default)</option>
                      <option value="Access">Access Mode (Single VLAN ID)</option>
                      <option value="Trunk">Trunk Mode (Multi-VLAN Pass-through)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">VLAN Identifier</label>
                    <input
                      type="number"
                      min={1}
                      max={4094}
                      value={vlanId}
                      onChange={(e) => setVlanId(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 10"
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* QoS Bandwidth Limits */}
              <div className="p-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-dim)] space-y-4">
                <h4 className="eyebrow text-[var(--teal)] flex items-center gap-1.5">
                  <Zap size={14} /> Quality of Service (QoS) Bandwidth Control
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Minimum Bandwidth (Mbps)</label>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={minBandwidth}
                      onChange={(e) => setMinBandwidth(Number(e.target.value))}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Maximum Bandwidth Limit (Mbps)</label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={maxBandwidth}
                      onChange={(e) => setMaxBandwidth(Number(e.target.value))}
                      placeholder="0 = Unlimited"
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="sriov"
                    checked={sriovEnabled}
                    onChange={(e) => setSriovEnabled(e.target.checked)}
                    className="rounded border-[var(--border-dim)] text-[var(--amber)] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="sriov" className="text-xs text-[var(--text)] font-semibold cursor-pointer">
                    Enable SR-IOV (Single-Root I/O Virtualization hardware acceleration)
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[var(--amber)] text-black font-bold rounded-xl text-xs hover:bg-[var(--amber-hover)] disabled:opacity-50"
              >
                {submitting ? "Updating..." : "Apply VLAN & QoS Policy"}
              </button>
            </form>
          )}

          {/* TAB 3: SECURITY & GUARD */}
          {activeTab === "security" && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-dim)] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[var(--text)]">DHCP Guard</div>
                    <div className="text-[11px] text-[var(--text-sub)]">Blocks unauthorized rogue DHCP server messages from attached VMs</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={dhcpGuard}
                    onChange={(e) => setDhcpGuard(e.target.checked)}
                    className="rounded border-[var(--border-dim)] text-[var(--amber)] focus:ring-0 cursor-pointer w-4 h-4"
                  />
                </div>

                <div className="p-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-dim)] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[var(--text)]">Router Guard</div>
                    <div className="text-[11px] text-[var(--text-sub)]">Prevents VMs from sending ICMPv6 router advertisements</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={routerGuard}
                    onChange={(e) => setRouterGuard(e.target.checked)}
                    className="rounded border-[var(--border-dim)] text-[var(--amber)] focus:ring-0 cursor-pointer w-4 h-4"
                  />
                </div>

                <div className="p-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-dim)] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[var(--text)]">MAC Address Spoofing</div>
                    <div className="text-[11px] text-[var(--text-sub)]">Allows VMs to change source MAC addresses (Required for Network Load Balancing)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={macSpoofing}
                    onChange={(e) => setMacSpoofing(e.target.checked)}
                    className="rounded border-[var(--border-dim)] text-[var(--amber)] focus:ring-0 cursor-pointer w-4 h-4"
                  />
                </div>

                <div className="p-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-dim)] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[var(--text)]">Allow Host Management OS NIC</div>
                    <div className="text-[11px] text-[var(--text-sub)] font-mono">Binds management virtual adapter to host server OS</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowManagementOS}
                    onChange={(e) => setAllowManagementOS(e.target.checked)}
                    className="rounded border-[var(--border-dim)] text-[var(--amber)] focus:ring-0 cursor-pointer w-4 h-4"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[var(--amber)] text-black font-bold rounded-xl text-xs hover:bg-[var(--amber-hover)] disabled:opacity-50"
              >
                {submitting ? "Updating..." : "Save Security Guard Settings"}
              </button>
            </form>
          )}

          {/* TAB 4: POWERSHELL COMMAND GENERATOR */}
          {activeTab === "powershell" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[var(--text-sub)]">Generated PowerShell Commands:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(psCommand);
                    toast.success("PowerShell code copied to clipboard!");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[var(--amber)] text-black font-bold rounded-lg text-xs hover:bg-[var(--amber-hover)]"
                >
                  <Copy size={13} /> Copy Script
                </button>
              </div>

              <pre className="p-4 bg-black text-amber-400 font-mono text-xs rounded-2xl border border-[var(--border-dim)] overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {psCommand}
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// CREATE VIRTUAL SWITCH WIZARD MODAL
function CreateVSwitchModal({ server, onClose, onCreated }: { server: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"External" | "Internal" | "Private">("External");
  const [adapterName, setAdapterName] = useState("Intel(R) Ethernet Connection i219-LM (10GbE)");
  const [teamingMode, setTeamingMode] = useState<"None" | "SwitchEmbeddedTeaming" | "LACP">("None");
  const [vlanId, setVlanId] = useState<number | "">("");
  const [sriovEnabled, setSriovEnabled] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await createVirtualSwitchClient(server, { 
        name: name.trim(), 
        type, 
        adapterName: type === "External" ? adapterName : undefined,
        notes: notes.trim(),
        vlanId: vlanId === "" ? undefined : Number(vlanId),
        sriovEnabled,
        teamingMode
      });
      if (ok) {
        toast.success(`Virtual switch "${name}" created successfully`);
        onCreated();
      } else {
        toast.error("Failed to create Virtual Switch");
      }
    } catch {
      toast.error("Virtual Switch creation error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--amber-low)] text-[var(--amber)]">
              <Network size={18} />
            </div>
            <h3 className="text-base font-bold text-[var(--text)]">Create Hyper-V Virtual Switch</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Switch Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. vSwitch-Production-DMZ"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Connection Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            >
              <option value="External">External — Binds to physical NIC for external network access</option>
              <option value="Internal">Internal — Communication between host server and VMs only</option>
              <option value="Private">Private — Isolated VM-to-VM communication only (No host NIC)</option>
            </select>
          </div>

          {type === "External" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Physical Network Adapter</label>
                <select
                  value={adapterName}
                  onChange={(e) => setAdapterName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                >
                  <option value="Intel(R) Ethernet Connection i219-LM (10GbE)">Intel(R) Ethernet Connection i219-LM (10GbE)</option>
                  <option value="Mellanox ConnectX-5 Dual-Port 25GbE Adapter">Mellanox ConnectX-5 Dual-Port 25GbE Adapter</option>
                  <option value="Broadcom NetXtreme Gigabit Ethernet">Broadcom NetXtreme Gigabit Ethernet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">NIC Teaming Mode</label>
                <select
                  value={teamingMode}
                  onChange={(e) => setTeamingMode(e.target.value as any)}
                  className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                >
                  <option value="None">None (Single Physical Adapter)</option>
                  <option value="SwitchEmbeddedTeaming">Switch Embedded Teaming (SET)</option>
                  <option value="LACP">LACP (Link Aggregation Control Protocol)</option>
                </select>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">VLAN ID (Optional)</label>
              <input
                type="number"
                min={1}
                max={4094}
                value={vlanId}
                onChange={(e) => setVlanId(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 10"
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] font-mono"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={sriovEnabled}
                  onChange={(e) => setSriovEnabled(e.target.checked)}
                  className="rounded border-[var(--border-c)] text-[var(--amber)] focus:ring-0"
                />
                <span>Enable SR-IOV</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Notes / Purpose</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Management LAN virtual switch..."
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Provisioning..." : "Create Virtual Switch"}
          </button>
        </div>
      </form>
    </div>
  );
}
