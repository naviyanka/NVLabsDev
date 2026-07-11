import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Folder, File as FileIcon, ChevronRight, Upload, Plus, Trash2, Download, Edit2, Copy, MoveRight, Type, X, Save } from "lucide-react";
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

function FilesPage() {
  const [server, setServer] = useState("dc");
  const [sources, setSources] = useState<FileSource[]>([]);
  const [path, setPath] = useState<string[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [editorFile, setEditorFile] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleCreateFolder = async () => {
    const name = prompt("Enter folder name:");
    if (!name) return;
    try {
      await createFolderClient(server, path.join("\\"), name);
      fetchFiles();
    } catch (e) {
      alert("Failed to create folder");
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    if (!confirm(`Are you sure you want to delete ${selectedFile}?`)) return;
    try {
      await deleteFileClient(server, path.join("\\") + "\\" + selectedFile);
      fetchFiles();
    } catch (e) {
      alert("Failed to delete");
    }
  };

  const handleRename = async () => {
    if (!selectedFile) return;
    const newName = prompt(`Enter new name for ${selectedFile}:`, selectedFile);
    if (!newName || newName === selectedFile) return;
    try {
      await renameFileClient(server, path.join("\\") + "\\" + selectedFile, newName);
      fetchFiles();
    } catch (e) {
      alert("Failed to rename");
    }
  };

  const handleMove = async () => {
    if (!selectedFile) return;
    const destPath = prompt(`Enter destination path for ${selectedFile}:\n(e.g., C:\\temp)`, path.join("\\"));
    if (!destPath || destPath === path.join("\\")) return;
    try {
      await moveFileClient(server, path.join("\\") + "\\" + selectedFile, destPath + "\\" + selectedFile);
      fetchFiles();
    } catch (e) {
      alert("Failed to move");
    }
  };

  const handleCopy = async () => {
    if (!selectedFile) return;
    const destPath = prompt(`Enter destination path to copy ${selectedFile}:\n(e.g., C:\\temp)`, path.join("\\"));
    if (!destPath) return;
    
    let fullDest = destPath;
    if (!destPath.endsWith("\\" + selectedFile)) {
      fullDest = destPath + "\\" + selectedFile;
    }

    if (fullDest === path.join("\\") + "\\" + selectedFile) {
      fullDest = path.join("\\") + "\\Copy of " + selectedFile;
    }

    try {
      await copyFileClient(server, path.join("\\") + "\\" + selectedFile, fullDest);
      fetchFiles();
    } catch (e) {
      alert("Failed to copy. Folder copy is not supported.");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadFileClient(server, path.join("\\"), file);
      fetchFiles();
    } catch (err) {
      alert("Failed to upload");
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
              <TBtn icon={Type} label="Rename" onClick={handleRename} disabled={!selectedFile} />
              <TBtn icon={Copy} label="Copy" onClick={handleCopy} disabled={!selectedFile} />
              <TBtn icon={MoveRight} label="Move" onClick={handleMove} disabled={!selectedFile} />
              <TBtn icon={Trash2} label="Delete" onClick={handleDelete} disabled={!selectedFile} />
            </div>
          </div>
          
          <div className="overflow-auto flex-1">
            <table className="w-full text-[12px] relative">
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
                    const isSelected = selectedFile === f.name;
                    return (
                      <tr 
                        key={f.name} 
                        onClick={() => setSelectedFile(f.name)}
                        onDoubleClick={() => {
                          if (f.type === "folder") {
                            setPath([...path, f.name]);
                          } else if (isTextFile(f.type)) {
                            openEditor(f.name);
                          } else {
                            window.open(getDownloadUrl(server, path.join("\\") + "\\" + f.name), '_blank');
                          }
                        }}
                        className={`cursor-pointer border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] ${isSelected ? "bg-[var(--bg-surface)]" : ""}`}>
                        <td className="flex items-center gap-2 px-4 py-2 text-[var(--text)]">
                          {f.type === "folder" ? <Folder size={13} className="text-[var(--amber)]" /> : <FileIcon size={13} className="text-[var(--text-sub)]" />}
                          {f.name}
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

      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex h-[80vh] w-[80vw] flex-col overflow-hidden rounded-lg border border-[var(--border-c)] bg-[#0a0f18] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-2">
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
