import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCertificates, type Certificate } from "@/api/mock";

export const Route = createFileRoute("/certificates")({
  head: () => ({ meta: [{ title: "Certificates — NEXUS" }, { name: "description", content: "Inspect installed certificates." }] }),
  component: CertificatesPage,
});

function expiryStatus(to: string) {
  const days = Math.round((new Date(to).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Expired", status: "critical" as const };
  if (days < 30) return { label: `Expires in ${days}d`, status: "warning" as const };
  return { label: `${days}d remaining`, status: "online" as const };
}

function CertificatesPage() {
  const [server, setServer] = useState("web01");
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [sel, setSel] = useState<Certificate | null>(null);
  const [store, setStore] = useState("Personal");

  useEffect(() => { getCertificates(server).then(setCerts); }, [server]);

  return (
    <PageWrapper>
      <PageHeader eyebrow="Security" title="Certificates" />
      <ServerSelector value={server} onChange={setServer} />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {["Personal","Trusted Root CAs","Intermediate CAs","Enterprise Trust"].map((s) => (
          <button key={s} onClick={() => setStore(s)} className={"mono rounded-md border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] " + (s === store ? "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)]" : "border-[var(--border-c)] bg-[var(--bg-card)] text-[var(--text-sub)]")}>{s}</button>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_360px] gap-5">
        <div className="nx-card overflow-hidden">
          <table className="w-full text-[12px]">
            <thead><tr className="eyebrow border-b border-[var(--border-c)] text-left">
              <th className="px-4 py-2">Subject</th><th>Issuer</th><th>Valid To</th><th>Status</th><th>Purpose</th>
            </tr></thead>
            <tbody className="mono">
              {certs.map((c) => {
                const e = expiryStatus(c.to);
                return (
                  <tr key={c.id} onClick={() => setSel(c)} className={"cursor-pointer border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] " + (sel?.id === c.id ? "bg-[var(--amber-low)]" : "")}>
                    <td className="px-4 py-2 text-[var(--text)]">{c.subject}</td>
                    <td className="text-[var(--text-sub)]">{c.issuer}</td>
                    <td className="text-[var(--text-sub)]">{c.to}</td>
                    <td><StatusBadge status={e.status}>{e.label}</StatusBadge></td>
                    <td className="text-[var(--text-sub)]">{c.purpose}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <aside className="nx-card h-fit p-5">
          {sel ? (
            <>
              <div className="eyebrow pb-1">Certificate</div>
              <h3 className="display break-all text-[13px] font-semibold">{sel.subject}</h3>
              <dl className="mono mt-3 space-y-2 text-[11px]">
                <Field k="Issuer" v={sel.issuer} />
                <Field k="Valid From" v={sel.from} />
                <Field k="Valid To" v={sel.to} />
                <Field k="Thumbprint" v={sel.thumbprint} />
                <Field k="Purpose" v={sel.purpose} />
                <Field k="Key Size" v="RSA 2048" />
              </dl>
            </>
          ) : <div className="py-8 text-center text-[12px] text-[var(--text-sub)]">Select a certificate</div>}
        </aside>
      </div>
    </PageWrapper>
  );
}
function Field({ k, v }: { k: string; v: string }) {
  return <div><dt className="text-[var(--text-sub)]">{k}</dt><dd className="break-all text-[var(--text)]">{v}</dd></div>;
}
