import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getFirewallRules, toggleFirewallRule, type FirewallRule } from "@/api/mock";

export const Route = createFileRoute("/firewall")({
  head: () => ({ meta: [{ title: "Firewall — NEXUS" }, { name: "description", content: "Firewall profiles and inbound/outbound rules." }] }),
  component: FirewallPage,
});

function FirewallPage() {
  const [server, setServer] = useState("web01");
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [tab, setTab] = useState<"Inbound"|"Outbound"|"Security">("Inbound");

  useEffect(() => { getFirewallRules(server).then(setRules); }, [server]);

  return (
    <PageWrapper>
      <PageHeader eyebrow="Security" title="Windows Defender Firewall" />
      <ServerSelector value={server} onChange={setServer} />

      <div className="mb-5 grid grid-cols-3 gap-3">
        {(["Domain","Private","Public"] as const).map((p) => (
          <div key={p} className="nx-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="eyebrow pb-1">{p} profile</div>
                <div className="display text-[16px] font-semibold text-[var(--ok)]">On</div>
              </div>
              <button className="mono rounded-full bg-[var(--ok)] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-[#0a0a0a]">Enabled</button>
            </div>
            <div className="mono mt-3 text-[10px] text-[var(--text-sub)]">Inbound: Block (default) · Outbound: Allow</div>
          </div>
        ))}
      </div>

      <div className="mb-3 inline-flex rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] p-1">
        {(["Inbound","Outbound","Security"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={"mono rounded px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] " + (tab === t ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)]")}>{t}</button>
        ))}
      </div>

      <div className="nx-card overflow-hidden">
        <table className="w-full text-[12px]">
          <thead><tr className="eyebrow border-b border-[var(--border-c)] text-left">
            <th className="px-3 py-2">Enabled</th><th>Name</th><th>Profile</th><th>Protocol</th><th>Local Port</th><th>Remote IP</th><th>Action</th><th>Direction</th>
          </tr></thead>
          <tbody className="mono">
            {rules.filter((r) => tab === "Security" ? false : r.direction === tab).map((r) => (
              <tr key={r.id} className={"border-b border-[var(--border-dim)] " + (r.action === "Allow" ? "bg-[var(--ok)]/[0.03]" : "bg-[var(--crit)]/[0.04]")}>
                <td className="px-3 py-1.5">
                  <input type="checkbox" defaultChecked={r.enabled} onChange={(e) => toggleFirewallRule(server, r.id, e.target.checked)} className="accent-[var(--amber)]" />
                </td>
                <td className="text-[var(--text)]">{r.name}</td>
                <td className="text-[var(--text-sub)]">{r.profile}</td>
                <td className="text-[var(--text-sub)]">{r.protocol}</td>
                <td className="text-[var(--amber)]">{r.localPort}</td>
                <td className="text-[var(--text-sub)]">{r.remoteIp}</td>
                <td style={{ color: r.action === "Allow" ? "var(--ok)" : "var(--crit)" }}>{r.action}</td>
                <td className="text-[var(--text-sub)]">{r.direction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
