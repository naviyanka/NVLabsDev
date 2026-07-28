import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Monitor,
  Play,
  Save,
  Trash2,
  Clock,
  Globe,
  Volume2,
  Clipboard,
  HardDrive,
  ChevronRight,
  X,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Settings,
  Users,
  Maximize2,
  Minimize2,
  Camera,
  MessageSquare,
  LogOut,
  Power,
  RefreshCw,
  Search,
  Download,
  Copy,
  Check,
  Lock,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Folder,
  Activity,
  Cpu,
  Key,
  Eye,
  Radio,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import {
  getServersClient,
  getRdpSessionsClient,
  disconnectRdpSessionClient,
  logoffRdpSessionClient,
  sendMessageRdpSessionClient,
  getRdpConfigClient,
  updateRdpConfigClient,
  type Server,
  type RdpSession,
  type RdpSecurityConfig
} from "@/api/client";

export const Route = createFileRoute("/remote-desktop")({
  head: () => ({
    meta: [
      { title: "Remote Desktop & Web RDP Studio — NEXUS" },
      { name: "description", content: "Interactive Web RDP Studio, session management, mstsc launcher, and RDP security policies." }
    ]
  }),
  component: RDPPage
});

interface SavedSession {
  id: string;
  host: string;
  label: string;
  resolution: string;
  colorDepth: string;
  audio: "local" | "remote" | "none";
  clipboard: boolean;
  drives: boolean;
  tag?: string;
  createdAt: string;
}

const DEFAULTS = {
  resolution: "1920x1080",
  colorDepth: "32",
  audio: "local" as const,
  clipboard: true,
  drives: false
};

const RES_OPTIONS = ["1280x720", "1366x768", "1600x900", "1920x1080", "2560x1440", "3840x2160", "Fit Window"];
const COLOR_OPTIONS = ["8", "16", "24", "32"];

type TabType = "launcher" | "web_console" | "sessions" | "saved" | "security";

function RDPPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loadingServers, setLoadingServers] = useState(true);
  const [selectedIp, setSelectedIp] = useState<string>("dc01");
  const [adhoc, setAdhoc] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("launcher");

  // RDP launcher options
  const [res, setRes] = useState(DEFAULTS.resolution);
  const [colorDepth, setColorDepth] = useState(DEFAULTS.colorDepth);
  const [audio, setAudio] = useState<"local" | "remote" | "none">(DEFAULTS.audio);
  const [clipboard, setClipboard] = useState(DEFAULTS.clipboard);
  const [drives, setDrives] = useState(DEFAULTS.drives);
  const [printers, setPrinters] = useState(true);
  const [multimon, setMultimon] = useState(false);

  // Connection state
  const [connecting, setConnecting] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [saveTag, setSaveTag] = useState("Production");
  const [history, setHistory] = useState<{ host: string; at: string }[]>([]);

  // Active Sessions tab data
  const [activeSessions, setActiveSessions] = useState<RdpSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionSearch, setSessionSearch] = useState("");

  // RDP Security Config tab data
  const [rdpConfig, setRdpConfig] = useState<RdpSecurityConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // Modals & Slideovers
  const [messageTargetSession, setMessageTargetSession] = useState<RdpSession | null>(null);
  const [messageText, setMessageText] = useState("");
  const [shadowTargetSession, setShadowTargetSession] = useState<RdpSession | null>(null);

  // Web Console Simulation state
  const [webSessionActive, setWebSessionActive] = useState(false);
  const [webSessionWindow, setWebSessionWindow] = useState<"desktop" | "startmenu" | "powershell" | "taskmgr" | "sysinfo">("desktop");
  const [webPsOutput, setWebPsOutput] = useState<string[]>([
    "Windows PowerShell v7.4.2 - NEXUS Remote Session",
    "Type 'help' or commands: 'Get-Process', 'Get-Service', 'hostname', 'ipconfig'\n"
  ]);
  const [webPsInput, setWebPsInput] = useState("");
  const [webClipboardText, setWebClipboardText] = useState("NEXUS_REMOTE_DESKTOP_BUFFER");
  const [showClipboardModal, setShowClipboardModal] = useState(false);
  const [showCtrlAltDelOverlay, setShowCtrlAltDelOverlay] = useState(false);
  const [webConsoleFullscreen, setWebConsoleFullscreen] = useState(false);
  const webCanvasRef = useRef<HTMLDivElement>(null);

  // Fetch servers & initial stored sessions
  useEffect(() => {
    getServersClient()
      .then((data) => {
        setServers(data);
        if (data.length > 0 && !selectedIp) setSelectedIp(data[0].ip);
      })
      .catch(() => toast.error("Failed to load servers"))
      .finally(() => setLoadingServers(false));

    try {
      const raw = localStorage.getItem("nexus-rdp-sessions");
      if (raw) setSavedSessions(JSON.parse(raw));
      const hist = localStorage.getItem("nexus-rdp-history");
      if (hist) setHistory(JSON.parse(hist));
    } catch {
      /* ignore */
    }
  }, []);

  const selectedServer = useMemo(
    () => servers.find((s) => s.ip === selectedIp || s.id === selectedIp),
    [servers, selectedIp]
  );

  const activeHost = adhoc.trim() || selectedServer?.ip || "dc01";

  // Fetch active sessions and RDP config when switching tabs or server
  useEffect(() => {
    if (activeTab === "sessions") {
      setLoadingSessions(true);
      getRdpSessionsClient(activeHost)
        .then(setActiveSessions)
        .finally(() => setLoadingSessions(false));
    } else if (activeTab === "security") {
      getRdpConfigClient(activeHost).then(setRdpConfig);
    }
  }, [activeTab, activeHost]);

  const persistSessions = (next: SavedSession[]) => {
    setSavedSessions(next);
    localStorage.setItem("nexus-rdp-sessions", JSON.stringify(next));
  };

  // Launch native MSTSC RDP protocol handler
  const launchNativeRdp = async (host: string, skipLogs?: boolean) => {
    if (!host || !host.trim()) {
      toast.error("Enter a valid server hostname or IP address");
      return;
    }
    if (connecting) return;
    setConnecting(true);

    const params = new URLSearchParams();
    if (RES_OPTIONS.slice(0, -1).includes(res)) {
      const [w, h] = res.split("x");
      params.set("w", w);
      params.set("h", h);
    }
    params.set("color", colorDepth);
    params.set("audio", audio);
    params.set("clipboard", String(clipboard));
    params.set("drives", String(drives));

    const url = `mstsc:${encodeURIComponent(host)}?${params.toString()}`;

    await new Promise((r) => setTimeout(r, 300));

    try {
      window.location.href = url;
      toast.success(`Opening Remote Desktop to ${host}`, {
        description: `${res} · ${colorDepth}-bit · Audio: ${audio}`
      });
      if (!skipLogs) {
        const entry = { host, at: new Date().toISOString() };
        const nextHistory = [entry, ...history.filter((h) => h.host !== host)].slice(0, 10);
        setHistory(nextHistory);
        localStorage.setItem("nexus-rdp-history", JSON.stringify(nextHistory));
      }
    } catch {
      toast.error("Failed to trigger local Remote Desktop client handler");
    } finally {
      setConnecting(false);
    }
  };

  // Generate and download .RDP configuration file
  const downloadRdpFile = (host: string) => {
    const target = host || "10.0.0.1";
    const [w, h] = res.includes("x") ? res.split("x") : ["1920", "1080"];

    const rdpContent = `screen mode id:i:${res === "Fit Window" ? 1 : 2}
use multimon:i:${multimon ? 1 : 0}
desktopwidth:i:${w}
desktopheight:i:${h}
session bpp:i:${colorDepth}
winposstr:s:0,3,0,0,800,600
full address:s:${target}
compression:i:1
keyboardhook:i:2
audiocapturemode:i:0
videoplaybackmode:i:1
connection type:i:7
networklevelauthentication:i:1
prompt for credentials:i:1
negotiate security layer:i:1
remoteapplicationmode:i:0
drivestoredirect:s:${drives ? "*" : ""}
redirectclipboard:i:${clipboard ? 1 : 0}
redirectprinters:i:${printers ? 1 : 0}
audiomode:i:${audio === "local" ? 0 : audio === "remote" ? 1 : 2}
`;

    const blob = new Blob([rdpContent], { type: "application/x-rdp" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NEXUS_${selectedServer?.name || target}_${res}.rdp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded RDP configuration file for ${target}`);
  };

  // Save session profile
  const saveSession = () => {
    const entry: SavedSession = {
      id: `${Date.now()}`,
      host: activeHost,
      label: saveLabel.trim() || selectedServer?.name || activeHost,
      resolution: res,
      colorDepth,
      audio,
      clipboard,
      drives,
      tag: saveTag,
      createdAt: new Date().toISOString()
    };
    persistSessions([entry, ...savedSessions]);
    setSaveLabel("");
    setShowSaveModal(false);
    toast.success("Saved RDP connection profile");
  };

  const deleteSession = (id: string) => {
    persistSessions(savedSessions.filter((s) => s.id !== id));
    toast.success("Profile removed");
  };

  const loadSession = (s: SavedSession) => {
    setRes(s.resolution);
    setColorDepth(s.colorDepth);
    setAudio(s.audio);
    setClipboard(s.clipboard);
    setDrives(s.drives);
    setAdhoc(s.host);
    setSelectedIp("");
    setActiveTab("launcher");
    toast.info(`Loaded profile: ${s.label}`);
  };

  // Active Session Management actions
  const handleDisconnectSession = async (sess: RdpSession) => {
    const ok = await disconnectRdpSessionClient(activeHost, sess.sessionId);
    if (ok) {
      toast.success(`Session ${sess.sessionName} (${sess.userName}) disconnected`);
      const updated = await getRdpSessionsClient(activeHost);
      setActiveSessions(updated);
    }
  };

  const handleLogoffSession = async (sess: RdpSession) => {
    const ok = await logoffRdpSessionClient(activeHost, sess.sessionId);
    if (ok) {
      toast.success(`User ${sess.userName} logged off from ${activeHost}`);
      const updated = await getRdpSessionsClient(activeHost);
      setActiveSessions(updated);
    }
  };

  const handleSendMessage = async () => {
    if (!messageTargetSession || !messageText.trim()) return;
    const ok = await sendMessageRdpSessionClient(activeHost, messageTargetSession.sessionId, messageText);
    if (ok) {
      toast.success(`Broadcast message sent to ${messageTargetSession.userName}`);
      setMessageTargetSession(null);
      setMessageText("");
    }
  };

  // Web RDP Terminal command executor
  const handleWebPsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webPsInput.trim()) return;
    const cmd = webPsInput.trim();
    let response = "";

    if (cmd.toLowerCase() === "get-process") {
      response = `NPM(K)    PM(M)    WS(M)     CPU(s)      Id  ProcessName
------    -----    -----     ------      --  -----------
   420   184.20   212.50      14.20    1042  lsass
   890   340.10   410.80     120.40    3102  NexusAgent
   120    45.10    58.20       2.10    5120  svchost
   650   890.40   920.10      88.30    7812  explorer`;
    } else if (cmd.toLowerCase() === "get-service") {
      response = `Status   Name               DisplayName
------   ----               -----------
Running  TermService        Remote Desktop Services
Running  NexusAgent         NEXUS Fleet Orchestrator Service
Running  WinRM              Windows Remote Management (WS-Management)
Stopped  Spooler            Print Spooler`;
    } else if (cmd.toLowerCase() === "hostname") {
      response = `${selectedServer?.name || activeHost}.NEXUS.LOCAL`;
    } else if (cmd.toLowerCase() === "ipconfig") {
      response = `Windows IP Configuration

Ethernet adapter vEthernet (Internal):
   IPv4 Address. . . . . . . . . . . : ${selectedServer?.ip || activeHost}
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 10.0.0.1`;
    } else if (cmd.toLowerCase() === "clear") {
      setWebPsOutput([]);
      setWebPsInput("");
      return;
    } else {
      response = `PS C:\\Users\\Administrator> ${cmd}: Command executed on remote node ${selectedServer?.name || activeHost}.`;
    }

    setWebPsOutput((prev) => [...prev, `PS C:\\Users\\Administrator> ${cmd}`, response]);
    setWebPsInput("");
  };

  // Filtered Sessions
  const filteredActiveSessions = useMemo(() => {
    return activeSessions.filter((s) => {
      if (!sessionSearch.trim()) return true;
      const q = sessionSearch.toLowerCase();
      return (
        s.userName.toLowerCase().includes(q) ||
        s.sessionName.toLowerCase().includes(q) ||
        s.clientIp.includes(q) ||
        s.clientName.toLowerCase().includes(q)
      );
    });
  }, [activeSessions, sessionSearch]);

  return (
    <PageWrapper>
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[var(--border-c)]">
        <div>
          <PageHeader eyebrow="Management & Remote Access" title="Remote Desktop" />
          <p className="mono text-[11px] text-[var(--text-sub)] mt-1 flex items-center gap-2">
            <span>Target Node: <strong className="text-[var(--text)]">{selectedServer?.name || activeHost}</strong></span>
            <span>•</span>
            <span className="text-[var(--ok)]">Port 3389 Active (RDP Listener)</span>
            <span>•</span>
            <span className="text-[var(--amber)]">{activeSessions.filter((s) => s.state === "Active").length} Active User Sessions</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadRdpFile(activeHost)}
            className="mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-sub)] hover:text-[var(--text)] hover:border-[var(--amber)] transition-colors">
            <Download size={13} /> Export .RDP
          </button>

          <button
            onClick={() => setShowSaveModal(true)}
            className="mono flex items-center gap-1.5 rounded-md border border-[var(--amber)]/40 bg-[var(--amber-low)] px-3 py-1.5 text-[11px] font-bold text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black transition-colors">
            <Save size={13} /> Save Profile
          </button>
        </div>
      </div>

      {/* Target Server Selector */}
      <div className="mt-4">
        <ServerSelector value={selectedIp} onChange={(val) => { setSelectedIp(val); setAdhoc(""); }} />
      </div>

      {/* Tabs Navigation */}
      <div className="mt-5 flex items-center justify-between border-b border-[var(--border-c)]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("launcher")}
            className={`mono flex items-center gap-2 px-4 py-2 text-[12px] font-bold border-b-2 transition-colors ${
              activeTab === "launcher"
                ? "border-[var(--amber)] text-[var(--amber)]"
                : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"
            }`}>
            <Monitor size={14} /> Native Launcher & Presets
          </button>

          <button
            onClick={() => {
              setActiveTab("web_console");
              setWebSessionActive(true);
            }}
            className={`mono flex items-center gap-2 px-4 py-2 text-[12px] font-bold border-b-2 transition-colors ${
              activeTab === "web_console"
                ? "border-[var(--amber)] text-[var(--amber)]"
                : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"
            }`}>
            <Radio size={14} className="text-[var(--amber)] animate-pulse" /> Live Web RDP Studio
          </button>

          <button
            onClick={() => setActiveTab("sessions")}
            className={`mono flex items-center gap-2 px-4 py-2 text-[12px] font-bold border-b-2 transition-colors ${
              activeTab === "sessions"
                ? "border-[var(--amber)] text-[var(--amber)]"
                : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"
            }`}>
            <Users size={14} /> Active Server Sessions
            <span className="mono text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border-dim)]">
              {activeSessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("saved")}
            className={`mono flex items-center gap-2 px-4 py-2 text-[12px] font-bold border-b-2 transition-colors ${
              activeTab === "saved"
                ? "border-[var(--amber)] text-[var(--amber)]"
                : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"
            }`}>
            <BookmarkIcon size={14} /> Saved Profiles ({savedSessions.length})
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`mono flex items-center gap-2 px-4 py-2 text-[12px] font-bold border-b-2 transition-colors ${
              activeTab === "security"
                ? "border-[var(--amber)] text-[var(--amber)]"
                : "border-transparent text-[var(--text-sub)] hover:text-[var(--text)]"
            }`}>
            <ShieldCheck size={14} /> Security & RDP Policies
          </button>
        </div>
      </div>

      {/* Tab 1: Native Launcher */}
      {activeTab === "launcher" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] mt-4">
          <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-sm space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-[var(--border-c)]">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]/20">
                <Monitor size={22} />
              </div>
              <div>
                <h2 className="display text-base font-bold text-[var(--text)]">Launch Remote Desktop Session</h2>
                <p className="text-[11px] text-[var(--text-sub)]">
                  Configure display resolution, audio routing, and hardware redirection options for {selectedServer?.name || activeHost}.
                </p>
              </div>
            </div>

            {/* Target Server Input */}
            <div>
              <label className="mono text-[10px] uppercase tracking-wider text-[var(--text-ghost)] block mb-1.5">
                Target Machine Host / IP
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={adhoc || selectedServer?.ip || ""}
                  onChange={(e) => {
                    setAdhoc(e.target.value);
                    setSelectedIp("");
                  }}
                  placeholder="Enter IP or FQDN (e.g. 10.0.0.1)"
                  className="mono flex-1 rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                />
                {adhoc && (
                  <button
                    onClick={() => setAdhoc("")}
                    className="px-3 rounded-lg border border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--text)]">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Resolution + Color depth */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mono text-[10px] uppercase tracking-wider text-[var(--text-ghost)] block mb-1.5">
                  Display Resolution
                </label>
                <select
                  value={res}
                  onChange={(e) => setRes(e.target.value)}
                  className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none">
                  {RES_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mono text-[10px] uppercase tracking-wider text-[var(--text-ghost)] block mb-1.5">
                  Color Depth
                </label>
                <select
                  value={colorDepth}
                  onChange={(e) => setColorDepth(e.target.value)}
                  className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none">
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}-bit (True Color)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Audio Routing */}
            <div>
              <label className="mono text-[10px] uppercase tracking-wider text-[var(--text-ghost)] block mb-1.5">
                Remote Audio Routing
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { v: "local", icon: Volume2, label: "Play on local PC" },
                  { v: "remote", icon: Volume2, label: "Leave on remote server" },
                  { v: "none", icon: X, label: "Disable audio" }
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = audio === opt.v;
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setAudio(opt.v as any)}
                      className={`mono flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                        active
                          ? "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)]"
                          : "border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)] hover:text-[var(--text)]"
                      }`}>
                      <Icon size={13} /> {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Device Redirection Toggles */}
            <div className="space-y-2">
              <label className="mono text-[10px] uppercase tracking-wider text-[var(--text-ghost)] block mb-1">
                Resource Redirection
              </label>
              <ToggleRow icon={Clipboard} label="Clipboard Redirection (Copy/Paste)" checked={clipboard} onChange={setClipboard} />
              <ToggleRow icon={HardDrive} label="Local Drive Redirection (Share storage)" checked={drives} onChange={setDrives} />
              <ToggleRow icon={Maximize2} label="Enable Multi-Monitor Support" checked={multimon} onChange={setMultimon} />
            </div>

            {/* Summary + Launch Buttons */}
            <div className="rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] p-3.5 space-y-1.5">
              <div className="mono flex items-center justify-between text-[11px] text-[var(--text-sub)]">
                <span>Target Address:</span>
                <span className="text-[var(--text)] font-semibold">{activeHost}</span>
              </div>
              <div className="mono flex items-center justify-between text-[11px] text-[var(--text-sub)]">
                <span>Configuration:</span>
                <span>
                  {res} · {colorDepth}-bit · Audio: {audio}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => launchNativeRdp(activeHost)}
                disabled={connecting}
                className="mono flex items-center justify-center gap-2 rounded-xl bg-[var(--amber)] py-2.5 text-[12px] font-bold text-black hover:bg-[var(--amber)]/90 disabled:opacity-50 transition-colors shadow-sm">
                {connecting ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                Launch Native MSTSC
              </button>

              <button
                onClick={() => {
                  setActiveTab("web_console");
                  setWebSessionActive(true);
                }}
                className="mono flex items-center justify-center gap-2 rounded-xl border border-[var(--amber)]/50 bg-[var(--amber-low)] py-2.5 text-[12px] font-bold text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black transition-colors">
                <Radio size={15} /> Launch Web RDP Studio
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="display text-xs font-bold text-[var(--text)]">Recent Connections</h3>
                <Clock size={14} className="text-[var(--text-ghost)]" />
              </div>

              {history.length === 0 ? (
                <p className="text-[11px] text-[var(--text-ghost)] text-center py-4">No recent connections recorded.</p>
              ) : (
                <div className="divide-y divide-[var(--border-dim)]">
                  {history.map((h, i) => (
                    <div key={i + h.host} className="flex items-center justify-between py-2 text-[11px]">
                      <div>
                        <span className="mono text-[var(--text)] font-semibold block">{h.host}</span>
                        <span className="mono text-[10px] text-[var(--text-ghost)]">{relativeTime(h.at)}</span>
                      </div>
                      <button
                        onClick={() => launchNativeRdp(h.host, true)}
                        className="mono text-[10px] text-[var(--amber)] hover:underline flex items-center gap-1">
                        Connect <ChevronRight size={10} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem("nexus-rdp-history");
                    }}
                    className="mono w-full pt-2 text-center text-[10px] uppercase text-[var(--text-ghost)] hover:text-[var(--crit)]">
                    Clear History
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text)]">
                <Globe size={13} className="text-[var(--amber)]" /> Native MSTSC Protocol Handler
              </div>
              <p className="text-[11px] text-[var(--text-sub)] leading-relaxed">
                NEXUS triggers the Windows Remote Desktop Connection client via <code className="mono text-[var(--amber)]">mstsc:</code> URI scheme with pre-configured parameters.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Interactive Web RDP Studio Simulator */}
      {activeTab === "web_console" && (
        <div className="mt-4 space-y-3">
          {/* Web Console Session Top Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--ok)] animate-ping" />
                <span className="display text-xs font-bold text-[var(--text)]">Live Web RDP Studio</span>
              </div>
              <span className="mono text-[11px] text-[var(--amber)] bg-[var(--amber-low)] border border-[var(--amber)]/30 px-2 py-0.5 rounded">
                Node: {selectedServer?.name || activeHost} ({selectedServer?.ip || activeHost})
              </span>
              <span className="mono text-[10px] text-[var(--text-ghost)] hidden sm:inline">1920x1080 · 60 FPS · 12ms RTT</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowCtrlAltDelOverlay(true)}
                className="mono flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-c)] text-[11px] font-semibold text-[var(--text)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors">
                <Lock size={12} /> Ctrl+Alt+Del
              </button>

              <button
                onClick={() => setShowClipboardModal(true)}
                className="mono flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-c)] text-[11px] font-semibold text-[var(--text)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors">
                <Clipboard size={12} /> Remote Clipboard
              </button>

              <button
                onClick={() => {
                  toast.success("Captured high-res PNG frame of remote session desktop");
                }}
                className="mono flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-c)] text-[11px] font-semibold text-[var(--text)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors">
                <Camera size={12} /> Screenshot
              </button>

              <button
                onClick={() => setWebConsoleFullscreen(!webConsoleFullscreen)}
                className="mono flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--amber)] text-black text-[11px] font-bold hover:bg-[var(--amber)]/90 transition-colors">
                {webConsoleFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                {webConsoleFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </button>
            </div>
          </div>

          {/* Interactive Desktop Canvas Frame */}
          <div
            ref={webCanvasRef}
            className={`relative rounded-xl border border-[var(--border-c)] bg-[#0c0d12] overflow-hidden shadow-2xl transition-all ${
              webConsoleFullscreen ? "fixed inset-2 z-50 rounded-none border-none" : "min-h-[580px]"
            }`}>
            {/* Windows Server Desktop Wallpaper Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#09152b] via-[#080d19] to-[#04060b] flex flex-col justify-between p-6 select-none">
              {/* Desktop Icons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 max-w-2xl z-10">
                <button
                  onClick={() => setWebSessionWindow("sysinfo")}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/10 transition-colors group text-left">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                    <Monitor size={24} />
                  </div>
                  <span className="text-[11px] font-medium text-white shadow-sm">Server Manager</span>
                </button>

                <button
                  onClick={() => setWebSessionWindow("powershell")}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/10 transition-colors group text-left">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-blue-500/50 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                    <Terminal size={24} />
                  </div>
                  <span className="text-[11px] font-medium text-white shadow-sm">PowerShell Console</span>
                </button>

                <button
                  onClick={() => setWebSessionWindow("taskmgr")}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/10 transition-colors group text-left">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Activity size={24} />
                  </div>
                  <span className="text-[11px] font-medium text-white shadow-sm">Task Manager</span>
                </button>

                <button
                  onClick={() => toast.info("Opening Windows Explorer Drive C:\\...")}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/10 transition-colors group text-left">
                  <div className="w-12 h-12 rounded-xl bg-amber-600/30 border border-amber-400/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                    <Folder size={24} />
                  </div>
                  <span className="text-[11px] font-medium text-white shadow-sm">This PC (C:)</span>
                </button>
              </div>

              {/* Floating Active Application Windows inside Canvas */}
              {webSessionWindow === "powershell" && (
                <div className="absolute top-12 left-12 right-12 bottom-20 z-20 bg-[#000000]/95 border border-[var(--border-c)] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
                    <div className="flex items-center gap-2 text-[12px] font-mono text-slate-200">
                      <Terminal size={14} className="text-blue-400" /> Administrator: Windows PowerShell (RDP Node)
                    </div>
                    <button onClick={() => setWebSessionWindow("desktop")} className="text-slate-400 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-4 flex-1 font-mono text-[12px] text-green-400 overflow-y-auto space-y-2 leading-relaxed">
                    {webPsOutput.map((out, idx) => (
                      <pre key={idx} className="whitespace-pre-wrap font-mono">
                        {out}
                      </pre>
                    ))}
                  </div>

                  <form onSubmit={handleWebPsSubmit} className="p-2 bg-[#161b22] border-t border-[#30363d] flex gap-2">
                    <span className="font-mono text-[12px] text-green-400 pl-2 self-center">PS C:\&gt;</span>
                    <input
                      type="text"
                      value={webPsInput}
                      onChange={(e) => setWebPsInput(e.target.value)}
                      placeholder="Type command (e.g. Get-Process, Get-Service, hostname)..."
                      className="flex-1 bg-transparent font-mono text-[12px] text-white outline-none"
                    />
                  </form>
                </div>
              )}

              {webSessionWindow === "taskmgr" && (
                <div className="absolute top-16 left-20 right-20 bottom-24 z-20 bg-[#161b22] border border-[var(--border-c)] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1117] border-b border-[#30363d]">
                    <div className="flex items-center gap-2 text-[12px] font-bold text-white">
                      <Activity size={14} className="text-emerald-400" /> Task Manager — {selectedServer?.name || activeHost}
                    </div>
                    <button onClick={() => setWebSessionWindow("desktop")} className="text-slate-400 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-4 space-y-4 text-xs font-mono text-slate-200 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                        <div className="text-[10px] text-slate-400">CPU Usage</div>
                        <div className="text-lg font-bold text-emerald-400">14%</div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                        <div className="text-[10px] text-slate-400">Memory Used</div>
                        <div className="text-lg font-bold text-blue-400">6.2 / 32 GB (19%)</div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                        <div className="text-[10px] text-slate-400">Disk Throughput</div>
                        <div className="text-lg font-bold text-amber-400">1.2 MB/s</div>
                      </div>
                    </div>

                    <div className="divide-y divide-[#30363d]">
                      <div className="py-2 flex justify-between font-bold text-slate-400">
                        <span>Process Name</span>
                        <span>PID</span>
                        <span>Memory</span>
                        <span>Status</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span>lsass.exe</span>
                        <span>1042</span>
                        <span>212 MB</span>
                        <span className="text-emerald-400">Running</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span>NexusAgent.exe</span>
                        <span>3102</span>
                        <span>410 MB</span>
                        <span className="text-emerald-400">Running</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span>svchost.exe (TermService)</span>
                        <span>5120</span>
                        <span>58 MB</span>
                        <span className="text-emerald-400">Running</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {webSessionWindow === "sysinfo" && (
                <div className="absolute top-16 left-24 right-24 bottom-24 z-20 bg-[#161b22] border border-[var(--border-c)] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1117] border-b border-[#30363d]">
                    <div className="flex items-center gap-2 text-[12px] font-bold text-white">
                      <Monitor size={14} className="text-blue-400" /> Server Manager — Dashboard
                    </div>
                    <button onClick={() => setWebSessionWindow("desktop")} className="text-slate-400 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-5 space-y-3 font-mono text-xs text-slate-200">
                    <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                      <span className="text-slate-400 block">Host OS:</span>
                      <span className="text-white font-bold">Windows Server 2025 Standard (Build 26100)</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                      <span className="text-slate-400 block">Domain / Workgroup:</span>
                      <span className="text-white font-bold">NEXUS.LOCAL (Domain Controller)</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                      <span className="text-slate-400 block">Active Roles:</span>
                      <span className="text-amber-400 font-bold">Active Directory Domain Services, DNS Server, WSUS, Hyper-V</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Windows Bottom Taskbar */}
              <div className="absolute bottom-0 left-0 right-0 h-11 bg-[#10141d]/90 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-4 z-30">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setWebSessionWindow(webSessionWindow === "startmenu" ? "desktop" : "startmenu")
                    }
                    className="p-2 rounded-lg hover:bg-white/10 text-blue-400 transition-colors">
                    <Monitor size={18} />
                  </button>

                  <div className="h-5 w-px bg-white/10 mx-1" />

                  <button
                    onClick={() => setWebSessionWindow("powershell")}
                    className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
                      webSessionWindow === "powershell" ? "bg-white/20 text-white" : "hover:bg-white/10 text-slate-300"
                    }`}>
                    <Terminal size={14} className="text-blue-400" /> PowerShell
                  </button>

                  <button
                    onClick={() => setWebSessionWindow("taskmgr")}
                    className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
                      webSessionWindow === "taskmgr" ? "bg-white/20 text-white" : "hover:bg-white/10 text-slate-300"
                    }`}>
                    <Activity size={14} className="text-emerald-400" /> Task Manager
                  </button>
                </div>

                <div className="mono text-[10px] text-slate-300 flex items-center gap-3">
                  <span>ENG</span>
                  <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Active Server Sessions (qwinsta) */}
      {activeTab === "sessions" && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)]">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-ghost)]" />
              <input
                type="text"
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                placeholder="Search username, session ID, client IP..."
                className="w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-1.5 pl-9 pr-3 text-[12px] text-[var(--text)] placeholder-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                setLoadingSessions(true);
                getRdpSessionsClient(activeHost)
                  .then(setActiveSessions)
                  .finally(() => setLoadingSessions(false));
              }}
              className="mono flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--border-c)] text-[11px] font-semibold text-[var(--text-sub)] hover:text-[var(--text)] transition-colors">
              <RefreshCw size={13} className={loadingSessions ? "animate-spin" : ""} /> Refresh Sessions
            </button>
          </div>

          <div className="rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] overflow-hidden shadow-sm">
            {loadingSessions ? (
              <div className="p-12 text-center text-[12px] text-[var(--text-sub)] flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-[var(--amber)]" /> Querying Terminal Services Terminal sessions...
              </div>
            ) : filteredActiveSessions.length === 0 ? (
              <div className="p-12 text-center text-[12px] text-[var(--text-sub)]">
                No active Terminal Services sessions found on {selectedServer?.name || activeHost}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="border-b border-[var(--border-dim)] bg-[var(--bg-surface)] text-[10px] uppercase font-mono tracking-wider text-[var(--text-ghost)]">
                    <tr>
                      <th className="p-3">Session ID & Name</th>
                      <th className="p-3">User & Domain</th>
                      <th className="p-3">State</th>
                      <th className="p-3">Client Workstation & IP</th>
                      <th className="p-3">Logon Time</th>
                      <th className="p-3">Protocol & Security</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-dim)]">
                    {filteredActiveSessions.map((sess) => (
                      <tr key={sess.sessionId} className="hover:bg-[var(--bg-surface)] transition-colors">
                        <td className="p-3 font-mono">
                          <div className="font-bold text-[var(--text)]">#{sess.sessionId}</div>
                          <div className="text-[10px] text-[var(--amber)]">{sess.sessionName}</div>
                        </td>

                        <td className="p-3 font-semibold text-[var(--text)]">
                          {sess.domain}\{sess.userName}
                        </td>

                        <td className="p-3">
                          <span
                            className={`mono text-[10px] px-2 py-0.5 rounded font-bold ${
                              sess.state === "Active"
                                ? "bg-[var(--ok)]/20 text-[var(--ok)] border border-[var(--ok)]/30"
                                : sess.state === "Disconnected"
                                ? "bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]/30"
                                : "bg-[var(--bg-surface)] text-[var(--text-sub)] border border-[var(--border-dim)]"
                            }`}>
                            {sess.state}
                          </span>
                        </td>

                        <td className="p-3 font-mono text-[11px]">
                          <div className="text-[var(--text)]">{sess.clientName}</div>
                          <div className="text-[10px] text-[var(--text-ghost)]">{sess.clientIp}</div>
                        </td>

                        <td className="p-3 font-mono text-[11px] text-[var(--text-sub)]">{sess.logonTime}</td>

                        <td className="p-3 font-mono text-[10px] text-[var(--text-sub)]">
                          <div>{sess.protocol}</div>
                          <div className="text-[var(--ok)]">{sess.encryptionLevel}</div>
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setMessageTargetSession(sess)}
                              title="Send Message"
                              className="p-1 rounded text-[var(--text-sub)] hover:text-[var(--amber)] transition-colors">
                              <MessageSquare size={14} />
                            </button>

                            <button
                              onClick={() => handleDisconnectSession(sess)}
                              title="Disconnect Session"
                              className="mono text-[11px] px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors">
                              Disconnect
                            </button>

                            <button
                              onClick={() => handleLogoffSession(sess)}
                              title="Logoff User"
                              className="mono text-[11px] px-2 py-1 rounded bg-[var(--crit)]/20 text-[var(--crit)] font-semibold border border-[var(--crit)]/30 hover:bg-[var(--crit)] hover:text-white transition-colors">
                              Logoff
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Saved Session Profiles */}
      {activeTab === "saved" && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-c)]">
            <div>
              <h3 className="display text-sm font-bold text-[var(--text)]">Saved Connection Profiles</h3>
              <p className="text-[11px] text-[var(--text-sub)]">Stored connection templates for domain controllers and production clusters.</p>
            </div>

            <button
              onClick={() => setShowSaveModal(true)}
              className="mono flex items-center gap-1.5 rounded bg-[var(--amber)] px-3 py-1.5 text-[11px] font-bold text-black hover:bg-[var(--amber)]/90 transition-colors">
              <Save size={13} /> Create New Profile
            </button>
          </div>

          {savedSessions.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)]">
              <p className="text-[12px] text-[var(--text-sub)]">No saved profiles. Click "Create New Profile" to save your RDP settings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedSessions.map((s) => (
                <div key={s.id} className="p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-[13px] text-[var(--text)]">{s.label}</div>
                      <div className="mono text-[11px] text-[var(--amber)]">{s.host}</div>
                    </div>
                    <span className="mono text-[10px] px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-dim)]">
                      {s.tag || "General"}
                    </span>
                  </div>

                  <div className="mono text-[11px] text-[var(--text-sub)] space-y-1 p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-dim)]">
                    <div>Resolution: {s.resolution}</div>
                    <div>Color Depth: {s.colorDepth}-bit</div>
                    <div>Audio: {s.audio}</div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-c)]">
                    <button
                      onClick={() => deleteSession(s.id)}
                      className="mono text-[11px] text-[var(--crit)] hover:underline flex items-center gap-1">
                      <Trash2 size={12} /> Delete
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadSession(s)}
                        className="mono text-[11px] px-2.5 py-1 rounded border border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--text)]">
                        Load Options
                      </button>

                      <button
                        onClick={() => launchNativeRdp(s.host)}
                        className="mono text-[11px] px-3 py-1 rounded bg-[var(--amber)] text-black font-bold hover:bg-[var(--amber)]/90 flex items-center gap-1">
                        <Play size={12} /> Connect
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Security & RDP Policies */}
      {activeTab === "security" && rdpConfig && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-c)]">
              <ShieldCheck size={18} className="text-[var(--amber)]" />
              <h3 className="display text-sm font-bold text-[var(--text)]">RDP Security & Transport Policies</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mono text-[11px] uppercase text-[var(--text-ghost)] block mb-1">Target Listening TCP Port</label>
                <input
                  type="number"
                  value={rdpConfig.rdpPort}
                  onChange={(e) => setRdpConfig({ ...rdpConfig, rdpPort: Number(e.target.value) })}
                  className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[12px] text-[var(--text)] outline-none focus:border-[var(--amber)]"
                />
              </div>

              <ToggleRow
                icon={Lock}
                label="Require Network Level Authentication (NLA)"
                checked={rdpConfig.nlaRequired}
                onChange={(v) => setRdpConfig({ ...rdpConfig, nlaRequired: v })}
              />

              <ToggleRow
                icon={ShieldCheck}
                label="Enforce TLS 1.3 / FIPS Cryptographic Validation"
                checked={rdpConfig.tlsEnforced}
                onChange={(v) => setRdpConfig({ ...rdpConfig, tlsEnforced: v })}
              />

              <ToggleRow
                icon={Radio}
                label="Windows Firewall Remote Desktop Inbound Rule"
                checked={rdpConfig.firewallRuleEnabled}
                onChange={(v) => setRdpConfig({ ...rdpConfig, firewallRuleEnabled: v })}
              />

              <div>
                <label className="mono text-[11px] uppercase text-[var(--text-ghost)] block mb-1">Max Idle Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={rdpConfig.maxIdleTimeoutMins}
                  onChange={(e) => setRdpConfig({ ...rdpConfig, maxIdleTimeoutMins: Number(e.target.value) })}
                  className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[12px] text-[var(--text)] outline-none focus:border-[var(--amber)]"
                />
              </div>

              <button
                onClick={async () => {
                  setSavingConfig(true);
                  await updateRdpConfigClient(activeHost, rdpConfig);
                  setSavingConfig(false);
                  toast.success("RDP security policy updated and applied to registry!");
                }}
                className="mono mt-2 w-full py-2 rounded bg-[var(--amber)] text-black text-[11px] font-bold hover:bg-[var(--amber)]/90 transition-colors">
                Apply RDP Security Policy
              </button>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-c)]">
              <Terminal size={18} className="text-[var(--amber)]" />
              <h3 className="display text-sm font-bold text-[var(--text)]">PowerShell Policy Hardening Generator</h3>
            </div>

            <pre className="p-4 rounded-lg bg-black text-[var(--amber)] mono text-[11px] overflow-x-auto border border-[var(--border-c)] leading-relaxed select-all">
              {`# Enforce RDP Hardening on ${selectedServer?.name || activeHost}
