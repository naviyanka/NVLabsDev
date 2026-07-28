import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { NxCard } from "@/components/ui/NxCard";
import { 
  ShieldCheck, ShieldAlert, ShieldX, Play, RefreshCw, Plus, Trash2, 
  Search, Lock, AlertTriangle, FileCode, Cpu, Layers, HardDrive, CheckCircle2,
  XCircle, Sliders, ExternalLink, Activity, Terminal, Sparkles, Check
} from "lucide-react";
import { toast } from "sonner";
import { 
  getDefenderStatusClient, 
  updateDefenderStatusClient, 
  getDefenderThreatsClient, 
  updateDefenderThreatClient, 
  getDefenderExclusionsClient, 
  addDefenderExclusionClient, 
  deleteDefenderExclusionClient, 
  getDefenderAsrRulesClient, 
  updateDefenderAsrRuleClient,
  type DefenderStatus,
  type DefenderThreat,
  type DefenderExclusion,
  type DefenderAsrRule
} from "@/api/client";

export const Route = createFileRoute("/defender")({
  head: () => ({ 
    meta: [
      { title: "Windows Defender Antivirus — NEXUS" },
      { name: "description", content: "Endpoint antivirus protection, threat quarantine, exclusions, and Attack Surface Reduction management." }
    ] 
  }),
  component: DefenderPage,
});

