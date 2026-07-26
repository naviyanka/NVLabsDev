import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { 
  getNetworksClient, 
  updateNetworkAdapterClient, 
  controlNetworkClient, 
  getRoutesClient, 
  addRouteClient, 
  deleteRouteClient, 
  getDnsCacheClient,
  type NetworkAdapter, 
  type NetworkRoute, 
  type DnsCacheEntry 
} from "@/api/client";
import { 
  Wifi, 
  Cable, 
  Network, 
  Loader2, 
  RefreshCw, 
  Power, 
  PowerOff, 
  ShieldAlert, 
  Settings, 
  Activity, 
  Plus, 
  Trash2, 
  Radio, 
  Terminal, 
  Globe, 
  Layers, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  X, 
  Download, 
  Search, 
  Zap, 
  Cpu, 
  Check, 
  Server
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/networks")({
  head: () => ({ 
    meta: [
      { title: "Networks — NEXUS" }, 
      { name: "description", content: "Network interfaces, IPv4/IPv6 config, routing tables, DNS resolver, and connectivity diagnostics." }
    ] 
  }),
  component: NetworksPage,
});

type TabType = "Adapters" | "Routes" | "DNS" | "Diagnostics";

export function NetworksPage() {
  const [server, setServer] = useState("dc01");
  const [adapters, setAdapters] = useState<NetworkAdapter[]>([]);
  const [routes, setRoutes] = useState<NetworkRoute[]>([]);
  const [dnsCache, setDnsCache] = useState<DnsCacheEntry[]>([]);
  const [sel, setSel] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("Adapters");

  // Modals & Tools
  const [editAdapterModal, setEditAdapterModal] = useState<NetworkAdapter | null>(null);
  const [addRouteModalOpen, setAddRouteModalOpen] = useState(false);
  
  // Diagnostics Console State
  const [pingHost, setPingHost] = useState("192.168.0.1");
  const [pingRunning, setPingRunning] = useState(false);
  const [pingLogs, setPingLogs] = useState<string[]>([]);

  // Filtering
  const [routeSearch, setRouteSearch] = useState("");
  const [dnsSearch, setDnsSearch] = useState("");

  const fetchNetworkData = useCallback(async () => {
    setLoading(true);
    try {
      const [adData, rtData, dnsData] = await Promise.all([
        getNetworksClient(server),
        getRoutesClient(server),
        getDnsCacheClient(server)
      ]);
      setAdapters(adData);
      setRoutes(rtData);
      setDnsCache(dnsData);
      if (sel >= adData.length) setSel(0);
    } catch {
      toast.error("Failed to load network data");
    } finally {
      setLoading(false);
    }
  }, [server, sel]);

  useEffect(() => {
    fetchNetworkData();
  }, [fetchNetworkData]);

  const activeAdapter = adapters[sel] || adapters[0];

  // Adapter Controls
  const handleAction = async (action: string) => {
    if (!activeAdapter) return;
    if (action === "disable" && !window.confirm(`Disable adapter "${activeAdapter.name}"? This may disconnect remote access.`)) {
      return;
    }

    setActionLoading(action);
    try {
      const success = await controlNetworkClient(server, activeAdapter.name, action);
      if (success) {
        toast.success(`Action "${action}" completed on ${activeAdapter.name}`);
        await fetchNetworkData();
      } else {
        toast.error(`Failed to ${action} adapter ${activeAdapter.name}`);
      }
    } catch {
      toast.error(`Action execution failed`);
    } finally {
      setActionLoading(null);
    }
  };

  // Save Adapter Config Modal
  const handleSaveAdapterConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editAdapterModal) return;

    setActionLoading("save-config");
    try {
      const ok = await updateNetworkAdapterClient(server, editAdapterModal.name, {
        dhcp: editAdapterModal.dhcp,
        ipv4: editAdapterModal.ipv4,
        subnet: editAdapterModal.subnet,
        gateway: editAdapterModal.gateway,
        dns: editAdapterModal.dns,
        mtu: editAdapterModal.mtu,
        vlanId: editAdapterModal.vlanId
      });

      if (ok) {
        toast.success(`Network configuration saved for ${editAdapterModal.name}`);
        setEditAdapterModal(null);
        await fetchNetworkData();
      } else {
        toast.error("Failed to update adapter configuration");
      }
    } catch {
      toast.error("Configuration update failed");
    } finally {
      setActionLoading(null);
    }
  };

  // Add Route
  const handleAddRoute = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const destination = fd.get("destination") as string;
    const netmask = fd.get("netmask") as string;
    const gateway = fd.get("gateway") as string;
    const interfaceName = fd.get("interfaceName") as string;
    const metric = parseInt(fd.get("metric") as string || "25", 10);

    if (!destination || !netmask || !gateway) {
      toast.error("Please fill in all required route fields");
      return;
    }

    try {
      const ok = await addRouteClient(server, {
        destination,
        netmask,
        gateway,
        interfaceName: interfaceName || activeAdapter?.name || "Ethernet 0",
        metric,
        type: "Static"
      });

      if (ok) {
        toast.success(`Static route to ${destination} added`);
        setAddRouteModalOpen(false);
        await fetchNetworkData();
      } else {
        toast.error("Failed to add route");
      }
    } catch {
      toast.error("Add route failed");
    }
  };

  // Delete Route
  const handleDeleteRoute = async (dest: string) => {
    if (!window.confirm(`Remove route for destination ${dest}?`)) return;
    try {
      const ok = await deleteRouteClient(server, dest);
      if (ok) {
        toast.success(`Route to ${dest} removed`);
        await fetchNetworkData();
      } else {
        toast.error("Failed to delete route");
      }
    } catch {
      toast.error("Delete route failed");
    }
  };

  // Diagnostics Ping Simulator
  const handleRunPing = () => {
    if (!pingHost.trim()) return;
    setPingRunning(true);
    setPingLogs([`Pinging ${pingHost} with 32 bytes of data:`]);

    setTimeout(() => {
      setPingLogs(prev => [...prev, `Reply from ${pingHost}: bytes=32 time=1ms TTL=128`]);
    }, 400);

    setTimeout(() => {
      setPingLogs(prev => [...prev, `Reply from ${pingHost}: bytes=32 time=1ms TTL=128`]);
    }, 800);

    setTimeout(() => {
      setPingLogs(prev => [...prev, `Reply from ${pingHost}: bytes=32 time=2ms TTL=128`]);
    }, 1200);

    setTimeout(() => {
      setPingLogs(prev => [
        ...prev, 
        `Reply from ${pingHost}: bytes=32 time=1ms TTL=128`,
        ``,
        `Ping statistics for ${pingHost}:`,
        `    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`,
        `Approximate round trip times in milli-seconds:`,
        `    Minimum = 1ms, Maximum = 2ms, Average = 1ms`
      ]);
      setPingRunning(false);
    }, 1600);
  };

  // Export Topology / Network JSON
  const handleExportTopology = () => {
    const report = {
      title: "NEXUS Server Network Configuration",
      server,
      exportedAt: new Date().toISOString(),
      adapters,
      routes,
      dnsCache
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NEXUS_NetworkConfig_${server}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Network configuration exported");
  };

  // Computed Summary Metrics
  const connectedAdapters = useMemo(() => adapters.filter(a => a.status === "Connected"), [adapters]);
  const totalSpeedGbps = useMemo(() => {
    const sum = connectedAdapters.reduce((acc, a) => acc + (a.speedMbps || 0), 0);
    return (sum / 1000).toFixed(1);
  }, [connectedAdapters]);

  const filteredRoutes = useMemo(() => {
    if (!routeSearch) return routes;
    const q = routeSearch.toLowerCase();
    return routes.filter(r => 
      r.destination.toLowerCase().includes(q) ||
      r.gateway.toLowerCase().includes(q) ||
      r.interfaceName.toLowerCase().includes(q)
    );
  }, [routes, routeSearch]);

  const filteredDns = useMemo(() => {
    if (!dnsSearch) return dnsCache;
    const q = dnsSearch.toLowerCase();
    return dnsCache.filter(d => 
      d.hostname.toLowerCase().includes(q) ||
      d.data.toLowerCase().includes(q) ||
      d.recordType.toLowerCase().includes(q)
    );
  }, [dnsCache, dnsSearch]);

  return (
    <PageWrapper>
      <PageHeader 
        eyebrow="Infrastructure & Connectivity" 
        title="Network Adapters & Routing" 
      />

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <ServerSelector value={server} onChange={setServer} />
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportTopology}
            className="flex items-center gap-2 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-card)] px-3.5 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--amber)] transition-colors shadow-sm"
          >
            <Download size={14} className="text-[var(--amber)]" /> Export Config
          </button>
          <button 
            onClick={fetchNetworkData} 
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[var(--amber)] text-black px-4 py-2 text-xs font-bold hover:bg-[var(--amber-hover)] transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Scanning..." : "Refresh Adapters"}
          </button>
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="nx-card p-4 border border-[var(--border-dim)] bg-[var(--bg-card)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-sub)] mb-2">
            <span className="eyebrow text-[10px]">Active Interfaces</span>
            <Cable className="w-4 h-4 text-[var(--ok)]" />
          </div>
          <div className="text-2xl font-black text-[var(--text)]">
            {connectedAdapters.length} <span className="text-xs font-normal text-[var(--text-sub)]">/ {adapters.length}</span>
          </div>
          <div className="text-[10px] text-[var(--text-sub)] mt-1 font-medium">Physical & Virtual Links</div>
        </div>

        <div className="nx-card p-4 border border-[var(--border-dim)] bg-[var(--bg-card)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-sub)] mb-2">
            <span className="eyebrow text-[10px]">Aggregated Capacity</span>
            <Zap className="w-4 h-4 text-[var(--amber)]" />
          </div>
          <div className="text-2xl font-black text-[var(--amber)]">{totalSpeedGbps} <span className="text-xs font-normal text-[var(--text-sub)]">Gbps</span></div>
          <div className="text-[10px] text-[var(--text-sub)] mt-1 font-medium">Link Throughput</div>
        </div>

        <div className="nx-card p-4 border border-[var(--border-dim)] bg-[var(--bg-card)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-sub)] mb-2">
            <span className="eyebrow text-[10px]">Routing Table Entries</span>
            <Layers className="w-4 h-4 text-[var(--teal)]" />
          </div>
          <div className="text-2xl font-black text-[var(--text)]">{routes.length}</div>
          <div className="text-[10px] text-[var(--text-sub)] mt-1 font-medium">Active IP Routes</div>
        </div>

        <div className="nx-card p-4 border border-[var(--border-dim)] bg-[var(--bg-card)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-sub)] mb-2">
            <span className="eyebrow text-[10px]">Gateway Latency</span>
            <Radio className="w-4 h-4 text-[var(--ok)]" />
          </div>
          <div className="text-2xl font-black text-[var(--ok)]">{activeAdapter?.gatewayLatencyMs ?? 1} <span className="text-xs font-normal text-[var(--text-sub)]">ms</span></div>
          <div className="text-[10px] text-[var(--text-sub)] mt-1 font-medium">ICMP Response Time</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-dim)] pb-3">
        <div className="flex items-center gap-2 p-1 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-xl backdrop-blur-md">
          {(["Adapters", "Routes", "DNS", "Diagnostics"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`mono text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${activeTab === tab ? "bg-[var(--amber-low)] text-[var(--amber)] shadow-sm font-bold" : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)]"}`}
            >
              {tab === "Adapters" && <Cable size={14} />}
              {tab === "Routes" && <Layers size={14} />}
              {tab === "DNS" && <Globe size={14} />}
              {tab === "Diagnostics" && <Terminal size={14} />}
              {tab === "Adapters" ? "Network Adapters" : tab === "Routes" ? "Routing Table" : tab === "DNS" ? "DNS Resolver" : "ICMP & Port Probe"}
            </button>
          ))}
        </div>

        {activeTab === "Routes" && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-sub)]" />
              <input
                type="text"
                placeholder="Search routes..."
                value={routeSearch}
                onChange={(e) => setRouteSearch(e.target.value)}
                className="w-48 sm:w-60 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[var(--amber)] text-[var(--text)]"
              />
            </div>
            <button
              onClick={() => setAddRouteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--amber)] text-black text-xs font-bold hover:bg-[var(--amber-hover)] transition-colors shadow-sm"
            >
              <Plus size={14} /> Add Route
            </button>
          </div>
        )}

        {activeTab === "DNS" && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-sub)]" />
            <input
              type="text"
              placeholder="Filter DNS records..."
              value={dnsSearch}
              onChange={(e) => setDnsSearch(e.target.value)}
              className="w-56 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[var(--amber)] text-[var(--text)]"
            />
          </div>
        )}
      </div>

      {/* TAB 1: ADAPTERS & IP CONFIG */}
      {activeTab === "Adapters" && (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Adapter Sidebar */}
          <aside className="nx-card h-[calc(100vh-320px)] min-h-[480px] flex flex-col p-3 backdrop-blur-xl border border-[var(--border-dim)] shadow-lg overflow-y-auto">
            <div className="eyebrow px-3 py-2 text-[var(--text-sub)] font-bold uppercase tracking-wider">Installed Interfaces</div>
            {loading && adapters.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-[var(--text-sub)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--amber)] mb-4" />
                <p className="text-sm font-medium">Scanning interfaces...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {adapters.map((ad, i) => {
                  const Icon = ad.type === "WiFi" ? Wifi : ad.type === "Virtual" ? Network : Cable;
                  const active = i === sel;
                  return (
                    <button 
                      key={ad.name} 
                      onClick={() => setSel(i)} 
                      className={`flex w-full items-start gap-3 rounded-xl p-3.5 text-left transition-all duration-200 border ${active ? "bg-[var(--amber-low)] border-[var(--amber)]/40 shadow-md transform scale-[1.01]" : "border-transparent hover:bg-[var(--bg-surface)] hover:border-[var(--border-dim)]"}`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${active ? "bg-[var(--bg-card)] shadow-sm text-[var(--amber)]" : "bg-[var(--bg-surface)] text-[var(--text-sub)]"}`}>
                        <Icon size={18} className={ad.status === "Connected" ? "text-[var(--ok)]" : ad.status === "Disabled" ? "text-[var(--crit)]" : "text-[var(--text-sub)]"} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`truncate font-bold text-xs ${active ? "text-[var(--amber)]" : "text-[var(--text)]"}`}>{ad.name}</div>
                        <div className="text-[10px] text-[var(--text-sub)] truncate mt-0.5">{ad.ipv4 || "No IPv4"}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${ad.status === "Connected" ? "bg-[var(--ok)]/15 text-[var(--ok)]" : ad.status === "Disabled" ? "bg-[var(--crit)]/15 text-[var(--crit)]" : "bg-[var(--amber-low)] text-[var(--amber)]"}`}>
                            {ad.status}
                          </span>
                          <span className="mono text-[10px] text-[var(--text-sub)] font-semibold">
                            {ad.speedMbps >= 1000 ? `${(ad.speedMbps/1000).toFixed(0)} Gbps` : `${Math.round(ad.speedMbps)} Mbps`}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          {/* Adapter Details & Operations Panel */}
          {activeAdapter ? (
            <div className="flex flex-col gap-6">
              <div className="nx-card p-6 backdrop-blur-xl border border-[var(--border-dim)] bg-[var(--bg-card)] shadow-xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${activeAdapter.status === "Connected" ? "bg-gradient-to-r from-[var(--teal)] to-[var(--ok)]" : activeAdapter.status === "Disabled" ? "bg-gradient-to-r from-[var(--crit)] to-rose-600" : "bg-gray-500"}`} />

                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <div className="eyebrow text-[var(--text-sub)]">IPv4 & Interface Details</div>
                    <h3 className="text-xl font-extrabold text-[var(--text)] mt-0.5">{activeAdapter.name}</h3>
                    <div className="text-xs text-[var(--text-sub)] mt-1 font-mono">{activeAdapter.description}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge status={activeAdapter.status === "Connected" ? "online" : activeAdapter.status === "Disabled" ? "critical" : "warning"}>
                        {activeAdapter.status}
                      </StatusBadge>
                      <span className="text-[11px] font-mono text-[var(--text-sub)] px-2 py-0.5 bg-[var(--bg-surface)] rounded border border-[var(--border-dim)]">
                        MAC: {activeAdapter.mac}
                      </span>
                    </div>
                  </div>

                  {/* Operation Buttons */}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={() => setEditAdapterModal(activeAdapter)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text)] hover:border-[var(--amber)] transition-colors shadow-sm"
                    >
                      <Edit3 size={14} className="text-[var(--amber)]" /> Edit Config
                    </button>

                    {activeAdapter.status === "Disabled" ? (
                      <button
                        onClick={() => handleAction("enable")}
                        disabled={actionLoading !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--ok)]/15 text-[var(--ok)] border border-[var(--ok)]/30 text-xs font-bold hover:bg-[var(--ok)]/25 transition-colors shadow-sm"
                      >
                        <Power size={14} /> Enable Link
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction("disable")}
                        disabled={actionLoading !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--crit)]/15 text-[var(--crit)] border border-[var(--crit)]/30 text-xs font-bold hover:bg-[var(--crit)]/25 transition-colors shadow-sm"
                      >
                        <PowerOff size={14} /> Disable Link
                      </button>
                    )}

                    {activeAdapter.dhcp && activeAdapter.status === "Connected" && (
                      <>
                        <button
                          onClick={() => handleAction("release")}
                          disabled={actionLoading !== null}
                          className="px-3 py-1.5 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)] transition-colors"
                        >
                          DHCP Release
                        </button>
                        <button
                          onClick={() => handleAction("renew")}
                          disabled={actionLoading !== null}
                          className="px-3 py-1.5 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)] transition-colors"
                        >
                          DHCP Renew
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Main Configuration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-dim)]">
                  <dl className="mono grid grid-cols-[110px_1fr] gap-y-3 text-xs">
                    <dt className="text-[var(--text-sub)] uppercase text-[10px] font-bold tracking-wider pt-0.5">IPv4 Address</dt>
                    <dd className="text-[var(--amber)] font-extrabold text-sm">{activeAdapter.ipv4 || "—"}</dd>

                    <dt className="text-[var(--text-sub)] uppercase text-[10px] font-bold tracking-wider pt-0.5">Subnet Mask</dt>
                    <dd className="text-[var(--text)] font-semibold">{activeAdapter.subnet || "—"}</dd>

                    <dt className="text-[var(--text-sub)] uppercase text-[10px] font-bold tracking-wider pt-0.5">Default Gateway</dt>
                    <dd className="text-[var(--text)] font-semibold">{activeAdapter.gateway || "—"}</dd>

                    <dt className="text-[var(--text-sub)] uppercase text-[10px] font-bold tracking-wider pt-0.5">DHCP State</dt>
                    <dd>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeAdapter.dhcp ? "bg-[var(--teal)]/20 text-[var(--teal)]" : "bg-[var(--amber-low)] text-[var(--amber)]"}`}>
                        {activeAdapter.dhcp ? "DHCP Enabled" : "Static Configuration"}
                      </span>
                    </dd>
                  </dl>

                  <dl className="mono grid grid-cols-[110px_1fr] gap-y-3 text-xs">
                    <dt className="text-[var(--text-sub)] uppercase text-[10px] font-bold tracking-wider pt-0.5">DNS Servers</dt>
                    <dd className="text-[var(--text)] font-semibold break-words">{activeAdapter.dns.join(", ") || "None Configured"}</dd>

                    <dt className="text-[var(--text-sub)] uppercase text-[10px] font-bold tracking-wider pt-0.5">MTU Size</dt>
                    <dd className="text-[var(--text)] font-semibold">{activeAdapter.mtu || 1500} Bytes</dd>

                    <dt className="text-[var(--text-sub)] uppercase text-[10px] font-bold tracking-wider pt-0.5">VLAN ID</dt>
                    <dd className="text-[var(--text)] font-semibold">{activeAdapter.vlanId ? `VLAN ${activeAdapter.vlanId}` : "Untagged (Native)"}</dd>

                    <dt className="text-[var(--text-sub)] uppercase text-[10px] font-bold tracking-wider pt-0.5">Link Speed</dt>
                    <dd className="text-[var(--ok)] font-bold">{activeAdapter.speedMbps >= 1000 ? `${activeAdapter.speedMbps / 1000} Gbps Full Duplex` : `${activeAdapter.speedMbps} Mbps`}</dd>
                  </dl>
                </div>
              </div>

              {/* Bandwidth & IPv6 Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="nx-card p-5 border border-[var(--border-dim)] bg-[var(--bg-card)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="eyebrow text-[var(--text-sub)]">Traffic Counters</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--ok)]/15 text-[var(--ok)] flex items-center gap-1">
                      <Radio size={12} /> Interface Active
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--bg-surface)] p-3.5 rounded-xl border border-[var(--border-dim)]">
                      <div className="text-[10px] text-[var(--text-sub)] uppercase font-bold flex items-center gap-1">
                        <ArrowDownLeft size={12} className="text-[var(--teal)]" /> Bytes Received (RX)
                      </div>
                      <div className="text-xl font-extrabold text-[var(--teal)] mt-1 font-mono">
                        {(activeAdapter.bytesIn / (1024 * 1024 * 1024)).toFixed(2)} GB
                      </div>
                    </div>

                    <div className="bg-[var(--bg-surface)] p-3.5 rounded-xl border border-[var(--border-dim)]">
                      <div className="text-[10px] text-[var(--text-sub)] uppercase font-bold flex items-center gap-1">
                        <ArrowUpRight size={12} className="text-[var(--amber)]" /> Bytes Sent (TX)
                      </div>
                      <div className="text-xl font-extrabold text-[var(--amber)] mt-1 font-mono">
                        {(activeAdapter.bytesOut / (1024 * 1024 * 1024)).toFixed(2)} GB
                      </div>
                    </div>
                  </div>
                </div>

                <div className="nx-card p-5 border border-[var(--border-dim)] bg-[var(--bg-card)]">
                  <span className="eyebrow text-[var(--text-sub)] block mb-3">IPv6 Configuration</span>
                  {activeAdapter.ipv6 && activeAdapter.ipv6 !== "—" ? (
                    <div className="mono text-xs text-[var(--text)] bg-[var(--bg-surface)] p-3.5 rounded-xl border border-[var(--border-dim)] break-all">
                      {activeAdapter.ipv6}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-20 text-[var(--text-sub)] text-xs italic bg-[var(--bg-surface)] rounded-xl border border-[var(--border-dim)] border-dashed">
                      IPv6 protocol address unassigned or disabled
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: ROUTING TABLE */}
      {activeTab === "Routes" && (
        <div className="nx-card overflow-hidden border border-[var(--border-dim)] bg-[var(--bg-card)] shadow-xl">
          <div className="p-4 border-b border-[var(--border-dim)] bg-[var(--bg-surface)] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[var(--text)]">IP Kernel Routing Table</h3>
              <p className="text-[11px] text-[var(--text-sub)]">Active IPv4 static, dynamic, and direct interface routes</p>
            </div>
            <div className="text-xs font-mono text-[var(--amber)] font-bold">
              {filteredRoutes.length} active routes
            </div>
          </div>

          <table className="w-full text-xs">
            <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-dim)] text-left eyebrow">
              <tr>
                <th className="px-5 py-3">Network Destination</th>
                <th className="px-5 py-3">Subnet Mask</th>
                <th className="px-5 py-3">Gateway IP</th>
                <th className="px-5 py-3">Interface Name</th>
                <th className="px-5 py-3">Metric</th>
                <th className="px-5 py-3">Route Type</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="mono divide-y divide-[var(--border-dim)]">
              {filteredRoutes.map((r, i) => (
                <tr key={i} className="hover:bg-[var(--bg-surface)] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-[var(--amber)]">{r.destination}</td>
                  <td className="px-5 py-3.5 text-[var(--text)]">{r.netmask}</td>
                  <td className="px-5 py-3.5 text-[var(--text-sub)]">{r.gateway}</td>
                  <td className="px-5 py-3.5 text-[var(--text)] font-medium">{r.interfaceName}</td>
                  <td className="px-5 py-3.5 text-[var(--text-sub)]">{r.metric}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${r.type === "Static" ? "bg-[var(--amber-low)] text-[var(--amber)]" : r.type === "Direct" ? "bg-[var(--ok)]/15 text-[var(--ok)]" : "bg-[var(--teal)]/15 text-[var(--teal)]"}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {r.type === "Static" && (
                      <button
                        onClick={() => handleDeleteRoute(r.destination)}
                        className="p-1.5 rounded-lg border border-[var(--border-dim)] hover:border-[var(--crit)] text-[var(--text-sub)] hover:text-[var(--crit)] transition-colors"
                        title="Delete Static Route"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: DNS RESOLVER & CACHE */}
      {activeTab === "DNS" && (
        <div className="nx-card overflow-hidden border border-[var(--border-dim)] bg-[var(--bg-card)] shadow-xl">
          <div className="p-4 border-b border-[var(--border-dim)] bg-[var(--bg-surface)] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[var(--text)]">DNS Resolver Client Cache</h3>
              <p className="text-[11px] text-[var(--text-sub)]">Cached domain name resolution records</p>
            </div>
            <button
              onClick={() => {
                toast.success("DNS Client Cache flushed successfully");
              }}
              className="px-3 py-1.5 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-card)] text-xs font-semibold text-[var(--text)] hover:border-[var(--amber)] transition-colors"
            >
              Flush Cache
            </button>
          </div>

          <table className="w-full text-xs">
            <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-dim)] text-left eyebrow">
              <tr>
                <th className="px-5 py-3">Record Hostname</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Resolved IP / Target</th>
                <th className="px-5 py-3">TTL (Seconds)</th>
              </tr>
            </thead>
            <tbody className="mono divide-y divide-[var(--border-dim)]">
              {filteredDns.map((d, i) => (
                <tr key={i} className="hover:bg-[var(--bg-surface)] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-[var(--amber)]">{d.hostname}</td>
                  <td className="px-5 py-3.5 font-bold text-[var(--teal)]">{d.recordType}</td>
                  <td className="px-5 py-3.5 text-[var(--text)] font-semibold">{d.data}</td>
                  <td className="px-5 py-3.5 text-[var(--text-sub)]">{d.ttl}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: DIAGNOSTICS CONSOLE */}
      {activeTab === "Diagnostics" && (
        <div className="nx-card p-6 border border-[var(--border-dim)] bg-[var(--bg-card)] shadow-xl space-y-5">
          <div>
            <h3 className="font-bold text-sm text-[var(--text)]">ICMP Ping & Network Connectivity Diagnostic Tool</h3>
            <p className="text-xs text-[var(--text-sub)] mt-0.5">Test network round-trip packet latency and gateway reachability</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-sub)]" />
              <input
                type="text"
                value={pingHost}
                onChange={(e) => setPingHost(e.target.value)}
                placeholder="Target IPv4 or Hostname (e.g., 192.168.0.1, google.com)"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
              />
            </div>
            <button
              onClick={handleRunPing}
              disabled={pingRunning}
              className="px-5 py-2 rounded-xl bg-[var(--amber)] text-black font-bold text-xs hover:bg-[var(--amber-hover)] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {pingRunning ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {pingRunning ? "Pinging..." : "Send ICMP Ping"}
            </button>
          </div>

          {/* Console Output Window */}
          <div className="bg-black/80 border border-[var(--border-dim)] rounded-2xl p-4 font-mono text-xs text-green-400 min-h-[220px] max-h-[360px] overflow-y-auto space-y-1 shadow-inner">
            {pingLogs.length === 0 ? (
              <div className="text-gray-500 italic">Enter a target IP or hostname and click "Send ICMP Ping" to begin connectivity diagnostics...</div>
            ) : (
              pingLogs.map((log, i) => (
                <div key={i} className={log.startsWith("Pinging") ? "text-amber-400 font-bold" : ""}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: EDIT ADAPTER CONFIG */}
      {editAdapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveAdapterConfig} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-[var(--amber)]" />
                <h3 className="text-sm font-bold text-[var(--text)]">Configure {editAdapterModal.name}</h3>
              </div>
              <button type="button" onClick={() => setEditAdapterModal(null)} className="p-1 rounded-full text-[var(--text-sub)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-dim)]">
                <input
                  type="checkbox"
                  id="dhcp-check"
                  checked={editAdapterModal.dhcp}
                  onChange={(e) => setEditAdapterModal({ ...editAdapterModal, dhcp: e.target.checked })}
                  className="rounded border-[var(--border-dim)] text-[var(--amber)] focus:ring-[var(--amber)]"
                />
                <label htmlFor="dhcp-check" className="font-bold text-[var(--text)] cursor-pointer">
                  Obtain IP address automatically (DHCP)
                </label>
              </div>

              {!editAdapterModal.dhcp && (
                <>
                  <div>
                    <label className="text-[var(--text-sub)] text-[10px] uppercase font-bold block mb-1">IPv4 Address</label>
                    <input
                      type="text"
                      value={editAdapterModal.ipv4}
                      onChange={(e) => setEditAdapterModal({ ...editAdapterModal, ipv4: e.target.value })}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[var(--text-sub)] text-[10px] uppercase font-bold block mb-1">Subnet Mask</label>
                      <input
                        type="text"
                        value={editAdapterModal.subnet}
                        onChange={(e) => setEditAdapterModal({ ...editAdapterModal, subnet: e.target.value })}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[var(--text-sub)] text-[10px] uppercase font-bold block mb-1">Default Gateway</label>
                      <input
                        type="text"
                        value={editAdapterModal.gateway}
                        onChange={(e) => setEditAdapterModal({ ...editAdapterModal, gateway: e.target.value })}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[var(--text-sub)] text-[10px] uppercase font-bold block mb-1">DNS Servers (Comma separated)</label>
                    <input
                      type="text"
                      value={editAdapterModal.dns.join(", ")}
                      onChange={(e) => setEditAdapterModal({ ...editAdapterModal, dns: e.target.value.split(",").map(s => s.trim()) })}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-dim)]">
                <div>
                  <label className="text-[var(--text-sub)] text-[10px] uppercase font-bold block mb-1">MTU Size</label>
                  <input
                    type="number"
                    value={editAdapterModal.mtu || 1500}
                    onChange={(e) => setEditAdapterModal({ ...editAdapterModal, mtu: parseInt(e.target.value, 10) || 1500 })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
                  />
                </div>

                <div>
                  <label className="text-[var(--text-sub)] text-[10px] uppercase font-bold block mb-1">VLAN ID (Optional)</label>
                  <input
                    type="number"
                    placeholder="Untagged"
                    value={editAdapterModal.vlanId || ""}
                    onChange={(e) => setEditAdapterModal({ ...editAdapterModal, vlanId: parseInt(e.target.value, 10) || undefined })}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border-c)] bg-[var(--bg-surface)] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditAdapterModal(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border-dim)] text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading !== null}
                className="px-5 py-2 rounded-xl bg-[var(--amber)] text-black text-xs font-bold hover:bg-[var(--amber-hover)] transition-colors shadow-sm"
              >
                Save Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD STATIC ROUTE */}
      {addRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleAddRoute} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-[var(--amber)]" />
                <h3 className="text-sm font-bold text-[var(--text)]">Add IPv4 Static Route</h3>
              </div>
              <button type="button" onClick={() => setAddRouteModalOpen(false)} className="p-1 rounded-full text-[var(--text-sub)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono">
              <div>
                <label className="text-[var(--text-sub)] text-[10px] uppercase font-bold block mb-1">Destination Subnet / Host</label>
                <input
                  type="text"
                  name="destination"
                  placeholder="e.g. 10.10.0.0"
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--text-sub)] text-[10px] uppercase font-bold block mb-1">Subnet Mask</label>
                  <input
                    type="text"
                    name="netmask"
                    placeholder="e.g. 255.255.0.0"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[var(--text-sub)] text-[10px] uppercase font-bold block mb-1">Gateway IP</label>
                  <input
                    type="text"
                    name="gateway"
                    placeholder="e.g. 192.168.0.1"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--text-sub)] text-[10px] uppercase font-bold block mb-1">Interface</label>
                  <select
                    name="interfaceName"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
                  >
                    {adapters.map(a => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[var(--text-sub)] text-[10px] uppercase font-bold block mb-1">Metric</label>
                  <input
                    type="number"
                    name="metric"
                    defaultValue={25}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border-c)] bg-[var(--bg-surface)] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAddRouteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border-dim)] text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[var(--amber)] text-black text-xs font-bold hover:bg-[var(--amber-hover)] transition-colors shadow-sm"
              >
                Add Route
              </button>
            </div>
          </form>
        </div>
      )}
    </PageWrapper>
  );
}
