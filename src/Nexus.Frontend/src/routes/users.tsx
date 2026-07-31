import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Users, Plus, Trash2, Shield, Edit, Check } from "lucide-react";
import { getApiUrl } from "@/lib/backend";
import { toast } from "sonner";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "User Management — NEXUS" },
      { name: "description", content: "Manage NEXUS platform users and roles." },
    ],
  }),
  component: UsersPage,
});

interface NexusUser {
  id: string;
  username: string;
  role: string;
  source: string;
  domain: string;
  createdAt: string;
  lastLoginAt: string | null;
}

const ROLES = ["Viewer", "Operator", "Admin", "SuperAdmin"];
const ROLE_COLORS: Record<string, string> = {
  Viewer: "text-sky-400 bg-sky-400/10 border-sky-400/30",
  Operator: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  Admin: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  SuperAdmin: "text-rose-400 bg-rose-400/10 border-rose-400/30",
};

function UsersPage() {
  const [users, setUsers] = useState<NexusUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/users"));
      if (res.ok) setUsers(await res.json());
      else if (res.status === 403) toast.error("Access denied. SuperAdmin role required.");
    } catch { /* offline */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (user: NexusUser) => {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(getApiUrl(`/users/${user.id}`), { method: "DELETE" });
      if (res.ok) { toast.success("User deleted"); fetchUsers(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.message || "Failed"); }
    } catch { toast.error("Network error"); }
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(getApiUrl(`/users/${userId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) { toast.success("Role updated"); setEditingId(null); fetchUsers(); }
      else { toast.error("Failed to update role"); }
    } catch { toast.error("Network error"); }
  };

  return (
    <PageWrapper>
      <PageHeader title="User Management" subtitle="Manage platform access roles (RBAC)" />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[var(--text-sub)]">{users.length} user{users.length !== 1 ? "s" : ""} registered</p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[var(--amber)] text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-[var(--amber-hover)] transition-colors cursor-pointer"
        >
          <Plus size={14} /> Add User
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="nx-skeleton h-16 rounded-2xl" />)}</div>
      ) : users.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-8 text-center">
          <Users size={32} className="mx-auto mb-3 text-[var(--text-sub)]" />
          <p className="text-sm text-[var(--text-sub)]">No users found. Users are auto-created on first login.</p>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-c)] text-left">
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-sub)] uppercase">Username</th>
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-sub)] uppercase">Role</th>
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-sub)] uppercase">Source</th>
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-sub)] uppercase">Last Login</th>
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-sub)] uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-[var(--border-c)] last:border-b-0 hover:bg-[var(--bg-void)]/50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[var(--text)]">{u.username}</div>
                    {u.domain && <div className="text-[10px] text-[var(--text-sub)] font-mono">{u.domain}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === u.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editRole}
                          onChange={e => setEditRole(e.target.value)}
                          className="bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg px-2 py-1 text-xs text-[var(--text)]"
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button onClick={() => handleRoleUpdate(u.id, editRole)} className="text-emerald-400 cursor-pointer"><Check size={14} /></button>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${ROLE_COLORS[u.role] || ""}`}>
                        <Shield size={10} /> {u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-sub)] capitalize">{u.source}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-sub)] font-mono">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => { setEditingId(u.id); setEditRole(u.role); }}
                        className="p-1.5 rounded-lg text-[var(--text-sub)] hover:text-[var(--amber)] hover:bg-[var(--amber)]/10 cursor-pointer"
                        title="Change Role"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 rounded-lg text-[var(--text-sub)] hover:text-rose-400 hover:bg-rose-400/10 cursor-pointer"
                        title="Delete User"
                      >
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

      {/* Add User Modal */}
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); fetchUsers(); }} />}
    </PageWrapper>
  );
}

function AddUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("Viewer");
  const [source, setSource] = useState("domain");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!username.trim()) { toast.error("Username required"); return; }
    setSaving(true);
    try {
      const res = await fetch(getApiUrl("/users"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, role, source }),
      });
      if (res.ok) { toast.success("User created"); onSaved(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.message || "Failed to create user"); }
    } catch { toast.error("Network error"); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--text)]">Add User</h2>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase mb-1">Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="jsmith"
            className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase mb-1">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase mb-1">Source</label>
            <select value={source} onChange={e => setSource(e.target.value)}
              className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none">
              <option value="domain">Domain</option>
              <option value="local">Local</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-c)]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)] border border-[var(--border-c)] cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] cursor-pointer disabled:opacity-50">
            {saving ? "Creating..." : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}
