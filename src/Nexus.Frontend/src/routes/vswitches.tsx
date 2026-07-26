import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getVirtualSwitchesClient as getVirtualSwitches, renameVirtualSwitchClient, deleteVirtualSwitchClient, createVirtualSwitchClient, type VirtualSwitch } from "@/api/client";
import { Plus, X, Network } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/vswitches")({
  head: () => ({ meta: [{ title: "Virtual Switches — NEXUS" }, { name: "description", content: "Manage Hyper-V virtual switches." }] }),
  component: VSwitchesPage,
});

const COLOR: Record<string, string> = { External: "var(--amber)", Internal: "var(--teal)", Private: "var(--text-sub)" };

function VSwitchesPage() {
  const [server, setServer] = useState("nexus01");
  const [list, setList] = useState<VirtualSwitch[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadSwitches = () => { getVirtualSwitches(server).then(setList); };
  useEffect(() => { loadSwitches(); }, [server]);

  const handleRename = async (id: string, currentName: string) => {
    const newName = prompt(`Enter new name for virtual switch "${currentName}":`, currentName);
    if (!newName || newName === currentName) return;
    const ok = await renameVirtualSwitchClient(server, id, newName);
    if (ok) { toast.success("Virtual switch renamed"); loadSwitches(); }
    else toast.error("Failed to rename virtual switch");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete virtual switch "${name}"?`)) return;
    const ok = await deleteVirtualSwitchClient(server, id);
    if (ok) { toast.success("Virtual switch deleted"); loadSwitches(); }
    else toast.error("Failed to delete virtual switch");
  };

  return (
    <PageWrapper>
      <PageHeader eyebrow="Infrastructure" title="Virtual Switches" />
      <div className="flex items-center justify-between mb-4">
        <ServerSelector value={server} onChange={setServer} />
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--amber)] text-black px-4 py-2 text-sm font-semibold hover:bg-[var(--amber-hover)] transition-colors shadow-sm"
        >
          <Plus size={16} /> New Virtual Switch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((s) => (
          <div key={s.id} className="nx-card p-5">
            <span className="mono inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em]" style={{ color: COLOR[s.type], borderColor: COLOR[s.type] + "55", background: COLOR[s.type] + "15" }}>{s.type}</span>
            <h3 className="display pt-2 text-[15px] font-semibold">{s.name}</h3>
            {s.adapter && <div className="mono pt-0.5 text-[10px] text-[var(--text-sub)]">via {s.adapter}</div>}
            <div className="mt-4">
              <div className="eyebrow pb-1">Connected VMs ({s.vms.length})</div>
              <ul className="mono space-y-0.5 text-[11px] text-[var(--text-sub)]">{s.vms.map((v) => <li key={v}>· {v}</li>)}</ul>
            </div>
            <div className="mt-4 flex gap-1.5">
              <button onClick={() => handleRename(s.id, s.name)} className="mono rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:border-[var(--amber)] hover:text-[var(--amber)]">Rename</button>
              <button onClick={() => handleDelete(s.id, s.name)} className="mono rounded-md border border-[var(--crit)]/40 bg-[var(--crit)]/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--crit)] hover:bg-[var(--crit)] hover:text-black transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {isCreateOpen && (
        <CreateVSwitchModal
          server={server}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false);
            loadSwitches();
          }}
        />
      )}
    </PageWrapper>
  );
}

function CreateVSwitchModal({ server, onClose, onCreated }: { server: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("External");
  const [adapterName, setAdapterName] = useState("Ethernet 0 (Intel 10GbE)");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await createVirtualSwitchClient(server, { name, type, adapterName: type === "External" ? adapterName : undefined });
      if (ok) {
        toast.success(`Virtual switch "${name}" created successfully`);
        onCreated();
      } else {
        toast.error("Failed to create Virtual Switch");
      }
    } catch (e) {
      toast.error("Virtual Switch creation error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <Network size={18} className="text-[var(--amber)]" />
            <h3 className="text-lg font-bold text-[var(--text)]">Create Virtual Switch</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Switch Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. vSwitch-Production"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Connection Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            >
              <option value="External">External (Binds to physical NIC)</option>
              <option value="Internal">Internal (Host + VMs communication only)</option>
              <option value="Private">Private (VM to VM communication only)</option>
            </select>
          </div>

          {type === "External" && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Physical Network Adapter</label>
              <select
                value={adapterName}
                onChange={(e) => setAdapterName(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
              >
                <option value="Ethernet 0 (Intel 10GbE)">Ethernet 0 (Intel 10GbE)</option>
                <option value="Ethernet 1 (Mellanox ConnectX-5)">Ethernet 1 (Mellanox ConnectX-5)</option>
                <option value="Ethernet 2 (Broadcom NetXtreme)">Ethernet 2 (Broadcom NetXtreme)</option>
              </select>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Creating..." : "Create Switch"}
          </button>
        </div>
      </form>
    </div>
  );
}
