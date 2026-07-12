import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback, useContext } from "react";
import { AlertCircle, Info, AlertTriangle, XCircle, Search, Download, Loader2, RefreshCw, X, Radio } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getEvents, type EventEntry, type EventLevel } from "@/api/mock";
import { getServersClient, type Server } from "@/api/client";
import { ThemeContext } from "./__root";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "Event Viewer — NEXUS" }, { name: "description", content: "Browse system, application, and security event logs." }] }),
  component: EventsPage,
});

const LOGS = ["Application", "System", "Security"] as const;
type LogName = (typeof LOGS)[number];
const ALL_LEVELS: EventLevel[] = ["Critical", "Error", "Warning", "Information", "Verbose"];

const levelIcon = (lv: EventLevel) =>
  lv === "Error" || lv === "Critical" ? XCircle : lv === "Warning" ? AlertTriangle : lv === "Information" ? Info : AlertCircle;
const levelColor = (lv: EventLevel) =>
  lv === "Error" || lv === "Critical" ? "var(--crit)" : lv === "Warning" ? "var(--warn)" : lv === "Information" ? "var(--teal)" : "var(--text-sub)";

function EventsPage() {
  const { theme } = useContext(ThemeContext);

  const [server, setServer] = useState("");
  const [serverInfo, setServerInfo] = useState<Server | null>(null);
  const [log, setLog] = useState<LogName>("System");
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [selected, setSelected] = useState<EventEntry | null>(null);
  const [levels, setLevels] = useState<Set<EventLevel>>(new Set(ALL_LEVELS));
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchServers = async () => {
    const list = await getServersClient();
    if (list.length > 0) { setServer(list[0].ip); setServerInfo(list[0]); }
  };

  const fetchEvents = useCallback(async (id: string, lg: LogName) => {
    setLoading(true);
    try {
      const data = await getEvents(id, lg, 100);
      setEvents(data);
      setLastRefresh(new Date());
    } catch {
      console.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServers(); }, []);

  useEffect(() => {
    if (server) {
      getServersClient().then(list => {
        const s = list.find(x => x.ip === server || x.id === server);
        setServerInfo(s ?? null);
      });
      fetchEvents(server, log);
      setSelected(null);
    }
  }, [server, log, fetchEvents]);

  useEffect(() => {
    if (!autoRefresh || !server) return;
    const id = setInterval(() => fetchEvents(server, log), 15000);
    return () => clearInterval(id);
  }, [autoRefresh, server, log, fetchEvents]);

  const filtered = useMemo(() =>
    events
      .filter(e => levels.has(e.level))
      .filter(e => q === "" ||
        e.message.toLowerCase().includes(q.toLowerCase()) ||
        e.source.toLowerCase().includes(q.toLowerCase()) ||
        String(e.eventId).includes(q))
  , [events, levels, q]);

  const levelCounts = useMemo(() => {
    const c: Record<string, number> = { Critical: 0, Error: 0, Warning: 0, Information: 0, Verbose: 0 };
    events.forEach(e => { if (e.level in c) c[e.level]++; });
    return c;
  }, [events]);

  const toggleLevel = (lv: EventLevel) => {
    const n = new Set(levels);
    n.has(lv) ? n.delete(lv) : n.add(lv);
    setLevels(n);
  };

  const exportCsv = () => {
    const header = ["Time", "Level", "Source", "EventID", "Category", "Message"];
    const rows = filtered.map(e => [
      new Date(e.time).toISOString(), e.level, e.source, String(e.eventId), e.category, `"${e.message.replace(/"/g, '""')}"`
    ].join(","));
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `events-${server}-${log}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => { setQ(""); setLevels(new Set(ALL_LEVELS)); };
  const hasQuery = q !== "" || levels.size !== ALL_LEVELS.length;

  if (theme === "horizon") {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6 font-sans">
        <div>
          <h2 className="text-3xl font-extrabold text-[var(--text)]">Event Viewer</h2>
          <p className="text-sm text-[var(--text-sub)] mt-1">
            {serverInfo ? `${serverInfo.name} · ${log} log` : "Select a server"} · {filtered.length} of {events.length} shown
          </p>
        </div>
        <ServerSelector value={server} onChange={setServer} />
        <ControlBar q={q} setQ={setQ} onRefresh={() => fetchEvents(server, log)} onExport={exportCsv} autoRefresh={autoRefresh} setAutoRefresh={setAutoRefresh} loading={loading} lastRefresh={lastRefresh} />
        <div className="grid grid-cols-[240px_1fr] gap-5">
          <aside className="nx-card h-fit p-3">
            <LogsPanel log={log} setLog={setLog} counts={levelCounts} events={events} />
            <LevelsPanel levels={levels} toggleLevel={toggleLevel} counts={levelCounts} />
          </aside>
          <div className="flex flex-col gap-3">
            <EventsTable events={filtered} selected={selected} setSelected={setSelected} loading={loading} hasQuery={hasQuery} onClear={clearFilters} />
            <EventDetail selected={selected} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper>
      <PageHeader eyebrow="Advanced" title="Event Viewer" right={
        <div className="mono flex items-center gap-2 text-[10px] text-[var(--text-sub)]">
          <Radio size={12} className={autoRefresh ? "text-[var(--ok)] animate-pulse" : "text-[var(--text-sub)]"}/>
          {autoRefresh ? "Live" : lastRefresh.toLocaleTimeString()}
        </div>
      }/>
      <ServerSelector value={server} onChange={setServer} />

      <ControlBar q={q} setQ={setQ} onRefresh={() => fetchEvents(server, log)} onExport={exportCsv} autoRefresh={autoRefresh} setAutoRefresh={setAutoRefresh} loading={loading} lastRefresh={lastRefresh} />

      <div className="mt-4 grid grid-cols-[220px_1fr] gap-5">
        <aside className="nx-card h-fit p-3">
          <LogsPanel log={log} setLog={setLog} counts={levelCounts} events={events} />
          <LevelsPanel levels={levels} toggleLevel={toggleLevel} counts={levelCounts} />
        </aside>

        <div className="flex flex-col gap-3">
          <EventsTable events={filtered} selected={selected} setSelected={setSelected} loading={loading} hasQuery={hasQuery} onClear={clearFilters} />
          <EventDetail selected={selected} />
        </div>
      </div>
    </PageWrapper>
  );
}

function ControlBar({
  q, setQ, onRefresh, onExport, autoRefresh, setAutoRefresh, loading, lastRefresh,
}: {
  q: string; setQ: (v: string) => void; onRefresh: () => void; onExport: () => void;
  autoRefresh: boolean; setAutoRefresh: (v: boolean) => void; loading: boolean; lastRefresh: Date;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] p-2">
      <div className="flex w-full max-w-sm items-center gap-2 rounded bg-[var(--bg-card)] px-2 py-1.5 border border-[var(--border-dim)]">
        <Search size={14} className="text-[var(--text-sub)]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search source, event ID, message..." className="w-full bg-transparent text-[12px] outline-none placeholder:text-[var(--text-dim)]" />
        {q && <button onClick={() => setQ("")} className="text-[var(--text-sub)] hover:text-[var(--text)]"><X size={14} /></button>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setAutoRefresh(!autoRefresh)}
          className={"mono flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] border transition-colors " + (autoRefresh ? "bg-[var(--ok)]/10 text-[var(--ok)] border-[var(--ok)]/30" : "bg-[var(--bg-card)] text-[var(--text-sub)] border-[var(--border-dim)] hover:text-[var(--text)]")}>
          <Radio size={12} /> {autoRefresh ? "Live" : "Off"}
        </button>
        <button onClick={onRefresh} disabled={loading}
          className="flex items-center gap-2 rounded bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] border border-[var(--border-dim)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
        <button onClick={onExport} disabled={loading}
          className="flex items-center gap-2 rounded bg-[var(--amber-low)] border border-[var(--amber)] px-3 py-1.5 text-[12px] font-medium text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black disabled:opacity-50">
          <Download size={14} /> Export
        </button>
      </div>
    </div>
  );
}

function LogsPanel({ log, setLog, counts, events }: { log: LogName; setLog: (l: LogName) => void; counts: Record<string, number>; events: EventEntry[] }) {
  return (
    <>
      <div className="eyebrow px-1 pb-2">Windows Logs</div>
      {LOGS.map((l) => (
        <button key={l} onClick={() => setLog(l)}
          className={"flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] " + (l === log ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)]")}>
          <span>{l}</span>
          <span className="mono text-[10px]">{l === log ? events.length : "—"}</span>
        </button>
      ))}
      <div className="mt-2 space-y-0.5">
        {(["Critical", "Error", "Warning", "Information"] as EventLevel[]).map(lv => (
          <div key={lv} className="mono flex items-center justify-between px-2.5 text-[10px]">
            <span className="flex items-center gap-1.5" style={{ color: levelColor(lv) }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: levelColor(lv) }} /> {lv}
            </span>
            <span className="text-[var(--text-sub)]">{counts[lv] || 0}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function LevelsPanel({ levels, toggleLevel, counts }: { levels: Set<EventLevel>; toggleLevel: (l: EventLevel) => void; counts: Record<string, number> }) {
  return (
    <>
      <div className="eyebrow px-1 pb-2 pt-4">Filter Level</div>
      {ALL_LEVELS.map((lv) => (
        <label key={lv} className="mono flex cursor-pointer items-center gap-2 px-2.5 py-1 text-[11px] text-[var(--text-sub)] hover:text-[var(--text)]">
          <input type="checkbox" checked={levels.has(lv)} onChange={() => toggleLevel(lv)} className="accent-[var(--amber)]" />
          <span className="flex-1">{lv}</span>
          <span className="text-[10px] text-[var(--text-dim)]">{counts[lv] || 0}</span>
        </label>
      ))}
    </>
  );
}

function EventsTable({
  events, selected, setSelected, loading, hasQuery, onClear,
}: {
  events: EventEntry[]; selected: EventEntry | null; setSelected: (e: EventEntry) => void;
  loading: boolean; hasQuery: boolean; onClear: () => void;
}) {
  if (loading && events.length === 0) {
    return <div className="nx-card flex items-center justify-center gap-2 p-8 text-[13px] text-[var(--text-sub)]"><Loader2 size={14} className="animate-spin" /> Loading events…</div>;
  }
  if (events.length === 0) {
    return (
      <div className="nx-card p-12 text-center">
        <Info size={32} className="text-[var(--text-dim)] mb-3 mx-auto" />
        <div className="text-[14px] text-[var(--text)]">{hasQuery ? "No events match filters" : "No events found"}</div>
        <div className="text-[12px] text-[var(--text-sub)] mt-1">{hasQuery ? "Try clearing the search or level filters." : "This log may be empty on the selected server."}</div>
        {hasQuery && <button onClick={onClear} className="mono mt-3 text-[11px] uppercase tracking-[0.2em] text-[var(--amber)] hover:underline">Clear filters</button>}
      </div>
    );
  }
  return (
    <div className="nx-card overflow-hidden">
      <div className="max-h-[50vh] overflow-y-auto">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 bg-[var(--bg-card)]">
            <tr className="eyebrow border-b border-[var(--border-c)] text-left">
              <th className="w-8 px-3 py-2"></th><th>Date/Time</th><th>Source</th><th>Event ID</th><th>Description</th>
            </tr>
          </thead>
          <tbody className="mono">
            {events.map((e) => {
              const Ic = levelIcon(e.level);
              const color = levelColor(e.level);
              const isSel = selected?.id === e.id;
              const rowBg = isSel ? "bg-[var(--amber-low)]" :
                e.level === "Error" || e.level === "Critical" ? "bg-[var(--crit)]/[0.05]" :
                e.level === "Warning" ? "bg-[var(--warn)]/[0.05]" : "";
              return (
                <tr key={e.id} onClick={() => setSelected(e)}
                  className={"cursor-pointer border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] " + rowBg}>
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
  );
}

function EventDetail({ selected }: { selected: EventEntry | null }) {
  return (
    <div className="nx-card p-4">
      {selected ? (
        <>
          <div className="flex items-center justify-between pb-1">
            <div className="eyebrow">Event Detail · ID {selected.eventId}</div>
            {(() => { const Ic = levelIcon(selected.level); const color = levelColor(selected.level); return <span className="flex items-center gap-1.5 text-[11px]" style={{ color }}><Ic size={12} /> {selected.level}</span>; })()}
          </div>
          <p className="text-[13px] text-[var(--text)]">{selected.message}</p>
          <div className="mono mt-2 text-[10px] text-[var(--text-sub)]">
            Source: {selected.source} · Category: {selected.category} · {new Date(selected.time).toLocaleString()}
          </div>
          {selected.xml && (
            <pre className="mono mt-3 max-h-40 overflow-auto rounded-md border border-[var(--border-c)] bg-[var(--bg-void)] p-3 text-[10px] text-[var(--text-sub)]">{selected.xml}</pre>
          )}
        </>
      ) : (
        <div className="py-6 text-center text-[12px] text-[var(--text-sub)]">Select an event to inspect.</div>
      )}
    </div>
  );
}

export default EventsPage;
