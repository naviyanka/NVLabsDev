import { useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { Terminal as TermIcon, Trash2, Plus, X, Download, ZoomIn, ZoomOut } from "lucide-react";

import { getServersClient, type Server } from "@/api/client";
import { getFrontendSettings } from "@/lib/frontendSettings";
import { terminalStore, getActiveTerminalTheme, type PtySession } from "@/lib/terminalStore";
import { toast } from "sonner";

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
  const [theme, setTheme] = useState(() => getActiveTerminalTheme());
  const [frontendSettings, setFrontendSettings] = useState(() => getFrontendSettings());

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

  const activeScripts = useMemo(() => {
    const templates = frontendSettings.scriptTemplates;
    if (templates && templates.length > 0) {
      return templates.filter(t => t.enabled).map(t => ({ label: t.name, cmd: t.command.endsWith("\r") ? t.command : t.command + "\r" }));
    }
    return BUILTIN_SCRIPTS;
  }, [frontendSettings.scriptTemplates]);

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
    link.download = `nexus-terminal-${active.serverId}-${new Date().toISOString().slice(0,10)}.log`;
    link.click();
    toast.success("Terminal log exported");
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    terminalStore.updateFontSize(newSize);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 font-sans pb-12">
      {/* Page Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-c)] shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text)]">PowerShell PTY Console</h2>
          <p className="text-xs text-[var(--text-sub)] mt-0.5">
            Persistent WinRM PTY session manager across route navigation.
          </p>
        </div>

        {/* Controls: Script Runner & Zoom */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-[var(--text-sub)]">Quick Script:</span>
            <select
              onChange={(e) => {
                const cmd = e.target.value;
                if (cmd && active?.ws && active.ws.readyState === WebSocket.OPEN) {
                  active.ws.send(cmd);
                  toast.success("Script dispatched to PTY");
                }
              }}
              defaultValue=""
              className="mono text-xs bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-1.5 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Run Preset Script...</option>
              {activeScripts.map(scr => (
                <option key={scr.label} value={scr.cmd}>{scr.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[var(--bg-void)] border border-[var(--border-c)] p-1 rounded-xl text-xs">
            <button
              onClick={() => handleFontSizeChange(Math.max(10, fontSize - 1))}
              className="p-1 rounded hover:bg-[var(--amber-low)] hover:text-[var(--amber)] text-[var(--text-sub)] cursor-pointer"
              title="Decrease Font Size"
            >
              <ZoomOut size={14} />
            </button>
            <span className="font-mono text-xs text-[var(--text)] px-1.5 font-bold">{fontSize}px</span>
            <button
              onClick={() => handleFontSizeChange(Math.min(24, fontSize + 1))}
              className="p-1 rounded hover:bg-[var(--amber-low)] hover:text-[var(--amber)] text-[var(--text-sub)] cursor-pointer"
              title="Increase Font Size"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <button
            onClick={exportTerminalLog}
            className="flex items-center gap-1.5 bg-[var(--bg-void)] border border-[var(--border-c)] px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-white transition-all cursor-pointer"
          >
            <Download size={14} /> Export Log
          </button>
        </div>
      </div>

      {/* Terminal Window Frame (Identical styling to Image 2 design!) */}
      <div 
        className="flex h-[68vh] md:h-[78vh] flex-col overflow-hidden rounded-2xl border border-white/15 shadow-2xl transition-all duration-300 font-mono"
        style={{ backgroundColor: theme.bg }}
      >
        {/* Window Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 select-none">
          <div className="flex items-center gap-3">
            {/* macOS Window Control Dots */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-sm" />
            </div>

            <span className="text-xs font-semibold flex items-center gap-1.5 opacity-70" style={{ color: theme.output }}>
              <TermIcon size={13} /> PS C:\WINDOWS\system32&gt;
            </span>
          </div>

          {/* Session Tabs (Middle) */}
          <div className="flex items-center gap-1.5 overflow-x-auto mx-4">
            {sessions.map((s) => {
              const sname = servers.find((m) => m.name === s.serverId)?.name ?? s.serverId;
              const isActive = s.id === activeId;
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
                  <button onClick={() => terminalStore.setActiveSessionId(s.id)} className="cursor-pointer">
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
            <button onClick={newSession} className="mono grid h-6 w-6 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white cursor-pointer" title="New PTY Tab">
              <Plus size={14} />
            </button>
          </div>

          {/* Active Theme Badge (Right) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => active?.xterm?.clear()}
              className="p-1 rounded text-white/50 hover:text-rose-400 hover:bg-white/10 cursor-pointer mr-1"
              title="Clear terminal buffer"
            >
              <Trash2 size={14} />
            </button>

            <span 
              className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-lg border shadow-sm"
              style={{ 
                color: theme.prompt, 
                backgroundColor: theme.prompt + "18", 
                borderColor: theme.prompt + "40" 
              }}
            >
              {theme.name || "STEALTH OLED"}
            </span>
          </div>
        </div>

        {/* Terminal Container Canvas */}
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
    </div>
  );
}

function TerminalSessionView({ session, isActive, fontSize, theme }: { session: PtySession; isActive: boolean; fontSize: number; theme: any }) {
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
