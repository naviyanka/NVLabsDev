import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getTasksClient, runTaskClient, type ScheduledTask } from "@/api/client";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Scheduled Tasks — NEXUS" }, { name: "description", content: "Manage Windows scheduled tasks." }] }),
  component: TasksPage,
});

function TasksPage() {
  const [server, setServer] = useState("dc");
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [sel, setSel] = useState<ScheduledTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const data = await getTasksClient(server);
      setTasks(data);
      if (sel) {
        setSel(data.find(t => t.name === sel.name && t.path === sel.path) || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchTasks(); 
  }, [server]);

  const handleRunTask = async () => {
    if (!sel) return;
    setIsActivating(true);
    try {
      const fullPath = sel.path.endsWith("\\") ? sel.path + sel.name : sel.path + "\\" + sel.name;
      const success = await runTaskClient(server, fullPath);
      if (success) {
        await fetchTasks();
      } else {
        alert("Failed to start task.");
      }
    } finally {
      setIsActivating(false);
    }
  };

  const getLibraryFolders = () => {
    const folders = new Set<string>();
    tasks.forEach(t => {
      folders.add(t.path);
      // add parents
      let p = t.path;
      while (p.lastIndexOf("\\") > 0) {
        p = p.substring(0, p.lastIndexOf("\\"));
        folders.add(p);
      }
    });
    return Array.from(folders).sort();
  };

  return (
    <PageWrapper>
      <PageHeader eyebrow="Management" title="Scheduled Tasks" />
      <ServerSelector value={server} onChange={setServer} />
      
      <div className="grid grid-cols-[260px_1fr_320px] gap-5 pt-4">
        <aside className="nx-card h-fit p-3">
          <div className="eyebrow px-1 pb-2">Library</div>
          <div className="max-h-[600px] overflow-y-auto">
            {isLoading && tasks.length === 0 ? (
              <div className="text-[11px] text-[var(--text-sub)] px-2 py-2">Loading library...</div>
            ) : (
              getLibraryFolders().map((f) => (
                <button 
                  key={f} 
                  title={f}
                  className="mono flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]">
                  <span className="truncate pr-2">{f}</span>
                  <span className="text-[10px] shrink-0 text-[var(--text-ghost)]">
                    {tasks.filter((t) => t.path === f || t.path.startsWith(f + "\\")).length}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="nx-card overflow-hidden flex flex-col h-[700px]">
          <div className="overflow-auto flex-1">
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-[var(--bg-card)] shadow-sm z-10">
                <tr className="eyebrow border-b border-[var(--border-c)] text-left">
                  <th className="px-3 py-2">Name</th><th>Status</th><th>Last Run</th><th>Result</th><th>Next Run</th>
                </tr>
              </thead>
              <tbody className="mono">
                {isLoading && tasks.length === 0 ? (
                  <tr><td colSpan={5} className="py-4 text-center text-[var(--text-sub)]">Loading tasks...</td></tr>
                ) : tasks.length === 0 ? (
                  <tr><td colSpan={5} className="py-4 text-center text-[var(--text-sub)]">No tasks found</td></tr>
                ) : (
                  tasks.filter(t => t.name).map((t) => (
                    <tr key={`${t.path}-${t.name}`} onClick={() => setSel(t)} className={"cursor-pointer border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] " + (sel?.name === t.name && sel?.path === t.path ? "bg-[var(--amber-low)]" : "")}>
                      <td className="px-3 py-2 text-[var(--text)] truncate max-w-[200px]" title={t.name}>{t.name}</td>
                      <td><StatusBadge status={t.status === "Running" ? "Syncing" : t.status}>{t.status}</StatusBadge></td>
                      <td className="text-[var(--text-sub)] whitespace-nowrap">{t.lastRun}</td>
                      <td className="text-[var(--text-sub)]">{t.lastResult}</td>
                      <td className="text-[var(--text-sub)] whitespace-nowrap">{t.nextRun}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="nx-card h-fit p-5 sticky top-4">
          {sel ? (
            <>
              <div className="eyebrow pb-1">Task</div>
              <h3 className="display text-[15px] font-semibold break-words">{sel.name}</h3>
              <div className="mono pt-0.5 text-[10px] text-[var(--text-sub)] break-words">{sel.path}</div>
              <div className="my-4 flex gap-1.5">
                <button 
                  onClick={handleRunTask}
                  disabled={isActivating}
                  className={`mono flex items-center gap-1.5 rounded-md border border-[var(--amber)] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors ${isActivating ? 'opacity-50 cursor-not-allowed bg-[var(--amber-low)] text-[var(--amber)]' : 'bg-[var(--bg-surface)] text-[var(--amber)] hover:bg-[var(--amber-low)]'}`}>
                  <Play size={11} /> {isActivating ? "Starting..." : "Run Now"}
                </button>
              </div>
              <div className="eyebrow pb-1 pt-2">Triggers</div>
              <ul className="mono text-[11px] text-[var(--text-sub)] max-h-[150px] overflow-y-auto">
                {sel.triggers.length ? sel.triggers.map((t, i) => <li key={i} className="py-0.5">· {t}</li>) : <li>None</li>}
              </ul>
              <div className="eyebrow pb-1 pt-4">Status</div>
              <div className="mono text-[11px] text-[var(--text)]">{sel.status} — last result <span className="text-[var(--amber)]">{sel.lastResult}</span></div>
            </>
          ) : (
            <div className="py-8 text-center text-[12px] text-[var(--text-sub)]">Select a task</div>
          )}
        </aside>
      </div>
    </PageWrapper>
  );
}
