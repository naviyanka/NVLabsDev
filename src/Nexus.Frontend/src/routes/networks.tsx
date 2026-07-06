import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wifi, Cable, Network } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getNetworkAdapters, type NetworkAdapter } from "@/api/mock";

export const Route = createFileRoute("/networks")({
  head: () => ({ meta: [{ title: "Networks — NEXUS" }, { name: "description", content: "Adapters, IP config, and DNS." }] }),
  component: NetworksPage,
});

function NetworksPage() {
  const [server, setServer] = useState("nexus01");
  const [adapters, setAdapters] = useState<NetworkAdapter[]>([]);
  const [sel, setSel] = useState(0);
  useEffect(() => { getNetworkAdapters(server).then((a) => { setAdapters(a); setSel(0); }); }, [server]);
  const a = adapters[sel];

  return (
    <PageWrapper>
      <PageHeader eyebrow="Infrastructure" title="Networks" />
      <ServerSelector value={server} onChange={setServer} />
      <div className="grid grid-cols-[260px_1fr] gap-5">
        <aside className="nx-card h-fit p-2">
          {adapters.map((ad, i) => {
            const Icon = ad.type === "WiFi" ? Wifi : ad.type === "Virtual" ? Network : Cable;
            const active = i === sel;
            return (
              <button key={ad.name} onClick={() => setSel(i)} className={"flex w-full items-start gap-3 rounded-md p-3 text-left text-[12px] " + (active ? "bg-[var(--amber-low)]" : "hover:bg-[var(--bg-surface)]")}>
                <Icon size={16} className={ad.status === "Connected" ? "text-[var(--teal)]" : "text-[var(--text-sub)]"} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[var(--text)]">{ad.name}</div>
                  <div className="mono text-[10px] text-[var(--text-sub)]">{ad.status} · {ad.speedMbps >= 1000 ? `${ad.speedMbps/1000} Gbps` : `${ad.speedMbps} Mbps`}</div>
                </div>
              </button>
            );
          })}
        </aside>

        {a && (
          <div className="grid grid-cols-2 gap-5">
            <div className="nx-card p-5">
              <div className="eyebrow pb-1">IPv4 Configuration</div>
              <h3 className="display pb-3 text-[15px] font-semibold">{a.name} <StatusBadge status={a.status === "Connected" ? "online" : "offline"}>{a.status}</StatusBadge></h3>
              <dl className="mono grid grid-cols-[120px_1fr] gap-y-2 text-[12px]">
                <dt className="text-[var(--text-sub)]">IP Address</dt><dd className="text-[var(--amber)]">{a.ipv4}</dd>
                <dt className="text-[var(--text-sub)]">Subnet Mask</dt><dd className="text-[var(--text)]">{a.subnet}</dd>
                <dt className="text-[var(--text-sub)]">Gateway</dt><dd className="text-[var(--text)]">{a.gateway}</dd>
                <dt className="text-[var(--text-sub)]">DNS</dt><dd className="text-[var(--text)]">{a.dns.join(", ") || "—"}</dd>
                <dt className="text-[var(--text-sub)]">DHCP</dt><dd className="text-[var(--text)]">{a.dhcp ? "Enabled" : "Disabled"}</dd>
                <dt className="text-[var(--text-sub)]">MAC</dt><dd className="text-[var(--text)]">{a.mac}</dd>
              </dl>
            </div>
            <div className="nx-card p-5">
              <div className="eyebrow pb-1">Statistics</div>
              <div className="grid grid-cols-2 gap-5 pt-2">
                <Stat label="Bytes Received" value={a.bytesIn} color="var(--teal)" />
                <Stat label="Bytes Sent" value={a.bytesOut} color="var(--amber)" />
              </div>
              <div className="eyebrow pb-1 pt-5">IPv6</div>
              <div className="mono text-[12px] text-[var(--text)]">{a.ipv6}</div>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {["Enable","Disable","Release","Renew"].map((b) => (
                  <button key={b} className="mono rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:border-[var(--amber)] hover:text-[var(--amber)]">{b}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="eyebrow pb-1">{label}</div>
      <div className="display text-[20px] font-bold" style={{ color }}>{(value / 1_000_000).toFixed(1)}<span className="text-[10px] font-normal text-[var(--text-sub)]"> MB</span></div>
    </div>
  );
}
