import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { 
  Play, Square, Pause, Camera, Monitor, Plus, X, Server, RefreshCw, Loader2, 
  Search, Sliders, Trash2, Cpu, HardDrive, Network, RotateCw, Bookmark, ShieldCheck, 
  Terminal, Check, ChevronRight, Layers, LayoutGrid, List, Activity, Settings2,
  Tv, Power, AlertCircle, FileCode, CheckCircle2, ArrowRight
} from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useNavigate } from "@tanstack/react-router";
import { 
  getVMsClient as getVMs, 
  controlVMClient as controlVM, 
  createVMClient, 
  updateVMSettingsClient,
  deleteVMClient,
  checkpointVMClient, 
  getVirtualSwitchesClient,
  createVirtualSwitchClient,
  deleteVirtualSwitchClient,
  type HyperVVM,
  type VirtualSwitch,
  type VMCheckpoint
} from "@/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/vms")({
  head: () => ({ 
    meta: [
      { title: "Hyper-V Virtual Machines — NEXUS" }, 
      { name: "description", content: "Hyper-V Virtual Machine management, checkpoints, hardware settings, and virtual switches." }
    ] 
  }),
  component: VMsPage,
});

function VMsPage() {
  const navigate = useNavigate();
  const [server, setServer] = useState("nexus01");
  const [activeTab, setActiveTab] = useState<"vms" | "switches">("vms");
  const [vms, setVms] = useState<HyperVVM[]>([]);
  const [switches, setSwitches] = useState<VirtualSwitch[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters & Layout
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [switchFilter, setSwitchFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedVmIds, setSelectedVmIds] = useState<string[]>([]);

  // Modals & Drawers
  const [isCreateVmOpen, setIsCreateVmOpen] = useState(false);
  const [isCreateSwitchOpen, setIsCreateSwitchOpen] = useState(false);
  const [selectedVm, setSelectedVm] = useState<HyperVVM | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vmList, switchList] = await Promise.all([
        getVMs(server),
        getVirtualSwitchesClient(server)
      ]);
      setVms(vmList);
      setSwitches(switchList);
      // Keep selectedVm updated if drawer is open
      if (selectedVm) {
        const updated = vmList.find(v => v.id === selectedVm.id);
        if (updated) setSelectedVm(updated);
      }
    } catch {
      toast.error("Failed to load Hyper-V state");
    } finally {
      setLoading(false);
    }
  }, [server, selectedVm]);

  useEffect(() => {
    loadData();
  }, [loadData, server]);

  const act = async (id: string, a: "start" | "stop" | "pause" | "restart" | "save" | "checkpoint" | "turnoff") => {
    toast.info(`Sending ${a.toUpperCase()} command...`);
    const ok = await controlVM(server, id, a);
    if (ok) {
      toast.success(`VM ${a} completed`);
      loadData();
    } else {
      toast.error(`Failed to ${a} VM`);
    }
  };

  const handleBulkAction = async (action: "start" | "stop" | "pause" | "checkpoint") => {
    if (selectedVmIds.length === 0) return;
    toast.info(`Executing ${action.toUpperCase()} on ${selectedVmIds.length} VMs...`);
    for (const id of selectedVmIds) {
      await controlVM(server, id, action);
    }
    toast.success(`Bulk ${action} finished`);
    setSelectedVmIds([]);
    loadData();
  };

  const toggleSelectVm = (id: string) => {
    setSelectedVmIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedVmIds.length === filteredVms.length) {
      setSelectedVmIds([]);
    } else {
      setSelectedVmIds(filteredVms.map(v => v.id));
    }
  };

  // Filtered VMs
  const filteredVms = useMemo(() => {
    return vms.filter(v => {
      const matchesSearch = search === "" || 
        v.name.toLowerCase().includes(search.toLowerCase()) || 
        v.os.toLowerCase().includes(search.toLowerCase()) ||
        (v.ipAddress && v.ipAddress.includes(search));
      
      const matchesStatus = statusFilter === "ALL" || v.status.toUpperCase() === statusFilter;
      const matchesSwitch = switchFilter === "ALL" || v.vswitch === switchFilter;

      return matchesSearch && matchesStatus && matchesSwitch;
    });
  }, [vms, search, statusFilter, switchFilter]);

  // Host Summary Metrics
  const stats = useMemo(() => {
    const total = vms.length;
    const running = vms.filter(v => v.status === "Running").length;
    const stopped = vms.filter(v => v.status === "Stopped").length;
    const paused = vms.filter(v => v.status === "Paused" || v.status === "Saved").length;
    const totalCpuCores = vms.reduce((acc, v) => acc + (v.vCPUs || 2), 0);
    const totalRamGB = (vms.reduce((acc, v) => acc + v.memMB, 0) / 1024).toFixed(0);
    return { total, running, stopped, paused, totalCpuCores, totalRamGB };
  }, [vms]);

  return (
    <PageWrapper>
      <PageHeader 
        eyebrow="Infrastructure & Virtualization" 
        title="Hyper-V Virtual Machines" 
        subtitle={`Managing Hyper-V virtualization host: ${server.toUpperCase()}`}
      />

      {/* Top Controls & Metrics Bar */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ServerSelector value={server} onChange={setServer} />
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-xl text-[var(--text-sub)] hover:text-[var(--text)] hover:border-[var(--amber)] transition-colors"
              title="Refresh Hyper-V status"
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-[var(--amber)]" : ""} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "vms" ? (
              <button
                onClick={() => setIsCreateVmOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-[var(--amber)] text-black px-4 py-2 text-xs font-bold hover:bg-[var(--amber-hover)] transition-all shadow-md"
              >
                <Plus size={16} /> Create Virtual Machine
              </button>
            ) : (
              <button
                onClick={() => setIsCreateSwitchOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-[var(--amber)] text-black px-4 py-2 text-xs font-bold hover:bg-[var(--amber-hover)] transition-all shadow-md"
              >
                <Plus size={16} /> Create Virtual Switch
              </button>
            )}
          </div>
        </div>

        {/* Host Resource Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="nx-card p-3 flex flex-col justify-between border-l-4 border-l-[var(--amber)]">
            <span className="eyebrow text-[var(--text-sub)]">Total VMs</span>
            <span className="display text-xl font-bold text-[var(--text)] mt-1">{stats.total}</span>
          </div>
          <div className="nx-card p-3 flex flex-col justify-between border-l-4 border-l-[var(--ok)]">
            <span className="eyebrow text-[var(--text-sub)]">Running</span>
            <span className="display text-xl font-bold text-[var(--ok)] mt-1">{stats.running}</span>
          </div>
          <div className="nx-card p-3 flex flex-col justify-between border-l-4 border-l-[var(--crit)]">
            <span className="eyebrow text-[var(--text-sub)]">Stopped</span>
            <span className="display text-xl font-bold text-[var(--text-sub)] mt-1">{stats.stopped}</span>
          </div>
          <div className="nx-card p-3 flex flex-col justify-between border-l-4 border-l-[var(--warn)]">
            <span className="eyebrow text-[var(--text-sub)]">Paused / Saved</span>
            <span className="display text-xl font-bold text-[var(--warn)] mt-1">{stats.paused}</span>
          </div>
          <div className="nx-card p-3 flex flex-col justify-between border-l-4 border-l-[var(--teal)]">
            <span className="eyebrow text-[var(--text-sub)]">vCPUs Allocated</span>
            <span className="display text-xl font-bold text-[var(--teal)] mt-1">{stats.totalCpuCores} cores</span>
          </div>
          <div className="nx-card p-3 flex flex-col justify-between border-l-4 border-l-[var(--purple,#a855f7)]">
            <span className="eyebrow text-[var(--text-sub)]">RAM Provisioned</span>
            <span className="display text-xl font-bold text-[var(--text)] mt-1">{stats.totalRamGB} GB</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--border-dim)] gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("vms")}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "vms"
                ? "border-[var(--amber)] text-[var(--amber)] font-bold"
                : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"
            }`}
          >
            <Server size={16} /> Virtual Machines ({vms.length})
          </button>
          <button
            onClick={() => setActiveTab("switches")}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "switches"
                ? "border-[var(--amber)] text-[var(--amber)] font-bold"
                : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"
            }`}
          >
            <Network size={16} /> Virtual Switches ({switches.length})
          </button>
        </div>
      </div>

      {/* TAB 1: VIRTUAL MACHINES */}
      {activeTab === "vms" && (
        <div>
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-dim)] shadow-sm">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-sub)]" />
                <input
                  type="text"
                  placeholder="Search VM name, OS, IP..."
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

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
              >
                <option value="ALL">All Statuses</option>
                <option value="RUNNING">Running</option>
                <option value="STOPPED">Stopped</option>
                <option value="PAUSED">Paused</option>
                <option value="SAVED">Saved</option>
              </select>

              {/* Switch Filter */}
              <select
                value={switchFilter}
                onChange={(e) => setSwitchFilter(e.target.value)}
                className="bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
              >
                <option value="ALL">All Switches</option>
                {switches.map(sw => (
                  <option key={sw.id} value={sw.name}>{sw.name}</option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle & Bulk Actions */}
            <div className="flex items-center gap-2">
              {selectedVmIds.length > 0 && (
                <div className="flex items-center gap-1.5 bg-[var(--amber-low)] border border-[var(--amber)]/40 px-2.5 py-1 rounded-xl text-xs font-bold text-[var(--amber)] animate-in fade-in">
                  <span>{selectedVmIds.length} selected</span>
                  <button onClick={() => handleBulkAction("start")} title="Mass Start" className="p-1 hover:bg-[var(--amber)]/20 rounded">
                    <Play size={13} />
                  </button>
                  <button onClick={() => handleBulkAction("stop")} title="Mass Stop" className="p-1 hover:bg-[var(--amber)]/20 rounded">
                    <Square size={13} />
                  </button>
                  <button onClick={() => handleBulkAction("checkpoint")} title="Mass Checkpoint" className="p-1 hover:bg-[var(--amber)]/20 rounded">
                    <Camera size={13} />
                  </button>
                </div>
              )}

              <div className="flex border border-[var(--border-dim)] rounded-xl p-0.5 bg-[var(--bg-surface)]">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-[var(--bg-card)] text-[var(--amber)] shadow-sm" : "text-[var(--text-sub)] hover:text-[var(--text)]"}`}
                  title="Grid View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === "table" ? "bg-[var(--bg-card)] text-[var(--amber)] shadow-sm" : "text-[var(--text-sub)] hover:text-[var(--text)]"}`}
                  title="Table View"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* GRID VIEW */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVms.map((v) => {
                const isSelected = selectedVmIds.includes(v.id);
                return (
                  <div 
                    key={v.id} 
                    className={`nx-card p-5 relative transition-all duration-200 border hover:border-[var(--amber)]/60 ${
                      isSelected ? "border-[var(--amber)] bg-[var(--amber-low)]/10" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectVm(v.id)}
                          className="rounded border-[var(--border-dim)] text-[var(--amber)] focus:ring-0 cursor-pointer"
                        />
                        <div className="overflow-hidden">
                          <h3 
                            onClick={() => setSelectedVm(v)} 
                            className="display text-[15px] font-bold text-[var(--text)] hover:text-[var(--amber)] cursor-pointer truncate"
                          >
                            {v.name}
                          </h3>
                          <div className="mono text-[10px] text-[var(--text-sub)] truncate">{v.os} • Gen {v.generation || 2}</div>
                        </div>
                      </div>

                      <StatusBadge status={v.status === "Running" ? "online" : v.status === "Paused" ? "warning" : "offline"}>
                        {v.status}
                      </StatusBadge>
                    </div>

                    {/* Resources Grid */}
                    <div className="mono mt-4 grid grid-cols-3 gap-2 p-3 bg-[var(--bg-surface)]/60 rounded-xl border border-[var(--border-dim)] text-[10px]">
                      <div>
                        <div className="eyebrow pb-0.5 text-[var(--text-sub)]">CPU Load</div>
                        <span className="font-bold text-[var(--amber)]">{v.status === "Running" ? `${v.cpu}%` : "0%"}</span>
                        <div className="text-[9px] opacity-60">{v.vCPUs || 2} vCPUs</div>
                      </div>

                      <div>
                        <div className="eyebrow pb-0.5 text-[var(--text-sub)]">RAM Alloc</div>
                        <span className="font-bold text-[var(--teal)]">{(v.memMB/1024).toFixed(1)} GB</span>
                        <div className="text-[9px] opacity-60">{v.dynamicMemory ? "Dynamic" : "Static"}</div>
                      </div>

                      <div>
                        <div className="eyebrow pb-0.5 text-[var(--text-sub)]">Uptime</div>
                        <span className="font-bold text-[var(--text)]">{v.uptime}</span>
                        <div className="text-[9px] opacity-60">{v.vswitch || "Default Switch"}</div>
                      </div>
                    </div>

                    {/* IP & Checkpoints Badge */}
                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[var(--text-sub)]">
                      <span className="truncate">{v.ipAddress || "192.168.1.X"}</span>
                      {v.checkpoints && v.checkpoints.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] bg-[var(--bg-surface)] px-2 py-0.5 rounded-md border border-[var(--border-dim)]">
                          <Camera size={11} className="text-[var(--amber)]" />
                          {v.checkpoints.length} Snapshots
                        </span>
                      )}
                    </div>

                    {/* Quick Action Controls */}
                    <div className="mt-4 pt-3 border-t border-[var(--border-dim)] flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-1">
                        {v.status !== "Running" ? (
                          <Btn onClick={() => act(v.id, "start")} icon={Play} label="Start" />
                        ) : (
                          <>
                            <Btn onClick={() => act(v.id, "stop")} icon={Square} label="Stop" />
                            <Btn onClick={() => act(v.id, "pause")} icon={Pause} label="Pause" />
                          </>
                        )}
                        <Btn onClick={() => act(v.id, "checkpoint")} icon={Camera} label="Snap" />
                        <Btn onClick={() => navigate({ to: "/remote-desktop" })} icon={Monitor} label="Connect" />
                      </div>

                      <button
                        onClick={() => setSelectedVm(v)}
                        className="p-1.5 text-[var(--text-sub)] hover:text-[var(--amber)] hover:bg-[var(--bg-surface)] rounded-lg transition-colors"
                        title="VM Details & Settings"
                      >
                        <Settings2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="nx-card overflow-hidden backdrop-blur-xl border border-[var(--border-dim)] shadow-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[var(--bg-card)] border-b border-[var(--border-dim)] text-[var(--text-sub)] eyebrow font-semibold">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedVmIds.length > 0 && selectedVmIds.length === filteredVms.length} 
                        onChange={toggleSelectAll} 
                        className="rounded border-[var(--border-dim)] text-[var(--amber)]"
                      />
                    </th>
                    <th className="p-3">VM Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Operating System</th>
                    <th className="p-3">CPU / vCPU</th>
                    <th className="p-3">Memory</th>
                    <th className="p-3">Virtual Switch</th>
                    <th className="p-3">Uptime</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-mono divider-y border-[var(--border-dim)]">
                  {filteredVms.map((v) => (
                    <tr key={v.id} className="hover:bg-[var(--bg-surface)]/60 transition-colors">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedVmIds.includes(v.id)}
                          onChange={() => toggleSelectVm(v.id)}
                          className="rounded border-[var(--border-dim)] text-[var(--amber)]"
                        />
                      </td>
                      <td className="p-3 font-bold text-[var(--text)] hover:text-[var(--amber)] cursor-pointer" onClick={() => setSelectedVm(v)}>
                        {v.name}
                        {v.checkpoints && v.checkpoints.length > 0 && (
                          <span className="ml-2 text-[10px] text-[var(--amber)] bg-[var(--amber-low)] px-1.5 py-0.2 rounded font-sans">
                            {v.checkpoints.length} Snap
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={v.status === "Running" ? "online" : v.status === "Paused" ? "warning" : "offline"}>
                          {v.status}
                        </StatusBadge>
                      </td>
                      <td className="p-3 text-[var(--text-sub)]">{v.os} (Gen {v.generation || 2})</td>
                      <td className="p-3 text-[var(--amber)]">{v.status === "Running" ? `${v.cpu}%` : "0%"} ({v.vCPUs || 2} vCPU)</td>
                      <td className="p-3 text-[var(--teal)]">{(v.memMB/1024).toFixed(1)} GB</td>
                      <td className="p-3 text-[var(--text-sub)]">{v.vswitch || "Default Switch"}</td>
                      <td className="p-3 text-[var(--text-sub)]">{v.uptime}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {v.status !== "Running" ? (
                            <button onClick={() => act(v.id, "start")} className="p-1 hover:text-[var(--ok)]" title="Start">
                              <Play size={14} />
                            </button>
                          ) : (
                            <button onClick={() => act(v.id, "stop")} className="p-1 hover:text-[var(--crit)]" title="Stop">
                              <Square size={14} />
                            </button>
                          )}
                          <button onClick={() => act(v.id, "checkpoint")} className="p-1 hover:text-[var(--amber)]" title="Checkpoint">
                            <Camera size={14} />
                          </button>
                          <button onClick={() => setSelectedVm(v)} className="p-1 hover:text-[var(--text)]" title="Settings">
                            <Settings2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VIRTUAL SWITCHES */}
      {activeTab === "switches" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {switches.map((sw) => (
            <div key={sw.id} className="nx-card p-5 border border-[var(--border-dim)] flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="display text-base font-bold text-[var(--text)]">{sw.name}</h3>
                    <span className="mono text-[11px] text-[var(--text-sub)]">{sw.adapter || "Virtual Host Adapter"}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                    sw.type === "External" 
                      ? "bg-[var(--teal-low)] text-[var(--teal)] border-[var(--teal)]/30" 
                      : sw.type === "Internal" 
                      ? "bg-[var(--amber-low)] text-[var(--amber)] border-[var(--amber)]/30" 
                      : "bg-[var(--bg-surface)] text-[var(--text-sub)] border-[var(--border-dim)]"
                  }`}>
                    {sw.type}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-sub)] mt-2 italic">{sw.notes || "Virtual network switch"}</p>

                {/* Attached VMs */}
                <div className="mt-4 pt-3 border-t border-[var(--border-dim)]">
                  <span className="eyebrow text-[var(--text-sub)] block mb-1.5">Attached Virtual Machines ({sw.vms.length})</span>
                  {sw.vms.length === 0 ? (
                    <span className="text-xs text-[var(--text-sub)] opacity-50">No VMs assigned</span>
                  ) : (
                    <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                      {sw.vms.map(vmName => (
                        <span key={vmName} className="px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text)] border border-[var(--border-dim)]">
                          {vmName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--border-dim)] flex items-center justify-end">
                <button
                  onClick={async () => {
                    if (confirm(`Delete Virtual Switch "${sw.name}"?`)) {
                      await deleteVirtualSwitchClient(server, sw.id);
                      toast.success(`Deleted switch ${sw.name}`);
                      loadData();
                    }
                  }}
                  className="text-xs text-[var(--crit)] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Trash2 size={13} /> Remove Switch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VM DETAILED INSPECTOR DRAWER */}
      {selectedVm && (
        <VMInspectorDrawer
          server={server}
          vm={selectedVm}
          switches={switches}
          onClose={() => setSelectedVm(null)}
          onRefresh={loadData}
        />
      )}

      {/* CREATE VM WIZARD MODAL */}
      {isCreateVmOpen && (
        <CreateVMModal
          server={server}
          switches={switches}
          onClose={() => setIsCreateVmOpen(false)}
          onCreated={() => {
            setIsCreateVmOpen(false);
            loadData();
          }}
        />
      )}

      {/* CREATE SWITCH MODAL */}
      {isCreateSwitchOpen && (
        <CreateSwitchModal
          server={server}
          onClose={() => setIsCreateSwitchOpen(false)}
          onCreated={() => {
            setIsCreateSwitchOpen(false);
            loadData();
          }}
        />
      )}
    </PageWrapper>
  );
}

// Drawer Component for Inspecting & Managing VM
function VMInspectorDrawer({ server, vm, switches, onClose, onRefresh }: { server: string; vm: HyperVVM; switches: VirtualSwitch[]; onClose: () => void; onRefresh: () => void }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "console" | "checkpoints" | "hardware">("overview");
  
  // Hardware Settings State
  const [vCPUs, setVCPUs] = useState(vm.vCPUs || 2);
  const [ramMB, setRamMB] = useState(vm.memMB);
  const [dynamicRam, setDynamicRam] = useState(vm.dynamicMemory ?? true);
  const [vswitch, setVswitch] = useState(vm.vswitch || "NEXUS-External");
  const [isoPath, setIsoPath] = useState(vm.isoPath || "");
  const [notes, setNotes] = useState(vm.notes || "");
  const [savingSettings, setSavingSettings] = useState(false);

  // Checkpoint State
  const [newCheckpointName, setNewCheckpointName] = useState("");
  const [creatingCheckpoint, setCreatingCheckpoint] = useState(false);

  // Console Screen Simulation State
  const [screenConnected, setScreenConnected] = useState(true);

  const handleSaveHardware = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const ok = await updateVMSettingsClient(server, vm.id, {
        vCPUs,
        memMB: ramMB,
        dynamicMemory: dynamicRam,
        vswitch,
        isoPath,
        notes
      });
      if (ok) {
        toast.success("VM Hardware Settings updated");
        onRefresh();
      } else {
        toast.error("Failed to update settings");
      }
    } catch {
      toast.error("Update error");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCheckpoint(true);
    try {
      const ok = await checkpointVMClient(server, vm.id, "create", newCheckpointName.trim());
      if (ok) {
        toast.success("Checkpoint created");
        setNewCheckpointName("");
        onRefresh();
      } else {
        toast.error("Failed to create checkpoint");
      }
    } catch {
      toast.error("Checkpoint creation failed");
    } finally {
      setCreatingCheckpoint(false);
    }
  };

  const handleApplyCheckpoint = async (cpName: string) => {
    if (!confirm(`Apply snapshot "${cpName}"? VM will revert to this state.`)) return;
    const ok = await checkpointVMClient(server, vm.id, "apply", cpName);
    if (ok) {
      toast.success(`Applied snapshot "${cpName}"`);
      onRefresh();
    }
  };

  const handleDeleteCheckpoint = async (cpName: string) => {
    if (!confirm(`Delete snapshot "${cpName}"?`)) return;
    const ok = await checkpointVMClient(server, vm.id, "delete", cpName);
    if (ok) {
      toast.success(`Deleted snapshot "${cpName}"`);
      onRefresh();
    }
  };

  const handleDeleteVM = async () => {
    if (!confirm(`DANGER: Are you sure you want to permanently delete virtual machine "${vm.name}"?`)) return;
    const ok = await deleteVMClient(server, vm.id);
    if (ok) {
      toast.success(`Virtual machine "${vm.name}" deleted`);
      onClose();
      onRefresh();
    } else {
      toast.error("Failed to delete VM");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border-l border-[var(--border-c)] w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-hidden">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Server size={18} className="text-[var(--amber)]" />
              <h2 className="text-lg font-bold text-[var(--text)]">{vm.name}</h2>
              <StatusBadge status={vm.status === "Running" ? "online" : vm.status === "Paused" ? "warning" : "offline"}>
                {vm.status}
              </StatusBadge>
            </div>
            <p className="text-xs text-[var(--text-sub)] font-mono mt-0.5">{vm.os} • Gen {vm.generation || 2}</p>
          </div>

          <button onClick={onClose} className="p-1.5 text-[var(--text-sub)] hover:text-[var(--text)] rounded-full hover:bg-[var(--bg-void)] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Drawer Navigation Tabs */}
        <div className="flex border-b border-[var(--border-dim)] px-5 bg-[var(--bg-surface)]/50 text-xs font-semibold gap-6">
          <button 
            onClick={() => setTab("overview")}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${tab === "overview" ? "border-[var(--amber)] text-[var(--amber)] font-bold" : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"}`}
          >
            <Activity size={14} /> Overview
          </button>

          <button 
            onClick={() => setTab("console")}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${tab === "console" ? "border-[var(--amber)] text-[var(--amber)] font-bold" : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"}`}
          >
            <Tv size={14} /> Console
          </button>

          <button 
            onClick={() => setTab("checkpoints")}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${tab === "checkpoints" ? "border-[var(--amber)] text-[var(--amber)] font-bold" : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"}`}
          >
            <Camera size={14} /> Snapshots ({vm.checkpoints?.length || 0})
          </button>

          <button 
            onClick={() => setTab("hardware")}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${tab === "hardware" ? "border-[var(--amber)] text-[var(--amber)] font-bold" : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"}`}
          >
            <Settings2 size={14} /> Hardware
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {tab === "overview" && (
            <div className="space-y-6">
              {/* Quick Action Bar */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-dim)]">
                {vm.status !== "Running" ? (
                  <button onClick={() => controlVM(server, vm.id, "start").then(onRefresh)} className="flex items-center gap-1.5 bg-[var(--ok)] text-black font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-[var(--ok)]/90">
                    <Play size={14} /> Start VM
                  </button>
                ) : (
                  <>
                    <button onClick={() => controlVM(server, vm.id, "stop").then(onRefresh)} className="flex items-center gap-1.5 bg-[var(--crit)] text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-[var(--crit)]/90">
                      <Square size={14} /> Stop
                    </button>
                    <button onClick={() => controlVM(server, vm.id, "pause").then(onRefresh)} className="flex items-center gap-1.5 bg-[var(--warn)] text-black font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-[var(--warn)]/90">
                      <Pause size={14} /> Pause
                    </button>
                    <button onClick={() => controlVM(server, vm.id, "restart").then(onRefresh)} className="flex items-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border-dim)] text-[var(--text)] font-semibold px-3 py-1.5 rounded-lg text-xs hover:border-[var(--amber)]">
                      <RotateCw size={14} /> Restart
                    </button>
                  </>
                )}

                <button onClick={() => navigate({ to: "/remote-desktop" })} className="flex items-center gap-1.5 bg-[var(--amber)] text-black font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-[var(--amber-hover)] ml-auto">
                  <Monitor size={14} /> Remote Desktop
                </button>
              </div>

              {/* Hardware Summary Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--bg-surface)]/60 rounded-xl border border-[var(--border-dim)] space-y-2">
                  <span className="eyebrow text-[var(--text-sub)]">Processor & vCPU</span>
                  <div className="text-xl font-bold text-[var(--amber)] font-mono">{vm.vCPUs || 2} vCPU Cores</div>
                  <div className="text-xs text-[var(--text-sub)]">Current Usage: {vm.status === "Running" ? `${vm.cpu}%` : "0%"}</div>
                </div>

                <div className="p-4 bg-[var(--bg-surface)]/60 rounded-xl border border-[var(--border-dim)] space-y-2">
                  <span className="eyebrow text-[var(--text-sub)]">Memory & Allocation</span>
                  <div className="text-xl font-bold text-[var(--teal)] font-mono">{(vm.memMB/1024).toFixed(1)} GB</div>
                  <div className="text-xs text-[var(--text-sub)]">{vm.dynamicMemory ? "Dynamic RAM Enabled" : "Static Provisioning"}</div>
                </div>
              </div>

              {/* Integration Services Health */}
              <div className="space-y-3">
                <h4 className="eyebrow text-[var(--text-sub)] flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[var(--amber)]" /> Integration Services Status
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                  {Object.entries(vm.integrationServices || { heartbeat: true, kvp: true, shutdown: true, timeSync: true, vss: true }).map(([key, ok]) => (
                    <div key={key} className="p-2.5 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-surface)] flex items-center justify-between">
                      <span className="capitalize text-[var(--text)]">{key}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ok ? "bg-[var(--ok)]/20 text-[var(--ok)]" : "bg-[var(--crit)]/20 text-[var(--crit)]"}`}>
                        {ok ? "Active" : "Off"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Storage & VHDX Location */}
              <div className="p-4 bg-[var(--bg-surface)]/40 rounded-xl border border-[var(--border-dim)] space-y-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-[var(--text)] font-semibold">
                  <HardDrive size={15} className="text-[var(--amber)]" />
                  <span>VHDX Storage Disk</span>
                </div>
                <div className="text-[var(--text-sub)] break-all bg-[var(--bg-void)] p-2.5 rounded-lg border border-[var(--border-dim)]">
                  {vm.vhdxPath || `C:\\Hyper-V\\Virtual Hard Disks\\${vm.name}.vhdx`} ({vm.vhdxSizeGB || 120} GB)
                </div>
              </div>

              {/* Notes */}
              {vm.notes && (
                <div className="p-4 bg-[var(--bg-surface)]/40 rounded-xl border border-[var(--border-dim)] space-y-1">
                  <span className="eyebrow text-[var(--text-sub)]">Admin Notes</span>
                  <p className="text-xs text-[var(--text)]">{vm.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONSOLE SCREEN DISPLAY */}
          {tab === "console" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-dim)] text-xs">
                <span className="font-mono text-[var(--text)]">Console Connection: <strong>{vm.ipAddress || "192.168.1.110"}</strong></span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setScreenConnected(!screenConnected)}
                    className="px-2.5 py-1 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg text-[var(--text-sub)] hover:text-[var(--text)]"
                  >
                    {screenConnected ? "Disconnect" : "Reconnect"}
                  </button>
                  <button 
                    onClick={() => toast.success("Ctrl+Alt+Del signal sent to VM")}
                    className="px-2.5 py-1 bg-[var(--amber)] text-black font-bold rounded-lg"
                  >
                    Send Ctrl+Alt+Del
                  </button>
                </div>
              </div>

              {/* Simulated Screen Stage */}
              <div className="relative w-full aspect-video bg-black rounded-2xl border-2 border-[var(--border-dim)] overflow-hidden shadow-2xl flex flex-col items-center justify-center p-4">
                {screenConnected && vm.status === "Running" ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 text-white font-mono p-6 relative">
                    <div className="absolute top-3 left-3 flex items-center gap-2 opacity-60 text-xs">
                      <Terminal size={14} /> Hyper-V VM Console — {vm.name}
                    </div>

                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                        <Server size={32} />
                      </div>
                      <h3 className="text-lg font-bold">{vm.os}</h3>
                      <p className="text-xs text-slate-300">Press Ctrl+Alt+Del to sign in or connect via RDP</p>
                      <div className="inline-block bg-black/40 px-3 py-1 rounded-full text-[11px] text-amber-400 border border-amber-500/30">
                        IP: {vm.ipAddress || "192.168.1.110"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2 text-slate-500 font-mono">
                    <Power size={32} className="mx-auto text-slate-600" />
                    <p className="text-xs font-semibold">Virtual Machine is {vm.status}</p>
                    <p className="text-[11px]">Start the VM to access the console screen display</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CHECKPOINTS / SNAPSHOTS */}
          {tab === "checkpoints" && (
            <div className="space-y-6">
              {/* Create Checkpoint Form */}
              <form onSubmit={handleCreateCheckpoint} className="flex gap-2">
                <input
                  value={newCheckpointName}
                  onChange={(e) => setNewCheckpointName(e.target.value)}
                  placeholder="Snapshot name (e.g. Pre-Patch Backup)..."
                  className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-4 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                />
                <button 
                  disabled={creatingCheckpoint}
                  type="submit" 
                  className="bg-[var(--amber)] text-black font-bold px-4 py-2 rounded-xl text-xs hover:bg-[var(--amber-hover)] disabled:opacity-50"
                >
                  {creatingCheckpoint ? "Creating..." : "Take Snapshot"}
                </button>
              </form>

              {/* Checkpoints Timeline Tree */}
              <div className="space-y-3">
                {(!vm.checkpoints || vm.checkpoints.length === 0) ? (
                  <div className="text-center py-12 text-[var(--text-sub)] border border-dashed border-[var(--border-dim)] rounded-2xl">
                    <Camera size={24} className="mx-auto mb-2 opacity-40 text-[var(--amber)]" />
                    <p className="text-xs font-semibold">No Checkpoints Created</p>
                    <p className="text-[11px]">Take a snapshot to preserve current VM state.</p>
                  </div>
                ) : (
                  vm.checkpoints.map((cp) => (
                    <div key={cp.id} className="p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-dim)] flex items-center justify-between font-mono text-xs">
                      <div>
                        <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                          <Camera size={14} className="text-[var(--amber)]" />
                          <span>{cp.name}</span>
                          {cp.isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[9px] bg-[var(--ok)]/20 text-[var(--ok)] border border-[var(--ok)]/30">
                              Active State
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-sub)] mt-1">{cp.createdAt}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApplyCheckpoint(cp.name)}
                          className="px-3 py-1 bg-[var(--bg-card)] border border-[var(--border-dim)] text-[var(--text)] hover:border-[var(--amber)] rounded-lg text-xs font-semibold"
                        >
                          Revert
                        </button>
                        <button
                          onClick={() => handleDeleteCheckpoint(cp.name)}
                          className="p-1.5 text-[var(--text-sub)] hover:text-[var(--crit)] rounded-lg"
                          title="Delete snapshot"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: HARDWARE CONFIGURATION */}
          {tab === "hardware" && (
            <form onSubmit={handleSaveHardware} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">vCPU Cores</label>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    value={vCPUs}
                    onChange={(e) => setVCPUs(Number(e.target.value))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Startup RAM (MB)</label>
                  <input
                    type="number"
                    min={1024}
                    step={1024}
                    value={ramMB}
                    onChange={(e) => setRamMB(Number(e.target.value))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-dim)]">
                <input
                  type="checkbox"
                  id="dynRam"
                  checked={dynamicRam}
                  onChange={(e) => setDynamicRam(e.target.checked)}
                  className="rounded border-[var(--border-dim)] text-[var(--amber)] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="dynRam" className="text-xs text-[var(--text)] cursor-pointer font-semibold">
                  Enable Hyper-V Dynamic Memory Allocation
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Virtual Switch Connection</label>
                <select
                  value={vswitch}
                  onChange={(e) => setVswitch(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] font-mono"
                >
                  {switches.map(sw => (
                    <option key={sw.id} value={sw.name}>{sw.name} ({sw.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Virtual DVD ISO Path</label>
                <input
                  value={isoPath}
                  onChange={(e) => setIsoPath(e.target.value)}
                  placeholder="e.g. C:\ISOs\WindowsServer2022.iso"
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl p-3 text-xs text-[var(--text)] focus:border-[var(--amber)]"
                />
              </div>

              <div className="pt-4 border-t border-[var(--border-dim)] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDeleteVM}
                  className="text-xs text-[var(--crit)] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Trash2 size={13} /> Delete Virtual Machine
                </button>

                <button
                  disabled={savingSettings}
                  type="submit"
                  className="bg-[var(--amber)] text-black font-bold px-5 py-2 rounded-xl text-xs hover:bg-[var(--amber-hover)] disabled:opacity-50"
                >
                  {savingSettings ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

// Modal for Creating New Virtual Machine
function CreateVMModal({ server, switches, onClose, onCreated }: { server: string; switches: VirtualSwitch[]; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [os, setOs] = useState("Windows Server 2022");
  const [generation, setGeneration] = useState<1 | 2>(2);
  const [memoryMb, setMemoryMb] = useState(4096);
  const [dynamicRam, setDynamicRam] = useState(true);
  const [vcpu, setVcpu] = useState(2);
  const [vswitch, setVswitch] = useState(switches[0]?.name || "NEXUS-External");
  const [vhdxSizeGb, setVhdxSizeGb] = useState(80);
  const [isoPath, setIsoPath] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const presets = [
    { label: "Windows Server 2022", os: "Windows Server 2022", ram: 8192, vcpu: 4, disk: 120 },
    { label: "Windows 11 Enterprise", os: "Windows 11 Enterprise", ram: 8192, vcpu: 4, disk: 150 },
    { label: "Ubuntu 22.04 LTS", os: "Ubuntu 22.04 LTS", ram: 4096, vcpu: 2, disk: 60 },
    { label: "Debian 12", os: "Debian 12", ram: 2048, vcpu: 2, disk: 40 }
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setOs(p.os);
    setMemoryMb(p.ram);
    setVcpu(p.vcpu);
    setVhdxSizeGb(p.disk);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const ok = await createVMClient(server, { 
        name: name.trim(), 
        os,
        memoryMb, 
        vcpu, 
        vswitch, 
        vhdxSizeGb, 
        generation,
        dynamicMemory: dynamicRam,
        isoPath: isoPath || undefined 
      });
      if (ok) {
        toast.success(`Virtual Machine "${name}" created successfully`);
        onCreated();
      } else {
        toast.error("Failed to create Virtual Machine");
      }
    } catch {
      toast.error("VM creation error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <Server size={18} className="text-[var(--amber)]" />
            <h3 className="text-base font-bold text-[var(--text)]">Create Hyper-V Virtual Machine</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* OS Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">OS Templates</label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                    os === p.os 
                      ? "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)] font-bold" 
                      : "border-[var(--border-dim)] bg-[var(--bg-surface)] text-[var(--text)] hover:border-[var(--amber)]/50"
                  }`}
                >
                  <div>{p.label}</div>
                  <div className="text-[10px] opacity-70 font-mono mt-0.5">{p.ram/1024} GB RAM • {p.vcpu} vCPUs • {p.disk} GB Disk</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">VM Name</label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SVR2022-WEB01"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Generation</label>
              <select
                value={generation}
                onChange={(e) => setGeneration(Number(e.target.value) as any)}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
              >
                <option value={2}>Generation 2 (UEFI & Secure Boot)</option>
                <option value={1}>Generation 1 (Legacy BIOS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">vCPU Cores</label>
              <input
                type="number"
                required
                min={1}
                max={32}
                value={vcpu}
                onChange={(e) => setVcpu(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Startup RAM (MB)</label>
              <input
                type="number"
                required
                min={1024}
                step={1024}
                value={memoryMb}
                onChange={(e) => setMemoryMb(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">VHDX Disk (GB)</label>
              <input
                type="number"
                required
                min={20}
                max={2048}
                value={vhdxSizeGb}
                onChange={(e) => setVhdxSizeGb(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Virtual Switch</label>
            <select
              value={vswitch}
              onChange={(e) => setVswitch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            >
              {switches.map(sw => (
                <option key={sw.id} value={sw.name}>{sw.name} ({sw.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">ISO Installation Image Path (Optional)</label>
            <input
              value={isoPath}
              onChange={(e) => setIsoPath(e.target.value)}
              placeholder="e.g. C:\ISOs\WindowsServer2022.iso"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            />
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting || !name.trim()} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Creating VM..." : "Create Virtual Machine"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Modal for Creating Virtual Switch
function CreateSwitchModal({ server, onClose, onCreated }: { server: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"External" | "Internal" | "Private">("External");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const ok = await createVirtualSwitchClient(server, { name: name.trim(), type, notes });
      if (ok) {
        toast.success(`Virtual Switch "${name}" created`);
        onCreated();
      } else {
        toast.error("Failed to create Virtual Switch");
      }
    } catch {
      toast.error("Switch creation error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <Network size={18} className="text-[var(--amber)]" />
            <h3 className="text-base font-bold text-[var(--text)]">Create Virtual Switch</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Switch Name</label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DMZ-External"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Switch Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            >
              <option value="External">External (Binds to physical network adapter)</option>
              <option value="Internal">Internal (Host & VM communication only)</option>
              <option value="Private">Private (Inter-VM communication only)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Description / Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Physical LAN bridged switch"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            />
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting || !name.trim()} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Creating..." : "Create Switch"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Btn({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ size?: number }>; label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className="mono flex items-center gap-1 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-[var(--text-sub)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors"
    >
      <Icon size={11} /> {label}
    </button>
  );
}
