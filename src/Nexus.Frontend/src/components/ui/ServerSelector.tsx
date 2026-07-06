import { getServersClient as getServers, type Server } from "@/api/client";
import { useEffect, useState } from "react";

export function ServerSelector({
  value, onChange,
}: { value: string; onChange: (id: string) => void }) {
  const [servers, setServers] = useState<Server[]>([]);
  useEffect(() => { getServers().then(setServers); }, []);

  useEffect(() => {
    if (!value && servers.length > 0) {
      onChange(servers[0].ip);
    }
  }, [servers, value, onChange]);

  return (
    <div className="flex flex-wrap items-center gap-1.5 pb-5">
      <span className="eyebrow pr-2">Server</span>
      {servers.map((s) => {
        const active = s.ip === value || s.id === value;
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.ip)}
            className={[
              "mono flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors",
              active
                ? "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)]"
                : "border-[var(--border-c)] bg-[var(--bg-card)] text-[var(--text-sub)] hover:border-[var(--amber)]/40 hover:text-[var(--text)]",
            ].join(" ")}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  s.status === "online" ? "var(--ok)" : s.status === "warning" ? "var(--warn)" : s.status === "critical" ? "var(--crit)" : "var(--text-sub)",
              }}
            />
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
