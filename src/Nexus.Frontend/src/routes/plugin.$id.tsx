import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useContext } from "react";
import { Play, Terminal as TerminalIcon, CheckSquare, Square, StopCircle, Server as ServerIcon, Shield, Info, AlertTriangle } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { getServersClient as getServers, type Server } from "@/api/client";
import { getApiUrl } from "@/lib/backend";
import { toast } from "sonner";
import { PluginEntity } from "./plugins";

export const Route = createFileRoute("/plugin/$id")({
  component: PluginRunnerPage,
});

interface PluginManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  apiVersion: string;
  minGatewayVersion: string;
  capabilities: string[];
  permissions: { resource: string; actions: string[]; justification: string }[];
  lifecycleHooks: Record<string, string>;
  entryPoint: string;
  sandboxPolicy: string;
  dependsOn: string[];
}

interface PluginValidationResult {
  pluginId: string;
  isValid: boolean;
  violations: { rule: string; pattern: string; capability?: string; message: string }[];
  messages: string[];
}

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

import { ThemeContext } from "./__root";
import { HorizonPlugin } from "../themes/horizon/pages/HorizonPlugin";

function PluginRunnerPage() {
  const { theme } = useContext(ThemeContext);
  if (theme === 'horizon') return <HorizonPlugin />;
  const { id } = Route.useParams();
  const [plugin, setPlugin] = useState<PluginEntity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverIps, setServerIps] = useState<string[]>([]);
  const [jobs, setJobs] = useState<JobState[]>([]);
  const [selectedTabIp, setSelectedTabIp] = useState<string>("");
  const [manifest, setManifest] = useState<PluginManifest | null>(null);
  const [validation, setValidation] = useState<PluginValidationResult | null>(null);
  const [showSdkInfo, setShowSdkInfo] = useState(false);

  useEffect(() => {
    fetch(getApiUrl(`/plugins`))
      .then(r => {
        if (!r.ok) throw new Error("Backend offline");
        return r.json();
      })
      .then(data => {
        const found = data.find((p: PluginEntity) => p.id === id);
        if (found) {
          setPlugin(found);
          setError(null);
        } else {
          setError("Plugin not found");
        }
      })
      .catch(() => {
        toast.error("Failed to load plugin details");
        setError("Plugin data unavailable (backend offline)");
      });
  }, [id]);

  useEffect(() => {
    fetch(getApiUrl(`/plugins/${id}/manifest`))
      .then(r => { if (!r.ok) throw new Error(""); return r.json(); })
      .then(setManifest)
      .catch(() => {});

    fetch(getApiUrl(`/plugins/${id}/validate`), { method: "POST" })
      .then(r => { if (!r.ok) throw new Error(""); return r.json(); })
      .then(setValidation)
      .catch(() => {});
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

  if (error) {
    return (
      <PageWrapper>
        <div className="text-[12px] text-[var(--crit)] bg-[var(--crit)]/10 border border-[var(--crit)]/30 rounded-lg p-4 max-w-md mx-auto text-center mt-8">
          {error}
        </div>
      </PageWrapper>
    );
  }

  if (!plugin) return <PageWrapper><div className="text-[12px] text-[var(--text-sub)]">Loading plugin...</div></PageWrapper>;

  const hasRunningJobs = jobs.some(j => j.status === "Running");
  const selectedJob = jobs.find(j => j.serverIp === selectedTabIp);

  return (
    <PageWrapper>
      <PageHeader eyebrow="Extension" title={plugin.name} subtitle={plugin.description} />

      {/* SDK Info Section */}
      <div className="nx-card p-4 mb-4">
        <button
          onClick={() => setShowSdkInfo(!showSdkInfo)}
          className="flex items-center gap-2 w-full text-left"
        >
          <Info size={14} className="text-[var(--amber)]" />
          <span className="text-[12px] font-semibold text-[var(--text)]">SDK Info &amp; Permissions</span>
          <span className="ml-auto text-[11px] text-[var(--text-sub)]">{showSdkInfo ? "Hide" : "Show"}</span>
        </button>

        {showSdkInfo && manifest && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Version & Metadata */}
            <div className="flex flex-col gap-2">
              <span className="eyebrow">Metadata</span>
              <div className="flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between"><span className="text-[var(--text-sub)]">Version</span><span className="mono text-[var(--text)]">{manifest.version}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-sub)]">API Version</span><span className="mono text-[var(--text)]">{manifest.apiVersion}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-sub)]">Min Gateway</span><span className="mono text-[var(--text)]">{manifest.minGatewayVersion}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-sub)]">Entry Point</span><span className="mono text-[var(--text)]">{manifest.entryPoint}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-sub)]">Author</span><span className="text-[var(--text)]">{manifest.author}</span></div>
              </div>
            </div>

            {/* Sandbox Policy */}
            <div className="flex flex-col gap-2">
              <span className="eyebrow">Sandbox Policy</span>
              <div className="flex items-center gap-2">
                <Shield size={14} className={manifest.sandboxPolicy === "Strict" ? "text-[var(--ok)]" : manifest.sandboxPolicy === "Standard" ? "text-[var(--amber)]" : "text-[var(--crit)]"} />
                <span className="text-[12px] font-medium text-[var(--text)]">{manifest.sandboxPolicy}</span>
              </div>
              {validation && (
                <div className={`flex items-center gap-2 mt-1 text-[11px] ${validation.isValid ? "text-[var(--ok)]" : "text-[var(--crit)]"}`}>
                  {validation.isValid ? (
                    <><Shield size={12} /> Script passes validation</>
                  ) : (
                    <><AlertTriangle size={12} /> {validation.violations.length} violation(s) found</>
                  )}
                </div>
              )}
              {validation && !validation.isValid && (
                <div className="mt-2 flex flex-col gap-1">
                  {validation.violations.map((v, i) => (
                    <div key={i} className="text-[10px] text-[var(--crit)] bg-[var(--crit)]/5 border border-[var(--crit)]/20 rounded px-2 py-1">
                      {v.message}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Capabilities */}
            <div className="flex flex-col gap-2">
              <span className="eyebrow">Capabilities</span>
              <div className="flex flex-wrap gap-1.5">
                {manifest.capabilities.length === 0 && (
                  <span className="text-[11px] text-[var(--text-sub)]">No capabilities declared</span>
                )}
                {manifest.capabilities.map((cap) => (
                  <span key={cap} className="rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] mono text-[var(--text-sub)]">
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div className="flex flex-col gap-2">
              <span className="eyebrow">Permissions</span>
              <div className="flex flex-col gap-1.5">
                {manifest.permissions.length === 0 && (
                  <span className="text-[11px] text-[var(--text-sub)]">No permissions required</span>
                )}
                {manifest.permissions.map((perm, i) => (
                  <div key={i} className="text-[11px] border border-[var(--border-c)] rounded-md px-2 py-1.5 bg-[var(--bg-surface)]">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text)]">{perm.resource}</span>
                      <span className="text-[var(--text-sub)]">[{perm.actions.join(", ")}]</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-sub)] mt-0.5">{perm.justification}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lifecycle Hooks */}
            {Object.keys(manifest.lifecycleHooks).length > 0 && (
              <div className="flex flex-col gap-2 md:col-span-2">
                <span className="eyebrow">Lifecycle Hooks</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(manifest.lifecycleHooks).map((hook) => (
                    <span key={hook} className="rounded-md border border-[var(--amber)]/30 bg-[var(--amber-low)] px-2 py-0.5 text-[10px] mono text-[var(--amber)]">
                      {hook}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dependencies */}
            {manifest.dependsOn.length > 0 && (
              <div className="flex flex-col gap-2 md:col-span-2">
                <span className="eyebrow">Dependencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {manifest.dependsOn.map((dep) => (
                    <span key={dep} className="rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] mono text-[var(--text-sub)]">
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="nx-card p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div className="flex-1 min-w-[300px]">
            <MultiServerSelector value={serverIps} onChange={setServerIps} />
          </div>
          <div className="pb-5 flex items-center gap-3">
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

      <div className="grid grid-cols-[220px_1fr] gap-5 h-[550px]">
        <aside className="nx-card p-3 flex flex-col gap-2 overflow-y-auto">
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

        <div className="nx-card flex flex-col h-full overflow-hidden">
          <div className="border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-2.5 flex items-center justify-between gap-2">
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
    </PageWrapper>
  );
}
