import { createFileRoute } from "@tanstack/react-router";
import { getWsUrl } from "@/lib/backend";
import { useEffect, useRef, useState, useContext } from "react";
import { Terminal as TermIcon, Trash2, Plus, X } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { MOCK_SERVERS } from "@/api/mock";
import { getServersClient, type Server } from "@/api/client";

import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export const Route = createFileRoute("/powershell")({
  head: () => ({ meta: [{ title: "PowerShell — NEXUS" }, { name: "description", content: "Remote PowerShell sessions to your fleet." }] }),
  component: PowerShellPage,
});

interface Session { id: string; serverId: string; ws?: WebSocket; xterm?: Terminal; fit?: FitAddon; }

function getTheme() {
  if (typeof window === "undefined") return { bg: "#050508", prompt: "#f59e0b", output: "#94a3b8", cursor: "#f59e0b" };
  const id =
    document.documentElement.getAttribute("data-terminal-theme") ||
    (typeof localStorage !== "undefined" ? localStorage.getItem("nexus-terminal-theme") : null) ||
    "nexus-dark";
  const TERMINAL_THEMES: any = {
    "nexus-dark":  { bg: "#050508", prompt: "#f59e0b", output: "#94a3b8", cursor: "#f59e0b" },
    "win-classic": { bg: "#0c0c0c", prompt: "#cccccc", output: "#cccccc", cursor: "#ffffff" },
    "matrix":      { bg: "#020e02", prompt: "#00ff41", output: "#009921", cursor: "#00ff41" },
    "solarized":   { bg: "#002b36", prompt: "#268bd2", output: "#839496", cursor: "#268bd2" },
    "dracula":     { bg: "#282a36", prompt: "#ff79c6", output: "#f8f8f2", cursor: "#bd93f9" },
    "cobalt":      { bg: "#001e3c", prompt: "#00bcd4", output: "#b0bec5", cursor: "#00bcd4" },
    "monokai":     { bg: "#272822", prompt: "#e6db74", output: "#f8f8f2", cursor: "#a6e22e" },
    "nord":        { bg: "#2e3440", prompt: "#88c0d0", output: "#d8dee9", cursor: "#88c0d0" },
  };
  return TERMINAL_THEMES[id] ?? TERMINAL_THEMES["nexus-dark"];
}

import { ThemeContext } from "./__root";
import { HorizonPowerShell } from "../themes/horizon/pages/HorizonPowerShell";

