import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { getServersClient as getServers, type Server } from "@/api/client";
import { toast } from "sonner";
import { Save, Search, Play, CheckCircle2, Circle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/sharepoint-setup")({
  component: SharePointSetupPage,
});

function SharePointSetupPage() {
  const [servers, setServers] = useState<Server[]>([]);
  
  // Selections
  const [editions, setEditions] = useState({ spse: false, sp2019: false, sp2016: false });
  const [spAssignments, setSpAssignments] = useState<Record<string, string[]>>({});
  
  const [sqlServer, setSqlServer] = useState("");
  const [disks, setDisks] = useState<any[]>([]);
  const [sqlDisk, setSqlDisk] = useState("");
  const [sqlInstance, setSqlInstance] = useState("MSSQLSERVER");
  const [sqlAdmins, setSqlAdmins] = useState<string[]>(["Administrator"]);
  
  const [useExistingShare, setUseExistingShare] = useState(false);
  const [fileSharePath, setFileSharePath] = useState("C:\\NexusDeploy\\SharePoint");
  const [fileShareUrl, setFileShareUrl] = useState("");
  
  const [spDownloadUrl, setSpDownloadUrl] = useState("https://sp-download.com/spse.iso");
  const [sqlDownloadUrl, setSqlDownloadUrl] = useState("https://sql-download.com/sql2022.iso");
  
  const [filesDownloaded, setFilesDownloaded] = useState({ sp: false, sql: false });
  const [execution, setExecution] = useState({ downloadSql: false, installSql: false, downloadSp: false, installSp: false });

  const [adSearchQuery, setAdSearchQuery] = useState("");
  const [adSearchResults, setAdSearchResults] = useState<string[]>([]);
  const [isAdSearching, setIsAdSearching] = useState(false);
  const [isAdOpen, setIsAdOpen] = useState(false);

  useEffect(() => {
    getServers().then(setServers).catch(console.error);
  }, []);

  useEffect(() => {
    if (sqlServer) {
      fetch(`/api/servers/${sqlServer}/disks`)
        .then(r => r.json())
        .then(d => setDisks(d))
        .catch(() => toast.error("Failed to fetch disks"));
    }
  }, [sqlServer]);

  const searchAd = async () => {
    setIsAdSearching(true);
    try {
      const res = await fetch(`/api/activedirectory/search?q=${adSearchQuery}`);
      if (res.ok) {
        setAdSearchResults(await res.json());
      }
    } catch {
      toast.error("Failed to search AD");
    } finally {
      setIsAdSearching(false);
    }
  };

  const testUrl = async (url: string) => {
    try {
      const res = await fetch('/api/utils/test-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.valid) toast.success(`URL Valid (Status: ${data.statusCode})`);
      else toast.error(`URL Invalid: ${data.error || "Bad status"}`);
    } catch {
      toast.error("Error validating URL");
    }
  };

  const toggleSpAssignment = (edition: string, serverId: string) => {
    const current = spAssignments[edition] || [];
    if (current.includes(serverId)) {
      setSpAssignments({ ...spAssignments, [edition]: current.filter(s => s !== serverId) });
    } else {
      setSpAssignments({ ...spAssignments, [edition]: [...current, serverId] });
    }
  };

  const isServerAssignedToOtherEdition = (serverId: string, currentEdition: string) => {
    return Object.keys(spAssignments).some(ed => ed !== currentEdition && spAssignments[ed]?.includes(serverId));
  };

  const executeSetup = async () => {
    try {
      const payload = {
        spEdition: editions.spse ? 'SPSE' : editions.sp2019 ? 'SP2019' : 'SP2016',
        spServers: Object.values(spAssignments).flat(),
        sqlTargetServer: sqlServer,
        sqlInstanceName: sqlInstance,
        sqlDisk: sqlDisk,
        sqlAdmins: sqlAdmins,
        fileSharePath: useExistingShare ? "" : fileSharePath,
        fileShareUrl: useExistingShare ? fileShareUrl : `\\\\127.0.0.1\\SPSetup`, // Simplified
        spDownloadUrl,
        sqlDownloadUrl,
        filesAlreadyDownloaded: filesDownloaded.sp && filesDownloaded.sql,
        downloadSql: execution.downloadSql,
        installSql: execution.installSql,
        downloadSp: execution.downloadSp,
        installSp: execution.installSp
      };

      const res = await fetch('/api/plugins/sharepointsetup/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) toast.success("Setup execution started!");
      else toast.error("Setup failed to start.");
    } catch {
      toast.error("Error executing setup");
    }
  };

  return (
    <PageWrapper>
      <PageHeader title="SharePoint Setup Plugin" />
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        
        {/* Step 1 */}
        <div className="bg-card border border-border p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-bold">1. SharePoint Edition & Assignment</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={editions.spse} onChange={e => setEditions({...editions, spse: e.target.checked})} className="checkbox" /> SPSE</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={editions.sp2019} onChange={e => setEditions({...editions, sp2019: e.target.checked})} className="checkbox" /> SP 2019</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={editions.sp2016} onChange={e => setEditions({...editions, sp2016: e.target.checked})} className="checkbox" /> SP 2016</label>
          </div>
          {Object.keys(editions).map(ed => (editions as any)[ed] && (
            <div key={ed} className="p-4 bg-muted/20 rounded">
              <h3 className="font-semibold mb-2">{ed.toUpperCase()} Servers</h3>
              <div className="grid grid-cols-2 gap-2">
                {servers.map(s => {
                  const assignedToOther = isServerAssignedToOtherEdition(s.id, ed);
                  const isAssigned = (spAssignments[ed] || []).includes(s.id);
                  return (
                    <label key={s.id} className={`flex items-center gap-2 ${assignedToOther ? 'opacity-50' : ''}`}>
                      <input type="checkbox" disabled={assignedToOther} checked={isAssigned} onChange={() => toggleSpAssignment(ed, s.id)} className="checkbox" />
                      {s.name} ({s.ip})
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Step 2 */}
        <div className="bg-card border border-border p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-bold">2. SQL Configuration</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm">SQL Server Target</label>
              <select value={sqlServer} onChange={e => setSqlServer(e.target.value)} className="w-full bg-background border p-2 rounded">
                <option value="">-- Select Server --</option>
                {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm">Installation Disk</label>
              <select value={sqlDisk} onChange={e => setSqlDisk(e.target.value)} className="w-full bg-background border p-2 rounded">
                <option value="">-- Select Disk --</option>
                {disks.map(d => <option key={d.id} value={d.id}>{d.id} ({d.sizeGB}GB)</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm">Instance Name</label>
              <input type="text" value={sqlInstance} onChange={e => setSqlInstance(e.target.value)} className="w-full bg-background border p-2 rounded" />
            </div>
            <div>
              <label className="block mb-1 text-sm">SQL Admins</label>
              <div className="flex gap-2 items-center">
                <span className="flex-1 bg-background border p-2 rounded truncate">{sqlAdmins.join(", ")}</span>
                <Dialog open={isAdOpen} onOpenChange={setIsAdOpen}>
                  <DialogTrigger asChild>
                    <button className="bg-primary text-primary-foreground px-3 py-2 rounded">...</button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Search AD Users</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-2 mt-4">
                      <input value={adSearchQuery} onChange={e => setAdSearchQuery(e.target.value)} className="flex-1 bg-background border p-2 rounded" placeholder="Username..." />
                      <button onClick={searchAd} className="bg-primary text-primary-foreground px-4 py-2 rounded">Search</button>
                    </div>
                    <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                      {adSearchResults.map(u => (
                        <div key={u} className="flex justify-between items-center p-2 hover:bg-muted rounded">
                          <span>{u}</span>
                          <button onClick={() => { setSqlAdmins([...sqlAdmins, u]); setIsAdOpen(false); }} className="text-primary font-bold text-sm">Add</button>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-card border border-border p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-bold">3. File Share & Downloads</h2>
          <label className="flex items-center gap-2 mb-4">
            <input type="checkbox" checked={useExistingShare} onChange={e => setUseExistingShare(e.target.checked)} className="checkbox" /> Use Existing FileShare
          </label>
          
          {useExistingShare ? (
            <div>
              <label className="block mb-1 text-sm">Existing Network URL</label>
              <input type="text" value={fileShareUrl} onChange={e => setFileShareUrl(e.target.value)} placeholder="\\server\share" className="w-full bg-background border p-2 rounded" />
            </div>
          ) : (
            <div>
              <label className="block mb-1 text-sm">DC Local Path to Share</label>
              <input type="text" value={fileSharePath} onChange={e => setFileSharePath(e.target.value)} className="w-full bg-background border p-2 rounded" />
            </div>
          )}

          <div className="space-y-4 mt-6">
            <h3 className="font-semibold">Downloads</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" checked={filesDownloaded.sp} onChange={e => setFilesDownloaded({...filesDownloaded, sp: e.target.checked})} className="checkbox" /> SP ISO Downloaded</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={filesDownloaded.sql} onChange={e => setFilesDownloaded({...filesDownloaded, sql: e.target.checked})} className="checkbox" /> SQL ISO Downloaded</label>
            </div>
            
            {!filesDownloaded.sp && (
              <div className="flex gap-2">
                <input type="text" value={spDownloadUrl} onChange={e => setSpDownloadUrl(e.target.value)} className="flex-1 bg-background border p-2 rounded" placeholder="SP Download URL" />
                <button onClick={() => testUrl(spDownloadUrl)} className="bg-secondary text-secondary-foreground px-4 py-2 rounded">Test</button>
              </div>
            )}
            {!filesDownloaded.sql && (
              <div className="flex gap-2">
                <input type="text" value={sqlDownloadUrl} onChange={e => setSqlDownloadUrl(e.target.value)} className="flex-1 bg-background border p-2 rounded" placeholder="SQL Download URL" />
                <button onClick={() => testUrl(sqlDownloadUrl)} className="bg-secondary text-secondary-foreground px-4 py-2 rounded">Test</button>
              </div>
            )}
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-card border border-border p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-bold">4. Execution Modes</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={execution.downloadSql} onChange={e => setExecution({...execution, downloadSql: e.target.checked})} className="checkbox" /> Download SQL files</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={execution.installSql} onChange={e => setExecution({...execution, installSql: e.target.checked})} className="checkbox" /> Install SQL silently</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={execution.downloadSp} onChange={e => setExecution({...execution, downloadSp: e.target.checked})} className="checkbox" /> Download SharePoint files</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={execution.installSp} onChange={e => setExecution({...execution, installSp: e.target.checked})} className="checkbox" /> Install SharePoint silently</label>
          </div>
        </div>

        {/* Execute */}
        <div className="flex justify-end">
          <button onClick={executeSetup} className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-bold flex items-center gap-2">
            <Play size={20} /> Execute Deployment
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
