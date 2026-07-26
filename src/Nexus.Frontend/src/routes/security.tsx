import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { NxCard } from "@/components/ui/NxCard";
import { getSecurityClient, type SecurityData } from "@/api/client";

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
    const d = await getSecurityClient(server, refresh);
    if (d) setData(d);
    setLoading(false);
  };

  useEffect(() => {
    fetchData(false);
  }, [server]);

  const score = data ? Math.max(0, 100 - (data.failedLogins24h / 10) - (data.openPorts.length / 2)) : 100;

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
          <div className="flex h-[240px] flex-col items-center justify-center gap-2">
            <div className="display text-[56px] font-bold text-[var(--crit)]">{data?.failedLogins24h ?? 0}</div>
            <div className="eyebrow text-[var(--text-sub)]">failed sign-in attempts</div>
          </div>
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
