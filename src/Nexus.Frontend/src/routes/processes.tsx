import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Square } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getLiveProcessesClient, killProcessClient, getPerformanceHistoryClient, type Process } from "@/api/client";

export const Route = createFileRoute("/processes")({
  head: () => ({ meta: [{ title: "Processes — NEXUS" }, { name: "description", content: "Inspect, end, and prioritize running processes." }] }),
  component: ProcessesPage,
});

function ProcessesPage() {
  const [server, setServer] = useState("dc");
  const [procs, setProcs] = useState<Process[]>([]);
  const [sysCpu, setSysCpu] = useState<number>(0);
  const [sysMem, setSysMem] = useState<number>(0);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [auto, setAuto] = useState(true);

  async function load() {
    if (!server) return;
    const p = await getLiveProcessesClient(server);
    setProcs(p);
    
    const hist = await getPerformanceHistoryClient(server);
    if (hist && hist.length > 0) {
      const latest = hist[hist.length - 1];
      setSysCpu(latest.cpu);
      setSysMem(latest.mem);
    }
  }

  useEffect(() => {
    let id: number | undefined;
    load();
    if (auto) id = window.setInterval(load, 5000);
    return () => { if (id) window.clearInterval(id); };
  }, [server, auto]);

  async function handleEndTask() {
    for (const pid of Array.from(sel)) {
      await killProcessClient(server, pid);
    }
    setSel(new Set());
    load();
  }

  const filtered = procs.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || String(p.pid).includes(q));

  return (
    <PageWrapper>
      <PageHeader eyebrow="Management" title="Processes" subtitle="Live process inventory" />
      <ServerSelector value={server} onChange={setServer} />
      <div className="nx-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-c)] p-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name / PID…" className="mono w-72 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[12px] placeholder:text-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none" />
          <div className="flex items-center gap-2">
            <label className="mono flex items-center gap-1.5 text-[11px] text-[var(--text-sub)]">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-[var(--amber)]" />
              Auto-refresh 5s
            </label>
            <button disabled={sel.size === 0} onClick={handleEndTask} className="mono flex items-center gap-1.5 rounded-md border border-[var(--crit)]/40 bg-[var(--crit)]/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--crit)] disabled:opacity-30">
              <Square size={12} /> End Task
            </button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-[var(--bg-card)]">
              <tr className="eyebrow border-b border-[var(--border-c)] text-left">
                <th className="w-8 px-3 py-2"></th>
                <th className="py-2">Name</th><th>PID</th><th>CPU%</th><th>Memory</th>
                <th>Mem%</th><th>Handles</th><th>Threads</th><th>User</th><th>Status</th>
              </tr>
            </thead>
            <tbody className="mono">
              {filtered.map((p) => {
                const isSel = sel.has(p.pid);
                const hot = p.cpu > 50;
                return (
                  <tr key={p.pid} className={"border-b border-[var(--border-dim)] " + (isSel ? "bg-[var(--amber-low)]" : hot ? "bg-[var(--warn)]/[0.04]" : "")}>
                    <td className={"px-3 py-1.5 " + (isSel ? "border-l-2 border-[var(--amber)]" : "")}>
                      <input type="checkbox" checked={isSel} onChange={() => { const n = new Set(sel); n.has(p.pid) ? n.delete(p.pid) : n.add(p.pid); setSel(n); }} className="accent-[var(--amber)]" />
                    </td>
                    <td className="text-[var(--text)]">{p.name}</td>
                    <td className="text-[var(--text-sub)]">{p.pid}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={hot ? "text-[var(--warn)]" : "text-[var(--amber)]"}>{p.cpu}</span>
                        <div className="h-1 w-12 rounded bg-[var(--border-dim)]"><div className="h-full rounded bg-[var(--teal)]" style={{ width: `${Math.min(100, p.cpu)}%` }} /></div>
                      </div>
                    </td>
                    <td className="text-[var(--text-sub)]">{p.memMB} MB</td>
                    <td className="text-[var(--text-sub)]">{p.memPct}%</td>
                    <td className="text-[var(--text-sub)]">{p.handles}</td>
                    <td className="text-[var(--text-sub)]">{p.threads}</td>
                    <td className="text-[var(--text-sub)]">{p.user}</td>
                    <td className="text-[var(--teal)]">{p.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mono flex items-center justify-between border-t border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-2 text-[11px] text-[var(--text-sub)]">
          <span>Total Processes: <span className="text-[var(--text)]">{procs.length}</span></span>
          <span>System CPU: <span className="text-[var(--amber)]">{sysCpu.toFixed(1)}%</span></span>
          <span>System Memory: <span className="text-[var(--teal)]">{sysMem.toFixed(1)}%</span></span>
        </div>
      </div>
    </PageWrapper>
  );
}
