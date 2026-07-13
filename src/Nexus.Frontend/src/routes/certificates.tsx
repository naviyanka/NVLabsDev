import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCertificatesClient, type Certificate } from "@/api/client";
import { Loader2, ArrowDownAZ, ArrowUpZA, ShieldCheck, Search } from "lucide-react";

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
  const [server, setServer] = useState("localhost");
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [sel, setSel] = useState<Certificate | null>(null);
  const [store, setStore] = useState("Personal");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  const [sortCol, setSortCol] = useState<keyof Certificate>("subject");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCertificatesClient(server, store)
      .then((data) => {
        setCerts(data);
        setSel(null);
      })
      .catch(err => {
        console.error("Failed to load certificates", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [server, store]);

  const filteredCerts = useMemo(() => {
    let result = certs;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.subject.toLowerCase().includes(q) || c.issuer.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return result;
  }, [certs, search, sortCol, sortAsc]);

  const toggleSort = (col: keyof Certificate) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  return (
    <PageWrapper>
      <PageHeader eyebrow="Security" title="Certificates" />
      <ServerSelector value={server} onChange={setServer} />
      
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 p-1 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg backdrop-blur-md">
          {["Personal","Trusted Root CAs","Intermediate CAs","Enterprise Trust"].map((s) => (
            <button 
              key={s} 
              onClick={() => setStore(s)} 
              className={`mono rounded-md px-4 py-2 text-[12px] font-medium transition-all duration-300 ${s === store ? "bg-[var(--amber-low)] text-[var(--amber)] shadow-sm" : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)]"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-sub)]" />
          <input
            type="text"
            placeholder="Search certificates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors text-[var(--text)] placeholder:text-[var(--text-sub)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="nx-card overflow-hidden flex flex-col h-[calc(100vh-280px)] backdrop-blur-xl border border-[var(--border-dim)] shadow-xl">
          <div className="overflow-auto flex-1">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-[var(--bg-card)] z-10 backdrop-blur-md">
                <tr className="eyebrow border-b border-[var(--border-c)] text-left">
                  <th className="px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group" onClick={() => toggleSort("subject")}>
                    <div className="flex items-center gap-1">Subject {sortCol === "subject" && (sortAsc ? <ArrowDownAZ className="w-4 h-4"/> : <ArrowUpZA className="w-4 h-4"/>)}</div>
                  </th>
                  <th className="px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group" onClick={() => toggleSort("issuer")}>
                    <div className="flex items-center gap-1">Issuer {sortCol === "issuer" && (sortAsc ? <ArrowDownAZ className="w-4 h-4"/> : <ArrowUpZA className="w-4 h-4"/>)}</div>
                  </th>
                  <th className="px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group" onClick={() => toggleSort("to")}>
                    <div className="flex items-center gap-1">Valid To {sortCol === "to" && (sortAsc ? <ArrowDownAZ className="w-4 h-4"/> : <ArrowUpZA className="w-4 h-4"/>)}</div>
                  </th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="mono">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-[var(--text-sub)]">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--amber)]" />
                      Fetching certificates from {server}...
                    </td>
                  </tr>
                ) : filteredCerts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-[var(--text-sub)]">
                      No certificates found.
                    </td>
                  </tr>
                ) : (
                  filteredCerts.map((c) => {
                    const e = expiryStatus(c.to);
                    return (
                      <tr 
                        key={c.id} 
                        onClick={() => setSel(c)} 
                        className={`cursor-pointer border-b border-[var(--border-dim)] transition-colors duration-200 ${sel?.id === c.id ? "bg-[var(--amber-low)]" : "hover:bg-[var(--bg-surface)]"}`}
                      >
                        <td className="px-5 py-3 font-medium text-[var(--text)] truncate max-w-[200px]" title={c.subject}>{c.subject}</td>
                        <td className="px-5 py-3 text-[var(--text-sub)] truncate max-w-[150px]" title={c.issuer}>{c.issuer}</td>
                        <td className="px-5 py-3 text-[var(--text-sub)]">{c.to}</td>
                        <td className="px-5 py-3"><StatusBadge status={e.status}>{e.label}</StatusBadge></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-[var(--border-dim)] text-xs text-[var(--text-sub)] bg-[var(--bg-surface)]">
            Total Certificates: {filteredCerts.length}
          </div>
        </div>
        
        <aside className="nx-card h-fit p-6 backdrop-blur-xl border border-[var(--border-dim)] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--amber)] to-[var(--rose)] opacity-50" />
          
          {sel ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-[var(--bg-surface)] rounded-xl text-[var(--amber)] border border-[var(--border-dim)]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="eyebrow text-[var(--text-sub)]">Certificate Details</div>
                  <h3 className="display break-all text-sm font-semibold leading-tight">{sel.subject}</h3>
                </div>
              </div>
              
              <div className="space-y-4 mt-6 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-dim)]">
                <dl className="mono space-y-4 text-[12px]">
                  <Field k="Issuer" v={sel.issuer} />
                  <Field k="Valid From" v={sel.from} />
                  <Field k="Valid To" v={sel.to} />
                  <Field k="Thumbprint" v={sel.thumbprint} />
                  <Field k="Purpose" v={sel.purpose} />
                </dl>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-[var(--text-sub)] flex flex-col items-center justify-center">
              <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Select a certificate to view details</p>
            </div>
          )}
        </aside>
      </div>
    </PageWrapper>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--border-dim)] pb-3 last:border-0 last:pb-0">
      <dt className="text-[var(--text-sub)] font-medium uppercase tracking-wider text-[10px]">{k}</dt>
      <dd className="break-all text-[var(--text)] font-semibold">{v}</dd>
    </div>
  );
}
