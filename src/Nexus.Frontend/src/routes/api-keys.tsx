import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Key, Plus, Trash2, Copy, Check, ShieldAlert, Clock, Power, PowerOff } from "lucide-react";
import { getApiUrl } from "@/lib/backend";
import { toast } from "sonner";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/api-keys")({
  head: () => ({ meta: [{ title: "API Keys — NEXUS" }] }),
  component: ApiKeysPage,
});

interface ApiKeyEntry {
  id: string;
  name: string;
  prefix: string;
  role: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  Viewer: "text-sky-400",
  Operator: "text-amber-400",
  Admin: "text-emerald-400",
  SuperAdmin: "text-rose-400",
};

function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/keys"));
      if (res.ok) setKeys(await res.json());
      else if (res.status === 403) toast.error("Admin role required to manage API keys.");
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Revoke API key "${name}"?`)) return;
    const res = await fetch(getApiUrl(`/keys/${id}`), { method: "DELETE" });
    if (res.ok) { toast.success("Key revoked"); fetchKeys(); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete key "${name}"? This cannot be undone.`)) return;
    const res = await fetch(getApiUrl(`/keys/${id}/permanent`), { method: "DELETE" });
    if (res.ok) { toast.success("Key deleted"); fetchKeys(); }
  };

  const copyKey = () => {
    if (newKey) { navigator.clipboard.writeText(newKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <PageWrapper>
      <PageHeader title="API Keys" subtitle="Manage API keys for external automation (Ansible, Terraform, CI/CD)" />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[var(--text-sub)]">{keys.length} key{keys.length !== 1 ? "s" : ""} configured</p>
        <button onClick={() => { setShowCreate(true); setNewKey(null); }}
          className="flex items-center gap-2 bg-[var(--amber)] text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-[var(--amber-hover)] cursor-pointer">
          <Plus size={14} /> Generate Key
        </button>
      </div>

      {/* Show newly generated key */}
      {newKey && (
        <div className="mb-6 bg-emerald-400/10 border border-emerald-400/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={16} className="text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">New API Key Generated — Copy Now!</span>
          </div>
          <p className="text-xs text-[var(--text-sub)] mb-2">This key will not be shown again. Store it securely.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-black/30 rounded-lg px-3 py-2 text-xs font-mono text-[var(--text)] select-all">{newKey}</code>
            <button onClick={copyKey} className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 cursor-pointer">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="nx-skeleton h-16 rounded-2xl" />)}</div>
      ) : keys.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-8 text-center">
          <Key size={32} className="mx-auto mb-3 text-[var(--text-sub)]" />
          <p className="text-sm text-[var(--text-sub)]">No API keys yet. Generate one for CI/CD or automation tools.</p>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-c)]">
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase">Key Prefix</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase">Last Used</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase">Expires</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-sub)] uppercase">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} className="border-b border-[var(--border-c)] last:border-0 hover:bg-[var(--bg-void)]/50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[var(--text)]">{k.name}</div>
                    <div className="text-[10px] text-[var(--text-sub)]">by {k.createdBy} · {new Date(k.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-sub)]">{k.prefix}</td>
                  <td className={`px-4 py-3 text-xs font-bold ${ROLE_COLORS[k.role] || "text-[var(--text)]"}`}>{k.role}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-sub)] font-mono">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-sub)]">
                    {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    {k.isActive
                      ? <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold"><Power size={10} /> Active</span>
                      : <span className="flex items-center gap-1 text-rose-400 text-xs font-bold"><PowerOff size={10} /> Revoked</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {k.isActive && (
                        <button onClick={() => handleRevoke(k.id, k.name)}
                          className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-400/10 cursor-pointer" title="Revoke">
                          <PowerOff size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(k.id, k.name)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-400/10 cursor-pointer" title="Delete permanently">
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

      {/* Create Modal */}
      {showCreate && <CreateKeyModal onClose={() => setShowCreate(false)} onCreated={(key) => { setNewKey(key); setShowCreate(false); fetchKeys(); }} />}
    </PageWrapper>
  );
}

function CreateKeyModal({ onClose, onCreated }: { onClose: () => void; onCreated: (key: string) => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Operator");
  const [expiresInDays, setExpiresInDays] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Key name required"); return; }
    setSaving(true);
    try {
      const res = await fetch(getApiUrl("/keys"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, expiresInDays }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("API key generated");
        onCreated(data.key);
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.message || "Failed to create key");
      }
    } catch { toast.error("Network error"); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--text)]">Generate API Key</h2>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase mb-1">Key Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="CI Pipeline / Ansible / Terraform"
            className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase mb-1">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none">
              <option value="Viewer">Viewer (read-only)</option>
              <option value="Operator">Operator (run scripts)</option>
              <option value="Admin">Admin (manage)</option>
              <option value="SuperAdmin">SuperAdmin (full)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase mb-1">Expires In (days)</label>
            <input type="number" value={expiresInDays} onChange={e => setExpiresInDays(parseInt(e.target.value) || 0)} placeholder="0 = never"
              className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none" />
          </div>
        </div>

        <p className="text-[10px] text-[var(--text-sub)]">The key will be shown once after generation. External tools authenticate via <code className="text-[var(--amber)]">X-Api-Key</code> header.</p>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-c)]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] border border-[var(--border-c)] cursor-pointer">Cancel</button>
          <button onClick={handleCreate} disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black cursor-pointer disabled:opacity-50">
            {saving ? "Generating..." : "Generate Key"}
          </button>
        </div>
      </div>
    </div>
  );
}
