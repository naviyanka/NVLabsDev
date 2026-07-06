import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getLocalUsers, getLocalGroups, type LocalUser, type LocalGroup } from "@/api/mock";

export const Route = createFileRoute("/users")({
  head: () => ({ meta: [{ title: "Users & Groups — NEXUS" }, { name: "description", content: "Local users and groups." }] }),
  component: UsersPage,
});

function UsersPage() {
  const [server, setServer] = useState("nexus01");
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [groups, setGroups] = useState<LocalGroup[]>([]);
  const [tab, setTab] = useState<"Users"|"Groups">("Users");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { getLocalUsers(server).then(setUsers); getLocalGroups(server).then(setGroups); }, [server]);

  return (
    <PageWrapper>
      <PageHeader eyebrow="Security" title="Local Users & Groups" />
      <ServerSelector value={server} onChange={setServer} />
      <div className="mb-3 inline-flex rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] p-1">
        {(["Users","Groups"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={"mono rounded px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] " + (tab === t ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)]")}>{t}</button>
        ))}
      </div>
      {tab === "Users" ? (
        <div className="nx-card overflow-hidden">
          <table className="w-full text-[12px]">
            <thead><tr className="eyebrow border-b border-[var(--border-c)] text-left">
              <th className="px-4 py-2">Username</th><th>Full Name</th><th>Last Login</th><th>Enabled</th><th>Password</th><th>Groups</th>
            </tr></thead>
            <tbody className="mono">
              {users.map((u) => (
                <tr key={u.name} className="border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)]">
                  <td className="px-4 py-2 text-[var(--amber)]">{u.name}</td>
                  <td className="text-[var(--text)]">{u.fullName}</td>
                  <td className="text-[var(--text-sub)]">{u.lastLogin === "—" ? "—" : new Date(u.lastLogin).toLocaleString()}</td>
                  <td><span className={"mono rounded-full px-2 py-0.5 text-[10px] " + (u.enabled ? "bg-[var(--ok)]/15 text-[var(--ok)]" : "bg-[var(--text-sub)]/15 text-[var(--text-sub)]")}>{u.enabled ? "Yes" : "No"}</span></td>
                  <td className="text-[var(--text-sub)]">{u.passwordNeverExpires ? "Never expires" : "Standard"}</td>
                  <td className="text-[var(--text-sub)]">{u.groups.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="nx-card overflow-hidden">
          <table className="w-full text-[12px]">
            <thead><tr className="eyebrow border-b border-[var(--border-c)] text-left">
              <th className="px-4 py-2">Group</th><th>Description</th><th>Members</th>
            </tr></thead>
            <tbody className="mono">
              {groups.map((g) => (
                <Fragment key={g.name}>
                  <tr onClick={() => setExpanded(expanded === g.name ? null : g.name)} className="cursor-pointer border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)]">
                    <td className="px-4 py-2 text-[var(--amber)]">{g.name}</td>
                    <td className="text-[var(--text-sub)]">{g.description}</td>
                    <td className="text-[var(--text)]">{g.members.length}</td>
                  </tr>
                  {expanded === g.name && (
                    <tr><td colSpan={3} className="border-b border-[var(--border-dim)] bg-[var(--bg-surface)] px-8 py-2">
                      <ul className="mono space-y-0.5 text-[11px] text-[var(--text-sub)]">{g.members.map((m) => <li key={m}>· {m}</li>)}</ul>
                    </td></tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  );
}
