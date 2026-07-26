import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  ChevronRight, ChevronDown, Folder, FolderOpen, Database, Type, FileCode, Hash, 
  RefreshCw, Loader2, Search, Plus, Trash2, X, Star, Bookmark, Download, Upload, 
  Copy, Edit3, ArrowUp, Check, ExternalLink, ShieldAlert, Sparkles, Sliders
} from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { 
  getRegistryContentClient, 
  createRegistryKeyClient, 
  createRegistryValueClient, 
  deleteRegistryValueClient, 
  deleteRegistryKeyClient,
  searchMockRegistry,
  generateRegFileExport,
  type RegistryContent, 
  type RegistryNode,
  type RegistryValue,
  type RegistrySearchResult
} from "@/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/registry")({
  head: () => ({ 
    meta: [
      { title: "Registry Editor — NEXUS" }, 
      { name: "description", content: "Inspect, manage, edit, and export Windows Registry hives and keys." }
    ] 
  }),
  component: RegistryPage,
});

const TYPE_COLOR: Record<string, string> = {
  REG_SZ: "var(--teal)", 
  REG_DWORD: "var(--amber)", 
  REG_QWORD: "var(--amber)", 
  REG_BINARY: "var(--text-sub)",
  REG_MULTI_SZ: "var(--ok)", 
  REG_EXPAND_SZ: "var(--warn)",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  REG_SZ: <Type size={14} />,
  REG_DWORD: <Hash size={14} />,
  REG_QWORD: <Hash size={14} />,
  REG_BINARY: <FileCode size={14} />,
  REG_MULTI_SZ: <Type size={14} />,
  REG_EXPAND_SZ: <Type size={14} />
};

const DEFAULT_BOOKMARKS = [
  "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion",
  "HKEY_LOCAL_MACHINE\\SOFTWARE\\NEXUS\\Agent",
  "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\NEXUSAgent",
  "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\ComputerName\\ComputerName",
  "HKEY_CURRENT_USER\\Environment",
  "HKEY_CURRENT_USER\\SOFTWARE\\NEXUS"
];