function PowerShellPage() {
  const { theme: appTheme } = useContext(ThemeContext);
  if (appTheme === 'horizon') return <HorizonPowerShell />;
  const search: any = Route.useSearch();
  const initialServerIp = search.serverIp || "nexus01";

  const [servers, setServers] = useState<Server[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState("");
  const active = sessions.find((s) => s.id === activeId);
  const [theme, setTheme] = useState(() => getTheme());

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getServersClient().then(data => {
      const svrs = data && data.length > 0 ? data : MOCK_SERVERS as unknown as Server[];
      setServers(svrs);
      const targetName = search.serverName || svrs[0]?.name || "nexus01";
      setSessions([{ id: "s1", serverId: targetName }]);
      setActiveId("s1");
    });
  }, [search.serverIp]);

  // Theme listener
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-terminal-theme"] });
    return () => observer.disconnect();
  }, []);

  function newSession() {
    const id = "s" + (sessions.length + 1) + "-" + Date.now();
    const targetName = servers.length > 0 ? servers[0].name : "nexus01";
    setSessions((s) => [...s, { id, serverId: targetName }]);
    setActiveId(id);
  }

  function closeSession(id: string) {
    if (sessions.length === 1) return;
    const idx = sessions.findIndex((s) => s.id === id);
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    if (activeId === id) setActiveId(next[Math.max(0, idx - 1)].id);
  }

  return (
    <PageWrapper>
      <PageHeader eyebrow="Advanced" title="PowerShell PTY" subtitle="True Interactive WebSocket Sessions" />
      <div className="nx-card flex h-[76vh] flex-col overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-2 py-1.5 overflow-x-auto">
          {sessions.map((s) => {
            const sname = servers.find((m) => m.name === s.serverId)?.name ?? s.serverId;
            const isActive = s.id === activeId;
            return (
              <div key={s.id} className={"mono flex items-center gap-2 rounded-md px-3 py-1 text-[11px] " + (isActive ? "bg-[var(--bg-card)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-card)]")}>
                <button onClick={() => setActiveId(s.id)}>
                  <TermIcon size={11} className="mr-1.5 inline" />{sname}
                </button>
                {sessions.length > 1 && (
                  <button onClick={() => closeSession(s.id)} className="text-[var(--text-ghost)] hover:text-[var(--crit)]">
                    <X size={11} />
                  </button>
                )}
              </div>
            );
          })}
          <button onClick={newSession} className="mono ml-1 grid h-6 w-6 place-items-center rounded text-[var(--text-sub)] hover:bg-[var(--bg-card)] hover:text-[var(--amber)]">
            <Plus size={12} />
          </button>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <select
              value={active?.serverId || ""}
              onChange={(e) => {
                const newServerId = e.target.value;
                const newId = "s" + Date.now();
                setSessions((sl) => sl.map((s) => s.id === activeId ? { id: newId, serverId: newServerId } : s));
                setActiveId(newId); // trigger remount
              }}
              className="mono rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--amber)]"
            >
              {servers.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <button
              onClick={() => active?.xterm?.clear()}
              className="grid h-6 w-6 place-items-center rounded text-[var(--text-sub)] hover:text-[var(--crit)]"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Terminal containers */}
        <div 
          className="flex-1 w-full h-full relative"
          style={{ background: theme.bg, padding: '12px' }}
        >
          {sessions.map(s => (
            <TerminalSession 
              key={s.id} 
              session={s} 
              isActive={s.id === activeId} 
              theme={theme} 
            />
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}

function TerminalSession({ session, isActive, theme }: { session: Session; isActive: boolean; theme: any }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (session.xterm) return;

    const xterm = new Terminal({
      theme: { background: theme.bg, foreground: theme.output, cursor: theme.cursor },
      fontFamily: 'monospace',
      fontSize: 13,
      cursorBlink: true
    });
    const fit = new FitAddon();
    xterm.loadAddon(fit);
    
    xterm.open(containerRef.current);
    
    const token = localStorage.getItem("nexus_token") || "";
    const wsUrl = getWsUrl(`/api/terminal/ws?serverId=${session.serverId}&access_token=${token}`);
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      xterm.writeln(`\x1b[33mConnected to ${session.serverId}\x1b[0m`);
    };
    
    ws.onmessage = (ev) => {
      if (typeof ev.data === 'string') {
        xterm.write(ev.data);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const buf = new Uint8Array(reader.result as ArrayBuffer);
          xterm.write(buf);
        };
        reader.readAsArrayBuffer(ev.data);
      }
    };

    ws.onclose = () => {
      xterm.writeln('\x1b[31m\r\nConnection closed\x1b[0m');
    };

    xterm.onData(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    session.xterm = xterm;
    session.fit = fit;
    session.ws = ws;

    const handleResize = () => fit.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      xterm.dispose();
      session.xterm = undefined;
      session.ws = undefined;
      session.fit = undefined;
    };
  }, []);

  useEffect(() => {
    if (session.xterm) {
      session.xterm.options.theme = {
        background: theme.bg,
        foreground: theme.output,
        cursor: theme.cursor
      };
    }
  }, [theme]);

  useEffect(() => {
    if (isActive) {
      setTimeout(() => {
        session.fit?.fit();
        session.xterm?.focus();
      }, 10);
    }
  }, [isActive]);

  return (
    <div 
      ref={containerRef}
      style={{ display: isActive ? 'block' : 'none', width: '100%', height: '100%' }}
    />
  );
}
