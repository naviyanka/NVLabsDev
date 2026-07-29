import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState, useMemo } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { 
  getUsersClient, 
  getGroupsClient, 
  createUserClient, 
  deleteUserClient, 
  setUserStatusClient,
  setUserLockoutClient,
  resetUserPasswordClient,
  updateUserGroupsClient,
  createGroupClient,
  deleteGroupClient,
  updateGroupMembersClient,
  type LocalUser, 
  type LocalGroup 
} from "@/api/client";
import { 
  Loader2, 
  Search, 
  ArrowDownAZ, 
  ArrowUpZA, 
  UserCheck, 
  UserX, 
  Users, 
  Shield, 
  Plus, 
  Trash2, 
  UserPlus, 
  X, 
  Lock, 
  Unlock, 
  Key, 
  ShieldAlert, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  RefreshCw,
  FolderPlus,
  Info,
  ShieldCheck,
  UserCog
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/users")({
  head: () => ({ meta: [{ title: "Users & Groups — NEXUS" }, { name: "description", content: "Manage local security accounts, privileges, groups, and audit logs." }] }),
  component: UsersPage,
});

type FilterStatus = "all" | "enabled" | "disabled" | "admins" | "locked";

function UsersPage() {
  const [server, setServer] = useState("127.0.0.1");
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [groups, setGroups] = useState<LocalGroup[]>([]);
  const [activeTab, setActiveTab] = useState<"Users" | "Groups" | "Audit">("Users");
  
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [sortCol, setSortCol] = useState<string>("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Modals & Drawers state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [inspectUser, setInspectUser] = useState<LocalUser | null>(null);
  const [resetPassUser, setResetPassUser] = useState<LocalUser | null>(null);
  const [editGroupsUser, setEditGroupsUser] = useState<LocalUser | null>(null);
  const [manageGroupMembers, setManageGroupMembers] = useState<LocalGroup | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getUsersClient(server),
      getGroupsClient(server)
    ]).then(([uData, gData]) => {
      setUsers(uData);
      setGroups(gData);
      // Update active inspectUser if modified
      if (inspectUser) {
        const updated = uData.find(u => u.name === inspectUser.name);
        if (updated) setInspectUser(updated);
      }
    }).catch(err => {
      console.error(err);
      toast.error("Failed to load user and group security data");
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [server]);

  // User Actions
  const handleToggleUserStatus = async (username: string, currentEnabled: boolean) => {
    const nextStatus = !currentEnabled;
    try {
      const ok = await setUserStatusClient(server, username, nextStatus);
      if (ok) {
        toast.success(`Account "${username}" ${nextStatus ? "enabled" : "disabled"}`);
        loadData();
      } else {
        toast.error(`Failed to update account status for "${username}"`);
      }
    } catch (e) {
      toast.error("Operation failed");
    }
  };

  const handleToggleLockout = async (username: string, currentLocked: boolean) => {
    try {
      const ok = await setUserLockoutClient(server, username, !currentLocked);
      if (ok) {
        toast.success(`Account "${username}" ${!currentLocked ? "locked out" : "unlocked"}`);
        loadData();
      } else {
        toast.error("Failed to change lockout state");
      }
    } catch (e) {
      toast.error("Lockout action failed");
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${username}"?`)) return;
    try {
      const ok = await deleteUserClient(server, username);
      if (ok) {
        toast.success(`User "${username}" deleted`);
        if (inspectUser?.name === username) setInspectUser(null);
        loadData();
      } else {
        toast.error(`Failed to delete user "${username}"`);
      }
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const handleDeleteGroup = async (groupName: string, isSystemGroup?: boolean) => {
    if (isSystemGroup) {
      toast.error(`Cannot delete built-in system group "${groupName}"`);
      return;
    }
    if (!confirm(`Are you sure you want to delete group "${groupName}"?`)) return;
    try {
      const ok = await deleteGroupClient(server, groupName);
      if (ok) {
        toast.success(`Group "${groupName}" deleted`);
        loadData();
      } else {
        toast.error(`Failed to delete group "${groupName}"`);
      }
    } catch (e) {
      toast.error("Group delete failed");
    }
  };

  const handleExportDirectory = () => {
    const data = {
      server,
      exportedAt: new Date().toISOString(),
      usersCount: users.length,
      groupsCount: groups.length,
      users,
      groups
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NEXUS_UserDirectory_${server}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("User directory report exported successfully");
  };

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Status filter
    if (statusFilter === "enabled") result = result.filter(u => u.enabled);
    else if (statusFilter === "disabled") result = result.filter(u => !u.enabled);
    else if (statusFilter === "admins") result = result.filter(u => u.groups.includes("Administrators"));
    else if (statusFilter === "locked") result = result.filter(u => u.accountLockedOut);

    // Search query
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.fullName.toLowerCase().includes(q) ||
        u.description.toLowerCase().includes(q) ||
        u.groups.some(g => g.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      // @ts-ignore
      const valA = a[sortCol] ?? "";
      // @ts-ignore
      const valB = b[sortCol] ?? "";
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, search, statusFilter, sortCol, sortAsc]);

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    let result = [...groups];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(g => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      const valA = a.name.toLowerCase();
      const valB = b.name.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return result;
  }, [groups, search, sortAsc]);

  // Summary Metrics
  const totalUsers = users.length;
  const enabledCount = users.filter(u => u.enabled).length;
  const disabledCount = users.filter(u => !u.enabled).length;
  const adminCount = users.filter(u => u.groups.includes("Administrators")).length;
  const lockedCount = users.filter(u => u.accountLockedOut).length;

  return (
    <PageWrapper>
      <PageHeader eyebrow="Security & Access Management" title="Local Users, Groups & Privileges" />
      <ServerSelector value={server} onChange={setServer} />

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="nx-card p-4 flex items-center gap-4 border border-[var(--border-dim)] bg-[var(--bg-card)]">
          <div className="p-3 rounded-xl bg-[var(--amber-low)] text-[var(--amber)]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="eyebrow text-[var(--text-sub)]">Total Local Accounts</div>
            <div className="text-2xl font-bold text-[var(--text)]">{totalUsers}</div>
            <div className="text-[11px] text-[var(--text-sub)] mt-0.5">
              <span className="text-[var(--ok)] font-medium">{enabledCount} Active</span> • <span className="text-[var(--text-sub)]">{disabledCount} Disabled</span>
            </div>
          </div>
        </div>

        <div className="nx-card p-4 flex items-center gap-4 border border-[var(--border-dim)] bg-[var(--bg-card)]">
          <div className="p-3 rounded-xl bg-[var(--crit)]/15 text-[var(--crit)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="eyebrow text-[var(--text-sub)]">Privileged Accounts</div>
            <div className="text-2xl font-bold text-[var(--text)]">{adminCount}</div>
            <div className="text-[11px] text-[var(--text-sub)] mt-0.5 font-medium text-[var(--crit)]">
              Administrators Group Members
            </div>
          </div>
        </div>

        <div className="nx-card p-4 flex items-center gap-4 border border-[var(--border-dim)] bg-[var(--bg-card)]">
          <div className={`p-3 rounded-xl ${lockedCount > 0 ? "bg-[var(--crit)]/15 text-[var(--crit)]" : "bg-[var(--ok)]/15 text-[var(--ok)]"}`}>
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="eyebrow text-[var(--text-sub)]">Account Lockouts</div>
            <div className="text-2xl font-bold text-[var(--text)]">{lockedCount}</div>
            <div className="text-[11px] text-[var(--text-sub)] mt-0.5">
              {lockedCount > 0 ? <span className="text-[var(--crit)] font-semibold">Requires admin unlock</span> : "All accounts healthy"}
            </div>
          </div>
        </div>

        <div className="nx-card p-4 flex items-center gap-4 border border-[var(--border-dim)] bg-[var(--bg-card)]">
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] text-[var(--amber)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="eyebrow text-[var(--text-sub)]">Security Groups</div>
            <div className="text-2xl font-bold text-[var(--text)]">{groups.length}</div>
            <div className="text-[11px] text-[var(--text-sub)] mt-0.5">
              Role-based access control
            </div>
          </div>
        </div>
      </div>

      {/* Main Control Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-xl backdrop-blur-md shadow-sm">
          {(["Users", "Groups", "Audit"] as const).map((t) => (
            <button 
              key={t} 
              onClick={() => { setActiveTab(t); setSearch(""); setSortCol("name"); setSortAsc(true); }} 
              className={`mono rounded-lg px-5 py-2 text-[12px] font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === t ? "bg-[var(--amber-low)] text-[var(--amber)] shadow-sm" : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)]"}`}
            >
              {t === "Users" && <Shield className="w-4 h-4"/>}
              {t === "Groups" && <Users className="w-4 h-4"/>}
              {t === "Audit" && <FileText className="w-4 h-4"/>}
              {t === "Users" ? "Local Users" : t === "Groups" ? "Security Groups" : "Security Audit Log"}
            </button>
          ))}
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Filters for Users tab */}
          {activeTab === "Users" && (
            <div className="flex items-center gap-1 p-1 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg text-[11px] mono">
              {(["all", "enabled", "disabled", "admins", "locked"] as FilterStatus[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-md capitalize transition-colors ${statusFilter === f ? "bg-[var(--amber)] text-black font-bold" : "text-[var(--text-sub)] hover:text-[var(--text)]"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-sub)]" />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 sm:w-64 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[var(--amber)] transition-colors text-[var(--text)] placeholder:text-[var(--text-sub)]"
            />
          </div>

          <button
            onClick={loadData}
            title="Refresh User Store"
            className="p-2.5 rounded-lg border border-[var(--border-dim)] bg-[var(--bg-card)] text-[var(--text-sub)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleExportDirectory}
            title="Export User Directory report"
            className="flex items-center gap-2 rounded-lg border border-[var(--border-dim)] bg-[var(--bg-card)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--amber)] transition-colors shadow-sm"
          >
            <Download size={14} /> Export
          </button>

          {activeTab === "Users" && (
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-[var(--amber)] text-black px-4 py-2 text-xs font-bold hover:bg-[var(--amber-hover)] transition-colors shadow-sm"
            >
              <UserPlus size={15} /> Add User
            </button>
          )}

          {activeTab === "Groups" && (
            <button
              onClick={() => setIsAddGroupOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-[var(--amber)] text-black px-4 py-2 text-xs font-bold hover:bg-[var(--amber-hover)] transition-colors shadow-sm"
            >
              <FolderPlus size={15} /> Create Group
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "Users" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Users Table */}
          <div className={`${inspectUser ? "lg:col-span-8" : "lg:col-span-12"} transition-all duration-300`}>
            <div className="nx-card overflow-hidden flex flex-col h-[calc(100vh-320px)] min-h-[450px] backdrop-blur-xl border border-[var(--border-dim)] shadow-xl">
              <div className="overflow-auto flex-1">
                <table className="w-full text-[13px]">
                  <thead className="sticky top-0 bg-[var(--bg-card)] z-10 backdrop-blur-md">
                    <tr className="eyebrow border-b border-[var(--border-c)] text-left">
                      <th className="px-4 py-3 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => toggleSort("name")}>
                        <div className="flex items-center gap-1">Username {sortCol === "name" && (sortAsc ? <ArrowDownAZ className="w-3.5 h-3.5"/> : <ArrowUpZA className="w-3.5 h-3.5"/>)}</div>
                      </th>
                      <th className="px-4 py-3 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => toggleSort("fullName")}>
                        <div className="flex items-center gap-1">Full Name {sortCol === "fullName" && (sortAsc ? <ArrowDownAZ className="w-3.5 h-3.5"/> : <ArrowUpZA className="w-3.5 h-3.5"/>)}</div>
                      </th>
                      <th className="px-4 py-3 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => toggleSort("enabled")}>
                        <div className="flex items-center gap-1">Status {sortCol === "enabled" && (sortAsc ? <ArrowDownAZ className="w-3.5 h-3.5"/> : <ArrowUpZA className="w-3.5 h-3.5"/>)}</div>
                      </th>
                      <th className="px-4 py-3">Groups</th>
                      <th className="px-4 py-3 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => toggleSort("lastLogin")}>
                        <div className="flex items-center gap-1">Last Login {sortCol === "lastLogin" && (sortAsc ? <ArrowDownAZ className="w-3.5 h-3.5"/> : <ArrowUpZA className="w-3.5 h-3.5"/>)}</div>
                      </th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="mono">
                    {loading ? (
                      <tr><td colSpan={6} className="px-5 py-12 text-center text-[var(--text-sub)]"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--amber)]" />Fetching local users store...</td></tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-12 text-center text-[var(--text-sub)]">No local users match the current search or status filter.</td></tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isAdmin = u.groups.includes("Administrators");
                        const isSelected = inspectUser?.name === u.name;

                        return (
                          <tr 
                            key={u.name} 
                            className={`border-b border-[var(--border-dim)] transition-colors duration-200 cursor-pointer ${isSelected ? "bg-[var(--amber-low)]/20 border-l-4 border-l-[var(--amber)]" : "hover:bg-[var(--bg-surface)]"}`}
                            onClick={() => setInspectUser(u)}
                          >
                            <td className="px-4 py-3.5 font-medium text-[var(--amber)] flex items-center gap-2">
                              {u.accountLockedOut ? (
                                <Lock className="w-4 h-4 text-[var(--crit)] shrink-0" title="Account Locked Out" />
                              ) : u.enabled ? (
                                <UserCheck className="w-4 h-4 text-[var(--ok)] shrink-0" />
                              ) : (
                                <UserX className="w-4 h-4 text-[var(--text-sub)] shrink-0" />
                              )}
                              <span className="font-semibold">{u.name}</span>
                              {isAdmin && (
                                <span className="bg-[var(--crit)]/15 text-[var(--crit)] text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" title="Member of Administrators">
                                  Admin
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-[var(--text)]">
                              <div className="truncate max-w-[180px]" title={u.fullName}>{u.fullName || "—"}</div>
                              <div className="text-[10px] text-[var(--text-sub)] truncate max-w-[180px]" title={u.description}>{u.description}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              {u.accountLockedOut ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-[var(--crit)]/20 text-[var(--crit)] flex items-center gap-1 w-fit">
                                  <AlertTriangle size={10} /> Locked Out
                                </span>
                              ) : u.enabled ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-[var(--ok)]/15 text-[var(--ok)]">
                                  Enabled
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-[var(--border-dim)] text-[var(--text-sub)]">
                                  Disabled
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-[var(--text-sub)]">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {u.groups.map(g => (
                                  <span key={g} className={`text-[10px] px-2 py-0.5 rounded ${g === "Administrators" ? "bg-[var(--crit)]/10 text-[var(--crit)] font-semibold" : "bg-[var(--bg-surface)] text-[var(--text)] border border-[var(--border-dim)]"}`}>
                                    {g}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-[var(--text-sub)] text-[11px]">
                              {u.lastLogin === "—" ? "Never logged on" : new Date(u.lastLogin).toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleToggleUserStatus(u.name, u.enabled)}
                                  className={`p-1.5 rounded-lg border transition-colors ${u.enabled ? "border-[var(--border-dim)] text-[var(--ok)] hover:bg-[var(--crit)]/10 hover:text-[var(--crit)]" : "border-[var(--border-dim)] text-[var(--text-sub)] hover:bg-[var(--ok)]/10 hover:text-[var(--ok)]"}`}
                                  title={u.enabled ? "Disable User Account" : "Enable User Account"}
                                >
                                  {u.enabled ? <UserX size={14} /> : <UserCheck size={14} />}
                                </button>

                                <button
                                  onClick={() => setResetPassUser(u)}
                                  className="p-1.5 rounded-lg border border-[var(--border-dim)] bg-[var(--bg-void)] text-[var(--text-sub)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors"
                                  title="Reset Password"
                                >
                                  <Key size={14} />
                                </button>

                                <button
                                  onClick={() => setEditGroupsUser(u)}
                                  className="p-1.5 rounded-lg border border-[var(--border-dim)] bg-[var(--bg-void)] text-[var(--text-sub)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors"
                                  title="Manage Group Memberships"
                                >
                                  <Users size={14} />
                                </button>

                                <button
                                  onClick={() => handleDeleteUser(u.name)}
                                  className="p-1.5 rounded-lg border border-[var(--border-dim)] bg-[var(--bg-void)] text-[var(--text-sub)] hover:border-[var(--crit)]/50 hover:bg-[var(--crit)]/10 hover:text-[var(--crit)] transition-colors"
                                  title="Delete User"
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
              <div className="p-3 border-t border-[var(--border-dim)] text-xs text-[var(--text-sub)] bg-[var(--bg-surface)] flex justify-between items-center">
                <div>Showing {filteredUsers.length} of {users.length} users</div>
                <div className="text-[11px] italic">Click any user row for details & policy settings</div>
              </div>
            </div>
          </div>

          {/* User Inspector Side Drawer */}
          {inspectUser && (
            <div className="lg:col-span-4 transition-all duration-300">
              <div className="nx-card p-5 border border-[var(--border-dim)] bg-[var(--bg-card)] h-[calc(100vh-320px)] min-h-[450px] overflow-auto flex flex-col justify-between shadow-2xl">
                <div>
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between border-b border-[var(--border-dim)] pb-4 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-[var(--amber-low)] text-[var(--amber)]">
                        <UserCog size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[var(--text)]">{inspectUser.name}</h3>
                        <p className="text-[11px] text-[var(--text-sub)]">{inspectUser.fullName || "Local User Account"}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setInspectUser(null)} 
                      className="p-1 rounded-lg text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)]"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Account Security Banner */}
                  <div className="mb-4 p-3 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-surface)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-sub)]">Account State:</span>
                      <span className={`font-bold ${inspectUser.enabled ? "text-[var(--ok)]" : "text-[var(--crit)]"}`}>
                        {inspectUser.enabled ? "Enabled (Active)" : "Disabled"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-sub)]">Lockout Status:</span>
                      <span className={`font-bold ${inspectUser.accountLockedOut ? "text-[var(--crit)]" : "text-[var(--text)]"}`}>
                        {inspectUser.accountLockedOut ? "Locked Out (5 Failed Logins)" : "Unlocked"}
                      </span>
                    </div>

                    {inspectUser.accountLockedOut && (
                      <button
                        onClick={() => handleToggleLockout(inspectUser.name, true)}
                        className="w-full mt-2 py-1.5 px-3 rounded-lg bg-[var(--crit)]/15 text-[var(--crit)] font-semibold text-xs border border-[var(--crit)]/30 hover:bg-[var(--crit)]/25 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Unlock size={14} /> Unlock User Account
                      </button>
                    )}
                  </div>

                  {/* Detail Grid */}
                  <div className="space-y-3 text-xs mono mb-5">
                    <div>
                      <span className="text-[var(--text-sub)] block text-[10px] uppercase font-bold tracking-wider mb-0.5">Description</span>
                      <p className="text-[var(--text)] bg-[var(--bg-void)] p-2 rounded-lg border border-[var(--border-dim)]">
                        {inspectUser.description || "No description provided."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-[var(--bg-void)] border border-[var(--border-dim)]">
                        <span className="text-[var(--text-sub)] text-[10px] block font-bold uppercase">Password Last Set</span>
                        <span className="text-[var(--text)]">{inspectUser.passwordLastSet || "—"}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--bg-void)] border border-[var(--border-dim)]">
                        <span className="text-[var(--text-sub)] text-[10px] block font-bold uppercase">Password Policy</span>
                        <span className="text-[var(--amber)] font-medium">
                          {inspectUser.passwordNeverExpires ? "Never Expires" : "Expires in 90 Days"}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[var(--bg-void)] border border-[var(--border-dim)]">
                      <span className="text-[var(--text-sub)] text-[10px] block font-bold uppercase">Security Identifier (SID)</span>
                      <span className="text-[10px] text-[var(--text)] break-all font-mono">{inspectUser.sid || "S-1-5-21-3623811015-3361044348-30300820-500"}</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[var(--text-sub)] text-[10px] uppercase font-bold tracking-wider">Group Memberships ({inspectUser.groups.length})</span>
                        <button 
                          onClick={() => setEditGroupsUser(inspectUser)} 
                          className="text-[10px] text-[var(--amber)] hover:underline flex items-center gap-1"
                        >
                          <Plus size={12} /> Manage
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {inspectUser.groups.map(g => (
                          <span key={g} className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] text-[var(--text)] border border-[var(--border-dim)] font-medium flex items-center gap-1">
                            <Shield size={10} className="text-[var(--amber)]" /> {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Quick Actions */}
                <div className="pt-3 border-t border-[var(--border-dim)] flex gap-2">
                  <button
                    onClick={() => setResetPassUser(inspectUser)}
                    className="flex-1 py-2 rounded-xl bg-[var(--amber)] text-black text-xs font-bold hover:bg-[var(--amber-hover)] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Key size={14} /> Reset Password
                  </button>
                  <button
                    onClick={() => handleToggleUserStatus(inspectUser.name, inspectUser.enabled)}
                    className="py-2 px-3 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text)] hover:border-[var(--amber)] transition-colors"
                  >
                    {inspectUser.enabled ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === "Groups" && (
        <div className="nx-card overflow-hidden flex flex-col h-[calc(100vh-320px)] min-h-[450px] backdrop-blur-xl border border-[var(--border-dim)] shadow-xl">
          <div className="overflow-auto flex-1">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-[var(--bg-card)] z-10 backdrop-blur-md">
                <tr className="eyebrow border-b border-[var(--border-c)] text-left">
                  <th className="px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors" onClick={() => toggleSort("name")}>
                    <div className="flex items-center gap-1">Group Name {sortCol === "name" && (sortAsc ? <ArrowDownAZ className="w-3.5 h-3.5"/> : <ArrowUpZA className="w-3.5 h-3.5"/>)}</div>
                  </th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Members ({groups.reduce((acc, g) => acc + g.members.length, 0)})</th>
                  <th className="px-5 py-3">Group SID</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="mono">
                {loading ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-[var(--text-sub)]"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--amber)]" />Fetching security groups...</td></tr>
                ) : filteredGroups.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-[var(--text-sub)]">No groups found.</td></tr>
                ) : (
                  filteredGroups.map((g) => (
                    <tr key={g.name} className="border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] transition-colors duration-200">
                      <td className="px-5 py-4 font-medium text-[var(--amber)] flex items-center gap-2">
                        <Users className="w-4 h-4 text-[var(--amber)]"/> 
                        <span className="font-bold">{g.name}</span>
                        {g.isSystemGroup && (
                          <span className="bg-[var(--border-dim)] text-[var(--text-sub)] text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">Built-in</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[var(--text-sub)] max-w-[300px] truncate" title={g.description}>{g.description || "—"}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--amber-low)] text-[var(--amber)]">
                            {g.members.length} {g.members.length === 1 ? 'member' : 'members'}
                          </span>
                          <span className="text-[11px] text-[var(--text-sub)] truncate max-w-[180px]" title={g.members.join(", ")}>
                            ({g.members.slice(0, 3).join(", ")}{g.members.length > 3 ? "..." : ""})
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[11px] text-[var(--text-sub)] font-mono">{g.sid || "S-1-5-32-500"}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setManageGroupMembers(g)}
                            className="px-3 py-1.5 rounded-lg border border-[var(--border-dim)] bg-[var(--bg-card)] text-[var(--amber)] text-xs font-semibold hover:border-[var(--amber)] transition-colors flex items-center gap-1.5"
                          >
                            <Users size={13} /> Edit Members
                          </button>
                          {!g.isSystemGroup && (
                            <button
                              onClick={() => handleDeleteGroup(g.name, g.isSystemGroup)}
                              className="p-1.5 rounded-lg border border-[var(--border-dim)] bg-[var(--bg-void)] text-[var(--text-sub)] hover:border-[var(--crit)]/50 hover:bg-[var(--crit)]/10 hover:text-[var(--crit)] transition-colors"
                              title="Delete Group"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-[var(--border-dim)] text-xs text-[var(--text-sub)] bg-[var(--bg-surface)]">
            Total Local Security Groups: {filteredGroups.length}
          </div>
        </div>
      )}

      {/* Security Audit Log Tab */}
      {activeTab === "Audit" && (
        <SecurityAuditLogView server={server} users={users} />
      )}

      {/* MODALS */}
      {isAddUserOpen && (
        <CreateUserModal
          server={server}
          availableGroups={groups.map(g => g.name)}
          onClose={() => setIsAddUserOpen(false)}
          onCreated={() => {
            setIsAddUserOpen(false);
            loadData();
          }}
        />
      )}

      {isAddGroupOpen && (
        <CreateGroupModal
          server={server}
          availableUsers={users.map(u => u.name)}
          onClose={() => setIsAddGroupOpen(false)}
          onCreated={() => {
            setIsAddGroupOpen(false);
            loadData();
          }}
        />
      )}

      {resetPassUser && (
        <ResetPasswordModal
          server={server}
          user={resetPassUser}
          onClose={() => setResetPassUser(null)}
          onSuccess={() => {
            setResetPassUser(null);
            loadData();
          }}
        />
      )}

      {editGroupsUser && (
        <EditGroupsModal
          server={server}
          user={editGroupsUser}
          allGroups={groups.map(g => g.name)}
          onClose={() => setEditGroupsUser(null)}
          onSuccess={() => {
            setEditGroupsUser(null);
            loadData();
          }}
        />
      )}

      {manageGroupMembers && (
        <ManageGroupMembersModal
          server={server}
          group={manageGroupMembers}
          allUsers={users.map(u => u.name)}
          onClose={() => setManageGroupMembers(null)}
          onSuccess={() => {
            setManageGroupMembers(null);
            loadData();
          }}
        />
      )}
    </PageWrapper>
  );
}

{/* CREATE USER MODAL */}
function CreateUserModal({ 
  server, 
  availableGroups, 
  onClose, 
  onCreated 
}: { 
  server: string; 
  availableGroups: string[]; 
  onClose: () => void; 
  onCreated: () => void 
}) {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>(["Users"]);
  const [enabled, setEnabled] = useState(true);
  const [passwordNeverExpires, setPasswordNeverExpires] = useState(false);
  const [userCannotChangePassword, setUserCannotChangePassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleGroupSelection = (gName: string) => {
    if (selectedGroups.includes(gName)) {
      setSelectedGroups(selectedGroups.filter(g => g !== gName));
    } else {
      setSelectedGroups([...selectedGroups, gName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("Username is required");
    
    setSubmitting(true);
    try {
      const ok = await createUserClient(server, { 
        name: username.trim(), 
        fullName: fullName.trim(), 
        description: description.trim(),
        password, 
        groups: selectedGroups,
        enabled,
        passwordNeverExpires,
        userCannotChangePassword
      });
      if (ok) {
        toast.success(`User "${username}" created successfully`);
        onCreated();
      } else {
        toast.error("Failed to create user (username may already exist)");
      }
    } catch (e) {
      toast.error("User creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2.5">
            <UserPlus size={18} className="text-[var(--amber)]" />
            <h3 className="text-base font-bold text-[var(--text)]">Create Local User Account</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1">Username *</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jsmith"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Systems Engineer - Infrastructure Dept"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1">Initial Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set strong account password"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-2">Group Memberships</label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-[var(--border-dim)] rounded-xl bg-[var(--bg-void)]">
              {availableGroups.map((g) => {
                const checked = selectedGroups.includes(g);
                return (
                  <label key={g} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-[11px] ${checked ? "bg-[var(--amber-low)]/20 text-[var(--amber)] font-bold" : "text-[var(--text)] hover:bg-[var(--bg-surface)]"}`}>
                    <input 
                      type="checkbox" 
                      checked={checked} 
                      onChange={() => toggleGroupSelection(g)} 
                      className="accent-[var(--amber)]"
                    />
                    {g}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Flags */}
          <div className="space-y-2 pt-2 border-t border-[var(--border-dim)]">
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-[var(--text)]">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="accent-[var(--amber)]" />
              Account is enabled
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-[var(--text)]">
              <input type="checkbox" checked={passwordNeverExpires} onChange={(e) => setPasswordNeverExpires(e.target.checked)} className="accent-[var(--amber)]" />
              Password never expires
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-[var(--text)]">
              <input type="checkbox" checked={userCannotChangePassword} onChange={(e) => setUserCannotChangePassword(e.target.checked)} className="accent-[var(--amber)]" />
              User cannot change password
            </label>
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}

{/* CREATE GROUP MODAL */}
function CreateGroupModal({
  server,
  availableUsers,
  onClose,
  onCreated
}: {
  server: string;
  availableUsers: string[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleMember = (u: string) => {
    if (selectedMembers.includes(u)) {
      setSelectedMembers(selectedMembers.filter(m => m !== u));
    } else {
      setSelectedMembers([...selectedMembers, u]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return toast.error("Group name is required");

    setSubmitting(true);
    try {
      const ok = await createGroupClient(server, {
        name: groupName.trim(),
        description: description.trim(),
        members: selectedMembers
      });
      if (ok) {
        toast.success(`Group "${groupName}" created successfully`);
        onCreated();
      } else {
        toast.error("Failed to create group");
      }
    } catch (e) {
      toast.error("Group creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <FolderPlus size={18} className="text-[var(--amber)]" />
            <h3 className="text-base font-bold text-[var(--text)]">Create Security Group</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1">Group Name *</label>
            <input
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Database Administrators"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Granted full access to production database engines"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-2">Initial Members ({selectedMembers.length})</label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-[var(--border-dim)] rounded-xl bg-[var(--bg-void)]">
              {availableUsers.map((u) => {
                const checked = selectedMembers.includes(u);
                return (
                  <label key={u} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-[11px] ${checked ? "bg-[var(--amber-low)]/20 text-[var(--amber)] font-bold" : "text-[var(--text)] hover:bg-[var(--bg-surface)]"}`}>
                    <input 
                      type="checkbox" 
                      checked={checked} 
                      onChange={() => toggleMember(u)} 
                      className="accent-[var(--amber)]"
                    />
                    {u}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Creating..." : "Create Group"}
          </button>
        </div>
      </form>
    </div>
  );
}

{/* RESET PASSWORD MODAL */}
function ResetPasswordModal({
  server,
  user,
  onClose,
  onSuccess
}: {
  server: string;
  user: LocalUser;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordNeverExpires, setPasswordNeverExpires] = useState(user.passwordNeverExpires);
  const [userCannotChangePassword, setUserCannotChangePassword] = useState(user.userCannotChangePassword || false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setSubmitting(true);
    try {
      const ok = await resetUserPasswordClient(server, user.name, {
        password,
        passwordNeverExpires,
        userCannotChangePassword
      });
      if (ok) {
        toast.success(`Password updated for "${user.name}"`);
        onSuccess();
      } else {
        toast.error("Failed to reset password");
      }
    } catch (e) {
      toast.error("Password reset error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-[var(--amber)]" />
            <h3 className="text-base font-bold text-[var(--text)]">Reset Password — {user.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-[var(--border-dim)]">
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-[var(--text)]">
              <input type="checkbox" checked={passwordNeverExpires} onChange={(e) => setPasswordNeverExpires(e.target.checked)} className="accent-[var(--amber)]" />
              Password never expires
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-[var(--text)]">
              <input type="checkbox" checked={userCannotChangePassword} onChange={(e) => setUserCannotChangePassword(e.target.checked)} className="accent-[var(--amber)]" />
              User cannot change password
            </label>
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Updating..." : "Set Password"}
          </button>
        </div>
      </form>
    </div>
  );
}

{/* EDIT USER GROUPS MODAL */}
function EditGroupsModal({
  server,
  user,
  allGroups,
  onClose,
  onSuccess
}: {
  server: string;
  user: LocalUser;
  allGroups: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedGroups, setSelectedGroups] = useState<string[]>(user.groups || []);
  const [submitting, setSubmitting] = useState(false);

  const toggleGroup = (g: string) => {
    if (selectedGroups.includes(g)) {
      setSelectedGroups(selectedGroups.filter(x => x !== g));
    } else {
      setSelectedGroups([...selectedGroups, g]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await updateUserGroupsClient(server, user.name, selectedGroups);
      if (ok) {
        toast.success(`Group memberships updated for "${user.name}"`);
        onSuccess();
      } else {
        toast.error("Failed to update groups");
      }
    } catch (e) {
      toast.error("Group update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[var(--amber)]" />
            <h3 className="text-base font-bold text-[var(--text)]">Manage Groups — {user.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 text-xs">
          <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-2">
            Select Security Groups ({selectedGroups.length})
          </label>
          <div className="space-y-1.5 max-h-60 overflow-y-auto p-2 border border-[var(--border-dim)] rounded-xl bg-[var(--bg-void)]">
            {allGroups.map((g) => {
              const checked = selectedGroups.includes(g);
              return (
                <label key={g} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors text-xs ${checked ? "bg-[var(--amber-low)]/20 text-[var(--amber)] font-bold border border-[var(--amber)]/30" : "text-[var(--text)] hover:bg-[var(--bg-surface)]"}`}>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={checked} 
                      onChange={() => toggleGroup(g)} 
                      className="accent-[var(--amber)]"
                    />
                    <span>{g}</span>
                  </div>
                  {g === "Administrators" && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--crit)]/15 text-[var(--crit)] font-bold">Privileged</span>}
                </label>
              );
            })}
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Saving..." : "Save Groups"}
          </button>
        </div>
      </form>
    </div>
  );
}

{/* MANAGE GROUP MEMBERS MODAL */}
function ManageGroupMembersModal({
  server,
  group,
  allUsers,
  onClose,
  onSuccess
}: {
  server: string;
  group: LocalGroup;
  allUsers: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [members, setMembers] = useState<string[]>(group.members || []);
  const [submitting, setSubmitting] = useState(false);

  const toggleUser = (u: string) => {
    if (members.includes(u)) {
      setMembers(members.filter(m => m !== u));
    } else {
      setMembers([...members, u]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await updateGroupMembersClient(server, group.name, members);
      if (ok) {
        toast.success(`Members updated for group "${group.name}"`);
        onSuccess();
      } else {
        toast.error("Failed to update group members");
      }
    } catch (e) {
      toast.error("Group members update error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[var(--amber)]" />
            <h3 className="text-base font-bold text-[var(--text)]">Edit Members — {group.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 text-xs">
          <label className="block font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-2">
            Group Members ({members.length})
          </label>
          <div className="space-y-1.5 max-h-60 overflow-y-auto p-2 border border-[var(--border-dim)] rounded-xl bg-[var(--bg-void)]">
            {allUsers.map((u) => {
              const checked = members.includes(u);
              return (
                <label key={u} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors text-xs ${checked ? "bg-[var(--amber-low)]/20 text-[var(--amber)] font-bold border border-[var(--amber)]/30" : "text-[var(--text)] hover:bg-[var(--bg-surface)]"}`}>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={checked} 
                      onChange={() => toggleUser(u)} 
                      className="accent-[var(--amber)]"
                    />
                    <span>{u}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Saving..." : "Save Members"}
          </button>
        </div>
      </form>
    </div>
  );
}

{/* SECURITY AUDIT LOG VIEW */}
function SecurityAuditLogView({ server, users }: { server: string; users: LocalUser[] }) {
  const auditLogs = useMemo(() => {
    const logs = [
      { id: "aud-101", time: "2026-07-26 05:00:12", eventId: 4624, type: "Success Audit", category: "Logon", user: "nexus-svc", details: "An account was successfully logged on via WinRM/PowerShell Remoting." },
      { id: "aud-102", time: "2026-07-26 04:12:05", eventId: 4624, type: "Success Audit", category: "Logon", user: "Administrator", details: "User logon initiated via RDP session console." },
      { id: "aud-103", time: "2026-07-25 18:30:00", eventId: 4723, type: "Success Audit", category: "User Account Management", user: "Administrator", details: "An attempt was made to reset an account's password for user 'jdoe'." },
      { id: "aud-104", time: "2026-07-25 16:45:20", eventId: 4625, type: "Failure Audit", category: "Logon", user: "temp-vendor", details: "An account failed to log on. Reason: Unknown user name or bad password (Attempt 5)." },
      { id: "aud-105", time: "2026-07-25 16:45:21", eventId: 4740, type: "Warning", category: "User Account Management", user: "temp-vendor", details: "A user account was locked out due to excessive failed logon attempts." },
      { id: "aud-106", time: "2026-07-24 11:20:10", eventId: 4728, type: "Success Audit", category: "Group Management", user: "Administrator", details: "Member 'mwilson' was added to security group 'Remote Desktop Users'." },
      { id: "aud-107", time: "2026-07-24 09:15:00", eventId: 4720, type: "Success Audit", category: "User Account Management", user: "Administrator", details: "A local user account 'sec-audit' was created." }
    ];
    return logs;
  }, [server]);

  return (
    <div className="nx-card overflow-hidden flex flex-col h-[calc(100vh-320px)] min-h-[450px] backdrop-blur-xl border border-[var(--border-dim)] shadow-xl">
      <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border-dim)] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
          <ShieldAlert size={16} className="text-[var(--amber)]" />
          <span>Security Audit Trail (Windows Event Log Provider: Security)</span>
        </div>
        <span className="text-[11px] text-[var(--text-sub)] mono">Events: {auditLogs.length}</span>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-[12px] mono">
          <thead className="sticky top-0 bg-[var(--bg-surface)] z-10 border-b border-[var(--border-c)]">
            <tr className="eyebrow text-left">
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Event ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Target User</th>
              <th className="px-4 py-3">Event Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id} className="border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] transition-colors">
                <td className="px-4 py-3 text-[var(--text-sub)] whitespace-nowrap">{log.time}</td>
                <td className="px-4 py-3 font-bold text-[var(--amber)]">ID {log.eventId}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${log.type.includes("Failure") || log.type === "Warning" ? "bg-[var(--crit)]/15 text-[var(--crit)]" : "bg-[var(--ok)]/15 text-[var(--ok)]"}`}>
                    {log.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--text)] whitespace-nowrap">{log.category}</td>
                <td className="px-4 py-3 font-semibold text-[var(--text)]">{log.user}</td>
                <td className="px-4 py-3 text-[var(--text-sub)]">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
