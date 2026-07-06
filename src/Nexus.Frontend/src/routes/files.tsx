import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Folder, File as FileIcon, ChevronRight, Upload, Plus, Trash2, Download } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { 
  FileSource, FileItem, getFilesSourcesClient, getFilesListClient, 
  createFolderClient, deleteFileClient, uploadFileClient, getDownloadUrl 
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

function FilesPage() {
  const [server, setServer] = useState("dc");
  const [sources, setSources] = useState<FileSource[]>([]);
  const [path, setPath] = useState<string[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
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

        <div className="nx-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border-c)] p-3 bg-[#0a0f18]">
            <div className="mono flex items-center gap-1 text-[12px]">
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
            <div className="flex gap-2">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              <TBtn icon={Plus} label="New Folder" onClick={handleCreateFolder} />
              <TBtn icon={Upload} label="Upload File" onClick={handleUploadClick} />
              <TBtn icon={Trash2} label="Delete" onClick={handleDelete} disabled={!selectedFile} />
            </div>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="eyebrow border-b border-[var(--border-c)] text-left bg-[#0a0f18]/50">
                <th className="px-4 py-2">Name</th><th>Type</th><th>Size</th><th>Modified</th><th>Attributes</th>
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
