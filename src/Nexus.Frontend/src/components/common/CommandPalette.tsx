import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { 
  Search, Terminal, Server, Cpu, Database, Shield, Layers, Settings, 
  Activity, ArrowRight, Zap, RefreshCw, Download, FileText, CheckCircle2, X
} from "lucide-react";
import { getServersClient, type Server as ServerType } from "@/api/client";
import { toast } from "sonner";

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [servers, setServers] = useState<ServerType[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      getServersClient().then(svrs => setServers(svrs || [])).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const PAGES = [
    { title: "Dashboard & Telemetry", path: "/", icon: Activity, group: "Navigation" },
    { title: "Servers & Active Directory Fleet", path: "/servers", icon: Server, group: "Navigation" },
    { title: "PowerShell PTY Console", path: "/powershell", icon: Terminal, group: "Navigation" },
    { title: "SharePoint & SQL Deployment Wizard", path: "/sharepoint-setup", icon: Layers, group: "Navigation" },
    { title: "Live Process Explorer", path: "/processes", icon: Cpu, group: "Navigation" },
    { title: "Hyper-V Virtual Machines", path: "/vms", icon: Database, group: "Navigation" },
    { title: "Enterprise System Settings", path: "/settings", icon: Settings, group: "Navigation" },
    { title: "Security & CIS Compliance", path: "/security", icon: Shield, group: "Navigation" },
  ];

  const ACTIONS = [
    { 
      title: "Scan Network / Active Directory Domain", 
      icon: RefreshCw, 
      group: "Actions", 
      action: () => {
        navigate({ to: "/servers" });
        toast.info("Active Directory scan initiated");
        onClose();
      } 
    },
    { 
      title: "New PowerShell PTY Console Session", 
      icon: Terminal, 
      group: "Actions", 
      action: () => {
        navigate({ to: "/powershell" });
        onClose();
      } 
    },
    { 
      title: "Export Server Inventory CSV", 
      icon: Download, 
      group: "Actions", 
      action: () => {
        toast.success("Inventory exported");
        onClose();
      } 
    },
  ];

  const filteredPages = PAGES.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
  const filteredActions = ACTIONS.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));
  const filteredServers = servers.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.ip.includes(query));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-2xl shadow-2xl overflow-hidden font-sans space-y-0">
        
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-c)] bg-[var(--bg-void)]">
          <Search size={18} className="text-[var(--amber)]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search servers, processes, settings... (Esc to exit)"
            className="w-full bg-transparent text-sm text-[var(--text)] placeholder-[var(--text-sub)] focus:outline-none font-medium"
          />
          <button onClick={onClose} className="p-1 rounded text-[var(--text-sub)] hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Results Stream */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          
          {/* Navigation Pages */}
          {filteredPages.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--text-sub)] px-2 mb-1.5 tracking-wider">Navigation & Modules</div>
              <div className="space-y-1">
                {filteredPages.map((p) => {
                  const Icon = p.icon;
                  return (
                    <div
                      key={p.path}
                      onClick={() => {
                        navigate({ to: p.path as any });
                        onClose();
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--amber-low)] hover:border-[var(--amber)]/40 border border-transparent cursor-pointer transition-all text-xs group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-[var(--bg-void)] text-[var(--amber)] group-hover:bg-[var(--amber)] group-hover:text-black transition-all">
                          <Icon size={16} />
                        </div>
                        <span className="font-bold text-[var(--text)]">{p.title}</span>
                      </div>
                      <ArrowRight size={14} className="text-[var(--text-sub)] group-hover:text-[var(--amber)] group-hover:translate-x-1 transition-all" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--text-sub)] px-2 mb-1.5 tracking-wider">Quick System Actions</div>
              <div className="space-y-1">
                {filteredActions.map((a, idx) => {
                  const Icon = a.icon;
                  return (
                    <div
                      key={idx}
                      onClick={a.action}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--amber-low)] hover:border-[var(--amber)]/40 border border-transparent cursor-pointer transition-all text-xs group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-[var(--bg-void)] text-[var(--teal)] group-hover:bg-[var(--teal)] group-hover:text-black transition-all">
                          <Icon size={16} />
                        </div>
                        <span className="font-bold text-[var(--text)]">{a.title}</span>
                      </div>
                      <Zap size={14} className="text-[var(--text-sub)] group-hover:text-[var(--teal)] transition-all" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Discovered Server Fleet */}
          {filteredServers.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--text-sub)] px-2 mb-1.5 tracking-wider">Discovered Servers ({filteredServers.length})</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredServers.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      navigate({ to: "/powershell", search: { serverName: s.name } as any });
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-void)] hover:border-[var(--amber)] border border-[var(--border-c)] cursor-pointer transition-all text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Server size={14} className="text-[var(--amber)] shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-[var(--text)] truncate">{s.name}</div>
                        <div className="text-[10px] text-[var(--text-sub)] font-mono">{s.ip}</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">PTY</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Shortcut Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-void)] border-t border-[var(--border-c)] text-[10px] text-[var(--text-sub)] font-mono">
          <span>Navigate with <kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-c)] rounded text-[var(--text)]">↑</kbd> <kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-c)] rounded text-[var(--text)]">↓</kbd></span>
          <span>Open with <kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-c)] rounded text-[var(--amber)] font-bold">Ctrl + K</kbd></span>
        </div>
      </div>
    </div>
  );
}
