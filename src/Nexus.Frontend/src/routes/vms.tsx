import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, Square, Pause, Camera, Monitor } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getVMs, controlVM, type HyperVVM } from "@/api/mock";

export const Route = createFileRoute("/vms")({
  head: () => ({ meta: [{ title: "Virtual Machines — NEXUS" }, { name: "description", content: "Manage Hyper-V virtual machines." }] }),
  component: VMsPage,
});

function VMsPage() {
  const [server, setServer] = useState("nexus01");
  const [vms, setVms] = useState<HyperVVM[]>([]);

  useEffect(() => { getVMs(server).then(setVms); }, [server]);

  async function act(id: string, a: "start"|"stop"|"pause"|"checkpoint") {
    await controlVM(server, id, a);
    setVms((arr) => arr.map((v) => v.id === id ? { ...v, status: a === "start" ? "Running" : a === "stop" ? "Stopped" : a === "pause" ? "Paused" : v.status } : v));
  }

  return (
    <PageWrapper>
      <PageHeader eyebrow="Infrastructure" title="Virtual Machines" subtitle="Hyper-V host: NEXUS01" />
      <ServerSelector value={server} onChange={setServer} />
      <div className="grid grid-cols-3 gap-3">
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
              <Btn onClick={() => {}} icon={Monitor} label="Connect" />
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}

function Btn({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ size?: number }>; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="mono flex items-center gap-1 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-sub)] hover:border-[var(--amber)] hover:text-[var(--amber)]">
      <Icon size={11} /> {label}
    </button>
  );
}
