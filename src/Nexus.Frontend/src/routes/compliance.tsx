import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Camera, Trash2, Star, GitCompare, Loader2, CheckCircle, XCircle, Server } from "lucide-react";
import { getApiUrl } from "@/lib/backend";
import { toast } from "sonner";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { getServersClient, type Server as ServerType } from "@/api/client";

export const Route = createFileRoute("/compliance")({
  head: () => ({ meta: [{ title: "Compliance — NEXUS" }] }),
  component: CompliancePage,
});

type Tab = "cis" | "snapshots" | "drift";

function CompliancePage() {
  const [tab, setTab] = useState<Tab>("cis");
  const [servers, setServers] = useState<ServerType[]>([]);
  const [selectedIp, setSelectedIp] = useState("");

  useEffect(() => {
    getServersClient().then(d => { setServers(d); if (d.length > 0) setSelectedIp(d[0].ip); });
  }, []);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "cis", label: "CIS Benchmark", icon: ShieldCheck },
    { id: "snapshots", label: "Snapshots", icon: Camera },
    { id: "drift", label: "Drift Detection", icon: GitCompare },
  ];

  return (
    <PageWrapper>
      <PageHeader title="Compliance & Hardening" subtitle="CIS benchmark scoring, configuration snapshots, and drift detection" />

      {/* Server selector */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-xs font-bold text-[var(--text-sub)] uppercase">Target Server:</label>
        <select value={selectedIp} onChange={e => setSelectedIp(e.target.value)}
          className="bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-1.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none">
          {servers.map(s => <option key={s.ip} value={s.ip}>{s.name} ({s.ip})</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-void)] rounded-xl border border-[var(--border-c)] w-fit mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${tab === t.id ? "bg-[var(--bg-card)] text-[var(--text)] shadow-sm border border-[var(--border-c)]" : "text-[var(--text-sub)] hover:text-[var(--text)]"}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "cis" && <CisCheck serverIp={selectedIp} />}
      {tab === "snapshots" && <SnapshotsView serverIp={selectedIp} />}
      {tab === "drift" && <DriftView serverIp={selectedIp} />}
    </PageWrapper>
  );
}

function CisCheck({ serverIp }: { serverIp: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    setLoading(true); setData(null);
    try {
      const res = await fetch(getApiUrl(`/compliance/cis-check?serverIp=${encodeURIComponent(serverIp)}`));
      if (res.ok) setData(await res.json());
      else toast.error("CIS check failed");
    } catch { toast.error("Network error"); }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <button onClick={runCheck} disabled={loading || !serverIp}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] cursor-pointer disabled:opacity-50">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Run CIS Benchmark Check
      </button>

      {data && (
        <div className="space-y-4">
          {/* Score Card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-6 flex items-center gap-6">
            <div className={`text-4xl font-extrabold ${data.score >= 80 ? "text-emerald-400" : data.score >= 50 ? "text-amber-400" : "text-rose-400"}`}>{data.score}%</div>
            <div>
              <p className="text-sm font-bold text-[var(--text)]">CIS Compliance Score</p>
              <p className="text-xs text-[var(--text-sub)]">{data.passed} of {data.total} checks passed</p>
            </div>
          </div>

          {/* Checks List */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-[var(--border-c)]"><th className="px-4 py-2 text-left text-[var(--text-sub)]">ID</th><th className="px-4 py-2 text-left text-[var(--text-sub)]">Check</th><th className="px-4 py-2 text-left text-[var(--text-sub)]">Category</th><th className="px-4 py-2 text-left text-[var(--text-sub)]">Result</th></tr></thead>
              <tbody>{data.checks.map((c: any) => (
                <tr key={c.id} className="border-b border-[var(--border-c)] last:border-0">
                  <td className="px-4 py-2 font-mono text-[var(--amber)]">{c.id}</td>
                  <td className="px-4 py-2 text-[var(--text)]">{c.name}</td>
                  <td className="px-4 py-2 text-[var(--text-sub)]">{c.category}</td>
                  <td className="px-4 py-2">{c.status === "pass" ? <span className="flex items-center gap-1 text-emerald-400 font-bold"><CheckCircle size={12} /> Pass</span> : <span className="flex items-center gap-1 text-rose-400 font-bold"><XCircle size={12} /> Fail</span>}</td>
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
  const [loading, setLoading] = useState(false);
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
              <div className="grid grid-cols-2 gap-3 text-[10px] font-mono max-h-32 overflow-y-auto">
                <div><p className="text-emerald-400 font-bold mb-1">Baseline</p><pre className="text-[var(--text-sub)] whitespace-pre-wrap">{d.baseline?.slice(0, 500)}</pre></div>
                <div><p className="text-rose-400 font-bold mb-1">Current</p><pre className="text-[var(--text-sub)] whitespace-pre-wrap">{d.current?.slice(0, 500)}</pre></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
