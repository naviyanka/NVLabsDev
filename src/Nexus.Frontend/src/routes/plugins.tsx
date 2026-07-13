import { createFileRoute } from "@tanstack/react-router";
import { getApiUrl } from "@/lib/backend";
import { useEffect, useMemo, useState, useRef, useContext } from "react";
import { 
  Search, Plus, X, Trash2, Edit2, LayoutDashboard, Server, Activity, AppWindow, Cog, HardDrive, FolderOpen,
  Calendar, Package, Layers, RefreshCw, Monitor, Shield, BadgeCheck, Users,
  KeyRound, Network, Cpu, DatabaseZap, GitBranch, CopySlash, Terminal,
  ScrollText, Puzzle, Settings as SettingsIcon 
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<any>> = { 
  terminal: Terminal, shield: Shield, activity: Activity, "hard-drive": HardDrive, 
  network: Network, settings: SettingsIcon, cpu: Cpu, "database-zap": DatabaseZap,
  "app-window": AppWindow, cog: Cog, "folder-open": FolderOpen, calendar: Calendar,
  package: Package, layers: Layers, "refresh-cw": RefreshCw, monitor: Monitor,
  "badge-check": BadgeCheck, users: Users, "key-round": KeyRound, server: Server,
  "git-branch": GitBranch, "copy-slash": CopySlash, "scroll-text": ScrollText, puzzle: Puzzle
};
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { toast } from "sonner";

export const Route = createFileRoute("/plugins")({
  head: () => ({ meta: [{ title: "Plugins — NEXUS" }] }),
  component: PluginsPage,
});

const CATS = ["All","Security","Storage","Monitoring","Network","Management","Custom"] as const;

export interface PluginEntity {
  id: string;
  name: string;
  description: string;
  icon: string;
  scriptType: string;
  scriptContent: string;
  sourceType: string;
  isActive: boolean;
  author: string;
  category: string;
  isBuiltIn: boolean;
  targetRoute?: string;
}

import { ThemeContext } from "./__root";
import { HorizonPlugins } from "../themes/horizon/pages/HorizonPlugins";

function PluginsPage() {
  const { theme } = useContext(ThemeContext);
  if (theme === 'horizon') return <HorizonPlugins />;
  const [plugins, setPlugins] = useState<PluginEntity[]>([]);
  const [categories, setCategories] = useState<string[]>(["Management", "Security", "Infrastructure", "Advanced", "Custom"]);
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");
  const [editingPlugin, setEditingPlugin] = useState<PluginEntity | "new" | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");

  function load() {
    fetch(getApiUrl("/plugins"))
      .then(r => r.json())
      .then(setPlugins)
      .catch(() => toast.error("Failed to load plugins"));

    fetch(getApiUrl("/settings"))
      .then(r => r.json())
      .then(data => {
        if (data.pluginCategories) {
          setCategories(data.pluginCategories.split(",").map((c: string) => c.trim()).filter(Boolean));
        }
      })
      .catch(() => {});
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: plugins.length,
    active: plugins.filter((p) => p.isActive).length,
    disabled: plugins.filter((p) => !p.isActive).length,
  }), [plugins]);

  const filtered = plugins.filter((p) => {
    const matchCat = cat === "All" || p.category === cat;
    const matchQ = p.name.toLowerCase().includes(q.toLowerCase());
    const matchStatus = statusFilter === "all" ? true : statusFilter === "active" ? p.isActive : !p.isActive;
    return matchCat && matchQ && matchStatus;
  });

  function toggle(p: PluginEntity) {
    const next = { ...p, isActive: !p.isActive };
    setPlugins(ps => ps.map(x => x.id === p.id ? next : x));
    fetch(getApiUrl(`/plugins/${p.id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next)
    }).then(() => {
      window.dispatchEvent(new Event("plugins-updated"));
    }).catch(() => {
      toast.error("Failed to toggle");
      load();
    });
  }

  function deletePlugin(id: string) {
    if (!confirm("Delete this plugin permanently?")) return;
    fetch(getApiUrl(`/plugins/${id}`), { method: "DELETE" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        load();
        window.dispatchEvent(new Event("plugins-updated"));
      })
      .catch(() => toast.error("Failed to delete"));
  }

  return (
    <PageWrapper>
      <PageHeader eyebrow="System" title="Plugin Manager" subtitle="Manage built-in and custom extensions" />
      
      <div className="flex justify-end pb-4">
        <button onClick={() => setEditingPlugin("new")} className="flex items-center gap-2 rounded-md bg-[var(--amber)] px-4 py-2 text-[12px] font-semibold text-[var(--bg-void)] hover:bg-[var(--amber-hover)] transition-colors">
          <Plus size={14} /> Create Plugin
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 pb-6">
        <Stat label="Total Plugins" value={stats.total} color="var(--text)" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
        <Stat label="Active" value={stats.active} color="var(--ok)" active={statusFilter === "active"} onClick={() => setStatusFilter("active")} />
        <Stat label="Disabled" value={stats.disabled} color="var(--text-sub)" active={statusFilter === "disabled"} onClick={() => setStatusFilter("disabled")} />
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-5">
        <aside className="nx-card h-fit p-3">
          <div className="eyebrow px-1 pb-2">Category</div>
          {["All", ...categories].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={"flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] " + (c === cat ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)]")}>
              <span>{c}</span>
              <span className="mono text-[10px]">{c === "All" ? plugins.length : plugins.filter((p) => p.category === c).length}</span>
            </button>
          ))}
        </aside>

        <div>
          <div className="relative pb-4">
            <Search size={14} className="pointer-events-none absolute left-3 top-3 text-[var(--text-sub)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search plugins…" className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] py-2 pl-9 pr-3 text-[12px] focus:border-[var(--amber)] focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => <PluginCard key={p.id} p={p} onToggle={() => toggle(p)} onEdit={() => setEditingPlugin(p)} onDelete={() => deletePlugin(p.id)} />)}
            {filtered.length === 0 && <div className="col-span-2 text-center text-[var(--text-sub)] py-10">No plugins found.</div>}
          </div>
        </div>
      </div>

      {editingPlugin && (
        <PluginModal 
          plugin={editingPlugin === "new" ? null : editingPlugin} 
          categories={categories}
          onClose={() => setEditingPlugin(null)} 
          onSaved={() => {
            load();
            window.dispatchEvent(new Event("plugins-updated"));
          }} 
        />
      )}
    </PageWrapper>
  );
}

function PluginModal({ plugin, categories, onClose, onSaved }: { plugin: PluginEntity | null, categories: string[], onClose: () => void, onSaved: () => void }) {
  const [form, setForm] = useState<Partial<PluginEntity>>(plugin || {
    name: "", description: "", scriptType: "powershell", sourceType: "inline", scriptContent: "", icon: "terminal", category: "Custom"
  });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setShowIconPicker(false);
      }
    }
    if (showIconPicker) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showIconPicker]);

  function save() {
    const isNew = !plugin;
    const url = isNew ? getApiUrl("/plugins") : getApiUrl(`/plugins/${plugin.id}`);
    fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    }).then(r => {
      if(r.ok) { onSaved(); onClose(); }
      else toast.error("Failed to save");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="nx-card w-full max-w-2xl overflow-hidden flex flex-col max-h-full">
        <div className="flex items-center justify-between border-b border-[var(--border-c)] p-4">
          <h2 className="font-semibold text-[var(--text)]">{plugin ? "Edit Plugin" : "Create Custom Plugin"}</h2>
          <button onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)]"><X size={16}/></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block pb-1">Name</label>
              <input value={form.name} disabled={form.isBuiltIn} onChange={e => setForm({...form, name: e.target.value})} className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none disabled:opacity-50" />
            </div>
            <div>
              <label className="eyebrow block pb-1">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="eyebrow block pb-1">Description</label>
            <input value={form.description} disabled={form.isBuiltIn} onChange={e => setForm({...form, description: e.target.value})} className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none disabled:opacity-50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block pb-1">Icon</label>
              <div className="relative" ref={iconPickerRef}>
                <button type="button" disabled={form.isBuiltIn} onClick={() => setShowIconPicker(!showIconPicker)} className="mono flex w-full items-center justify-between rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none disabled:opacity-50">
                  <span className="flex items-center gap-2">
                    {(() => { const IconComp = ICONS[form.icon || "terminal"]; return <IconComp size={14} />; })()}
                    {form.icon}
                  </span>
                </button>
                {showIconPicker && (
                  <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] p-2 shadow-lg">
                    <div className="grid grid-cols-6 gap-2">
                      {Object.keys(ICONS).map(c => {
                        const IconComp = ICONS[c];
                        return (
                          <button key={c} type="button" onClick={() => { setForm({...form, icon: c}); setShowIconPicker(false); }} title={c} className={"flex aspect-square items-center justify-center rounded-md border transition-colors " + (form.icon === c ? "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)]" : "border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)] hover:text-[var(--text)]")}>
                            <IconComp size={16} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="eyebrow block pb-1">Script Type</label>
              <select value={form.scriptType} disabled={form.isBuiltIn} onChange={e => setForm({...form, scriptType: e.target.value})} className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none disabled:opacity-50">
                <option value="powershell">PowerShell</option>
                <option value="bat">Batch (.bat)</option>
                <option value="vbs">VBScript (.vbs)</option>
              </select>
            </div>
          </div>
          
          {!form.isBuiltIn && (
            <div>
              <div className="flex gap-4 pb-2">
                <label className="flex items-center gap-2 text-[12px] text-[var(--text)]">
                  <input type="radio" checked={form.sourceType !== "file"} onChange={() => setForm({...form, sourceType: "inline"})} className="accent-[var(--amber)]" />
                  Inline Script
                </label>
                <label className="flex items-center gap-2 text-[12px] text-[var(--text)]">
                  <input type="radio" checked={form.sourceType === "file"} onChange={() => setForm({...form, sourceType: "file"})} className="accent-[var(--amber)]" />
                  Upload File
                </label>
              </div>

              {form.sourceType === "file" ? (
                <input type="file" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setForm({...form, scriptContent: ev.target?.result as string});
                    reader.readAsText(file);
                  }
                }} className="mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] file:mr-4 file:rounded file:border-0 file:bg-[var(--amber-low)] file:px-4 file:py-1 file:text-[11px] file:font-semibold file:text-[var(--amber)] hover:file:bg-[var(--amber)] hover:file:text-[var(--bg-void)] file:cursor-pointer" />
              ) : (
                <textarea value={form.scriptContent} onChange={e => setForm({...form, scriptContent: e.target.value})} rows={10} className="mono w-full rounded-md border border-[var(--border-c)] bg-[#0d0d0d] text-[var(--ok)] px-3 py-3 text-[12px] focus:border-[var(--amber)] focus:outline-none font-mono leading-relaxed" placeholder="# Write your script here..." />
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t border-[var(--border-c)] p-4 bg-[var(--bg-surface)]">
          <button onClick={onClose} className="px-4 py-2 text-[12px] text-[var(--text-sub)] hover:text-[var(--text)]">Cancel</button>
          <button onClick={save} className="rounded-md bg-[var(--amber)] px-4 py-2 text-[12px] font-semibold text-[var(--bg-void)] hover:bg-[var(--amber-hover)]">Save Plugin</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color, active, onClick }: { label: string; value: number; color: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={"nx-card p-4 text-left transition-all block w-full " + (active ? "border-[var(--amber)] bg-[var(--amber-low)] ring-1 ring-[var(--amber)] scale-[1.02]" : "hover:border-[var(--border-c)]/80")}>
      <div className="eyebrow pb-1" style={{ color }}>{label}</div>
      <div className="display text-[24px] font-bold" style={{ color }}>{value}</div>
    </button>
  );
}

const CAT_COLOR: Record<string, string> = {
  Security: "var(--crit)", Storage: "var(--teal)", Monitoring: "var(--amber)",
  Network: "#60a5fa", Management: "var(--ok)", Custom: "var(--text-sub)", Advanced: "var(--purple)", Infrastructure: "var(--blue)"
};

function PluginCard({ p, onToggle, onEdit, onDelete }: { p: PluginEntity; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const catColor = CAT_COLOR[p.category] || "var(--text-sub)";
  return (
    <div className="nx-card flex flex-col justify-between p-4">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex gap-2">
              <div className="mono inline-block rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em]" style={{ color: catColor, borderColor: catColor + "55", background: catColor + "15" }}>{p.category}</div>
              {p.isBuiltIn && <div className="mono inline-block rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-[var(--text)] border-[var(--border-c)] bg-[var(--bg-surface)]">BUILT-IN</div>}
            </div>
            <h3 className="display pt-2 text-[14px] font-semibold text-[var(--text)]">{p.name}</h3>
            <div className="mono pt-0.5 text-[10px] text-[var(--text-sub)]">{p.isBuiltIn ? "NATIVE UI" : p.scriptType.toUpperCase()} · {p.author}</div>
          </div>
          <Toggle on={p.isActive} onChange={onToggle} />
        </div>
        <p className="pt-3 text-[12px] leading-relaxed text-[var(--text-sub)]">{p.description}</p>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onEdit} className="text-[var(--text-sub)] hover:text-[var(--text)] transition-colors"><Edit2 size={14}/></button>
        {!p.isBuiltIn && <button onClick={onDelete} className="text-[var(--text-sub)] hover:text-[var(--crit)] transition-colors"><Trash2 size={14}/></button>}
      </div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={"relative shrink-0 h-5 w-9 rounded-full transition-colors " + (on ? "bg-[var(--amber)]" : "bg-[var(--border-c)]")}>
      <span className={"absolute left-0 top-0.5 h-4 w-4 rounded-full bg-[var(--bg-void)] transition-transform " + (on ? "translate-x-4" : "translate-x-0.5")} />
    </button>
  );
}