function DefenderPage() {
  const [server, setServer] = useState("dc01");
  const [status, setStatus] = useState<DefenderStatus | null>(null);
  const [threats, setThreats] = useState<DefenderThreat[]>([]);
  const [exclusions, setExclusions] = useState<DefenderExclusion[]>([]);
  const [asrRules, setAsrRules] = useState<DefenderAsrRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Scan simulation state
  const [scanRunning, setScanRunning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanType, setScanType] = useState<"Quick" | "Full">("Quick");
  const [scanCurrentFile, setScanCurrentFile] = useState("");

  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "threats" | "exclusions" | "asr" | "cli">("overview");

  // Filters
  const [threatQuery, setThreatQuery] = useState("");
  const [threatFilterStatus, setThreatFilterStatus] = useState<string>("All");
  const [exclusionQuery, setExclusionQuery] = useState("");

  // Modals
  const [showAddExclusionModal, setShowAddExclusionModal] = useState(false);
  const [newExType, setNewExType] = useState<"Folder" | "File" | "Extension" | "Process">("Folder");
  const [newExValue, setNewExValue] = useState("");

  const [selectedThreat, setSelectedThreat] = useState<DefenderThreat | null>(null);
  const [showPsModal, setShowPsModal] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [st, thr, ex, asr] = await Promise.all([
        getDefenderStatusClient(server),
        getDefenderThreatsClient(server),
        getDefenderExclusionsClient(server),
        getDefenderAsrRulesClient(server)
      ]);
      setStatus(st);
      setThreats(thr);
      setExclusions(ex);
      setAsrRules(asr);
    } catch (e) {
      toast.error("Failed to load Defender telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [server]);

  // Handle Scan Simulation
  const handleStartScan = (type: "Quick" | "Full") => {
    setScanType(type);
    setScanRunning(true);
    setScanProgress(0);
    toast.info(`Triggered Defender ${type} Scan on ${server.toUpperCase()}...`);

    const paths = [
      "C:\\Windows\\System32\\ntoskrnl.exe",
      "C:\\Windows\\System32\\drivers\\etc\\hosts",
      "C:\\Program Files\\Windows Defender\\MsMpEng.exe",
      "C:\\Users\\Administrator\\AppData\\Local\\Temp\\sample.tmp",
      "C:\\Scripts\\NexusWorker.ps1",
      "C:\\Windows\\explorer.exe"
    ];

    let current = 0;
    const interval = setInterval(() => {
      current += type === "Quick" ? 15 : 5;
      setScanProgress(Math.min(current, 100));
      setScanCurrentFile(paths[Math.floor(Math.random() * paths.length)]);

      if (current >= 100) {
        clearInterval(interval);
        setScanRunning(false);
        const scanTimeStr = new Date().toLocaleString("sv-SE").replace("T", " ").slice(0, 16);
        if (type === "Quick") {
          updateDefenderStatusClient(server, { lastQuickScanTime: scanTimeStr, isScanning: false });
        } else {
          updateDefenderStatusClient(server, { lastFullScanTime: scanTimeStr, isScanning: false });
        }
        loadAll();
        toast.success(`Defender ${type} Scan completed on ${server.toUpperCase()}! No new active threats found.`);
      }
    }, 800);
  };

  const handleUpdateDefinitions = async () => {
    toast.info(`Checking Microsoft Active Protection Network for definitions...`);
    setTimeout(() => {
      const nowStr = new Date().toLocaleString("sv-SE").replace("T", " ").slice(0, 16);
      updateDefenderStatusClient(server, { 
        antivirusSignatureVersion: "1.415.124.0", 
        antivirusSignatureLastUpdated: nowStr 
      });
      loadAll();
      toast.success("Defender definitions updated to latest version 1.415.124.0");
    }, 1200);
  };

  const handleToggleSetting = async (key: keyof DefenderStatus) => {
    if (!status) return;
    const currentVal = status[key];
    const newVal = typeof currentVal === "boolean" ? !currentVal : currentVal;
    
    // Update local immediately for crisp UI feedback
    setStatus({ ...status, [key]: newVal } as DefenderStatus);
    await updateDefenderStatusClient(server, { [key]: newVal });
    toast.success(`Updated Defender ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
  };

  const handleThreatAction = async (threatId: string, action: "Quarantine" | "Remove" | "Allow") => {
    const ok = await updateDefenderThreatClient(server, threatId, action);
    if (ok) {
      toast.success(`Threat ${action === "Quarantine" ? "quarantined" : action === "Remove" ? "deleted" : "allowed"}`);
      loadAll();
    } else {
      toast.error("Failed to execute threat action");
    }
  };

  const handleAddExclusion = async () => {
    if (!newExValue.trim()) {
      toast.error("Exclusion value path or pattern cannot be empty");
      return;
    }
    await addDefenderExclusionClient(server, { type: newExType, value: newExValue.trim() });
    toast.success(`Added ${newExType} exclusion: ${newExValue}`);
    setNewExValue("");
    setShowAddExclusionModal(false);
    loadAll();
  };

  const handleDeleteExclusion = async (id: string, val: string) => {
    if (!confirm(`Remove exclusion "${val}"? Defender will resume scanning this target.`)) return;
    await deleteDefenderExclusionClient(server, id);
    toast.success(`Exclusion removed`);
    loadAll();
  };

  const handleAsrRuleChange = async (ruleId: string, newState: "Block" | "Audit" | "Disabled") => {
    await updateDefenderAsrRuleClient(server, ruleId, newState);
    toast.success(`ASR rule updated to ${newState}`);
    loadAll();
  };

  // Filtered Lists
  const filteredThreats = threats.filter(t => {
    const matchesQ = t.threatName.toLowerCase().includes(threatQuery.toLowerCase()) || 
                     t.filePath.toLowerCase().includes(threatQuery.toLowerCase());
    const matchesFilter = threatFilterStatus === "All" || t.status === threatFilterStatus;
    return matchesQ && matchesFilter;
  });

  const filteredExclusions = exclusions.filter(e => 
    e.value.toLowerCase().includes(exclusionQuery.toLowerCase()) || 
    e.type.toLowerCase().includes(exclusionQuery.toLowerCase())
  );

  const activeThreatsCount = threats.filter(t => t.status === "Active").length;

  return (
    <PageWrapper>
      <PageHeader 
        eyebrow="Security & Endpoint Protection" 
        title="Windows Defender Antivirus" 
        description="Manage real-time antivirus protection, threat remediation, scan schedules, exclusions, and Attack Surface Reduction policies."
      />

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <ServerSelector value={server} onChange={setServer} />

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => handleStartScan("Quick")}
            disabled={scanRunning}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--amber)] hover:opacity-90 text-black font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Play size={14} className="fill-black" /> Quick Scan
          </button>
          <button
            onClick={() => handleStartScan("Full")}
            disabled={scanRunning}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] hover:border-[var(--amber)] text-[var(--text)] font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Activity size={14} className="text-[var(--amber)]" /> Full Scan
          </button>
          <button
            onClick={handleUpdateDefinitions}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] hover:border-[var(--teal)] text-[var(--text)] font-semibold text-xs transition-all cursor-pointer"
          >
            <RefreshCw size={14} className="text-[var(--teal)]" /> Update Signatures
          </button>
          <button
            onClick={() => setShowPsModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] hover:border-[var(--amber)] text-[var(--text-sub)] hover:text-[var(--text)] font-mono text-xs transition-all cursor-pointer"
          >
            <Terminal size={14} className="text-[var(--amber)]" /> CLI PowerShell
          </button>
        </div>
      </div>

      {/* Live Scan Progress Card */}
      {scanRunning && (
        <div className="mb-6 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[var(--text)] space-y-3 animate-pulse">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-400">
            <span className="flex items-center gap-2">
              <Activity className="animate-spin text-amber-400" size={16} />
              Windows Defender {scanType} Scan in Progress on {server.toUpperCase()}
            </span>
            <span>{scanProgress}%</span>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <div className="text-[11px] font-mono text-[var(--text-sub)] truncate">
            Scanning path: <span className="text-[var(--text)]">{scanCurrentFile}</span>
          </div>
        </div>
      )}

      {/* Top Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Real-time Status */}
        <div className="nx-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-sub)]">Real-time Engine</span>
            {status?.realTimeProtectionEnabled ? (
              <ShieldCheck className="text-[var(--ok)]" size={20} />
            ) : (
              <ShieldAlert className="text-[var(--crit)] animate-pulse" size={20} />
            )}
          </div>
          <div className="text-xl font-extrabold text-[var(--text)]">
            {status?.realTimeProtectionEnabled ? "Active & Protected" : "Protection Disabled"}
          </div>
          <p className="text-[11px] text-[var(--text-sub)] mt-1">
            {status?.realTimeProtectionEnabled ? "Scanning processes and file operations in memory" : "CRITICAL: Server vulnerable to exploits"}
          </p>
        </div>

        {/* Active Threats */}
        <div className="nx-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-sub)]">Active Threats</span>
            <AlertTriangle className={activeThreatsCount > 0 ? "text-[var(--crit)] animate-bounce" : "text-[var(--ok)]"} size={20} />
          </div>
          <div className={`text-2xl font-extrabold ${activeThreatsCount > 0 ? "text-[var(--crit)]" : "text-[var(--ok)]"}`}>
            {activeThreatsCount}
          </div>
          <p className="text-[11px] text-[var(--text-sub)] mt-1">
            {activeThreatsCount > 0 ? "Action required! Inspect threat tab." : "No active malware detections"}
          </p>
        </div>

        {/* Signatures Version */}
        <div className="nx-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-sub)]">Definitions</span>
            <CheckCircle2 className="text-[var(--teal)]" size={20} />
          </div>
          <div className="text-lg font-bold font-mono text-[var(--text)]">
            v{status?.antivirusSignatureVersion || "1.415.120.0"}
          </div>
          <p className="text-[11px] text-[var(--text-sub)] mt-1">
            Updated: {status?.antivirusSignatureLastUpdated || "Today"}
          </p>
        </div>

        {/* Last Scan Execution */}
        <div className="nx-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-sub)]">Last Scan</span>
            <Activity className="text-[var(--amber)]" size={20} />
          </div>
          <div className="text-sm font-bold text-[var(--text)] truncate">
            {status?.lastQuickScanTime || "Never"}
          </div>
          <p className="text-[11px] text-[var(--text-sub)] mt-1">
            Quick scan: {status?.quickScanDurationSec || 40}s execution time
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[var(--border-c)] mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "overview" 
              ? "bg-[var(--amber)] text-black shadow-xs" 
              : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)]"
          }`}
        >
          <Sliders size={14} /> Protection Settings
        </button>
        <button
          onClick={() => setActiveTab("threats")}
          className={`px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "threats" 
              ? "bg-[var(--amber)] text-black shadow-xs" 
              : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)]"
          }`}
        >
          <AlertTriangle size={14} /> Threat History ({threats.length})
          {activeThreatsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("exclusions")}
          className={`px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "exclusions" 
              ? "bg-[var(--amber)] text-black shadow-xs" 
              : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)]"
          }`}
        >
          <Lock size={14} /> Exclusions ({exclusions.length})
        </button>
        <button
          onClick={() => setActiveTab("asr")}
          className={`px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "asr" 
              ? "bg-[var(--amber)] text-black shadow-xs" 
              : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)]"
          }`}
        >
          <ShieldAlert size={14} /> Attack Surface Reduction (ASR)
        </button>
      </div>

      {/* Tab 1: Protection Overview & Toggles */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <NxCard eyebrow="Antivirus Modules" title="Real-Time Guard & Heuristics Controls">
              <div className="divide-y divide-[var(--border-c)]">
                {/* Real-time Protection */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)]">Real-Time Protection</h4>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">Locates and stops malware from installing or running on your device.</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting("realTimeProtectionEnabled")}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      status?.realTimeProtectionEnabled ? "bg-[var(--amber)]" : "bg-[var(--border-c)]"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      status?.realTimeProtectionEnabled ? "translate-x-6 bg-black" : "translate-x-0 bg-white"
                    }`} />
                  </button>
                </div>

                {/* Cloud Delivered Protection */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)]">Cloud-Delivered Protection</h4>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">Provides increased and faster protection with access to the latest Defender cloud data.</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting("cloudProtectionEnabled")}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      status?.cloudProtectionEnabled ? "bg-[var(--amber)]" : "bg-[var(--border-c)]"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      status?.cloudProtectionEnabled ? "translate-x-6 bg-black" : "translate-x-0 bg-white"
                    }`} />
                  </button>
                </div>

                {/* Tamper Protection */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)]">Tamper Protection</h4>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">Prevents malicious apps from changing critical Windows Defender security settings.</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting("tamperProtectionEnabled")}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      status?.tamperProtectionEnabled ? "bg-[var(--amber)]" : "bg-[var(--border-c)]"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      status?.tamperProtectionEnabled ? "translate-x-6 bg-black" : "translate-x-0 bg-white"
                    }`} />
                  </button>
                </div>

                {/* Behavioral Monitoring */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)]">Behavioral Monitoring & AMSI</h4>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">Monitors process behavior and inspects script engines (PowerShell, VBScript, JS) in real-time.</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting("behavioralMonitoringEnabled")}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      status?.behavioralMonitoringEnabled ? "bg-[var(--amber)]" : "bg-[var(--border-c)]"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      status?.behavioralMonitoringEnabled ? "translate-x-6 bg-black" : "translate-x-0 bg-white"
                    }`} />
                  </button>
                </div>

                {/* Script Scanning */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)]">Script & Download Inspection</h4>
                    <p className="text-xs text-[var(--text-sub)] mt-0.5">Scans scripts and downloaded files before execution.</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting("scriptScanningEnabled")}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      status?.scriptScanningEnabled ? "bg-[var(--amber)]" : "bg-[var(--border-c)]"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      status?.scriptScanningEnabled ? "translate-x-6 bg-black" : "translate-x-0 bg-white"
                    }`} />
                  </button>
                </div>
              </div>
            </NxCard>
          </div>

          <div className="space-y-6">
            {/* System Engine Version info */}
            <NxCard eyebrow="Engine Telemetry" title="Defender Build Details">
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-[var(--border-c)]">
                  <span className="text-[var(--text-sub)]">Antivirus Engine:</span>
                  <span className="font-bold text-[var(--text)]">{status?.engineVersion}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-c)]">
                  <span className="text-[var(--text-sub)]">Defender Platform:</span>
                  <span className="font-bold text-[var(--text)]">{status?.platformVersion}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-c)]">
                  <span className="text-[var(--text-sub)]">Signature Build:</span>
                  <span className="font-bold text-[var(--amber)]">{status?.antivirusSignatureVersion}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-c)]">
                  <span className="text-[var(--text-sub)]">Controlled Folders:</span>
                  <span className="font-bold text-[var(--teal)]">{status?.controlledFolderAccess}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--text-sub)]">Sample Submission:</span>
                  <span className="font-bold text-[var(--text)]">{status?.automaticSampleSubmission}</span>
                </div>
              </div>
            </NxCard>

            {/* Quick Actions Panel */}
            <NxCard eyebrow="Ransomware Shield" title="Protected Folder Access">
              <p className="text-xs text-[var(--text-sub)] mb-4">
                Controlled folder access protects your files from being modified or encrypted by unauthorized ransomware apps.
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[var(--bg-void)] border border-[var(--border-c)] flex justify-between items-center">
                  <span>C:\Users\Administrator\Documents</span>
                  <span className="text-[var(--ok)] text-[10px] font-bold uppercase">Locked</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-void)] border border-[var(--border-c)] flex justify-between items-center">
                  <span>C:\Shares\Public\Finance</span>
                  <span className="text-[var(--ok)] text-[10px] font-bold uppercase">Locked</span>
                </div>
              </div>
            </NxCard>
          </div>
        </div>
      )}

      {/* Tab 2: Threat History & Quarantine */}
      {activeTab === "threats" && (
        <div className="space-y-4">
          {/* Threat Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-c)]">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-[var(--text-sub)]" size={15} />
              <input
                type="text"
                placeholder="Search threat name or path..."
                value={threatQuery}
                onChange={e => setThreatQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-void)] border border-[var(--border-c)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs text-[var(--text-sub)] font-semibold shrink-0">Status:</span>
              {["All", "Active", "Quarantined", "Removed", "Allowed"].map((st) => (
                <button
                  key={st}
                  onClick={() => setThreatFilterStatus(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    threatFilterStatus === st
                      ? "bg-[var(--amber)] text-black"
                      : "bg-[var(--bg-void)] border border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--text)]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Threat Table */}
          <NxCard eyebrow="Threat Telemetry" title="Malware Detections & Remediation Log">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase tracking-wider text-[var(--text-sub)] border-b border-[var(--border-c)] bg-[var(--bg-void)]">
                  <tr>
                    <th className="p-3">Threat Name</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Infected File Path</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Detection Time</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-c)] font-mono">
                  {filteredThreats.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[var(--text-sub)]">
                        No threats found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredThreats.map((t) => (
                      <tr key={t.id} className="hover:bg-[var(--bg-void)] transition-colors">
                        <td className="p-3 font-bold text-[var(--text)]">
                          <button 
                            onClick={() => setSelectedThreat(t)}
                            className="hover:text-[var(--amber)] text-left underline decoration-dotted cursor-pointer"
                          >
                            {t.threatName}
                          </button>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.severity === "Critical" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                            t.severity === "High" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                            "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}>
                            {t.severity}
                          </span>
                        </td>
                        <td className="p-3 text-[var(--text-sub)]">{t.category}</td>
                        <td className="p-3 text-[var(--text-sub)] max-w-xs truncate" title={t.filePath}>
                          {t.filePath}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === "Active" ? "bg-red-500/20 text-red-400 animate-pulse" :
                            t.status === "Quarantined" ? "bg-amber-500/20 text-amber-400" :
                            "bg-emerald-500/20 text-emerald-400"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3 text-[var(--text-sub)]">{t.detectionTime}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {t.status === "Active" && (
                              <button
                                onClick={() => handleThreatAction(t.id, "Quarantine")}
                                className="px-2.5 py-1 rounded-lg bg-[var(--amber)] text-black font-bold text-[10px] hover:opacity-90 transition-all cursor-pointer"
                              >
                                Quarantine
                              </button>
                            )}
                            <button
                              onClick={() => handleThreatAction(t.id, "Remove")}
                              className="px-2.5 py-1 rounded-lg border border-[var(--border-c)] hover:border-[var(--crit)] hover:text-[var(--crit)] font-semibold text-[10px] transition-all cursor-pointer"
                            >
                              Remove
                            </button>
                            <button
                              onClick={() => handleThreatAction(t.id, "Allow")}
                              className="px-2.5 py-1 rounded-lg border border-[var(--border-c)] hover:border-[var(--teal)] hover:text-[var(--teal)] font-semibold text-[10px] transition-all cursor-pointer"
                            >
                              Allow
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </NxCard>
        </div>
      )}

      {/* Tab 3: Exclusions Management */}
      {activeTab === "exclusions" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-c)]">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 text-[var(--text-sub)]" size={15} />
              <input
                type="text"
                placeholder="Search exclusions by path or type..."
                value={exclusionQuery}
                onChange={e => setExclusionQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-void)] border border-[var(--border-c)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
              />
            </div>

            <button
              onClick={() => setShowAddExclusionModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--amber)] text-black font-bold text-xs hover:opacity-90 transition-all cursor-pointer shrink-0"
            >
              <Plus size={15} /> Add Exclusion Rule
            </button>
          </div>

          <NxCard eyebrow="Scan Exclusions" title="Whitelisted Directories & File Processes">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase tracking-wider text-[var(--text-sub)] border-b border-[var(--border-c)] bg-[var(--bg-void)]">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Exclusion Value / Path</th>
                    <th className="p-3">Date Added</th>
                    <th className="p-3">Configured By</th>
                    <th className="p-3 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-c)] font-mono">
                  {filteredExclusions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[var(--text-sub)]">
                        No scan exclusions configured.
                      </td>
                    </tr>
                  ) : (
                    filteredExclusions.map((e) => (
                      <tr key={e.id} className="hover:bg-[var(--bg-void)] transition-colors">
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-[var(--bg-void)] border border-[var(--border-c)] text-[var(--amber)] font-bold text-[10px]">
                            {e.type}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-[var(--text)]">{e.value}</td>
                        <td className="p-3 text-[var(--text-sub)]">{e.dateAdded}</td>
                        <td className="p-3 text-[var(--text-sub)]">{e.addedBy}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteExclusion(e.id, e.value)}
                            className="p-1.5 rounded-lg text-[var(--text-sub)] hover:text-[var(--crit)] hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete exclusion"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </NxCard>
        </div>
      )}

      {/* Tab 4: Attack Surface Reduction (ASR) */}
      {activeTab === "asr" && (
        <div className="space-y-4">
          <NxCard eyebrow="Zero-Day Mitigation" title="Attack Surface Reduction (ASR) Rules">
            <p className="text-xs text-[var(--text-sub)] mb-4">
              ASR rules target specific software behaviors, such as launching executable files from emails, blocking LSASS credential dumping, and blocking process creation from WMI or PSExec.
            </p>
            <div className="space-y-3">
              {asrRules.map((rule) => (
                <div key={rule.id} className="p-4 rounded-xl bg-[var(--bg-void)] border border-[var(--border-c)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[var(--text)]">{rule.ruleName}</h4>
                      <span className="text-[10px] font-mono text-[var(--text-sub)]">({rule.guid})</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-sub)]">{rule.description}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {(["Block", "Audit", "Disabled"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleAsrRuleChange(rule.id, mode)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          rule.state === mode
                            ? mode === "Block" ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                              mode === "Audit" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
                              "bg-gray-500/20 text-gray-400 border border-gray-500/40"
                            : "bg-[var(--bg-surface)] text-[var(--text-sub)] hover:text-[var(--text)] border border-[var(--border-c)]"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </NxCard>
        </div>
      )}

      {/* Modal: Add Exclusion */}
      {showAddExclusionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-[var(--text)]">Add Defender Exclusion</h3>
            <p className="text-xs text-[var(--text-sub)]">Exclusions prevent Windows Defender from scanning specified files, folders, extensions, or processes.</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[var(--text-sub)] block mb-1">Exclusion Type</label>
                <select
                  value={newExType}
                  onChange={e => setNewExType(e.target.value as any)}
                  className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] text-xs text-[var(--text)] rounded-xl p-2.5 focus:outline-none focus:border-[var(--amber)]"
                >
                  <option value="Folder">Folder Path</option>
                  <option value="File">Specific File</option>
                  <option value="Extension">File Extension (e.g. .mdf)</option>
                  <option value="Process">Executable Process Name (e.g. sqlservr.exe)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-sub)] block mb-1">Target Path / Value</label>
                <input
                  type="text"
                  placeholder={
                    newExType === "Folder" ? "C:\\Program Files\\MyCustomApp" :
                    newExType === "File" ? "C:\\Scripts\\custom.exe" :
                    newExType === "Extension" ? ".log" : "myprocess.exe"
                  }
                  value={newExValue}
                  onChange={e => setNewExValue(e.target.value)}
                  className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] text-xs text-[var(--text)] rounded-xl p-2.5 font-mono focus:outline-none focus:border-[var(--amber)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddExclusionModal(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border-c)] text-xs font-semibold hover:bg-[var(--bg-void)] text-[var(--text-sub)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExclusion}
                className="px-4 py-2 rounded-xl bg-[var(--amber)] text-black font-bold text-xs hover:opacity-90 transition-colors cursor-pointer"
              >
                Add Exclusion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Threat Inspection Details */}
      {selectedThreat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[var(--crit)] flex items-center gap-2">
                <AlertTriangle size={18} /> Threat Forensic Details
              </h3>
              <button onClick={() => setSelectedThreat(null)} className="text-[var(--text-sub)] hover:text-[var(--text)]">✕</button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 bg-[var(--bg-void)] rounded-xl border border-[var(--border-c)]">
                <div className="text-[var(--text-sub)] text-[10px]">THREAT NAME</div>
                <div className="font-bold text-base text-[var(--amber)]">{selectedThreat.threatName}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-[var(--bg-void)] rounded-xl border border-[var(--border-c)]">
                  <div className="text-[var(--text-sub)] text-[10px]">SEVERITY</div>
                  <div className="font-bold text-[var(--text)]">{selectedThreat.severity}</div>
                </div>
                <div className="p-2.5 bg-[var(--bg-void)] rounded-xl border border-[var(--border-c)]">
                  <div className="text-[var(--text-sub)] text-[10px]">CATEGORY</div>
                  <div className="font-bold text-[var(--text)]">{selectedThreat.category}</div>
                </div>
              </div>

              <div className="p-3 bg-[var(--bg-void)] rounded-xl border border-[var(--border-c)]">
                <div className="text-[var(--text-sub)] text-[10px]">INFECTED FILE PATH</div>
                <div className="font-bold text-[var(--text)] break-all">{selectedThreat.filePath}</div>
              </div>

              <div className="p-3 bg-[var(--bg-void)] rounded-xl border border-[var(--border-c)]">
                <div className="text-[var(--text-sub)] text-[10px]">SHA-256 HASH</div>
                <div className="text-[10px] text-[var(--teal)] break-all">{selectedThreat.sha256Hash}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  handleThreatAction(selectedThreat.id, "Quarantine");
                  setSelectedThreat(null);
                }}
                className="px-4 py-2 rounded-xl bg-[var(--amber)] text-black font-bold text-xs hover:opacity-90 transition-colors cursor-pointer"
              >
                Quarantine File
              </button>
              <button
                onClick={() => setSelectedThreat(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border-c)] text-xs font-semibold hover:bg-[var(--bg-void)] text-[var(--text-sub)] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: PowerShell Script Generator */}
      {showPsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[var(--text)] flex items-center gap-2">
                <Terminal size={18} className="text-[var(--amber)]" /> PowerShell Defender Command Studio
              </h3>
              <button onClick={() => setShowPsModal(false)} className="text-[var(--text-sub)] hover:text-[var(--text)]">✕</button>
            </div>

            <p className="text-xs text-[var(--text-sub)]">
              PowerShell script generated for server <span className="font-bold text-[var(--text)]">{server.toUpperCase()}</span> to manage Windows Defender via MpCmdRun & Defender module.
            </p>

            <pre className="p-4 bg-black/80 rounded-xl border border-[var(--border-c)] text-xs font-mono text-emerald-400 overflow-x-auto max-h-60">
{`# Windows Defender Status & Scan Operations for ${server.toUpperCase()}
Get-MpComputerStatus | Select-Object AntivirusEnabled, RealTimeProtectionEnabled, AntivirusSignatureAge, EngineVersion

# Trigger Quick Scan
Start-MpScan -ComputerName "${server}" -ScanType QuickScan

# Update Defender Signatures
Update-MpSignature -UpdateSource MVIP

# Configure Real-Time Protection
Set-MpPreference -DisableRealtimeMonitoring $false -MAPSReporting Advanced

# List Current Exclusions
Get-MpPreference | Select-Object ExclusionPath, ExclusionExtension, ExclusionProcess`}
            </pre>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Get-MpComputerStatus\nStart-MpScan -ScanType QuickScan\nUpdate-MpSignature`);
                  toast.success("PowerShell script copied to clipboard!");
                }}
                className="px-4 py-2 rounded-xl bg-[var(--amber)] text-black font-bold text-xs hover:opacity-90 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                Copy Script
              </button>
              <button
                onClick={() => setShowPsModal(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border-c)] text-xs font-semibold hover:bg-[var(--bg-void)] text-[var(--text-sub)] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
