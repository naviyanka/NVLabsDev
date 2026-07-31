import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Play, Plus, Trash2, Clock, CheckCircle, XCircle, Loader2, Power, PowerOff, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { getApiUrl } from "@/lib/backend";
import { toast } from "sonner";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { NxCard } from "@/components/ui/NxCard";

export const Route = createFileRoute("/runbooks")({
  head: () => ({
    meta: [
      { title: "Runbooks — NEXUS" },
      { name: "description", content: "Scheduled PowerShell automation runbooks." },
    ],
  }),
  component: RunbooksPage,
});

interface Runbook {
  id: string;
  name: string;
  description: string;
  script: string;
  cronExpression: string;
  targetServers: string;
  enabled: boolean;
  lastRunAt: string | null;
  lastRunStatus: string;
  lastRunOutput: string;
  createdAt: string;
  createdBy: string;
}

interface Execution {
  id: number;
  runbookId: string;
  runbookName: string;
  serverIp: string;
  startedAt: string;
  completedAt: string | null;
  exitCode: number;
  output: string;
  status: string;
}

function RunbooksPage() {
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [executions, setExecutions] = useState<Record<string, Execution[]>>({});
  const [running, setRunning] = useState<Set<string>>(new Set());

  const fetchRunbooks = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/runbooks"));
      if (res.ok) {
        const data = await res.json();
        setRunbooks(data);
      }
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRunbooks(); }, [fetchRunbooks]);

  const fetchExecutions = async (id: string) => {
    try {
      const res = await fetch(getApiUrl(`/runbooks/${id}/executions`));
      if (res.ok) {
        const data = await res.json();
        setExecutions(prev => ({ ...prev, [id]: data }));
      }
    } catch { /* */ }
  };

  const handleToggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchExecutions(id);
    }
  };

  const handleRunNow = async (id: string) => {
    setRunning(prev => new Set(prev).add(id));
    try {
      const res = await fetch(getApiUrl(`/runbooks/${id}/run`), { method: "POST" });
      if (res.ok) {
        toast.success("Runbook executed successfully");
        fetchRunbooks();
        fetchExecutions(id);
      } else {
        toast.error("Runbook execution failed");
      }
    } catch {
      toast.error("Network error");
    }
    setRunning(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this runbook and all its execution history?")) return;
    try {
      const res = await fetch(getApiUrl(`/runbooks/${id}`), { method: "DELETE" });
      if (res.ok) {
        toast.success("Runbook deleted");
        fetchRunbooks();
      }
    } catch { toast.error("Failed to delete"); }
  };

  const handleToggleEnabled = async (runbook: Runbook) => {
    try {
      await fetch(getApiUrl(`/runbooks/${runbook.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...runbook, enabled: !runbook.enabled }),
      });
      fetchRunbooks();
    } catch { toast.error("Failed to update"); }
  };

  const statusBadge = (status: string) => {
    if (status === "Success") return <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold"><CheckCircle size={12} /> Success</span>;
    if (status === "Failed") return <span className="flex items-center gap-1 text-rose-400 text-xs font-bold"><XCircle size={12} /> Failed</span>;
    if (status === "Running") return <span className="flex items-center gap-1 text-amber-400 text-xs font-bold"><Loader2 size={12} className="animate-spin" /> Running</span>;
    return <span className="text-xs text-[var(--text-sub)]">Never run</span>;
  };

  return (
    <PageWrapper>
      <PageHeader title="Runbooks" subtitle="Scheduled PowerShell automation for your fleet" />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[var(--text-sub)]">{runbooks.length} runbook{runbooks.length !== 1 ? "s" : ""} configured</p>
        <button
          onClick={() => { setEditId(null); setShowCreate(true); }}
          className="flex items-center gap-2 bg-[var(--amber)] text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-[var(--amber-hover)] transition-colors cursor-pointer"
        >
          <Plus size={14} /> New Runbook
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="nx-skeleton h-20 rounded-2xl" />)}
        </div>
      ) : runbooks.length === 0 ? (
        <NxCard eyebrow="Empty" title="No runbooks yet">
          <p className="text-sm text-[var(--text-sub)]">Create your first runbook to automate recurring tasks across your servers.</p>
        </NxCard>
      ) : (
        <div className="space-y-3">
          {runbooks.map(rb => (
            <div key={rb.id} className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <button onClick={() => handleToggleEnabled(rb)} className="cursor-pointer" title={rb.enabled ? "Disable" : "Enable"}>
                    {rb.enabled ? <Power size={16} className="text-emerald-400" /> : <PowerOff size={16} className="text-[var(--text-sub)]" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[var(--text)] truncate">{rb.name}</h3>
                      {statusBadge(rb.lastRunStatus)}
                    </div>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5 truncate">
                      {rb.description || rb.cronExpression || "No schedule"}
                      {rb.cronExpression && <span className="ml-2 font-mono text-[var(--amber)]">[{rb.cronExpression}]</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {rb.lastRunAt && (
                    <span className="text-[10px] text-[var(--text-sub)] font-mono">
                      Last: {new Date(rb.lastRunAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  <button
                    onClick={() => handleRunNow(rb.id)}
                    disabled={running.has(rb.id)}
                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer disabled:opacity-50"
                    title="Run Now"
                  >
                    {running.has(rb.id) ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  </button>
                  <button
                    onClick={() => { setEditId(rb.id); setShowCreate(true); }}
                    className="p-1.5 rounded-lg bg-[var(--bg-void)] text-[var(--text-sub)] hover:text-[var(--text)] cursor-pointer"
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(rb.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => handleToggleExpand(rb.id)}
                    className="p-1.5 rounded-lg bg-[var(--bg-void)] text-[var(--text-sub)] hover:text-[var(--text)] cursor-pointer"
                    title="Execution History"
                  >
                    {expandedId === rb.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Execution History Drawer */}
              {expandedId === rb.id && (
                <div className="border-t border-[var(--border-c)] bg-[var(--bg-void)] p-4 max-h-64 overflow-y-auto">
                  <h4 className="text-xs font-bold text-[var(--text-sub)] uppercase mb-2 flex items-center gap-1">
                    <Clock size={12} /> Recent Executions
                  </h4>
                  {!executions[rb.id] || executions[rb.id].length === 0 ? (
                    <p className="text-xs text-[var(--text-sub)]">No executions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {executions[rb.id].map(ex => (
                        <div key={ex.id} className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl p-3 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[var(--text-sub)]">{ex.serverIp}</span>
                            <div className="flex items-center gap-2">
                              {statusBadge(ex.status)}
                              <span className="text-[var(--text-sub)] font-mono">exit:{ex.exitCode}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[var(--text-sub)]">
                            <span>{new Date(ex.startedAt).toLocaleString()}</span>
                            {ex.completedAt && (
                              <span className="text-[var(--amber)]">
                                ({Math.round((new Date(ex.completedAt).getTime() - new Date(ex.startedAt).getTime()) / 1000)}s)
                              </span>
                            )}
                          </div>
                          {ex.output && (
                            <pre className="mt-2 p-2 bg-black/30 rounded-lg text-[10px] text-[var(--text-sub)] overflow-x-auto max-h-24 whitespace-pre-wrap">{ex.output.slice(0, 1000)}</pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <RunbookModal
          editId={editId}
          runbooks={runbooks}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); fetchRunbooks(); }}
        />
      )}
    </PageWrapper>
  );
}

function RunbookModal({ editId, runbooks, onClose, onSaved }: { editId: string | null; runbooks: Runbook[]; onClose: () => void; onSaved: () => void }) {
  const existing = editId ? runbooks.find(r => r.id === editId) : null;
  const [name, setName] = useState(existing?.name || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [script, setScript] = useState(existing?.script || "");
  const [cron, setCron] = useState(existing?.cronExpression || "");
  const [targets, setTargets] = useState(existing?.targetServers || "*");
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !script.trim()) {
      toast.error("Name and script are required");
      return;
    }
    setSaving(true);
    try {
      const body = { name, description, script, cronExpression: cron, targetServers: targets, enabled };
      const url = editId ? getApiUrl(`/runbooks/${editId}`) : getApiUrl("/runbooks");
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        toast.success(editId ? "Runbook updated" : "Runbook created");
        onSaved();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "Failed to save runbook");
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--text)]">{editId ? "Edit Runbook" : "Create Runbook"}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Disk Cleanup Weekly"
              className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase mb-1">Cron Schedule (UTC)</label>
            <input value={cron} onChange={e => setCron(e.target.value)} placeholder="0 2 * * 0 (Sun 2AM)"
              className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-sm text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase mb-1">Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description..."
            className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase mb-1">Target Servers (comma-separated IPs, or * for all)</label>
          <input value={targets} onChange={e => setTargets(e.target.value)} placeholder="192.168.1.10, 192.168.1.20 or *"
            className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-sm text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase mb-1">PowerShell Script</label>
          <textarea value={script} onChange={e => setScript(e.target.value)} rows={10}
            placeholder="Get-ChildItem C:\Temp | Remove-Item -Recurse -Force"
            className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-sm text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none resize-y" />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="rounded" />
            Enabled (schedule active)
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-c)]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)] border border-[var(--border-c)] cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] cursor-pointer disabled:opacity-50">
            {saving ? "Saving..." : (editId ? "Update" : "Create")}
          </button>
        </div>
      </div>
    </div>
  );
}
