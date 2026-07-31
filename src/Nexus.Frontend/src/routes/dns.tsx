import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Globe, Plus, Trash2, RefreshCw } from "lucide-react";
import { getApiUrl } from "@/lib/backend";
import { toast } from "sonner";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/dns")({
  head: () => ({ meta: [{ title: "DNS Manager — NEXUS" }] }),
  component: DnsPage,
});

function DnsPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchZones = async () => {
    try {
      const res = await fetch(getApiUrl("/dns/zones"));
      if (res.ok) { const d = await res.json(); setZones(Array.isArray(d) ? d : [d].filter(Boolean)); }
    } catch {}
    setLoading(false);
  };

  const fetchRecords = async (zone: string) => {
    try {
      const res = await fetch(getApiUrl(`/dns/zones/${encodeURIComponent(zone)}/records`));
      if (res.ok) { const d = await res.json(); setRecords(Array.isArray(d) ? d : [d].filter(Boolean)); }
    } catch {}
  };

  useEffect(() => { fetchZones(); }, []);
  useEffect(() => { if (selectedZone) fetchRecords(selectedZone); }, [selectedZone]);

  const handleDelete = async (name: string, type: string) => {
    if (!selectedZone || !confirm(`Delete ${type} record '${name}'?`)) return;
    const res = await fetch(getApiUrl(`/dns/zones/${encodeURIComponent(selectedZone)}/records?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`), { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); fetchRecords(selectedZone); } else toast.error("Failed");
  };

  return (
    <PageWrapper>
      <PageHeader title="DNS Manager" subtitle="Manage DNS zones and resource records" />
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Zone List */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          <h3 className="text-xs font-bold text-[var(--text-sub)] uppercase mb-2">Zones</h3>
          {loading ? <div className="nx-skeleton h-8" /> : zones.length === 0 ? <p className="text-xs text-[var(--text-sub)]">No DNS zones found</p> : zones.map((z: any) => (
            <button key={z.zoneName || z.ZoneName} onClick={() => setSelectedZone(z.zoneName || z.ZoneName)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${selectedZone === (z.zoneName || z.ZoneName) ? "bg-[var(--amber)]/10 text-[var(--amber)] border border-[var(--amber)]/30" : "text-[var(--text)] hover:bg-[var(--bg-void)]"}`}>
              <Globe size={12} className="inline mr-1.5" />{z.zoneName || z.ZoneName}
              <span className="ml-2 text-[10px] text-[var(--text-sub)]">{z.zoneType || z.ZoneType}</span>
            </button>
          ))}
        </div>

        {/* Records Table */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl p-4">
          {!selectedZone ? <p className="text-sm text-[var(--text-sub)]">Select a zone to view records</p> : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[var(--text)]">{selectedZone}</h3>
                <div className="flex gap-2">
                  <button onClick={() => fetchRecords(selectedZone)} className="p-1.5 rounded-lg text-[var(--text-sub)] hover:text-[var(--text)] cursor-pointer"><RefreshCw size={14} /></button>
                  <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--amber)] text-black cursor-pointer"><Plus size={12} /> Add</button>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[55vh] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-[var(--border-c)]"><th className="px-3 py-2 text-left text-[var(--text-sub)]">Name</th><th className="px-3 py-2 text-left text-[var(--text-sub)]">Type</th><th className="px-3 py-2 text-left text-[var(--text-sub)]">Data</th><th className="px-3 py-2"></th></tr></thead>
                  <tbody>{records.map((r: any, i) => (
                    <tr key={i} className="border-b border-[var(--border-c)] last:border-0 hover:bg-[var(--bg-void)]/50">
                      <td className="px-3 py-2 font-mono text-[var(--text)]">{r.hostName || r.HostName || ""}</td>
                      <td className="px-3 py-2 text-[var(--amber)] font-bold">{r.recordType || r.RecordType || ""}</td>
                      <td className="px-3 py-2 text-[var(--text-sub)] font-mono">{r.data || r.Data || ""}</td>
                      <td className="px-3 py-2 text-right"><button onClick={() => handleDelete(r.hostName || r.HostName, r.recordType || r.RecordType)} className="text-rose-400 hover:text-rose-300 cursor-pointer"><Trash2 size={12} /></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      {showAdd && selectedZone && <AddRecordModal zone={selectedZone} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); fetchRecords(selectedZone); }} />}
    </PageWrapper>
  );
}

function AddRecordModal({ zone, onClose, onSaved }: { zone: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(""); const [type, setType] = useState("A"); const [value, setValue] = useState(""); const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(getApiUrl(`/dns/zones/${encodeURIComponent(zone)}/records`), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, type, value }) });
    if (res.ok) { toast.success("Record added"); onSaved(); } else toast.error("Failed to add record");
    setSaving(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-3">
        <h2 className="text-lg font-bold text-[var(--text)]">Add DNS Record</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="hostname" className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none" />
        <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-sm text-[var(--text)]">{["A","AAAA","CNAME","MX","TXT"].map(t => <option key={t}>{t}</option>)}</select>
        <input value={value} onChange={e => setValue(e.target.value)} placeholder="192.168.1.10" className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-sm text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none" />
        <div className="flex justify-end gap-2 pt-2"><button onClick={onClose} className="px-4 py-2 rounded-xl text-xs border border-[var(--border-c)] text-[var(--text-sub)] cursor-pointer">Cancel</button><button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black cursor-pointer disabled:opacity-50">{saving ? "Adding..." : "Add Record"}</button></div>
      </div>
    </div>
  );
}
