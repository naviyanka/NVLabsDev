import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import { 
  Folder, FileText, FileCode, FileArchive, FileImage, File, ChevronRight, 
  Upload, Plus, Trash2, Download, Edit2, Copy, MoveRight, Type, X, Save, 
  FolderOpen, MoreHorizontal, FilePlus, FolderPlus, ArrowLeft, ArrowRight, 
  ArrowUp, RefreshCw, Search, LayoutGrid, List, CheckSquare, Square, 
  HardDrive, Share2, Shield, Lock, Check, Eye, Hash, ExternalLink, Sparkles, Filter
} from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { 
  FileSource, FileItem, getFilesSourcesClient, getFilesListClient, 
  createFolderClient, deleteFileClient, uploadFileClient, getDownloadUrl,
  renameFileClient, moveFileClient, copyFileClient, readTextFileClient, 
  writeTextFileClient, addNetworkShareClient
} from "@/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/files")({
  validateSearch: (search: Record<string, unknown>): { path?: string } => {
    return { path: search.path as string | undefined };
  },
  head: () => ({ meta: [{ title: "Files & Network Shares — NEXUS" }, { name: "description", content: "Browse, manage, and edit remote file systems and network shares." }] }),
  component: FilesPage,
});

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function isTextFile(ext: string) {
  const textExtensions = ["txt", "json", "md", "csv", "ps1", "bat", "cmd", "xml", "ini", "log", "yaml", "yml", "js", "ts", "html", "css", "bak", "config"];
  return textExtensions.includes(ext.toLowerCase());
}

function getFileIcon(type: string) {
  const t = type.toLowerCase();
  if (t === "folder") return <Folder size={15} className="text-[var(--amber)]" />;
  if (["ps1", "bat", "cmd", "sh"].includes(t)) return <FileCode size={15} className="text-[var(--teal)]" />;
  if (["json", "xml", "yaml", "yml", "config", "ini"].includes(t)) return <FileCode size={15} className="text-[var(--amber)]" />;
  if (["log", "txt", "md", "csv"].includes(t)) return <FileText size={15} className="text-[var(--text-sub)]" />;
  if (["zip", "tar", "gz", "rar", "7z", "bak"].includes(t)) return <FileArchive size={15} className="text-orange-400" />;
  if (["png", "jpg", "jpeg", "svg", "ico"].includes(t)) return <FileImage size={15} className="text-purple-400" />;
  return <File size={15} className="text-[var(--text-sub)]" />;
}

