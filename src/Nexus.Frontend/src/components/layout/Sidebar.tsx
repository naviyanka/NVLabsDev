import { Link, useRouterState } from "@tanstack/react-router";
import { getApiUrl } from "@/lib/backend";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Server, Activity, AppWindow, Cog, HardDrive, FolderOpen,
  Calendar, Package, Layers, RefreshCw, Monitor, Shield, BadgeCheck, Users,
  KeyRound, Network, Cpu, DatabaseZap, GitBranch, CopySlash, Terminal,
  ScrollText, Puzzle, Settings as SettingsIcon, Hexagon,
} from "lucide-react";
import { MOCK_SERVERS } from "@/api/mock";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string; size?: number }> };
type Group = { label: string; items: Item[] };

const ICONS: Record<string, React.ComponentType<any>> = { 
  terminal: Terminal, shield: Shield, activity: Activity, "hard-drive": HardDrive, 
  network: Network, settings: SettingsIcon, cpu: Cpu, "database-zap": DatabaseZap,
  "app-window": AppWindow, cog: Cog, "folder-open": FolderOpen, calendar: Calendar,
  package: Package, layers: Layers, "refresh-cw": RefreshCw, monitor: Monitor,
  "badge-check": BadgeCheck, users: Users, "key-round": KeyRound, server: Server,
  "git-branch": GitBranch, "copy-slash": CopySlash, "scroll-text": ScrollText, puzzle: Puzzle
};

const CORE_ITEMS: Item[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/servers", label: "Servers", icon: Server },
];

const SYSTEM_ITEMS: Item[] = [
  { to: "/plugins", label: "Plugins", icon: Puzzle },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [plugins, setPlugins] = useState<any[]>([]);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const online = MOCK_SERVERS.filter((s) => s.status === "online").length;

  const fetchPlugins = () => {
    fetch(getApiUrl("/plugins"))
      .then(r => r.json())
      .then(data => setPlugins(data.filter((p: any) => p.isActive)))
      .catch(() => {});
  };

  useEffect(() => {
    fetchPlugins();
    window.addEventListener("plugins-updated", fetchPlugins);
    
    const handleMobileToggle = () => setMobileOpen(prev => !prev);
    window.addEventListener("toggle-sidebar", handleMobileToggle);
    
    return () => {
      window.removeEventListener("plugins-updated", fetchPlugins);
      window.removeEventListener("toggle-sidebar", handleMobileToggle);
    };
  }, []);

  // Group plugins by Category — restrict plugin targetRoute to safe in-app routes
  const ALLOWED_SCHEMES = ["http:", "https:", "mailto:"];
  const groupedPlugins: Record<string, Item[]> = {};
  plugins.forEach(p => {
    const cat = p.category || "Custom";
    if (!groupedPlugins[cat]) groupedPlugins[cat] = [];
    let target = p.targetRoute || `/plugin/${p.id}`;
    // Reject javascript:/data: and external URLs from API-provided plugin routes
    try {
      const u = new URL(target, window.location.origin);
      if (ALLOWED_SCHEMES.includes(u.protocol) && u.origin !== window.location.origin) {
        // External link — don't render as a router Link
        target = `/plugin/${p.id}`;
      } else if (!ALLOWED_SCHEMES.includes(u.protocol)) {
        target = `/plugin/${p.id}`;
      }
    } catch {
      // Not a URL — treat as in-app route, but strip any scheme-prefix injection
      target = target.replace(/^[a-z]+:/i, "");
    }
    groupedPlugins[cat].push({
      to: target,
      label: p.name,
      icon: ICONS[p.icon] || Puzzle
    });
  });

  const allGroups: Group[] = [
    { label: "Overview", items: CORE_ITEMS },
    ...Object.keys(groupedPlugins).map(cat => ({
      label: cat,
      items: groupedPlugins[cat]
    })),
    { label: "System", items: SYSTEM_ITEMS }
  ];

  return (
    <>
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden" 
          onClick={() => setMobileOpen(false)} 
        />
      )}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[var(--border-c)] bg-[var(--bg-surface)] transition-all duration-300 ease-out md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: mobileOpen ? 220 : (expanded ? 220 : 56) }}
      >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--border-c)] px-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--amber-low)] text-[var(--amber)]">
          <Hexagon size={18} strokeWidth={2.2} />
        </div>
        {expanded && (
          <div className="overflow-hidden">
            <div className="display text-[15px] font-bold tracking-[0.22em] text-[var(--amber)]">NEXUS</div>
            <div className="mono text-[8.5px] text-[var(--text-sub)]">nexuslab.local</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {allGroups.map((g) => (
          <div key={g.label} className="mb-3">
            {expanded && (
              <div className="eyebrow px-4 pb-1.5 pt-1">{g.label}</div>
            )}
            <ul className="space-y-0.5 px-1.5">
              {g.items.map((it) => {
                const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
                const Icon = it.icon;
                return (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className={[
                        "group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-[13px] transition-colors",
                        active
                          ? "bg-[var(--amber-low)] text-[var(--amber)]"
                          : "text-[var(--text-sub)] hover:bg-[var(--bg-card)] hover:text-[var(--text)]",
                      ].join(" ")}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-[var(--amber)]" />
                      )}
                      <Icon size={16} className="shrink-0" />
                      {expanded && <span className="truncate">{it.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {expanded && (
        <div className="border-t border-[var(--border-c)] px-3 py-2.5">
          <div className="eyebrow pb-1">Fleet</div>
          <div className="mono text-[12px] text-[var(--text)]">
            <span className="text-[var(--ok)]">{online}</span>
            <span className="text-[var(--text-sub)]"> / {MOCK_SERVERS.length} online</span>
          </div>
        </div>
        )}
      </aside>
    </>
  );
}
