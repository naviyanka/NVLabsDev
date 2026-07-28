import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowUp, ArrowDown } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { NxCard } from "@/components/ui/NxCard";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";
import { getPerformanceHistoryClient, getProcessesClient, type PerfSample, type Process } from "@/api/client";
import { useSignalR } from "@/lib/signalr";
import { AiIntelligenceCard } from "@/components/ai/AiIntelligenceCard";

export const Route = createFileRoute("/performance")({
  head: () => ({ meta: [{ title: "Performance — NEXUS" }, { name: "description", content: "Live CPU, memory, disk and network metrics." }] }),
  component: Performance,
});

function Performance() {
  const [server, setServer] = useState("");
  const [data, setData] = useState<PerfSample[]>([]);
  const [procs, setProcs] = useState<Process[]>([]);
  const prevServerRef = useRef<string>("");
  const { connectionState, on, invoke } = useSignalR();

  const isLive = connectionState === "connected";

  // Handle SignalR real-time performance data
  useEffect(() => {
    if (!server || !isLive) return;

    // Join the server group for streaming
    invoke("JoinServerGroup", server);

    const unsubscribe = on("ReceivePerformanceData", (sample: unknown) => {
      const s = sample as PerfSample;
      setData((prev) => {
        const updated = [...prev, s];
        // Keep last 100 samples to avoid memory growth
        return updated.length > 100 ? updated.slice(-100) : updated;
      });
    });

    return () => {
      unsubscribe();
      invoke("LeaveServerGroup", server);
    };
  }, [server, isLive, on, invoke]);

  // Handle server changes: leave old group, join new group
  useEffect(() => {
    const prevServer = prevServerRef.current;
    if (prevServer && prevServer !== server && isLive) {
      invoke("LeaveServerGroup", prevServer);
    }
    prevServerRef.current = server;
  }, [server, isLive, invoke]);

  // Fallback REST polling when SignalR is disconnected
  useEffect(() => {
    if (!server) return;
    if (isLive) return; // SignalR is handling updates

    let id: number | undefined;
    let mounted = true;

    async function tick() {
      if (!server) return;
      const [d, p] = await Promise.all([getPerformanceHistoryClient(server), getProcessesClient(server)]);
      if (!mounted) return;
      if (d) setData(d);
      if (p) setProcs(p);
    }

    tick();
    id = window.setInterval(tick, 3000);
    return () => { mounted = false; if (id) window.clearInterval(id); };
  }, [server, isLive]);

  // Periodically refresh processes (SignalR only streams perf data)
  useEffect(() => {
    if (!server) return;
    if (!isLive) return; // REST fallback handles this

    let id: number | undefined;
    let mounted = true;

    async function fetchProcs() {
      const p = await getProcessesClient(server);
      if (!mounted) return;
      if (p) setProcs(p);
    }

    fetchProcs();
    id = window.setInterval(fetchProcs, 5000);
    return () => { mounted = false; if (id) window.clearInterval(id); };
  }, [server, isLive]);

  // Initial data load when server changes
  const loadInitialData = useCallback(async (serverId: string) => {
    if (!serverId) return;
    const [d, p] = await Promise.all([getPerformanceHistoryClient(serverId), getProcessesClient(serverId)]);
    if (d) setData(d);
    if (p) setProcs(p);
  }, []);

  useEffect(() => {
    setData([]);
    setProcs([]);
    if (server) {
      loadInitialData(server);
    }
  }, [server, loadInitialData]);

  const last = data.at(-1);
  const avg = (k: keyof PerfSample) => data.length ? Math.round(data.reduce((s, d) => s + (d[k] as number), 0) / data.length) : 0;
  const max = (k: keyof PerfSample) => data.length ? Math.round(Math.max(...data.map((d) => d[k] as number))) : 0;
  const min = (k: keyof PerfSample) => data.length ? Math.round(Math.min(...data.map((d) => d[k] as number))) : 0;

  return (
    <PageWrapper>
      <PageHeader eyebrow="Telemetry" title="Performance Monitor" subtitle={isLive ? "Real-time SignalR streaming" : "Polling every 3 seconds (fallback)"} />
      <div className="flex items-center justify-between gap-4">
        <ServerSelector value={server} onChange={setServer} />
        <ConnectionStatus state={connectionState} />
      </div>
      
      <AiIntelligenceCard
        title="Performance Bottleneck Intelligence"
        type="performance"
        dataToAnalyze={{
          selectedServer: server,
          latestMetrics: last,
          averages: { cpu: avg("cpu"), memory: avg("mem"), disk: avg("disk"), network: avg("netIn") },
          topProcesses: procs.slice(0, 5),
        }}
        contextMessage="Analyze current telemetry stream and top running processes. Identify memory leaks, CPU spikes, or disk I/O bottlenecks."
        defaultPromptLabel="Analyze Performance Bottlenecks"
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard label="CPU Usage" value={last ? Math.round(last.cpu) : 0} unit="%" trend={last && data.at(-2) ? last.cpu - data.at(-2)!.cpu : 0}
          stats={{ min: min("cpu"), max: max("cpu"), avg: avg("cpu") }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid stroke="var(--border-dim)" strokeDasharray="2 4" />
              <XAxis dataKey="t" hide /><YAxis hide domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-c)", fontSize: 11 }} />
              <Line type="monotone" dataKey="cpu" stroke="var(--amber)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard label="Memory Usage" value={last ? Math.round(last.mem) : 0} unit="%" trend={last && data.at(-2) ? last.mem - data.at(-2)!.mem : 0}
          stats={{ min: min("mem"), max: max("mem"), avg: avg("mem") }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="memg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--teal)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-dim)" strokeDasharray="2 4" />
              <XAxis dataKey="t" hide /><YAxis hide domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-c)", fontSize: 11 }} />
              <Area type="monotone" dataKey="mem" stroke="var(--teal)" fill="url(#memg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard label="Disk I/O" value={last ? Math.round((last as any).diskR + (last as any).diskW) : 0} unit=" MB/s"
          stats={{ min: 0, max: max("diskR" as keyof PerfSample) + max("diskW" as keyof PerfSample), avg: avg("diskR" as keyof PerfSample) + avg("diskW" as keyof PerfSample) }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid stroke="var(--border-dim)" strokeDasharray="2 4" />
              <XAxis dataKey="t" hide /><YAxis hide />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-c)", fontSize: 11 }} />
              <Bar dataKey="diskR" fill="var(--ok)" />
              <Bar dataKey="diskW" fill="var(--crit)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard label="Network Throughput" value={last ? Math.round(last.netIn + last.netOut) : 0} unit=" Mb/s"
          stats={{ min: 0, max: max("netIn") + max("netOut"), avg: avg("netIn") + avg("netOut") }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid stroke="var(--border-dim)" strokeDasharray="2 4" />
              <XAxis dataKey="t" hide /><YAxis hide />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-c)", fontSize: 11 }} />
              <Line type="monotone" dataKey="netIn"  stroke="var(--teal)"  strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="netOut" stroke="var(--amber)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-6">
        <NxCard eyebrow="Top Processes" title="By CPU (live)">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="eyebrow border-b border-[var(--border-c)] text-left">
                <th className="pb-2">Name</th><th className="pb-2">PID</th><th className="pb-2">CPU%</th>
                <th className="pb-2">Memory</th><th className="pb-2">Status</th><th className="pb-2">User</th>
              </tr>
            </thead>
            <tbody className="mono">
              {procs.map((p) => (
                <tr key={p.pid} className="border-b border-[var(--border-dim)]">
                  <td className="py-2 text-[var(--text)]">{p.name}</td>
                  <td className="text-[var(--text-sub)]">{p.pid}</td>
                  <td className="text-[var(--amber)]">{p.cpu}%</td>
                  <td className="text-[var(--text-sub)]">{p.memMB} MB</td>
                  <td className="text-[var(--teal)]">{p.status}</td>
                  <td className="text-[var(--text-sub)]">{p.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </NxCard>
      </div>
    </PageWrapper>
  );
}

function ChartCard({ label, value, unit, trend = 0, stats, children }: {
  label: string; value: number; unit?: string; trend?: number;
  stats: { min: number; max: number; avg: number }; children: React.ReactNode;
}) {
  return (
    <div className="nx-card p-5">
      <div className="flex items-end justify-between pb-3">
        <div>
          <div className="eyebrow pb-1">{label}</div>
          <div className="display flex items-baseline gap-2 text-[26px] font-bold text-[var(--text)]">
            {value}<span className="text-[12px] font-normal text-[var(--text-sub)]">{unit}</span>
            {trend !== 0 && (
              <span className="mono flex items-center text-[11px]" style={{ color: trend > 0 ? "var(--crit)" : "var(--ok)" }}>
                {trend > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {Math.abs(Math.round(trend))}
              </span>
            )}
          </div>
        </div>
      </div>
      {children}
      <div className="mono mt-3 flex justify-end gap-4 text-[10px] text-[var(--text-sub)]">
        <span>MIN {stats.min}</span><span>AVG {stats.avg}</span><span>MAX {stats.max}</span>
      </div>
    </div>
  );
}
