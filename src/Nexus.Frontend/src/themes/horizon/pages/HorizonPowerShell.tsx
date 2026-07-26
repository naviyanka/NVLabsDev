import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { 
  Terminal as TermIcon, Trash2, Plus, X, Download, Sliders, Shield, 
  FileText, Play, ZoomIn, ZoomOut, TerminalIcon, Maximize2, Minimize2, 
  Code, BookOpen, Copy, Check, Search, Palette, ServerIcon
} from "lucide-react";

import { getServersClient, type Server } from "@/api/client";
import { getFrontendSettings } from "@/lib/frontendSettings";
import { 
  terminalStore, getActiveTerminalTheme, TERMINAL_PALETTES, 
  type PtySession, type TerminalPalette 
} from "@/lib/terminalStore";
import { toast } from "sonner";
import { 
  CustomScriptModal, CmdletCheatSheetDrawer, getStoredScripts, 
  saveStoredScripts, type CustomScript 
} from "@/components/powershell/PowerShellTools";

const BUILTIN_SCRIPTS = [
  { label: "Audit Local Admins", cmd: "Get-LocalGroupMember -Group 'Administrators'\r" },
  { label: "Active Network Connections", cmd: "Get-NetTCPConnection -State Established | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State -First 15\r" },
  { label: "Installed Windows Features", cmd: "Get-WindowsFeature | Where-Object Installed | Select-Object Name, DisplayName -First 15\r" },
  { label: "Top Memory Processes", cmd: "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 10 Name, Id, @{N='RAM_MB';E={[math]::Round($_.WorkingSet64/1MB,1)}}\r" },
  { label: "Disk Free Space", cmd: "Get-Volume | Select-Object DriveLetter, FileSystemLabel, SizeRemaining, Size\r" }
];

