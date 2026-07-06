import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, AlertTriangle, ChevronDown } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getRegistryKeys, type RegistryKey } from "@/api/mock";

export const Route = createFileRoute("/registry")({
  head: () => ({ meta: [{ title: "Registry — NEXUS" }, { name: "description", content: "Read and edit Windows registry hives." }] }),
  component: RegistryPage,
});

const TREE: Record<string, string[]> = {
  HKEY_LOCAL_MACHINE: ["SOFTWARE","SYSTEM","SECURITY","HARDWARE","SAM"],
  HKEY_CURRENT_USER: ["Control Panel","Environment","Software"],
  HKEY_CLASSES_ROOT: [],
  HKEY_USERS: [],
  HKEY_CURRENT_CONFIG: [],
};

const TYPE_COLOR: Record<string, string> = {
  REG_SZ: "var(--teal)", REG_DWORD: "var(--amber)", REG_BINARY: "var(--text-sub)",
  REG_MULTI_SZ: "var(--ok)", REG_EXPAND_SZ: "var(--warn)",
};

function RegistryPage() {
  const [server, setServer] = useState("nexus01");
  const [path, setPath] = useState("HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion");
  const [values, setValues] = useState<RegistryKey[]>([]);
  const [openHive, setOpenHive] = useState<string | null>("HKEY_LOCAL_MACHINE");

  useEffect(() => { getRegistryKeys(server, path).then(setValues); }, [server, path]);

  return (
    <PageWrapper>
      <PageHeader eyebrow="Infrastructure" title="Registry Editor" />
      <ServerSelector value={server} onChange={setServer} />
      <div className="nx-card mb-4 flex items-center gap-2 border-l-4 border-[var(--warn)] bg-[var(--warn)]/[0.08] p-3 text-[12px] text-[var(--warn)]">
        <AlertTriangle size={14} /> Registry editing can cause system instability. Proceed with caution.
      </div>
      <div className="grid grid-cols-[320px_1fr] gap-5">
        <div className="nx-card p-3">
          <div className="mono pb-2 text-[10px] text-[var(--text-sub)]">{path}</div>
          {Object.entries(TREE).map(([hive, subs]) => {
            const isOpen = openHive === hive;
            return (
              <div key={hive}>
                <button onClick={() => setOpenHive(isOpen ? null : hive)} className="mono flex w-full items-center gap-1.5 rounded px-2 py-1 text-[11px] text-[var(--amber)] hover:bg-[var(--bg-surface)]">
                  {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />} {hive}
                </button>
                {isOpen && subs.map((s) => (
                  <button key={s} onClick={() => setPath(`${hive}\\${s}`)} className="mono ml-5 flex w-full items-center rounded px-2 py-1 text-left text-[11px] text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]">
                    <ChevronRight size={10} /> {s}
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        <div className="nx-card overflow-hidden">
          <table className="w-full text-[12px]">
            <thead><tr className="eyebrow border-b border-[var(--border-c)] text-left">
              <th className="px-4 py-2">Name</th><th>Type</th><th>Data</th>
            </tr></thead>
            <tbody className="mono">
              {values.map((v) => (
                <tr key={v.name} className="border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)]">
                  <td className="px-4 py-1.5 text-[var(--text)]">{v.name}</td>
                  <td style={{ color: TYPE_COLOR[v.type] }}>{v.type}</td>
                  <td className="text-[var(--text-sub)]">{v.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}
