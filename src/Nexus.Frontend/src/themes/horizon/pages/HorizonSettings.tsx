import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Palette, SlidersHorizontal, Terminal, FileCode, RefreshCw, Download, KeyRound, Plus, Trash2, Server, Database, Zap, DownloadCloud } from "lucide-react";
import { getApiUrl, getFullUrl, BackendHost, getBackendHosts, setBackendHosts, isBackendEnabledGlobally, setBackendEnabledGlobally, testBackendConnection, BackendPingResult } from "@/lib/backend";

interface AppSettings {
  language: string;
  defaultLandingPage: string;
  autoRefreshInterval: number;
  theme: string;
  terminalTheme: string;
  pluginCategories: string;
  apiKeys: { id: string; name: string; key: string; createdAt: string }[];
  appName?: string;
  appSubtitle?: string;
  companyLogoUrl?: string;
  sidebarState?: string;
  accentColor?: string;
  defaultWinRmPort?: number;
  requireHttpsForRemote?: boolean;
  maxConcurrentSessions?: number;
  diskAlertThreshold?: number;
  alertQuietHours?: string;
  discordWebhookUrl?: string;
  slackWebhookUrl?: string;
  maintenanceMode?: boolean;
  auditLoggingEnabled?: boolean;

  isFirstRunSetup?: boolean;
  dataDirectoryPath?: string;
  webBindingPort?: number;
  timeZoneFormat?: string;
  defaultViewMode?: string;
  showStatusBadges?: boolean;
  defaultDomainName?: string;
  trustRelationshipPresets?: string;
  psExecutionPolicy?: string;
  scriptLibraryPath?: string;
  appLoginMethod?: string;
  enableRbac?: boolean;
  healthCheckInterval?: number;
  logFilePath?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  language: "en-US",
  defaultLandingPage: "dashboard",
  autoRefreshInterval: 30,
  theme: "horizon",
  terminalTheme: "stealth",
  pluginCategories: "Management,Security,Infrastructure,Advanced,Custom",
  apiKeys: [],
  appName: "NEXUS",
  appSubtitle: "Horizon UI Shell"
};

