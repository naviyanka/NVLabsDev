import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { NxCard } from "@/components/ui/NxCard";
import { 
  getCertificatesClient, 
  importCertificateClient, 
  deleteCertificateClient, 
  generateSelfSignedCertClient,
  renewCertificateClient,
  type Certificate 
} from "@/api/client";
import { 
  Loader2, 
  ArrowDownAZ, 
  ArrowUpZA, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Plus, 
  Trash2, 
  X, 
  Upload, 
  Key, 
  FileText, 
  Download, 
  RefreshCw, 
  Copy, 
  Check, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  FileCode,
  Sparkles,
  Lock,
  Globe
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/certificates")({
  head: () => ({ meta: [{ title: "Certificates — NEXUS" }, { name: "description", content: "Inspect and manage server SSL/TLS certificates and trust stores." }] }),
  component: CertificatesPage,
});

const CERT_STORES = [
  { id: "Personal", label: "Personal Store" },
  { id: "Trusted Root CAs", label: "Trusted Root CAs" },
  { id: "Intermediate CAs", label: "Intermediate CAs" },
  { id: "Enterprise Trust", label: "Enterprise Trust" }
];

function getExpiryInfo(toDateStr: string) {
  const days = Math.round((new Date(toDateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Expired", status: "critical" as const, days };
  if (days < 30) return { label: `Expires in ${days}d`, status: "warning" as const, days };
  return { label: `${days}d remaining`, status: "online" as const, days };
}

function CertificatesPage() {
  const [server, setServer] = useState("dc01");
  const [store, setStore] = useState("Personal");
  const [allCerts, setAllCerts] = useState<Certificate[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [sel, setSel] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "valid" | "expiring" | "expired" | "selfsigned" | "privatekey">("all");
  
  // Modals
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSelfSignedOpen, setIsSelfSignedOpen] = useState(false);
  const [renewCert, setRenewCert] = useState<Certificate | null>(null);

  // Table Sorting
  const [sortCol, setSortCol] = useState<keyof Certificate>("subject");
  const [sortAsc, setSortAsc] = useState(true);

  // Inspector Tabs
  const [inspectorTab, setInspectorTab] = useState<"overview" | "crypto" | "san" | "chain" | "pem">("overview");
  const [copiedPem, setCopiedPem] = useState(false);
  const [copiedThumbprint, setCopiedThumbprint] = useState(false);

  const loadCertificates = () => {
    setLoading(true);
    getCertificatesClient(server, store)
      .then((data) => {
        setCerts(data);
        if (sel) {
          const updatedSel = data.find(c => c.thumbprint === sel.thumbprint || c.id === sel.id);
          setSel(updatedSel || (data.length > 0 ? data[0] : null));
        } else if (data.length > 0) {
          setSel(data[0]);
        } else {
          setSel(null);
        }
      })
      .catch((err) => {
        console.error("Failed to load certificates", err);
        toast.error("Failed to load certificates");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCertificates();
  }, [server, store]);

  const stats = useMemo(() => {
    let valid = 0;
    let expiring = 0;
    let expired = 0;
    let withPrivateKey = 0;

    certs.forEach((c) => {
      const exp = getExpiryInfo(c.to);
      if (exp.days < 0) expired++;
      else if (exp.days < 30) expiring++;
      else valid++;

      if (c.hasPrivateKey) withPrivateKey++;
    });

    return {
      total: certs.length,
      valid,
      expiring,
      expired,
      withPrivateKey
    };
  }, [certs]);

  const filteredCerts = useMemo(() => {
    let result = certs;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(c => 
        c.subject.toLowerCase().includes(q) || 
        c.issuer.toLowerCase().includes(q) ||
        c.thumbprint.toLowerCase().includes(q) ||
        (c.friendlyName && c.friendlyName.toLowerCase().includes(q)) ||
        (c.sanList && c.sanList.some(s => s.toLowerCase().includes(q)))
      );
    }

    if (filterType === "valid") {
      result = result.filter(c => getExpiryInfo(c.to).days >= 30);
    } else if (filterType === "expiring") {
      result = result.filter(c => {
        const d = getExpiryInfo(c.to).days;
        return d >= 0 && d < 30;
      });
    } else if (filterType === "expired") {
      result = result.filter(c => getExpiryInfo(c.to).days < 0);
    } else if (filterType === "selfsigned") {
      result = result.filter(c => c.isSelfSigned || c.subject === c.issuer);
    } else if (filterType === "privatekey") {
      result = result.filter(c => c.hasPrivateKey);
    }

    result.sort((a, b) => {
      const valA = a[sortCol] || "";
      const valB = b[sortCol] || "";
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [certs, search, filterType, sortCol, sortAsc]);

  const toggleSort = (col: keyof Certificate) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const handleDelete = async (cert: Certificate) => {
    if (!confirm(`Are you sure you want to delete certificate:\n${cert.subject}?`)) return;
    try {
      const ok = await deleteCertificateClient(server, cert.thumbprint);
      if (ok) {
        toast.success("Certificate deleted successfully");
        setSel(null);
        loadCertificates();
      } else {
        toast.error("Failed to delete certificate");
      }
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(certs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nexus_certificates_${server}_${store}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Certificates exported to JSON");
  };

  const handleExportCerFile = (cert: Certificate) => {
    const content = cert.certPem || `-----BEGIN CERTIFICATE-----\n${cert.thumbprint}\n-----END CERTIFICATE-----`;
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const filename = (cert.friendlyName || cert.subject.split(',')[0].replace("CN=", "") || "cert").replace(/[^a-zA-Z0-9_-]/g, "_");
    downloadAnchor.setAttribute("download", `${filename}.cer`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Exported ${filename}.cer`);
  };

  const copyToClipboard = (text: string, type: "pem" | "thumbprint") => {
    navigator.clipboard.writeText(text);
    if (type === "pem") {
      setCopiedPem(true);
      setTimeout(() => setCopiedPem(false), 2000);
    } else {
      setCopiedThumbprint(true);
      setTimeout(() => setCopiedThumbprint(false), 2000);
    }
    toast.success(`Copied ${type === "pem" ? "PEM certificate" : "thumbprint"} to clipboard`);
  };

  return (
    <PageWrapper>
      <PageHeader eyebrow="Security & Infrastructure" title="Certificates Manager" />
      <ServerSelector value={server} onChange={setServer} />

      {/* Top Metrics Cards */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NxCard className="border-[var(--border-dim)] bg-[var(--bg-card)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow text-[var(--text-sub)]">Total In Store</div>
              <div className="text-2xl font-bold text-[var(--text)] mt-1">{stats.total}</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--amber-low)] text-[var(--amber)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="text-xs text-[var(--text-sub)] mt-3 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-[var(--amber)]" />
            <span>{stats.withPrivateKey} with private key</span>
          </div>
        </NxCard>

        <NxCard className="border-[var(--border-dim)] bg-[var(--bg-card)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow text-[var(--text-sub)]">Healthy / Active</div>
              <div className="text-2xl font-bold text-[var(--ok)] mt-1">{stats.valid}</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--ok-low)] text-[var(--ok)]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="text-xs text-[var(--text-sub)] mt-3">
            Valid and secure certificates
          </div>
        </NxCard>

        <NxCard className="border-[var(--border-dim)] bg-[var(--bg-card)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow text-[var(--text-sub)]">Expiring Soon (&lt; 30d)</div>
              <div className={`text-2xl font-bold ${stats.expiring > 0 ? "text-[var(--warn)]" : "text-[var(--text)]"} mt-1`}>
                {stats.expiring}
              </div>
            </div>
            <div className={`p-3 rounded-xl ${stats.expiring > 0 ? "bg-[var(--warn-low)] text-[var(--warn)]" : "bg-[var(--bg-surface)] text-[var(--text-sub)]"}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="text-xs text-[var(--text-sub)] mt-3">
            Requires renewal or replacement
          </div>
        </NxCard>

        <NxCard className="border-[var(--border-dim)] bg-[var(--bg-card)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow text-[var(--text-sub)]">Expired Certs</div>
              <div className={`text-2xl font-bold ${stats.expired > 0 ? "text-[var(--crit)]" : "text-[var(--text)]"} mt-1`}>
                {stats.expired}
              </div>
            </div>
            <div className={`p-3 rounded-xl ${stats.expired > 0 ? "bg-[var(--crit-low)] text-[var(--crit)]" : "bg-[var(--bg-surface)] text-[var(--text-sub)]"}`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <div className="text-xs text-[var(--text-sub)] mt-3">
            Security risk - action needed
          </div>
        </NxCard>
      </div>

      {/* Control Toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        {/* Store Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-xl backdrop-blur-md">
          {CERT_STORES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStore(s.id)}
              className={`mono rounded-lg px-3.5 py-2 text-[12px] font-semibold transition-all duration-200 flex items-center gap-2 ${
                s.id === store
                  ? "bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]/30 shadow-sm"
                  : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)]"
              }`}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Search, Filter & Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-sub)]" />
            <input
              type="text"
              placeholder="Search subject, issuer, SAN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[var(--amber)] transition-colors text-[var(--text)] placeholder:text-[var(--text-sub)]"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)] cursor-pointer"
          >
            <option value="all">All Certificates</option>
            <option value="valid">Valid Only</option>
            <option value="expiring">Expiring Soon (&lt; 30d)</option>
            <option value="expired">Expired Only</option>
            <option value="selfsigned">Self-Signed Only</option>
            <option value="privatekey">With Private Key</option>
          </select>

          <button
            onClick={() => setIsSelfSignedOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--amber)]/40 bg-[var(--amber-low)] text-[var(--amber)] px-3.5 py-2 text-xs font-semibold hover:bg-[var(--amber)] hover:text-black transition-all shadow-sm"
          >
            <Sparkles size={14} /> Create Self-Signed
          </button>

          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--amber)] text-black px-3.5 py-2 text-xs font-bold hover:bg-[var(--amber-hover)] transition-all shadow-sm"
          >
            <Plus size={14} /> Import Cert
          </button>

          <button
            onClick={handleExportJson}
            title="Export certificates to JSON"
            className="p-2 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-card)] text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)] transition-colors"
          >
            <Download size={15} />
          </button>
        </div>
      </div>

      {/* Main Grid: Table & Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Certificate Table Card */}
        <div className="nx-card overflow-hidden flex flex-col h-[calc(100vh-320px)] min-h-[500px] backdrop-blur-xl border border-[var(--border-dim)] shadow-xl">
          <div className="overflow-auto flex-1">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-[var(--bg-card)] z-10 backdrop-blur-md">
                <tr className="eyebrow border-b border-[var(--border-c)] text-left">
                  <th className="px-4 py-3 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => toggleSort("subject")}>
                    <div className="flex items-center gap-1">Subject / Name {sortCol === "subject" && (sortAsc ? <ArrowDownAZ className="w-3.5 h-3.5 text-[var(--amber)]"/> : <ArrowUpZA className="w-3.5 h-3.5 text-[var(--amber)]"/>)}</div>
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => toggleSort("issuer")}>
                    <div className="flex items-center gap-1">Issuer {sortCol === "issuer" && (sortAsc ? <ArrowDownAZ className="w-3.5 h-3.5 text-[var(--amber)]"/> : <ArrowUpZA className="w-3.5 h-3.5 text-[var(--amber)]"/>)}</div>
                  </th>
                  <th className="px-4 py-3 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => toggleSort("to")}>
                    <div className="flex items-center gap-1">Valid To {sortCol === "to" && (sortAsc ? <ArrowDownAZ className="w-3.5 h-3.5 text-[var(--amber)]"/> : <ArrowUpZA className="w-3.5 h-3.5 text-[var(--amber)]"/>)}</div>
                  </th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="mono">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-[var(--text-sub)]">
                      <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-[var(--amber)]" />
                      Loading certificates from store <span className="text-[var(--text)] font-semibold">{store}</span>...
                    </td>
                  </tr>
                ) : filteredCerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-[var(--text-sub)]">
                      <ShieldCheck className="w-10 h-10 opacity-20 mx-auto mb-3" />
                      <p className="text-sm font-medium">No certificates found matching filters.</p>
                      <button 
                        onClick={() => { setSearch(""); setFilterType("all"); }} 
                        className="mt-3 text-xs text-[var(--amber)] underline hover:text-[var(--amber-hover)]"
                      >
                        Reset search filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredCerts.map((c) => {
                    const e = getExpiryInfo(c.to);
                    const isSelected = sel?.thumbprint === c.thumbprint || sel?.id === c.id;
                    return (
                      <tr
                        key={c.id || c.thumbprint}
                        onClick={() => setSel(c)}
                        className={`cursor-pointer border-b border-[var(--border-dim)] transition-colors duration-150 ${
                          isSelected ? "bg-[var(--amber-low)]" : "hover:bg-[var(--bg-surface)]"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 max-w-[220px]">
                            {c.hasPrivateKey ? (
                              <Key size={14} className="text-[var(--amber)] shrink-0" title="Includes Private Key" />
                            ) : c.isSelfSigned ? (
                              <Sparkles size={14} className="text-[var(--cyan,cyan)] shrink-0" title="Self-Signed" />
                            ) : (
                              <Lock size={14} className="text-[var(--text-sub)] shrink-0" />
                            )}
                            <div className="truncate">
                              <div className="font-semibold text-[var(--text)] truncate" title={c.subject}>
                                {c.friendlyName || c.subject.split(',')[0].replace("CN=", "")}
                              </div>
                              <div className="text-[10px] text-[var(--text-sub)] truncate font-mono">{c.subject}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-[var(--text-sub)] truncate max-w-[150px]" title={c.issuer}>
                          {c.issuer.split(',')[0].replace("CN=", "")}
                        </td>

                        <td className="px-4 py-3 text-[var(--text-sub)] whitespace-nowrap">
                          {c.to}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={e.status}>{e.label}</StatusBadge>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={(evt) => evt.stopPropagation()}>
                            <button
                              onClick={() => handleExportCerFile(c)}
                              title="Download .CER File"
                              className="p-1.5 rounded-lg text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)] transition-colors"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => setRenewCert(c)}
                              title="Renew Certificate"
                              className="p-1.5 rounded-lg text-[var(--amber)] hover:bg-[var(--amber-low)] transition-colors"
                            >
                              <RefreshCw size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(c)}
                              title="Delete Certificate"
                              className="p-1.5 rounded-lg text-[var(--crit)] hover:bg-[var(--crit)]/20 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-[var(--border-dim)] text-xs text-[var(--text-sub)] bg-[var(--bg-surface)] flex items-center justify-between">
            <span>Store: <strong className="text-[var(--text)]">{store}</strong></span>
            <span>Showing {filteredCerts.length} of {certs.length} certificates</span>
          </div>
        </div>

        {/* Certificate Inspector Side Panel */}
        <aside className="nx-card p-5 backdrop-blur-xl border border-[var(--border-dim)] shadow-2xl relative overflow-hidden flex flex-col h-[calc(100vh-320px)] min-h-[500px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--amber)] to-[var(--rose,rose)] opacity-60" />

          {sel ? (
            <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-[var(--border-dim)]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[var(--bg-surface)] rounded-xl text-[var(--amber)] border border-[var(--border-dim)]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="eyebrow text-[var(--text-sub)]">Certificate Details</div>
                    <h3 className="display break-all text-sm font-bold text-[var(--text)] leading-tight truncate">
                      {sel.friendlyName || sel.subject.split(',')[0].replace("CN=", "")}
                    </h3>
                  </div>
                </div>
                <StatusBadge status={getExpiryInfo(sel.to).status}>
                  {getExpiryInfo(sel.to).label}
                </StatusBadge>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-1 mb-4 p-1 bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "crypto", label: "Crypto & Key" },
                  { id: "san", label: "SANs" },
                  { id: "chain", label: "Trust Chain" },
                  { id: "pem", label: "PEM View" }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setInspectorTab(t.id as any)}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                      inspectorTab === t.id
                        ? "bg-[var(--bg-card)] text-[var(--amber)] shadow-sm font-bold border border-[var(--border-dim)]"
                        : "text-[var(--text-sub)] hover:text-[var(--text)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Content Area */}
              <div className="flex-1 overflow-auto pr-1 space-y-4 text-xs font-mono">
                {inspectorTab === "overview" && (
                  <div className="space-y-3 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-dim)]">
                    <DetailItem k="Subject DN" v={sel.subject} />
                    <DetailItem k="Issuer DN" v={sel.issuer} />
                    <DetailItem k="Friendly Name" v={sel.friendlyName || "—"} />
                    <DetailItem k="Store Location" v={sel.store || store} />
                    <DetailItem k="Serial Number" v={sel.serialNumber || "7C:00:12:34:56:78"} />
                    <DetailItem k="Valid From" v={sel.from} />
                    <DetailItem k="Valid To" v={sel.to} />
                    <DetailItem k="Intended Purpose" v={sel.purpose} />
                    
                    <div>
                      <div className="text-[10px] text-[var(--text-sub)] uppercase tracking-wider mb-1">Thumbprint (SHA-1)</div>
                      <div className="flex items-center gap-2 bg-[var(--bg-void)] p-2 rounded-lg border border-[var(--border-dim)] text-[11px] break-all">
                        <span className="flex-1 text-[var(--text)]">{sel.thumbprint}</span>
                        <button
                          onClick={() => copyToClipboard(sel.thumbprint, "thumbprint")}
                          className="text-[var(--text-sub)] hover:text-[var(--amber)] transition-colors p-1"
                          title="Copy Thumbprint"
                        >
                          {copiedThumbprint ? <Check size={14} className="text-[var(--ok)]" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {inspectorTab === "crypto" && (
                  <div className="space-y-3 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-dim)]">
                    <DetailItem k="Signature Algorithm" v={sel.signatureAlgorithm || "SHA256withRSA"} />
                    <DetailItem k="Key Algorithm" v={sel.keyAlgorithm || "RSA"} />
                    <DetailItem k="Key Size" v={`${sel.keySize || 2048} bits`} />
                    <DetailItem k="Has Private Key" v={sel.hasPrivateKey ? "Yes (Exportable)" : "No"} />
                    <DetailItem k="Self-Signed" v={sel.isSelfSigned ? "Yes" : "No"} />
                    <DetailItem k="Version" v="v3 (X.509 standard)" />
                  </div>
                )}

                {inspectorTab === "san" && (
                  <div className="space-y-3 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-dim)]">
                    <div className="text-[10px] text-[var(--text-sub)] uppercase tracking-wider mb-2">
                      Subject Alternative Names ({sel.sanList?.length || 0})
                    </div>
                    {sel.sanList && sel.sanList.length > 0 ? (
                      <div className="space-y-1.5">
                        {sel.sanList.map((san, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-[var(--bg-void)] px-3 py-2 rounded-lg border border-[var(--border-dim)] text-[11px] text-[var(--text)]">
                            <Globe size={13} className="text-[var(--amber)] shrink-0" />
                            <span>{san}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[var(--text-sub)] text-[11px] italic">No Subject Alternative Names defined.</p>
                    )}
                  </div>
                )}

                {inspectorTab === "chain" && (
                  <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-dim)] space-y-4">
                    <div className="text-[10px] text-[var(--text-sub)] uppercase tracking-wider mb-2">
                      Validation Trust Chain
                    </div>
                    
                    <div className="space-y-3 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-[var(--border-dim)]">
                      <div className="flex items-start gap-3 relative z-10 pl-1">
                        <div className="w-5 h-5 rounded-full bg-[var(--amber-low)] text-[var(--amber)] flex items-center justify-center shrink-0 border border-[var(--amber)]/30 text-[10px]">
                          1
                        </div>
                        <div className="bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-dim)] flex-1">
                          <div className="font-bold text-[var(--text)] text-[11px]">Root CA Authority</div>
                          <div className="text-[10px] text-[var(--text-sub)] truncate">{sel.issuer}</div>
                        </div>
                      </div>

                      {!sel.isSelfSigned && (
                        <div className="flex items-start gap-3 relative z-10 pl-1">
                          <div className="w-5 h-5 rounded-full bg-[var(--amber-low)] text-[var(--amber)] flex items-center justify-center shrink-0 border border-[var(--amber)]/30 text-[10px]">
                            2
                          </div>
                          <div className="bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-dim)] flex-1">
                            <div className="font-bold text-[var(--text)] text-[11px]">Intermediate Issuer</div>
                            <div className="text-[10px] text-[var(--text-sub)] truncate">NEXUS Sub-CA 1</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3 relative z-10 pl-1">
                        <div className="w-5 h-5 rounded-full bg-[var(--ok-low)] text-[var(--ok)] flex items-center justify-center shrink-0 border border-[var(--ok)]/30 text-[10px]">
                          {sel.isSelfSigned ? 2 : 3}
                        </div>
                        <div className="bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-dim)] flex-1">
                          <div className="font-bold text-[var(--text)] text-[11px]">End-Entity Certificate</div>
                          <div className="text-[10px] text-[var(--text-sub)] truncate">{sel.subject}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {inspectorTab === "pem" && (
                  <div className="bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-dim)] space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-sub)]">
                      <span>X.509 Base64 PEM Encoded Certificate</span>
                      <button
                        onClick={() => copyToClipboard(sel.certPem || `-----BEGIN CERTIFICATE-----\n${sel.thumbprint}\n-----END CERTIFICATE-----`, "pem")}
                        className="flex items-center gap-1 text-[var(--amber)] hover:underline font-semibold"
                      >
                        {copiedPem ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedPem ? "Copied" : "Copy PEM"}</span>
                      </button>
                    </div>
                    <textarea
                      readOnly
                      rows={9}
                      value={sel.certPem || `-----BEGIN CERTIFICATE-----\n${sel.thumbprint.replace(/:/g, "")}\n-----END CERTIFICATE-----`}
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-dim)] rounded-lg p-2.5 text-[10px] font-mono text-[var(--text)] focus:outline-none resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-4 pt-3 border-t border-[var(--border-dim)] flex items-center justify-between gap-2">
                <button
                  onClick={() => setRenewCert(sel)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[var(--amber-low)] border border-[var(--amber)]/30 text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black transition-all text-xs font-semibold"
                >
                  <RefreshCw size={13} /> Renew Cert
                </button>
                <button
                  onClick={() => handleExportCerFile(sel)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-dim)] text-[var(--text)] hover:bg-[var(--bg-card)] transition-all text-xs font-semibold"
                >
                  <Download size={13} /> Download .CER
                </button>
                <button
                  onClick={() => handleDelete(sel)}
                  className="p-2 rounded-xl bg-[var(--crit)]/10 border border-[var(--crit)]/30 text-[var(--crit)] hover:bg-[var(--crit)] hover:text-black transition-all"
                  title="Remove Certificate"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-[var(--text-sub)] flex flex-col items-center justify-center flex-1">
              <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">Select a certificate from the table to inspect details</p>
            </div>
          )}
        </aside>
      </div>

      {/* Modals */}
      {isImportOpen && (
        <ImportCertModal
          server={server}
          defaultStore={store}
          onClose={() => setIsImportOpen(false)}
          onImported={() => {
            setIsImportOpen(false);
            loadCertificates();
          }}
        />
      )}

      {isSelfSignedOpen && (
        <SelfSignedCertModal
          server={server}
          defaultStore={store}
          onClose={() => setIsSelfSignedOpen(false)}
          onCreated={() => {
            setIsSelfSignedOpen(false);
            loadCertificates();
          }}
        />
      )}

      {renewCert && (
        <RenewCertModal
          server={server}
          cert={renewCert}
          onClose={() => setRenewCert(null)}
          onRenewed={() => {
            setRenewCert(null);
            loadCertificates();
          }}
        />
      )}
    </PageWrapper>
  );
}

function DetailItem({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-b border-[var(--border-dim)] pb-2 last:border-0 last:pb-0">
      <div className="text-[10px] text-[var(--text-sub)] uppercase tracking-wider">{k}</div>
      <div className="text-[11px] font-semibold text-[var(--text)] break-all mt-0.5">{v}</div>
    </div>
  );
}

/* Modal 1: Import Certificate */
function ImportCertModal({ server, defaultStore, onClose, onImported }: { server: string; defaultStore: string; onClose: () => void; onImported: () => void }) {
  const [storeName, setStoreName] = useState(defaultStore);
  const [certContent, setCertContent] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inputMode, setInputMode] = useState<"paste" | "upload">("upload");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCertContent(text);
      toast.success(`Loaded file: ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certContent.trim()) {
      toast.error("Please provide certificate file or PEM text");
      return;
    }
    setSubmitting(true);
    try {
      const ok = await importCertificateClient(server, certContent, password, storeName);
      if (ok) {
        toast.success(`Certificate imported successfully into ${storeName}`);
        onImported();
      } else {
        toast.error("Failed to import certificate");
      }
    } catch (e) {
      toast.error("Import error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-[var(--amber)]" />
            <h3 className="text-base font-bold text-[var(--text)]">Import Certificate</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-2">Target Certificate Store</label>
            <select
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            >
              {CERT_STORES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 p-1 bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setInputMode("upload")}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all ${inputMode === "upload" ? "bg-[var(--bg-card)] text-[var(--amber)] shadow-sm font-bold" : "text-[var(--text-sub)]"}`}
            >
              Upload File (.pem/.cer/.pfx)
            </button>
            <button
              type="button"
              onClick={() => setInputMode("paste")}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all ${inputMode === "paste" ? "bg-[var(--bg-card)] text-[var(--amber)] shadow-sm font-bold" : "text-[var(--text-sub)]"}`}
            >
              Paste PEM Text
            </button>
          </div>

          {inputMode === "upload" ? (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-2">Certificate File</label>
              <input
                type="file"
                accept=".pem,.cer,.crt,.pfx,.p12"
                onChange={handleFileUpload}
                className="w-full text-xs text-[var(--text-sub)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--amber-low)] file:text-[var(--amber)] hover:file:bg-[var(--amber)] hover:file:text-black cursor-pointer"
              />
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-2">Certificate PEM / Base64 Content</label>
            <textarea
              required
              rows={5}
              value={certContent}
              onChange={(e) => setCertContent(e.target.value)}
              placeholder="Paste -----BEGIN CERTIFICATE----- string..."
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] p-3 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-2">PFX / PKCS#12 Password (Optional)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password if importing .pfx or .p12"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50 flex items-center gap-2">
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Importing..." : "Import Certificate"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* Modal 2: Create Self-Signed Certificate */
function SelfSignedCertModal({ server, defaultStore, onClose, onCreated }: { server: string; defaultStore: string; onClose: () => void; onCreated: () => void }) {
  const [storeName, setStoreName] = useState(defaultStore);
  const [commonName, setCommonName] = useState(`${server}.nexuslab.local`);
  const [friendlyName, setFriendlyName] = useState("");
  const [sanInput, setSanInput] = useState(`${server}.nexuslab.local, ${server}`);
  const [daysValid, setDaysValid] = useState(730); // 2 years
  const [keySize, setKeySize] = useState(2048);
  const [purpose, setPurpose] = useState("Server Authentication, Client Authentication");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commonName.trim()) {
      toast.error("Common Name (CN) is required");
      return;
    }
    setSubmitting(true);
    const sanList = sanInput.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const ok = await generateSelfSignedCertClient(server, storeName, {
        commonName,
        san: sanList,
        daysValid,
        keySize,
        friendlyName: friendlyName || undefined,
        purpose
      });
      if (ok) {
        toast.success(`Generated self-signed certificate for ${commonName}`);
        onCreated();
      } else {
        toast.error("Failed to generate certificate");
      }
    } catch (e) {
      toast.error("Generation error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--amber)]" />
            <h3 className="text-base font-bold text-[var(--text)]">Generate Self-Signed Certificate</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Target Store</label>
            <select
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2 text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            >
              {CERT_STORES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Common Name (CN)</label>
            <input
              type="text"
              required
              value={commonName}
              onChange={(e) => setCommonName(e.target.value)}
              placeholder="e.g. web01.nexuslab.local"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2 text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Friendly Name (Optional)</label>
            <input
              type="text"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
              placeholder="e.g. Web Server TLS Certificate"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Subject Alternative Names (Comma Separated)</label>
            <input
              type="text"
              value={sanInput}
              onChange={(e) => setSanInput(e.target.value)}
              placeholder="e.g. web01.nexuslab.local, 192.168.0.40"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2 text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">RSA Key Size</label>
              <select
                value={keySize}
                onChange={(e) => setKeySize(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
              >
                <option value={2048}>2048-bit RSA (Standard)</option>
                <option value={4096}>4096-bit RSA (High Security)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Validity Duration</label>
              <select
                value={daysValid}
                onChange={(e) => setDaysValid(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
              >
                <option value={365}>1 Year (365 days)</option>
                <option value={730}>2 Years (730 days)</option>
                <option value={1825}>5 Years (1825 days)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50 flex items-center gap-2">
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Generating..." : "Generate Certificate"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* Modal 3: Renew Certificate */
function RenewCertModal({ server, cert, onClose, onRenewed }: { server: string; cert: Certificate; onClose: () => void; onRenewed: () => void }) {
  const [extendYears, setExtendYears] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const handleRenew = async () => {
    setSubmitting(true);
    try {
      const ok = await renewCertificateClient(server, cert.thumbprint, extendYears);
      if (ok) {
        toast.success(`Successfully renewed ${cert.friendlyName || cert.subject} for ${extendYears} years`);
        onRenewed();
      } else {
        toast.error("Failed to renew certificate");
      }
    } catch (e) {
      toast.error("Renewal error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 text-[var(--amber)]">
            <RefreshCw size={18} />
            <h3 className="text-base font-bold text-[var(--text)]">Renew Certificate</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-dim)] space-y-1">
            <div className="font-bold text-[var(--text)] break-all">
              {cert.friendlyName || cert.subject.split(',')[0].replace("CN=", "")}
            </div>
            <div className="text-[10px] text-[var(--text-sub)] font-mono">{cert.thumbprint}</div>
            <div className="text-[10px] text-[var(--amber)]">Current Expiry: {cert.to}</div>
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-2">Extension Period</label>
            <select
              value={extendYears}
              onChange={(e) => setExtendYears(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            >
              <option value={1}>1 Year Extension</option>
              <option value={2}>2 Years Extension</option>
              <option value={5}>5 Years Extension</option>
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button onClick={handleRenew} disabled={submitting} className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50 flex items-center gap-2">
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Renewing..." : "Confirm Renewal"}
          </button>
        </div>
      </div>
    </div>
  );
}
