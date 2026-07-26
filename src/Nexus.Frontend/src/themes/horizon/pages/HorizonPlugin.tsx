import { getApiUrl } from "@/lib/backend";
import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useContext } from "react";
import { Play, Terminal as TerminalIcon, CheckSquare, Square, StopCircle, Server as ServerIcon } from "lucide-react";

import { getServersClient as getServers, type Server } from "@/api/client";
import { toast } from "sonner";
import { PluginEntity } from "../../../routes/plugins";



interface JobState {
  pluginId: string;
  serverIp: string;
  status: string;
  output: string;
  startTime?: string;
  endTime?: string;
}

function MultiServerSelector({
  value, onChange,
}: { value: string[]; onChange: (ips: string[]) => void }) {
  const [servers, setServers] = useState<Server[]>([]);
  useEffect(() => { getServers().then(setServers); }, []);

  const allSelected = servers.length > 0 && value.length === servers.length;

  function toggleAll() {
    if (allSelected) onChange([]);
    else onChange(servers.map(s => s.ip));
  }

  function toggleOne(ip: string) {
    if (value.includes(ip)) onChange(value.filter(v => v !== ip));
    else onChange([...value, ip]);
  }

  return (
    <div className="flex flex-col gap-2 pb-5">
      <div className="flex items-center gap-4">
        <span className="eyebrow">Select Targets</span>
        {servers.length > 0 && (
          <button onClick={toggleAll} className="flex items-center gap-1.5 text-[11px] text-[var(--text-sub)] hover:text-[var(--text)] transition-colors">
            {allSelected ? <CheckSquare size={14} className="text-[var(--amber)]" /> : <Square size={14} />}
            Select All
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {servers.map((s) => {
          const active = value.includes(s.ip);
          return (
            <button
              key={s.id}
              onClick={() => toggleOne(s.ip)}
              className={[
                "mono flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors",
                active
                  ? "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)]"
                  : "border-[var(--border-c)] bg-[var(--bg-card)] text-[var(--text-sub)] hover:border-[var(--amber)]/40 hover:text-[var(--text)]",
              ].join(" ")}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background:
                    s.status === "online" ? "var(--ok)" : s.status === "warning" ? "var(--warn)" : s.status === "critical" ? "var(--crit)" : "var(--text-sub)",
                }}
              />
              {s.name} ({s.ip})
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function HorizonPlugin() {  const id = useRouterState({ select: (s) => s.location.pathname }).split("/").pop() as any;
  const [plugin, setPlugin] = useState<PluginEntity | null>(null);
  const [serverIps, setServerIps] = useState<string[]>([]);
  const [jobs, setJobs] = useState<JobState[]>([]);
  const [selectedTabIp, setSelectedTabIp] = useState<string>("");

  useEffect(() => {
    fetch(getApiUrl(`/plugins`))
      .then(r => r.json())
      .then(data => setPlugin(data.find((p: PluginEntity) => p.id === id) || null))
      .catch(() => toast.error("Failed to load plugin details"));
  }, [id]);

  function fetchJobs() {
    fetch(getApiUrl(`/plugins/${id}/jobs`))
      .then(r => r.json())
      .then(data => {
        setJobs(data);
        if (!selectedTabIp && data.length > 0) {
          setSelectedTabIp(data[0].serverIp);
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 2000);
    return () => clearInterval(interval);
  }, [id, selectedTabIp]);

  function runPlugin() {
    if (serverIps.length === 0) return toast.error("Select at least one server");

    const queryParams = serverIps.map(ip => `serverIps=${encodeURIComponent(ip)}`).join("&");

    fetch(getApiUrl(`/plugins/${id}/run?${queryParams}`), {
      method: "POST"
    })
      .then(r => r.json())
      .then(() => {
        toast.success("Plugin execution started in background");
        if (serverIps.length > 0) setSelectedTabIp(serverIps[0]);
        fetchJobs();
      })
      .catch(err => toast.error(`Failed to execute plugin: ${err.message}`));
  }

  function stopAll() {
    fetch(getApiUrl(`/plugins/${id}/stop`), { method: "POST" })
      .then(r => r.json())
      .then(() => {
        toast.success("Stop command issued to all running jobs");
        fetchJobs();
      })
      .catch(() => toast.error("Failed to stop jobs"));
  }

  function stopOne(ip: string) {
    fetch(getApiUrl(`/plugins/${id}/stop?serverIp=${encodeURIComponent(ip)}`), { method: "POST" })
      .then(r => r.json())
      .then(() => {
        toast.success(`Stop command issued for ${ip}`);
        fetchJobs();
      })
      .catch(() => toast.error(`Failed to stop job on ${ip}`));
  }

  if (!plugin) return <div className="max-w-[1600px] mx-auto space-y-8 font-sans"><div className="text-[12px] text-[var(--text-sub)]">Loading plugin...</div></div>;

  const hasRunningJobs = jobs.some(j => j.status === "Running");
  const selectedJob = jobs.find(j => j.serverIp === selectedTabIp);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><h2 className="text-3xl font-extrabold text-[var(--text)]">{plugin.name}</h2><p className="text-sm text-[var(--text-sub)] mt-1">{plugin.description}</p></div></div>

      <div className="nx-card p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row flex-wrap gap-4 md:items-end justify-between">
          <div className="flex-1 min-w-[300px] w-full">
            <MultiServerSelector value={serverIps} onChange={setServerIps} />
          </div>
          <div className="pb-0 md:pb-5 flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
            <button 
              onClick={runPlugin} 
              disabled={serverIps.length === 0}
              className="flex h-9 items-center gap-2 rounded-md bg-[var(--amber)] px-4 text-[12px] font-semibold text-[var(--bg-void)] hover:bg-[var(--amber-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play size={14} />
              Run Plugin
            </button>
            {hasRunningJobs && (
              <button 
                onClick={stopAll} 
                className="flex h-9 items-center gap-2 rounded-md bg-[var(--crit)]/20 border border-[var(--crit)]/40 px-4 text-[12px] font-semibold text-[var(--crit)] hover:bg-[var(--crit)] hover:text-black transition-colors"
              >
                <StopCircle size={14} />
                Stop All Running
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] gap-4 md:gap-5 h-auto md:h-[550px]">
        <aside className="nx-card p-3 flex flex-col gap-2 max-h-60 md:max-h-none overflow-y-auto">
          <div className="eyebrow px-1 pb-2">Active &amp; Recent Jobs</div>
          {jobs.length === 0 && (
            <div className="text-[11px] text-[var(--text-sub)] px-1 py-4 text-center">No jobs active. Select targets above and click Run Plugin.</div>
          )}
          {jobs.map(j => {
            const isSelected = j.serverIp === selectedTabIp;
            const statusColor = j.status === "Running" ? "var(--amber)" : j.status === "Completed" ? "var(--ok)" : j.status === "Failed" ? "var(--crit)" : "var(--text-sub)";
            return (
              <button
                key={j.serverIp}
                onClick={() => setSelectedTabIp(j.serverIp)}
                className={`flex flex-col items-start gap-1 rounded-md p-2.5 text-[12px] border transition-all ${isSelected ? "bg-[var(--amber-low)] border-[var(--amber)]/40 text-[var(--amber)]" : "bg-[var(--bg-surface)] border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--text)]"}`}
              >
                <div className="flex items-center justify-between w-full font-medium">
                  <span className="flex items-center gap-1.5 mono">
                    <ServerIcon size={12} />
                    {j.serverIp}
                  </span>
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: statusColor }} />
                </div>
                <div className="flex items-center justify-between w-full text-[10px] text-[var(--text-sub)] mono mt-1">
                  <span>{j.status}</span>
                  {j.status === "Running" && (
                    <span className="text-[var(--amber)] animate-pulse font-semibold">Live</span>
                  )}
                </div>
              </button>
            );
          })}
        </aside>

        <div className="nx-card flex flex-col h-[400px] md:h-full overflow-hidden">
          <div className="border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-3 md:px-4 py-2 md:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TerminalIcon size={14} className="text-[var(--text-sub)]" />
              <span className="mono text-[11px] uppercase tracking-wider text-[var(--text-sub)]">
                Output Console {selectedTabIp ? `— ${selectedTabIp}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {selectedJob && selectedJob.status === "Running" && (
                <button
                  onClick={() => stopOne(selectedJob.serverIp)}
                  className="mono flex items-center gap-1 rounded bg-[var(--crit)]/10 border border-[var(--crit)]/30 px-2.5 py-1 text-[11px] font-medium text-[var(--crit)] hover:bg-[var(--crit)] hover:text-black transition-colors"
                >
                  <StopCircle size={12} /> Stop Machine
                </button>
              )}
              <span className="mono text-[11px] text-[var(--text-sub)]">[{plugin.scriptType}]</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-[#0a0a0a] p-4">
            {selectedJob ? (
              <pre className="mono text-[12px] text-[var(--ok)] leading-relaxed whitespace-pre-wrap">{selectedJob.output || "Connecting to native session..."}</pre>
            ) : (
              <div className="text-[12px] text-[var(--text-sub)] text-center py-12">Select a machine from the left sidebar to view its live execution log.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

