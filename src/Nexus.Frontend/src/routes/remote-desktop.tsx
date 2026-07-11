import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Monitor, Play, Save, Trash2, Clock, Globe, Volume2, Clipboard, HardDrive, ChevronRight, X, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { getServersClient, type Server } from "@/api/client";

export const Route = createFileRoute("/remote-desktop")({
  head: () => ({ meta: [{ title: "Remote Desktop — NEXUS" }, { name: "description", content: "Launch and manage Remote Desktop sessions." }] }),
  component: RDPPage,
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
  createdAt: string;
}

const DEFAULTS = {
  resolution: "1920x1080",
  colorDepth: "32",
  audio: "local" as const,
  clipboard: true,
  drives: false,
};

const RES_OPTIONS = ["1280x720", "1366x768", "1600x900", "1920x1080", "2560x1440", "3840x2160", "Full screen"];
const COLOR_OPTIONS = ["8", "16", "24", "32"];

function RDPPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loadingServers, setLoadingServers] = useState(true);
  const [selectedIp, setSelectedIp] = useState<string>("");
  const [adhoc, setAdhoc] = useState("");
  const [res, setRes] = useState(DEFAULTS.resolution);
  const [colorDepth, setColorDepth] = useState(DEFAULTS.colorDepth);
  const [audio, setAudio] = useState<"local" | "remote" | "none">(DEFAULTS.audio);
  const [clipboard, setClipboard] = useState(DEFAULTS.clipboard);
  const [drives, setDrives] = useState(DEFAULTS.drives);
  const [connecting, setConnecting] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [history, setHistory] = useState<{ host: string; at: string }[]>([]);

  useEffect(() => {
    getServersClient()
      .then((data) => {
        setServers(data);
        if (data.length > 0) setSelectedIp(data[0].ip);
      })
      .catch(() => toast.error("Failed to load servers"))
      .finally(() => setLoadingServers(false));

    try {
      const raw = localStorage.getItem("nexus-rdp-sessions");
      if (raw) setSavedSessions(JSON.parse(raw));
      const hist = localStorage.getItem("nexus-rdp-history");
      if (hist) setHistory(JSON.parse(hist));
    } catch { /* ignore corrupt storage */ }
  }, []);

  const selectedServer = useMemo(
    () => servers.find((s) => s.ip === selectedIp),
    [servers, selectedIp]
  );

  const persistSessions = (next: SavedSession[]) => {
    setSavedSessions(next);
    localStorage.setItem("nexus-rdp-sessions", JSON.stringify(next));
  };

  const launch = async (host: string, skipLogs?: boolean) => {
    if (!host || !host.trim()) {
      toast.error("Enter a server hostname or IP");
      return;
    }
    if (connecting) return;
    setConnecting(true);
    const cfg = { res, colorDepth, audio, clipboard, drives };
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
    if (RES_OPTIONS.includes(res) && res !== "Full screen") params.set("res", res);

    const url = `mstsc:${encodeURIComponent(host)}?${params.toString()}`;

    await new Promise((r) => setTimeout(r, 400));

    try {
      window.location.href = url;
      toast.success(`Opening Remote Desktop to ${host}`, {
        description: `${res} · ${colorDepth}-bit · audio ${audio}`,
      });
      if (!skipLogs) {
        const entry = { host, at: new Date().toISOString() };
        const nextHistory = [entry, ...history.filter((h) => h.host !== host)].slice(0, 10);
        setHistory(nextHistory);
        localStorage.setItem("nexus-rdp-history", JSON.stringify(nextHistory));
      }
    } catch {
      toast.error("Failed to launch Remote Desktop client");
    } finally {
      setConnecting(false);
    }
  };

  const saveSession = () => {
    if (!selectedServer && !adhoc) {
      toast.error("Select a server or enter a quick connect host first");
      return;
    }
    const host = adhoc || selectedServer?.ip || "";
    const entry: SavedSession = {
      id: `${Date.now()}`,
      host,
      label: saveLabel.trim() || selectedServer?.name || host,
      resolution: res,
      colorDepth,
      audio,
      clipboard,
      drives,
      createdAt: new Date().toISOString(),
    };
    persistSessions([entry, ...savedSessions]);
    setSaveLabel("");
    setShowSave(false);
    toast.success("Session saved");
  };

  const deleteSession = (id: string) => {
    persistSessions(savedSessions.filter((s) => s.id !== id));
    toast.success("Session removed");
  };

  const loadSession = (s: SavedSession) => {
    setRes(s.resolution);
    setColorDepth(s.colorDepth);
    setAudio(s.audio);
    setClipboard(s.clipboard);
    setDrives(s.drives);
    setAdhoc(s.host);
    setSelectedIp("");
    toast.info(`Loaded session ${s.label}`);
  };

  const activeHost = adhoc.trim() || selectedServer?.ip || "";

  return (
    <PageWrapper>
      <PageHeader
        eyebrow="Management"
        title="Remote Desktop"
        right={
          <button
            onClick={() => setShowSave((v) => !v)}
            className="mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:text-[var(--text)] transition-colors"
          >
            <Save size={14} /> Save Session
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main launcher */}
        <div className="nx-card p-8">
          <div className="flex items-center gap-4 pb-6">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--amber-low)] text-[var(--amber)]">
              <Monitor size={24} />
            </div>
            <div>
              <h2 className="display text-lg font-semibold">New Session</h2>
              <p className="text-[11px] text-[var(--text-sub)]">Configure and launch an RDP connection to a managed server.</p>
            </div>
          </div>

          {/* Server selection */}
          <label className="eyebrow block pb-2">Target Server</label>
          {loadingServers ? (
            <div className="flex items-center gap-2 text-[12px] text-[var(--text-sub)]">
              <Loader2 size={14} className="animate-spin" /> Loading servers…
            </div>
          ) : servers.length === 0 ? (
            <div className="text-[12px] text-[var(--text-sub)]">No servers registered.</div>
          ) : (
            <select
              value={selectedIp}
              onChange={(e) => { setSelectedIp(e.target.value); setAdhoc(""); }}
              className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            >
              {servers.map((m) => (
                <option key={m.id} value={m.ip}>
                  {m.name} — {m.ip} ({m.os})
                  {m.status !== "online" ? ` [${m.status}]` : ""}
                </option>
              ))}
            </select>
          )}

          {/* Quick connect */}
          <div className="mt-4">
            <label className="eyebrow block pb-2">Quick Connect (override)</label>
            <div className="flex gap-2">
              <input
                value={adhoc}
                onChange={(e) => { setAdhoc(e.target.value); setSelectedIp(""); }}
                placeholder="hostname or IP"
                className="mono flex-1 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] placeholder:text-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none"
              />
              {adhoc && (
                <button onClick={() => setAdhoc("")} className="rounded-md border border-[var(--border-c)] px-3 text-[var(--text-sub)] hover:text-[var(--text)]">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Resolution + color depth */}
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block pb-2">Resolution</label>
              <select value={res} onChange={(e) => setRes(e.target.value)} className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none">
                {RES_OPTIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="eyebrow block pb-2">Color Depth</label>
              <select value={colorDepth} onChange={(e) => setColorDepth(e.target.value)} className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none">
                {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}-bit</option>)}
              </select>
            </div>
          </div>

          {/* Audio */}
          <label className="eyebrow mt-5 block pb-2">Audio</label>
          <div className="flex flex-wrap gap-2">
            {([
              { v: "local", icon: Volume2, label: "Play on this PC" },
              { v: "remote", icon: Volume2, label: "Leave on server" },
              { v: "none", icon: X, label: "Disable" },
            ] as const).map((opt) => {
              const Icon = opt.icon;
              const active = audio === opt.v;
              return (
                <button
                  key={opt.v}
                  onClick={() => setAudio(opt.v)}
                  className={`mono flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] transition-colors ${
                    active
                      ? "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)]"
                      : "border-[var(--border-c)] bg-[var(--bg-card)] text-[var(--text-sub)] hover:text-[var(--text)]"
                  }`}
                >
                  <Icon size={13} /> {opt.label}
                </button>
              );
            })}
          </div>

          {/* Resource toggles */}
          <div className="mt-5 space-y-2">
            <ToggleRow icon={Clipboard} label="Clipboard redirection" checked={clipboard} onChange={setClipboard} />
            <ToggleRow icon={HardDrive} label="Drive redirection" checked={drives} onChange={setDrives} />
          </div>

          {/* Summary + launch */}
          <div className="mt-6 rounded-md border border-[var(--border-dim)] bg-[var(--bg-void)]/30 p-4">
            <div className="mono flex items-center justify-between text-[11px] text-[var(--text-sub)]">
              <span>Target</span>
              <span className="text-[var(--text)]">{activeHost || "—"}</span>
            </div>
            <div className="mono mt-1 flex items-center justify-between text-[11px] text-[var(--text-sub)]">
              <span>Mode</span>
              <span>{res} · {colorDepth}-bit · audio:{audio}</span>
            </div>
          </div>

          <button
            disabled={!activeHost || connecting}
            onClick={() => launch(activeHost)}
            className="mono mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-[var(--amber)] bg-[var(--amber)] py-3 text-[12px] uppercase tracking-[0.2em] text-black transition-colors hover:bg-[var(--amber)]/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {connecting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {connecting ? "Connecting…" : "Launch Remote Desktop"}
          </button>
          <p className="pt-3 text-center text-[11px] text-[var(--text-sub)]">
            Opens the Windows Remote Desktop Connection client (mstsc) on your local machine.
          </p>

          {showSave && (
            <div className="mt-5 rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] p-4">
              <label className="eyebrow block pb-2">Session Label</label>
              <input
                value={saveLabel}
                onChange={(e) => setSaveLabel(e.target.value)}
                placeholder={selectedServer?.name || activeHost || "My session"}
                className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => setShowSave(false)} className="mono rounded-md px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:text-[var(--text)]">Cancel</button>
                <button onClick={saveSession} className="mono rounded-md bg-[var(--amber)] px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-black hover:bg-[var(--amber)]/90">Save</button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: saved sessions + history */}
        <div className="space-y-6">
          <div className="nx-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="eyebrow">Saved Sessions</h3>
              <ShieldCheck size={14} className="text-[var(--teal)]" />
            </div>
            {savedSessions.length === 0 ? (
              <p className="py-4 text-center text-[11px] text-[var(--text-sub)]">No saved sessions.</p>
            ) : (
              <div className="space-y-2">
                {savedSessions.map((s) => (
                  <div key={s.id} className="group flex items-center gap-2 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] p-2.5">
                    <button onClick={() => loadSession(s)} className="flex flex-1 items-center gap-2 text-left">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--amber-low)] text-[var(--amber)]">
                        <Monitor size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-[var(--text)]">{s.label}</p>
                        <p className="mono truncate text-[10px] text-[var(--text-sub)]">{s.host} · {s.resolution}</p>
                      </div>
                    </button>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => launch(s.host)} title="Launch" className="grid h-7 w-7 place-items-center rounded-md border border-[var(--border-c)] text-[var(--text-sub)] hover:border-[var(--amber)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)]">
                        <Play size={13} />
                      </button>
                      <button onClick={() => deleteSession(s.id)} title="Remove" className="grid h-7 w-7 place-items-center rounded-md border border-[var(--border-c)] text-[var(--text-sub)] hover:border-[var(--crit)] hover:bg-[var(--crit)]/10 hover:text-[var(--crit)]">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="nx-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Clock size={14} className="text-[var(--text-sub)]" />
              <h3 className="eyebrow">Recent Connections</h3>
            </div>
            {history.length === 0 ? (
              <p className="py-4 text-center text-[11px] text-[var(--text-sub)]">No recent connections.</p>
            ) : (
              <div className="divide-y divide-[var(--border-dim)]">
                {history.map((h, i) => {
                  const ago = relativeTime(h.at);
                  return (
                    <button key={i + h.host} onClick={() => launch(h.host, true)} className="flex w-full items-center justify-between py-2 text-left hover:bg-[var(--bg-surface)]/50">
                      <span className="mono text-[12px] text-[var(--text)]">{h.host}</span>
                      <span className="mono text-[10px] text-[var(--text-sub)]">{ago}</span>
                    </button>
                  );
                })}
                {history.length > 0 && (
                  <button onClick={() => { setHistory([]); localStorage.removeItem("nexus-rdp-history"); }} className="mono w-full pt-3 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:text-[var(--crit)]">
                    Clear history
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="nx-card p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <Globe size={12} className="text-[var(--teal)]" />
              <span className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub)]">How it works</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--text-sub)]">
              NEXUS launches the native <span className="mono text-[var(--text)]">mstsc</span> client via a custom protocol handler on your machine, passing resolution, color depth and resource options. The client must be installed and the handler registered for the link to open automatically.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

function ToggleRow({
  icon: Icon, label, checked, onChange,
}: {
  icon: React.ComponentType<{ size?: number }>; label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-2.5 text-left transition-colors hover:border-[var(--amber)]/40"
    >
      <span className="flex items-center gap-2 text-[13px] text-[var(--text)]">
        <Icon size={14} /> {label}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-[var(--amber)]" : "bg-[var(--border-dim)]"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
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

export default RDPPage;
