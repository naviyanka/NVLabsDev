import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Globe, RefreshCw, Play, Square, Loader2 } from "lucide-react";
import { getApiUrl } from "@/lib/backend";
import { toast } from "sonner";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/iis")({
  head: () => ({ meta: [{ title: "IIS Manager — NEXUS" }] }),
  component: IisPage,
});

function IisPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [sitesRes, poolsRes] = await Promise.all([
        fetch(getApiUrl("/iis/sites")),
        fetch(getApiUrl("/iis/app-pools")),
      ]);
      if (sitesRes.ok) { const d = await sitesRes.json(); setSites(Array.isArray(d) ? d : [d].filter(Boolean)); }
      if (poolsRes.ok) { const d = await poolsRes.json(); setPools(Array.isArray(d) ? d : [d].filter(Boolean)); }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const recyclePool = async (name: string) => {
    setActionLoading(name);
    const res = await fetch(getApiUrl(`/iis/app-pools/${encodeURIComponent(name)}/recycle`), { method: "POST" });
    if (res.ok) toast.success(`App pool '${name}' recycled`); else toast.error("Failed to recycle");
    setActionLoading(null); fetchData();
  };

  const controlSite = async (name: string, action: "start" | "stop") => {
    setActionLoading(name);
    const res = await fetch(getApiUrl(`/iis/sites/${encodeURIComponent(name)}/${action}`), { method: "POST" });
    if (res.ok) toast.success(`Site '${name}' ${action}ed`); else toast.error(`Failed to ${action}`);
    setActionLoading(null); fetchData();
  };

  const stateColor = (state: string) => {
    const s = (state || "").toLowerCase();
    if (s === "started") return "text-emerald-400";
    if (s === "stopped") return "text-rose-400";
    return "text-amber-400";
  };

  return (
    <PageWrapper>
      <PageHeader title="IIS Manager" subtitle="Manage web sites and application pools" />
      {loading ? <div className="nx-skeleton h-48 rounded-2xl" /> : (
        <div className="space-y-6">
          {/* Sites */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-c)]">
              <h3 className="text-sm font-bold text-[var(--text)]">Web Sites ({sites.length})</h3>
              <button onClick={fetchData} className="text-[var(--text-sub)] hover:text-[var(--text)] cursor-pointer"><RefreshCw size={14} /></button>
            </div>
            {sites.length === 0 ? <p className="p-4 text-xs text-[var(--text-sub)]">No IIS sites found</p> : (
              <table className="w-full text-xs">
                <thead><tr className="border-b border-[var(--border-c)]"><th className="px-4 py-2 text-left text-[var(--text-sub)]">Name</th><th className="px-4 py-2 text-left text-[var(--text-sub)]">State</th><th className="px-4 py-2 text-left text-[var(--text-sub)]">Bindings</th><th className="px-4 py-2 text-left text-[var(--text-sub)]">App Pool</th><th className="px-4 py-2"></th></tr></thead>
                <tbody>{sites.map((s: any, i) => {
                  const name = s.name ?? s.Name ?? "";
                  const state = s.state ?? s.State ?? "";
                  return (
                    <tr key={i} className="border-b border-[var(--border-c)] last:border-0 hover:bg-[var(--bg-void)]/50">
                      <td className="px-4 py-2 font-semibold text-[var(--text)]">{name}</td>
                      <td className={`px-4 py-2 font-bold ${stateColor(state)}`}>{state}</td>
                      <td className="px-4 py-2 text-[var(--text-sub)] font-mono">{s.bindings ?? s.Bindings ?? ""}</td>
                      <td className="px-4 py-2 text-[var(--text-sub)]">{s.applicationPool ?? s.ApplicationPool ?? ""}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {state.toLowerCase() !== "started" && <button onClick={() => controlSite(name, "start")} className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10 cursor-pointer" title="Start"><Play size={12} /></button>}
                          {state.toLowerCase() === "started" && <button onClick={() => controlSite(name, "stop")} className="p-1 rounded text-rose-400 hover:bg-rose-400/10 cursor-pointer" title="Stop"><Square size={12} /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )}
          </div>

          {/* App Pools */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-c)]">
              <h3 className="text-sm font-bold text-[var(--text)]">Application Pools ({pools.length})</h3>
            </div>
            {pools.length === 0 ? <p className="p-4 text-xs text-[var(--text-sub)]">No app pools found</p> : (
              <table className="w-full text-xs">
                <thead><tr className="border-b border-[var(--border-c)]"><th className="px-4 py-2 text-left text-[var(--text-sub)]">Name</th><th className="px-4 py-2 text-left text-[var(--text-sub)]">State</th><th className="px-4 py-2 text-left text-[var(--text-sub)]">.NET Version</th><th className="px-4 py-2"></th></tr></thead>
                <tbody>{pools.map((p: any, i) => {
                  const name = p.name ?? p.Name ?? "";
                  const state = p.state ?? p.State ?? "";
                  return (
                    <tr key={i} className="border-b border-[var(--border-c)] last:border-0 hover:bg-[var(--bg-void)]/50">
                      <td className="px-4 py-2 font-semibold text-[var(--text)]">{name}</td>
                      <td className={`px-4 py-2 font-bold ${stateColor(state)}`}>{state}</td>
                      <td className="px-4 py-2 text-[var(--text-sub)]">{p.managedRuntimeVersion ?? p.ManagedRuntimeVersion ?? "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => recyclePool(name)} disabled={actionLoading === name} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 cursor-pointer disabled:opacity-50">
                          {actionLoading === name ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />} Recycle
                        </button>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