Set-ItemProperty -Path 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server' -Name 'fDenyTSConnections' -Value 0
Set-ItemProperty -Path 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp' -Name 'UserAuthentication' -Value ${
                rdpConfig.nlaRequired ? 1 : 0
              }
Enable-NetFirewallRule -DisplayGroup 'Remote Desktop'
Set-ItemProperty -Path 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp' -Name 'PortNumber' -Value ${
                rdpConfig.rdpPort
              }
`}
            </pre>

            <button
              onClick={() => {
                navigator.clipboard.writeText(`Set-ItemProperty -Path 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server' -Name 'fDenyTSConnections' -Value 0`);
                toast.success("PowerShell policy copied!");
              }}
              className="mono w-full py-2 rounded border border-[var(--border-c)] text-[11px] font-semibold text-[var(--text)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors flex items-center justify-center gap-1.5">
              <Copy size={13} /> Copy PowerShell Hardening Script
            </button>
          </div>
        </div>
      )}

      {/* Save Session Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-c)]">
              <h3 className="display text-sm font-bold text-[var(--text)]">Save RDP Profile</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-[var(--text-ghost)] hover:text-[var(--text)]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mono text-[10px] uppercase text-[var(--text-ghost)] block mb-1">Profile Name / Label</label>
                <input
                  type="text"
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                  placeholder={selectedServer?.name || activeHost}
                  className="w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] text-[var(--text)] outline-none focus:border-[var(--amber)]"
                />
              </div>

              <div>
                <label className="mono text-[10px] uppercase text-[var(--text-ghost)] block mb-1">Tag / Group</label>
                <select
                  value={saveTag}
                  onChange={(e) => setSaveTag(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] text-[var(--text)] outline-none focus:border-[var(--amber)]">
                  <option value="Production">Production</option>
                  <option value="Domain Controllers">Domain Controllers</option>
                  <option value="SQL Cluster">SQL Cluster</option>
                  <option value="Lab & Staging">Lab & Staging</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-c)]">
              <button
                onClick={() => setShowSaveModal(false)}
                className="mono px-3 py-1.5 rounded text-[11px] text-[var(--text-sub)] hover:text-[var(--text)]">
                Cancel
              </button>
              <button
                onClick={saveSession}
                className="mono px-4 py-1.5 rounded bg-[var(--amber)] text-black text-[11px] font-bold hover:bg-[var(--amber)]/90">
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {messageTargetSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-c)]">
              <h3 className="display text-sm font-bold text-[var(--text)]">Send Popup Message to User</h3>
              <button onClick={() => setMessageTargetSession(null)} className="text-[var(--text-ghost)] hover:text-[var(--text)]">
                <X size={16} />
              </button>
            </div>

            <p className="text-[11px] text-[var(--text-sub)]">
              Recipient: <strong className="text-[var(--amber)]">{messageTargetSession.domain}\{messageTargetSession.userName}</strong> (Session #{messageTargetSession.sessionId})
            </p>

            <textarea
              rows={3}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Enter broadcast message (e.g. Server restarting in 5 minutes for patch updates)..."
              className="w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] p-3 text-[12px] text-[var(--text)] outline-none focus:border-[var(--amber)]"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-c)]">
              <button
                onClick={() => setMessageTargetSession(null)}
                className="mono px-3 py-1.5 rounded text-[11px] text-[var(--text-sub)] hover:text-[var(--text)]">
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                className="mono px-4 py-1.5 rounded bg-[var(--amber)] text-black text-[11px] font-bold hover:bg-[var(--amber)]/90">
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remote Clipboard Modal */}
      {showClipboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg p-6 bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-c)]">
              <div className="flex items-center gap-2">
                <Clipboard size={18} className="text-[var(--amber)]" />
                <h3 className="display text-sm font-bold text-[var(--text)]">Bi-Directional Remote Clipboard Buffer</h3>
              </div>
              <button onClick={() => setShowClipboardModal(false)} className="text-[var(--text-ghost)] hover:text-[var(--text)]">
                <X size={16} />
              </button>
            </div>

            <textarea
              rows={6}
              value={webClipboardText}
              onChange={(e) => setWebClipboardText(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] p-3 mono text-[12px] text-[var(--amber)] outline-none focus:border-[var(--amber)]"
            />

            <div className="flex justify-between items-center pt-2 border-t border-[var(--border-c)]">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(webClipboardText);
                  toast.success("Copied from Remote Clipboard!");
                }}
                className="mono text-[11px] text-[var(--amber)] hover:underline flex items-center gap-1">
                <Copy size={13} /> Copy to Local Clipboard
              </button>

              <button
                onClick={() => {
                  setShowClipboardModal(false);
                  toast.success("Remote clipboard buffer updated.");
                }}
                className="mono px-4 py-1.5 rounded bg-[var(--amber)] text-black text-[11px] font-bold hover:bg-[var(--amber)]/90">
                Sync Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ctrl+Alt+Del Overlay Modal */}
      {showCtrlAltDelOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/90 backdrop-blur-md p-4">
          <div className="w-full max-w-sm p-6 bg-[#001f3f] border border-blue-400/30 rounded-2xl shadow-2xl space-y-4 text-center">
            <h3 className="text-lg font-bold text-white">Windows Security</h3>
            <p className="text-xs text-blue-200">Select an action for {selectedServer?.name || activeHost}:</p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowCtrlAltDelOverlay(false);
                  toast.info("Remote computer locked.");
                }}
                className="w-full py-2 bg-blue-800/60 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">
                Lock
              </button>
              <button
                onClick={() => {
                  setShowCtrlAltDelOverlay(false);
                  setWebSessionWindow("taskmgr");
                }}
                className="w-full py-2 bg-blue-800/60 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">
                Task Manager
              </button>
              <button
                onClick={() => {
                  setShowCtrlAltDelOverlay(false);
                  toast.warning("Signed out from remote session.");
                  setWebSessionActive(false);
                }}
                className="w-full py-2 bg-red-600/60 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors">
                Sign Out
              </button>
            </div>

            <button
              onClick={() => setShowCtrlAltDelOverlay(false)}
              className="text-xs text-blue-300 hover:underline pt-2 inline-block">
              Cancel
            </button>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  checked,
  onChange
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-left transition-colors hover:border-[var(--amber)]/40">
      <span className="flex items-center gap-2 text-[12px] text-[var(--text)]">
        <Icon size={14} className="text-[var(--amber)]" /> {label}
      </span>
      <span
        className={`relative h-4 w-8 shrink-0 rounded-full transition-colors ${checked ? "bg-[var(--amber)]" : "bg-[var(--border-dim)]"}`}>
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-black transition-all ${
            checked ? "left-[17px]" : "left-0.5 bg-white"
          }`}
        />
      </span>
    </button>
  );
}

function BookmarkIcon({ size }: { size?: number }) {
  return <Save size={size} />;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

