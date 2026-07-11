import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Folder, File as FileIcon, ChevronRight, Upload, Plus, Trash2, Download, Edit2, Copy, MoveRight, Type, X, Save, FolderOpen } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { 
  FileSource, FileItem, getFilesSourcesClient, getFilesListClient, 
  createFolderClient, deleteFileClient, uploadFileClient, getDownloadUrl,
  renameFileClient, moveFileClient, copyFileClient, readTextFileClient, writeTextFileClient
} from "@/api/client";

export const Route = createFileRoute("/files")({
  head: () => ({ meta: [{ title: "Files — NEXUS" }, { name: "description", content: "Browse files and network shares." }] }),
  component: FilesPage,
});

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function isTextFile(ext: string) {
  const textExtensions = ["txt", "json", "md", "csv", "ps1", "bat", "cmd", "xml", "ini", "log", "yaml", "yml", "js", "ts", "html", "css"];
  return textExtensions.includes(ext.toLowerCase());
}

// Simple Dialog component for prompts
function PromptDialog({ isOpen, title, description, initialValue, placeholder, onConfirm, onCancel, confirmLabel = "Save" }: any) {
  const [value, setValue] = useState(initialValue || "");
  useEffect(() => { if (isOpen) setValue(initialValue || ""); }, [isOpen, initialValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-[var(--border-c)] bg-[#0a0f18] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-3">
          <div className="eyebrow text-[var(--text)]">{title}</div>
          <button onClick={onCancel} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-5">
          {description && <p className="text-[12px] text-[var(--text-sub)] mb-3">{description}</p>}
          <input 
            type="text" 
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={e => { if (e.key === 'Enter') onConfirm(value); if (e.key === 'Escape') onCancel(); }}
            className="mono w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus:border-[var(--amber)]"
          />
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={onCancel} className="rounded px-4 py-1.5 text-[12px] font-medium text-[var(--text-sub)] hover:text-white">Cancel</button>
            <button onClick={() => onConfirm(value)} className="rounded bg-[var(--amber)] px-4 py-1.5 text-[12px] font-semibold text-black hover:bg-[var(--amber-hover)]">{confirmLabel}</button>
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
      <div className="flex h-[60vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--border-c)] bg-[#0a0f18] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-3">
          <div className="eyebrow text-[var(--text)]">{title}</div>
          <button onClick={onCancel} className="text-[var(--text-sub)] hover:text-white"><X size={16} /></button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 border-r border-[var(--border-c)] bg-[var(--bg-surface)]/50 p-2 overflow-y-auto">
            <div className="eyebrow mb-2 px-2 text-[10px]">Sources</div>
            {sources.map(s => (
              <button 
                key={s.path}
                onClick={() => setCurrentPath([s.path])}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] ${currentPath[0] === s.path ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--border-c)] hover:text-white"}`}
              >
                <Folder size={12} className={s.type === "Disk" ? "text-[var(--amber)]" : "text-[var(--teal)]"} /> {s.name}
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="border-b border-[var(--border-c)] p-2">
              <div className="mono text-[11px] text-[var(--text-sub)] overflow-x-auto whitespace-nowrap hide-scrollbar flex items-center gap-1">
                {currentPath.map((p, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <button 
                      onClick={() => setCurrentPath(currentPath.slice(0, i + 1))}
                      className="hover:text-[var(--amber)]"
                    >
                      {p}
                    </button>
                    {i < currentPath.length - 1 && <ChevronRight size={10} />}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="text-center text-[12px] text-[var(--text-sub)] p-4">Loading...</div>
              ) : folders.length === 0 ? (
                <div className="text-center text-[12px] text-[var(--text-sub)] p-4">No folders</div>
              ) : (
                folders.map(f => (
                  <button
                    key={f.name}
                    onDoubleClick={() => setCurrentPath([...currentPath, f.name])}
                    className="flex w-full items-center gap-2 rounded p-2 text-left text-[12px] text-[var(--text)] hover:bg-[var(--bg-surface)]"
                  >
                    <Folder size={14} className="text-[var(--amber)]" />
                    {f.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border-c)] bg-[var(--bg-surface)] p-3">
          <div className="mono text-[11px] text-[var(--text-sub)] truncate max-w-[300px]">
            Target: {currentPath.join("\\")}
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel} className="rounded px-4 py-1.5 text-[12px] font-medium text-[var(--text-sub)] hover:text-white">Cancel</button>
            <button 
              onClick={() => onConfirm(currentPath.join("\\"))}
              disabled={currentPath.length === 0}
              className="rounded bg-[var(--amber)] px-4 py-1.5 text-[12px] font-semibold text-black hover:bg-[var(--amber-hover)] disabled:opacity-50"
            >
              Select Folder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilesPage() {
  const [server, setServer] = useState("dc");
  const [sources, setSources] = useState<FileSource[]>([]);
  const [path, setPath] = useState<string[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  
  // Selection State
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [editorFile, setEditorFile] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modals State
  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    type: 'rename' | 'newFolder' | null;
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSources = async () => {
    try {
      const data = await getFilesSourcesClient(server);
      setSources(data);
      if (data.length > 0 && path.length === 0) {
        setPath([data[0].path]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFiles = async () => {
    if (path.length === 0) return;
    setIsLoading(true);
    setSelectedFile(null);
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
    fetchFiles();
  }, [path, server]);

  const handleCreateFolder = () => {
    setPromptState({
      isOpen: true,
      type: 'newFolder',
      title: 'New Folder',
      description: 'Enter a name for the new folder.',
      initialValue: '',
      placeholder: 'New folder'
    });
  };

  const handleRename = () => {
    if (!selectedFile) return;
    setPromptState({
      isOpen: true,
      type: 'rename',
      title: 'Rename',
      description: `Enter a new name for ${selectedFile.name}.`,
      initialValue: selectedFile.name,
      placeholder: 'New name'
    });
  };

  const handleMove = () => {
    if (!selectedFile) return;
    setFolderPickerState({
      isOpen: true,
      type: 'move',
      title: `Move ${selectedFile.name} To...`
    });
  };

  const handleCopy = () => {
    if (!selectedFile) return;
    setFolderPickerState({
      isOpen: true,
      type: 'copy',
      title: `Copy ${selectedFile.name} To...`
    });
  };

  const handlePromptConfirm = async (val: string) => {
    if (!val) return;
    const { type } = promptState;
    setPromptState(p => ({ ...p, isOpen: false }));
    
    try {
      if (type === 'newFolder') {
        await createFolderClient(server, path.join("\\"), val);
      } else if (type === 'rename' && selectedFile && val !== selectedFile.name) {
        await renameFileClient(server, path.join("\\") + "\\" + selectedFile.name, val);
      }
      fetchFiles();
    } catch (e: any) {
      alert(`Operation failed: ${e.message || "Unknown error"}`);
    }
  };

  const handleFolderPickerConfirm = async (destPath: string) => {
    if (!destPath || !selectedFile) return;
    const { type } = folderPickerState;
    setFolderPickerState(p => ({ ...p, isOpen: false }));
    
    try {
      if (type === 'move' && destPath !== path.join("\\")) {
        await moveFileClient(server, path.join("\\") + "\\" + selectedFile.name, destPath + "\\" + selectedFile.name);
      } else if (type === 'copy') {
        let fullDest = destPath;
        if (!fullDest.endsWith("\\" + selectedFile.name)) {
          fullDest = fullDest + "\\" + selectedFile.name;
        }
        if (fullDest === path.join("\\") + "\\" + selectedFile.name) {
          fullDest = path.join("\\") + "\\Copy of " + selectedFile.name;
        }
        await copyFileClient(server, path.join("\\") + "\\" + selectedFile.name, fullDest);
      }
      fetchFiles();
    } catch (e: any) {
      alert(`Operation failed: ${e.message || "Unknown error"}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    if (!confirm(`Are you sure you want to delete ${selectedFile.name}?`)) return;
    try {
      await deleteFileClient(server, path.join("\\") + "\\" + selectedFile.name);
      fetchFiles();
    } catch (e) {
      alert("Failed to delete");
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
      fetchFiles();
    } catch (err) {
      alert("Failed to upload");
    } finally {
      setIsLoading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openEditor = async (fileName: string) => {
    setEditorFile(fileName);
    setEditorContent("Loading...");
    setIsEditorOpen(true);
    try {
      const text = await readTextFileClient(server, path.join("\\") + "\\" + fileName);
      setEditorContent(text);
    } catch (e) {
      setEditorContent("Failed to load file. It might be binary or too large.");
    }
  };

  const saveEditor = async () => {
    if (!editorFile) return;
    setIsSaving(true);
    try {
      await writeTextFileClient(server, path.join("\\") + "\\" + editorFile, editorContent);
      alert("File saved successfully.");
      setIsEditorOpen(false);
      fetchFiles();
    } catch (e) {
      alert("Failed to save file.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenItem = (f: FileItem) => {
    if (f.type === "folder") {
      setPath([...path, f.name]);
    } else if (isTextFile(f.type)) {
      openEditor(f.name);
    } else {
      window.open(getDownloadUrl(server, path.join("\\") + "\\" + f.name), '_blank');
    }
  };

  const handleDownload = () => {
    if (!selectedFile) return;
    // Download endpoint automatically zips if it's a folder!
    window.open(getDownloadUrl(server, path.join("\\") + "\\" + selectedFile.name), '_blank');
  };

  const disks = sources.filter(s => s.type === "Disk");
  const shares = sources.filter(s => s.type === "Share");

  return (
    <PageWrapper>
      <PageHeader eyebrow="Management" title="Files" />
      <ServerSelector value={server} onChange={setServer} />

      <div className="grid grid-cols-[240px_1fr] gap-5 pt-4">
        <aside className="nx-card h-fit p-3">
          <div className="eyebrow px-1 pb-2">This PC</div>
          {disks.map((d) => (
            <button 
              key={d.path} 
              onClick={() => setPath([d.path])}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] hover:bg-[var(--bg-surface)] hover:text-[var(--text)] ${path[0] === d.path ? "bg-[var(--bg-surface)] text-[var(--text)]" : "text-[var(--text-sub)]"}`}>
              <Folder size={13} className="text-[var(--amber)]" /> {d.name}
            </button>
          ))}
          
          {shares.length > 0 && (
            <>
              <div className="eyebrow px-1 pb-2 pt-4">Network Shares</div>
              {shares.map((d) => (
                <button 
                  key={d.path} 
                  onClick={() => setPath([d.path])}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] hover:bg-[var(--bg-surface)] hover:text-[var(--text)] ${path[0] === d.path ? "bg-[var(--bg-surface)] text-[var(--text)]" : "text-[var(--text-sub)]"}`}>
                  <Folder size={13} className="text-[var(--teal)]" /> {d.name}
                </button>
              ))}
            </>
          )}
        </aside>

        <div className="nx-card flex flex-col h-[calc(100vh-200px)]">
          <div className="flex flex-wrap items-center justify-between border-b border-[var(--border-c)] p-3 bg-[#0a0f18] gap-2">
            <div className="mono flex items-center gap-1 text-[12px] overflow-x-auto whitespace-nowrap hide-scrollbar">
              {path.map((p, i) => (
                <span key={i} className="flex items-center gap-1">
                  <button 
                    onClick={() => setPath(path.slice(0, i + 1))}
                    className="text-[var(--text-sub)] hover:text-[var(--amber)]">
                    {p}
                  </button>
                  {i < path.length - 1 && <ChevronRight size={12} className="text-[var(--text-ghost)]" />}
                </span>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              
              <TBtn icon={Plus} label="New Folder" onClick={handleCreateFolder} />
              <TBtn icon={Upload} label="Upload" onClick={handleUploadClick} />
              
              <div className="w-[1px] h-6 bg-[var(--border-dim)] mx-1" />
              
              {selectedFile?.type === "folder" ? (
                <TBtn icon={FolderOpen} label="Open" onClick={() => handleOpenItem(selectedFile)} />
              ) : (
                <TBtn icon={Edit2} label="Edit" disabled={!selectedFile || !isTextFile(selectedFile.type)} onClick={() => selectedFile && openEditor(selectedFile.name)} />
              )}
              
              <TBtn icon={Download} label="Download" disabled={!selectedFile} onClick={handleDownload} />
              <TBtn icon={Type} label="Rename" onClick={handleRename} disabled={!selectedFile} />
              <TBtn icon={Copy} label="Copy" onClick={handleCopy} disabled={!selectedFile} />
              <TBtn icon={MoveRight} label="Move" onClick={handleMove} disabled={!selectedFile} />
              <TBtn icon={Trash2} label="Delete" onClick={handleDelete} disabled={!selectedFile} />
            </div>
          </div>
          
          <div className="overflow-auto flex-1 outline-none" onClick={(e) => { if (e.target === e.currentTarget) setSelectedFile(null); }}>
            <table className="w-full text-[12px] relative select-none">
              <thead className="sticky top-0 bg-[#0a0f18]/95 backdrop-blur-sm z-10 shadow-[0_1px_0_var(--border-c)]">
                <tr className="eyebrow text-left">
                  <th className="px-4 py-2 font-normal">Name</th>
                  <th className="font-normal">Type</th>
                  <th className="font-normal">Size</th>
                  <th className="font-normal">Modified</th>
                  <th className="font-normal">Attributes</th>
                </tr>
              </thead>
              <tbody className="mono">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-4 text-center text-[var(--text-sub)]">Loading...</td></tr>
                ) : files.length === 0 ? (
                  <tr><td colSpan={5} className="py-4 text-center text-[var(--text-sub)]">Folder is empty</td></tr>
                ) : (
                  files.map((f) => {
                    const isSelected = selectedFile?.name === f.name;
                    return (
                      <tr 
                        key={f.name} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(f);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleOpenItem(f);
                        }}
                        className={`cursor-pointer border-b border-[var(--border-dim)] transition-colors ${isSelected ? "bg-[var(--amber-low)]/20" : "hover:bg-[var(--bg-surface)]"}`}>
                        <td className="flex items-center gap-2 px-4 py-2 text-[var(--text)]">
                          {f.type === "folder" ? <Folder size={13} className="text-[var(--amber)]" /> : <FileIcon size={13} className="text-[var(--text-sub)]" />}
                          <span className={isSelected ? "text-[var(--amber)] font-medium" : ""}>{f.name}</span>
                        </td>
                        <td className="text-[var(--text-sub)]">{f.type === "folder" ? "File folder" : f.type.toUpperCase() + " File"}</td>
                        <td className="text-[var(--text-sub)]">{f.type === "folder" ? "" : formatBytes(f.size)}</td>
                        <td className="text-[var(--text-sub)]">{f.modified}</td>
                        <td className="text-[var(--text-sub)]">{f.attrs}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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

      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="flex h-[80vh] w-[80vw] flex-col overflow-hidden rounded-xl border border-[var(--border-c)] bg-[#0a0f18] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-3">
              <div className="mono flex items-center gap-2 text-[12px] text-[var(--text)]">
                <Edit2 size={14} className="text-[var(--amber)]" />
                Editing: {editorFile}
              </div>
              <div className="flex items-center gap-2">
                <TBtn icon={Save} label={isSaving ? "Saving..." : "Save"} onClick={saveEditor} disabled={isSaving} />
                <button onClick={() => setIsEditorOpen(false)} className="rounded p-1 text-[var(--text-sub)] hover:bg-[var(--border-dim)] hover:text-white">
                  <X size={16} />
                </button>
              </div>
            </div>
            <textarea
              className="mono h-full w-full resize-none bg-transparent p-4 text-[13px] text-[var(--text)] outline-none"
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

function TBtn({ icon: Icon, label, onClick, disabled }: { icon: React.ComponentType<{ size?: number }>; label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors ${disabled ? 'opacity-50 cursor-not-allowed text-[var(--text-sub)]' : 'text-[var(--text)] hover:border-[var(--amber)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)]'}`}>
      <Icon size={12} /> {label}
    </button>
  );
}