export function HorizonSettings() {
  const [s, setS] = useState<AppSettings | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("nexus-frontend-db-settings");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return DEFAULT_SETTINGS;
  });
  const [activeSection, setActiveSection] = useState("appearance");
  const [logs, setLogs] = useState<string[]>([]);
  const [logsEnabled, setLogsEnabled] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [exportTimeFilter, setExportTimeFilter] = useState("all");

  // Backend Connection State
  const [backendHostsState, setBackendHostsState] = useState<BackendHost[]>([]);
  const [globalBackendEnabled, setGlobalBackendEnabled] = useState(true);
  const [newBackendName, setNewBackendName] = useState("");
  const [newBackendUrl, setNewBackendUrl] = useState("");
  const [pingResults, setPingResults] = useState<Record<string, BackendPingResult>>({});
  const [isPinging, setIsPinging] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setBackendHostsState(getBackendHosts());
    setGlobalBackendEnabled(isBackendEnabledGlobally());
  }, []);

  const saveHosts = (newHosts: BackendHost[]) => {
    setBackendHostsState(newHosts);
    setBackendHosts(newHosts);
  };

  const fetchLogs = () => {
    setLoadingLogs(true);
    fetch(getApiUrl("/settings/logs"))
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
        setLogsEnabled(data.enabled);
      })
      .catch(() => toast.error("Failed to fetch logs"))
      .finally(() => setLoadingLogs(false));
  };

  useEffect(() => {
    let id: any;
    if (activeSection === "developer") {
      fetchLogs();
      id = setInterval(fetchLogs, 5000);
    }
    return () => clearInterval(id);
  }, [activeSection]);

  useEffect(() => {
    fetch(getApiUrl("/settings"))
      .then(res => res.json())
      .then(data => {
        setS(data);
        localStorage.setItem("nexus-frontend-db-settings", JSON.stringify(data));
      })
      .catch(err => {
        // Silent fallback since we have localStorage
        console.warn("Using offline settings cache.");
      });
  }, []);

  function patch(updates: Partial<AppSettings>) {
    if (!s) return;
    const next = { ...s, ...updates };
    setS(next);
    localStorage.setItem("nexus-frontend-db-settings", JSON.stringify(next));
    if (updates.theme) {
      document.documentElement.setAttribute("data-theme", updates.theme);
      try { localStorage.setItem("nexus-theme", updates.theme); } catch(e) {}
      window.dispatchEvent(new CustomEvent('nexus-theme-change', { detail: { theme: updates.theme } }));
    }
    if (updates.terminalTheme) {
      document.documentElement.setAttribute("data-terminal-theme", updates.terminalTheme);
      try { localStorage.setItem("nexus-terminal-theme", updates.terminalTheme); } catch(e) {}
    }
    
    // Also dispatch branding change event
    if (updates.appName !== undefined || updates.appSubtitle !== undefined) {
      window.dispatchEvent(new CustomEvent('nexus-branding-change', { detail: { appName: next.appName, appSubtitle: next.appSubtitle } }));
    }
    
    fetch(getApiUrl("/settings"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next)
    }).then(res => {
      if(res.ok) toast.success("Settings saved successfully");
      else toast.warning("Saved locally. Backend sync failed.");
    }).catch(() => {
      toast.warning("Saved locally (Offline Mode).");
    });
  }

  if (!s) return <div className="text-xs text-[var(--text-sub)]">Loading Horizon Settings…</div>;

  const themes = [
    { id: "horizon", name: "🌅 Horizon Luminous Day", desc: "Warm coral primary, pure Luminous UI redesign", accent: "#ff5e3a" },
    { id: "dark", name: "Signal Room (Dark)", desc: "Classic dark mode for low-light environments", accent: "#e8a020" },
    { id: "light", name: "Pure Light", desc: "Ultra bright minimal light mode", accent: "#0d9488" },
    { id: "slate", name: "Slate", desc: "Cool blue-gray professional slate", accent: "#38bdf8" },
    { id: "stealth", name: "Stealth (OLED)", desc: "True black OLED stealth mode", accent: "#10b981" },
    { id: "cyberpunk", name: "Cyberpunk Neon", desc: "Neon cyberpunk glowing wireframe", accent: "#00e5ff" },
    { id: "infrared", name: "🔮 Infrared Command", desc: "Deep violet command center", accent: "#7c3aed" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--text)]">Global Settings</h1>
        <p className="text-sm text-[var(--text-sub)] mt-1">Configure your Horizon environment, plugins, and system preferences.</p>
      </div>

      {/* Settings Layout: CSS Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Nav/Quick Links) */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-[100px] flex flex-col gap-2">
            <button 
              onClick={() => setActiveSection("appearance")}
              className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${
                activeSection === "appearance" 
                  ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" 
                  : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
              }`}
            >
              <Palette size={20} />
              Appearance
            </button>
            <button 
              onClick={() => setActiveSection("general")}
              className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${
                activeSection === "general" 
                  ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" 
                  : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
              }`}
            >
              <SlidersHorizontal size={20} />
              General
            </button>
            <button 
              onClick={() => setActiveSection("developer")}
              className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${
                activeSection === "developer" 
                  ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" 
                  : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
              }`}
            >
              <Terminal size={20} />
              Developer
            </button>
            <button 
              onClick={() => setActiveSection("plugins")}
              className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${
                activeSection === "plugins" 
                  ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" 
                  : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
              }`}
            >
              <FileCode size={20} />
              Plugins
            </button>
            <button 
              onClick={() => setActiveSection("infrastructure")}
              className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${
                activeSection === "infrastructure" 
                  ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" 
                  : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
              }`}
            >
              <Terminal size={20} />
              Infrastructure
            </button>
            <button 
              onClick={() => setActiveSection("alerting")}
              className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${
                activeSection === "alerting" 
                  ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" 
                  : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
              }`}
            >
              <RefreshCw size={20} />
              Alerting
            </button>
            <button 
              onClick={() => setActiveSection("security")}
              className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${
                activeSection === "security" 
                  ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" 
                  : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
              }`}
            >
              <KeyRound size={20} />
              Admin & Security
            </button>
            <button 
              onClick={() => setActiveSection("deployment")}
              className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${
                activeSection === "deployment" 
                  ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" 
                  : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
              }`}
            >
              <DownloadCloud size={20} />
              Deployment
            </button>
            <button 
              onClick={() => setActiveSection("ad")}
              className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${
                activeSection === "ad" 
                  ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" 
                  : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
              }`}
            >
              <Database size={20} />
              Active Directory
            </button>
            <button 
              onClick={() => setActiveSection("automation")}
              className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${
                activeSection === "automation" 
                  ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" 
                  : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
              }`}
            >
              <Zap size={20} />
              Automation
            </button>
          </div>
        </div>

        {/* Right Column (Content Forms) */}
        <div className="lg:col-span-9 flex flex-col gap-8">
          {activeSection === "appearance" && (
            <section className="bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--amber)] to-[var(--teal)]"></div>
              <div className="p-6 border-b border-[var(--border-c)]">
                <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text)]">
                  <Palette size={20} className="text-[var(--amber)]" />
                  Appearance & Theme
                </h3>
                <p className="text-xs text-[var(--text-sub)] mt-1">Customize the visual interface and shell layout of your workspace.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-4">Theme Engine Mode</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {themes.map((t) => {
                      const isSelected = s.theme === t.id;
                      return (
                        <div 
                          key={t.id} 
                          onClick={() => patch({ theme: t.id })}
                          className={`cursor-pointer rounded-[1.2rem] border-2 p-5 transition-all flex flex-col gap-2 ${
                            isSelected 
                              ? "border-[var(--amber)] bg-[var(--amber-low)] shadow-md" 
                              : "border-[var(--border-c)] bg-[var(--bg-void)] hover:border-[var(--amber)]/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.accent }}></span>
                              {t.name}
                            </span>
                            {isSelected && <span className="text-[10px] font-extrabold bg-[var(--amber)] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>}
                          </div>
                          <p className="text-xs text-[var(--text-sub)]">{t.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeSection === "general" && (
            <section className="bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--amber)]"></div>
              <div className="p-6 border-b border-[var(--border-c)]">
                <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text)]">
                  <SlidersHorizontal size={20} className="text-[var(--amber)]" />
                  General Configuration
                </h3>
                <p className="text-xs text-[var(--text-sub)] mt-1">Configure global platform behavior and refresh intervals.</p>
              </div>
              <div className="p-6 space-y-6">
                {/* Backend Infrastructure Manager */}
                <div className="mb-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-void)] p-5 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-c)]">
                    <div>
                      <h3 className="font-semibold text-sm text-[var(--text)] uppercase tracking-widest flex items-center gap-2">
                        <Server size={14} className="text-[var(--amber)]" />
                        Backend Infrastructure Manager
                      </h3>
                      <p className="text-[11px] text-[var(--text-sub)] mt-1">
                        Configure local, ngrok, or Cloudflare Tunnel backend endpoints.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[var(--text-sub)] uppercase">Enable Remote Backends</span>
                      <input 
                        type="checkbox" 
                        checked={globalBackendEnabled} 
                        onChange={(e) => {
                          setGlobalBackendEnabled(e.target.checked);
                          setBackendEnabledGlobally(e.target.checked);
                          toast.success("Backend settings updated. Reloading...");
                          setTimeout(() => window.location.reload(), 1000);
                        }} 
                        className="accent-[var(--amber)] h-4 w-4" 
                      />
                    </div>
                  </div>

                  <div className={`mt-4 space-y-3 ${!globalBackendEnabled ? "opacity-50 pointer-events-none" : ""}`}>
                    {backendHostsState.map(host => {
                      const ping = pingResults[host.id];
                      const pinging = isPinging[host.id];
                      return (
                        <div key={host.id} className={`flex items-center justify-between p-3 rounded-lg border ${host.isActive ? "border-[var(--amber)] bg-[var(--amber-low)]" : "border-[var(--border-c)] bg-[var(--bg-surface)]"}`}>
                          <div className="flex items-center gap-3">
                            <input 
                              type="radio" 
                              name="activeBackend" 
                              checked={host.isActive}
                              onChange={() => {
                                const next = backendHostsState.map(h => ({ ...h, isActive: h.id === host.id }));
                                saveHosts(next);
                                toast.success("Active backend changed. Reloading...");
                                setTimeout(() => window.location.reload(), 1000);
                              }}
                              className="accent-[var(--amber)] h-4 w-4"
                            />
                            <div>
                              <div className="text-xs font-bold text-[var(--text)]">{host.name} {host.isActive && <span className="ml-2 text-[9px] bg-[var(--amber)] text-black px-1.5 py-0.5 rounded uppercase">Active</span>}</div>
                              <div className="text-[11px] text-[var(--text-sub)] font-mono">{host.url}</div>
                              {ping && (
                                <div className="mt-1 flex items-center gap-2 text-[10px] font-mono">
                                  {ping.reachable ? (
                                    <>
                                      <span className="text-[var(--ok)] flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]"></div> Reachable</span>
                                      <span className="text-[var(--text-sub)]">Ping: {ping.pingMs}ms</span>
                                    </>
                                  ) : (
                                    <span className="text-rose-400 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div> Offline ({ping.error})</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={async () => {
                                setIsPinging(p => ({ ...p, [host.id]: true }));
                                const res = await testBackendConnection(host.url);
                                setPingResults(p => ({ ...p, [host.id]: res }));
                                setIsPinging(p => ({ ...p, [host.id]: false }));
                              }}
                              disabled={pinging}
                              className="px-2 py-1 text-[10px] border border-[var(--border-c)] rounded text-[var(--text)] hover:bg-[var(--bg-void)] disabled:opacity-50 flex items-center gap-1"
                            >
                              {pinging ? <RefreshCw size={10} className="animate-spin" /> : <Zap size={10} />}
                              {pinging ? "Testing..." : "Test"}
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm("Delete this backend?")) saveHosts(backendHostsState.filter(h => h.id !== host.id));
                              }}
                              className="px-2 py-1 text-[10px] border border-[var(--border-c)] rounded text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex flex-col sm:flex-row items-center gap-2 mt-4 pt-4 border-t border-[var(--border-c)]">
                      <input 
                        type="text" 
                        placeholder="Name (e.g. CF Tunnel)" 
                        value={newBackendName}
                        onChange={e => setNewBackendName(e.target.value)}
                        className="flex-1 w-full bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--amber)]"
                      />
                      <input 
                        type="text" 
                        placeholder="URL (e.g. https://abc.trycloudflare.com)" 
                        value={newBackendUrl}
                        onChange={e => setNewBackendUrl(e.target.value)}
                        className="flex-2 w-full bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--amber)]"
                      />
                      <button 
                        onClick={() => {
                          if (!newBackendName.trim() || !newBackendUrl.trim()) return;
                          const newHost: BackendHost = {
                            id: Date.now().toString(),
                            name: newBackendName,
                            url: newBackendUrl,
                            isActive: backendHostsState.length === 0 // Make active if it's the first one
                          };
                          saveHosts([...backendHostsState, newHost]);
                          setNewBackendName("");
                          setNewBackendUrl("");
                        }}
                        className="whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]/30 hover:bg-[var(--amber)] hover:text-black flex items-center gap-1"
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-widest mb-2">App Name (Branding)</label>
                    <input 
                      type="text" 
                      value={s.appName || "NEXUS"} 
                      onChange={(e) => patch({ appName: e.target.value })} 
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors"
                      placeholder="NEXUS"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-widest mb-2">App Subtitle (Branding)</label>
                    <input 
                      type="text" 
                      value={s.appSubtitle || "Horizon UI Shell"} 
                      onChange={(e) => patch({ appSubtitle: e.target.value })} 
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors"
                      placeholder="Horizon UI Shell"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-widest mb-2">Company Logo URL</label>
                  <input 
                    type="text" 
                    value={s.companyLogoUrl || ""} 
                    onChange={(e) => patch({ companyLogoUrl: e.target.value })} 
                    className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-widest mb-2">Sidebar Default State</label>
                    <select 
                      value={s.sidebarState || "expanded"} 
                      onChange={(e) => patch({ sidebarState: e.target.value })} 
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors"
                    >
                      <option value="expanded">Expanded</option>
                      <option value="collapsed">Collapsed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-widest mb-2">Custom Accent Color (Hex)</label>
                    <input 
                      type="text" 
                      value={s.accentColor || ""} 
                      onChange={(e) => patch({ accentColor: e.target.value })} 
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors"
                      placeholder="#ffb86c"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-widest mb-2">Time Zone Format</label>
                    <select 
                      value={s.timeZoneFormat || "UTC"} 
                      onChange={(e) => patch({ timeZoneFormat: e.target.value })} 
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors"
                    >
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="Local">Local Device Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-widest mb-2">Server Fleet View</label>
                    <select 
                      value={s.defaultViewMode || "list"} 
                      onChange={(e) => patch({ defaultViewMode: e.target.value })} 
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors"
                    >
                      <option value="list">List View</option>
                      <option value="grid">Grid View</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">Show Status Badges</div>
                    <div className="text-[11px] text-[var(--text-sub)]">Display live indicators (Up/Down) on server cards.</div>
                  </div>
                  <input type="checkbox" checked={s.showStatusBadges ?? true} onChange={(e) => patch({ showStatusBadges: e.target.checked })} className="accent-[var(--amber)] h-5 w-5 rounded" />
                </div>
                <div>
                   <label className="block text-sm font-semibold text-[var(--text)] mb-2">Language / Locale</label>
                  <select 
                    value={s.language} 
                    onChange={(e) => patch({ language: e.target.value })} 
                    className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
                  >
                    {["en-US", "en-GB", "fr-FR", "de-DE"].map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Default Landing Page</label>
                  <select 
                    value={s.defaultLandingPage} 
                    onChange={(e) => patch({ defaultLandingPage: e.target.value })} 
                    className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
                  >
                    {["dashboard", "servers", "alerts"].map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Auto-refresh Interval ({s.autoRefreshInterval}s)</label>
                  <input 
                    type="range" 
                    min={5} 
                    max={120} 
                    step={5} 
                    value={s.autoRefreshInterval} 
                    onChange={(e) => patch({ autoRefreshInterval: +e.target.value })} 
                    className="w-full accent-[var(--amber)]" 
                  />
                </div>
              </div>
            </section>
          )}
          {activeSection === "developer" && (
            <section className="bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--crit)]"></div>
              <div className="p-6 border-b border-[var(--border-c)]">
                <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text)]">
                  <Terminal size={20} className="text-[var(--crit)]" />
                  Developer Settings
                </h3>
                <p className="text-xs text-[var(--text-sub)] mt-1">Configure advanced settings, API keys, and logs.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text)] mb-4 border-b border-[var(--border-c)] pb-2 flex items-center justify-between">
                    API Keys
                    <button 
                      onClick={() => {
                        const name = prompt("Name for new API key:");
                        if (!name) return;
                        fetch(getApiUrl("/settings/keys"), {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name })
                        })
                        .then(r => r.json())
                        .then(key => {
                          patch({ apiKeys: [...(s.apiKeys || []), key] });
                          prompt("New API Key generated. COPY THIS NOW, it won't be shown again:", key.key);
                        });
                      }}
                      className="text-[10px] bg-[var(--amber-low)] text-[var(--amber)] px-2 py-1 rounded flex items-center gap-1 hover:bg-[var(--amber)] hover:text-white transition-all"
                    >
                      <Plus size={12} /> New Key
                    </button>
                  </h4>
                  <div className="space-y-2">
                    {s.apiKeys?.length === 0 && <div className="text-xs text-[var(--text-sub)] italic">No API keys generated.</div>}
                    {s.apiKeys?.map(k => (
                      <div key={k.id} className="flex items-center justify-between bg-[var(--bg-void)] border border-[var(--border-c)] p-3 rounded-lg">
                        <div>
                          <div className="text-[12px] font-bold text-[var(--text)]">{k.name}</div>
                          <div className="text-[10px] text-[var(--text-sub)] font-mono mt-1">Created: {new Date(k.createdAt).toLocaleString()}</div>
                        </div>
                        <button 
                          onClick={() => {
                            if (!confirm("Revoke this key?")) return;
                            fetch(getApiUrl(`/settings/keys/${k.id}`), { method: "DELETE" })
                              .then(() => patch({ apiKeys: s.apiKeys.filter(x => x.id !== k.id) }));
                          }}
                          className="text-[var(--crit)] hover:bg-[var(--crit)] hover:text-white p-1.5 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[var(--text)] mb-4 border-b border-[var(--border-c)] pb-2">Backend Logs</h4>
                  <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg border border-[var(--border-c)] bg-[var(--bg-void)]">
                    <button 
                      onClick={() => {
                        fetch(getApiUrl("/settings/logs/toggle"), { method: "POST" })
                          .then(res => res.json())
                          .then(data => {
                            setLogsEnabled(data.enabled);
                            toast.success(data.enabled ? "Backend logging enabled" : "Backend logging disabled");
                          });
                      }}
                      className={`mono flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium border transition-all ${logsEnabled ? "bg-[var(--ok)]/10 text-[var(--ok)] border-[var(--ok)]/30" : "bg-[var(--border-c)] text-[var(--text-sub)]"}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${logsEnabled ? "bg-[var(--ok)] animate-pulse" : "bg-[var(--text-sub)]"}`}></span>
                      {logsEnabled ? "Logging: ON" : "Logging: OFF"}
                    </button>
                    <button onClick={fetchLogs} className="mono flex items-center gap-1.5 rounded bg-[var(--amber-low)] px-3 py-1.5 text-[11px] font-medium text-[var(--amber)]">
                      <RefreshCw size={12} className={loadingLogs ? "animate-spin" : ""} /> Refresh
                    </button>
                  </div>
                  
                  <div className="rounded-lg border border-[var(--border-c)] bg-[#09090b] overflow-hidden">
                    <div className="p-4 mono text-[11px] text-[var(--text-sub)] overflow-y-auto max-h-[300px] space-y-1">
                      {logs.length === 0 ? (
                        <div className="text-center py-4">No logs captured...</div>
                      ) : (
                        logs.map((log, i) => <div key={i}>{log}</div>)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeSection === "plugins" && (
            <section className="bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--teal)]"></div>
              <div className="p-6 border-b border-[var(--border-c)]">
                <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text)]">
                  <FileCode size={20} className="text-[var(--teal)]" />
                  Plugin Settings
                </h3>
                <p className="text-xs text-[var(--text-sub)] mt-1">Configure global plugin behavior and categories.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Plugin Categories (comma separated)</label>
                  <input 
                    type="text" 
                    value={s.pluginCategories || "Management,Security,Infrastructure,Advanced,Custom"} 
                    onChange={(e) => patch({ pluginCategories: e.target.value })} 
                    className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
                  />
                  <p className="text-[11px] text-[var(--text-sub)] mt-2">Categories are used to group plugins in the left navigation menu.</p>
                </div>
                <div className="pt-6 border-t border-[var(--border-c)]">
                  <button 
                    onClick={() => window.location.href = '/plugins'}
                    className="flex items-center gap-2 rounded-xl border border-[var(--amber)] bg-[var(--amber-low)] px-4 py-2.5 text-sm font-semibold text-[var(--amber)] transition-colors hover:bg-[var(--amber)] hover:text-black"
                  >
                    <FileCode size={16} /> Open Plugin Manager
                  </button>
                  <p className="text-xs text-[var(--text-sub)] mt-2">Use the Plugin Manager to enable or disable features like PowerShell, Processes, Performance, and Security.</p>
                </div>
              </div>
            </section>
          )}
          {activeSection === "infrastructure" && (
            <section className="bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--text)]"></div>
              <div className="p-6 border-b border-[var(--border-c)]">
                <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text)]">
                  <Terminal size={20} className="text-[var(--text)]" />
                  Infrastructure & Connection
                </h3>
                <p className="text-xs text-[var(--text-sub)] mt-1">Configure remote connections and session limits.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Default WinRM Port</label>
                  <input type="number" value={s.defaultWinRmPort || 5985} onChange={(e) => patch({ defaultWinRmPort: parseInt(e.target.value) })} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">Require HTTPS for Remote</div>
                    <div className="text-[11px] text-[var(--text-sub)]">Force PowerShell and terminal sessions to use SSL.</div>
                  </div>
                  <input type="checkbox" checked={s.requireHttpsForRemote || false} onChange={(e) => patch({ requireHttpsForRemote: e.target.checked })} className="accent-[var(--amber)] h-5 w-5 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Max Concurrent Sessions</label>
                  <input type="number" value={s.maxConcurrentSessions || 10} onChange={(e) => patch({ maxConcurrentSessions: parseInt(e.target.value) })} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]" />
                </div>
              </div>
            </section>
          )}

          {activeSection === "alerting" && (
            <section className="bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--warn)]"></div>
              <div className="p-6 border-b border-[var(--border-c)]">
                <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text)]">
                  <RefreshCw size={20} className="text-[var(--warn)]" />
                  Advanced Alerting
                </h3>
                <p className="text-xs text-[var(--text-sub)] mt-1">Configure automated incident triggers and notifications.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Health Check Interval (Seconds)</label>
                  <input type="number" value={s.healthCheckInterval || 60} onChange={(e) => patch({ healthCheckInterval: parseInt(e.target.value) })} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Log File Output Path</label>
                  <input type="text" placeholder="C:\ProgramData\Nexus\Logs" value={s.logFilePath || ""} onChange={(e) => patch({ logFilePath: e.target.value })} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Disk Alert Threshold (%)</label>
                  <input type="number" value={s.diskAlertThreshold || 90} onChange={(e) => patch({ diskAlertThreshold: parseInt(e.target.value) })} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Alert Quiet Hours</label>
                  <input type="text" placeholder="e.g. 22:00-06:00" value={s.alertQuietHours || ""} onChange={(e) => patch({ alertQuietHours: e.target.value })} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Discord Webhook URL</label>
                  <input type="text" value={s.discordWebhookUrl || ""} onChange={(e) => patch({ discordWebhookUrl: e.target.value })} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Slack Webhook URL</label>
                  <input type="text" value={s.slackWebhookUrl || ""} onChange={(e) => patch({ slackWebhookUrl: e.target.value })} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]" />
                </div>
              </div>
            </section>
          )}

          {activeSection === "security" && (
            <section className="bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--crit)]"></div>
              <div className="p-6 border-b border-[var(--border-c)]">
                <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text)]">
                  <KeyRound size={20} className="text-[var(--crit)]" />
                  Admin & Security
                </h3>
                <p className="text-xs text-[var(--text-sub)] mt-1">Global security policies and maintenance controls.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">App Login Method</label>
                  <select value={s.appLoginMethod || "Local"} onChange={(e) => patch({ appLoginMethod: e.target.value })} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]">
                    <option value="Local">Local Database Auth</option>
                    <option value="Windows">Integrated Windows Authentication</option>
                    <option value="Entra">Entra ID SSO</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-4 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">Enable Role-Based Access Control (RBAC)</div>
                    <div className="text-[11px] text-[var(--text-sub)]">Enforce Viewer, Operator, and Admin roles.</div>
                  </div>
                  <input type="checkbox" checked={s.enableRbac || false} onChange={(e) => patch({ enableRbac: e.target.checked })} className="accent-[var(--amber)] h-5 w-5 rounded" />
                </div>
                <div className="flex items-center justify-between p-4 bg-[var(--crit)]/10 border border-[var(--crit)]/30 rounded-xl">
                  <div>
                    <div className="text-sm font-bold text-[var(--crit)]">Maintenance Mode</div>
                    <div className="text-[11px] text-[var(--text-sub)]">Locks out all non-admin users across the platform.</div>
                  </div>
                  <input type="checkbox" checked={s.maintenanceMode || false} onChange={(e) => patch({ maintenanceMode: e.target.checked })} className="accent-[var(--crit)] h-5 w-5 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">Enable Audit Logging</div>
                    <div className="text-[11px] text-[var(--text-sub)]">Record every user action to the database.</div>
                  </div>
                  <input type="checkbox" checked={s.auditLoggingEnabled || false} onChange={(e) => patch({ auditLoggingEnabled: e.target.checked })} className="accent-[var(--amber)] h-5 w-5 rounded" />
                </div>
              </div>
            </section>
          )}

          {activeSection === "deployment" && (
            <section className="bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--text)]"></div>
              <div className="p-6 border-b border-[var(--border-c)]">
                <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text)]">
                  <DownloadCloud size={20} className="text-[var(--text)]" />
                  Local Environment & Deployment
                </h3>
                <p className="text-xs text-[var(--text-sub)] mt-1">Configure where NEXUS stores local data when deployed as an MSI.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">First-Run Setup Wizard</div>
                    <div className="text-[11px] text-[var(--text-sub)]">Launch guided setup if database is blank on next restart.</div>
                  </div>
                  <input type="checkbox" checked={s.isFirstRunSetup ?? true} onChange={(e) => patch({ isFirstRunSetup: e.target.checked })} className="accent-[var(--amber)] h-5 w-5 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Data Directory Path</label>
                  <input type="text" placeholder="D:\NexusData" value={s.dataDirectoryPath || ""} onChange={(e) => patch({ dataDirectoryPath: e.target.value })} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Web Binding Port</label>
                  <input type="number" value={s.webBindingPort || 5011} onChange={(e) => patch({ webBindingPort: parseInt(e.target.value) })} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]" />
                </div>
              </div>
            </section>
          )}

          {activeSection === "ad" && (
            <section className="bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--text)]"></div>
              <div className="p-6 border-b border-[var(--border-c)]">
                <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text)]">
                  <Database size={20} className="text-[var(--text)]" />
                  Active Directory Integration
                </h3>
                <p className="text-xs text-[var(--text-sub)] mt-1">Configure LDAP search roots and trusted domains.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Default Domain Name</label>
                  <input type="text" placeholder="nvlabs.com" value={s.defaultDomainName || ""} onChange={(e) => patch({ defaultDomainName: e.target.value })} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Trust Relationship Presets (Comma Separated)</label>
                  <input type="text" placeholder="child.nvlabs.com, external.local" value={s.trustRelationshipPresets || ""} onChange={(e) => patch({ trustRelationshipPresets: e.target.value })} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]" />
                </div>
              </div>
            </section>
          )}

          {activeSection === "automation" && (
            <section className="bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--text)]"></div>
              <div className="p-6 border-b border-[var(--border-c)]">
                <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text)]">
                  <Zap size={20} className="text-[var(--text)]" />
                  Automation & PowerShell
                </h3>
                <p className="text-xs text-[var(--text-sub)] mt-1">Configure global PowerShell behavior and local scripting library.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">PowerShell Execution Policy</label>
                  <select value={s.psExecutionPolicy || "RemoteSigned"} onChange={(e) => patch({ psExecutionPolicy: e.target.value })} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]">
                    <option value="Bypass">Bypass</option>
                    <option value="RemoteSigned">RemoteSigned</option>
                    <option value="Restricted">Restricted</option>
                    <option value="Unrestricted">Unrestricted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-2">Script Library Path</label>
                  <input type="text" placeholder="C:\Scripts" value={s.scriptLibraryPath || ""} onChange={(e) => patch({ scriptLibraryPath: e.target.value })} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]" />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
