import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { NxCard } from "@/components/ui/NxCard";
import { getEvents, type EventEntry } from "@/api/mock";

interface OpenPort {
  localPort: number;
  protocol: string;
  processName: string;
  state: string;
}

interface LocalAdmin {
  name: string;
  principalSource: string;
  expected: boolean;
}

interface SecurityEvent {
  id: string;
  eventId: number;
  level: string;
  timeCreated: string;
  message: string;
}

interface SecurityData {
  events: SecurityEvent[];
  openPorts: OpenPort[];
  localAdmins: LocalAdmin[];
  failedLogins24h: number;
  lastUpdated: string;
}

export const Route = createFileRoute("/security")({
  head: () => ({ meta: [{ title: "Security Events — NEXUS" }, { name: "description", content: "Security posture, failed logins, and open ports." }] }),
  component: SecurityPage,
});

function SecurityPage() {
  const [server, setServer] = useState("dc01");
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async (refresh = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/servers/${server}/security?refresh=${refresh}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(false);
  }, [server]);

  const score = data ? Math.max(0, 100 - (data.failedLogins24h / 10) - (data.openPorts.length / 2)) : 100;
  // We mock the hour-by-hour chart based on total failed logins — memoized so it doesn't
  // regenerate (and flicker) on every re-render
  const loginHist = useMemo(
    () => Array.from({ length: 24 }, (_, h) => ({
      hour: `${h}:00`,
      fails: data ? Math.floor(Math.random() * (data.failedLogins24h / 10)) : 0
    })),
    [data]
  );

  return (
    <PageWrapper>
      <PageHeader eyebrow="Security" title="Security Center" />
      <div className="flex items-center justify-between mb-5">
        <ServerSelector value={server} onChange={setServer} />
        <div className="flex items-center gap-4">
          {data && (
            <span className="text-[12px] text-[var(--text-sub)]">
              Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={() => fetchData(true)} 
            disabled={loading}
            className="mono rounded-md border border-[var(--amber)] bg-[var(--amber-low)] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--amber)] disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      <div className="nx-card mb-5 flex items-center gap-6 p-5">
        <Gauge value={score} />
        <div className="grid flex-1 grid-cols-4 gap-4">
          <Mini label="Open Ports" value={data?.openPorts.length ?? 0} color="var(--amber)" />
          <Mini label="Failed Logins (24h)" value={data?.failedLogins24h ?? 0} color="var(--crit)" />
          <Mini label="Local Admins" value={data?.localAdmins.length ?? 0} color="var(--warn)" />
          <Mini label="Events Stored" value={data?.events.length ?? 0} color="var(--teal)" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <NxCard eyebrow="Recent Security Events" title="Last 20 entries">
          <div className="max-h-[280px] overflow-y-auto">
            <table className="w-full text-[12px]">
              <tbody className="mono">
                {data?.events.map((e) => (
                  <tr key={e.id} className="border-b border-[var(--border-dim)]">
                    <td className="py-1.5 text-[var(--amber)]">{e.eventId}</td>
                    <td className="text-[var(--text-sub)]">{new Date(e.timeCreated).toLocaleTimeString()}</td>
                    <td className="text-[var(--text)]">{e.level}</td>
                    <td className="truncate text-[var(--text-sub)]">{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </NxCard>

        <NxCard eyebrow="Failed Logins" title="Last 24 hours">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={loginHist}>
              <CartesianGrid stroke="var(--border-dim)" strokeDasharray="2 4" />
              <XAxis dataKey="hour" stroke="var(--text-sub)" fontSize={9} />
              <YAxis stroke="var(--text-sub)" fontSize={9} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-c)", fontSize: 11 }} />
              <Bar dataKey="fails" fill="var(--crit)" />
            </BarChart>
          </ResponsiveContainer>
        </NxCard>

        <NxCard eyebrow="Open Ports">
          <table className="w-full text-[12px]"><tbody className="mono">
            {data?.openPorts.map((r, i) => (
              <tr key={i} className="border-b border-[var(--border-dim)]">
                <td className="py-1.5 text-[var(--amber)]">{r.localPort}</td>
                <td className="text-[var(--text-sub)]">{r.protocol}</td>
                <td className="text-[var(--text)]">{r.processName}</td>
                <td className="text-[var(--teal)]">{r.state}</td>
              </tr>
            ))}
          </tbody></table>
        </NxCard>

        <NxCard eyebrow="Local Admins">
          <table className="w-full text-[12px]"><tbody className="mono">
            {data?.localAdmins.map((u, i) => (
              <tr key={i} className="border-b border-[var(--border-dim)]">
                <td className="py-1.5 text-[var(--text)]">{u.name}</td>
                <td className="text-[var(--text-sub)]">{u.principalSource}</td>
                <td><span className={"mono rounded-full px-2 py-0.5 text-[10px] " + (u.expected ? "bg-[var(--ok)]/15 text-[var(--ok)]" : "bg-[var(--crit)]/15 text-[var(--crit)]")}>{u.expected ? "Expected" : "Unexpected"}</span></td>
              </tr>
            ))}
          </tbody></table>
        </NxCard>
      </div>
    </PageWrapper>
  );
}

function Mini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="eyebrow pb-1">{label}</div>
      <div className="display text-[26px] font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const r = 50, c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      <circle cx={70} cy={70} r={r} stroke="var(--border-c)" strokeWidth={9} fill="none" />
      <circle cx={70} cy={70} r={r} stroke="var(--amber)" strokeWidth={9} strokeLinecap="round" fill="none" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 70 70)" />
      <text x={70} y={75} textAnchor="middle" fill="var(--amber)" fontSize="26" fontFamily="var(--font-display)" fontWeight={700}>{value}</text>
      <text x={70} y={92} textAnchor="middle" fill="var(--text-sub)" fontSize="8" letterSpacing="2">SCORE</text>
    </svg>
  );
}
