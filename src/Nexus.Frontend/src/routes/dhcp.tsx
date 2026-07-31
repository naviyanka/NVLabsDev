import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wifi, ChevronDown, ChevronUp } from "lucide-react";
import { getApiUrl } from "@/lib/backend";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/dhcp")({
  head: () => ({ meta: [{ title: "DHCP Monitor — NEXUS" }] }),
  component: DhcpPage,
});

function DhcpPage() {
  const [scopes, setScopes] = useState<any[]>([]);
  const [expandedScope, setExpandedScope] = useState<string | null>(null);
  const [leases, setLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(getApiUrl("/dhcp/scopes"))
      .then(r => r.ok ? r.json() : [])
      .then(d => setScopes(Array.isArray(d) ? d : [d].filter(Boolean)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleScope = async (scopeId: string) => {
    if (expandedScope === scopeId) { setExpandedScope(null); return; }
    setExpandedScope(scopeId);
    try {
      const res = await fetch(getApiUrl(`/dhcp/scopes/${encodeURIComponent(scopeId)}/leases`));
      if (res.ok) { const d = await res.json(); setLeases(Array.isArray(d) ? d : [d].filter(Boolean)); }
    } catch { setLeases([]); }
  };

  const utilizationColor = (pct: number) => pct > 90 ? "text-rose-400 bg-rose-400" : pct > 70 ? "text-amber-400 bg-amber-400" : "text-emerald-400 bg-emerald-400";

  return (
    <PageWrapper>
      <PageHeader title="DHCP Monitor" subtitle="View DHCP scope utilization and active leases" />
      {loading ? <div className="nx-skeleton h-48 rounded-2xl" /> : scopes.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-8 text-center">
          <Wifi size={32} className="mx-auto mb-3 text-[var(--text-sub)]" />
          <p className="text-sm text-[var(--text-sub)]">No DHCP scopes found. Ensure the DHCP Server role is installed and the DhcpServer PowerShell module is available.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scopes.map((s: any) => {
            const pct = s.percentInUse ?? s.PercentInUse ?? 0;
            const scopeId = s.scopeId ?? s.ScopeId ?? "";
            return (
              <div key={scopeId} className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl overflow-hidden">
                <button onClick={() => toggleScope(scopeId)} className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--bg-void)]/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Wifi size={16} className={utilizationColor(pct).split(" ")[0]} />
                    <div className="text-left">
                      <div className="text-sm font-bold text-[var(--text)]">{s.name ?? s.Name ?? scopeId}</div>
                      <div className="text-[10px] text-[var(--text-sub)] font-mono">{s.startRange ?? s.StartRange} — {s.endRange ?? s.EndRange}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-[var(--text-sub)]">In Use: {s.inUse ?? s.InUse ?? 0} | Free: {s.free ?? s.Free ?? 0}</div>
                      <div className="w-32 h-2 bg-[var(--bg-void)] rounded-full mt-1 overflow-hidden">
                        <div className={`h-full rounded-full ${utilizationColor(pct).split(" ")[1]}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${utilizationColor(pct).split(" ")[0]}`}>{pct}%</span>
                    {expandedScope === scopeId ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>
                {expandedScope === scopeId && (
                  <div className="border-t border-[var(--border-c)] bg-[var(--bg-void)] p-4 max-h-64 overflow-y-auto">
                    {leases.length === 0 ? <p className="text-xs text-[var(--text-sub)]">No active leases</p> : (
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-[var(--border-c)]"><th className="px-2 py-1 text-left text-[var(--text-sub)]">IP</th><th className="px-2 py-1 text-left text-[var(--text-sub)]">MAC</th><th className="px-2 py-1 text-left text-[var(--text-sub)]">Hostname</th><th className="px-2 py-1 text-left text-[var(--text-sub)]">State</th></tr></thead>
                        <tbody>{leases.map((l: any, i) => (
                          <tr key={i} className="border-b border-[var(--border-c)] last:border-0">
                            <td className="px-2 py-1 font-mono text-[var(--text)]">{l.ipAddress ?? l.IPAddress ?? ""}</td>
                            <td className="px-2 py-1 font-mono text-[var(--text-sub)]">{l.clientId ?? l.ClientId ?? ""}</td>
                            <td className="px-2 py-1 text-[var(--text)]">{l.hostName ?? l.HostName ?? ""}</td>
                            <td className="px-2 py-1 text-[var(--text-sub)]">{l.addressState ?? l.AddressState ?? ""}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
