import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState, useMemo } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getUsersClient, getGroupsClient, type LocalUser, type LocalGroup } from "@/api/client";
import { Loader2, Search, ArrowDownAZ, ArrowUpZA, UserCheck, UserX, Users, Shield } from "lucide-react";

export const Route = createFileRoute("/users")({
  head: () => ({ meta: [{ title: "Users & Groups — NEXUS" }, { name: "description", content: "Local users and groups." }] }),
  component: UsersPage,
});

function UsersPage() {
  const [server, setServer] = useState("localhost");
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [groups, setGroups] = useState<LocalGroup[]>([]);
  const [tab, setTab] = useState<"Users"|"Groups">("Users");
  const [expanded, setExpanded] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string>("name");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getUsersClient(server),
      getGroupsClient(server)
    ]).then(([uData, gData]) => {
      setUsers(uData);
      setGroups(gData);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, [server]);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const filteredUsers = useMemo(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u => u.name.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      // @ts-ignore
      const valA = a[sortCol];
      // @ts-ignore
      const valB = b[sortCol];
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return result;
  }, [users, search, sortCol, sortAsc]);

  const filteredGroups = useMemo(() => {
    let result = groups;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(g => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      // @ts-ignore
      const valA = a[sortCol === "name" ? "name" : "description"];
      // @ts-ignore
      const valB = b[sortCol === "name" ? "name" : "description"];
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return result;
  }, [groups, search, sortCol, sortAsc]);

  return (
    <PageWrapper>
      <PageHeader eyebrow="Security" title="Local Users & Groups" />
      <ServerSelector value={server} onChange={setServer} />
      
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 p-1 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg backdrop-blur-md shadow-sm">
          {(["Users","Groups"] as const).map((t) => (
            <button 
              key={t} 
              onClick={() => { setTab(t); setSearch(""); setExpanded(null); setSortCol("name"); setSortAsc(true); }} 
              className={`mono rounded-md px-5 py-2 text-[12px] font-medium transition-all duration-300 flex items-center gap-2 ${tab === t ? "bg-[var(--amber-low)] text-[var(--amber)] shadow-sm" : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)]"}`}
            >
              {t === "Users" ? <Shield className="w-4 h-4"/> : <Users className="w-4 h-4"/>}
              {t}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-sub)]" />
          <input
            type="text"
            placeholder={`Search ${tab.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors text-[var(--text)] placeholder:text-[var(--text-sub)]"
          />
        </div>
      </div>

      {tab === "Users" ? (
        <div className="nx-card overflow-hidden flex flex-col h-[calc(100vh-280px)] backdrop-blur-xl border border-[var(--border-dim)] shadow-xl">
          <div className="overflow-auto flex-1">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-[var(--bg-card)] z-10 backdrop-blur-md">
                <tr className="eyebrow border-b border-[var(--border-c)] text-left">
                  <th className="px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group" onClick={() => toggleSort("name")}>
                    <div className="flex items-center gap-1">Username {sortCol === "name" && (sortAsc ? <ArrowDownAZ className="w-4 h-4"/> : <ArrowUpZA className="w-4 h-4"/>)}</div>
                  </th>
                  <th className="px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group" onClick={() => toggleSort("fullName")}>
                    <div className="flex items-center gap-1">Full Name {sortCol === "fullName" && (sortAsc ? <ArrowDownAZ className="w-4 h-4"/> : <ArrowUpZA className="w-4 h-4"/>)}</div>
                  </th>
                  <th className="px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group" onClick={() => toggleSort("lastLogin")}>
                    <div className="flex items-center gap-1">Last Login {sortCol === "lastLogin" && (sortAsc ? <ArrowDownAZ className="w-4 h-4"/> : <ArrowUpZA className="w-4 h-4"/>)}</div>
                  </th>
                  <th className="px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group" onClick={() => toggleSort("enabled")}>
                    <div className="flex items-center gap-1">Enabled {sortCol === "enabled" && (sortAsc ? <ArrowDownAZ className="w-4 h-4"/> : <ArrowUpZA className="w-4 h-4"/>)}</div>
                  </th>
                  <th className="px-5 py-3">Password</th>
                  <th className="px-5 py-3">Groups</th>
                </tr>
              </thead>
              <tbody className="mono">
                {loading ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-[var(--text-sub)]"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--amber)]" />Fetching users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-[var(--text-sub)]">No users found.</td></tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.name} className="border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] transition-colors duration-200">
                      <td className="px-5 py-4 font-medium text-[var(--amber)] flex items-center gap-2">
                        {u.enabled ? <UserCheck className="w-4 h-4 text-[var(--ok)]"/> : <UserX className="w-4 h-4 text-[var(--critical)]"/>}
                        {u.name}
                      </td>
                      <td className="px-5 py-4 text-[var(--text)]">{u.fullName || "—"}</td>
                      <td className="px-5 py-4 text-[var(--text-sub)]">{u.lastLogin === "—" ? "—" : new Date(u.lastLogin).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold ${u.enabled ? "bg-[var(--ok)]/15 text-[var(--ok)]" : "bg-[var(--critical)]/15 text-[var(--critical)]"}`}>
                          {u.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[var(--text-sub)]">{u.passwordNeverExpires ? "Never expires" : "Standard"}</td>
                      <td className="px-5 py-4 text-[var(--text-sub)] truncate max-w-[200px]" title={u.groups.join(", ")}>{u.groups.join(", ")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-[var(--border-dim)] text-xs text-[var(--text-sub)] bg-[var(--bg-surface)]">
            Total Users: {filteredUsers.length}
          </div>
        </div>
      ) : (
        <div className="nx-card overflow-hidden flex flex-col h-[calc(100vh-280px)] backdrop-blur-xl border border-[var(--border-dim)] shadow-xl">
          <div className="overflow-auto flex-1">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-[var(--bg-card)] z-10 backdrop-blur-md">
                <tr className="eyebrow border-b border-[var(--border-c)] text-left">
                  <th className="px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group" onClick={() => toggleSort("name")}>
                    <div className="flex items-center gap-1">Group {sortCol === "name" && (sortAsc ? <ArrowDownAZ className="w-4 h-4"/> : <ArrowUpZA className="w-4 h-4"/>)}</div>
                  </th>
                  <th className="px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group" onClick={() => toggleSort("description")}>
                    <div className="flex items-center gap-1">Description {sortCol === "description" && (sortAsc ? <ArrowDownAZ className="w-4 h-4"/> : <ArrowUpZA className="w-4 h-4"/>)}</div>
                  </th>
                  <th className="px-5 py-3">Members</th>
                </tr>
              </thead>
              <tbody className="mono">
                {loading ? (
                  <tr><td colSpan={3} className="px-5 py-12 text-center text-[var(--text-sub)]"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--amber)]" />Fetching groups...</td></tr>
                ) : filteredGroups.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-12 text-center text-[var(--text-sub)]">No groups found.</td></tr>
                ) : (
                  filteredGroups.map((g) => (
                    <Fragment key={g.name}>
                      <tr 
                        onClick={() => setExpanded(expanded === g.name ? null : g.name)} 
                        className={`cursor-pointer border-b border-[var(--border-dim)] transition-colors duration-200 ${expanded === g.name ? "bg-[var(--bg-surface)]" : "hover:bg-[var(--bg-surface)]"}`}
                      >
                        <td className="px-5 py-4 font-medium text-[var(--amber)] flex items-center gap-2">
                          <Users className="w-4 h-4"/> {g.name}
                        </td>
                        <td className="px-5 py-4 text-[var(--text-sub)]">{g.description || "—"}</td>
                        <td className="px-5 py-4">
                          <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-[var(--border-dim)] text-[var(--text)]">
                            {g.members.length} {g.members.length === 1 ? 'member' : 'members'}
                          </span>
                        </td>
                      </tr>
                      {expanded === g.name && (
                        <tr>
                          <td colSpan={3} className="border-b border-[var(--border-dim)] bg-[var(--bg-card)] px-5 py-0">
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-[var(--bg-surface)] p-6 m-4 rounded-xl border border-[var(--border-dim)] shadow-inner">
                              <h4 className="eyebrow mb-3 text-[var(--text-sub)]">Group Members</h4>
                              {g.members.length === 0 ? (
                                <p className="text-[12px] text-[var(--text-sub)] italic">No members in this group.</p>
                              ) : (
                                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {g.members.map((m) => (
                                    <li key={m} className="flex items-center gap-2 text-[12px] text-[var(--text)] bg-[var(--bg-card)] px-3 py-2 rounded-md border border-[var(--border-dim)]">
                                      <Shield className="w-3 h-3 text-[var(--amber)] opacity-70"/> {m}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-[var(--border-dim)] text-xs text-[var(--text-sub)] bg-[var(--bg-surface)]">
            Total Groups: {filteredGroups.length}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
