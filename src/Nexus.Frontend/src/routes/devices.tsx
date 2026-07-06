import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, Cpu } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getDevices, type Device } from "@/api/mock";

export const Route = createFileRoute("/devices")({
  head: () => ({ meta: [{ title: "Devices — NEXUS" }, { name: "description", content: "Device Manager view." }] }),
  component: DevicesPage,
});

function DevicesPage() {
  const [server, setServer] = useState("nexus01");
  const [devices, setDevices] = useState<Device[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [sel, setSel] = useState<Device | null>(null);

  useEffect(() => { getDevices(server).then(setDevices); }, [server]);

  const grouped = useMemo(() => {
    const m: Record<string, Device[]> = {};
    devices.forEach((d) => { (m[d.category] ||= []).push(d); });
    return m;
  }, [devices]);

  return (
    <PageWrapper>
      <PageHeader eyebrow="Infrastructure" title="Devices" />
      <ServerSelector value={server} onChange={setServer} />
      <div className="grid grid-cols-[1fr_360px] gap-5">
        <div className="nx-card p-3">
          {Object.entries(grouped).map(([cat, list]) => {
            const isOpen = open[cat] ?? true;
            const hasIssue = list.some((d) => d.status !== "OK");
            return (
              <div key={cat}>
                <button onClick={() => setOpen({ ...open, [cat]: !isOpen })} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-[var(--text)] hover:bg-[var(--bg-surface)]">
                  {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <Cpu size={12} className="text-[var(--teal)]" />
                  <span className="display">{cat}</span>
                  {hasIssue && <AlertTriangle size={11} className="text-[var(--warn)]" />}
                  <span className="ml-auto mono text-[10px] text-[var(--text-sub)]">{list.length}</span>
                </button>
                {isOpen && (
                  <ul className="ml-7 border-l border-[var(--border-c)] pl-3">
                    {list.map((d) => (
                      <li key={d.name}>
                        <button onClick={() => setSel(d)} className={"mono flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px] " + (sel?.name === d.name ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)]")}>
                          <span className="truncate">{d.name}</span>
                          {d.status !== "OK" && <AlertTriangle size={11} className="ml-2 text-[var(--warn)]" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
        <aside className="nx-card h-fit p-5">
          {sel ? (
            <>
              <div className="eyebrow pb-1">Device</div>
              <h3 className="display text-[14px] font-semibold">{sel.name}</h3>
              <dl className="mono mt-3 space-y-2 text-[11px]">
                <Field k="Category" v={sel.category} />
                <Field k="Manufacturer" v={sel.manufacturer} />
                <Field k="Status" v={sel.status} />
                <Field k="Driver Version" v={sel.driverVersion} />
                <Field k="Driver Date" v={sel.driverDate} />
              </dl>
            </>
          ) : <div className="py-8 text-center text-[12px] text-[var(--text-sub)]">Select a device</div>}
        </aside>
      </div>
    </PageWrapper>
  );
}
function Field({ k, v }: { k: string; v: string }) {
  return <div><dt className="text-[var(--text-sub)]">{k}</dt><dd className="text-[var(--text)]">{v}</dd></div>;
}
