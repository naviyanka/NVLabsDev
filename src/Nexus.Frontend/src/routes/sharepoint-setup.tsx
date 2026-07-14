import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { getServersClient as getServers, type Server } from "@/api/client";
import { getApiUrl } from "@/lib/backend";
import { toast } from "sonner";
import { Save, Search, Play, CheckCircle2, Circle, ChevronDown, ChevronRight, RefreshCw, XCircle } from "lucide-react";
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

const SP_URLS: Record<string, string> = {
  "SPSE": "https://download.microsoft.com/download/3/f/5/3f5f8a7e-462b-41ff-a5b2-04bdf5821ceb/OfficeServer.iso",
  "SP2019": "https://download.microsoft.com/download/c/b/a/cba01793-1c8a-4671-be0d-38c9e5bbd0e9/officeserver.img",
  "SP2016": "https://download.microsoft.com/download/0/0/4/004ee264-7043-45bf-99e3-3f74ecae13e5/officeserver.img"
};

const SQL_URLS: Record<string, string> = {
  "SPSE": "https://go.microsoft.com/fwlink/?linkid=2215202&clcid=0x409&culture=en-us&country=us", // SQL2022
  "SP2019": "https://go.microsoft.com/fwlink/?linkid=866664&clcid=0x409&culture=en-us&country=us", // SQL2019
  "SP2016": "https://go.microsoft.com/fwlink/?linkid=799011&clcid=0x409&culture=en-us&country=us"  // SQL2016
};

type EditionConfig = {
  spServers: string[];
  sqlTargetServer: string;
  sqlInstanceName: string;
  sqlDisk: string;
  sqlAdmins: string[];
  spDownloadUrl: string;
  sqlDownloadUrl: string;
  spDownloaded: boolean;
  sqlDownloaded: boolean;
};

function SharePointSetupPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [editions, setEditions] = useState({ SPSE: false, SP2019: false, SP2016: false });
  const [configs, setConfigs] = useState<Record<string, EditionConfig>>({
    SPSE: { spServers: [], sqlTargetServer: "", sqlInstanceName: "MSSQLSERVER", sqlDisk: "", sqlAdmins: ["Administrator"], spDownloadUrl: SP_URLS["SPSE"], sqlDownloadUrl: SQL_URLS["SPSE"], spDownloaded: false, sqlDownloaded: false },
    SP2019: { spServers: [], sqlTargetServer: "", sqlInstanceName: "MSSQLSERVER", sqlDisk: "", sqlAdmins: ["Administrator"], spDownloadUrl: SP_URLS["SP2019"], sqlDownloadUrl: SQL_URLS["SP2019"], spDownloaded: false, sqlDownloaded: false },
    SP2016: { spServers: [], sqlTargetServer: "", sqlInstanceName: "MSSQLSERVER", sqlDisk: "", sqlAdmins: ["Administrator"], spDownloadUrl: SP_URLS["SP2016"], sqlDownloadUrl: SQL_URLS["SP2016"], spDownloaded: false, sqlDownloaded: false },
  });

  const [disksByServer, setDisksByServer] = useState<Record<string, any[]>>({});

  const [useExistingShare, setUseExistingShare] = useState(false);
  const [fileSharePath, setFileSharePath] = useState("C:\\NexusDeploy\\SharePoint");
  const [fileShareUrl, setFileShareUrl] = useState("");

  const [execution, setExecution] = useState({ downloadSql: true, installSql: false, downloadSp: true, installSp: false });

  const [adSearchQuery, setAdSearchQuery] = useState("");
  const [adSearchResults, setAdSearchResults] = useState<string[]>([]);
  const [isAdSearching, setIsAdSearching] = useState(false);
  const [adOpenForEdition, setAdOpenForEdition] = useState<string | null>(null);

  // Job Polling State
  const [jobs, setJobs] = useState<any[]>([]);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(true);

  useEffect(() => {
    getServers().then(setServers).catch(console.error);
  }, []);

  // Poll jobs
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(getApiUrl("/plugins/sharepointsetup/jobs"))
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d)) setJobs(d);
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchDisks = (serverId: string) => {
    if (disksByServer[serverId]) return;
    const token = localStorage.getItem("nexus_token");
    fetch(getApiUrl(`/servers/${serverId}/disks`), {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => setDisksByServer(prev => ({ ...prev, [serverId]: Array.isArray(d) ? d : [] })))
      .catch(() => toast.error("Failed to fetch disks"));
  };

  const updateConfig = (edition: string, key: keyof EditionConfig, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [edition]: { ...prev[edition], [key]: value }
    }));
    if (key === "sqlTargetServer" && value) {
      fetchDisks(value as string);
    }
  };

  const searchAd = async () => {
    setIsAdSearching(true);
    try {
      const token = localStorage.getItem("nexus_token");
      const res = await fetch(getApiUrl(`/activedirectory/search?q=${adSearchQuery}`), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setAdSearchResults(await res.json());
      }
    } catch {
      toast.error("Failed to search AD");
    } finally {
      setIsAdSearching(false);
    }
  };

  const isServerAssignedToOtherEdition = (serverId: string, currentEdition: string) => {
    return Object.keys(editions).some(ed => 
      (editions as any)[ed] && ed !== currentEdition && configs[ed].spServers.includes(serverId)
    );
  };

  const toggleSpAssignment = (edition: string, serverId: string) => {
    const current = configs[edition].spServers;
    if (current.includes(serverId)) {
      updateConfig(edition, "spServers", current.filter(s => s !== serverId));
    } else {
      updateConfig(edition, "spServers", [...current, serverId]);
    }
  };

  const executeSetup = async () => {
    try {
      const activeConfigs = Object.keys(editions)
        .filter(ed => (editions as any)[ed])
        .map(ed => ({
          spEdition: ed,
          spServers: configs[ed].spServers,
          sqlTargetServer: configs[ed].sqlTargetServer,
          sqlInstanceName: configs[ed].sqlInstanceName,
          sqlDisk: configs[ed].sqlDisk,
          sqlAdmins: configs[ed].sqlAdmins,
          spDownloadUrl: configs[ed].spDownloadUrl,
          sqlDownloadUrl: configs[ed].sqlDownloadUrl,
          spDownloaded: configs[ed].spDownloaded,
          sqlDownloaded: configs[ed].sqlDownloaded,
        }));

      if (activeConfigs.length === 0) {
        toast.warning("Select at least one SharePoint Edition!");
        return;
      }

      const payload = {
        configurations: activeConfigs,
        fileSharePath: useExistingShare ? "" : fileSharePath,
        fileShareUrl: useExistingShare ? fileShareUrl : `\\\\127.0.0.1\\SPSetup`,
        downloadSql: execution.downloadSql,
        installSql: execution.installSql,
        downloadSp: execution.downloadSp,
        installSp: execution.installSp
      };

      const token = localStorage.getItem("nexus_token");
      const res = await fetch(getApiUrl('/plugins/sharepointsetup/execute'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) toast.success("Setup execution started!");
      else toast.error("Setup failed to start.");
    } catch {
      toast.error("Error executing setup");
    }
  };

  const stopJob = async (serverIp: string) => {
    const token = localStorage.getItem("nexus_token");
    fetch(getApiUrl(`/plugins/sharepointsetup/stop?serverIp=${serverIp}`), { method: "POST", headers: { "Authorization": `Bearer ${token}` }});
  };
  const stopAllJobs = async () => {
    const token = localStorage.getItem("nexus_token");
    fetch(getApiUrl(`/plugins/sharepointsetup/stop`), { method: "POST", headers: { "Authorization": `Bearer ${token}` }});
  };

  const retryJob = async (serverIp: string) => {
    const token = localStorage.getItem("nexus_token");
    fetch(getApiUrl(`/plugins/sharepointsetup/jobs/${serverIp}/retry`), { method: "POST", headers: { "Authorization": `Bearer ${token}` }})
      .then(() => toast.success("Job restarted"));
  };

  // Compute active editions
  const activeEditions = Object.keys(editions).filter(ed => (editions as any)[ed]);
  const hasSelections = activeEditions.length > 0;

  // Process Jobs to get overall progress and specific media progress
  let overallProgress = 0;
  let totalTasks = 0;
  let completedTasks = 0;
  const downloadProgress: Record<string, number> = {};

  jobs.forEach(job => {
    const lines = (job.output || "").split("\n");
    let jobPct = 0;
    lines.forEach((l: string) => {
      const match = l.match(/\[PROGRESS\|(.+?)\|(\d+)\]/);
      if (match) {
        const tag = match[1];
        const pct = parseInt(match[2], 10);
        downloadProgress[tag] = Math.max(downloadProgress[tag] || 0, pct);
        jobPct = Math.max(jobPct, pct);
      }
    });
    totalTasks += 1;
    if (job.status === "Completed") completedTasks += 1;
    else if (job.status === "Running") completedTasks += (jobPct / 100);
  });
  if (totalTasks > 0) overallProgress = Math.round((completedTasks / totalTasks) * 100);

  return (
    <PageWrapper>
      <PageHeader title="SharePoint Setup Plugin" />
      <div className="max-w-4xl mx-auto space-y-6 pb-64">

        {/* TOP PROGRESS */}
        {jobs.length > 0 && (
          <div className="bg-card border border-border p-6 rounded-lg space-y-4 shadow-sm mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">Overall Task Progress</h2>
              <div className="flex gap-2">
                <button onClick={stopAllJobs} className="flex items-center gap-1 text-sm bg-destructive text-destructive-foreground px-3 py-1 rounded hover:bg-destructive/90"><XCircle size={16}/> Stop All</button>
                <button onClick={executeSetup} className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90"><RefreshCw size={16}/> Retry Task</button>
              </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-4">
              <div className="bg-primary h-4 rounded-full transition-all duration-300" style={{ width: `${overallProgress}%` }}></div>
            </div>
            <p className="text-sm text-right text-muted-foreground">{overallProgress}% Complete ({jobs.filter(j => j.status === 'Completed').length} / {jobs.length} jobs done)</p>
          </div>
        )}

        {/* Step 1 */}
        <div className="bg-card border border-border p-6 rounded-lg space-y-4 shadow-sm">
          <h2 className="text-xl font-bold flex items-center gap-2">1. SharePoint Edition & Assignment</h2>
          <div className="flex gap-6 p-4 bg-background rounded border">
            {Object.keys(editions).map(ed => (
              <label key={ed} className="flex items-center gap-2 cursor-pointer font-medium">
                <input type="checkbox" checked={(editions as any)[ed]} onChange={e => setEditions({ ...editions, [ed]: e.target.checked })} className="checkbox w-5 h-5" /> 
                {ed}
              </label>
            ))}
          </div>
          {activeEditions.map(ed => (
            <div key={ed} className="p-4 bg-muted/30 rounded border">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Circle size={14} className="text-primary fill-primary"/> {ed} Servers</h3>
              <div className="grid grid-cols-2 gap-3">
                {servers.map(s => {
                  const assignedToOther = isServerAssignedToOtherEdition(s.id, ed);
                  const isAssigned = configs[ed].spServers.includes(s.id);
                  return (
                    <label key={s.id} className={`flex items-center gap-2 p-2 rounded border ${assignedToOther ? 'opacity-50 bg-muted' : 'hover:bg-accent/50 cursor-pointer'} ${isAssigned ? 'bg-primary/10 border-primary' : 'bg-background'}`}>
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
        {hasSelections && (
          <div className="bg-card border border-border p-6 rounded-lg space-y-4 shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2">2. SQL Configurations</h2>
            {activeEditions.map(ed => (
              <div key={ed} className="p-4 bg-muted/30 rounded border space-y-4 mb-4">
                <h3 className="font-semibold flex items-center gap-2"><Circle size={14} className="text-primary fill-primary"/> SQL Target for {ed}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">SQL Server</label>
                    <select value={configs[ed].sqlTargetServer} onChange={e => updateConfig(ed, "sqlTargetServer", e.target.value)} className="w-full bg-background border p-2 rounded">
                      <option value="">-- Select Server --</option>
                      {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Installation Disk</label>
                    <select value={configs[ed].sqlDisk} onChange={e => updateConfig(ed, "sqlDisk", e.target.value)} className="w-full bg-background border p-2 rounded">
                      <option value="">-- Select Disk --</option>
                      {(disksByServer[configs[ed].sqlTargetServer] || []).map(d => <option key={d.id} value={d.id}>{d.id} ({d.sizeGB}GB)</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Instance Name</label>
                    <input type="text" value={configs[ed].sqlInstanceName} onChange={e => updateConfig(ed, "sqlInstanceName", e.target.value)} className="w-full bg-background border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">SQL Admins</label>
                    <div className="flex gap-2 items-center">
                      <span className="flex-1 bg-background border p-2 rounded truncate">{configs[ed].sqlAdmins.join(", ")}</span>
                      <Dialog open={adOpenForEdition === ed} onOpenChange={(open) => setAdOpenForEdition(open ? ed : null)}>
                        <DialogTrigger asChild>
                          <button className="bg-primary text-primary-foreground px-3 py-2 rounded font-bold hover:bg-primary/90">...</button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Search AD Users ({ed})</DialogTitle>
                          </DialogHeader>
                          <div className="flex gap-2 mt-4">
                            <input value={adSearchQuery} onChange={e => setAdSearchQuery(e.target.value)} className="flex-1 bg-background border p-2 rounded" placeholder="Username..." />
                            <button onClick={searchAd} className="bg-primary text-primary-foreground px-4 py-2 rounded">Search</button>
                          </div>
                          <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                            {adSearchResults.map(u => (
                              <div key={u} className="flex justify-between items-center p-2 hover:bg-muted rounded">
                                <span>{u}</span>
                                <button onClick={() => { updateConfig(ed, "sqlAdmins", [...configs[ed].sqlAdmins, u]); setAdOpenForEdition(null); }} className="text-primary font-bold text-sm">Add</button>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 3 */}
        {hasSelections && (
          <div className="bg-card border border-border p-6 rounded-lg space-y-4 shadow-sm">
            <h2 className="text-xl font-bold">3. File Share & Downloads</h2>
            <label className="flex items-center gap-2 mb-4 cursor-pointer font-medium">
              <input type="checkbox" checked={useExistingShare} onChange={e => setUseExistingShare(e.target.checked)} className="checkbox w-5 h-5" /> Use Existing FileShare
            </label>

            {useExistingShare ? (
              <div>
                <label className="block mb-1 text-sm font-medium">Existing Network URL</label>
                <input type="text" value={fileShareUrl} onChange={e => setFileShareUrl(e.target.value)} placeholder="\\server\share" className="w-full bg-background border p-2 rounded" />
              </div>
            ) : (
              <div>
                <label className="block mb-1 text-sm font-medium">DC Local Path to Share (Will dynamically create SPSE, SP2019, SQL folders inside)</label>
                <input type="text" value={fileSharePath} onChange={e => setFileSharePath(e.target.value)} className="w-full bg-background border p-2 rounded" />
              </div>
            )}

            <div className="space-y-4 mt-6">
              <h3 className="font-semibold text-lg border-b pb-2">Media Download Links</h3>

              {activeEditions.map(ed => (
                <div key={ed} className="p-4 bg-background border rounded space-y-4">
                  <h4 className="font-semibold">{ed} Media</h4>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input type="checkbox" checked={configs[ed].spDownloaded} onChange={e => updateConfig(ed, "spDownloaded", e.target.checked)} className="checkbox" /> SP ISO Already Downloaded
                    </label>
                    {!configs[ed].spDownloaded && (
                      <div className="space-y-1 pl-6">
                        <label className="text-xs text-muted-foreground">SharePoint ISO URL</label>
                        <input type="text" value={configs[ed].spDownloadUrl} onChange={e => updateConfig(ed, "spDownloadUrl", e.target.value)} className="w-full bg-background border p-2 rounded text-sm" />
                        {downloadProgress[`SP_${ed}`] !== undefined && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Downloading...</span>
                              <span>{downloadProgress[`SP_${ed}`]}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${downloadProgress[`SP_${ed}`]}%` }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 mt-2 pt-2 border-t">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input type="checkbox" checked={configs[ed].sqlDownloaded} onChange={e => updateConfig(ed, "sqlDownloaded", e.target.checked)} className="checkbox" /> SQL ISO Already Downloaded
                    </label>
                    {!configs[ed].sqlDownloaded && (
                      <div className="space-y-1 pl-6">
                        <label className="text-xs text-muted-foreground">SQL Server ISO URL</label>
                        <input type="text" value={configs[ed].sqlDownloadUrl} onChange={e => updateConfig(ed, "sqlDownloadUrl", e.target.value)} className="w-full bg-background border p-2 rounded text-sm" />
                        {downloadProgress[`SQL_${ed}`] !== undefined && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Downloading...</span>
                              <span>{downloadProgress[`SQL_${ed}`]}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${downloadProgress[`SQL_${ed}`]}%` }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4 */}
        <div className="bg-card border border-border p-6 rounded-lg space-y-4 shadow-sm">
          <h2 className="text-xl font-bold">4. Execution Modes</h2>
          <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded border">
            <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" checked={execution.downloadSql} onChange={e => setExecution({ ...execution, downloadSql: e.target.checked })} className="checkbox w-5 h-5" /> Download SQL files</label>
            <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" checked={execution.installSql} onChange={e => setExecution({ ...execution, installSql: e.target.checked })} className="checkbox w-5 h-5" /> Install SQL silently</label>
            <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" checked={execution.downloadSp} onChange={e => setExecution({ ...execution, downloadSp: e.target.checked })} className="checkbox w-5 h-5" /> Download SharePoint files</label>
            <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="checkbox" checked={execution.installSp} onChange={e => setExecution({ ...execution, installSp: e.target.checked })} className="checkbox w-5 h-5" /> Install SharePoint silently</label>
          </div>
        </div>

        {/* Execute */}
        <div className="flex justify-end pt-4">
          <button onClick={executeSetup} className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:bg-primary/90 transition-colors">
            <Play size={20} /> Execute Deployment
          </button>
        </div>
      </div>

      {/* BOTTOM TERMINAL */}
      <div className={`fixed bottom-0 left-0 right-0 md:left-64 bg-card border-t border-border shadow-2xl transition-all duration-300 z-40 ${isTerminalExpanded ? 'h-64' : 'h-12'}`}>
        <div className="flex justify-between items-center px-4 py-2 bg-muted border-b cursor-pointer" onClick={() => setIsTerminalExpanded(!isTerminalExpanded)}>
          <h3 className="font-bold flex items-center gap-2 text-sm">
            {isTerminalExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
            Process Terminal ({jobs.length} jobs)
          </h3>
          <div className="text-xs text-muted-foreground">
            {jobs.filter(j => j.status === 'Running').length} Running | {jobs.filter(j => j.status === 'Failed').length} Failed
          </div>
        </div>
        {isTerminalExpanded && (
          <div className="h-52 overflow-y-auto p-4 bg-[#0c0c0c] text-[#cccccc] font-mono text-xs space-y-4">
            {jobs.length === 0 ? (
              <div className="text-muted-foreground text-center mt-10">No jobs running. Click Execute Deployment.</div>
            ) : (
              jobs.map((job, idx) => {
                const lines = (job.output || "").split("\n").filter((l: string) => l.trim().length > 0 && !l.includes("[PROGRESS|"));
                const lastLines = lines.slice(-5);
                return (
                  <div key={idx} className="border border-border/20 rounded bg-black p-2">
                    <div className="flex justify-between items-center mb-2 border-b border-border/20 pb-1">
                      <span className="font-bold text-primary">{job.serverIp}</span>
                      <div className="flex items-center gap-2">
                        {job.status === 'Running' && (
                          <button onClick={() => stopJob(job.serverIp)} className="text-red-400 hover:text-red-300 px-2 py-0.5 border border-red-900 rounded text-[10px]">Stop</button>
                        )}
                        {job.status === 'Failed' && (
                          <button onClick={() => retryJob(job.serverIp)} className="text-blue-400 hover:text-blue-300 px-2 py-0.5 border border-blue-900 rounded text-[10px]">Retry</button>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] ${job.status==='Running' ? 'bg-blue-900 text-blue-200' : job.status==='Completed' ? 'bg-green-900 text-green-200' : job.status==='Failed' ? 'bg-red-900 text-red-200' : 'bg-gray-800'}`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                    {lastLines.map((l: string, i: number) => (
                      <div key={i} className={`${l.includes('[ERROR]') ? 'text-red-400' : ''}`}>{l}</div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
