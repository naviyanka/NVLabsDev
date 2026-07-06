import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Monitor } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { MOCK_SERVERS } from "@/api/mock";

export const Route = createFileRoute("/remote-desktop")({
  head: () => ({ meta: [{ title: "Remote Desktop — NEXUS" }, { name: "description", content: "Launch Remote Desktop sessions." }] }),
  component: RDPPage,
});

function RDPPage() {
  const [server, setServer] = useState("nexus01");
  const [res, setRes] = useState("1920x1080");
  const [adhoc, setAdhoc] = useState("");
  const s = MOCK_SERVERS.find((m) => m.id === server)!;

  function launch(host: string) {
    toast.success(`Opening Remote Desktop to ${host}`, { description: `Resolution ${res}` });
    try { window.open(`mstsc://${host}`, "_self"); } catch { /* ignore */ }
  }

  return (
    <PageWrapper>
      <PageHeader eyebrow="Management" title="Remote Desktop" />
      <div className="mx-auto max-w-2xl">
        <div className="nx-card p-8">
          <div className="grid place-items-center pb-6">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--amber-low)] text-[var(--amber)]"><Monitor size={28} /></div>
          </div>
          <label className="eyebrow block pb-2">Server</label>
          <select value={server} onChange={(e) => setServer(e.target.value)} className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[13px] text-[var(--text)]">
            {MOCK_SERVERS.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.ip} ({m.os})</option>)}
          </select>

          <label className="eyebrow mt-4 block pb-2">Resolution</label>
          <select value={res} onChange={(e) => setRes(e.target.value)} className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[13px] text-[var(--text)]">
            {["1280x720","1920x1080","2560x1440","Full screen"].map((r) => <option key={r}>{r}</option>)}
          </select>

          <button onClick={() => launch(s.ip)} className="mono mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-[var(--amber)] bg-[var(--amber-low)] py-3 text-[12px] uppercase tracking-[0.2em] text-[var(--amber)] hover:bg-[var(--amber)]/15">
            <Monitor size={14} /> Launch Remote Desktop
          </button>
          <p className="pt-3 text-center text-[11px] text-[var(--text-sub)]">Opens the Windows Remote Desktop Connection client on your local machine.</p>

          <hr className="my-6 border-[var(--border-c)]" />
          <label className="eyebrow block pb-2">Quick connect</label>
          <div className="flex gap-2">
            <input value={adhoc} onChange={(e) => setAdhoc(e.target.value)} placeholder="hostname or IP" className="mono flex-1 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none" />
            <button disabled={!adhoc} onClick={() => launch(adhoc)} className="mono rounded-md border border-[var(--amber)] bg-[var(--amber-low)] px-4 text-[11px] uppercase tracking-[0.2em] text-[var(--amber)] disabled:opacity-30">Connect</button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
