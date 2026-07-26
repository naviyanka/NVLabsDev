import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { getWsUrl, isBackendConfigured } from "@/lib/backend";
import { getFrontendSettings } from "@/lib/frontendSettings";
import { createSimulatedPowerShell } from "@/lib/powershellEngine";

export interface PtySession {
  id: string;
  serverId: string;
  ws?: WebSocket;
  xterm?: Terminal;
  fit?: FitAddon;
  container?: HTMLElement;
  simulatedEngine?: ReturnType<typeof createSimulatedPowerShell>;
}

function sanitizePtyStream(input: string): string {
  if (!input) return input;
  // Strip VT100 DEC graphic box drawing initial noise (e.g. jjjjh... lines, \x1b(0 sequences, and resize symbol artifacts)
  return input
    .replace(/\x1b\(0[jhqkmlxq]+\x1b\(B/gi, "")
    .replace(/^j{3,}[h]{3,}\r?\n?/gm, "")
    .replace(/^[\u2921\u2922\u2197\u2198\u2196\u2199\s\/\.\\]*(?=Windows|PS\s|\x1b)/m, "");
}

export interface TerminalPalette {
  id: string;
  name: string;
  bg: string;
  foreground: string;
  prompt: string;
  output: string;
  cursor: string;
  cursorAccent: string;
  selectionBackground: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export const TERMINAL_PALETTES: Record<string, TerminalPalette> = {
  "stealth": {
    id: "stealth", name: "STEALTH OLED",
    bg: "#000000", foreground: "#94a3b8", prompt: "#10b981", output: "#94a3b8", cursor: "#10b981", cursorAccent: "#000000", selectionBackground: "#10b98140",
    black: "#0f172a", red: "#ef4444", green: "#10b981", yellow: "#f59e0b", blue: "#3b82f6", magenta: "#a855f7", cyan: "#06b6d4", white: "#94a3b8",
    brightBlack: "#334155", brightRed: "#f87171", brightGreen: "#34d399", brightYellow: "#fbbf24", brightBlue: "#60a5fa", brightMagenta: "#c084fc", brightCyan: "#22d3ee", brightWhite: "#f8fafc"
  },
  "horizon": {
    id: "horizon", name: "HORIZON LUMINOUS",
    bg: "#0d0f17", foreground: "#f1f5f9", prompt: "#ff5e3a", output: "#f1f5f9", cursor: "#ff5e3a", cursorAccent: "#0d0f17", selectionBackground: "#ff5e3a40",
    black: "#1e293b", red: "#ff4d4d", green: "#10b981", yellow: "#fbbf24", blue: "#38bdf8", magenta: "#c084fc", cyan: "#22d3ee", white: "#f1f5f9",
    brightBlack: "#475569", brightRed: "#ff6666", brightGreen: "#34d399", brightYellow: "#fcd34d", brightBlue: "#7dd3fc", brightMagenta: "#e879f9", brightCyan: "#67e8f9", brightWhite: "#ffffff"
  },
  "nexus-dark": {
    id: "nexus-dark", name: "NEXUS AMBER",
    bg: "#050508", foreground: "#e2e8f0", prompt: "#f59e0b", output: "#e2e8f0", cursor: "#f59e0b", cursorAccent: "#050508", selectionBackground: "#f59e0b40",
    black: "#1e1e2e", red: "#f38ba8", green: "#a6e3a1", yellow: "#f9e2af", blue: "#89b4fa", magenta: "#cba6f7", cyan: "#94e2d5", white: "#e2e8f0",
    brightBlack: "#585b70", brightRed: "#f38ba8", brightGreen: "#a6e3a1", brightYellow: "#f9e2af", brightBlue: "#89b4fa", brightMagenta: "#cba6f7", brightCyan: "#94e2d5", brightWhite: "#ffffff"
  },
  "win-classic": {
    id: "win-classic", name: "WINDOWS CONSOLE",
    bg: "#0c0c0c", foreground: "#cccccc", prompt: "#cccccc", output: "#cccccc", cursor: "#ffffff", cursorAccent: "#0c0c0c", selectionBackground: "#ffffff40",
    black: "#000000", red: "#c00000", green: "#00a600", yellow: "#c6c600", blue: "#0000b2", magenta: "#b200b2", cyan: "#00a6a6", white: "#cccccc",
    brightBlack: "#666666", brightRed: "#ff6666", brightGreen: "#00ff00", brightYellow: "#ffff00", brightBlue: "#0000ff", brightMagenta: "#ff00ff", brightCyan: "#00ffff", brightWhite: "#ffffff"
  },
  "matrix": {
    id: "matrix", name: "MATRIX HACKER",
    bg: "#020e02", foreground: "#00ff41", prompt: "#00ff41", output: "#00ff41", cursor: "#00ff41", cursorAccent: "#020e02", selectionBackground: "#00ff4140",
    black: "#001a00", red: "#00ff41", green: "#00ff41", yellow: "#00ff41", blue: "#00aa28", magenta: "#00ff41", cyan: "#00ff41", white: "#00ff41",
    brightBlack: "#003300", brightRed: "#00ff41", brightGreen: "#00ff41", brightYellow: "#00ff41", brightBlue: "#00ff41", brightMagenta: "#00ff41", brightCyan: "#00ff41", brightWhite: "#00ff41"
  },
  "solarized": {
    id: "solarized", name: "SOLARIZED DARK",
    bg: "#002b36", foreground: "#839496", prompt: "#268bd2", output: "#839496", cursor: "#268bd2", cursorAccent: "#002b36", selectionBackground: "#268bd240",
    black: "#073642", red: "#dc322f", green: "#859900", yellow: "#b58900", blue: "#268bd2", magenta: "#d33682", cyan: "#2aa198", white: "#839496",
    brightBlack: "#002b36", brightRed: "#cb4b16", brightGreen: "#586e75", brightYellow: "#657b83", brightBlue: "#839496", brightMagenta: "#6c71c4", brightCyan: "#93a1a1", brightWhite: "#fdf6e3"
  },
  "dracula": {
    id: "dracula", name: "DRACULA GOTHIC",
    bg: "#282a36", foreground: "#f8f8f2", prompt: "#ff79c6", output: "#f8f8f2", cursor: "#bd93f9", cursorAccent: "#282a36", selectionBackground: "#ff79c640",
    black: "#21222c", red: "#ff5555", green: "#50fa7b", yellow: "#f1fa8c", blue: "#bd93f9", magenta: "#ff79c6", cyan: "#8be9fd", white: "#f8f8f2",
    brightBlack: "#6272a4", brightRed: "#ff6e6e", brightGreen: "#69ff94", brightYellow: "#ffffa5", brightBlue: "#d6acff", brightMagenta: "#ff92d0", brightCyan: "#a4ffff", brightWhite: "#ffffff"
  },
  "cobalt": {
    id: "cobalt", name: "COBALT BLUE",
    bg: "#001e3c", foreground: "#b0bec5", prompt: "#00bcd4", output: "#b0bec5", cursor: "#00bcd4", cursorAccent: "#001e3c", selectionBackground: "#00bcd440",
    black: "#000d1a", red: "#f44336", green: "#4caf50", yellow: "#ffeb3b", blue: "#2196f3", magenta: "#9c27b0", cyan: "#00bcd4", white: "#b0bec5",
    brightBlack: "#1c3144", brightRed: "#ef5350", brightGreen: "#66bb6a", brightYellow: "#ffee58", brightBlue: "#42a5f5", brightMagenta: "#ab47bc", brightCyan: "#26c6da", brightWhite: "#ffffff"
  },
  "monokai": {
    id: "monokai", name: "MONOKAI PRO",
    bg: "#272822", foreground: "#f8f8f2", prompt: "#e6db74", output: "#f8f8f2", cursor: "#a6e22e", cursorAccent: "#272822", selectionBackground: "#e6db7440",
    black: "#171814", red: "#f92672", green: "#a6e22e", yellow: "#e6db74", blue: "#66d9ef", magenta: "#ae81ff", cyan: "#a1efe4", white: "#f8f8f2",
    brightBlack: "#75715e", brightRed: "#ff4d8d", brightGreen: "#b7f33d", brightYellow: "#fff38c", brightBlue: "#7ce7ff", brightMagenta: "#c399ff", brightCyan: "#b8fff7", brightWhite: "#f8f8f2"
  },
  "nord": {
    id: "nord", name: "NORD ARCTIC",
    bg: "#2e3440", foreground: "#d8dee9", prompt: "#88c0d0", output: "#d8dee9", cursor: "#88c0d0", cursorAccent: "#2e3440", selectionBackground: "#88c0d040",
    black: "#3b4252", red: "#bf616a", green: "#a3be8c", yellow: "#ebcb8b", blue: "#81a1c1", magenta: "#b48ead", cyan: "#8fbcbb", white: "#d8dee9",
    brightBlack: "#4c566a", brightRed: "#d08770", brightGreen: "#a3be8c", brightYellow: "#ebcb8b", brightBlue: "#88c0d0", brightMagenta: "#b48ead", brightCyan: "#8fbcbb", brightWhite: "#eceff4"
  }
};

export function getActiveTerminalTheme(): TerminalPalette {
  if (typeof window === "undefined") return TERMINAL_PALETTES["stealth"];
  const id =
    document.documentElement.getAttribute("data-terminal-theme") ||
    getFrontendSettings().terminalTheme ||
    (typeof localStorage !== "undefined" ? localStorage.getItem("nexus-terminal-theme") : null) ||
    "stealth";

  return TERMINAL_PALETTES[id] ?? TERMINAL_PALETTES["stealth"];
}

class TerminalStore {
  private sessions: Map<string, PtySession> = new Map();
  private listeners: Set<() => void> = new Set();
  private activeSessionId: string = "";

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("nexus-terminal-theme-change", () => this.applyThemeToAll());
    }
  }

  public getSessions(): PtySession[] {
    return Array.from(this.sessions.values());
  }

  public getActiveSessionId(): string {
    return this.activeSessionId;
  }

  public setActiveSessionId(id: string) {
    this.activeSessionId = id;
    this.notify();
  }

  public createSession(serverId: string): string {
    const id = "session-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const session: PtySession = { id, serverId };
    this.sessions.set(id, session);
    this.activeSessionId = id;
    this.notify();
    return id;
  }

  public closeSession(id: string) {
    const session = this.sessions.get(id);
    if (session) {
      if (session.ws) {
        try { session.ws.close(); } catch(e) {}
      }
      if (session.xterm) {
        try { session.xterm.dispose(); } catch(e) {}
      }
      this.sessions.delete(id);
    }

    const remaining = this.getSessions();
    if (remaining.length > 0) {
      if (this.activeSessionId === id) {
        this.activeSessionId = remaining[remaining.length - 1].id;
      }
    } else {
      this.activeSessionId = "";
    }

    this.notify();
  }

  public attachTerminal(id: string, element: HTMLElement, fontSize: number = 13) {
    const session = this.sessions.get(id);
    if (!session) return;

    const palette = getActiveTerminalTheme();

    if (!session.xterm) {
      const xterm = new Terminal({
        theme: palette,
        fontFamily: "monospace",
        fontSize: fontSize,
        cursorBlink: true
      });

      const fit = new FitAddon();
      xterm.loadAddon(fit);
      xterm.open(element);

      if (isBackendConfigured()) {
        const token = localStorage.getItem("nexus_token") || "";
        const wsUrl = getWsUrl(`/api/terminal/ws?serverId=${session.serverId}&access_token=${token}`);
        
        try {
          const ws = new WebSocket(wsUrl);

          ws.onopen = () => {
            xterm.writeln(`\x1b[32m[WS] Connected live WebSocket stream to ${session.serverId}\x1b[0m`);
          };

          ws.onmessage = (ev) => {
            if (typeof ev.data === "string") {
              const cleaned = sanitizePtyStream(ev.data);
              if (cleaned) xterm.write(cleaned);
            } else {
              const reader = new FileReader();
              reader.onload = () => {
                const text = new TextDecoder().decode(reader.result as ArrayBuffer);
                const cleaned = sanitizePtyStream(text);
                if (cleaned) xterm.write(cleaned);
              };
              reader.readAsArrayBuffer(ev.data);
            }
          };

          ws.onerror = () => {
            if (!session.simulatedEngine) {
              session.simulatedEngine = createSimulatedPowerShell(xterm, session.serverId);
            }
          };

          ws.onclose = () => {
            if (!session.simulatedEngine) {
              session.simulatedEngine = createSimulatedPowerShell(xterm, session.serverId);
            }
          };

          session.ws = ws;
        } catch {
          session.simulatedEngine = createSimulatedPowerShell(xterm, session.serverId);
        }
      } else {
        // Default interactive simulated PowerShell Core
        session.simulatedEngine = createSimulatedPowerShell(xterm, session.serverId);
      }

      xterm.onData(data => {
        if (session.ws && session.ws.readyState === WebSocket.OPEN) {
          session.ws.send(data);
        } else if (session.simulatedEngine) {
          session.simulatedEngine.handleInput(data);
        }
      });

      session.xterm = xterm;
      session.fit = fit;
      session.container = element;
    } else {
      if (session.container !== element) {
        element.appendChild(session.xterm.element!);
        session.container = element;
      }
    }

    session.xterm.options.theme = palette;
    session.xterm.options.fontSize = fontSize;

    if (element) {
      element.style.backgroundColor = palette.bg;
      element.style.color = palette.foreground;
      const xtermEls = element.querySelectorAll(".xterm, .xterm-viewport, .xterm-screen, .xterm-rows");
      xtermEls.forEach((el: any) => {
        el.style.backgroundColor = palette.bg;
        el.style.color = palette.foreground;
      });
    }

    setTimeout(() => {
      session.fit?.fit();
      session.xterm?.focus();
    }, 20);
  }

  public updateFontSize(fontSize: number) {
    const palette = getActiveTerminalTheme();
    for (const session of this.sessions.values()) {
      if (session.xterm) {
        session.xterm.options.fontSize = fontSize;
        session.xterm.options.theme = palette;
        if (session.container) {
          session.container.style.backgroundColor = palette.bg;
          session.container.style.color = palette.foreground;
          const xtermEls = session.container.querySelectorAll(".xterm, .xterm-viewport, .xterm-screen, .xterm-rows");
          xtermEls.forEach((el: any) => {
            el.style.backgroundColor = palette.bg;
            el.style.color = palette.foreground;
          });
        }
        session.fit?.fit();
      }
    }
  }

  public setTheme(themeId: string) {
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-terminal-theme", themeId);
      localStorage.setItem("nexus-terminal-theme", themeId);
      window.dispatchEvent(new CustomEvent("nexus-terminal-theme-change"));
    }
    this.applyThemeToAll();
  }

  public applyThemeToAll() {
    const palette = getActiveTerminalTheme();
    for (const session of this.sessions.values()) {
      if (session.xterm) {
        session.xterm.options.theme = palette;
        if (session.container) {
          session.container.style.backgroundColor = palette.bg;
          session.container.style.color = palette.foreground;
          const xtermEls = session.container.querySelectorAll(".xterm, .xterm-viewport, .xterm-screen, .xterm-rows");
          xtermEls.forEach((el: any) => {
            el.style.backgroundColor = palette.bg;
            el.style.color = palette.foreground;
          });
        }
      }
    }
  }

  public subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }
}

export const terminalStore = new TerminalStore();
