import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { 
  Search, Server, LayoutDashboard, Terminal, Shield, Cpu, Activity, HardDrive, 
  Network, AppWindow, Cog, FolderOpen, Calendar, Package, Layers, RefreshCw, 
  Monitor, BadgeCheck, Users, KeyRound, FileCode, Moon, Sun, ArrowRight, CornerDownLeft
} from "lucide-react";
import { toast } from "sonner";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Server Actions" | "System Tools";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  keywords?: string;
  shortcut?: string;
}

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items: CommandItem[] = [
    // Navigation
    { id: "nav-dash", title: "Dashboard", category: "Navigation", icon: LayoutDashboard, action: () => navigate({ to: "/" }), keywords: "home main topology" },
    { id: "nav-srv", title: "Server Fleet", category: "Navigation", icon: Server, action: () => navigate({ to: "/servers" }), keywords: "nodes hosts ip" },
    { id: "nav-fw", title: "Firewall & Security", category: "Navigation", icon: Shield, action: () => navigate({ to: "/firewall" }), keywords: "rules profiles port" },
    { id: "nav-vm", title: "Virtual Machines (Hyper-V)", category: "Navigation", icon: Cpu, action: () => navigate({ to: "/vms" }), keywords: "hyperv compute vms" },
    { id: "nav-evt", title: "Events & Logs", category: "Navigation", icon: Activity, action: () => navigate({ to: "/events" }), keywords: "logs errors warning stream" },
    { id: "nav-perf", title: "Performance Metrics", category: "Navigation", icon: Activity, action: () => navigate({ to: "/performance" }), keywords: "cpu ram memory chart telemetry" },
    { id: "nav-sec", title: "Security Center", category: "Navigation", icon: Shield, action: () => navigate({ to: "/security" }), keywords: "logins admins posture" },
    { id: "nav-proc", title: "Process Manager", category: "Navigation", icon: Cpu, action: () => navigate({ to: "/processes" }), keywords: "kill task executable pid" },
    { id: "nav-svc", title: "Service Manager", category: "Navigation", icon: RefreshCw, action: () => navigate({ to: "/services" }), keywords: "restart windows service" },
    { id: "nav-stor", title: "Storage & Disks", category: "Navigation", icon: HardDrive, action: () => navigate({ to: "/storage" }), keywords: "volume partition drive" },
    { id: "nav-replica", title: "Storage Replica", category: "Navigation", icon: HardDrive, action: () => navigate({ to: "/storage-replica" }), keywords: "sync partnership replication" },
    { id: "nav-net", title: "Network Adapters", category: "Navigation", icon: Network, action: () => navigate({ to: "/networks" }), keywords: "nic ip ethernet vlan" },
    { id: "nav-app", title: "Installed Applications", category: "Navigation", icon: AppWindow, action: () => navigate({ to: "/apps" }), keywords: "software install uninstall" },
    { id: "nav-task", title: "Scheduled Tasks", category: "Navigation", icon: Calendar, action: () => navigate({ to: "/tasks" }), keywords: "cron job schedule" },
    { id: "nav-upd", title: "Windows Updates", category: "Navigation", icon: Package, action: () => navigate({ to: "/updates" }), keywords: "patch kb update reboot" },
    { id: "nav-cert", title: "Certificates", category: "Navigation", icon: BadgeCheck, action: () => navigate({ to: "/certificates" }), keywords: "ssl tls store pfx" },
    { id: "nav-usr", title: "Local Users & Groups", category: "Navigation", icon: Users, action: () => navigate({ to: "/users" }), keywords: "admin account user password" },
    { id: "nav-reg", title: "Registry Editor", category: "Navigation", icon: KeyRound, action: () => navigate({ to: "/registry" }), keywords: "hklm regkey val" },
    { id: "nav-ps", title: "PowerShell Console", category: "Navigation", icon: Terminal, action: () => navigate({ to: "/powershell" }), keywords: "cli command shell script", shortcut: "Ctrl+P" },
    { id: "nav-plug", title: "Extension Plugins", category: "Navigation", icon: FileCode, action: () => navigate({ to: "/plugins" }), keywords: "scripts runner add-on" },
    { id: "nav-set", title: "System Settings", category: "Navigation", icon: Cog, action: () => navigate({ to: "/settings" }), keywords: "theme preferences config" },

    // Server Actions
    { id: "act-rdp", title: "Connect via Remote Desktop", category: "Server Actions", icon: Monitor, action: () => navigate({ to: "/remote-desktop" }), keywords: "rdp connection session" },
    { id: "act-ps-dc", title: "Launch PowerShell on Local Server", category: "Server Actions", icon: Terminal, action: () => navigate({ to: "/powershell", search: { serverIp: "127.0.0.1" } as any }), keywords: "local terminal" },
    { id: "act-restart-svc", title: "Manage Server Services", category: "Server Actions", icon: RefreshCw, action: () => navigate({ to: "/services" }), keywords: "restart services" },

    // System Tools
    { id: "sys-theme", title: "Toggle Dark / Light Theme", category: "System Tools", icon: Moon, action: () => { document.documentElement.classList.toggle("dark"); toast.info("Theme toggled"); }, keywords: "mode appearance dark light" },
    { id: "sys-ref", title: "Refresh Backend Status", category: "System Tools", icon: RefreshCw, action: () => { window.dispatchEvent(new CustomEvent("nexus-backend-status", { detail: { online: true } })); toast.success("Refreshed status"); }, keywords: "reload status check" },
  ];

  const filtered = items.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.keywords && item.keywords.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const selectedItemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-md transition-all animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl shadow-2xl overflow-hidden flex flex-col mx-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-c)] bg-[var(--bg-card)]">
          <Search size={20} className="text-[var(--amber)] shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, route, or search server..."
            className="w-full bg-transparent text-sm text-[var(--text)] placeholder-[var(--text-sub)] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-[var(--text-sub)] bg-[var(--bg-void)] border border-[var(--border-c)] rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-[var(--border-c)]/30">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-sub)]">
              No matching commands or routes found for "<span className="text-[var(--amber)]">{query}</span>"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  ref={isSelected ? selectedItemRef : null}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseMove={() => {
                    if (selectedIndex !== idx) setSelectedIndex(idx);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[var(--amber)] text-white shadow-md font-semibold"
                      : "text-[var(--text)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-white/20 text-white" : "bg-[var(--bg-void)] text-[var(--amber)] border border-[var(--border-c)]"}`}>
                      <Icon size={16} />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold truncate">{item.title}</p>
                      <p className={`text-[10px] truncate ${isSelected ? "text-white/80" : "text-[var(--text-sub)]"}`}>
                        {item.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.shortcut && (
                      <kbd className={`px-2 py-0.5 text-[9px] font-mono rounded ${isSelected ? "bg-white/20 text-white" : "bg-[var(--bg-void)] text-[var(--text-sub)] border border-[var(--border-c)]"}`}>
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && <CornerDownLeft size={14} className="text-white shrink-0" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-4 py-2.5 bg-[var(--bg-void)] border-t border-[var(--border-c)] flex items-center justify-between text-[11px] text-[var(--text-sub)] font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-c)] rounded">↑↓</kbd> navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-c)] rounded">↵</kbd> select</span>
          </div>
          <div className="flex items-center gap-1 text-[var(--amber)] font-bold">
            <span>NEXUS</span> Command Palette
          </div>
        </div>
      </div>
    </div>
  );
}
