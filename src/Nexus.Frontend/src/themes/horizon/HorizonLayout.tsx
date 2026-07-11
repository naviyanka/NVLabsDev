import React, { ReactNode, useState, useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { 
  LayoutDashboard, Server, Bell, Settings as SettingsIcon, Search, HelpCircle, Terminal, Cpu, Shield, FileCode, Activity, Moon, Sun, AppWindow, Cog, HardDrive, FolderOpen, Calendar, Package, Layers, RefreshCw, Monitor, BadgeCheck, Users, KeyRound, Network, DatabaseZap, GitBranch, CopySlash, ScrollText, Puzzle, Hexagon, X, LogOut, User
} from "lucide-react";
import { toast } from "sonner";

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
  { to: "/servers", label: "Server Fleet", icon: Server },
];

const SYSTEM_ITEMS: Item[] = [
  { to: "/plugins", label: "Plugins", icon: FileCode },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function HorizonLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [plugins, setPlugins] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<{id: string, msg: string, time: Date}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userContext, setUserContext] = useState({ username: "Admin User", role: "Luminous Command", initials: "NX" });
  const [brand, setBrand] = useState({ name: "NEXUS", subtitle: "Horizon UI Shell" });

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(s => {
      setBrand({ name: s.appName || "NEXUS", subtitle: s.appSubtitle || "Horizon UI Shell" });
      if (s.theme) {
        document.documentElement.setAttribute("data-theme", s.theme);
      }
    }).catch(()=>{});
    
    fetch("/api/notifications").then(r => r.json()).then(n => {
      if (Array.isArray(n)) {
        setNotifications(n.map((x: any) => ({ id: x.id.toString(), msg: x.message, time: new Date(x.timestamp) })));
      }
    }).catch(()=>{});
    
    const handler = (e: any) => {
      setBrand({ name: e.detail.appName || "NEXUS", subtitle: e.detail.appSubtitle || "Horizon UI Shell" });
    };
    window.addEventListener("nexus-branding-change", handler);

    try {
      const userStr = localStorage.getItem("nexus-user");
      if (userStr) {
        const p = JSON.parse(userStr);
        setUserContext({
          username: p.username || "Admin User",
          role: p.role || "Operator",
          initials: p.username ? p.username.substring(0,2).toUpperCase() : "NX"
        });
      }
    } catch(e) {}

    const originalSuccess = toast.success;
    const originalError = toast.error;
    
    // @ts-ignore
    toast.success = (msg: string, data?: any) => {
      setNotifications(prev => [{ id: Math.random().toString(), msg, time: new Date() }, ...prev]);
      fetch('/api/notifications/custom', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type: 'Success', message: msg }) }).catch(()=>{});
      let toastId: string | number;
      toastId = originalSuccess(msg, { ...data, onClick: () => toast.dismiss(toastId) });
      return toastId;
    };
    
    // @ts-ignore
    toast.error = (msg: string, data?: any) => {
      setNotifications(prev => [{ id: Math.random().toString(), msg, time: new Date() }, ...prev]);
      fetch('/api/notifications/custom', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type: 'Error', message: msg }) }).catch(()=>{});
      let toastId: string | number;
      toastId = originalError(msg, { ...data, onClick: () => toast.dismiss(toastId) });
      return toastId;
    };

    return () => {
      toast.success = originalSuccess;
      toast.error = originalError;
      window.removeEventListener("nexus-branding-change", handler);
    };
  }, []);

  const fetchPlugins = () => {
    fetch("/api/plugins")
      .then(r => r.json())
      .then(data => setPlugins(data.filter((p: any) => p.isActive)))
      .catch(() => {});
  };

  useEffect(() => {
    fetchPlugins();
    window.addEventListener("plugins-updated", fetchPlugins);
    return () => window.removeEventListener("plugins-updated", fetchPlugins);
  }, []);

  const groupedPlugins: Record<string, Item[]> = {};
  plugins.forEach(p => {
    const cat = p.category || "Custom";
    if (!groupedPlugins[cat]) groupedPlugins[cat] = [];
    groupedPlugins[cat].push({
      to: p.targetRoute || `/plugin/${p.id}`,
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
    <div className="min-h-screen w-full bg-[var(--bg-void)] text-[var(--text)] flex overflow-hidden font-sans">
      {/* SideNavBar */}
      <nav className="fixed left-0 top-0 h-screen w-[240px] bg-[var(--bg-surface)] border-r border-[var(--border-c)] shadow-sm flex flex-col py-8 px-4 space-y-2 z-50">
        <div className="mb-8 px-4 shrink-0">
          <div className="text-2xl font-extrabold tracking-tight text-[var(--amber)] flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-[var(--amber)] animate-pulse shrink-0"></span>
            <span className="truncate">{brand.name}</span>
          </div>
          <p className="text-xs text-[var(--text-sub)] uppercase tracking-widest mt-1 truncate" title={brand.subtitle}>{brand.subtitle}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1">
          {allGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <div className="text-[10px] text-[var(--text-sub)] uppercase tracking-widest px-4 mb-2 font-bold">{group.label}</div>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={`flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          isActive
                            ? "bg-[var(--amber)] text-white shadow-md font-semibold translate-x-1"
                            : "text-[var(--text-sub)] hover:text-[var(--amber)] hover:bg-[var(--amber-low)]"
                        }`}
                      >
                        <Icon size={16} className={isActive ? "text-white" : "text-[var(--text-sub)] group-hover:text-[var(--amber)]"} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4 shrink-0 border-t border-[var(--border-c)] flex flex-col gap-2 relative">
          {showProfileMenu && (
            <div className="absolute bottom-full left-4 mb-2 w-[200px] bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl shadow-lg p-2 z-50">
              <button className="w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg transition-colors flex items-center gap-2">
                <User size={14} /> Profile Settings
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem("nexus_token");
                  localStorage.removeItem("nexus-user");
                  navigate({ to: "/login" });
                }}
                className="w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 px-2 w-full hover:bg-[var(--bg-void)] p-2 rounded-xl transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--amber-low)] flex items-center justify-center border border-[var(--amber)]/30 text-[var(--amber)] font-bold text-sm shrink-0">
              {userContext.initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-[var(--text)] truncate">
                {userContext.username}
              </p>
              <p className="text-[10px] text-[var(--text-sub)] truncate">{userContext.role}</p>
            </div>
          </button>
        </div>
      </nav>

      {/* TopNavBar */}
      <header className="fixed top-0 right-0 h-16 w-[calc(100%-240px)] z-40 bg-[var(--bg-surface)]/90 backdrop-blur-xl border-b border-[var(--border-c)] flex items-center justify-between px-8">
        <div className="flex items-center gap-2 text-[var(--text-sub)] text-xs font-semibold uppercase tracking-widest">
          <span className="text-[var(--amber)] font-bold">{brand.name}</span>
          <span>/</span>
          <span>{pathname === "/" ? "Dashboard" : pathname.slice(1).toUpperCase()}</span>
        </div>
        <div className="flex-1 max-w-md mx-8">
          <div className="relative focus-within:ring-2 focus-within:ring-[var(--amber)]/30 rounded-full transition-all">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-sub)] z-10 pointer-events-none" />
            <input 
              className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-full py-2 pl-12 pr-4 text-xs focus:outline-none focus:border-[var(--amber)] focus:bg-[var(--bg-surface)] transition-colors text-[var(--text)] placeholder-[var(--text-sub)]" 
              placeholder="Search servers, IPs, or alerts..." 
              type="text" 
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => document.documentElement.classList.toggle('dark')} 
            className="text-[var(--text-sub)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-full p-2 transition-all relative"
            title="Toggle Dark Mode"
          >
            <Moon size={18} className="hidden dark:block" />
            <Sun size={18} className="block dark:hidden" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-[var(--text-sub)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-full p-2 transition-all relative"
            >
              <Bell size={18} />
              {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--amber)] rounded-full animate-pulse"></span>}
            </button>
            
            {showNotifications && (
              <div className="absolute top-full mt-2 right-0 w-80 bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-[var(--border-c)] flex items-center justify-between">
                  <span className="font-bold text-sm">Notifications</span>
                  <button onClick={() => setNotifications([])} className="text-xs text-[var(--text-sub)] hover:text-[var(--amber)]">Clear All</button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[var(--text-sub)]">No new notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 border-b border-[var(--border-c)] hover:bg-[var(--bg-void)] flex justify-between items-start gap-2 group">
                        <div>
                          <p className="text-xs text-[var(--text)]">{n.msg}</p>
                          <p className="text-[10px] text-[var(--text-sub)] mt-1">{n.time.toLocaleTimeString()}</p>
                        </div>
                        <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="text-[var(--text-sub)] hover:text-[var(--crit)] opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <button className="text-[var(--text-sub)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-full p-2 transition-all">
            <HelpCircle size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="ml-[240px] mt-16 p-8 w-[calc(100%-240px)] h-[calc(100vh-64px)] overflow-y-auto bg-[var(--bg-void)] text-[var(--text)]">
        {children}
      </main>
    </div>
  );
}
