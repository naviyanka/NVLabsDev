import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Wifi, Cable, Network, Loader2, RefreshCw, Power, PowerOff, ShieldAlert } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getNetworksClient, controlNetworkClient, type NetworkAdapter } from "@/api/client";

export const Route = createFileRoute("/networks")({
  head: () => ({ meta: [{ title: "Networks — NEXUS" }, { name: "description", content: "Adapters, IP config, and DNS." }] }),
  component: NetworksPage,
});

function NetworksPage() {
  const [server, setServer] = useState("localhost");
  const [adapters, setAdapters] = useState<NetworkAdapter[]>([]);
  const [sel, setSel] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchNetworks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNetworksClient(server);
      setAdapters(data);
      if (sel >= data.length) setSel(0);
    } finally {
      setLoading(false);
    }
  }, [server, sel]);

  useEffect(() => {
    fetchNetworks();
  }, [fetchNetworks]);

  const handleAction = async (action: string) => {
    const a = adapters[sel];
    if (!a) return;
    
    if (action === "disable" && !window.confirm(`Are you sure you want to disable adapter ${a.name}? This might disconnect your server.`)) {
      return;
    }

    setActionLoading(action);
    const success = await controlNetworkClient(server, a.name, action);
    setActionLoading(null);
    if (success) {
      await fetchNetworks();
    } else {
      alert(`Failed to ${action} adapter ${a.name}`);
    }
  };

  const a = adapters[sel];

  return (
    <PageWrapper>
      <PageHeader eyebrow="Infrastructure" title="Networks" />
      <div className="flex items-center justify-between gap-4 mb-4">
        <ServerSelector value={server} onChange={setServer} />
        <button 
          onClick={fetchNetworks} 
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] text-[12px] text-[var(--text-sub)] transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[var(--amber)]" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="nx-card h-[calc(100vh-220px)] flex flex-col p-3 backdrop-blur-xl border border-[var(--border-dim)] shadow-lg overflow-y-auto">
          {loading && adapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-[var(--text-sub)]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--amber)] mb-4" />
              <p className="text-sm">Scanning adapters...</p>
            </div>
          ) : adapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-[var(--text-sub)]">
              <ShieldAlert className="w-8 h-8 opacity-50 mb-4" />
              <p className="text-sm">No adapters found.</p>
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
                    className={`flex w-full items-start gap-3 rounded-lg p-4 text-left transition-all duration-200 border ${active ? "bg-[var(--amber-low)] border-[var(--amber)]/30 shadow-md transform scale-[1.02]" : "border-transparent hover:bg-[var(--bg-surface)] hover:border-[var(--border-dim)]"}`}
                  >
                    <div className={`p-2 rounded-lg ${active ? "bg-[var(--bg-card)] shadow-sm" : "bg-[var(--bg-surface)]"}`}>
                      <Icon size={18} className={ad.status === "Connected" ? "text-[var(--ok)]" : ad.status === "Disabled" ? "text-[var(--critical)]" : "text-[var(--text-sub)]"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate font-medium text-[13px] ${active ? "text-[var(--amber)]" : "text-[var(--text)]"}`}>{ad.name}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="mono text-[10px] uppercase tracking-wider text-[var(--text-sub)]">{ad.status}</span>
                        <span className="mono text-[10px] text-[var(--text-sub)]">{ad.speedMbps >= 1000 ? `${(ad.speedMbps/1000).toFixed(1)} Gbps` : `${Math.round(ad.speedMbps)} Mbps`}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {a ? (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="nx-card p-6 backdrop-blur-xl border border-[var(--border-dim)] shadow-xl relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 ${a.status === "Connected" ? "bg-gradient-to-r from-[var(--teal)] to-[var(--cyan)]" : a.status === "Disabled" ? "bg-gradient-to-r from-[var(--critical)] to-[var(--rose)]" : "bg-gradient-to-r from-gray-500 to-gray-400"} opacity-75`} />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="eyebrow pb-1 text-[var(--text-sub)]">IPv4 Configuration</div>
                  <h3 className="display pb-1 text-xl font-bold">{a.name}</h3>
                  <div className="text-[12px] text-[var(--text-sub)] mb-2">{a.description}</div>
                  <StatusBadge status={a.status === "Connected" ? "online" : a.status === "Disabled" ? "critical" : "warning"}>{a.status}</StatusBadge>
                </div>
                
                <div className="flex flex-wrap gap-2 justify-end max-w-[200px]">
                  {a.status === "Disabled" ? (
                    <ActionButton action="enable" label="Enable" icon={<Power size={14}/>} loading={actionLoading} onClick={handleAction} variant="ok" />
                  ) : (
                    <ActionButton action="disable" label="Disable" icon={<PowerOff size={14}/>} loading={actionLoading} onClick={handleAction} variant="critical" />
                  )}
                  {a.dhcp && a.status === "Connected" && (
                    <>
                      <ActionButton action="release" label="Release" loading={actionLoading} onClick={handleAction} variant="neutral" />
                      <ActionButton action="renew" label="Renew" loading={actionLoading} onClick={handleAction} variant="neutral" />
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-dim)] shadow-inner">
                <dl className="mono grid grid-cols-[100px_1fr] gap-y-3 text-[12px]">
                  <dt className="text-[var(--text-sub)] uppercase text-[10px] tracking-wider pt-0.5">IP Address</dt>
                  <dd className="text-[var(--amber)] font-bold text-[13px]">{a.ipv4 || "—"}</dd>
                  <dt className="text-[var(--text-sub)] uppercase text-[10px] tracking-wider pt-0.5">Subnet</dt>
                  <dd className="text-[var(--text)]">{a.subnet || "—"}</dd>
                  <dt className="text-[var(--text-sub)] uppercase text-[10px] tracking-wider pt-0.5">Gateway</dt>
                  <dd className="text-[var(--text)]">{a.gateway || "—"}</dd>
                </dl>
                <dl className="mono grid grid-cols-[100px_1fr] gap-y-3 text-[12px]">
                  <dt className="text-[var(--text-sub)] uppercase text-[10px] tracking-wider pt-0.5">DNS</dt>
                  <dd className="text-[var(--text)] break-words">{a.dns.join(", ") || "—"}</dd>
                  <dt className="text-[var(--text-sub)] uppercase text-[10px] tracking-wider pt-0.5">DHCP</dt>
                  <dd className="text-[var(--text)]">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${a.dhcp ? "bg-[var(--teal)]/20 text-[var(--teal)]" : "bg-[var(--border-dim)] text-[var(--text-sub)]"}`}>
                      {a.dhcp ? "Enabled" : "Disabled"}
                    </span>
                  </dd>
                  <dt className="text-[var(--text-sub)] uppercase text-[10px] tracking-wider pt-0.5">MAC</dt>
                  <dd className="text-[var(--text-sub)]">{a.mac || "—"}</dd>
                </dl>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="nx-card p-6 backdrop-blur-xl border border-[var(--border-dim)] shadow-lg">
                <div className="eyebrow pb-4 text-[var(--text-sub)] flex items-center justify-between">
                  <span>Bandwidth Usage</span>
                  <ActivityIndicator active={a.status === "Connected"} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <Stat label="Bytes Received" value={a.bytesIn} color="var(--teal)" />
                  <Stat label="Bytes Sent" value={a.bytesOut} color="var(--amber)" />
                </div>
              </div>
              
              <div className="nx-card p-6 backdrop-blur-xl border border-[var(--border-dim)] shadow-lg">
                <div className="eyebrow pb-4 text-[var(--text-sub)]">IPv6 Configuration</div>
                {a.ipv6 ? (
                  <div className="mono text-[13px] text-[var(--text)] bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-dim)] break-all shadow-inner">
                    {a.ipv6}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-16 text-[var(--text-sub)] text-[12px] italic bg-[var(--bg-surface)] rounded-lg border border-[var(--border-dim)] border-dashed">
                    IPv6 Not Configured
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="nx-card h-[calc(100vh-220px)] flex flex-col items-center justify-center p-6 backdrop-blur-xl border border-[var(--border-dim)] shadow-lg">
            <Network className="w-16 h-16 opacity-10 mb-4" />
            <p className="text-[var(--text-sub)]">Select a network adapter to view details</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const gb = value > 1073741824;
  const valStr = gb ? (value / 1073741824).toFixed(2) : (value / 1048576).toFixed(1);
  const unit = gb ? "GB" : "MB";
  
  return (
    <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-dim)]">
      <div className="eyebrow pb-2 text-[var(--text-sub)]">{label}</div>
      <div className="display text-[24px] font-bold tracking-tight" style={{ color }}>
        {valStr}
        <span className="text-[12px] font-medium text-[var(--text-sub)] ml-1">{unit}</span>
      </div>
    </div>
  );
}

function ActivityIndicator({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {active && (
        <>
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] animate-ping absolute" />
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] relative" />
        </>
      )}
      <span className="text-[10px] uppercase tracking-wider text-[var(--text-sub)]">{active ? 'Live' : 'Offline'}</span>
    </div>
  );
}

interface ActionBtnProps {
  action: string;
  label: string;
  icon?: React.ReactNode;
  loading: string | null;
  onClick: (a: string) => void;
  variant: "ok" | "critical" | "neutral";
}

function ActionButton({ action, label, icon, loading, onClick, variant }: ActionBtnProps) {
  const isL = loading === action;
  
  let colors = "border-[var(--border-c)] text-[var(--text-sub)] hover:border-[var(--text)] hover:text-[var(--text)]";
  if (variant === "ok") colors = "border-[var(--border-dim)] text-[var(--ok)] hover:bg-[var(--ok)]/10 hover:border-[var(--ok)]";
  if (variant === "critical") colors = "border-[var(--border-dim)] text-[var(--critical)] hover:bg-[var(--critical)]/10 hover:border-[var(--critical)]";

  return (
    <button 
      onClick={() => onClick(action)} 
      disabled={loading !== null}
      className={`flex items-center gap-1.5 mono rounded-md border bg-[var(--bg-surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] font-semibold transition-all shadow-sm ${colors} ${loading !== null && !isL ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {isL ? <Loader2 size={12} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}
