import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Info, AlertTriangle, XCircle } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getEvents, type EventEntry, type EventLevel } from "@/api/mock";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "Event Viewer — NEXUS" }, { name: "description", content: "Browse system, application, and security event logs." }] }),
  component: EventsPage,
});

const LOGS = ["Application","System","Security"] as const;

function EventsPage() {
  const [server, setServer] = useState("dc01");
  const [log, setLog] = useState<(typeof LOGS)[number]>("System");
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [selected, setSelected] = useState<EventEntry | null>(null);
  const [levels, setLevels] = useState<Set<EventLevel>>(new Set(["Error","Warning","Critical","Information"]));

  useEffect(() => { getEvents(server, log, 80).then(setEvents); setSelected(null); }, [server, log]);

  const filtered = useMemo(() => events.filter((e) => levels.has(e.level)), [events, levels]);

  return (
    <PageWrapper>
      <PageHeader eyebrow="Advanced" title="Event Viewer" />
      <ServerSelector value={server} onChange={setServer} />
      <div className="grid grid-cols-[220px_1fr] gap-5">
        <aside className="nx-card h-fit p-3">
          <div className="eyebrow px-1 pb-2">Windows Logs</div>
          {LOGS.map((l) => (
            <button key={l} onClick={() => setLog(l)} className={"flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] " + (l === log ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)]")}>
              <span>{l}</span>
              <span className="mono text-[10px]">{l === log ? events.length : "—"}</span>
            </button>
          ))}
          <div className="eyebrow px-1 pb-2 pt-4">Filter Level</div>
          {(["Critical","Error","Warning","Information","Verbose"] as EventLevel[]).map((lv) => (
            <label key={lv} className="mono flex items-center gap-2 px-2.5 py-1 text-[11px] text-[var(--text-sub)]">
              <input type="checkbox" checked={levels.has(lv)} onChange={() => { const n = new Set(levels); n.has(lv) ? n.delete(lv) : n.add(lv); setLevels(n); }} className="accent-[var(--amber)]" />
              {lv}
            </label>
          ))}
        </aside>

        <div className="flex flex-col gap-3">
          <div className="nx-card overflow-hidden">
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-[var(--bg-card)]"><tr className="eyebrow border-b border-[var(--border-c)] text-left">
                  <th className="w-8 px-3 py-2"></th><th>Date/Time</th><th>Source</th><th>Event ID</th><th>Description</th>
                </tr></thead>
                <tbody className="mono">
                  {filtered.map((e) => {
                    const Ic = e.level === "Error" || e.level === "Critical" ? XCircle : e.level === "Warning" ? AlertTriangle : e.level === "Information" ? Info : AlertCircle;
                    const color = e.level === "Error" || e.level === "Critical" ? "var(--crit)" : e.level === "Warning" ? "var(--warn)" : "var(--teal)";
                    const isSel = selected?.id === e.id;
                    return (
                      <tr key={e.id} onClick={() => setSelected(e)} className={"cursor-pointer border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] " + (isSel ? "bg-[var(--amber-low)]" : e.level === "Error" || e.level === "Critical" ? "bg-[var(--crit)]/[0.05]" : e.level === "Warning" ? "bg-[var(--warn)]/[0.05]" : "")}>
                        <td className="px-3 py-1.5"><Ic size={12} style={{ color }} /></td>
                        <td className="text-[var(--text-sub)]">{new Date(e.time).toLocaleString()}</td>
                        <td className="text-[var(--text)]">{e.source}</td>
                        <td className="text-[var(--amber)]">{e.eventId}</td>
                        <td className="truncate text-[var(--text-sub)]">{e.message}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="nx-card p-4">
            {selected ? (
              <>
                <div className="eyebrow pb-1">Event Detail · ID {selected.eventId}</div>
                <p className="text-[13px] text-[var(--text)]">{selected.message}</p>
                <pre className="mono mt-3 max-h-40 overflow-auto rounded-md border border-[var(--border-c)] bg-[var(--bg-void)] p-3 text-[10px] text-[var(--text-sub)]">{selected.xml}</pre>
              </>
            ) : (
              <div className="py-6 text-center text-[12px] text-[var(--text-sub)]">Select an event to inspect.</div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
