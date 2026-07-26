import React from "react";
import { Terminal as TerminalIcon } from "lucide-react";

export interface TerminalThemeOption {
  id: string;
  name: string;
  bg: string;
  prompt: string;
  output: string;
  cursor: string;
  desc: string;
}

export const TERMINAL_THEME_OPTIONS: TerminalThemeOption[] = [
  { id: "stealth", name: "Stealth OLED", bg: "#000000", prompt: "#10b981", output: "#94a3b8", cursor: "#10b981", desc: "True black OLED mode with emerald green prompts" },
  { id: "nexus-dark", name: "Nexus Amber", bg: "#050508", prompt: "#f59e0b", output: "#94a3b8", cursor: "#f59e0b", desc: "Signature dark background with warm amber prompts" },
  { id: "win-classic", name: "Windows Console", bg: "#0c0c0c", prompt: "#cccccc", output: "#cccccc", cursor: "#ffffff", desc: "Classic cmd.exe gray on black" },
  { id: "matrix", name: "Matrix Hacker", bg: "#020e02", prompt: "#00ff41", output: "#009921", cursor: "#00ff41", desc: "Cyberphosphor green on ultra dark green" },
  { id: "solarized", name: "Solarized Dark", bg: "#002b36", prompt: "#268bd2", output: "#839496", cursor: "#268bd2", desc: "Ethan Schoonover's precision solarized palette" },
  { id: "dracula", name: "Dracula Gothic", bg: "#282a36", prompt: "#ff79c6", output: "#f8f8f2", cursor: "#bd93f9", desc: "Popular dark theme with pink and purple accents" },
  { id: "cobalt", name: "Cobalt Blue", bg: "#001e3c", prompt: "#00bcd4", output: "#b0bec5", cursor: "#00bcd4", desc: "Deep ocean blue with cyan prompt highlights" },
  { id: "monokai", name: "Monokai Pro", bg: "#272822", prompt: "#e6db74", output: "#f8f8f2", cursor: "#a6e22e", desc: "Classic code editor contrast theme" },
  { id: "nord", name: "Nord Arctic", bg: "#2e3440", prompt: "#88c0d0", output: "#d8dee9", cursor: "#88c0d0", desc: "An arctic, north-bluish color palette" },
];

export function TerminalThemePreview({ selectedThemeId, onSelect }: { selectedThemeId: string; onSelect: (id: string) => void }) {
  const current = TERMINAL_THEME_OPTIONS.find(t => t.id === selectedThemeId) || TERMINAL_THEME_OPTIONS[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-[var(--text)]">Terminal Color Theme</label>
        <span className="text-xs text-[var(--text-sub)]">Applies to PowerShell & Terminal sessions</span>
      </div>

      {/* Live Mockup Terminal Window */}
      <div
        className="rounded-2xl border border-[var(--border-c)] p-4 shadow-xl font-mono text-xs overflow-hidden transition-all duration-300"
        style={{ backgroundColor: current.bg }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-[10px] text-white/50 flex items-center gap-1">
              <TerminalIcon size={12} /> PS C:\WINDOWS\system32&gt;
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/10" style={{ color: current.prompt }}>
            {current.name}
          </span>
        </div>

        <div className="space-y-1.5 leading-relaxed">
          <div>
            <span style={{ color: current.prompt }}>PS C:\Users\Administrator&gt; </span>
            <span style={{ color: current.output }}>Get-Service -Name "Nexus*"</span>
          </div>
          <div style={{ color: current.output }} className="opacity-80">
            Status   Name               DisplayName<br />
            ------   ----               -----------<br />
            Running  NexusGateway       NEXUS Gateway API Service<br />
            Running  NexusTelemetry     NEXUS Live Telemetry Collector
          </div>
          <div className="pt-1 flex items-center gap-1">
            <span style={{ color: current.prompt }}>PS C:\Users\Administrator&gt; </span>
            <span style={{ color: current.output }}>Get-Process -Id 1042</span>
            <span
              className="inline-block w-2 h-3 animate-pulse"
              style={{ backgroundColor: current.cursor }}
            />
          </div>
        </div>
      </div>

      {/* Theme Options Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TERMINAL_THEME_OPTIONS.map((t) => {
          const isSelected = selectedThemeId === t.id;
          return (
            <div
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`cursor-pointer rounded-xl border p-3 transition-all flex flex-col justify-between gap-2 ${
                isSelected
                  ? "border-[var(--amber)] bg-[var(--amber-low)] shadow-sm"
                  : "border-[var(--border-c)] bg-[var(--bg-void)] hover:border-[var(--amber)]/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[var(--text)] flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: t.bg }} />
                  {t.name}
                </span>
                {isSelected && (
                  <span className="text-[9px] font-extrabold bg-[var(--amber)] text-black px-1.5 py-0.5 rounded uppercase">Active</span>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-sub)] line-clamp-2">{t.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
