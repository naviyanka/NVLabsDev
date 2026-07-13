import { createFileRoute } from "@tanstack/react-router";
import { getApiUrl } from "@/lib/backend";
import { useEffect, useState, useContext } from "react";
import { toast } from "sonner";
import { RefreshCw, Download } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { testNotificationClient } from "@/api/client";
import { HorizonSettings } from "../themes/horizon/pages/HorizonSettings";
import { getBackendUrl, setBackendUrl, clearBackendUrl, testBackendConnection } from "@/lib/backend";
import { ThemeContext } from "./__root";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Global Settings — NEXUS" }] }),
  component: GlobalSettingsPage,
});

const SECTIONS = [
  "General",
  "Appearance",
  "Security & Access",
  "Monitoring & Alerts",
  "Data & Maintenance",
  "Extensions",
  "Testing & Diagnostics",
  "Backend Logs"
] as const;

interface AppSettings {
  id: string;
  language: string;
  defaultLandingPage: string;
  autoRefreshInterval: number;
  theme: "dark" | "light" | "slate" | "stealth" | "cyberpunk" | "infrared" | "horizon";
  uiDensity: string;
  animationsEnabled: boolean;
  adSyncInterval: number;
  sessionTimeout: number;
  mfaRequired: boolean;
  cpuAlertThreshold: number;
  ramAlertThreshold: number;
  notificationEmail: string;
  webhookUrl: string;
  telemetryRetentionDays: number;
  logLevel: string;
  pluginCategories: string;
  terminalTheme: string;
}

const TERMINAL_THEMES: { id: string; name: string; bg: string; prompt: string; output: string; cursor: string }[] = [
  { id: "nexus-dark",   name: "Nexus Dark",     bg: "#050508", prompt: "#f59e0b", output: "#94a3b8", cursor: "#f59e0b" },
  { id: "win-classic", name: "Win Classic",    bg: "#0c0c0c", prompt: "#cccccc", output: "#cccccc", cursor: "#ffffff" },
  { id: "matrix",      name: "Matrix",         bg: "#020e02", prompt: "#00ff41", output: "#009921", cursor: "#00ff41" },
  { id: "solarized",   name: "Solarized Dark", bg: "#002b36", prompt: "#268bd2", output: "#839496", cursor: "#268bd2" },
  { id: "dracula",     name: "Dracula",         bg: "#282a36", prompt: "#ff79c6", output: "#f8f8f2", cursor: "#bd93f9" },
  { id: "cobalt",      name: "Cobalt Blue",    bg: "#001e3c", prompt: "#00bcd4", output: "#b0bec5", cursor: "#00bcd4" },
  { id: "monokai",     name: "Monokai",        bg: "#272822", prompt: "#e6db74", output: "#f8f8f2", cursor: "#a6e22e" },
  { id: "nord",        name: "Nord",           bg: "#2e3440", prompt: "#88c0d0", output: "#d8dee9", cursor: "#88c0d0" },
];

