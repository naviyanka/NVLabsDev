import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Camera, Trash2, Star, GitCompare, Loader2, CheckCircle, XCircle, Download, Wrench, BarChart3 } from "lucide-react";
import { getApiUrl } from "@/lib/backend";
import { toast } from "sonner";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { getServersClient, type Server as ServerType } from "@/api/client";

export const Route = createFileRoute("/compliance")({
  head: () => ({ meta: [{ title: "Compliance — NEXUS" }] }),
  component: CompliancePage,
});

type Tab = "fleet" | "cis" | "snapshots" | "drift";

function CompliancePage() {
  const [tab, setTab] = useState<Tab>("fleet");
  const [servers, setServers] = useState<ServerType[]>([]);
  const [selectedIp, setSelectedIp] = useState("");

  useEffect(() => {
    getServersClient().then(d => { setServers(d); if (d.length > 0) setSelectedIp(d[0].ip); });
  }, []);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "fleet", label: "Fleet Overview", icon: BarChart3 },
    { id: "cis", label: "CIS Benchmark", icon: ShieldCheck },
    { id: "snapshots", label: "Snapshots", icon: Camera },
    { id: "drift", label: "Drift Detection", icon: GitCompare },
  ];

  return (
    <PageWrapper>
      <PageHeader title="Compliance & Hardening" subtitle="CIS benchmark scoring, configuration snapshots, drift detection, and fleet compliance overview" />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-void)] rounded-xl border border-[var(--border-c)] w-fit mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${tab === t.id ? "bg-[var(--bg-card)] text-[var(--text)] shadow-sm border border-[var(--border-c)]" : "text-[var(--text-sub)] hover:text-[var(--text)]"}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Server selector (not for fleet tab) */}
      {tab !== "fleet" && (
        <div className="flex items-center gap-3 mb-4">
          <label className="text-xs font-bold text-[var(--text-sub)] uppercase">Target Server:</label>
          <select value={selectedIp} onChange={e => setSelectedIp(e.target.value)}
            className="bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-1.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none">
            {servers.map(s => <option key={s.ip} value={s.ip}>{s.name} ({s.ip})</option>)}
          </select>
        </div>
      )}

      {tab === "fleet" && <FleetOverview />}
      {tab === "cis" && <CisCheck serverIp={selectedIp} />}
      {tab === "snapshots" && <SnapshotsView serverIp={selectedIp} />}
      {tab === "drift" && <DriftView serverIp={selectedIp} />}
    </PageWrapper>
  );
}

function FleetOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(getApiUrl("/compliance/fleet-score"))
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const exportCsv = () => {
    if (!data?.servers) return;
    const header = "Server,IP,Score %,Passed,Total\n";
    const rows = data.servers.map((s: any) => `${s.serverName},${s.serverIp},${s.score},${s.passed},${s.total}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `compliance-fleet-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    toast.success("CSV exported");
  };

  if (loading) return <div className="nx-skeleton h-48 rounded-2xl" />;
  if (!data) return <p className="text-sm text-[var(--text-sub)]">Failed to load fleet compliance data. Ensure servers are online.</p>;

  const scoreColor = (score: number) => score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-rose-400";
  const scoreBg = (score: number) => score >= 80 ? "bg-emerald-400" : score >= 50 ? "bg-amber-400" : "bg-rose-400";

  return (
    <div className="space-y-6">
      {/* Fleet Average */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className={`text-5xl font-extrabold ${scoreColor(data.fleetAverageScore)}`}>{data.fleetAverageScore}%</div>
          <div>
            <p className="text-sm font-bold text-[var(--text)]">Fleet Average CIS Compliance</p>
            <p className="text-xs text-[var(--text-sub)]">{data.serverCount} servers evaluated · 20 checks per server</p>
          </div>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--amber)] hover:border-[var(--amber)] cursor-pointer">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Per-Server Scores */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-c)]">
              <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase">Server</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase">Score</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase">Passed</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase">Progress</th>
            </tr>
          </thead>
          <tbody>
            {data.servers.map((s: any) => (
              <tr key={s.serverIp} className="border-b border-[var(--border-c)] last:border-0 hover:bg-[var(--bg-void)]/50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-[var(--text)]">{s.serverName}</div>
                  <div className="text-[10px] text-[var(--text-sub)] font-mono">{s.serverIp}</div>
                </td>
                <td className={`px-4 py-3 text-lg font-extrabold ${scoreColor(s.score)}`}>{s.score}%</td>
                <td className="px-4 py-3 text-xs text-[var(--text-sub)]">{s.passed} / {s.total}</td>
                <td className="px-4 py-3">
                  <div className="w-32 h-2.5 bg-[var(--bg-void)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${scoreBg(s.score)}`} style={{ width: `${s.score}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CisCheck({ serverIp }: { serverIp: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [remediating, setRemediating] = useState<string | null>(null);

  const runCheck = async () => {
    setLoading(true); setData(null);
    try {
      const res = await fetch(getApiUrl(`/compliance/cis-check?serverIp=${encodeURIComponent(serverIp)}`));
      if (res.ok) setData(await res.json());
      else toast.error("CIS check failed");
    } catch { toast.error("Network error"); }
    setLoading(false);
  };

  const remediate = async (checkId: string) => {
    if (!confirm(`Apply remediation for ${checkId} on ${serverIp}? This will modify system configuration.`)) return;
    setRemediating(checkId);
    try {
      const res = await fetch(getApiUrl("/compliance/remediate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkId, serverIp }),
      });
      if (res.ok) { toast.success(`Remediation applied for ${checkId}`); runCheck(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.message || "Remediation failed"); }
    } catch { toast.error("Network error"); }
    setRemediating(null);
  };

  const exportCsv = () => {
    if (!data?.checks) return;
    const header = "ID,Check,Category,Result,Remediable\n";
    const rows = data.checks.map((c: any) => `${c.id},${c.name},${c.category},${c.status},${c.remediable}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `cis-check-${serverIp}-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={runCheck} disabled={loading || !serverIp}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] cursor-pointer disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Run CIS Benchmark (20 Checks)
        </button>
        {data && (
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--amber)] cursor-pointer">
            <Download size={13} /> Export CSV
          </button>
        )}
      </div>

      {data && (
        <div className="space-y-4">
          {/* Score Card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-6 flex items-center gap-6">
            <div className={`text-4xl font-extrabold ${data.score >= 80 ? "text-emerald-400" : data.score >= 50 ? "text-amber-400" : "text-rose-400"}`}>{data.score}%</div>
            <div>
              <p className="text-sm font-bold text-[var(--text)]">CIS Compliance Score</p>
              <p className="text-xs text-[var(--text-sub)]">{data.passed} of {data.total} checks passed · {data.total - data.passed} require attention</p>
            </div>
          </div>

          {/* Checks Table */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-[var(--border-c)]">
                <th className="px-4 py-2 text-left text-[var(--text-sub)]">ID</th>
                <th className="px-4 py-2 text-left text-[var(--text-sub)]">Check</th>
                <th className="px-4 py-2 text-left text-[var(--text-sub)]">Category</th>
                <th className="px-4 py-2 text-left text-[var(--text-sub)]">Result</th>
                <th className="px-4 py-2"></th>
              </tr></thead>
              <tbody>{data.checks.map((c: any) => (
                <tr key={c.id} className="border-b border-[var(--border-c)] last:border-0 hover:bg-[var(--bg-void)]/50">
                  <td className="px-4 py-2 font-mono text-[var(--amber)]">{c.id}</td>
                  <td className="px-4 py-2 text-[var(--text)]">{c.name}</td>
                  <td className="px-4 py-2 text-[var(--text-sub)]">{c.category}</td>
                  <td className="px-4 py-2">{c.status === "pass" ? <span className="flex items-center gap-1 text-emerald-400 font-bold"><CheckCircle size={12} /> Pass</span> : <span className="flex items-center gap-1 text-rose-400 font-bold"><XCircle size={12} /> Fail</span>}</td>
                  <td className="px-4 py-2 text-right">
                    {c.status === "fail" && c.remediable && (
                      <button onClick={() => remediate(c.id)} disabled={remediating === c.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer disabled:opacity-50">
                        {remediating === c.id ? <Loader2 size={10} className="animate-spin" /> : <Wrench size={10} />} Fix
                      </button>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SnapshotsView({ serverIp }: { serverIp: string }) {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [capturing, setCapturing] = useState(false);

  const fetchSnapshots = async () => {
    const res = await fetch(getApiUrl(`/compliance/snapshots?serverIp=${encodeURIComponent(serverIp)}`));
    if (res.ok) setSnapshots(await res.json());
  };

  useEffect(() => { if (serverIp) fetchSnapshots(); }, [serverIp]);

  const capture = async () => {
    setCapturing(true);
    try {
      const res = await fetch(getApiUrl(`/compliance/snapshots/capture?serverIp=${encodeURIComponent(serverIp)}`), { method: "POST" });
      if (res.ok) { toast.success("Snapshot captured"); fetchSnapshots(); }
      else toast.error("Capture failed");
    } catch { toast.error("Network error"); }
    setCapturing(false);
  };

  const setBaseline = async (id: number) => {
    const res = await fetch(getApiUrl(`/compliance/snapshots/${id}/set-baseline`), { method: "POST" });
    if (res.ok) { toast.success("Baseline set"); fetchSnapshots(); }
  };

  const deleteSnap = async (id: number) => {
    if (!confirm("Delete this snapshot?")) return;
    await fetch(getApiUrl(`/compliance/snapshots/${id}`), { method: "DELETE" });
    fetchSnapshots();
  };

  return (
    <div className="space-y-4">
      <button onClick={capture} disabled={capturing || !serverIp}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black cursor-pointer disabled:opacity-50">
        {capturing ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />} Capture Snapshot Now
      </button>

      {snapshots.length === 0 ? <p className="text-xs text-[var(--text-sub)]">No snapshots yet. Capture one to start tracking configuration.</p> : (
        <div className="space-y-2">
          {snapshots.map((s: any) => (
            <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl border ${s.isBaseline ? "border-emerald-400/30 bg-emerald-400/5" : "border-[var(--border-c)] bg-[var(--bg-surface)]"}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--text)]">{s.serverName}</span>
                  {s.isBaseline && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/30">BASELINE</span>}
                </div>
                <span className="text-[10px] text-[var(--text-sub)] font-mono">{new Date(s.capturedAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                {!s.isBaseline && <button onClick={() => setBaseline(s.id)} className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-400/10 cursor-pointer" title="Set as Baseline"><Star size={14} /></button>}
                <button onClick={() => deleteSnap(s.id)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-400/10 cursor-pointer" title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DriftView({ serverIp }: { serverIp: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkDrift = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/compliance/drift?serverIp=${encodeURIComponent(serverIp)}`));
      if (res.ok) setData(await res.json());
    } catch { toast.error("Network error"); }
    setLoading(false);
  };

  useEffect(() => { if (serverIp) checkDrift(); }, [serverIp]);

  return (
    <div className="space-y-4">
      <button onClick={checkDrift} disabled={loading || !serverIp}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-c)] text-[var(--text)] hover:border-[var(--amber)] cursor-pointer disabled:opacity-50">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <GitCompare size={14} />} Check for Drift
      </button>

      {data && !data.hasDrift && <p className="text-sm text-emerald-400 font-semibold">{data.message || "No configuration drift detected."}</p>}

      {data && data.hasDrift && (
        <div className="space-y-3">
          <div className="bg-rose-400/10 border border-rose-400/30 rounded-2xl p-4">
            <p className="text-sm font-bold text-rose-400">{data.driftCount} configuration drift(s) detected</p>
            <p className="text-xs text-[var(--text-sub)]">Baseline: {new Date(data.baselineDate).toLocaleString()} vs Latest: {new Date(data.latestDate).toLocaleString()}</p>
          </div>
          {data.drifts.map((d: any, i: number) => (
            <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-4">
              <h4 className="text-xs font-bold text-[var(--amber)] uppercase mb-2">{d.category} — Changed</h4>
              <div className="grid grid-cols-2 gap-3 text-[10px] font-mono max-h-40 overflow-y-auto">
                <div><p className="text-emerald-400 font-bold mb-1">Baseline</p><pre className="text-[var(--text-sub)] whitespace-pre-wrap">{d.baseline?.slice(0, 800)}</pre></div>
                <div><p className="text-rose-400 font-bold mb-1">Current</p><pre className="text-[var(--text-sub)] whitespace-pre-wrap">{d.current?.slice(0, 800)}</pre></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
