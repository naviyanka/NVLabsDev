import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Database, Type, FileCode, Hash, RefreshCw, Loader2, Search, Plus, Trash2, X } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { getRegistryContentClient, createRegistryKeyClient, createRegistryValueClient, deleteRegistryValueClient, type RegistryContent, type RegistryNode } from "@/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/registry")({
  head: () => ({ meta: [{ title: "Registry — NEXUS" }, { name: "description", content: "Read and explore Windows registry hives." }] }),
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

function RegistryPage() {
  const [server, setServer] = useState("localhost");
  const [path, setPath] = useState("HKEY_LOCAL_MACHINE\\SOFTWARE");
  const [inputPath, setInputPath] = useState(path);
  const [content, setContent] = useState<RegistryContent>({ subKeys: [], values: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  const [isNewKeyOpen, setIsNewKeyOpen] = useState(false);
  const [isNewValueOpen, setIsNewValueOpen] = useState(false);

  const fetchContent = useCallback(async (targetPath: string) => {
    setLoading(true);
    try {
      const data = await getRegistryContentClient(server, targetPath);
      setContent(data);
      setPath(targetPath);
      setInputPath(targetPath);
    } finally {
      setLoading(false);
    }
  }, [server]);

  useEffect(() => {
    fetchContent(path);
  }, [fetchContent]);

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
    } catch (e) {
      toast.error("Delete failed");
    }
  }; // path is handled manually now

  const handlePathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPath !== path) {
      fetchContent(inputPath);
    }
  };

  const filteredValues = content.values.filter(v => 
    search === "" || v.name.toLowerCase().includes(search.toLowerCase()) || v.data.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageWrapper>
      <PageHeader eyebrow="Infrastructure" title="Registry Editor" />
      <div className="flex items-center gap-4 mb-4">
        <ServerSelector value={server} onChange={setServer} />
        
        <form onSubmit={handlePathSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-sub)]" />
            <input
              type="text"
              value={inputPath}
              onChange={(e) => setInputPath(e.target.value)}
              placeholder="e.g. HKEY_LOCAL_MACHINE\SOFTWARE"
              className="w-full bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg pl-9 pr-4 py-2 text-[13px] font-mono focus:outline-none focus:border-[var(--amber)] transition-colors text-[var(--text)]"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center justify-center bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]/30 rounded-lg px-4 hover:bg-[var(--amber)]/20 transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        <div className="nx-card p-3 h-[calc(100vh-220px)] overflow-y-auto backdrop-blur-xl border border-[var(--border-dim)] shadow-lg">
          <div className="eyebrow pb-3 pl-2 text-[var(--text-sub)]">Registry Hives</div>
          
          <HiveNode name="HKEY_LOCAL_MACHINE" currentPath={path} onSelect={fetchContent} server={server} defaultOpen={path.startsWith("HKEY_LOCAL_MACHINE")} />
          <HiveNode name="HKEY_CURRENT_USER" currentPath={path} onSelect={fetchContent} server={server} defaultOpen={path.startsWith("HKEY_CURRENT_USER")} />
          <HiveNode name="HKEY_CLASSES_ROOT" currentPath={path} onSelect={fetchContent} server={server} defaultOpen={path.startsWith("HKEY_CLASSES_ROOT")} />
          <HiveNode name="HKEY_USERS" currentPath={path} onSelect={fetchContent} server={server} defaultOpen={path.startsWith("HKEY_USERS")} />
          <HiveNode name="HKEY_CURRENT_CONFIG" currentPath={path} onSelect={fetchContent} server={server} defaultOpen={path.startsWith("HKEY_CURRENT_CONFIG")} />
        </div>

        <div className="nx-card overflow-hidden flex flex-col h-[calc(100vh-220px)] backdrop-blur-xl border border-[var(--border-dim)] shadow-xl relative">
          <div className="flex items-center justify-between p-3 border-b border-[var(--border-dim)] bg-[var(--bg-card)]">
            <div className="flex items-center gap-2">
              <button onClick={() => fetchContent(path)} disabled={loading} className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-sub)] hover:text-[var(--text)] transition-colors">
                <RefreshCw size={14} className={loading ? "animate-spin text-[var(--amber)]" : ""} />
              </button>
              <span className="text-[12px] text-[var(--text-sub)] font-mono truncate max-w-[400px]" title={path}>{path}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-sub)]" />
                <input
                  type="text"
                  placeholder="Filter values..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-44 bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-md pl-8 pr-3 py-1.5 text-[12px] focus:outline-none focus:border-[var(--amber)] transition-colors text-[var(--text)] placeholder:text-[var(--text-sub)]"
                />
              </div>
              <button
                onClick={() => setIsNewKeyOpen(true)}
                className="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border-dim)] text-[var(--text)] px-2.5 py-1.5 rounded-md text-[11px] font-semibold hover:border-[var(--amber)] transition-colors"
              >
                <Plus size={12} /> New Key
              </button>
              <button
                onClick={() => setIsNewValueOpen(true)}
                className="flex items-center gap-1 bg-[var(--amber)] text-black px-2.5 py-1.5 rounded-md text-[11px] font-semibold hover:bg-[var(--amber-hover)] transition-colors"
              >
                <Plus size={12} /> New Value
              </button>
            </div>
          </div>

          <div className="overflow-auto flex-1 bg-[var(--bg-surface)]/30">
            <table className="w-full text-[13px] border-collapse">
              <thead className="sticky top-0 bg-[var(--bg-card)] z-10 shadow-sm">
                <tr className="eyebrow text-left">
                  <th className="px-5 py-3 border-b border-[var(--border-dim)] w-[30%]">Name</th>
                  <th className="px-5 py-3 border-b border-[var(--border-dim)] w-[20%]">Type</th>
                  <th className="px-5 py-3 border-b border-[var(--border-dim)] w-[40%]">Data</th>
                  <th className="px-5 py-3 border-b border-[var(--border-dim)] w-[10%] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="mono">
                {loading ? (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-[var(--text-sub)]"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--amber)]" />Reading registry...</td></tr>
                ) : content.values.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-[var(--text-sub)]">No values in this key.</td></tr>
                ) : filteredValues.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-[var(--text-sub)]">No values match filter.</td></tr>
                ) : (
                  filteredValues.map((v) => (
                    <tr key={v.name} className="border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] transition-colors">
                      <td className="px-5 py-2.5 text-[var(--text)] font-medium truncate max-w-[200px]" title={v.name}>{v.name}</td>
                      <td className="px-5 py-2.5 flex items-center gap-2">
                        <span style={{ color: TYPE_COLOR[v.type] || "var(--text-sub)" }}>{TYPE_ICON[v.type] || <FileCode size={14}/>}</span>
                        <span className="text-[11px]" style={{ color: TYPE_COLOR[v.type] || "var(--text-sub)" }}>{v.type}</span>
                      </td>
                      <td className="px-5 py-2.5 text-[var(--text-sub)] break-words max-w-[300px]">
                        {v.data === "" ? <span className="opacity-40 italic">(value not set)</span> : v.data}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {v.name !== "(Default)" && (
                          <button
                            onClick={() => handleDeleteValue(v.name)}
                            className="p-1 rounded text-[var(--text-sub)] hover:text-[var(--crit)] hover:bg-[var(--crit)]/10 transition-colors"
                            title="Delete value"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
    </PageWrapper>
  );
}

function NewKeyModal({ server, path, onClose, onCreated }: { server: string; path: string; onClose: () => void; onCreated: () => void }) {
  const [keyName, setKeyName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await createRegistryKeyClient(server, path, keyName);
      if (ok) {
        toast.success(`Key "${keyName}" created`);
        onCreated();
      } else {
        toast.error("Failed to create registry key");
      }
    } catch (e) {
      toast.error("Creation error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <h3 className="text-base font-bold text-[var(--text)]">Create Registry Key</h3>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Parent Path</label>
            <input disabled value={path} className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text-sub)] font-mono" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">New Key Name</label>
            <input
              required
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g. MyConfig"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            />
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Creating..." : "Create Key"}
          </button>
        </div>
      </form>
    </div>
  );
}

function NewValueModal({ server, path, onClose, onCreated }: { server: string; path: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("REG_SZ");
  const [data, setData] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await createRegistryValueClient(server, path, name, type, data);
      if (ok) {
        toast.success(`Value "${name}" created`);
        onCreated();
      } else {
        toast.error("Failed to create registry value");
      }
    } catch (e) {
      toast.error("Creation error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <h3 className="text-base font-bold text-[var(--text)]">Create Registry Value</h3>
          <button type="button" onClick={onClose} className="text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Value Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MaxConnections"
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            >
              <option value="REG_SZ">REG_SZ (String)</option>
              <option value="REG_DWORD">REG_DWORD (32-bit Number)</option>
              <option value="REG_BINARY">REG_BINARY (Binary Data)</option>
              <option value="REG_MULTI_SZ">REG_MULTI_SZ (Multi-String)</option>
              <option value="REG_EXPAND_SZ">REG_EXPAND_SZ (Expandable String)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Value Data</label>
            <input
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="Enter value content..."
              className="w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            />
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-c)] flex justify-end gap-3 bg-[var(--bg-surface)]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)] disabled:opacity-50">
            {submitting ? "Creating..." : "Create Value"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Recursive Tree Node Component
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

  return (
    <div className="pl-3 relative">
      {/* Connector line */}
      <div className="absolute left-[11px] top-6 bottom-0 w-[1px] bg-[var(--border-dim)]" style={{ display: isOpen ? 'block' : 'none' }} />
      
      <div 
        className={`flex items-center gap-1.5 py-1 px-1.5 rounded-md cursor-pointer transition-colors ${isSelected ? "bg-[var(--amber-low)] text-[var(--amber)]" : "hover:bg-[var(--bg-surface)] text-[var(--text)]"}`}
        onClick={handleSelect}
      >
        <button 
          onClick={toggleOpen} 
          disabled={!hasSubKeys}
          className={`p-0.5 rounded-sm hover:bg-[var(--border-c)] flex-shrink-0 ${!hasSubKeys ? "opacity-30 cursor-default" : ""}`}
        >
          {loading ? <Loader2 size={12} className="animate-spin text-[var(--amber)]" /> : 
           isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        <span className="flex items-center gap-2 font-mono text-[11px] truncate" title={name.split('\\').pop()}>
          {isOpen ? <FolderOpen size={13} className="text-[var(--amber)] opacity-80" /> : <Folder size={13} className="text-[var(--amber)] opacity-80" />}
          {name.split('\\').pop()}
        </span>
      </div>
      
      {isOpen && subKeys && (
        <div className="mt-0.5">
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