function RegistryPage() {
  const [server, setServer] = useState("dc01");
  const [path, setPath] = useState("HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion");
  const [inputPath, setInputPath] = useState(path);
  const [content, setContent] = useState<RegistryContent>({ subKeys: [], values: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // Modals & Drawers
  const [isNewKeyOpen, setIsNewKeyOpen] = useState(false);
  const [isNewValueOpen, setIsNewValueOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<RegistryValue | null>(null);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("NEXUS_REGISTRY_BOOKMARKS");
      return saved ? JSON.parse(saved) : DEFAULT_BOOKMARKS;
    } catch {
      return DEFAULT_BOOKMARKS;
    }
  });

  const isBookmarked = bookmarks.includes(path);

  const toggleBookmark = (targetPath: string) => {
    let updated: string[];
    if (bookmarks.includes(targetPath)) {
      updated = bookmarks.filter(b => b !== targetPath);
      toast.info("Removed from bookmarks");
    } else {
      updated = [...bookmarks, targetPath];
      toast.success("Bookmark added");
    }
    setBookmarks(updated);
    localStorage.setItem("NEXUS_REGISTRY_BOOKMARKS", JSON.stringify(updated));
  };

  const fetchContent = useCallback(async (targetPath: string) => {
    setLoading(true);
    try {
      const data = await getRegistryContentClient(server, targetPath);
      setContent(data);
      setPath(targetPath);
      setInputPath(targetPath);
    } catch {
      toast.error("Failed to load registry path");
    } finally {
      setLoading(false);
    }
  }, [server]);

  useEffect(() => {
    fetchContent(path);
  }, [fetchContent, server]);

  const handleNavigateUp = () => {
    const parts = path.split("\\");
    if (parts.length > 1) {
      parts.pop();
      const parent = parts.join("\\");
      fetchContent(parent);
    }
  };

  const handleDeleteValue = async (name: string) => {
    if (!confirm(`Delete registry value "${name}"?`)) return;
    try {
      const ok = await deleteRegistryValueClient(server, path, name);
      if (ok) {
        toast.success(`Value "${name}" deleted`);
        fetchContent(path);
      } else {
        toast.error("Failed to delete value");
      }
    } catch {
      toast.error("Delete value failed");
    }
  };

  const handleDeleteCurrentKey = async () => {
    const parts = path.split("\\");
    if (parts.length <= 1) {
      toast.error("Cannot delete root hive key");
      return;
    }

    const keyName = parts[parts.length - 1];
    if (!confirm(`Are you sure you want to delete the key "${keyName}" and all its contents?`)) return;

    try {
      const ok = await deleteRegistryKeyClient(server, path);
      if (ok) {
        toast.success(`Key "${keyName}" deleted`);
        handleNavigateUp();
      } else {
        toast.error("Failed to delete key");
      }
    } catch {
      toast.error("Error deleting key");
    }
  };

  const handleExportReg = () => {
    const regText = generateRegFileExport(server, path);
    const blob = new Blob([regText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = `${path.replace(/\\/g, "_")}.reg`;
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}`);
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(path);
    toast.success("Registry path copied to clipboard");
  };

  const handlePathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPath !== path) {
      fetchContent(inputPath);
    }
  };

  const filteredValues = useMemo(() => {
    return content.values.filter(v => 
      search === "" || 
      v.name.toLowerCase().includes(search.toLowerCase()) || 
      v.data.toLowerCase().includes(search.toLowerCase()) ||
      v.type.toLowerCase().includes(search.toLowerCase())
    );
  }, [content.values, search]);

  return (
    <PageWrapper>
      <PageHeader 
        eyebrow="Infrastructure & System" 
        title="Registry Editor" 
        description="Inspect, modify, search, and export Windows Registry hives, subkeys, and value configurations."
      />

      {/* Top Controls & Navigation Bar */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <ServerSelector value={server} onChange={setServer} />

          {/* Address Bar */}
          <form onSubmit={handlePathSubmit} className="flex-1 flex gap-2 min-w-[320px]">
            <div className="relative flex-1">
              <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-sub)]" />
              <input
                type="text"
                value={inputPath}
                onChange={(e) => setInputPath(e.target.value)}
                placeholder="e.g. HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion"
                className="w-full bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-xl pl-9 pr-10 py-2 text-[13px] font-mono focus:outline-none focus:border-[var(--amber)] transition-all text-[var(--text)] shadow-inner"
              />
              <button
                type="button"
                onClick={handleCopyPath}
                title="Copy Path"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded"
              >
                <Copy size={13} />
              </button>
            </div>

            <button 
              type="button"
              onClick={handleNavigateUp}
              disabled={path.split("\\").length <= 1}
              title="Navigate Up"
              className="flex items-center justify-center bg-[var(--bg-card)] text-[var(--text-sub)] hover:text-[var(--text)] border border-[var(--border-dim)] rounded-xl px-3 hover:bg-[var(--bg-surface)] disabled:opacity-40 transition-colors"
            >
              <ArrowUp size={16} />
            </button>

            <button 
              type="submit"
              disabled={loading}
              className="flex items-center justify-center bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]/30 rounded-xl px-4 hover:bg-[var(--amber)]/20 transition-all font-semibold text-xs gap-1"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
              Go
            </button>
          </form>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleBookmark(path)}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                isBookmarked 
                  ? "bg-[var(--amber-low)] text-[var(--amber)] border-[var(--amber)]/40" 
                  : "bg-[var(--bg-card)] text-[var(--text-sub)] border-[var(--border-dim)] hover:text-[var(--text)]"
              }`}
              title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
            >
              <Star size={14} className={isBookmarked ? "fill-[var(--amber)]" : ""} />
              <span className="hidden sm:inline">{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
            </button>

            <button
              onClick={() => setIsGlobalSearchOpen(true)}
              className="p-2 bg-[var(--bg-card)] border border-[var(--border-dim)] text-[var(--text)] rounded-xl hover:border-[var(--amber)] transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
            >
              <Search size={14} className="text-[var(--amber)]" />
              <span className="hidden sm:inline">Search Registry</span>
            </button>

            <button
              onClick={handleExportReg}
              className="p-2 bg-[var(--bg-card)] border border-[var(--border-dim)] text-[var(--text)] rounded-xl hover:border-[var(--amber)] transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Export as .REG file"
            >
              <Download size={14} />
              <span className="hidden md:inline">Export REG</span>
            </button>

            <button
              onClick={() => setIsImportOpen(true)}
              className="p-2 bg-[var(--bg-card)] border border-[var(--border-dim)] text-[var(--text)] rounded-xl hover:border-[var(--amber)] transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Import .REG file script"
            >
              <Upload size={14} />
              <span className="hidden md:inline">Import REG</span>
            </button>
          </div>
        </div>

        {/* Quick Bookmarks Bar */}
        {bookmarks.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
            <span className="text-[var(--text-sub)] flex items-center gap-1 flex-shrink-0 font-sans font-semibold">
              <Bookmark size={12} className="text-[var(--amber)]" /> Quick Jumps:
            </span>
            {bookmarks.map(bm => {
              const shortName = bm.split("\\").pop() || bm;
              const active = bm === path;
              return (
                <button
                  key={bm}
                  onClick={() => fetchContent(bm)}
                  title={bm}
                  className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    active 
                      ? "bg-[var(--amber)] text-black font-bold border-[var(--amber)] shadow-sm" 
                      : "bg-[var(--bg-card)] text-[var(--text-sub)] border-[var(--border-dim)] hover:text-[var(--text)] hover:border-[var(--amber)]/50"
                  }`}
                >
                  <Folder size={11} />
                  {shortName}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Grid: Hive Tree Sidebar & Value Viewer Table */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        
        {/* Registry Tree Sidebar */}
        <div className="nx-card p-3 h-[calc(100vh-250px)] min-h-[500px] flex flex-col backdrop-blur-xl border border-[var(--border-dim)] shadow-lg overflow-hidden">
          <div className="flex items-center justify-between pb-3 px-2 border-b border-[var(--border-dim)] mb-2">
            <span className="eyebrow text-[var(--text-sub)] flex items-center gap-1.5">
              <Database size={13} className="text-[var(--amber)]" />
              Registry Hives
            </span>
            <span className="text-[10px] font-mono text-[var(--amber)] bg-[var(--amber-low)] px-2 py-0.5 rounded-full border border-[var(--amber)]/20">
              5 Root Hives
            </span>
          </div>

          <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
            <HiveNode name="HKEY_LOCAL_MACHINE" currentPath={path} onSelect={fetchContent} server={server} defaultOpen={path.startsWith("HKEY_LOCAL_MACHINE")} />
            <HiveNode name="HKEY_CURRENT_USER" currentPath={path} onSelect={fetchContent} server={server} defaultOpen={path.startsWith("HKEY_CURRENT_USER")} />
            <HiveNode name="HKEY_CLASSES_ROOT" currentPath={path} onSelect={fetchContent} server={server} defaultOpen={path.startsWith("HKEY_CLASSES_ROOT")} />
            <HiveNode name="HKEY_USERS" currentPath={path} onSelect={fetchContent} server={server} defaultOpen={path.startsWith("HKEY_USERS")} />
            <HiveNode name="HKEY_CURRENT_CONFIG" currentPath={path} onSelect={fetchContent} server={server} defaultOpen={path.startsWith("HKEY_CURRENT_CONFIG")} />
          </div>

          <div className="pt-3 mt-2 border-t border-[var(--border-dim)] text-[11px] text-[var(--text-sub)] flex items-center justify-between px-2">
            <span>Server: <strong className="text-[var(--text)] font-mono">{server}</strong></span>
            <span className="text-[var(--ok)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-pulse" />
              Online
            </span>
          </div>
        </div>

        {/* Values Table Panel */}
        <div className="nx-card overflow-hidden flex flex-col h-[calc(100vh-250px)] min-h-[500px] backdrop-blur-xl border border-[var(--border-dim)] shadow-xl relative">
          
          {/* Header Controls inside Card */}
          <div className="flex flex-wrap items-center justify-between p-3 border-b border-[var(--border-dim)] bg-[var(--bg-card)] gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <button 
                onClick={() => fetchContent(path)} 
                disabled={loading} 
                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-sub)] hover:text-[var(--text)] transition-colors"
                title="Refresh Registry Path"
              >
                <RefreshCw size={14} className={loading ? "animate-spin text-[var(--amber)]" : ""} />
              </button>
              
              <div className="flex flex-col overflow-hidden">
                <span className="text-[12px] font-mono text-[var(--text)] font-semibold truncate max-w-[450px]" title={path}>
                  {path}
                </span>
                <span className="text-[10px] text-[var(--text-sub)]">
                  {content.subKeys.length} subkeys • {content.values.length} values
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-sub)]" />
                <input
                  type="text"
                  placeholder="Filter key values..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-40 sm:w-48 bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-lg pl-8 pr-3 py-1.5 text-[12px] focus:outline-none focus:border-[var(--amber)] transition-colors text-[var(--text)] placeholder:text-[var(--text-sub)]"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-sub)] hover:text-[var(--text)]">
                    <X size={12} />
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsNewKeyOpen(true)}
                className="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border-dim)] text-[var(--text)] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold hover:border-[var(--amber)] transition-colors"
              >
                <Plus size={12} /> Subkey
              </button>

              <button
                onClick={() => setIsNewValueOpen(true)}
                className="flex items-center gap-1 bg-[var(--amber)] text-black px-2.5 py-1.5 rounded-lg text-[11px] font-bold hover:bg-[var(--amber-hover)] transition-colors shadow-sm"
              >
                <Plus size={12} /> New Value
              </button>

              {path.split("\\").length > 1 && (
                <button
                  onClick={handleDeleteCurrentKey}
                  className="p-1.5 text-[var(--text-sub)] hover:text-[var(--crit)] hover:bg-[var(--crit)]/10 rounded-lg transition-colors"
                  title="Delete Entire Current Key"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Table Area */}
          <div className="overflow-auto flex-1 bg-[var(--bg-surface)]/20">
            <table className="w-full text-[12px] border-collapse">
              <thead className="sticky top-0 bg-[var(--bg-card)] z-10 shadow-sm">
                <tr className="eyebrow text-left border-b border-[var(--border-dim)] text-[var(--text-sub)]">
                  <th className="px-5 py-3 w-[28%] font-semibold">Name</th>
                  <th className="px-5 py-3 w-[18%] font-semibold">Type</th>
                  <th className="px-5 py-3 w-[44%] font-semibold">Data</th>
                  <th className="px-5 py-3 w-[10%] text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center text-[var(--text-sub)]">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--amber)]" />
                      Reading registry values...
                    </td>
                  </tr>
                ) : content.values.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center text-[var(--text-sub)]">
                      <Folder className="w-8 h-8 text-[var(--text-sub)] opacity-40 mx-auto mb-2" />
                      <p className="font-medium text-[var(--text)]">No values set in this key</p>
                      <p className="text-[11px] mt-1">Click "New Value" above to define a registry property.</p>
                    </td>
                  </tr>
                ) : filteredValues.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-[var(--text-sub)]">
                      No registry values match filter "{search}".
                    </td>
                  </tr>
                ) : (
                  filteredValues.map((v) => (
                    <tr 
                      key={v.name} 
                      className="border-b border-[var(--border-dim)]/50 hover:bg-[var(--bg-surface)]/80 transition-colors group"
                    >
                      {/* Name */}
                      <td className="px-5 py-2.5 text-[var(--text)] font-semibold truncate max-w-[220px]" title={v.name}>
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--text-sub)] group-hover:text-[var(--amber)] transition-colors">
                            {TYPE_ICON[v.type] || <FileCode size={14}/>}
                          </span>
                          <span className="truncate">{v.name}</span>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-5 py-2.5">
                        <span 
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border"
                          style={{ 
                            color: TYPE_COLOR[v.type] || "var(--text-sub)",
                            borderColor: `${TYPE_COLOR[v.type] || "var(--border-dim)"}40`,
                            backgroundColor: `${TYPE_COLOR[v.type] || "var(--border-dim)"}15`
                          }}
                        >
                          {v.type}
                        </span>
                      </td>

                      {/* Data */}
                      <td className="px-5 py-2.5 text-[var(--text-sub)] break-words max-w-[340px]">
                        {v.data === "" ? (
                          <span className="opacity-40 italic">(value not set)</span>
                        ) : v.type === "REG_MULTI_SZ" ? (
                          <div className="whitespace-pre-wrap text-[11px] bg-[var(--bg-void)]/40 p-1 rounded border border-[var(--border-dim)]/30">
                            {v.data}
                          </div>
                        ) : (
                          <span className="text-[var(--text)] font-mono">{v.data}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingValue(v)}
                            className="p-1 rounded-md text-[var(--text-sub)] hover:text-[var(--amber)] hover:bg-[var(--bg-surface)] transition-colors"
                            title="Edit value"
                          >
                            <Edit3 size={13} />
                          </button>

                          {v.name !== "(Default)" && (
                            <button
                              onClick={() => handleDeleteValue(v.name)}
                              className="p-1 rounded-md text-[var(--text-sub)] hover:text-[var(--crit)] hover:bg-[var(--crit)]/10 transition-colors"
                              title="Delete value"
                            >
                              <Trash2 size={13} />
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

          {/* Bottom Status Bar */}
          <div className="p-2 border-t border-[var(--border-dim)] bg-[var(--bg-card)] flex items-center justify-between text-[11px] text-[var(--text-sub)]">
            <span>Path: <strong className="text-[var(--text)] font-mono">{path}</strong></span>
            <span className="font-mono">{filteredValues.length} displayed</span>
          </div>
        </div>
      </div>

      {/* New Key Modal */}
      {isNewKeyOpen && (
        <NewKeyModal
          server={server}
          path={path}
          onClose={() => setIsNewKeyOpen(false)}
          onCreated={() => {
            setIsNewKeyOpen(false);
            fetchContent(path);
          }}
        />
      )}

      {/* New Value Modal */}
      {isNewValueOpen && (
        <NewValueModal
          server={server}
          path={path}
          onClose={() => setIsNewValueOpen(false)}
          onCreated={() => {
            setIsNewValueOpen(false);
            fetchContent(path);
          }}
        />
      )}

      {/* Edit Value Modal */}
      {editingValue && (
        <EditValueModal
          server={server}
          path={path}
          value={editingValue}
          onClose={() => setEditingValue(null)}
          onSaved={() => {
            setEditingValue(null);
            fetchContent(path);
          }}
        />
      )}

      {/* Global Registry Search Modal */}
      {isGlobalSearchOpen && (
        <GlobalSearchModal
          server={server}
          onClose={() => setIsGlobalSearchOpen(false)}
          onSelectPath={(targetPath) => {
            setIsGlobalSearchOpen(false);
            fetchContent(targetPath);
          }}
        />
      )}

      {/* Import REG Modal */}
      {isImportOpen && (
        <ImportRegModal
          server={server}
          currentPath={path}
          onClose={() => setIsImportOpen(false)}
          onImported={() => {
            setIsImportOpen(false);
            fetchContent(path);
          }}
        />
      )}
    </PageWrapper>
  );
}

// Modal for Creating New Subkey
function NewKeyModal({ server, path, onClose, onCreated }: { server: string; path: string; onClose: () => void; onCreated: () => void }) {
  const [keyName, setKeyName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    setSubmitting(true);
    try {
      const ok = await createRegistryKeyClient(server, path, keyName.trim());
      if (ok) {
        toast.success(`Key "${keyName}" created`);
        onCreated();
      } else {
        toast.error("Failed to create registry key");
      }
    } catch {
      toast.error("Creation error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <Folder size={18} className="text-[var(--amber)]" />
            <h3 className="text-base font-bold text-[var(--text)]">Create Registry Key</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Parent Key Path</label>
            <input disabled value={path} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text-sub)] font-mono" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">New Key Name</label>
            <input
              required
              autoFocus
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g. SecurityPolicies"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            />
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting || !keyName.trim()} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Creating..." : "Create Key"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Modal for Creating New Registry Value
function NewValueModal({ server, path, onClose, onCreated }: { server: string; path: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<RegistryValue["type"]>("REG_SZ");
  const [data, setData] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const ok = await createRegistryValueClient(server, path, name.trim(), type, data);
      if (ok) {
        toast.success(`Value "${name}" created`);
        onCreated();
      } else {
        toast.error("Failed to create registry value");
      }
    } catch {
      toast.error("Creation error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-[var(--amber)]" />
            <h3 className="text-base font-bold text-[var(--text)]">Create Registry Value</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Value Name</label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MaxConnections"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Value Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            >
              <option value="REG_SZ">REG_SZ (String)</option>
              <option value="REG_DWORD">REG_DWORD (32-bit Integer)</option>
              <option value="REG_QWORD">REG_QWORD (64-bit Integer)</option>
              <option value="REG_BINARY">REG_BINARY (Binary Bytes)</option>
              <option value="REG_MULTI_SZ">REG_MULTI_SZ (Multi-String)</option>
              <option value="REG_EXPAND_SZ">REG_EXPAND_SZ (Expandable String)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Value Data</label>
            {type === "REG_MULTI_SZ" ? (
              <textarea
                rows={3}
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="Line 1&#10;Line 2&#10;Line 3"
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] p-3 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
              />
            ) : (
              <input
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder={type === "REG_DWORD" ? "e.g. 0x00000001 (1)" : "Enter value data..."}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
              />
            )}
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting || !name.trim()} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Creating..." : "Create Value"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Modal for Editing Existing Value
function EditValueModal({ server, path, value, onClose, onSaved }: { server: string; path: string; value: RegistryValue; onClose: () => void; onSaved: () => void }) {
  const [data, setData] = useState(value.data);
  const [type, setType] = useState(value.type);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await createRegistryValueClient(server, path, value.name, type, data);
      if (ok) {
        toast.success(`Value "${value.name}" updated`);
        onSaved();
      } else {
        toast.error("Failed to update value");
      }
    } catch {
      toast.error("Update error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <Edit3 size={18} className="text-[var(--amber)]" />
            <h3 className="text-base font-bold text-[var(--text)]">Edit Registry Value</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Value Name</label>
            <input disabled value={value.name} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono font-bold" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            >
              <option value="REG_SZ">REG_SZ (String)</option>
              <option value="REG_DWORD">REG_DWORD (32-bit Integer)</option>
              <option value="REG_QWORD">REG_QWORD (64-bit Integer)</option>
              <option value="REG_BINARY">REG_BINARY (Binary Bytes)</option>
              <option value="REG_MULTI_SZ">REG_MULTI_SZ (Multi-String)</option>
              <option value="REG_EXPAND_SZ">REG_EXPAND_SZ (Expandable String)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Value Data</label>
            {type === "REG_MULTI_SZ" ? (
              <textarea
                rows={4}
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] p-3 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
              />
            ) : (
              <input
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
              />
            )}
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Global Registry Search Dialog
function GlobalSearchModal({ server, onClose, onSelectPath }: { server: string; onClose: () => void; onSelectPath: (path: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RegistrySearchResult[]>([]);

  useEffect(() => {
    if (query.trim().length >= 2) {
      const res = searchMockRegistry(server, query.trim());
      setResults(res);
    } else {
      setResults([]);
    }
  }, [query, server]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-[var(--amber)]" />
            <h3 className="text-base font-bold text-[var(--text)]">Global Registry Search</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-[var(--border-dim)] bg-[var(--bg-card)]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-sub)]" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search keys, value names, or value data across all hives..."
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono focus:border-[var(--amber)] focus:outline-none text-[var(--text)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
          {query.trim().length < 2 ? (
            <div className="text-center py-12 text-[var(--text-sub)]">
              Type at least 2 characters to search registry keys and values.
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-sub)]">
              No registry keys or values matching "{query}".
            </div>
          ) : (
            results.map((res, idx) => (
              <div 
                key={idx}
                onClick={() => onSelectPath(res.path)}
                className="p-3 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-surface)]/50 hover:bg-[var(--bg-surface)] hover:border-[var(--amber)]/50 transition-all cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${res.type === "Key" ? "bg-[var(--amber-low)] text-[var(--amber)]" : "bg-[var(--teal-low)] text-[var(--teal)]"}`}>
                      {res.type}
                    </span>
                    <span className="font-semibold text-[var(--text)] truncate">{res.path}</span>
                  </div>
                  {res.type === "Value" && (
                    <div className="text-[11px] text-[var(--text-sub)] pl-2 border-l-2 border-[var(--amber)]/40 mt-1">
                      <strong>{res.valueName}</strong> ({res.valueType}) = <span className="text-[var(--text)]">{res.data}</span>
                    </div>
                  )}
                </div>
                <ChevronRight size={16} className="text-[var(--text-sub)] group-hover:text-[var(--amber)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-[var(--border-dim)] bg-[var(--bg-surface)] text-[11px] text-[var(--text-sub)] flex items-center justify-between">
          <span>Results: <strong>{results.length}</strong> matches</span>
          <span>Click result to jump to path</span>
        </div>
      </div>
    </div>
  );
}

// Modal for Importing .REG Script
function ImportRegModal({ server, currentPath, onClose, onImported }: { server: string; currentPath: string; onClose: () => void; onImported: () => void }) {
  const [regText, setRegText] = useState(`Windows Registry Editor Version 5.00\n\n[${currentPath}]\n"NewParam"="Enabled"\n"Timeout"=dword:0000003c`);
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    setImporting(true);
    try {
      // Parse .reg text
      const lines = regText.split("\n");
      let activePath = currentPath;
      let count = 0;

      for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith(";") || line.startsWith("Windows Registry")) continue;

        if (line.startsWith("[") && line.endsWith("]")) {
          activePath = line.slice(1, -1);
          await createRegistryKeyClient(server, activePath.split("\\").slice(0, -1).join("\\"), activePath.split("\\").pop() || "");
        } else if (line.includes("=")) {
          const eqIdx = line.indexOf("=");
          let keyName = line.slice(0, eqIdx).replace(/^"|"$/g, "");
          if (keyName === "@") keyName = "(Default)";
          let valRaw = line.slice(eqIdx + 1);

          let valType = "REG_SZ";
          let valData = valRaw.replace(/^"|"$/g, "");

          if (valRaw.startsWith("dword:")) {
            valType = "REG_DWORD";
            const hex = valRaw.replace("dword:", "");
            valData = `0x${hex.toUpperCase()} (${parseInt(hex, 16) || 0})`;
          }

          await createRegistryValueClient(server, activePath, keyName, valType, valData);
          count++;
        }
      }

      toast.success(`Successfully imported ${count} registry keys/values`);
      onImported();
    } catch {
      toast.error("Failed to parse and import .REG content");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-[var(--amber)]" />
            <h3 className="text-base font-bold text-[var(--text)]">Import .REG Script</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-[var(--text-sub)]">
            Paste Windows Registry Editor format script (.reg) to execute updates on <strong className="text-[var(--text)]">{server}</strong>:
          </p>

          <textarea
            rows={10}
            value={regText}
            onChange={(e) => setRegText(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] p-3 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
          />
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={importing || !regText.trim()} onClick={handleImport} className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50 flex items-center gap-1.5">
            {importing && <Loader2 size={13} className="animate-spin" />}
            {importing ? "Importing..." : "Execute Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Recursive Registry Tree Node
function HiveNode({ name, currentPath, onSelect, server, defaultOpen = false }: { name: string, currentPath: string, onSelect: (path: string) => void, server: string, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [subKeys, setSubKeys] = useState<RegistryNode[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSubKeys, setHasSubKeys] = useState(true);
  const isSelected = currentPath === name;

  const toggleOpen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && !subKeys) {
      setLoading(true);
      try {
        const data = await getRegistryContentClient(server, name);
        setSubKeys(data.subKeys);
        if (data.subKeys.length === 0) setHasSubKeys(false);
      } finally {
        setLoading(false);
      }
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = () => {
    onSelect(name);
  };

  const displayName = name.split("\\").pop() || name;

  return (
    <div className="pl-2.5 relative my-0.5">
      {/* Visual connector line */}
      {isOpen && (
        <div className="absolute left-[11px] top-6 bottom-0 w-[1px] bg-[var(--border-dim)]/60" />
      )}
      
      <div 
        className={`flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-all ${
          isSelected 
            ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/30" 
            : "hover:bg-[var(--bg-surface)] text-[var(--text)]"
        }`}
        onClick={handleSelect}
      >
        <button 
          onClick={toggleOpen} 
          disabled={!hasSubKeys}
          className={`p-0.5 rounded hover:bg-[var(--border-c)]/50 flex-shrink-0 transition-colors ${!hasSubKeys ? "opacity-30 cursor-default" : ""}`}
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin text-[var(--amber)]" />
          ) : isOpen ? (
            <ChevronDown size={12} />
          ) : (
            <ChevronRight size={12} />
          )}
        </button>

        <span className="flex items-center gap-2 font-mono text-[11px] truncate" title={name}>
          {isOpen ? (
            <FolderOpen size={14} className="text-[var(--amber)] flex-shrink-0" />
          ) : (
            <Folder size={14} className="text-[var(--amber)] opacity-80 flex-shrink-0" />
          )}
          <span className="truncate">{displayName}</span>
        </span>
      </div>
      
      {isOpen && subKeys && (
        <div className="mt-0.5 pl-1">
          {subKeys.map(sk => (
            <HiveNode 
              key={sk.path} 
              name={sk.path} 
              currentPath={currentPath} 
              onSelect={onSelect} 
              server={server}
              defaultOpen={currentPath.startsWith(sk.path) && currentPath !== sk.path}
            />
          ))}
        </div>
      )}
    </div>
  );
}
