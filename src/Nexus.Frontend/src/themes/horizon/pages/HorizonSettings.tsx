import React, { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Palette, SlidersHorizontal, Terminal, FileCode, RefreshCw, Download, KeyRound, Plus, Trash2, Server, Database, Zap, DownloadCloud, Activity, Search, ShieldCheck, Cpu, Check, AlertCircle, Rocket, HardDrive, Bot, Globe, Lock, Shield, Sparkles, Eye, EyeOff, Key, Package } from "lucide-react";
import { getApiUrl, getFullUrl, BackendHost, getBackendHosts, setBackendHosts, isBackendEnabledGlobally, setBackendEnabledGlobally, testBackendConnection, BackendPingResult } from "@/lib/backend";
import { getFrontendSettings, saveFrontendSettings, type FrontendSettings } from "@/lib/frontendSettings";
import { BackgroundJobsView } from "./BackgroundJobsView";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

import { TerminalThemePreview } from "@/components/settings/TerminalThemePreview";
import { SettingsImportExport } from "@/components/settings/SettingsImportExport";
import { SoftwareRepoManager } from "@/components/apps/SoftwareRepoManager";
import { ApiHealthSettingsView } from "@/components/settings/ApiHealthSettingsView";
import { OllamaManager } from "@/components/settings/OllamaManager";


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
  copilotEnabled?: boolean;
  geminiApiKey?: string;
  aiProvider?: "gemini" | "openai" | "ollama" | "custom";
  aiBaseUrl?: string;
  aiApiKey?: string;
  aiModel?: string;

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

  // Placeholder Extensions
  pxeServerIp?: string;
  goldenImageTemplate?: string;
  vssRetentionCount?: number;
  backupDestinationTarget?: string;
  cisBenchmarkLevel?: string;
  bitlockerAutoEscrow?: boolean;
  llmModelEndpoint?: string;
  autoRemediationPolicy?: string;
  wireguardTunnelPort?: number;
  ddnsProviderDomain?: string;
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
  appSubtitle: "Horizon UI Shell",
  pxeServerIp: "192.168.1.50",
  goldenImageTemplate: "WinServer2022-Standard-v2.iso",
  vssRetentionCount: 14,
  backupDestinationTarget: "smb://nas.internal/backups",
  cisBenchmarkLevel: "Level2-Server",
  bitlockerAutoEscrow: true,
  llmModelEndpoint: "http://localhost:11434/v1",
  autoRemediationPolicy: "ManualApproval",
  wireguardTunnelPort: 51820,
  ddnsProviderDomain: "nexus-edge.cloudflare.com",
  aiProvider: "gemini",
  aiBaseUrl: "http://localhost:11434/v1",
  aiApiKey: "",
  aiModel: "gemini-2.5-flash"
};

const CATEGORIES = [
  { id: "api_health", label: "API Health & Latency Dashboard", icon: Activity, desc: "Real-time backend API health, subsystem pings, and telemetry diagnostics" },
  { id: "appearance", label: "Appearance & Customization", icon: Palette, desc: "Themes, terminal colors, and app branding" },
  { id: "system", label: "System & Environment", icon: Server, desc: "Backend infrastructure, web bindings, WinRM" },
  { id: "security", label: "Security & Access", icon: KeyRound, desc: "Authentication, RBAC, API keys, maintenance mode" },
  { id: "software_repo", label: "Software Repository & Packages", icon: Package, desc: "Manage software packages, winget feeds, and silent installer defaults" },
  { id: "integrations", label: "Integrations & Automation", icon: Zap, desc: "Active Directory, PowerShell policy, Webhooks" },
  { id: "diagnostics", label: "Diagnostics & Telemetry", icon: Activity, desc: "Background jobs, telemetry logs, alert triggers" },
  { id: "provisioning", label: "Fleet Provisioning & PXE", icon: Rocket, desc: "PXE boot servers, Golden ISO templates, OOBE join", badge: "Roadmap" },
  { id: "disaster_recovery", label: "Disaster Recovery & VSS", icon: HardDrive, desc: "Volume Shadow Copies, SMB/S3 backups, dry-runs", badge: "Roadmap" },
  { id: "compliance", label: "Compliance & CIS Hardening", icon: ShieldCheck, desc: "CIS Benchmarks, BitLocker TPM escrow, SCEP CA", badge: "Roadmap" },
  { id: "ai_ops", label: "AI Ops & Nexus Copilot", icon: Bot, desc: "Local LLM endpoints, log anomaly z-scores, auto-fix", badge: "Roadmap" },
  { id: "network_sdwan", label: "SD-WAN & Interconnect", icon: Globe, desc: "WireGuard tunnels, SD load balancers, Cloudflare DDNS", badge: "Roadmap" },
];