function GlobalSettingsPage() {
  const { theme } = useContext(ThemeContext);
  if (theme === 'horizon') return <HorizonSettings />;

  const [s, setS] = useState<AppSettings | null>(null);
  const [sec, setSec] = useState<(typeof SECTIONS)[number]>("General");
  const [logs, setLogs] = useState<string[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [exportTimeFilter, setExportTimeFilter] = useState("all");
  const [logsEnabled, setLogsEnabled] = useState(true);

  // Backend Connection State
  const [backendInput, setBackendInput] = useState(getBackendUrl());
  const [backendStatus, setBackendStatus] = useState<"unknown" | "testing" | "success" | "error">("unknown");

  function fetchLogs() {
    setLoadingLogs(true);
    fetch(getApiUrl("/settings/logs"))
      .then(res => res.json())
      .then(data => {
        // Cap log array to bound memory growth in long-running sessions
        setLogs((data.logs || []).slice(0, 500));
        if (data.enabled !== undefined) setLogsEnabled(data.enabled);
      })
      .catch(() => toast.error("Failed to fetch logs"))
      .finally(() => setLoadingLogs(false));
  }

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch(getApiUrl("/settings"))
      .then(res => res.json())
      .then(data => {
        setS(data);
        document.documentElement.setAttribute("data-theme", data.theme);
      })
      .catch(err => toast.error("Failed to load settings"));
  }, []);

  function patch(p: Partial<AppSettings>) {
    if (!s) return;
    const next = { ...s, ...p };
    setS(next);
    if (p.theme) {
      document.documentElement.setAttribute("data-theme", p.theme);
      try { localStorage.setItem("nexus-theme", p.theme); } catch(e) {}
      window.dispatchEvent(new CustomEvent('nexus-theme-change', { detail: { theme: p.theme } }));
    }
    if (p.terminalTheme) {
      document.documentElement.setAttribute("data-terminal-theme", p.terminalTheme);
      try { localStorage.setItem("nexus-terminal-theme", p.terminalTheme); } catch(e) {}
    }
    if (p.animationsEnabled !== undefined) {
      try { localStorage.setItem("nexus-animations", p.animationsEnabled ? "true" : "false"); } catch(e) {}
      if (!p.animationsEnabled) {
        document.documentElement.classList.add("no-animations");
      } else {
        document.documentElement.classList.remove("no-animations");
      }
    }
    
    fetch(getApiUrl("/settings"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next)
    }).then(res => {
      if(res.ok) toast.success("Settings saved");
      else toast.error("Failed to save settings");
    });
  }

  if (!s) return <PageWrapper><div className="text-[12px] text-[var(--text-sub)]">Loading…</div></PageWrapper>;

  return (
    <PageWrapper>
      <PageHeader eyebrow="App Management" title="Global Settings" />
      <div className="grid grid-cols-[220px_1fr] gap-5 mt-4">
        <aside className="nx-card h-fit p-2">
          {SECTIONS.map((x) => (
            <button key={x} onClick={() => setSec(x)} className={"flex w-full items-center rounded-md px-3 py-2 text-left text-[12px] " + (sec === x ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)]")}>{x}</button>
          ))}
        </aside>
        <div className="nx-card p-6">
          {sec === "General" && (
            <Group title="General Settings">
              <div className="mb-6 rounded-lg border border-[var(--border-dim)] bg-[var(--bg-card)] p-4 shadow-sm">
                <div className="flex items-center justify-between pb-3">
                  <h3 className="font-semibold text-[14px]">Backend Connection</h3>
                  {backendStatus === "testing" && <span className="text-[12px] text-[var(--amber)] animate-pulse">Testing...</span>}
                  {backendStatus === "success" && <span className="text-[12px] text-[var(--ok)] font-medium flex items-center gap-1">Connected</span>}
                  {backendStatus === "error" && <span className="text-[12px] text-rose-400 font-medium">Connection Failed</span>}
                </div>
                <p className="text-[12px] text-[var(--text-sub)] pb-4">
                  Set a custom backend URL (e.g., ngrok, Cloudflare Tunnel) if hosting the frontend remotely. Leave blank for local development.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={backendInput}
                    onChange={(e) => setBackendInput(e.target.value)}
                    placeholder="https://abc1234.ngrok-free.app"
                    className="flex-1 mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                  />
                  <button 
                    onClick={async () => {
                      setBackendStatus("testing");
                      const ok = await testBackendConnection(backendInput);
                      setBackendStatus(ok ? "success" : "error");
                    }}
                    className="px-3 py-2 text-[12px] rounded border border-[var(--border-c)] hover:bg-[var(--bg-surface)]"
                  >
                    Test
                  </button>
                  <button 
                    onClick={() => {
                      if (!backendInput.trim()) clearBackendUrl();
                      else setBackendUrl(backendInput);
                      toast.success("Backend URL saved. Reloading app...");
                      setTimeout(() => window.location.reload(), 1000);
                    }}
                    className="px-4 py-2 text-[12px] font-medium rounded bg-[var(--amber)] text-black hover:bg-[var(--amber-low)] hover:text-[var(--amber)] transition-colors"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => {
                      setBackendInput("");
                      clearBackendUrl();
                      toast.success("Reverted to local backend. Reloading...");
                      setTimeout(() => window.location.reload(), 1000);
                    }}
                    className="px-3 py-2 text-[12px] rounded border border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <Row label="Language / Locale">
                <select value={s.language} onChange={(e) => patch({ language: e.target.value })} className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px]">
                  {["en-US", "en-GB", "fr-FR", "de-DE"].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Row>
              <Row label="Default Landing Page">
                <select value={s.defaultLandingPage} onChange={(e) => patch({ defaultLandingPage: e.target.value })} className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px]">
                  {["dashboard", "servers", "alerts"].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Row>
              <Row label={`Auto-refresh interval: ${s.autoRefreshInterval}s`}>
                <input type="range" min={5} max={120} step={5} value={s.autoRefreshInterval} onChange={(e) => patch({ autoRefreshInterval: +e.target.value })} className="w-full accent-[var(--amber)]" />
              </Row>
            </Group>
          )}

          {sec === "Appearance" && (
            <Group title="Appearance">
              <Row label="Theme">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "dark", name: "Signal Room (Dark)", preview: "#09090f" },
                    { id: "light", name: "Pure Light", preview: "#f8fafc" },
                    { id: "slate", name: "Slate", preview: "#0f172a" },
                    { id: "stealth", name: "Stealth (OLED)", preview: "#000000" },
                    { id: "cyberpunk", name: "Cyberpunk Neon", preview: "hsl(255,20%,4%)", accent: "#00e5ff" },
                    { id: "infrared", name: "🔮 Infrared Command", preview: "#05050a", accent: "#7c3aed" },
                    { id: "horizon", name: "🌅 Horizon Luminous Day", preview: "#fafaf9", accent: "#ff5e3a" },
                  ].map(t => (
                    <button key={t.id} onClick={() => patch({ theme: t.id as AppSettings["theme"] })}
                      style={s.theme === t.id && t.accent ? { borderColor: t.accent, background: `${t.accent}18`, color: t.accent } : {}}
                      className={"p-3 rounded-md border text-[12px] text-center transition-all " +
                        (s.theme === t.id
                          ? (t.accent ? "" : "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)]")
                          : "border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)] hover:border-[var(--amber)]/40")}>
                      <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: t.accent || "var(--amber)" }}></span>
                      {t.name}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label="UI Density">
                <select value={s.uiDensity} onChange={(e) => patch({ uiDensity: e.target.value })} className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px]">
                  {["comfortable", "compact"].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Row>
              <Toggle label="Enable Animations" on={s.animationsEnabled} onChange={(v) => patch({ animationsEnabled: v })} />

              {/* ── Terminal Theme ─────────────────────────────── */}
              <div className="pt-2">
                <label className="mb-3 block text-[12px] text-[var(--text-sub)]">PowerShell Terminal Theme</label>
                <div className="grid grid-cols-4 gap-3">
                  {TERMINAL_THEMES.map(t => {
                    const active = (s.terminalTheme ?? "nexus-dark") === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => patch({ terminalTheme: t.id })}
                        className={"rounded-lg border-2 overflow-hidden transition-all " + (active ? "border-[var(--amber)] scale-[1.02]" : "border-[var(--border-c)] hover:border-[var(--amber)]/50")}
                        title={t.name}
                      >
                        {/* Miniature terminal preview */}
                        <div style={{ background: t.bg, padding: "8px 10px", fontFamily: "monospace", fontSize: "9px", lineHeight: "1.5", textAlign: "left" }}>
                          <div style={{ color: t.prompt }}>PS C:\&gt; <span style={{ color: t.output }}>Get-Process</span></div>
                          <div style={{ color: t.output }}>Name      CPU</div>
                          <div style={{ color: t.output }}>svchost   1.2</div>
                          <div style={{ display: "flex" }}>
                            <span style={{ color: t.prompt }}>PS C:\&gt; </span>
                            <span style={{ display: "inline-block", background: t.cursor, color: t.bg, minWidth: "6px", marginLeft: "2px" }}>&nbsp;</span>
                          </div>
                        </div>
                        <div style={{ background: t.bg, borderTop: `1px solid ${t.prompt}22`, padding: "4px 8px", color: t.prompt, fontSize: "9px", fontFamily: "monospace", textAlign: "center" }}>
                          {t.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Group>
          )}

          {sec === "Security & Access" && (
            <Group title="Security & Access">
              <Row label={`AD Sync Interval: ${s.adSyncInterval}m`}>
                <input type="range" min={5} max={1440} step={5} value={s.adSyncInterval} onChange={(e) => patch({ adSyncInterval: +e.target.value })} className="w-full accent-[var(--amber)]" />
              </Row>
              <Row label={`Session Timeout: ${s.sessionTimeout}m`}>
                <input type="range" min={5} max={120} step={5} value={s.sessionTimeout} onChange={(e) => patch({ sessionTimeout: +e.target.value })} className="w-full accent-[var(--amber)]" />
              </Row>
              <Toggle label="Require MFA for Admins" on={s.mfaRequired} onChange={(v) => patch({ mfaRequired: v })} />
            </Group>
          )}

          {sec === "Monitoring & Alerts" && (
            <Group title="Monitoring & Alerts">
              <Row label={`CPU Alert Threshold: ${s.cpuAlertThreshold}%`}>
                <input type="range" min={50} max={100} step={1} value={s.cpuAlertThreshold} onChange={(e) => patch({ cpuAlertThreshold: +e.target.value })} className="w-full accent-[var(--amber)]" />
              </Row>
              <Row label={`RAM Alert Threshold: ${s.ramAlertThreshold}%`}>
                <input type="range" min={50} max={100} step={1} value={s.ramAlertThreshold} onChange={(e) => patch({ ramAlertThreshold: +e.target.value })} className="w-full accent-[var(--amber)]" />
              </Row>
              <Row label="Notification Email"><Input value={s.notificationEmail} onChange={(v) => patch({ notificationEmail: v })} /></Row>
              <Row label="Webhook URL (Slack/Teams)"><Input value={s.webhookUrl} onChange={(v) => patch({ webhookUrl: v })} /></Row>
            </Group>
          )}

          {sec === "Data & Maintenance" && (
            <Group title="Data & Maintenance">
              <Row label={`Telemetry Retention: ${s.telemetryRetentionDays} days`}>
                 <select value={s.telemetryRetentionDays} onChange={(e) => patch({ telemetryRetentionDays: +e.target.value })} className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px]">
                  {[7, 14, 30, 90, 365].map((x) => <option key={x} value={x}>{x} days</option>)}
                 </select>
              </Row>
              <Row label="Log Level">
                <select value={s.logLevel} onChange={(e) => patch({ logLevel: e.target.value })} className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px]">
                  {["debug", "info", "warn", "error"].map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </Row>
              
              <div className="flex gap-2 pt-5">
                <button className="mono rounded-md border border-[var(--amber)] bg-[var(--amber-low)] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--amber)] hover:bg-[var(--amber)] hover:text-[var(--bg-void)] transition-colors">Backup Database</button>
                <button className="mono rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:text-[var(--text)] transition-colors">Clear Caches</button>
              </div>
            </Group>
          )}

          {sec === "Extensions" && (
            <Group title="Extension Management">
              <Row label="Plugin Categories (comma separated)">
                <Input value={s.pluginCategories || "Management,Security,Infrastructure,Advanced"} onChange={(v) => patch({ pluginCategories: v })} />
              </Row>
              <div className="text-[12px] text-[var(--text-sub)] mt-2">
                Categories are used to group plugins in the left navigation menu. To add a new category, simply add it to the comma-separated list above.
              </div>
            </Group>
          )}

          {sec === "Testing & Diagnostics" && (
            <Group title="Testing & Diagnostics">
              <div className="text-[12px] text-[var(--text-sub)] mb-4">
                Use these tools to verify system connectivity and push notifications.
              </div>
              <Row label="SignalR Notifications">
                <div className="flex items-center gap-3">
                  <button onClick={() => testNotificationClient("Info", "Test Info Notification")} className="rounded bg-[var(--blue)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--blue)] hover:bg-[var(--blue)]/20 border border-[var(--blue)]/20">Info</button>
                  <button onClick={() => testNotificationClient("Success", "Test Success Notification")} className="rounded bg-[var(--ok)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--ok)] hover:bg-[var(--ok)]/20 border border-[var(--ok)]/20">Success</button>
                  <button onClick={() => testNotificationClient("Warning", "Test Warning Notification")} className="rounded bg-[var(--warn)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--warn)] hover:bg-[var(--warn)]/20 border border-[var(--warn)]/20">Warning</button>
                  <button onClick={() => testNotificationClient("Critical", "Test Critical Notification")} className="rounded bg-[var(--crit)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--crit)] hover:bg-[var(--crit)]/20 border border-[var(--crit)]/20">Critical</button>
                </div>
              </Row>
            </Group>
          )}

          {sec === "Backend Logs" && (
            <Group title="Backend Live Logs & Export">
              <div className="text-[12px] text-[var(--text-sub)] mb-4">
                Monitor live ASP.NET Core &amp; Kestrel server telemetry. Use the export tools to download complete logs or filter by specific timeframes.
              </div>
              <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)]">
                <div className="flex items-center gap-2 mr-auto">
                  <button 
                    onClick={() => {
                      fetch(getApiUrl("/settings/logs/toggle"), { method: "POST" })
                        .then(res => res.json())
                        .then(data => {
                          setLogsEnabled(data.enabled);
                          toast.success(data.enabled ? "Backend logging enabled" : "Backend logging disabled");
                        })
                        .catch(() => toast.error("Failed to toggle logging"));
                    }}
                    className={`mono flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium border transition-all ${logsEnabled ? "bg-[var(--ok)]/10 text-[var(--ok)] border-[var(--ok)]/30 hover:bg-[var(--ok)]/20" : "bg-[var(--border-c)] text-[var(--text-sub)] border-[var(--border-c)] hover:bg-[var(--border-c)]/80"}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${logsEnabled ? "bg-[var(--ok)] animate-pulse" : "bg-[var(--text-sub)]"}`}></span>
                    {logsEnabled ? "Logging: ON (3-Day Retention)" : "Logging: OFF"}
                  </button>

                  <button onClick={fetchLogs} className="mono flex items-center gap-1.5 rounded bg-[var(--amber-low)] px-3 py-1.5 text-[11px] font-medium text-[var(--amber)] border border-[var(--amber)]/30 hover:bg-[var(--amber)] hover:text-black transition-all">
                    <RefreshCw size={12} className={loadingLogs ? "animate-spin" : ""} /> Refresh Live Stream
                  </button>
                  <span className="text-[11px] text-[var(--text-ghost)]">({logs.length} lines captured)</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <select 
                    value={exportTimeFilter} 
                    onChange={(e) => setExportTimeFilter(e.target.value)}
                    className="mono rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-2.5 py-1.5 text-[11px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                  >
                    <option value="all">All Available Logs</option>
                    <option value="5">Last 5 Minutes</option>
                    <option value="15">Last 15 Minutes</option>
                    <option value="60">Last 1 Hour</option>
                  </select>
                  
                  <button 
                    onClick={() => {
                      let filtered = logs;
                      if (exportTimeFilter !== "all") {
                        const mins = parseInt(exportTimeFilter, 10);
                        const cutoff = new Date(Date.now() - mins * 60000);
                        filtered = logs.filter(line => {
                          const match = line.match(/^\[(\d{2}):(\d{2}):(\d{2})\]/);
                          if (!match) return true;
                          const [, h, m, s] = match;
                          const now = new Date();
                          const logTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), +h, +m, +s);
                          return logTime >= cutoff;
                        });
                      }
                      const blob = new Blob([filtered.join("\n")], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `nexus_backend_logs_${exportTimeFilter === 'all' ? 'all' : 'last_' + exportTimeFilter + 'm'}_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast.success(`Exported ${filtered.length} log lines successfully`);
                    }}
                    className="mono flex items-center gap-1.5 rounded bg-[var(--ok)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--ok)] border border-[var(--ok)]/20 hover:bg-[var(--ok)]/20 transition-all"
                  >
                    <Download size={12} /> Export Logs
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border-c)] bg-[#09090b] overflow-hidden shadow-2xl w-full">
                <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[#18181b] px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="mono text-[11px] font-medium text-[var(--text)] tracking-wider uppercase">Kestrel / ASP.NET Core Live Monitor</span>
                  </div>
                  <div className="mono text-[10px] text-[var(--text-ghost)]">AUTO-POLLING (5s)</div>
                </div>
                <div className="p-4 mono text-[11px] leading-relaxed text-[var(--text-sub)] overflow-y-auto max-h-[500px] space-y-1 select-text scrollbar-thin">
                  {logs.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-ghost)]">No logs captured yet...</div>
                  ) : (
                    logs.map((log, i) => {
                      let color = "text-slate-300";
                      if (log.includes("[Error]")) color = "text-rose-400 font-medium bg-rose-500/10 px-1 rounded";
                      else if (log.includes("[Warning]")) color = "text-amber-400 font-medium bg-amber-500/10 px-1 rounded";
                      else if (log.includes("[Information]")) color = "text-sky-300";
                      return <div key={i} className={`whitespace-pre-wrap font-mono ${color}`}>{log}</div>;
                    })
                  )}
                </div>
              </div>
            </Group>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (<div><div className="eyebrow pb-1">{title}</div><h2 className="display pb-5 text-[18px] font-semibold">{title}</h2><div className="space-y-4">{children}</div></div>);
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[200px_1fr] items-center gap-4">
      <label className="text-[12px] text-[var(--text-sub)]">{label}</label>
      <div>{children}</div>
    </div>
  );
}
function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none" />;
}
function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[var(--text-sub)]">{label}</span>
      <button onClick={() => onChange(!on)} className={"relative h-5 w-9 rounded-full transition-colors " + (on ? "bg-[var(--amber)]" : "bg-[var(--border-c)]")}>
        <span className={"absolute top-0.5 h-4 w-4 rounded-full bg-[var(--bg-void)] transition-transform " + (on ? "translate-x-4" : "translate-x-0.5")} />
      </button>
    </div>
  );
}
