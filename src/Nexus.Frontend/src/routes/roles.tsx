import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Server as ServerIcon, ShieldCheck, Download, Trash2, ShieldAlert, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getRolesClient, installRoleClient, uninstallRoleClient, type WindowsRole } from "@/api/client";

export const Route = createFileRoute("/roles")({
  head: () => ({ meta: [{ title: "Roles & Features — NEXUS" }, { name: "description", content: "Manage Windows Roles and Features." }] }),
  component: RolesPage,
});

function RolesPage() {
  const [server, setServer] = useState("dc");
  const [roles, setRoles] = useState<WindowsRole[]>([]);
  const [q, setQ] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [sortCol, setSortCol] = useState<keyof WindowsRole>("displayName");
  const [sortAsc, setSortAsc] = useState(true);

  const fetchRoles = async () => {
    setIsLoading(true);
    // Instant load from cache
    const cachedData = await getRolesClient(server, false);
    if (cachedData && cachedData.length > 0) {
      setRoles(cachedData);
      setIsLoading(false);
    }
    
    // Background refresh
    const freshData = await getRolesClient(server, true);
    setRoles(freshData);
    setIsLoading(false);
  };

  const handleRefresh = () => {
    setRoles([]);
    fetchRoles();
  };

  useEffect(() => { 
    fetchRoles(); 
  }, [server]);

  const handleInstall = async (role: WindowsRole) => {
    if (!confirm(`Are you sure you want to install ${role.displayName}?`)) return;
    setIsLoading(true);
    const success = await installRoleClient(server, role.name, role.featureType);
    if (success) {
      alert("Installation completed successfully.");
      fetchRoles();
    } else {
      alert("Failed to install. It might require a restart or additional sources.");
    }
    setIsLoading(false);
  };

  const handleUninstall = async (role: WindowsRole) => {
    if (!confirm(`Are you sure you want to remove ${role.displayName}?`)) return;
    setIsLoading(true);
    const success = await uninstallRoleClient(server, role.name, role.featureType);
    if (success) {
      alert("Removal completed successfully.");
      fetchRoles();
    } else {
      alert("Failed to remove. It might require a restart.");
    }
    setIsLoading(false);
  };

  const handleSort = (col: keyof WindowsRole) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const filtered = roles
    .filter((r) => 
      r.displayName.toLowerCase().includes(q.toLowerCase()) || 
      r.name.toLowerCase().includes(q.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortCol].toLowerCase();
      const bVal = b[sortCol].toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

  return (
    <PageWrapper>
      <PageHeader eyebrow="Management" title="Roles & Features" />
      <ServerSelector value={server} onChange={setServer} />

      <div className="mt-4 flex items-center justify-between rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] p-2">
        <div className="flex w-full max-w-sm items-center gap-2 rounded bg-[var(--bg-card)] px-2 py-1.5 shadow-inner border border-[var(--border-dim)]">
          <Search size={14} className="text-[var(--text-sub)]" />
          <input 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="Search roles or features..." 
            className="w-full bg-transparent text-[12px] outline-none placeholder:text-[var(--text-dim)]" 
          />
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={isLoading}
          className="flex items-center gap-2 rounded bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] border border-[var(--border-dim)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mt-4 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[13px] text-[var(--text-sub)]">Loading roles & features...</div>
        ) : roles.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <ShieldAlert size={32} className="text-[var(--text-dim)] mb-3" />
            <div className="text-[14px] font-medium text-[var(--text)]">No roles or features found</div>
            <div className="text-[12px] text-[var(--text-sub)] mt-1 max-w-md">
              Unable to fetch roles. Make sure the server is online and accessible.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="border-b border-[var(--border-dim)] bg-[var(--bg-card)] text-[11px] uppercase tracking-wider text-[var(--text-sub)]">
                <tr>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors select-none" onClick={() => handleSort("displayName")}>
                    <div className="flex items-center gap-1">Display Name {sortCol === "displayName" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors select-none" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">System Name {sortCol === "name" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors select-none" onClick={() => handleSort("featureType")}>
                    <div className="flex items-center gap-1">Type {sortCol === "featureType" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors select-none" onClick={() => handleSort("installState")}>
                    <div className="flex items-center gap-1">Status {sortCol === "installState" && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div>
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-dim)]">
                {filtered.map((role) => (
                  <tr key={role.name} className="group hover:bg-[var(--bg-card)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium">
                        <ShieldCheck size={14} className={role.installState === "Installed" ? "text-[var(--amber)]" : "text-[var(--text-dim)]"} />
                        {role.displayName}
                      </div>
                    </td>
                    <td className="px-4 py-3 mono text-[11px] text-[var(--text-sub)]">
                      {role.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-[var(--bg-card)] px-2 py-0.5 text-[10px] uppercase border border-[var(--border-dim)]">
                        {role.featureType === "Role" ? "Server Role" : "Optional Feature"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {role.installState === "Installed" ? (
                        <span className="text-green-500 font-medium">Installed</span>
                      ) : (
                        <span className="text-[var(--text-sub)]">Available</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        {role.installState === "Installed" ? (
                          <button 
                            onClick={() => handleUninstall(role)} 
                            disabled={isLoading}
                            className="flex items-center gap-1.5 rounded bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleInstall(role)} 
                            disabled={isLoading}
                            className="flex items-center gap-1.5 rounded bg-[var(--amber-low)] border border-[var(--amber)] px-2 py-1 text-[11px] font-medium text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black disabled:opacity-50"
                          >
                            <Download size={12} /> Install
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[12px] text-[var(--text-sub)]">
                      No roles match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