export function HorizonPowerShell() {
  const search: any = useSearch({ strict: false });

  const [servers, setServers] = useState<Server[]>([]);
  const [sessions, setSessions] = useState<PtySession[]>(() => terminalStore.getSessions());
  const [activeId, setActiveId] = useState<string>(() => terminalStore.getActiveSessionId());
  const [fontSize, setFontSize] = useState(13);
  const [theme, setTheme] = useState<TerminalPalette>(() => getActiveTerminalTheme());
  const [frontendSettings, setFrontendSettings] = useState(() => getFrontendSettings());
  const [customScripts, setCustomScripts] = useState<CustomScript[]>(() => getStoredScripts());

  // UI state
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedBuffer, setCopiedBuffer] = useState(false);

  const active = sessions.find((s) => s.id === activeId);

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = terminalStore.subscribe(() => {
      setSessions(terminalStore.getSessions());
      setActiveId(terminalStore.getActiveSessionId());
    });
    return unsubscribe;
  }, []);

  // Fetch servers & initialize first tab if empty
  useEffect(() => {
    getServersClient().then(data => {
      const svrs = data && data.length > 0 ? data : [];
      setServers(svrs);

      if (terminalStore.getSessions().length === 0) {
        const targetName = search.serverName || svrs[0]?.name || "nexus01";
        terminalStore.createSession(targetName);
      }
    });
  }, [search.serverIp]);

  // Theme & settings listener
  useEffect(() => {
    const handleSync = () => {
      setTheme(getActiveTerminalTheme());
      setFrontendSettings(getFrontendSettings());
      terminalStore.applyThemeToAll();
    };

    const observer = new MutationObserver(handleSync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-terminal-theme"] });

    window.addEventListener("nexus-terminal-theme-change", handleSync);
    window.addEventListener("nexus-scripts-change", handleSync);

    return () => {
      observer.disconnect();
      window.removeEventListener("nexus-terminal-theme-change", handleSync);
      window.removeEventListener("nexus-scripts-change", handleSync);
    };
  }, []);

  // Combined scripts list
  const activeScripts = useMemo(() => {
    const presets = customScripts.map(c => ({ label: `[${c.category}] ${c.name}`, cmd: c.command }));
    return [...presets, ...BUILTIN_SCRIPTS];
  }, [customScripts]);

  const dispatchCommand = (cmd: string) => {
    if (!cmd) return;
    const formattedCmd = cmd.endsWith("\r") || cmd.endsWith("\n") ? cmd : cmd + "\r";

    if (active?.ws && active.ws.readyState === WebSocket.OPEN) {
      active.ws.send(formattedCmd);
      toast.success("Script dispatched to live WebSocket session");
    } else if (active?.simulatedEngine) {
      active.simulatedEngine.runCommand(formattedCmd);
      toast.success("Executed command in interactive PTY shell");
    } else if (active?.xterm) {
      active.xterm.write(formattedCmd);
      toast.success("Dispatched to terminal");
    } else {
      toast.error("No active terminal session available");
    }
  };

  function newSession() {
    const targetName = servers.length > 0 ? servers[0].name : "nexus01";
    terminalStore.createSession(targetName);
  }

  function closeSession(id: string) {
    terminalStore.closeSession(id);
  }

  const exportTerminalLog = () => {
    if (!active?.xterm) return;
    const buffer = active.xterm.buffer.active;
    let text = "";
    for (let i = 0; i < buffer.length; i++) {
      const line = buffer.getLine(i);
      if (line) text += line.translateToString(true) + "\n";
    }
    const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexus-powershell-${active.serverId}-${new Date().toISOString().slice(0,10)}.log`;
    link.click();
    toast.success("Terminal session log exported!");
  };

  const copyTerminalBuffer = () => {
    if (!active?.xterm) return;
    const buffer = active.xterm.buffer.active;
    let text = "";
    for (let i = 0; i < buffer.length; i++) {
      const line = buffer.getLine(i);
      if (line) text += line.translateToString(true) + "\n";
    }
    navigator.clipboard.writeText(text);
    setCopiedBuffer(true);
    toast.success("Terminal buffer copied to clipboard!");
    setTimeout(() => setCopiedBuffer(false), 2000);
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    terminalStore.updateFontSize(newSize);
  };

  const handleSaveCustomScript = (script: CustomScript) => {
    const updated = [script, ...customScripts];
    setCustomScripts(updated);
    saveStoredScripts(updated);
  };

  return (
    <div className={`max-w-[1600px] mx-auto space-y-6 font-sans pb-12 ${isFullscreen ? "fixed inset-0 z-50 bg-[var(--bg-void)] p-4 max-w-none overflow-auto" : ""}`}>
      {/* Top Header & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-c)] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-[var(--text)]">PowerShell PTY Suite</h2>
            <span className="text-[10px] uppercase font-mono font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-[var(--amber)]/10 text-[var(--amber)] border border-[var(--amber)]/20">
              Interactive PowerShell Core
            </span>
          </div>
          <p className="text-xs text-[var(--text-sub)] mt-0.5">
            Full-featured WinRM PTY session manager, preset automation library & custom script builder.
          </p>
        </div>

        {/* Toolbar controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Preset Script dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              onChange={(e) => {
                dispatchCommand(e.target.value);
                e.target.value = "";
              }}
              defaultValue=""
              className="mono text-xs bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-1.5 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none cursor-pointer hover:border-[var(--amber)]/50 transition-colors"
            >
              <option value="" disabled>Run Preset Automation...</option>
              {activeScripts.map((scr, idx) => (
                <option key={idx} value={scr.cmd}>{scr.label}</option>
              ))}
            </select>
          </div>

          {/* New Custom Script Button */}
          <button
            onClick={() => setShowScriptModal(true)}
            className="flex items-center gap-1.5 bg-[var(--amber)] text-black px-3 py-1.5 rounded-xl text-xs font-mono font-bold hover:bg-[var(--amber-hover)] transition-all cursor-pointer shadow-sm"
            title="Create and save custom PowerShell script"
          >
            <Code size={14} /> Compose Script
          </button>

          {/* Cmdlet Cheat Sheet Button */}
          <button
            onClick={() => setShowCheatSheet(true)}
            className="flex items-center gap-1.5 bg-[var(--bg-void)] border border-[var(--border-c)] px-3 py-1.5 rounded-xl text-xs font-mono font-semibold text-[var(--text-sub)] hover:text-[var(--text)] transition-all cursor-pointer"
            title="PowerShell Cmdlet reference drawer"
          >
            <BookOpen size={14} /> Cheat Sheet
          </button>

          {/* Theme Selector */}
          <div className="flex items-center gap-1 bg-[var(--bg-void)] border border-[var(--border-c)] p-1 rounded-xl text-xs">
            <Palette size={14} className="text-[var(--text-sub)] ml-1" />
            <select
              value={theme.id}
              onChange={(e) => terminalStore.setTheme(e.target.value)}
              className="mono text-xs bg-transparent border-none text-[var(--text)] focus:outline-none cursor-pointer pr-1 font-bold"
            >
              {Object.values(TERMINAL_PALETTES).map(p => (
                <option key={p.id} value={p.id} className="bg-[var(--bg-card)] text-[var(--text)]">{p.name}</option>
              ))}
            </select>
          </div>

          {/* Zoom Font Controls */}
          <div className="flex items-center gap-1 bg-[var(--bg-void)] border border-[var(--border-c)] p-1 rounded-xl text-xs">
            <button
              onClick={() => handleFontSizeChange(Math.max(10, fontSize - 1))}
              className="p-1 rounded hover:bg-[var(--amber)]/15 hover:text-[var(--amber)] text-[var(--text-sub)] cursor-pointer"
              title="Decrease Font Size"
            >
              <ZoomOut size={14} />
            </button>
            <span className="font-mono text-xs text-[var(--text)] px-1 font-bold">{fontSize}px</span>
            <button
              onClick={() => handleFontSizeChange(Math.min(24, fontSize + 1))}
              className="p-1 rounded hover:bg-[var(--amber)]/15 hover:text-[var(--amber)] text-[var(--text-sub)] cursor-pointer"
              title="Increase Font Size"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Copy Buffer */}
          <button
            onClick={copyTerminalBuffer}
            className="p-2 rounded-xl bg-[var(--bg-void)] border border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--text)] transition-all cursor-pointer"
            title="Copy entire terminal buffer"
          >
            {copiedBuffer ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>

          {/* Export Log */}
          <button
            onClick={exportTerminalLog}
            className="p-2 rounded-xl bg-[var(--bg-void)] border border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--text)] transition-all cursor-pointer"
            title="Export session log"
          >
            <Download size={14} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-[var(--bg-void)] border border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--text)] transition-all cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Terminal"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Main Terminal Window Frame */}
      <div 
        className={`flex flex-col overflow-hidden rounded-2xl border border-white/15 shadow-2xl transition-all duration-300 font-mono ${isFullscreen ? "h-[calc(100vh-140px)]" : "h-[68vh] md:h-[76vh]"}`}
        style={{ backgroundColor: theme.bg }}
      >
        {/* Window Top Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 select-none bg-black/30">
          <div className="flex items-center gap-3">
            {/* macOS Style Window Controls */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-sm" />
            </div>

            <span className="text-xs font-semibold flex items-center gap-1.5 opacity-80" style={{ color: theme.output }}>
              <TermIcon size={13} /> PS C:\WINDOWS\system32&gt; [{active?.serverId || "nexus01"}]
            </span>
          </div>

          {/* Session Tabs (Center) */}
          <div className="flex items-center gap-1.5 overflow-x-auto mx-4">
            {sessions.map((s) => {
              const sname = servers.find((m) => m.name === s.serverId)?.name ?? s.serverId;
              const isActive = s.id === activeId;
              const isWsConnected = s.ws && s.ws.readyState === WebSocket.OPEN;

              return (
                <div 
                  key={s.id} 
                  className={`mono flex items-center gap-2 rounded-lg px-3 py-1 text-xs transition-all border ${
                    isActive 
                      ? "bg-white/15 text-white font-bold border-white/20 shadow-sm" 
                      : "text-white/50 border-transparent hover:bg-white/10 hover:text-white"
                  }`}
                  style={isActive ? { color: theme.prompt, borderColor: theme.prompt + "40" } : {}}
                >
                  <button onClick={() => terminalStore.setActiveSessionId(s.id)} className="cursor-pointer flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isWsConnected ? "bg-emerald-400" : "bg-amber-400"}`} />
                    &gt;_ {sname}
                  </button>
                  {sessions.length > 1 && (
                    <button onClick={() => closeSession(s.id)} className="hover:text-rose-400 cursor-pointer">
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
            <button onClick={newSession} className="mono grid h-6 w-6 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white cursor-pointer" title="Open New PTY Session Tab">
              <Plus size={14} />
            </button>
          </div>

          {/* Active Server Target & Clear Controls (Right) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Server target switcher for active tab */}
            {servers.length > 0 && (
              <select
                value={active?.serverId || ""}
                onChange={(e) => {
                  if (active) {
                    active.serverId = e.target.value;
                    terminalStore.createSession(e.target.value);
                  }
                }}
                className="mono rounded border border-white/20 bg-black/40 px-2 py-1 text-[10px] uppercase font-bold text-white/80 cursor-pointer focus:outline-none"
              >
                {servers.map((s) => <option key={s.name} value={s.name} className="bg-neutral-900 text-white">{s.name}</option>)}
              </select>
            )}

            <button
              onClick={() => active?.xterm?.clear()}
              className="p-1 rounded text-white/50 hover:text-rose-400 hover:bg-white/10 cursor-pointer"
              title="Clear terminal buffer"
            >
              <Trash2 size={14} />
            </button>

            <span 
              className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-lg border shadow-sm hidden sm:inline-block"
              style={{ 
                color: theme.prompt, 
                backgroundColor: theme.prompt + "18", 
                borderColor: theme.prompt + "40" 
              }}
            >
              {theme.name}
            </span>
          </div>
        </div>

        {/* Terminal Canvas Container */}
        <div 
          className="flex-1 w-full h-full relative p-3"
          style={{ backgroundColor: theme.bg }}
        >
          {sessions.map(s => (
            <TerminalSessionView 
              key={s.id} 
              session={s} 
              isActive={s.id === activeId} 
              fontSize={fontSize}
              theme={theme}
            />
          ))}
        </div>
      </div>

      {/* Custom Script Modal */}
      {showScriptModal && (
        <CustomScriptModal
          onClose={() => setShowScriptModal(false)}
          onRunScript={dispatchCommand}
          onSaveScript={handleSaveCustomScript}
        />
      )}

      {/* Cmdlet Cheat Sheet Drawer */}
      {showCheatSheet && (
        <CmdletCheatSheetDrawer
          onClose={() => setShowCheatSheet(false)}
          onRunCmd={dispatchCommand}
        />
      )}
    </div>
  );
}

function TerminalSessionView({ session, isActive, fontSize, theme }: { session: PtySession; isActive: boolean; fontSize: number; theme: TerminalPalette }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      terminalStore.attachTerminal(session.id, containerRef.current, fontSize);
    }
  }, [session.id, isActive, fontSize, theme]);

  return (
    <div 
      ref={containerRef}
      style={{ display: isActive ? "block" : "none", width: "100%", height: "100%", backgroundColor: theme.bg }}
    />
  );
}