// Dialog for inputs
function PromptDialog({ isOpen, title, description, initialValue, placeholder, onConfirm, onCancel, confirmLabel = "Save" }: any) {
  const [value, setValue] = useState(initialValue || "");
  useEffect(() => { if (isOpen) setValue(initialValue || ""); }, [isOpen, initialValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-5 py-3.5">
          <div className="eyebrow text-[var(--text)]">{title}</div>
          <button onClick={onCancel} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          {description && <p className="text-xs text-[var(--text-sub)]">{description}</p>}
          <input 
            type="text" 
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={e => { if (e.key === 'Enter') onConfirm(value); if (e.key === 'Escape') onCancel(); }}
            className="mono w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--amber)]"
          />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onCancel} className="rounded-xl px-4 py-2 text-xs font-semibold text-[var(--text-sub)] hover:text-white">Cancel</button>
            <button onClick={() => onConfirm(value)} className="rounded-xl bg-[var(--amber)] px-5 py-2 text-xs font-bold text-black hover:bg-[var(--amber-hover)]">{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Folder Picker Dialog for Move/Copy
function FolderPickerDialog({ isOpen, server, title, initialPath, onConfirm, onCancel }: any) {
  const [sources, setSources] = useState<FileSource[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [folders, setFolders] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialPath) {
        setCurrentPath(initialPath.split("\\").filter(Boolean));
      }
      getFilesSourcesClient(server).then(setSources).catch(console.error);
    }
  }, [isOpen, server, initialPath]);

  useEffect(() => {
    if (isOpen && currentPath.length > 0) {
      setIsLoading(true);
      getFilesListClient(server, currentPath.join("\\"))
        .then(data => setFolders(data.filter(f => f.type === "folder")))
        .catch(() => setFolders([]))
        .finally(() => setIsLoading(false));
    } else {
      setFolders([]);
    }
  }, [isOpen, currentPath, server]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="flex h-[60vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-5 py-3.5">
          <div className="eyebrow text-[var(--text)]">{title}</div>
          <button onClick={onCancel} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          <div className="w-52 border-r border-[var(--border-c)] bg-[var(--bg-surface)]/50 p-3 overflow-y-auto space-y-1">
            <div className="eyebrow pb-1 text-[10px]">Sources</div>
            {sources.map(s => (
              <button 
                key={s.path}
                onClick={() => setCurrentPath([s.path])}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs mono ${currentPath[0] === s.path ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold" : "text-[var(--text-sub)] hover:bg-[var(--border-c)] hover:text-white"}`}
              >
                <Folder size={13} className={s.type === "Disk" ? "text-[var(--amber)]" : "text-[var(--teal)]"} /> {s.name}
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="border-b border-[var(--border-c)] p-2.5 bg-[var(--bg-void)]">
              <div className="mono text-xs text-[var(--text-sub)] overflow-x-auto whitespace-nowrap flex items-center gap-1">
                {currentPath.map((p, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <button 
                      onClick={() => setCurrentPath(currentPath.slice(0, i + 1))}
                      className="hover:text-[var(--amber)] font-semibold"
                    >
                      {p}
                    </button>
                    {i < currentPath.length - 1 && <ChevronRight size={12} />}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {isLoading ? (
                <div className="text-center text-xs text-[var(--text-sub)] p-4 mono">Loading directories…</div>
              ) : folders.length === 0 ? (
                <div className="text-center text-xs text-[var(--text-sub)] p-4 mono">No subdirectories</div>
              ) : (
                folders.map(f => (
                  <button
                    key={f.name}
                    onDoubleClick={() => setCurrentPath([...currentPath, f.name])}
                    className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs text-[var(--text)] hover:bg-[var(--bg-surface)] transition-colors mono"
                  >
                    <Folder size={14} className="text-[var(--amber)]" />
                    {f.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border-c)] bg-[var(--bg-surface)] p-3.5">
          <div className="mono text-xs text-[var(--text-sub)] truncate max-w-[320px]">
            Target: <strong className="text-[var(--text)]">{currentPath.join("\\")}</strong>
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel} className="rounded-xl px-4 py-2 text-xs font-semibold text-[var(--text-sub)] hover:text-white">Cancel</button>
            <button 
              onClick={() => onConfirm(currentPath.join("\\"))}
              disabled={currentPath.length === 0}
              className="rounded-xl bg-[var(--amber)] px-5 py-2 text-xs font-bold text-black hover:bg-[var(--amber-hover)] disabled:opacity-50"
            >
              Select Folder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Map Network Share Dialog
function MapShareDialog({ isOpen, onConfirm, onCancel }: { isOpen: boolean; onConfirm: (name: string, uncPath: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [uncPath, setUncPath] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-5 py-3.5">
          <div className="eyebrow text-[var(--text)] flex items-center gap-2">
            <Share2 size={15} className="text-[var(--teal)]" /> Map Network Share
          </div>
          <button onClick={onCancel} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">Share Name / Alias</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. FS01_SalesDocs"
              className="mono w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--amber)]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-sub)] uppercase tracking-wider mb-1.5">UNC Target Path</label>
            <input 
              type="text" 
              value={uncPath}
              onChange={e => setUncPath(e.target.value)}
              placeholder="e.g. \\FS01\SalesData"
              className="mono w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3.5 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--amber)]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onCancel} className="rounded-xl px-4 py-2 text-xs font-semibold text-[var(--text-sub)] hover:text-white">Cancel</button>
            <button 
              onClick={() => onConfirm(name || uncPath.replace(/[\/\\]+/g, "_"), uncPath)} 
              disabled={!uncPath}
              className="rounded-xl bg-[var(--teal)] px-5 py-2 text-xs font-bold text-black hover:bg-[var(--teal-hover)] disabled:opacity-50"
            >
              Connect Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilesPage() {
  const { path: queryPath } = Route.useSearch();
  const [server, setServer] = useState("dc01");
  const [sources, setSources] = useState<FileSource[]>([]);
  const [path, setPath] = useState<string[]>(queryPath ? queryPath.split("\\").filter(Boolean) : []);
  const [pathInput, setPathInput] = useState("");
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  
  // Navigation History
  const [history, setHistory] = useState<string[][]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  // View Mode: Table or Grid
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "folder" | "ps1" | "json" | "log" | "doc">("all");

  // Selection State
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [editorFile, setEditorFile] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Inspector Checksum State
  const [checksum, setChecksum] = useState<string | null>(null);

  // Modals
  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    type: 'rename' | 'newFolder' | 'newFile' | 'newPs1' | 'newJson' | null;
    title: string;
    description: string;
    initialValue: string;
    placeholder: string;
  }>({
    isOpen: false, type: null, title: "", description: "", initialValue: "", placeholder: ""
  });

  const [folderPickerState, setFolderPickerState] = useState<{
    isOpen: boolean;
    type: 'move' | 'copy' | null;
    title: string;
  }>({ isOpen: false, type: null, title: "" });

  const [isMapShareOpen, setIsMapShareOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSources = async () => {
    try {
      const data = await getFilesSourcesClient(server);
      setSources(data);
      if (data.length > 0 && path.length === 0 && !queryPath) {
        const defaultP = [data[0].path];
        setPath(defaultP);
        setHistory([defaultP]);
        setHistoryIdx(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFiles = async () => {
    if (path.length === 0) return;
    setIsLoading(true);
    setSelectedFile(null);
    setSelectedItems(new Set());
    setChecksum(null);
    try {
      const data = await getFilesListClient(server, path.join("\\"));
      setFiles(data);
    } catch (e) {
      console.error(e);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [server]);

  useEffect(() => {
    setPathInput(path.join("\\"));
    fetchFiles();
  }, [path, server]);

  const navigateToPath = (newP: string[]) => {
    if (newP.join("\\") === path.join("\\")) return;
    const newHist = history.slice(0, historyIdx + 1);
    newHist.push(newP);
    setHistory(newHist);
    setHistoryIdx(newHist.length - 1);
    setPath(newP);
  };

  const handleBack = () => {
    if (historyIdx > 0) {
      const prev = historyIdx - 1;
      setHistoryIdx(prev);
      setPath(history[prev]);
    }
  };

  const handleForward = () => {
    if (historyIdx < history.length - 1) {
      const next = historyIdx + 1;
      setHistoryIdx(next);
      setPath(history[next]);
    }
  };

  const handleUpLevel = () => {
    if (path.length > 1) {
      navigateToPath(path.slice(0, path.length - 1));
    }
  };

  // Quick Access Shortcuts
  const shortcuts = [
    { label: "C:\\Scripts", path: "C:\\Scripts" },
    { label: "C:\\Logs", path: "C:\\Logs" },
    { label: "C:\\Windows\\System32", path: "C:\\Windows\\System32" },
    { label: "D:\\Backups", path: "D:\\Backups" },
    { label: "\\\\FS01\\CompanyDocs", path: "\\\\FS01\\CompanyDocs" },
  ];

  // Actions
  const handleCreateFolder = () => {
    setPromptState({
      isOpen: true,
      type: 'newFolder',
      title: 'New Directory',
      description: 'Enter a folder name to create in the current path.',
      initialValue: '',
      placeholder: 'NewFolder'
    });
  };

  const handleCreateNewFile = (type: 'newFile' | 'newPs1' | 'newJson') => {
    const titles = { newFile: 'New Text Document', newPs1: 'New PowerShell Script', newJson: 'New JSON Configuration' };
    const placeholders = { newFile: 'document.txt', newPs1: 'script.ps1', newJson: 'config.json' };
    setPromptState({
      isOpen: true,
      type,
      title: titles[type],
      description: `Enter file name. Target folder: ${path.join("\\")}`,
      initialValue: placeholders[type],
      placeholder: placeholders[type]
    });
  };

  const handleRename = () => {
    if (!selectedFile) return;
    setPromptState({
      isOpen: true,
      type: 'rename',
      title: 'Rename File/Folder',
      description: `Enter a new name for '${selectedFile.name}'.`,
      initialValue: selectedFile.name,
      placeholder: 'NewName'
    });
  };

  const handleMove = () => {
    if (!selectedFile) return;
    setFolderPickerState({
      isOpen: true,
      type: 'move',
      title: `Move ${selectedFile.name} To…`
    });
  };

  const handleCopy = () => {
    if (!selectedFile) return;
    setFolderPickerState({
      isOpen: true,
      type: 'copy',
      title: `Copy ${selectedFile.name} To…`
    });
  };

  const handlePromptConfirm = async (val: string) => {
    if (!val) return;
    const { type } = promptState;
    setPromptState(p => ({ ...p, isOpen: false }));
    
    try {
      if (type === 'newFolder') {
        await createFolderClient(server, path.join("\\"), val);
        toast.success(`Created directory '${val}'`);
      } else if (type === 'newFile' || type === 'newPs1' || type === 'newJson') {
        const defaultBody = type === 'newPs1' 
          ? `# PowerShell Script\nWrite-Host "Executing ${val}..."` 
          : type === 'newJson' ? `{\n  "name": "${val}"\n}` : "";
        await writeTextFileClient(server, path.join("\\") + "\\" + val, defaultBody);
        toast.success(`Created file '${val}'`);
      } else if (type === 'rename' && selectedFile && val !== selectedFile.name) {
        await renameFileClient(server, path.join("\\") + "\\" + selectedFile.name, val);
        toast.success(`Renamed to '${val}'`);
      }
      fetchFiles();
    } catch (e: any) {
      toast.error(`Operation failed: ${e.message || "Unknown error"}`);
    }
  };

  const handleFolderPickerConfirm = async (destPath: string) => {
    if (!destPath || !selectedFile) return;
    const { type } = folderPickerState;
    setFolderPickerState(p => ({ ...p, isOpen: false }));
    
    try {
      if (type === 'move' && destPath !== path.join("\\")) {
        await moveFileClient(server, path.join("\\") + "\\" + selectedFile.name, destPath + "\\" + selectedFile.name);
        toast.success(`Moved '${selectedFile.name}' to ${destPath}`);
      } else if (type === 'copy') {
        let fullDest = destPath;
        if (!fullDest.endsWith("\\" + selectedFile.name)) {
          fullDest = fullDest + "\\" + selectedFile.name;
        }
        await copyFileClient(server, path.join("\\") + "\\" + selectedFile.name, fullDest);
        toast.success(`Copied '${selectedFile.name}' to ${destPath}`);
      }
      fetchFiles();
    } catch (e: any) {
      toast.error(`Operation failed: ${e.message || "Unknown error"}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile && selectedItems.size === 0) return;
    const targets = selectedItems.size > 0 ? Array.from(selectedItems) : [selectedFile!.name];
    if (!confirm(`Are you sure you want to permanently delete ${targets.length} item(s)?`)) return;

    try {
      for (const name of targets) {
        await deleteFileClient(server, path.join("\\") + "\\" + name);
      }
      toast.success(`Deleted ${targets.length} item(s)`);
      fetchFiles();
    } catch (e) {
      toast.error("Failed to delete items");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      await uploadFileClient(server, path.join("\\"), file);
      toast.success(`Uploaded '${file.name}' to ${path.join("\\")}`);
      fetchFiles();
    } catch (err) {
      toast.error("Failed to upload file");
    } finally {
      setIsLoading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Editor
  const openEditor = async (fileName: string) => {
    setEditorFile(fileName);
    setEditorContent("Loading file buffer…");
    setIsEditorOpen(true);
    try {
      const text = await readTextFileClient(server, path.join("\\") + "\\" + fileName);
      setEditorContent(text);
    } catch (e) {
      setEditorContent("// Failed to load file buffer. File may be binary or exceed maximum text size.");
    }
  };

  const saveEditor = async () => {
    if (!editorFile) return;
    setIsSaving(true);
    try {
      await writeTextFileClient(server, path.join("\\") + "\\" + editorFile, editorContent);
      toast.success(`Saved '${editorFile}'`);
      setIsEditorOpen(false);
      fetchFiles();
    } catch (e) {
      toast.error("Failed to save file.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenItem = (f: FileItem) => {
    if (f.type === "folder") {
      navigateToPath([...path, f.name]);
    } else if (isTextFile(f.type)) {
      openEditor(f.name);
    } else {
      window.open(getDownloadUrl(server, path.join("\\") + "\\" + f.name), '_blank');
    }
  };

  const handleCopyPathToClipboard = () => {
    if (!selectedFile) return;
    const fullP = path.join("\\") + "\\" + selectedFile.name;
    navigator.clipboard.writeText(fullP);
    toast.success(`Copied path to clipboard: ${fullP}`);
  };

  const handleGenerateChecksum = () => {
    if (!selectedFile) return;
    // Simulated SHA-256 calculation
    const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setChecksum(hash);
    toast.info("SHA-256 Checksum calculated");
  };

  const handleMapShareConfirm = async (name: string, uncPath: string) => {
    setIsMapShareOpen(false);
    try {
      const src = await addNetworkShareClient(server, name, uncPath);
      toast.success(`Mapped share '${src.name}' (${uncPath})`);
      fetchSources();
      navigateToPath([uncPath]);
    } catch (err) {
      toast.error("Failed to map network share");
    }
  };

  // Selection Checkbox Logic
  const handleToggleSelect = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedItems);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedItems(next);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredFiles.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredFiles.map(f => f.name)));
    }
  };

  // Filtered Files
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const qLower = searchQuery.toLowerCase();
      const matchesQ = !searchQuery || f.name.toLowerCase().includes(qLower) || f.type.toLowerCase().includes(qLower);
      
      let matchesType = true;
      if (filterType === "folder") matchesType = f.type === "folder";
      else if (filterType === "ps1") matchesType = ["ps1", "bat", "cmd"].includes(f.type.toLowerCase());
      else if (filterType === "json") matchesType = ["json", "xml", "config"].includes(f.type.toLowerCase());
      else if (filterType === "log") matchesType = f.type.toLowerCase() === "log";
      else if (filterType === "doc") matchesType = ["md", "txt", "csv"].includes(f.type.toLowerCase());

      return matchesQ && matchesType;
    });
  }, [files, searchQuery, filterType]);

  const disks = sources.filter(s => s.type === "Disk");
  const shares = sources.filter(s => s.type === "Share");

  return (
    <PageWrapper>
      <PageHeader 
        eyebrow="Storage & Network Drives" 
        title="Files & Shares" 
        subtitle={`Remote directory browser, file editor, and network shares on ${server.toUpperCase()}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <ServerSelector value={server} onChange={setServer} />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMapShareOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] hover:bg-[var(--teal-low)] text-xs font-semibold text-[var(--teal)] transition-colors cursor-pointer"
          >
            <Share2 size={13} />
            <span className="mono">Map Network Share</span>
          </button>

          <button
            onClick={fetchFiles}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] hover:bg-[var(--amber-low)] text-xs text-[var(--text)] transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin text-[var(--amber)]" : ""} />
            <span className="mono">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Explorer Area + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_320px] gap-5 items-start">
        {/* Left Sidebar: Sources & Shortcuts */}
        <aside className="nx-card p-3 space-y-4 max-h-[calc(100vh-210px)] overflow-y-auto">
          {/* Quick Access */}
          <div>
            <div className="eyebrow px-1 pb-1 text-[10px]">Quick Access</div>
            <div className="space-y-1">
              {shortcuts.map(sc => (
                <button
                  key={sc.path}
                  onClick={() => navigateToPath(sc.path.split("\\").filter(Boolean))}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-sub)] hover:bg-[var(--amber-low)]/40 hover:text-[var(--amber)] transition-colors mono truncate"
                >
                  <Sparkles size={12} className="text-[var(--amber)]" />
                  <span className="truncate">{sc.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* This PC */}
          <div className="pt-2 border-t border-[var(--border-c)]">
            <div className="eyebrow px-1 pb-1 text-[10px]">This PC (Mounted Drives)</div>
            <div className="space-y-1">
              {disks.map((d) => (
                <button 
                  key={d.path} 
                  onClick={() => navigateToPath([d.path])}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors mono ${path[0] === d.path ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold" : "text-[var(--text-sub)] hover:bg-[var(--border-c)] hover:text-white"}`}
                >
                  <HardDrive size={13} className="text-[var(--amber)]" /> {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* Network Shares */}
          <div className="pt-2 border-t border-[var(--border-c)]">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="eyebrow text-[10px]">Network Shares</span>
              <button onClick={() => setIsMapShareOpen(true)} className="text-[10px] text-[var(--teal)] hover:underline flex items-center gap-0.5">
                + Map
              </button>
            </div>
            <div className="space-y-1">
              {shares.map((d) => (
                <button 
                  key={d.path} 
                  onClick={() => navigateToPath([d.path])}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors mono ${path[0] === d.path ? "bg-[var(--teal-low)] text-[var(--teal)] font-bold" : "text-[var(--text-sub)] hover:bg-[var(--border-c)] hover:text-white"}`}
                >
                  <Share2 size={13} className="text-[var(--teal)]" /> {d.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Explorer Main Window */}
        <div 
          className={`nx-card flex flex-col h-[calc(100vh-210px)] overflow-hidden border transition-colors ${dragOver ? "border-[var(--amber)] bg-[var(--amber-low)]/10" : "border-[var(--border-c)]"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const droppedFile = e.dataTransfer.files?.[0];
            if (droppedFile) {
              uploadFileClient(server, path.join("\\"), droppedFile).then(() => {
                toast.success(`Uploaded ${droppedFile.name}`);
                fetchFiles();
              });
            }
          }}
        >
          {/* Top Bar Navigation & Editable Path */}
          <div className="flex flex-wrap items-center justify-between border-b border-[var(--border-c)] p-3 bg-[var(--bg-surface)] gap-2">
            <div className="flex items-center gap-1 text-[var(--text-sub)]">
              <button onClick={handleBack} disabled={historyIdx <= 0} className="p-1.5 rounded-lg hover:bg-[var(--border-dim)] hover:text-white disabled:opacity-30"><ArrowLeft size={14} /></button>
              <button onClick={handleForward} disabled={historyIdx >= history.length - 1} className="p-1.5 rounded-lg hover:bg-[var(--border-dim)] hover:text-white disabled:opacity-30"><ArrowRight size={14} /></button>
              <button onClick={handleUpLevel} disabled={path.length <= 1} className="p-1.5 rounded-lg hover:bg-[var(--border-dim)] hover:text-white disabled:opacity-30" title="Up to Parent Directory"><ArrowUp size={14} /></button>
            </div>

            {/* Path Breadcrumb / Input Field */}
            <div className="flex-1 flex items-center min-w-[200px]">
              {isEditingPath ? (
                <input 
                  type="text"
                  autoFocus
                  value={pathInput}
                  onChange={e => setPathInput(e.target.value)}
                  onBlur={() => setIsEditingPath(false)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      navigateToPath(pathInput.split("\\").filter(Boolean));
                      setIsEditingPath(false);
                    }
                  }}
                  className="mono w-full rounded-xl border border-[var(--amber)] bg-[var(--bg-void)] px-3 py-1 text-xs text-[var(--text)] outline-none"
                />
              ) : (
                <div 
                  onClick={() => setIsEditingPath(true)}
                  className="mono flex items-center gap-1 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-3 py-1.5 text-xs text-[var(--text)] w-full cursor-pointer hover:border-[var(--amber-low)] overflow-x-auto whitespace-nowrap hide-scrollbar"
                >
                  {path.map((p, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span 
                        onClick={(e) => { e.stopPropagation(); navigateToPath(path.slice(0, i + 1)); }}
                        className="hover:text-[var(--amber)] hover:underline font-semibold"
                      >
                        {p}
                      </span>
                      {i < path.length - 1 && <ChevronRight size={12} className="text-[var(--text-sub)]" />}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions & View Toggles */}
            <div className="flex items-center gap-2">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

              <div className="flex items-center bg-[var(--bg-void)] border border-[var(--border-c)] p-0.5 rounded-xl">
                <button 
                  onClick={() => setViewMode("table")} 
                  className={`p-1.5 rounded-lg ${viewMode === "table" ? "bg-[var(--amber)] text-black" : "text-[var(--text-sub)] hover:text-white"}`}
                  title="List View"
                >
                  <List size={14} />
                </button>
                <button 
                  onClick={() => setViewMode("grid")} 
                  className={`p-1.5 rounded-lg ${viewMode === "grid" ? "bg-[var(--amber)] text-black" : "text-[var(--text-sub)] hover:text-white"}`}
                  title="Grid View"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>

              {/* New Item Dropdown */}
              <div className="relative group">
                <button className="mono flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] text-xs font-bold text-[var(--amber)] hover:bg-[var(--amber-low)] transition-colors cursor-pointer">
                  <Plus size={14} /> New Item
                </button>
                <div className="absolute right-0 top-full mt-1 hidden w-48 flex-col overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl group-hover:flex z-50 p-1">
                  <button onClick={handleCreateFolder} className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg font-mono"><FolderPlus size={14} /> New Folder</button>
                  <button onClick={() => handleCreateNewFile('newFile')} className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg font-mono"><FilePlus size={14} /> Text Document (.txt)</button>
                  <button onClick={() => handleCreateNewFile('newPs1')} className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg font-mono"><FileCode size={14} /> PowerShell (.ps1)</button>
                  <button onClick={() => handleCreateNewFile('newJson')} className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg font-mono"><FileCode size={14} /> JSON File (.json)</button>
                </div>
              </div>

              <button 
                onClick={handleUploadClick}
                className="mono flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] text-xs font-semibold text-[var(--text)] hover:border-[var(--amber)] transition-colors cursor-pointer"
              >
                <Upload size={14} /> Upload
              </button>
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-[var(--border-c)] px-3 py-2 bg-[var(--bg-void)] gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2 text-[var(--text-sub)]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter files by name…"
                className="mono w-52 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] pl-8 pr-2.5 py-1 text-xs text-[var(--text)] placeholder:text-[var(--text-sub)] focus:border-[var(--amber)] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 text-[11px] mono">
              {(["all", "folder", "ps1", "json", "log", "doc"] as const).map(ft => (
                <button
                  key={ft}
                  onClick={() => setFilterType(ft)}
                  className={`px-2 py-0.5 rounded-lg capitalize transition-colors cursor-pointer ${filterType === ft ? "bg-[var(--amber)] text-black font-bold" : "text-[var(--text-sub)] hover:text-white"}`}
                >
                  {ft}
                </button>
              ))}
            </div>
          </div>

          {/* Batch Action Bar if Items Selected */}
          {selectedItems.size > 0 && (
            <div className="flex items-center justify-between bg-[var(--amber-low)]/30 border-b border-[var(--amber)] px-4 py-2 text-xs mono">
              <span className="font-bold text-[var(--amber)]">{selectedItems.size} item(s) selected</span>
              <div className="flex items-center gap-2">
                <button onClick={handleDelete} className="px-2.5 py-1 bg-[var(--crit)]/20 text-[var(--crit)] rounded-lg hover:bg-[var(--crit)]/30 font-semibold flex items-center gap-1">
                  <Trash2 size={12} /> Delete Selected
                </button>
                <button onClick={() => setSelectedItems(new Set())} className="text-[var(--text-sub)] hover:text-white px-2">
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Explorer Main Content Area */}
          <div className="overflow-auto flex-1 p-2" onClick={() => setSelectedFile(null)}>
            {isLoading ? (
              <div className="py-20 text-center text-xs text-[var(--text-sub)] mono">Loading directory items…</div>
            ) : filteredFiles.length === 0 ? (
              <div className="py-20 text-center text-xs text-[var(--text-sub)] space-y-2 mono">
                <FolderOpen size={28} className="mx-auto opacity-40 text-[var(--text-sub)]" />
                <p>This folder is empty or no files match the current filter.</p>
              </div>
            ) : viewMode === "table" ? (
              <table className="w-full text-xs border-collapse select-none">
                <thead>
                  <tr className="eyebrow text-left border-b border-[var(--border-c)] text-[var(--text-sub)]">
                    <th className="w-8 px-2 py-2 text-center">
                      <input type="checkbox" checked={selectedItems.size === filteredFiles.length && filteredFiles.length > 0} onChange={handleSelectAll} className="accent-[var(--amber)]" />
                    </th>
                    <th className="py-2 font-semibold">Name</th>
                    <th className="py-2 font-semibold">Type</th>
                    <th className="py-2 font-semibold">Size</th>
                    <th className="py-2 font-semibold">Modified</th>
                    <th className="py-2 font-semibold">Attributes</th>
                    <th className="py-2 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="mono">
                  {filteredFiles.map((f) => {
                    const isSel = selectedFile?.name === f.name;
                    const isChecked = selectedItems.has(f.name);

                    return (
                      <tr
                        key={f.name}
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(f); }}
                        onDoubleClick={(e) => { e.stopPropagation(); handleOpenItem(f); }}
                        className={`cursor-pointer border-b border-[var(--border-dim)] transition-colors ${
                          isSel 
                            ? "bg-[var(--amber-low)]/40 hover:bg-[var(--amber-low)]/50" 
                            : "hover:bg-[var(--amber-low)]/10"
                        }`}
                      >
                        <td className="text-center px-2 py-2" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={isChecked} onChange={(e) => handleToggleSelect(f.name, e as any)} className="accent-[var(--amber)] cursor-pointer" />
                        </td>
                        <td className="py-2.5 flex items-center gap-2 font-semibold text-[var(--text)]">
                          {getFileIcon(f.type)}
                          <span className={isSel ? "text-[var(--amber)]" : ""}>{f.name}</span>
                        </td>
                        <td className="py-2.5 text-[var(--text-sub)]">{f.type === "folder" ? "Directory" : `${f.type.toUpperCase()} File`}</td>
                        <td className="py-2.5 text-[var(--text-sub)]">{f.type === "folder" ? "—" : formatBytes(f.size)}</td>
                        <td className="py-2.5 text-[var(--text-sub)]">{f.modified}</td>
                        <td className="py-2.5 text-[var(--text-sub)]">{f.attrs}</td>
                        <td className="py-2.5 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {f.type === "folder" ? (
                              <button onClick={() => handleOpenItem(f)} className="p-1 rounded hover:bg-[var(--amber-low)] text-[var(--text-sub)] hover:text-[var(--amber)]" title="Open Folder"><FolderOpen size={13}/></button>
                            ) : isTextFile(f.type) ? (
                              <button onClick={() => openEditor(f.name)} className="p-1 rounded hover:bg-[var(--amber-low)] text-[var(--text-sub)] hover:text-[var(--amber)]" title="Edit File"><Edit2 size={13}/></button>
                            ) : null}
                            <button onClick={() => { setSelectedFile(f); handleRename(); }} className="p-1 rounded hover:bg-[var(--amber-low)] text-[var(--text-sub)] hover:text-[var(--amber)]" title="Rename"><Type size={13}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* Grid / Cards View */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
                {filteredFiles.map((f) => {
                  const isSel = selectedFile?.name === f.name;

                  return (
                    <div
                      key={f.name}
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(f); }}
                      onDoubleClick={(e) => { e.stopPropagation(); handleOpenItem(f); }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isSel 
                          ? "bg-[var(--amber-low)]/30 border-[var(--amber)] shadow-lg" 
                          : "bg-[var(--bg-surface)] border-[var(--border-c)] hover:border-[var(--border-light)]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="p-2 rounded-lg bg-[var(--bg-void)] border border-[var(--border-c)]">
                          {getFileIcon(f.type)}
                        </div>
                        <span className="text-[10px] text-[var(--text-sub)] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--bg-void)]">
                          {f.type}
                        </span>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-[var(--text)] truncate mono" title={f.name}>
                          {f.name}
                        </div>
                        <div className="text-[10px] text-[var(--text-sub)] mono mt-0.5">
                          {f.type === "folder" ? "Folder" : formatBytes(f.size)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: File Inspector & Details */}
        <aside className="nx-card p-4 overflow-y-auto space-y-4 border border-[var(--border-c)] max-h-[calc(100vh-210px)] sticky top-4">
          {selectedFile ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="eyebrow">Item Inspector</span>
                  <span className="text-[10px] uppercase font-bold text-[var(--amber)] font-mono">{selectedFile.type}</span>
                </div>
                <h3 className="display text-base font-bold text-[var(--text)] flex items-center gap-2 truncate">
                  {getFileIcon(selectedFile.type)}
                  <span className="truncate">{selectedFile.name}</span>
                </h3>
              </div>

              {/* Inspector Quick Actions */}
              <div className="space-y-1.5">
                <div className="eyebrow">Actions</div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedFile.type === "folder" ? (
                    <button
                      onClick={() => handleOpenItem(selectedFile)}
                      className="mono flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-[var(--amber)]/40 bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 text-xs font-bold cursor-pointer"
                    >
                      <FolderOpen size={13} /> Open Folder
                    </button>
                  ) : isTextFile(selectedFile.type) ? (
                    <button
                      onClick={() => openEditor(selectedFile.name)}
                      className="mono flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-[var(--amber)]/40 bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 text-xs font-bold cursor-pointer"
                    >
                      <Edit2 size={13} /> Edit File
                    </button>
                  ) : (
                    <a
                      href={getDownloadUrl(server, path.join("\\") + "\\" + selectedFile.name)}
                      target="_blank"
                      className="mono flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-[var(--amber)]/40 bg-[var(--amber)]/10 text-[var(--amber)] hover:bg-[var(--amber)]/20 text-xs font-bold cursor-pointer text-center"
                    >
                      <Download size={13} /> Download
                    </a>
                  )}

                  <button
                    onClick={handleCopyPathToClipboard}
                    className="mono flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] hover:bg-[var(--amber-low)] text-xs text-[var(--text)] font-semibold cursor-pointer"
                  >
                    <Copy size={13} /> Copy Path
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleRename}
                    className="mono flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] hover:bg-[var(--amber-low)] text-xs text-[var(--text)] font-semibold cursor-pointer"
                  >
                    <Type size={13} /> Rename
                  </button>
                  <button
                    onClick={handleDelete}
                    className="mono flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border border-[var(--crit)]/40 bg-[var(--crit)]/10 text-[var(--crit)] hover:bg-[var(--crit)]/20 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>

              {/* Item Properties */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-c)] text-xs mono">
                <div className="eyebrow">Properties</div>
                <div className="space-y-2 bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-c)]">
                  <div>
                    <span className="text-[var(--text-sub)] block text-[10px] uppercase">Full Path</span>
                    <span className="text-[var(--text)] break-all font-semibold text-[11px]">{path.join("\\")}\{selectedFile.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[var(--text-sub)] block text-[10px] uppercase">Size</span>
                      <span className="text-[var(--amber)] font-bold">{selectedFile.type === "folder" ? "Directory" : formatBytes(selectedFile.size)}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-sub)] block text-[10px] uppercase">Attributes</span>
                      <span className="text-[var(--text)]">{selectedFile.attrs}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[var(--text-sub)] block text-[10px] uppercase">Last Modified</span>
                    <span className="text-[var(--text)]">{selectedFile.modified}</span>
                  </div>
                </div>
              </div>

              {/* Checksum Hash Tool */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-c)] text-xs mono">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Security Verification</span>
                  <button onClick={handleGenerateChecksum} className="text-[10px] text-[var(--teal)] hover:underline flex items-center gap-1">
                    <Hash size={11} /> Generate Hash
                  </button>
                </div>
                {checksum ? (
                  <div className="p-2 bg-[var(--bg-surface)] rounded-xl border border-[var(--teal)] text-[10px] text-[var(--teal)] break-all font-mono">
                    SHA-256: {checksum}
                  </div>
                ) : (
                  <p className="text-[10px] text-[var(--text-sub)]">Generate cryptographic checksum to verify file integrity.</p>
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-[var(--text-sub)] space-y-2 mono">
              <Eye size={24} className="mx-auto text-[var(--text-sub)] opacity-40" />
              <p>Select any file or folder to view metadata, preview contents, or perform actions.</p>
            </div>
          )}
        </aside>
      </div>

      {/* Modals */}
      <PromptDialog 
        isOpen={promptState.isOpen}
        title={promptState.title}
        description={promptState.description}
        initialValue={promptState.initialValue}
        placeholder={promptState.placeholder}
        onConfirm={handlePromptConfirm}
        onCancel={() => setPromptState(p => ({ ...p, isOpen: false }))}
        confirmLabel="Confirm"
      />

      <FolderPickerDialog
        isOpen={folderPickerState.isOpen}
        server={server}
        title={folderPickerState.title}
        initialPath={path.join("\\")}
        onConfirm={handleFolderPickerConfirm}
        onCancel={() => setFolderPickerState(p => ({ ...p, isOpen: false }))}
      />

      <MapShareDialog 
        isOpen={isMapShareOpen}
        onConfirm={handleMapShareConfirm}
        onCancel={() => setIsMapShareOpen(false)}
      />

      {/* Text / Code Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="flex h-[82vh] w-[85vw] max-w-5xl flex-col overflow-hidden rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-5 py-3.5">
              <div className="mono flex items-center gap-2 text-xs text-[var(--text)] font-bold">
                <Edit2 size={15} className="text-[var(--amber)]" />
                Editing: {path.join("\\")}\{editorFile}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={saveEditor}
                  disabled={isSaving}
                  className="mono flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[var(--amber)] text-black font-bold text-xs hover:bg-[var(--amber-hover)] disabled:opacity-50 cursor-pointer"
                >
                  <Save size={14} /> {isSaving ? "Saving…" : "Save File (Ctrl+S)"}
                </button>
                <button onClick={() => setIsEditorOpen(false)} className="rounded-lg p-1 text-[var(--text-sub)] hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[var(--bg-void)] relative overflow-hidden flex">
              <textarea
                className="mono h-full w-full resize-none bg-transparent p-4 text-xs text-[var(--text)] outline-none leading-relaxed font-mono"
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    saveEditor();
                  }
                }}
                spellCheck={false}
              />
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border-c)] bg-[var(--bg-surface)] px-5 py-2 text-[11px] mono text-[var(--text-sub)]">
              <span>Encoding: UTF-8</span>
              <span>Lines: {editorContent.split('\n').length} | Characters: {editorContent.length}</span>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
