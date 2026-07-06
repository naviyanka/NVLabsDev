import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getVirtualSwitches, type VirtualSwitch } from "@/api/mock";

export const Route = createFileRoute("/vswitches")({
  head: () => ({ meta: [{ title: "Virtual Switches — NEXUS" }, { name: "description", content: "Manage Hyper-V virtual switches." }] }),
  component: VSwitchesPage,
});

const COLOR: Record<string, string> = { External: "var(--amber)", Internal: "var(--teal)", Private: "var(--text-sub)" };

function VSwitchesPage() {
  const [server, setServer] = useState("nexus01");
  const [list, setList] = useState<VirtualSwitch[]>([]);
  useEffect(() => { getVirtualSwitches(server).then(setList); }, [server]);

  return (
    <PageWrapper>
      <PageHeader eyebrow="Infrastructure" title="Virtual Switches" />
      <ServerSelector value={server} onChange={setServer} />
      <div className="grid grid-cols-3 gap-3">
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
              <button className="mono rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:border-[var(--amber)] hover:text-[var(--amber)]">Rename</button>
              <button className="mono rounded-md border border-[var(--crit)]/40 bg-[var(--crit)]/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--crit)]">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
