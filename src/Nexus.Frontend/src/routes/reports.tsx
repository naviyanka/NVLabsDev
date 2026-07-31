import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { FileText, GitCompare, Activity, Download, Server } from "lucide-react";
import { getApiUrl } from "@/lib/backend";
import { toast } from "sonner";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — NEXUS" }] }),
  component: ReportsPage,
});

type Tab = "patches" | "compare" | "health";

function ReportsPage() {
  const [tab, setTab] = useState<Tab>("health");

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "health", label: "Fleet Health", icon: Activity },
    { id: "patches", label: "Patch Compliance", icon: FileText },
    { id: "compare", label: "Server Compare", icon: GitCompare },
  ];

  return (
    <PageWrapper>
      <PageHeader title="Reports" subtitle="Fleet-wide compliance, health, and comparison reports" />
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-void)] rounded-xl border border-[var(--border-c)] w-fit mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${tab === t.id ? "bg-[var(--bg-card)] text-[var(--text)] shadow-sm border border-[var(--border-c)]" : "text-[var(--text-sub)] hover:text-[var(--text)]"}`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "health" && <HealthReport />}
      {tab === "patches" && <PatchReport />}
      {tab === "compare" && <CompareReport />}
    </PageWrapper>
  );
}

function HealthReport() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(getApiUrl("/reports/health"))
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="nx-skeleton h-64 rounded-2xl" />;
  if (!data) return <p className="text-sm text-[var(--text-sub)]">Failed to load health data.</p>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Servers" value={data.totalServers} />
        <MetricCard label="Online" value={`${data.onlinePercent}%`} sub={`${data.onlineCount} of ${data.totalServers}`} />
        <MetricCard label="Avg CPU" value={`${data.avgCpu}%`} />
        <MetricCard label="Avg RAM" value={`${data.avgMem}%`} />
      </div>

      {/* Worst Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WorstList title="Highest CPU" items={data.worstCpu} unit="%" />
        <WorstList title="Highest RAM" items={data.worstMem} unit="%" />
        <WorstList title="Highest Disk" items={data.worstDisk} unit="%" />
      </div>

      {/* Alerts Chart */}
      {data.alertsByDay && data.alertsByDay.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--text)] mb-4">Alert Frequency (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.alertsByDay}>
              <CartesianGrid stroke="var(--border-dim)" strokeDasharray="2 4" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-sub)" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-sub)" }} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-c)", fontSize: 11 }} />
              <Bar dataKey="count" fill="var(--amber)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function PatchReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(getApiUrl("/reports/patch-compliance"))
      .then(r => r.ok ? r.json() : [])
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const exportCsv = () => {
    const header = "Server,IP,Group,Status,Missing Patches,Compliance %\n";
    const rows = data.map(r => `${r.serverName},${r.serverIp},${r.group},${r.status},${r.missingPatches},${r.compliancePercent}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `patch-compliance-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    toast.success("CSV exported");
  };

  if (loading) return <div className="nx-skeleton h-48 rounded-2xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-sub)]">{data.length} servers scanned</p>
        <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--amber)] hover:border-[var(--amber)] cursor-pointer">
          <Download size={13} /> Export CSV
        </button>
      </div>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-c)]">
              <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase">Server</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase">Group</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase">Missing</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase">Compliance</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i} className="border-b border-[var(--border-c)] last:border-0 hover:bg-[var(--bg-void)]/50">
                <td className="px-4 py-2.5">
                  <div className="font-semibold text-[var(--text)]">{r.serverName}</div>
                  <div className="text-[10px] text-[var(--text-sub)] font-mono">{r.serverIp}</div>
                </td>
                <td className="px-4 py-2.5 text-xs text-[var(--text-sub)]">{r.group || "—"}</td>
                <td className="px-4 py-2.5 text-xs font-bold text-[var(--text)]">{r.missingPatches}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.compliancePercent >= 100 ? "bg-emerald-400/10 text-emerald-400" : r.compliancePercent >= 80 ? "bg-amber-400/10 text-amber-400" : "bg-rose-400/10 text-rose-400"}`}>
                    {r.compliancePercent}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareReport() {
  const [servers, setServers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparison, setComparison] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(getApiUrl("/servers")).then(r => r.ok ? r.json() : []).then(setServers).catch(() => {});
  }, []);

  const runCompare = async () => {
    if (selected.length < 2) { toast.error("Select at least 2 servers"); return; }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/reports/compare?servers=${selected.join(",")}`));
      if (res.ok) setComparison(await res.json());
      else toast.error("Compare failed");
    } catch { toast.error("Network error"); }
    setLoading(false);
  };

  const toggleServer = (ip: string) => {
    setSelected(prev => prev.includes(ip) ? prev.filter(s => s !== ip) : prev.length < 4 ? [...prev, ip] : prev);
  };

  return (
    <div className="space-y-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-4">
        <p className="text-xs font-bold text-[var(--text-sub)] uppercase mb-2">Select servers to compare (2-4)</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {servers.map((s: any) => (
            <button key={s.ip} onClick={() => toggleServer(s.ip)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${selected.includes(s.ip) ? "bg-[var(--amber)]/10 border-[var(--amber)] text-[var(--amber)]" : "border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--text)]"}`}>
              <Server size={12} className="inline mr-1" />{s.name}
            </button>
          ))}
        </div>
        <button onClick={runCompare} disabled={selected.length < 2 || loading}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] cursor-pointer disabled:opacity-50">
          {loading ? "Comparing..." : "Compare Selected"}
        </button>
      </div>

      {comparison.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-c)]">
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase sticky left-0 bg-[var(--bg-surface)]">Property</th>
                {comparison.map(s => (
                  <th key={s.ip} className="px-4 py-3 text-left text-xs font-bold text-[var(--text)]">{s.name}<br /><span className="font-mono text-[var(--text-sub)]">{s.ip}</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderRow("OS", comparison.map(s => s.os))}
              {renderRow("Status", comparison.map(s => s.status))}
              {renderRow("CPU %", comparison.map(s => `${s.cpu}%`))}
              {renderRow("RAM %", comparison.map(s => `${s.mem}%`))}
              {renderRow("Disk %", comparison.map(s => `${s.disk}%`))}
              {renderRow("Uptime", comparison.map(s => s.uptime || "—"))}
              {renderRow("Group", comparison.map(s => s.group || "—"))}
              {renderRow("Roles", comparison.map(s => (s.roles || []).join(", ") || "—"))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function renderRow(label: string, values: string[]) {
  const allSame = values.every(v => v === values[0]);
  return (
    <tr className="border-b border-[var(--border-c)] last:border-0">
      <td className="px-4 py-2 text-xs font-semibold text-[var(--text-sub)] sticky left-0 bg-[var(--bg-surface)]">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`px-4 py-2 text-xs font-mono ${allSame ? "text-[var(--text)]" : "text-amber-400 font-bold"}`}>{v}</td>
      ))}
    </tr>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-4 shadow-sm">
      <p className="text-[10px] font-bold text-[var(--text-sub)] uppercase">{label}</p>
      <p className="text-2xl font-extrabold text-[var(--text)] mt-1">{value}</p>
      {sub && <p className="text-[10px] text-[var(--text-sub)] mt-0.5">{sub}</p>}
    </div>
  );
}

function WorstList({ title, items, unit }: { title: string; items: { name: string; ip: string; value: number }[]; unit: string }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-4 shadow-sm">
      <h4 className="text-xs font-bold text-[var(--text-sub)] uppercase mb-2">{title}</h4>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-[var(--text)] truncate">{item.name}</span>
            <span className={`font-mono font-bold ${item.value > 90 ? "text-rose-400" : item.value > 75 ? "text-amber-400" : "text-emerald-400"}`}>{item.value}{unit}</span>
          </div>
        ))}
        {items.length === 0 && <p className="text-[var(--text-sub)] text-xs">No data</p>}
      </div>
    </div>
  );
}
