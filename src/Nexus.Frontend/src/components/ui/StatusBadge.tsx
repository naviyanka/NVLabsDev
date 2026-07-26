import type { ServerStatus } from "@/api/mock";

const MAP: Record<string, { c: string; bg: string; b: string; label?: string }> = {
  online:   { c: "var(--ok)",   bg: "rgba(34,197,94,0.10)",  b: "rgba(34,197,94,0.35)" },
  warning:  { c: "var(--warn)", bg: "rgba(245,158,11,0.12)", b: "rgba(245,158,11,0.4)" },
  critical: { c: "var(--crit)", bg: "rgba(255,61,90,0.12)",  b: "rgba(255,61,90,0.4)" },
  offline:  { c: "var(--text-sub)", bg: "rgba(80,89,122,0.15)", b: "rgba(80,89,122,0.4)" },
  Running:  { c: "var(--ok)",   bg: "rgba(34,197,94,0.10)",  b: "rgba(34,197,94,0.35)" },
  Stopped:  { c: "var(--text-sub)", bg: "rgba(80,89,122,0.15)", b: "rgba(80,89,122,0.4)" },
  Paused:   { c: "var(--warn)", bg: "rgba(245,158,11,0.12)", b: "rgba(245,158,11,0.4)" },
  Ready:    { c: "var(--ok)",   bg: "rgba(34,197,94,0.10)",  b: "rgba(34,197,94,0.35)" },
  Disabled: { c: "var(--text-sub)", bg: "rgba(80,89,122,0.15)", b: "rgba(80,89,122,0.4)" },
  Failed:   { c: "var(--crit)", bg: "rgba(255,61,90,0.12)",  b: "rgba(255,61,90,0.4)" },
  Healthy:  { c: "var(--ok)",   bg: "rgba(34,197,94,0.10)",  b: "rgba(34,197,94,0.35)" },
  Syncing:  { c: "var(--teal)", bg: "var(--teal-low)",       b: "rgba(14,255,208,0.35)" },
  Error:    { c: "var(--crit)", bg: "rgba(255,61,90,0.12)",  b: "rgba(255,61,90,0.4)" },
};

export function StatusBadge({ status, children }: { status: ServerStatus | string; children?: React.ReactNode }) {
  const m = MAP[status] ?? MAP.offline;
  return (
    <span
      className="mono inline-flex items-center gap-1.5 rounded-[4px] border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em]"
      style={{ color: m.c, backgroundColor: m.bg, borderColor: m.b }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.c }} />
      {children ?? status}
    </span>
  );
}
