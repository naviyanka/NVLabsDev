import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, Square, Pause, Camera, Monitor } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useNavigate } from "@tanstack/react-router";
import { getVMsClient as getVMs, controlVMClient as controlVM, createVMClient, type HyperVVM } from "@/api/client";
import { Plus, X, Server } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/vms")({
  head: () => ({ meta: [{ title: "Virtual Machines — NEXUS" }, { name: "description", content: "Manage Hyper-V virtual machines." }] }),
  component: VMsPage,
});

function VMsPage() {
  const navigate = useNavigate();
  const [server, setServer] = useState("nexus01");
  const [vms, setVms] = useState<HyperVVM[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadVMs = () => { getVMs(server).then(setVms); };
  useEffect(() => { loadVMs(); }, [server]);

  async function act(id: string, a: "start"|"stop"|"pause"|"checkpoint") {
    toast.info(`${a.toUpperCase()} command sent to VM`);
    const ok = await controlVM(server, id, a);
    if (ok) {
      toast.success(`VM ${a} executed`);
      loadVMs();
    } else {
      toast.error(`Failed to ${a} VM`);
    }
  }

  return (
    <PageWrapper>
      <PageHeader eyebrow="Infrastructure" title="Virtual Machines" subtitle={`Hyper-V host: ${server.toUpperCase()}`} />
      <div className="flex items-center justify-between mb-4">
        <ServerSelector value={server} onChange={setServer} />
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--amber)] text-black px-4 py-2 text-sm font-semibold hover:bg-[var(--amber-hover)] transition-colors shadow-sm"
        >
          <Plus size={16} /> Create VM
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vms.map((v) => (
          <div key={v.id} className="nx-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="display text-[15px] font-semibold">{v.name}</h3>
                <div className="mono pt-0.5 text-[10px] text-[var(--text-sub)]">{v.os}</div>
              </div>
              <StatusBadge status={v.status === "Running" ? "online" : v.status === "Paused" ? "warning" : "offline"}>{v.status}</StatusBadge>
            </div>
            <div className="mono mt-4 grid grid-cols-3 gap-2 text-[10px] text-[var(--text-sub)]">
              <div><div className="eyebrow pb-0.5">CPU</div><span className="text-[var(--amber)]">{v.cpu}%</span></div>
              <div><div className="eyebrow pb-0.5">Memory</div><span className="text-[var(--teal)]">{(v.memMB/1024).toFixed(0)} GB</span></div>
              <div><div className="eyebrow pb-0.5">Uptime</div><span className="text-[var(--text)]">{v.uptime}</span></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Btn onClick={() => act(v.id, "start")} icon={Play} label="Start" />
              <Btn onClick={() => act(v.id, "stop")} icon={Square} label="Stop" />
              <Btn onClick={() => act(v.id, "pause")} icon={Pause} label="Pause" />
              <Btn onClick={() => act(v.id, "checkpoint")} icon={Camera} label="Checkpoint" />
              <Btn onClick={() => navigate({ to: "/remote-desktop" })} icon={Monitor} label="Connect" />
            </div>
          </div>
        ))}
      </div>

      {isCreateOpen && (
        <CreateVMModal
          server={server}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false);
            loadVMs();
          }}
        />
      )}
    </PageWrapper>
  );
}

function CreateVMModal({ server, onClose, onCreated }: { server: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [memoryMb, setMemoryMb] = useState(4096);
  const [vcpu, setVcpu] = useState(2);
  const [vswitch, setVswitch] = useState("Default Switch");
  const [vhdxSizeGb, setVhdxSizeGb] = useState(60);
  const [isoPath, setIsoPath] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await createVMClient(server, { name, memoryMb, vcpu, vswitch, vhdxSizeGb, isoPath: isoPath || undefined });
      if (ok) {
        toast.success(`Virtual Machine "${name}" created successfully`);
        onCreated();
      } else {
        toast.error("Failed to create Virtual Machine");
      }
    } catch (e) {
      toast.error("VM creation error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <Server size={18} className="text-[var(--amber)]" />
            <h3 className="text-lg font-bold text-[var(--text)]">Create Hyper-V VM</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">VM Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SVR2022-WEB01"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Startup RAM (MB)</label>
              <input
                type="number"
                required
                min={1024}
                max={131072}
                value={memoryMb}
                onChange={(e) => setMemoryMb(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">vCPUs</label>
              <input
                type="number"
                required
                min={1}
                max={64}
                value={vcpu}
                onChange={(e) => setVcpu(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Virtual Switch</label>
              <select
                value={vswitch}
                onChange={(e) => setVswitch(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
              >
                <option value="Default Switch">Default Switch</option>
                <option value="vSwitch-Internal">vSwitch-Internal</option>
                <option value="vSwitch-External">vSwitch-External</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">VHDX Size (GB)</label>
              <input
                type="number"
                required
                min={20}
                max={4096}
                value={vhdxSizeGb}
                onChange={(e) => setVhdxSizeGb(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">ISO Image Path (Optional)</label>
            <input
              value={isoPath}
              onChange={(e) => setIsoPath(e.target.value)}
              placeholder="e.g. C:\ISOs\WindowsServer2022.iso"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            />
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Creating..." : "Create VM"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Btn({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ size?: number }>; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="mono flex items-center gap-1 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-sub)] hover:border-[var(--amber)] hover:text-[var(--amber)]">
      <Icon size={11} /> {label}
    </button>
  );
}
