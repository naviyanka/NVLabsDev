import { useState, useEffect, useRef } from "react";
import { Folder, File, HardDrive, ChevronRight, CornerLeftUp, UploadCloud, Server } from "lucide-react";
import { getFilesSourcesClient, getFilesListClient, uploadInstallerClient, type FileSource, type FileItem } from "@/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { ServerSelector } from "./ServerSelector";

interface RemoteFilePickerProps {
  targetServer: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (path: string, sourceServerIp: string) => void;
}

export function RemoteFilePicker({ targetServer, isOpen, onOpenChange, onSelect }: RemoteFilePickerProps) {
  const [activeTab, setActiveTab] = useState("remote");
  const [activeServer, setActiveServer] = useState(targetServer);
  
  const [sources, setSources] = useState<FileSource[]>([]);
  const [path, setPath] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const localInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveServer(targetServer);
      setPath("");
      setActiveTab("remote");
    }
  }, [isOpen, targetServer]);

  useEffect(() => {
    if (isOpen && activeTab === "remote" && activeServer) {
      getFilesSourcesClient(activeServer).then(setSources);
    }
  }, [isOpen, activeServer, activeTab]);

  useEffect(() => {
    if (path && activeTab === "remote") {
      setIsLoading(true);
      getFilesListClient(activeServer, path)
        .then(setFiles)
        .catch(() => setFiles([]))
        .finally(() => setIsLoading(false));
    } else {
      setFiles([]);
    }
  }, [path, activeServer, activeTab]);

  const goUp = () => {
    if (!path) return;
    const parts = path.split("\\").filter(Boolean);
    if (parts.length <= 1) {
      setPath("");
    } else {
      parts.pop();
      setPath(parts.join("\\") + "\\");
    }
  };

  const handleLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    
    setIsUploading(true);
    try {
      // Upload directly to targetServer's temp via new client function
      const remoteTempPath = await uploadInstallerClient(targetServer, f);
      if (remoteTempPath) {
        onSelect(remoteTempPath, targetServer);
      } else {
        alert("Failed to upload installer.");
      }
    } catch (err) {
      alert("Failed to upload installer.");
    } finally {
      setIsUploading(false);
      if (localInputRef.current) localInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[var(--bg-card)] border-[var(--border-c)] text-[var(--text)]">
        <DialogHeader>
          <DialogTitle>Select Installer File</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2 bg-[var(--bg-surface)]">
            <TabsTrigger value="remote" className="data-[state=active]:bg-[var(--bg-card)] data-[state=active]:text-[var(--amber)]">Remote Servers</TabsTrigger>
            <TabsTrigger value="local" className="data-[state=active]:bg-[var(--bg-card)] data-[state=active]:text-[var(--amber)]">Local Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="remote" className="mt-4">
            <div className="mb-2">
              <label className="text-[10px] uppercase text-[var(--text-sub)] font-semibold mb-1 block">Source Server</label>
              <ServerSelector value={activeServer} onChange={(s) => { setActiveServer(s); setPath(""); }} />
            </div>

            <div className="flex h-[350px] flex-col overflow-hidden rounded-md border border-[var(--border-dim)] bg-[var(--bg-surface)] mt-2">
              <div className="flex items-center justify-between border-b border-[var(--border-dim)] bg-[var(--bg-card)] px-3 py-2">
                <div className="flex items-center gap-1.5 mono text-[12px]">
                  <button disabled={!path} onClick={goUp} className="rounded p-1 hover:bg-[var(--bg-surface)] disabled:opacity-30"><CornerLeftUp size={14} /></button>
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span className="cursor-pointer text-[var(--amber)] hover:underline" onClick={() => setPath("")}>{activeServer}</span>
                    {path && <><ChevronRight size={14} className="text-[var(--text-sub)]" /><span className="truncate">{path}</span></>}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-2">
                {!path ? (
                  <div className="grid grid-cols-3 gap-2">
                    {sources.map(s => (
                      <button key={s.path} onClick={() => setPath(s.path)} className="flex items-center gap-2 rounded-md border border-[var(--border-dim)] p-3 text-left hover:border-[var(--amber)] hover:bg-[var(--amber-low)]">
                        <HardDrive size={16} className="text-[var(--amber)]" />
                        <div className="flex flex-col"><span className="text-[12px] font-medium">{s.name}</span><span className="text-[10px] text-[var(--text-sub)]">{s.path}</span></div>
                      </button>
                    ))}
                  </div>
                ) : isLoading ? (
                  <div className="p-4 text-center text-[12px] text-[var(--text-sub)]">Loading...</div>
                ) : (
                  <div className="grid grid-cols-1 gap-1">
                    {files.map(f => {
                      const isDir = f.type === "folder";
                      const isInstaller = !isDir && (f.name.toLowerCase().endsWith(".exe") || f.name.toLowerCase().endsWith(".msi"));
                      return (
                        <button 
                          key={f.name}
                          onClick={() => isDir ? setPath(path.endsWith("\\") ? path + f.name : path + "\\" + f.name) : (isInstaller && onSelect(path.endsWith("\\") ? path + f.name : path + "\\" + f.name, activeServer))}
                          className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] ${isDir ? 'hover:bg-[var(--bg-card)]' : isInstaller ? 'hover:bg-[var(--amber-low)] hover:text-[var(--amber)]' : 'opacity-50 cursor-default'}`}
                        >
                          {isDir ? <Folder size={14} className="text-[var(--text-sub)]" /> : <File size={14} className={isInstaller ? "text-[var(--text)]" : "text-[var(--text-sub)]"} />}
                          <span className="truncate">{f.name}</span>
                        </button>
                      );
                    })}
                    {files.length === 0 && <div className="p-4 text-center text-[12px] text-[var(--text-sub)]">Folder is empty</div>}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="local" className="mt-4">
            <div className="flex h-[350px] flex-col items-center justify-center rounded-md border-2 border-dashed border-[var(--border-dim)] bg-[var(--bg-surface)]">
              <UploadCloud size={48} className="text-[var(--amber)] mb-4" />
              <div className="text-[14px] font-medium mb-1">Upload Installer</div>
              <div className="text-[12px] text-[var(--text-sub)] mb-6 text-center max-w-xs">
                Select an .exe or .msi file from your local machine to upload and install on {targetServer}.
              </div>
              
              <input type="file" accept=".exe,.msi" ref={localInputRef} className="hidden" onChange={handleLocalUpload} />
              
              <button 
                onClick={() => localInputRef.current?.click()}
                disabled={isUploading}
                className="bg-[var(--amber)] text-black px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-[var(--amber-hover)] disabled:opacity-50"
              >
                {isUploading ? "Uploading to Server..." : "Choose File"}
              </button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <div className="text-[11px] text-[var(--text-sub)]">
            {activeTab === "remote" 
              ? "Select an installer from any remote server. It will be copied to the target automatically if needed."
              : `The file will be securely transferred to ${targetServer} before execution.`}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