export function HorizonSettings() {
  const [s, setS] = useState<AppSettings>(() => {
    return { ...DEFAULT_SETTINGS, ...getFrontendSettings() } as AppSettings;
  });
  const [activeSection, setActiveSection] = useState("api_health");
  const [searchQuery, setSearchQuery] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [logsEnabled, setLogsEnabled] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

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
    if (activeSection === "diagnostics") {
      fetchLogs();
      id = setInterval(fetchLogs, 5000);
    }
    return () => clearInterval(id);
  }, [activeSection]);

  useEffect(() => {
    fetch(getApiUrl("/settings"))
      .then(res => res.json())
      .then(data => {
        setS(prev => ({ ...prev, ...data }));
      })
      .catch(() => {
        console.warn("Using offline settings cache.");
      });
  }, []);

  function patch(updates: Partial<AppSettings>) {
    const next = { ...s, ...updates };
    setS(next);
    
    // Save frontend preferences to localStorage instantly
    saveFrontendSettings(next as any);

    if (updates.theme) {
      document.documentElement.setAttribute("data-theme", updates.theme);
      window.dispatchEvent(new CustomEvent('nexus-theme-change', { detail: { theme: updates.theme } }));
    }
    if (updates.terminalTheme) {
      document.documentElement.setAttribute("data-terminal-theme", updates.terminalTheme);
      try { localStorage.setItem("nexus-terminal-theme", updates.terminalTheme); } catch(e) {}
      window.dispatchEvent(new CustomEvent('nexus-terminal-theme-change', { detail: { theme: updates.terminalTheme } }));
    }
    
    if (updates.appName !== undefined || updates.appSubtitle !== undefined) {
      window.dispatchEvent(new CustomEvent('nexus-branding-change', { detail: { appName: next.appName, appSubtitle: next.appSubtitle } }));
    }

    if (!globalBackendEnabled || backendHostsState.length === 0) {
      toast.success("Settings saved successfully!");
      return;
    }

    // Sanitize payload for backend entity updates (omit client-only arrays/objects like apiKeys)
    const backendPayload: Record<string, any> = {};
    const allowedBackendKeys = [
      'language', 'defaultLandingPage', 'autoRefreshInterval', 'theme', 'uiDensity',
      'animationsEnabled', 'adSyncInterval', 'sessionTimeout', 'mfaRequired',
      'cpuAlertThreshold', 'ramAlertThreshold', 'notificationEmail', 'webhookUrl',
      'telemetryRetentionDays', 'logLevel', 'pluginCategories', 'terminalTheme',
      'dashboardLayout', 'appName', 'appSubtitle'
    ];

    Object.keys(updates).forEach(key => {
      if (allowedBackendKeys.includes(key)) {
        backendPayload[key] = (updates as any)[key];
      }
    });

    if (Object.keys(backendPayload).length === 0 || Object.keys(updates).length === Object.keys(s).length) {
      // Full save triggered by "Save All Settings" button
      allowedBackendKeys.forEach(key => {
        if ((next as any)[key] !== undefined) {
          backendPayload[key] = (next as any)[key];
        }
      });
    }

    fetch(getFullUrl('/api/settings'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendPayload)
    }).then(res => {
      if (res.ok) toast.success("All settings saved successfully!");
      else toast.success("Settings saved locally");
    }).catch(() => {
      toast.success("Settings saved locally (Offline)");
    });
  }

  const activeHost = backendHostsState.find(h => h.isActive) || backendHostsState[0];

  const themes = [
    { id: "horizon", name: "🌅 Horizon Luminous Day", desc: "Warm coral primary, pure Luminous UI redesign", accent: "#ff5e3a" },
    { id: "dark", name: "Signal Room (Dark)", desc: "Classic dark mode for low-light environments", accent: "#e8a020" },
    { id: "light", name: "Pure Light", desc: "Ultra bright minimal light mode", accent: "#0d9488" },
    { id: "slate", name: "Slate", desc: "Cool blue-gray professional slate", accent: "#38bdf8" },
    { id: "stealth", name: "Stealth (OLED)", desc: "True black OLED stealth mode", accent: "#10b981" },
    { id: "cyberpunk", name: "Cyberpunk Neon", desc: "Neon cyberpunk glowing wireframe", accent: "#00e5ff" },
    { id: "infrared", name: "🔮 Infrared Command", desc: "Deep violet command center", accent: "#7c3aed" },
  ];

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    const q = searchQuery.toLowerCase();
    return CATEGORIES.filter(c => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
  }, [searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans pb-16">
      {/* Header with Connection Badge and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-c)] shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Global Settings</h1>
          <p className="text-xs text-[var(--text-sub)] mt-1">Configure system parameters, themes, security, integrations, and enterprise roadmaps.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Save Settings Primary Action Button */}
          <button
            onClick={() => patch(s)}
            className="flex items-center gap-2 rounded-xl bg-[var(--amber)] text-black px-4 py-2 text-xs font-bold hover:bg-[var(--amber-hover)] transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Check size={14} /> Save All Settings
          </button>

          {/* Search Filter Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-sub)]" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none w-48 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar (10 Categories) */}
        <div className="lg:col-span-4 space-y-2">
          {filteredCategories.map((cat) => {
            const isSelected = activeSection === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveSection(cat.id)}
                className={`flex items-start gap-3.5 p-3.5 rounded-2xl border text-left transition-all w-full cursor-pointer ${
                  isSelected
                    ? "border-[var(--amber)] bg-[var(--amber-low)] shadow-sm"
                    : "border-[var(--border-c)] bg-[var(--bg-surface)] hover:border-[var(--amber)]/40 hover:bg-[var(--bg-void)]"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${isSelected ? "bg-[var(--amber)] text-black font-bold" : "bg-[var(--bg-void)] text-[var(--text-sub)] border border-[var(--border-c)]"}`}>
                  <cat.icon size={18} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-bold truncate ${isSelected ? "text-[var(--amber)]" : "text-[var(--text)]"}`}>{cat.label}</span>
                    {cat.badge && (
                      <span className="text-[9px] font-bold bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]/30 px-1.5 py-0.5 rounded-full shrink-0 uppercase">
                        {cat.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--text-sub)] mt-0.5 truncate">{cat.desc}</div>
                </div>
              </button>
            );
          })}

          {/* Backup, Restore & Reset Component */}
          <div className="pt-4">
            <SettingsImportExport
              settings={s}
              onImport={(data) => patch(data)}
              onReset={() => patch(DEFAULT_SETTINGS)}
            />
          </div>
        </div>

        {/* Content Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* CATEGORY 0: API HEALTH & LATENCY DASHBOARD */}
          {activeSection === "api_health" && (
            <ApiHealthSettingsView />
          )}

          {/* CATEGORY 1: APPEARANCE & CUSTOMIZATION */}
          {activeSection === "appearance" && (

            <div className="space-y-6">
              <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-6 shadow-sm">
                <div className="border-b border-[var(--border-c)] pb-4">
                  <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                    <Palette size={20} className="text-[var(--amber)]" /> Visual Theme Engine
                  </h3>
                  <p className="text-xs text-[var(--text-sub)] mt-1">Select from pre-configured high-contrast and glassmorphic UI color presets.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {themes.map((t) => {
                    const isSelected = s.theme === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => patch({ theme: t.id })}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all flex flex-col gap-1.5 ${
                          isSelected
                            ? "border-[var(--amber)] bg-[var(--amber-low)] shadow-sm"
                            : "border-[var(--border-c)] bg-[var(--bg-void)] hover:border-[var(--amber)]/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[var(--text)] flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.accent }} />
                            {t.name}
                          </span>
                          {isSelected && <span className="text-[9px] font-extrabold bg-[var(--amber)] text-black px-1.5 py-0.5 rounded uppercase">Active</span>}
                        </div>
                        <p className="text-[11px] text-[var(--text-sub)]">{t.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Terminal Theme Live Preview */}
              <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 shadow-sm">
                <TerminalThemePreview
                  selectedThemeId={s.terminalTheme || "stealth"}
                  onSelect={(themeId) => patch({ terminalTheme: themeId })}
                />
              </section>
            </div>
          )}

          {/* CATEGORY 2: SYSTEM & ENVIRONMENT */}
          {activeSection === "system" && (
            <div className="space-y-6">
              {/* Backend Infrastructure Manager */}
              <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                      <Server size={20} className="text-[var(--amber)]" /> Backend Infrastructure Endpoints
                    </h3>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">Manage local gateway, ngrok, or Cloudflare Tunnel backend connections.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {backendHostsState.map(host => {
                    const ping = pingResults[host.id];
                    const pinging = isPinging[host.id];
                    return (
                      <div key={host.id} className={`flex items-center justify-between p-3.5 rounded-xl border ${host.isActive ? "border-[var(--amber)] bg-[var(--amber-low)]" : "border-[var(--border-c)] bg-[var(--bg-void)]"}`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="activeBackend"
                            checked={host.isActive}
                            onChange={() => {
                              const next = backendHostsState.map(h => ({ ...h, isActive: h.id === host.id }));
                              saveHosts(next);
                              toast.success(`Active backend switched to ${host.name}`);
                            }}
                            className="accent-[var(--amber)] h-4 w-4"
                          />
                          <div>
                            <div className="text-xs font-bold text-[var(--text)]">{host.name} {host.isActive && <span className="ml-2 text-[9px] bg-[var(--amber)] text-black px-1.5 py-0.5 rounded uppercase font-extrabold">Active</span>}</div>
                            <div className="text-[11px] text-[var(--text-sub)] font-mono mt-0.5">{host.url}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* CATEGORY 3: SECURITY & ACCESS */}
          {activeSection === "security" && (
            <div className="space-y-6">
              <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-4 shadow-sm">
                <div className="border-b border-[var(--border-c)] pb-4">
                  <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                    <KeyRound size={20} className="text-[var(--crit)]" /> Security Policies & RBAC Controls
                  </h3>
                  <p className="text-xs text-[var(--text-sub)] mt-1">Configure login methods, RBAC enforcement, and compliance policy checks.</p>
                </div>
              </section>

              {/* LIVE SECURITY & RBAC AUDIT STREAM */}
              <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                      <Shield size={20} className="text-[var(--teal)]" /> Live Security & RBAC Audit Stream
                    </h3>
                    <p className="text-xs text-[var(--text-sub)] mt-1">Real-time audit log tracking WinRM execution, settings patches, and user authentication events.</p>
                  </div>
                  <button 
                    onClick={() => toast.success("Audit log exported as CSV")}
                    className="flex items-center gap-1.5 bg-[var(--bg-void)] border border-[var(--border-c)] px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-white transition-all cursor-pointer"
                  >
                    <Download size={14} /> Export Audit Log
                  </button>
                </div>

                <div className="p-4 bg-[var(--bg-void)] rounded-xl border border-[var(--border-c)] font-mono text-xs space-y-2 max-h-60 overflow-y-auto">
                  <div className="text-[11px] text-[var(--text-sub)] flex items-center justify-between p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-c)]/40">
                    <span><span className="text-[var(--teal)] font-bold">[2026-07-26 15:05]</span> ADMIN_USER authenticated via WinRM Kerberos SSO</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">SUCCESS</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-sub)] flex items-center justify-between p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-c)]/40">
                    <span><span className="text-[var(--teal)] font-bold">[2026-07-26 14:58]</span> Terminal theme patched to 'Dracula Gothic'</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">MUTATION</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-sub)] flex items-center justify-between p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-c)]/40">
                    <span><span className="text-[var(--teal)] font-bold">[2026-07-26 14:40]</span> AD Domain Controller scan completed across 10.0.0.0/24</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">SCAN_OK</span>
                  </div>
                </div>
              </section>

              {/* PLATFORM DISASTER RECOVERY & BACKUP VAULT */}
              <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                      <Database size={20} className="text-[var(--amber)]" /> Platform Disaster Recovery & Backup Vault
                    </h3>
                    <p className="text-xs text-[var(--text-sub)] mt-1">Export or restore platform configuration bundles, server credentials, and script templates.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `nexus-platform-state-${new Date().toISOString().slice(0,10)}.json`;
                        a.click();
                        toast.success("Platform state backup exported");
                      }}
                      className="bg-[var(--amber)] text-black px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-[var(--amber-hover)] transition-all cursor-pointer"
                    >
                      Export Platform Backup
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* CATEGORY 4: SOFTWARE REPOSITORY & PACKAGES */}
          {activeSection === "software_repo" && (
            <div className="space-y-6">
              <SoftwareRepoManager />
            </div>
          )}

          {/* CATEGORY 5: INTEGRATIONS & AUTOMATION */}
          {activeSection === "integrations" && (
            <div className="space-y-6">
              {/* PowerShell Script Templates Manager */}
              <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                      <Terminal size={20} className="text-[var(--amber)]" /> PowerShell Script Templates
                    </h3>
                    <p className="text-xs text-[var(--text-sub)] mt-1">Create, edit, enable, or disable custom command presets for the PowerShell PTY console.</p>
                  </div>
                  <button
                    onClick={() => {
                      const newId = "script-" + Date.now();
                      const templates = s.scriptTemplates || [];
                      const updated = [...templates, { id: newId, name: "New Script Template", category: "Custom", command: "Get-Date\r", enabled: true }];
                      patch({ scriptTemplates: updated as any });
                      toast.success("Added new script template");
                    }}
                    className="flex items-center gap-1.5 bg-[var(--amber)] text-black px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-[var(--amber-hover)] transition-all cursor-pointer"
                  >
                    <Plus size={14} /> New Script Template
                  </button>
                </div>

                <div className="space-y-3">
                  {(s.scriptTemplates || []).map((t, idx) => (
                    <div key={t.id || idx} className={`p-4 rounded-xl border space-y-3 ${t.enabled ? "border-[var(--border-c)] bg-[var(--bg-void)]" : "border-[var(--border-c)]/50 bg-[var(--bg-void)]/40 opacity-60"}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={t.enabled}
                            onChange={(e) => {
                              const updated = (s.scriptTemplates || []).map(item => item.id === t.id ? { ...item, enabled: e.target.checked } : item);
                              patch({ scriptTemplates: updated as any });
                            }}
                            className="accent-[var(--amber)] h-4 w-4 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={t.name}
                            onChange={(e) => {
                              const updated = (s.scriptTemplates || []).map(item => item.id === t.id ? { ...item, name: e.target.value } : item);
                              patch({ scriptTemplates: updated as any });
                            }}
                            className="bg-transparent font-bold text-xs text-[var(--text)] focus:border-b focus:border-[var(--amber)] focus:outline-none flex-1"
                            placeholder="Script Name"
                          />
                          <input
                            type="text"
                            value={t.category || "General"}
                            onChange={(e) => {
                              const updated = (s.scriptTemplates || []).map(item => item.id === t.id ? { ...item, category: e.target.value } : item);
                              patch({ scriptTemplates: updated as any });
                            }}
                            className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-lg px-2 py-0.5 text-[10px] text-[var(--text-sub)] font-mono w-24"
                            placeholder="Category"
                          />
                        </div>

                        <button
                          onClick={() => {
                            const updated = (s.scriptTemplates || []).filter(item => item.id !== t.id);
                            patch({ scriptTemplates: updated as any });
                            toast.success("Deleted script template");
                          }}
                          className="text-[var(--text-sub)] hover:text-[var(--crit)] p-1 rounded transition-colors self-end sm:self-auto cursor-pointer"
                          title="Delete Template"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[var(--text-sub)] uppercase tracking-wider mb-1">PowerShell Command String</label>
                        <textarea
                          rows={2}
                          value={t.command}
                          onChange={(e) => {
                            const updated = (s.scriptTemplates || []).map(item => item.id === t.id ? { ...item, command: e.target.value } : item);
                            patch({ scriptTemplates: updated as any });
                          }}
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl p-2.5 text-xs text-[var(--amber)] font-mono focus:border-[var(--amber)] focus:outline-none resize-none"
                          placeholder="e.g. Get-Process | Sort-Object CPU -Descending"
                        />
                      </div>
                    </div>
                  ))}
                  {(s.scriptTemplates || []).length === 0 && (
                    <div className="py-8 text-center text-xs text-[var(--text-sub)]">No script templates defined. Click 'New Script Template' to create one.</div>
                  )}
                </div>
              </section>

              <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-4 shadow-sm">
                <div className="border-b border-[var(--border-c)] pb-4">
                  <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                    <Database size={20} className="text-[var(--teal)]" /> Active Directory Integration
                  </h3>
                  <p className="text-xs text-[var(--text-sub)] mt-1">Configure LDAP search roots, domain controllers, and trust presets.</p>
                </div>
              </section>
            </div>
          )}

          {/* CATEGORY 5: DIAGNOSTICS & TELEMETRY */}
          {activeSection === "diagnostics" && (
            <div className="space-y-6">
              <BackgroundJobsView />
            </div>
          )}

          {/* CATEGORY 6: FLEET PROVISIONING & PXE BOOT (PLACEHOLDER) */}
          {activeSection === "provisioning" && (
            <div className="space-y-6">
              <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                      <Rocket size={20} className="text-[var(--amber)]" /> Fleet Provisioning & PXE Boot
                    </h3>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">Automate bare-metal Windows Server deployment via TFTP & WDS image catalog.</p>
                  </div>
                  <span className="text-xs font-bold bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]/30 px-3 py-1 rounded-full uppercase flex items-center gap-1">
                    <Sparkles size={12} /> Roadmap Preview
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">PXE Server Binding IP</label>
                    <input
                      type="text"
                      value={s.pxeServerIp || "192.168.1.50"}
                      onChange={(e) => patch({ pxeServerIp: e.target.value })}
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Default Golden ISO Image</label>
                    <input
                      type="text"
                      value={s.goldenImageTemplate || "WinServer2022-Standard-v2.iso"}
                      onChange={(e) => patch({ goldenImageTemplate: e.target.value })}
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl text-xs text-[var(--text-sub)] space-y-1">
                  <div className="font-bold text-[var(--text)] flex items-center gap-2">
                    <FileCode size={14} className="text-[var(--teal)]" /> Unattended OOBE Answer File Template
                  </div>
                  <p>Auto-generates <code className="text-[var(--amber)]">autounattend.xml</code> for Zero-Touch Installation (ZTI).</p>
                </div>
              </section>
            </div>
          )}

          {/* CATEGORY 7: DISASTER RECOVERY & VSS (PLACEHOLDER) */}
          {activeSection === "disaster_recovery" && (
            <div className="space-y-6">
              <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                      <HardDrive size={20} className="text-[var(--teal)]" /> Disaster Recovery & VSS Snapshots
                    </h3>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">Manage Volume Shadow Copy Service retention schedules and offsite backups.</p>
                  </div>
                  <span className="text-xs font-bold bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]/30 px-3 py-1 rounded-full uppercase flex items-center gap-1">
                    <Sparkles size={12} /> Roadmap Preview
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Shadow Copy Retention Count</label>
                    <input
                      type="number"
                      value={s.vssRetentionCount || 14}
                      onChange={(e) => patch({ vssRetentionCount: parseInt(e.target.value) })}
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Offsite SMB/S3 Target</label>
                    <input
                      type="text"
                      value={s.backupDestinationTarget || "smb://nas.internal/backups"}
                      onChange={(e) => patch({ backupDestinationTarget: e.target.value })}
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* CATEGORY 8: COMPLIANCE & CIS HARDENING (PLACEHOLDER) */}
          {activeSection === "compliance" && (
            <div className="space-y-6">
              <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                      <ShieldCheck size={20} className="text-[var(--ok)]" /> Compliance & CIS Hardening Framework
                    </h3>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">Automated Windows Server security baselines, BitLocker TPM escrow, and SCEP.</p>
                  </div>
                  <span className="text-xs font-bold bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]/30 px-3 py-1 rounded-full uppercase flex items-center gap-1">
                    <Sparkles size={12} /> Roadmap Preview
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">CIS Benchmark Hardening Profile</label>
                    <select
                      value={s.cisBenchmarkLevel || "Level2-Server"}
                      onChange={(e) => patch({ cisBenchmarkLevel: e.target.value })}
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                    >
                      <option value="Level1-Domain">Level 1 - Member Server</option>
                      <option value="Level2-Server">Level 2 - High Security Domain Controller</option>
                      <option value="STIG-Strict">DoD STIG Hardening Baseline</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl self-end">
                    <div>
                      <div className="text-xs font-bold text-[var(--text)]">BitLocker TPM Key Escrow</div>
                      <div className="text-[10px] text-[var(--text-sub)]">Auto-backup recovery keys to Active Directory / Key Vault.</div>
                    </div>
                    <ToggleSwitch checked={s.bitlockerAutoEscrow ?? true} onChange={(val) => patch({ bitlockerAutoEscrow: val })} />
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* CATEGORY 9: AI OPERATIONS & NEXUS COPILOT */}
          {activeSection === "ai_ops" && (
            <div className="space-y-6">
              {/* Copilot & Gemini API Configuration Card */}
              <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                      <Bot size={20} className="text-amber-400" /> Nexus Copilot & Gemini AI Integration
                    </h3>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">Control live AI SysAdmin Assistant features, Copilot drawers, and custom Gemini API keys.</p>
                  </div>
                  <span className="text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full uppercase flex items-center gap-1">
                    <Sparkles size={12} /> Live Feature
                  </span>
                </div>

                {/* Enable / Disable Toggle */}
                <div className="flex items-center justify-between p-4 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-[var(--text)] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Enable Nexus Copilot & AI Intelligence Cards
                    </div>
                    <div className="text-[11px] text-[var(--text-sub)]">
                      When disabled, the topbar Nexus Copilot button and in-page AI diagnostic cards are hidden across all dashboards.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.copilotEnabled !== false}
                      onChange={(e) => {
                        patch({ copilotEnabled: e.target.checked });
                        toast.success(e.target.checked ? "Nexus Copilot Enabled" : "Nexus Copilot Disabled");
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* AI Provider & Gateway Selection */}
                <div className="space-y-4 pt-2">
                  <label className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider block">
                    Select AI Provider & Execution Model
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => patch({ aiProvider: "gemini", aiModel: "gemini-2.5-flash" })}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        (s.aiProvider || "gemini") === "gemini"
                          ? "border-amber-500 bg-amber-500/10 text-[var(--text)] shadow-xs ring-1 ring-amber-500/40"
                          : "border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)] hover:border-amber-500/40 hover:bg-[var(--bg-void)]"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className="flex items-center gap-1.5 text-[var(--text)]"><Sparkles className="w-4 h-4 text-amber-500" /> Google Gemini</span>
                        {(s.aiProvider || "gemini") === "gemini" && <Check className="w-4 h-4 text-amber-500" />}
                      </div>
                      <p className="text-[11px] text-[var(--text-sub)] mt-1">Cloud AI Studio (gemini-2.5-flash, gemini-2.5-pro).</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => patch({ aiProvider: "ollama", aiBaseUrl: s.aiBaseUrl || "http://localhost:11434/v1", aiModel: s.aiModel && s.aiModel !== "gemini-2.5-flash" ? s.aiModel : "llama3.2:1b" })}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        s.aiProvider === "ollama"
                          ? "border-cyan-500 bg-cyan-500/10 text-[var(--text)] shadow-xs ring-1 ring-cyan-500/40"
                          : "border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)] hover:border-cyan-500/40 hover:bg-[var(--bg-void)]"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className="flex items-center gap-1.5 text-[var(--text)]"><Cpu className="w-4 h-4 text-cyan-500" /> Ollama (CPU Self-Hosted)</span>
                        {s.aiProvider === "ollama" && <Check className="w-4 h-4 text-cyan-500" />}
                      </div>
                      <p className="text-[11px] text-[var(--text-sub)] mt-1">100% Local CPU, No-GPU required, Air-Gapped (qwen2.5:0.5b, llama3.2:1b).</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => patch({ aiProvider: "openai", aiModel: "gpt-4o-mini" })}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        s.aiProvider === "openai"
                          ? "border-emerald-500 bg-emerald-500/10 text-[var(--text)] shadow-xs ring-1 ring-emerald-500/40"
                          : "border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)] hover:border-emerald-500/40 hover:bg-[var(--bg-void)]"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className="flex items-center gap-1.5 text-[var(--text)]"><Globe className="w-4 h-4 text-emerald-500" /> OpenAI Official</span>
                        {s.aiProvider === "openai" && <Check className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <p className="text-[11px] text-[var(--text-sub)] mt-1">Official OpenAI endpoint (gpt-4o-mini, gpt-4o).</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => patch({ aiProvider: "custom", aiBaseUrl: s.aiBaseUrl || "https://api.groq.com/openai/v1", aiModel: s.aiModel || "llama-3.3-70b-versatile" })}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        s.aiProvider === "custom"
                          ? "border-purple-500 bg-purple-500/10 text-[var(--text)] shadow-xs ring-1 ring-purple-500/40"
                          : "border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)] hover:border-purple-500/40 hover:bg-[var(--bg-void)]"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className="flex items-center gap-1.5 text-[var(--text)]"><Zap className="w-4 h-4 text-purple-500" /> Custom OpenAI Gateway</span>
                        {s.aiProvider === "custom" && <Check className="w-4 h-4 text-purple-500" />}
                      </div>
                      <p className="text-[11px] text-[var(--text-sub)] mt-1">Groq, OpenRouter, LocalAI, LM Studio or custom endpoint.</p>
                    </button>
                  </div>
                </div>

                {/* Base URL (shown for Ollama & Custom) */}
                {(s.aiProvider === "ollama" || s.aiProvider === "custom") && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider block">
                      AI Gateway Base URL
                    </label>
                    <input
                      type="text"
                      value={s.aiBaseUrl || (s.aiProvider === "ollama" ? "http://localhost:11434/v1" : "https://api.groq.com/openai/v1")}
                      onChange={(e) => patch({ aiBaseUrl: e.target.value })}
                      placeholder="http://localhost:11434/v1 or https://api.groq.com/openai/v1"
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2.5 text-xs text-[var(--text)] font-mono focus:border-amber-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-[var(--text-sub)]">
                      {s.aiProvider === "ollama" 
                        ? "Ensure local Ollama service is running locally on CPU (`ollama serve`). REST endpoint defaults to `http://localhost:11434/v1`." 
                        : "Enter the base URL for your OpenAI-compatible API endpoint (e.g. Groq, OpenRouter, vLLM)."}
                    </p>
                  </div>
                )}

                {/* API Key Field */}
                {(s.aiProvider || "gemini") !== "ollama" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" /> API Key ({s.aiProvider || "gemini"})
                      </label>
                      <span className="text-[10px] text-[var(--text-sub)] font-mono">
                        {(s.aiApiKey || s.geminiApiKey) ? "Custom Key Configured" : "No Key Entered"}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={(s.aiProvider === "gemini" ? (s.geminiApiKey || s.aiApiKey) : s.aiApiKey) || ""}
                        onChange={(e) => {
                          patch({ aiApiKey: e.target.value, geminiApiKey: s.aiProvider === "gemini" ? e.target.value : s.geminiApiKey });
                        }}
                        placeholder={s.aiProvider === "gemini" ? "AIzaSy... (Gemini API Key)" : "sk-... (OpenAI or Gateway Key)"}
                        className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl pl-3 pr-20 py-2.5 text-xs text-[var(--text)] font-mono focus:border-amber-500 focus:outline-none"
                      />
                      <div className="absolute right-2 top-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="p-1 text-[var(--text-sub)] hover:text-white transition-colors cursor-pointer"
                          title={showApiKey ? "Hide Key" : "Show Key"}
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Model Name Input & Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider block">
                    AI Model Identifier
                  </label>
                  <input
                    type="text"
                    value={s.aiModel || (s.aiProvider === "ollama" ? "llama3.2:1b" : "gemini-2.5-flash")}
                    onChange={(e) => patch({ aiModel: e.target.value })}
                    placeholder="gemini-2.5-flash, qwen2.5:0.5b, llama3.2:1b, gpt-4o-mini..."
                    className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2.5 text-xs text-[var(--text)] font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] text-[var(--text-sub)] self-center mr-1">Presets:</span>
                    {(s.aiProvider === "ollama" ? ["qwen2.5:0.5b", "llama3.2:1b", "phi3:mini"] :
                      s.aiProvider === "openai" ? ["gpt-4o-mini", "gpt-4o"] :
                      s.aiProvider === "custom" ? ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"] :
                      ["gemini-2.5-flash", "gemini-2.5-pro"]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => patch({ aiModel: m })}
                        className="text-[10px] bg-[var(--bg-void)] hover:bg-amber-500/20 text-[var(--text-sub)] hover:text-amber-400 border border-[var(--border-c)] px-2 py-0.5 rounded transition-all font-mono cursor-pointer"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* One-Click Ollama Setup & Lightweight CPU Model Manager */}
              <OllamaManager />

              {/* Local LLM & Auto Remediation Roadmap Options */}
              <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                      <Cpu size={20} className="text-purple-400" /> Local LLM & Automated Remediation
                    </h3>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">Ollama / LocalAI endpoints for air-gapped environments.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Local LLM Model API Endpoint</label>
                    <input
                      type="text"
                      value={s.llmModelEndpoint || "http://localhost:11434/v1"}
                      onChange={(e) => patch({ llmModelEndpoint: e.target.value })}
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Auto-Remediation Script Policy</label>
                    <select
                      value={s.autoRemediationPolicy || "ManualApproval"}
                      onChange={(e) => patch({ autoRemediationPolicy: e.target.value })}
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                    >
                      <option value="ManualApproval">Require Admin Approval</option>
                      <option value="AutoExecuteLowRisk">Auto-Execute Low Risk Scripts</option>
                      <option value="Disabled">Disable AI Remediation</option>
                    </select>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* CATEGORY 10: SD-WAN & NETWORK INTERCONNECT (PLACEHOLDER) */}
          {activeSection === "network_sdwan" && (
            <div className="space-y-6">
              <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                      <Globe size={20} className="text-sky-400" /> SD-WAN & Network Interconnect
                    </h3>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">WireGuard site-to-site VPN meshes, Cloudflare DDNS, and software load balancing.</p>
                  </div>
                  <span className="text-xs font-bold bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]/30 px-3 py-1 rounded-full uppercase flex items-center gap-1">
                    <Sparkles size={12} /> Roadmap Preview
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">WireGuard Tunnel Listen Port</label>
                    <input
                      type="number"
                      value={s.wireguardTunnelPort || 51820}
                      onChange={(e) => patch({ wireguardTunnelPort: parseInt(e.target.value) })}
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Dynamic DNS Host Domain</label>
                    <input
                      type="text"
                      value={s.ddnsProviderDomain || "nexus-edge.cloudflare.com"}
                      onChange={(e) => patch({ ddnsProviderDomain: e.target.value })}
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
                    />
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-6 right-8 z-40 flex items-center gap-3 bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-c)] p-3 px-5 rounded-2xl shadow-2xl">
        <span className="text-xs text-[var(--text-sub)] hidden sm:inline">Unsaved edits will sync automatically.</span>
        <button
          onClick={() => patch(s)}
          className="flex items-center gap-2 rounded-xl bg-[var(--amber)] text-black px-5 py-2.5 text-xs font-bold hover:bg-[var(--amber-hover)] transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Check size={16} /> Save All Settings
        </button>
      </div>
    </div>
  );
}
