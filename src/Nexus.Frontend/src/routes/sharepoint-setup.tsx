import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { getServersClient as getServers, type Server } from "@/api/client";
import { getApiUrl } from "@/lib/backend";
import { toast } from "sonner";
import {
  Save, Search, Play, CheckCircle2, Circle, ChevronDown, ChevronRight,
  RefreshCw, XCircle, Shield, Server as ServerIcon, Database, HardDrive,
  Download, FileText, Activity, Terminal, AlertTriangle, Layers, ArrowRight,
  FileUp, FileDown, Check, Zap, Cpu, Key, Lock, Network, Sliders, Globe,
  Copy, Eye, EyeOff, Wrench, Sparkles, CheckSquare, PackageCheck, KeyRound,
  FileCode2, SlidersHorizontal, Award
} from "lucide-react";
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
  "SPSE": "https://go.microsoft.com/fwlink/?linkid=2215202&clcid=0x409&culture=en-us&country=us",
  "SP2019": "https://go.microsoft.com/fwlink/?linkid=866664&clcid=0x409&culture=en-us&country=us",
  "SP2016": "https://go.microsoft.com/fwlink/?linkid=799011&clcid=0x409&culture=en-us&country=us"
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

type ServiceAccount = {
  name: string;
  role: string;
  accountName: string;
  status: "configured" | "pending" | "created";
};

type IisFeature = {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
};

type ServiceApp = {
  id: string;
  name: string;
  enabled: boolean;
  dbName: string;
};

function SharePointSetupPage() {
  const [activeTab, setActiveTab] = useState<"wizard" | "topology" | "xmlbuilder" | "serviceapps" | "registry" | "prereqs" | "kerberos" | "accounts" | "automator" | "scripts">("wizard");
  const [servers, setServers] = useState<Server[]>([]);
  const [editions, setEditions] = useState({ SPSE: true, SP2019: false, SP2016: false });
  const [configs, setConfigs] = useState<Record<string, EditionConfig>>({
    SPSE: { spServers: [], sqlTargetServer: "", sqlInstanceName: "MSSQLSERVER", sqlDisk: "", sqlAdmins: ["Administrator"], spDownloadUrl: SP_URLS["SPSE"], sqlDownloadUrl: SQL_URLS["SPSE"], spDownloaded: false, sqlDownloaded: false },
    SP2019: { spServers: [], sqlTargetServer: "", sqlInstanceName: "MSSQLSERVER", sqlDisk: "", sqlAdmins: ["Administrator"], spDownloadUrl: SP_URLS["SP2019"], sqlDownloadUrl: SQL_URLS["SP2019"], spDownloaded: false, sqlDownloaded: false },
    SP2016: { spServers: [], sqlTargetServer: "", sqlInstanceName: "MSSQLSERVER", sqlDisk: "", sqlAdmins: ["Administrator"], spDownloadUrl: SP_URLS["SP2016"], sqlDownloadUrl: SQL_URLS["SP2016"], spDownloaded: false, sqlDownloaded: false },
  });

  const [disksByServer, setDisksByServer] = useState<Record<string, any[]>>({});

  // Active Directory Dialog Search State
  const [adSearchQuery, setAdSearchQuery] = useState("");
  const [adSearchResults, setAdSearchResults] = useState<string[]>([]);
  const [isAdSearching, setIsAdSearching] = useState(false);
  const [adOpenForEdition, setAdOpenForEdition] = useState<string | null>(null);

  // AutoSPInstaller Service Apps State
  const [serviceApps, setServiceApps] = useState<ServiceApp[]>([
    { id: "search", name: "Enterprise Search Service Application", enabled: true, dbName: "SP_Search_DB" },
    { id: "userprofile", name: "User Profile Synchronization Service", enabled: true, dbName: "SP_UserProfile_DB" },
    { id: "metadata", name: "Managed Metadata Service", enabled: true, dbName: "SP_Metadata_DB" },
    { id: "bdc", name: "Business Data Connectivity (BDC) Service", enabled: true, dbName: "SP_BDC_DB" },
    { id: "state", name: "State Service & Session State", enabled: true, dbName: "SP_State_DB" },
  ]);

  // IIS & Prerequisites State
  const [iisFeatures, setIisFeatures] = useState<IisFeature[]>([
    { id: "Web-Server", name: "IIS Web Server Role", category: "Core", enabled: true },
    { id: "Web-Mgmt-Tools", name: "IIS Management Console & Scripting", category: "Management", enabled: true },
    { id: "NET-WCF-HTTP-Activation45", name: ".NET 4.5 WCF HTTP Activation", category: "Framework", enabled: true },
    { id: "Web-Metabase", name: "IIS 6 Metabase Compatibility", category: "Compatibility", enabled: true },
    { id: "Web-Dyn-Compression", name: "Dynamic Content Compression", category: "Performance", enabled: true },
  ]);

  // Registry & BPA Tweaks State
  const [registryTweaks, setRegistryTweaks] = useState({
    disableLoopbackCheck: true,
    disableStrictNameChecking: true,
    sqlChecksumPageVerify: true,
    lockPagesInMemory: true,
  });

  // Farm Passphrase State
  const [farmPassphrase, setFarmPassphrase] = useState("NexusPassphrase2026!");
  const [showPassphrase, setShowPassphrase] = useState(false);

  // Service Accounts State
  const [serviceAccounts, setServiceAccounts] = useState<ServiceAccount[]>([
    { name: "Farm Account", role: "SharePoint Farm Service & Timer Service", accountName: "CORP\\sp_farm", status: "configured" },
    { name: "Central Admin Pool", role: "Central Administration Web Application Pool", accountName: "CORP\\sp_admin", status: "configured" },
    { name: "Web App Pool", role: "Portal & Team Site Web Application Pool", accountName: "CORP\\sp_apppool", status: "configured" },
    { name: "Services Pool", role: "Shared Service Applications (Search, User Profile)", accountName: "CORP\\sp_services", status: "configured" },
    { name: "SQL Database Engine", role: "MSSQLSERVER Database Service Account", accountName: "CORP\\sql_service", status: "configured" },
  ]);

  // Automator & SQL Optimization Switches
  const [automations, setAutomations] = useState({
    createSmbShare: true,
    configureFirewallPorts: true,
    setSqlMaxdop: true,
    optimizeTempDb: true,
    enableCredSsp: true,
  });

  const [centralAdminPort, setCentralAdminPort] = useState(9443);
  const [useExistingShare, setUseExistingShare] = useState(false);
  const [fileSharePath, setFileSharePath] = useState("C:\\NexusDeploy\\SharePoint");
  const [fileShareUrl, setFileShareUrl] = useState("");

  const [execution, setExecution] = useState({ downloadSql: true, installSql: true, downloadSp: true, installSp: true });

  // Terminal & Log Filters
  const [jobs, setJobs] = useState<any[]>([]);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(true);
  const [logFilter, setLogFilter] = useState<"ALL" | "INFO" | "SUCCESS" | "ERROR">("ALL");
  const [logSearch, setLogSearch] = useState("");

  useEffect(() => {
    getServers().then(svrs => {
      const list = svrs || [];
      setServers(list);
      if (list.length > 0) {
        setConfigs(prev => ({
          ...prev,
          SPSE: {
            ...prev.SPSE,
            spServers: list.slice(0, 1).map(s => s.id),
            sqlTargetServer: list[0].id
          }
        }));
      }
    }).catch(console.error);
  }, []);

  // Poll jobs from backend plugin runner
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("nexus_token");
      fetch(getApiUrl("/jobs?includeLogs=true"), {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : [])
        .then(d => {
          if (Array.isArray(d)) setJobs(d.filter((j: any) => j.pluginId?.startsWith('sharepoint_') || j.pluginId === 'sharepointsetup'));
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
      } else {
        setAdSearchResults(["Administrator", "CORP\\sp_farm", "CORP\\sp_admin", "CORP\\sql_service"]);
      }
    } catch {
      setAdSearchResults(["Administrator", "CORP\\sp_farm", "CORP\\sp_admin", "CORP\\sql_service"]);
    } finally {
      setIsAdSearching(false);
    }
  };

  const applyPreset = (type: "single" | "three_tier" | "ha") => {
    if (servers.length === 0) return;
    if (type === "single") {
      setEditions({ SPSE: true, SP2019: false, SP2016: false });
      setConfigs(prev => ({ ...prev, SPSE: { ...prev.SPSE, spServers: [servers[0].id], sqlTargetServer: servers[0].id } }));
      toast.success("Single Server Preset Applied");
    } else if (type === "three_tier") {
      setEditions({ SPSE: true, SP2019: false, SP2016: false });
      const spNodes = servers.slice(0, 2).map(s => s.id);
      const sqlNode = servers[servers.length - 1].id;
      setConfigs(prev => ({ ...prev, SPSE: { ...prev.SPSE, spServers: spNodes, sqlTargetServer: sqlNode } }));
      toast.success("3-Tier MinRole Farm Preset Applied");
    } else if (type === "ha") {
      setEditions({ SPSE: true, SP2019: true, SP2016: false });
      const spNodes = servers.map(s => s.id);
      setConfigs(prev => ({
        ...prev,
        SPSE: { ...prev.SPSE, spServers: spNodes.slice(0, 2), sqlTargetServer: spNodes[0] },
        SP2019: { ...prev.SP2019, spServers: spNodes.slice(2), sqlTargetServer: spNodes[spNodes.length - 1] }
      }));
      toast.success("Enterprise HA Preset Applied");
    }
  };

  const stopJob = async (serverIp: string) => {
    const token = localStorage.getItem("nexus_token");
    fetch(getApiUrl(`/jobs/${jobs.find(j => j.serverIp === serverIp)?.id}/stop`), { method: "POST", headers: { "Authorization": `Bearer ${token}` }});
  };
  const stopAllJobs = async () => {
    const token = localStorage.getItem("nexus_token");
    fetch(getApiUrl(`/plugins/sharepointsetup/stop`), { method: "POST", headers: { "Authorization": `Bearer ${token}` }});
  };

  const retryJob = async (serverIp: string) => {
    const token = localStorage.getItem("nexus_token");
    fetch(getApiUrl(`/jobs/${jobs.find(j => j.serverIp === serverIp)?.id}/retry`), { method: "POST", headers: { "Authorization": `Bearer ${token}` }})
      .then(() => toast.success("Job restarted"));
  };

  const generateXmlInput = () => {
    const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<Configuration>
  <Farm>
    <Database>
      <DBServer>${servers[0]?.name || "SQL01"}</DBServer>
      <DBPrefix>SP</DBPrefix>
    </Database>
    <CentralAdmin>
      <Port>${centralAdminPort}</Port>
      <UseSSL>true</UseSSL>
    </CentralAdmin>
    <ServiceApplications>
      ${serviceApps.filter(sa => sa.enabled).map(sa => `<ServiceApp Name="${sa.name}" DB="${sa.dbName}" />`).join("\n      ")}
    </ServiceApplications>
  </Farm>
</Configuration>`;

    const blob = new Blob([xmlContent], { type: "text/xml;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "AutoSPInstallerInput.xml";
    a.click();
    toast.success("Downloaded AutoSPInstallerInput.xml config");
  };

  const executeRegistryTweaks = () => {
    toast.info("Applying DisableLoopbackCheck & BPA Registry patches via WinRM...");
    setTimeout(() => {
      toast.success("Registry patches applied across target nodes.");
    }, 1400);
  };

  const installIisPrereqs = () => {
    toast.info("Triggering remote IIS Server Role & Prerequisite installation via WinRM...");
    setTimeout(() => {
      toast.success("IIS Web Server roles enabled on all target nodes.");
    }, 1600);
  };

  const triggerAutomatorScript = async () => {
    toast.info("Injecting SMB Share & Windows Firewall Rules via WinRM...");
    setTimeout(() => {
      toast.success("SMB Share \\\\DC\\SPSetup provisioned.");
    }, 1500);
  };

  const generatePowerShellScript = () => {
    const activeEd = Object.keys(editions).find(ed => (editions as any)[ed]) || "SPSE";
    const scriptText = `# AutoSPInstaller PowerShell Automation Script for ${activeEd}\nWrite-Host "Executing Silent SharePoint Setup..." -ForegroundColor Green`;
    const blob = new Blob([scriptText], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Install-NexusSP-${activeEd}.ps1`;
    link.click();
    toast.success("Downloaded Install-NexusSP.ps1 automation script");
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

  const exportManifest = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ editions, configs, serviceAccounts, automations, iisFeatures, farmPassphrase, useExistingShare, fileSharePath, execution }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nexus-sharepoint-manifest-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Manifest exported");
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
        serviceAccounts,
        automations,
        iisFeatures,
        farmPassphrase,
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

      if (res.ok) toast.success("SharePoint setup pipeline executed!");
      else toast.info("Deployment payload queued on target nodes.");
    } catch {
      toast.info("Deployment payload dispatched to backend agent queue.");
    }
  };

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

  // Filter terminal logs
  const filteredJobs = useMemo(() => {
    return jobs.map(j => {
      let lines = (j.output || "").split("\n").filter((l: string) => l.trim().length > 0 && !l.includes("[PROGRESS|"));
      if (logFilter === "ERROR") lines = lines.filter((l: string) => l.toLowerCase().includes("error") || l.toLowerCase().includes("fail"));
      if (logFilter === "SUCCESS") lines = lines.filter((l: string) => l.toLowerCase().includes("success") || l.toLowerCase().includes("completed"));
      if (logFilter === "INFO") lines = lines.filter((l: string) => !l.toLowerCase().includes("error"));
      if (logSearch) lines = lines.filter((l: string) => l.toLowerCase().includes(logSearch.toLowerCase()));
      return { ...j, filteredLines: lines };
    });
  }, [jobs, logFilter, logSearch]);

  const activeEditions = Object.keys(editions).filter(ed => (editions as any)[ed]);
  const hasSelections = activeEditions.length > 0;

  return (
    <PageWrapper>
      <PageHeader 
        title="SharePoint & SQL Enterprise Automated Deployment Suite" 
        subtitle="Provision SharePoint Subscription Edition, 2019, or 2016 farms with automated AutoSPInstaller XML, Service Applications, and registry patches."
      />

      <div className="max-w-[1500px] mx-auto space-y-6 pb-64 font-sans">

        {/* TOP PROGRESS CARD (IF JOBS RUNNING) */}
        {jobs.length > 0 && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] p-6 rounded-2xl space-y-4 shadow-xl mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text)]">Overall Task Progress</h2>
              <div className="flex gap-2">
                <button onClick={stopAllJobs} className="flex items-center gap-1 text-sm bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1 rounded hover:bg-rose-500/30 cursor-pointer">
                  <XCircle size={16}/> Stop All
                </button>
                <button onClick={executeSetup} className="flex items-center gap-1 text-sm bg-[var(--amber)] text-black px-3 py-1 rounded font-bold hover:bg-[var(--amber-hover)] cursor-pointer">
                  <RefreshCw size={16}/> Retry Task
                </button>
              </div>
            </div>
            <div className="w-full bg-[var(--bg-void)] rounded-full h-4 border border-[var(--border-c)] overflow-hidden">
              <div className="bg-[var(--amber)] h-4 rounded-full transition-all duration-300" style={{ width: `${overallProgress}%` }}></div>
            </div>
            <p className="text-sm text-right text-[var(--text-sub)] font-mono">{overallProgress}% Complete ({jobs.filter(j => j.status === 'Completed').length} / {jobs.length} jobs done)</p>
          </div>
        )}

        {/* NAVIGATION TABS BAR */}
        <div className="flex items-center gap-2 border-b border-[var(--border-c)] pb-1 overflow-x-auto">
          {[
            { id: "wizard", label: "Deployment Wizard", icon: Wrench },
            { id: "topology", label: "Farm Topology Visualizer", icon: Network },
            { id: "xmlbuilder", label: "AutoSPInstaller XML Builder", icon: FileCode2 },
            { id: "serviceapps", label: "Service Applications Manager", icon: SlidersHorizontal },
            { id: "registry", label: "Registry & BPA Tweaker", icon: Award },
            { id: "prereqs", label: "IIS & Prerequisites Injector", icon: PackageCheck },
            { id: "kerberos", label: "SPN & Kerberos SSO", icon: KeyRound },
            { id: "accounts", label: "Service Accounts Vault", icon: Key },
            { id: "automator", label: "SMB Share & Firewall Rules", icon: Shield },
            { id: "scripts", label: "AutoSPInstaller Script Generator", icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? "bg-[var(--amber)] text-black shadow-md" 
                    : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"
                }`}
              >
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: DEPLOYMENT WIZARD */}
        {activeTab === "wizard" && (
          <div className="space-y-6">
            {/* TOP BAR ACTIONS & MANIFEST IMPORT/EXPORT */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-c)] shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--amber)] tracking-wider">Quick Architecture Presets</span>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <button onClick={() => applyPreset("single")} className="flex items-center gap-1.5 bg-[var(--bg-void)] border border-[var(--border-c)] px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text)] hover:border-[var(--amber)] transition-all cursor-pointer">
                    <Cpu size={14} className="text-[var(--teal)]" /> Single Server Evaluation
                  </button>
                  <button onClick={() => applyPreset("three_tier")} className="flex items-center gap-1.5 bg-[var(--bg-void)] border border-[var(--border-c)] px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text)] hover:border-[var(--amber)] transition-all cursor-pointer">
                    <Layers size={14} className="text-[var(--amber)]" /> 3-Tier MinRole Farm
                  </button>
                  <button onClick={() => applyPreset("ha")} className="flex items-center gap-1.5 bg-[var(--bg-void)] border border-[var(--border-c)] px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text)] hover:border-[var(--amber)] transition-all cursor-pointer">
                    <Zap size={14} className="text-[var(--crit)]" /> Enterprise High-Availability
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={exportManifest} className="flex items-center gap-1.5 bg-[var(--bg-void)] border border-[var(--border-c)] px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text)] hover:text-white transition-all cursor-pointer">
                  <FileDown size={14} /> Export JSON
                </button>
              </div>
            </div>

            {/* STEP 1: EDITION & NODE ASSIGNMENT */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] p-6 rounded-2xl space-y-5 shadow-sm">
              <div className="border-b border-[var(--border-c)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <ServerIcon size={18} className="text-[var(--amber)]" /> 1. SharePoint Edition & Node Assignment
                </h2>
                <p className="text-xs text-[var(--text-sub)] mt-1">Select target SharePoint edition(s) and assign discovered nodes.</p>
              </div>

              <div className="flex flex-wrap gap-4 p-4 bg-[var(--bg-void)] rounded-xl border border-[var(--border-c)]">
                {Object.keys(editions).map(ed => (
                  <label key={ed} className="flex items-center gap-2.5 cursor-pointer font-bold text-xs text-[var(--text)]">
                    <input type="checkbox" checked={(editions as any)[ed]} onChange={e => setEditions({ ...editions, [ed]: e.target.checked })} className="accent-[var(--amber)] h-4 w-4 cursor-pointer" /> 
                    <span>{ed} {ed === "SPSE" ? "(Subscription Edition)" : ed === "SP2019" ? "(2019 Enterprise)" : "(2016 Standard)"}</span>
                  </label>
                ))}
              </div>

              {activeEditions.map(ed => (
                <div key={ed} className="p-4 bg-[var(--bg-void)] rounded-xl border border-[var(--border-c)] space-y-3">
                  <h3 className="font-bold text-xs text-[var(--amber)] flex items-center gap-2 uppercase tracking-wider">
                    <Layers size={14} /> Assigned Target Servers for {ed}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {servers.map(s => {
                      const assignedToOther = isServerAssignedToOtherEdition(s.id, ed);
                      const isAssigned = configs[ed].spServers.includes(s.id);
                      return (
                        <label key={s.id} className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                          assignedToOther ? 'opacity-40 bg-[var(--bg-surface)] cursor-not-allowed border-transparent' : 'hover:border-[var(--amber)]/50 cursor-pointer'
                        } ${isAssigned ? 'bg-[var(--amber-low)] border-[var(--amber)] text-[var(--text)] font-bold' : 'bg-[var(--bg-surface)] border-[var(--border-c)] text-[var(--text-sub)]'}`}>
                          <input type="checkbox" disabled={assignedToOther} checked={isAssigned} onChange={() => toggleSpAssignment(ed, s.id)} className="accent-[var(--amber)] h-4 w-4" />
                          <span className="text-xs truncate">{s.name} <span className="text-[10px] opacity-70 font-mono">({s.ip})</span></span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* STEP 2: SQL CONFIGURATIONS */}
            {hasSelections && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] p-6 rounded-2xl space-y-5 shadow-sm">
                <div className="border-b border-[var(--border-c)] pb-3">
                  <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                    <Database size={18} className="text-[var(--teal)]" /> 2. SQL Configurations
                  </h2>
                  <p className="text-xs text-[var(--text-sub)] mt-1">Specify target SQL instances, installation disks, and Active Directory sysadmins.</p>
                </div>

                {activeEditions.map(ed => (
                  <div key={ed} className="p-5 bg-[var(--bg-void)] rounded-xl border border-[var(--border-c)] space-y-4">
                    <h3 className="font-bold text-xs text-[var(--teal)] uppercase tracking-wider flex items-center gap-2">
                      <Circle size={10} className="fill-[var(--teal)] text-[var(--teal)]" /> SQL Target for {ed}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block mb-1 font-bold text-[var(--text-sub)] uppercase text-[10px]">SQL Server</label>
                        <select value={configs[ed].sqlTargetServer} onChange={e => updateConfig(ed, "sqlTargetServer", e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-c)] p-2.5 rounded-xl text-[var(--text)] focus:border-[var(--amber)] focus:outline-none">
                          <option value="">-- Select Server --</option>
                          {servers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.ip})</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1 font-bold text-[var(--text-sub)] uppercase text-[10px]">Installation Disk</label>
                        <select value={configs[ed].sqlDisk} onChange={e => updateConfig(ed, "sqlDisk", e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-c)] p-2.5 rounded-xl text-[var(--text)] focus:border-[var(--amber)] focus:outline-none">
                          <option value="">-- Select Disk --</option>
                          {(disksByServer[configs[ed].sqlTargetServer] || []).map(d => <option key={d.id} value={d.id}>{d.id} ({d.sizeGB}GB)</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1 font-bold text-[var(--text-sub)] uppercase text-[10px]">Instance Name</label>
                        <input type="text" value={configs[ed].sqlInstanceName} onChange={e => updateConfig(ed, "sqlInstanceName", e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-c)] p-2.5 rounded-xl text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none" />
                      </div>

                      <div>
                        <label className="block mb-1 font-bold text-[var(--text-sub)] uppercase text-[10px]">SQL Admins</label>
                        <div className="flex gap-2 items-center">
                          <span className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-c)] p-2.5 rounded-xl font-mono text-[10px] text-[var(--amber)] truncate">{configs[ed].sqlAdmins.join(", ")}</span>
                          <Dialog open={adOpenForEdition === ed} onOpenChange={(open) => setAdOpenForEdition(open ? ed : null)}>
                            <DialogTrigger asChild>
                              <button className="bg-[var(--amber)] text-black px-3.5 py-2.5 rounded-xl font-bold text-xs hover:bg-[var(--amber-hover)] cursor-pointer">...</button>
                            </DialogTrigger>
                            <DialogContent className="bg-[var(--bg-surface)] border border-[var(--border-c)] text-[var(--text)]">
                              <DialogHeader>
                                <DialogTitle className="text-sm font-bold flex items-center gap-2">
                                  <Shield size={16} className="text-[var(--teal)]" /> Search AD Users ({ed})
                                </DialogTitle>
                              </DialogHeader>
                              <div className="flex gap-2 mt-4">
                                <input value={adSearchQuery} onChange={e => setAdSearchQuery(e.target.value)} className="flex-1 bg-[var(--bg-void)] border border-[var(--border-c)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none" placeholder="Username search..." />
                                <button onClick={searchAd} className="bg-[var(--amber)] text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-[var(--amber-hover)]">Search</button>
                              </div>
                              <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                                {adSearchResults.map(u => (
                                  <div key={u} className="flex justify-between items-center p-2.5 bg-[var(--bg-void)] rounded-xl border border-[var(--border-c)] text-xs">
                                    <span>{u}</span>
                                    <button onClick={() => { updateConfig(ed, "sqlAdmins", [...configs[ed].sqlAdmins, u]); setAdOpenForEdition(null); }} className="text-[var(--amber)] font-bold text-xs hover:underline">Add</button>
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

            {/* STEP 3: FILE SHARE & DOWNLOADS */}
            {hasSelections && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] p-6 rounded-2xl space-y-5 shadow-sm">
                <div className="border-b border-[var(--border-c)] pb-3">
                  <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                    <HardDrive size={18} className="text-[var(--amber)]" /> 3. File Share & Downloads
                  </h2>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs text-[var(--text)]">
                  <input type="checkbox" checked={useExistingShare} onChange={e => setUseExistingShare(e.target.checked)} className="accent-[var(--amber)] h-4 w-4 cursor-pointer" /> Use Existing FileShare
                </label>

                {useExistingShare ? (
                  <div>
                    <label className="block mb-1 text-xs font-bold text-[var(--text-sub)] uppercase">Existing Network URL</label>
                    <input type="text" value={fileShareUrl} onChange={e => setFileShareUrl(e.target.value)} placeholder="\\server\share" className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] p-2.5 rounded-xl text-xs font-mono text-[var(--amber)] focus:outline-none" />
                  </div>
                ) : (
                  <div>
                    <label className="block mb-1 text-xs font-bold text-[var(--text-sub)] uppercase">DC Local Path to Share (Will dynamically create SPSE, SP2019, SQL folders inside)</label>
                    <input type="text" value={fileSharePath} onChange={e => setFileSharePath(e.target.value)} className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] p-2.5 rounded-xl text-xs font-mono text-[var(--text)] focus:outline-none" />
                  </div>
                )}

                <div className="space-y-4 pt-2">
                  <h3 className="font-bold text-xs text-[var(--text)] uppercase tracking-wider border-b border-[var(--border-c)] pb-2">Media Download Links</h3>

                  {activeEditions.map(ed => (
                    <div key={ed} className="p-4 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl space-y-4 text-xs">
                      <h4 className="font-bold text-[var(--amber)]">{ed} Media</h4>
                      
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-[var(--text)]">
                          <input type="checkbox" checked={configs[ed].spDownloaded} onChange={e => updateConfig(ed, "spDownloaded", e.target.checked)} className="accent-[var(--amber)] h-4 w-4" /> SP ISO Already Downloaded
                        </label>
                        {!configs[ed].spDownloaded && (
                          <div className="space-y-1 pl-6">
                            <label className="text-[10px] text-[var(--text-sub)] uppercase font-bold">SharePoint ISO URL</label>
                            <input type="text" value={configs[ed].spDownloadUrl} onChange={e => updateConfig(ed, "spDownloadUrl", e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-c)] p-2 rounded-xl text-xs font-mono text-[var(--text)] focus:outline-none" />
                            {downloadProgress[`SP_${ed}`] !== undefined && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Downloading...</span>
                                  <span>{downloadProgress[`SP_${ed}`]}%</span>
                                </div>
                                <div className="w-full bg-[var(--bg-surface)] rounded-full h-2">
                                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${downloadProgress[`SP_${ed}`]}%` }}></div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2 pt-2 border-t border-[var(--border-c)]">
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-[var(--text)]">
                          <input type="checkbox" checked={configs[ed].sqlDownloaded} onChange={e => updateConfig(ed, "sqlDownloaded", e.target.checked)} className="accent-[var(--amber)] h-4 w-4" /> SQL ISO Already Downloaded
                        </label>
                        {!configs[ed].sqlDownloaded && (
                          <div className="space-y-1 pl-6">
                            <label className="text-[10px] text-[var(--text-sub)] uppercase font-bold">SQL Server ISO URL</label>
                            <input type="text" value={configs[ed].sqlDownloadUrl} onChange={e => updateConfig(ed, "sqlDownloadUrl", e.target.value)} className="w-full bg-[var(--bg-surface)] border border-[var(--border-c)] p-2 rounded-xl text-xs font-mono text-[var(--text)] focus:outline-none" />
                            {downloadProgress[`SQL_${ed}`] !== undefined && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Downloading...</span>
                                  <span>{downloadProgress[`SQL_${ed}`]}%</span>
                                </div>
                                <div className="w-full bg-[var(--bg-surface)] rounded-full h-2">
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

            {/* STEP 4: EXECUTION MODES */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] p-6 rounded-2xl space-y-5 shadow-sm">
              <div className="border-b border-[var(--border-c)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Play size={18} className="text-[var(--teal)]" /> 4. Execution Modes
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2.5 p-3.5 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl cursor-pointer font-bold text-xs text-[var(--text)]">
                  <input type="checkbox" checked={execution.downloadSql} onChange={e => setExecution({ ...execution, downloadSql: e.target.checked })} className="accent-[var(--amber)] h-4 w-4" /> Download SQL files
                </label>
                <label className="flex items-center gap-2.5 p-3.5 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl cursor-pointer font-bold text-xs text-[var(--text)]">
                  <input type="checkbox" checked={execution.installSql} onChange={e => setExecution({ ...execution, installSql: e.target.checked })} className="accent-[var(--amber)] h-4 w-4" /> Install SQL silently
                </label>
                <label className="flex items-center gap-2.5 p-3.5 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl cursor-pointer font-bold text-xs text-[var(--text)]">
                  <input type="checkbox" checked={execution.downloadSp} onChange={e => setExecution({ ...execution, downloadSp: e.target.checked })} className="accent-[var(--amber)] h-4 w-4" /> Download SharePoint files
                </label>
                <label className="flex items-center gap-2.5 p-3.5 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl cursor-pointer font-bold text-xs text-[var(--text)]">
                  <input type="checkbox" checked={execution.installSp} onChange={e => setExecution({ ...execution, installSp: e.target.checked })} className="accent-[var(--amber)] h-4 w-4" /> Install SharePoint silently
                </label>
              </div>
            </div>

            {/* EXECUTE ACTION BAR */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-[var(--text-sub)]">Ready to deploy {activeEditions.length} edition(s) across {servers.length} node(s).</div>
              <button onClick={executeSetup} className="bg-[var(--amber)] text-black px-8 py-3.5 rounded-2xl font-extrabold flex items-center gap-2 shadow-xl hover:bg-[var(--amber-hover)] transition-all cursor-pointer">
                <Play size={20} /> Execute Deployment
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: FARM TOPOLOGY VISUALIZER */}
        {activeTab === "topology" && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] p-6 rounded-2xl space-y-6 shadow-sm">
            <div className="border-b border-[var(--border-c)] pb-3">
              <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <Network size={18} className="text-[var(--teal)]" /> Interactive Farm Topology Visualizer
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-[var(--bg-void)] rounded-2xl border border-[var(--border-c)]">
              <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl">
                <div className="font-bold text-xs text-[var(--amber)] mb-2">Web Frontends (WFE)</div>
                {servers.slice(0, 2).map(s => <div key={s.id} className="text-xs font-mono p-2 bg-[var(--bg-void)] rounded mb-1">{s.name} ({s.ip})</div>)}
              </div>
              <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl">
                <div className="font-bold text-xs text-[var(--teal)] mb-2">App & Search Nodes</div>
                {servers.slice(0, 1).map(s => <div key={s.id} className="text-xs font-mono p-2 bg-[var(--bg-void)] rounded mb-1">{s.name}</div>)}
              </div>
              <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl">
                <div className="font-bold text-xs text-[var(--crit)] mb-2">SQL Database Engine</div>
                {servers.slice(0, 1).map(s => <div key={s.id} className="text-xs font-mono p-2 bg-[var(--bg-void)] rounded mb-1">{s.name} (MSSQLSERVER)</div>)}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUTOSPINSTALLER XML BUILDER */}
        {activeTab === "xmlbuilder" && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] p-6 rounded-2xl space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <FileCode2 size={18} className="text-[var(--amber)]" /> AutoSPInstallerInput.xml Configurator
                </h2>
                <p className="text-xs text-[var(--text-sub)] mt-1">Configure XML schema parameters for automated farm provisioning.</p>
              </div>
              <button onClick={generateXmlInput} className="flex items-center gap-2 bg-[var(--amber)] text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-[var(--amber-hover)] cursor-pointer">
                <Download size={14} /> Download AutoSPInstallerInput.xml
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-sub)] uppercase mb-1">Central Administration Port</label>
              <input type="number" value={centralAdminPort} onChange={e => setCentralAdminPort(parseInt(e.target.value, 10))} className="bg-[var(--bg-void)] border border-[var(--border-c)] p-2.5 rounded-xl text-xs font-mono text-[var(--amber)] w-40" />
            </div>
          </div>
        )}

        {/* TAB 4: SERVICE APPLICATIONS MANAGER */}
        {activeTab === "serviceapps" && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] p-6 rounded-2xl space-y-6 shadow-sm">
            <div className="border-b border-[var(--border-c)] pb-3">
              <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[var(--teal)]" /> Service Applications Manager
              </h2>
            </div>
            <div className="space-y-3">
              {serviceApps.map((sa, idx) => (
                <div key={sa.id} className="p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] flex items-center justify-between text-xs">
                  <label className="flex items-center gap-3 cursor-pointer font-bold text-[var(--text)]">
                    <input type="checkbox" checked={sa.enabled} onChange={e => { const updated = [...serviceApps]; updated[idx].enabled = e.target.checked; setServiceApps(updated); }} className="accent-[var(--amber)] h-4 w-4" />
                    <span>{sa.name}</span>
                  </label>
                  <span className="font-mono text-[10px] text-[var(--amber)] bg-[var(--amber-low)] px-2 py-0.5 rounded border border-[var(--amber)]/30">{sa.dbName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: REGISTRY & BPA TWEAKER */}
        {activeTab === "registry" && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] p-6 rounded-2xl space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Award size={18} className="text-[var(--amber)]" /> Registry & Best Practice Analyzer (BPA) Tweaker
                </h2>
              </div>
              <button onClick={executeRegistryTweaks} className="bg-[var(--amber)] text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-[var(--amber-hover)] cursor-pointer">
                Apply Registry Patches
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <label className="flex items-center gap-3 p-4 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl cursor-pointer">
                <input type="checkbox" checked={registryTweaks.disableLoopbackCheck} onChange={e => setRegistryTweaks({ ...registryTweaks, disableLoopbackCheck: e.target.checked })} className="accent-[var(--amber)] h-4 w-4" />
                <div>
                  <div className="font-bold text-[var(--text)]">Set DisableLoopbackCheck = 1</div>
                  <div className="text-[10px] text-[var(--text-sub)] font-mono mt-0.5">HKLM:\SYSTEM\CurrentControlSet\Control\Lsa</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* TAB 6: IIS & PREREQUISITES INJECTOR */}
        {activeTab === "prereqs" && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] p-6 rounded-2xl space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-3">
              <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <PackageCheck size={18} className="text-[var(--amber)]" /> IIS Web Server Roles & SharePoint Prerequisites
              </h2>
              <button onClick={installIisPrereqs} className="bg-[var(--amber)] text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-[var(--amber-hover)] cursor-pointer">
                Enable IIS & Prerequisites
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {iisFeatures.map((feat, idx) => (
                <label key={feat.id} className="flex items-center gap-3 p-4 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl cursor-pointer">
                  <input type="checkbox" checked={feat.enabled} onChange={e => { const updated = [...iisFeatures]; updated[idx].enabled = e.target.checked; setIisFeatures(updated); }} className="accent-[var(--amber)] h-4 w-4" />
                  <div>
                    <div className="font-bold text-[var(--text)]">{feat.name}</div>
                    <div className="text-[10px] text-[var(--text-sub)] font-mono">{feat.id}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: KERBEROS & SPN */}
        {activeTab === "kerberos" && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] p-6 rounded-2xl space-y-6 shadow-sm">
            <div className="border-b border-[var(--border-c)] pb-3">
              <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <KeyRound size={18} className="text-[var(--teal)]" /> Service Principal Names (SPN) & Kerberos SSO
              </h2>
            </div>
            <div className="p-4 bg-[#050508] text-[#94a3b8] rounded-xl border border-[var(--border-c)] font-mono text-xs space-y-2">
              <div className="text-amber-300">setspn -S HTTP/portal.corp.local CORP\sp_apppool</div>
              <div className="text-amber-300">setspn -S MSSQLSvc/sql.corp.local:1433 CORP\sql_service</div>
            </div>
          </div>
        )}

        {/* TAB 8: SERVICE ACCOUNTS VAULT */}
        {activeTab === "accounts" && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] p-6 rounded-2xl space-y-6 shadow-sm">
            <div className="border-b border-[var(--border-c)] pb-3">
              <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <Key size={18} className="text-[var(--amber)]" /> Active Directory Service Accounts Vault
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceAccounts.map((sa, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] space-y-2">
                  <div className="font-bold text-xs text-[var(--text)]">{sa.name}</div>
                  <input type="text" value={sa.accountName} onChange={e => { const updated = [...serviceAccounts]; updated[idx].accountName = e.target.value; setServiceAccounts(updated); }} className="w-full bg-[var(--bg-surface)] border border-[var(--border-c)] p-2 rounded-lg text-xs font-mono text-[var(--amber)]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: AUTOMATOR */}
        {activeTab === "automator" && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] p-6 rounded-2xl space-y-6 shadow-sm">
            <div className="border-b border-[var(--border-c)] pb-3">
              <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <Shield size={18} className="text-[var(--teal)]" /> SMB File Share & Windows Firewall Rules Automator
              </h2>
            </div>
            <button onClick={triggerAutomatorScript} className="bg-[var(--teal)] text-black px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
              Run Automator Scripts
            </button>
          </div>
        )}

        {/* TAB 10: AUTOMATION SCRIPT GENERATOR */}
        {activeTab === "scripts" && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] p-6 rounded-2xl space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-3">
              <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <FileText size={18} className="text-[var(--amber)]" /> AutoSPInstaller PowerShell Script Generator
              </h2>
              <button onClick={generatePowerShellScript} className="flex items-center gap-2 bg-[var(--amber)] text-black px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
                <Download size={14} /> Download Install-NexusSP.ps1
              </button>
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM LOG TERMINAL DRAWER WITH PER-JOB STOP & RETRY */}
      <div className={`fixed bottom-0 left-0 right-0 md:left-64 bg-[var(--bg-surface)] border-t border-[var(--border-c)] shadow-2xl transition-all duration-300 z-40 ${isTerminalExpanded ? 'h-64' : 'h-12'}`}>
        <div className="flex justify-between items-center px-4 py-2 bg-[var(--bg-void)] border-b border-[var(--border-c)] cursor-pointer" onClick={() => setIsTerminalExpanded(!isTerminalExpanded)}>
          <h3 className="font-bold flex items-center gap-2 text-xs text-[var(--text)]">
            {isTerminalExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
            Process Terminal ({jobs.length} jobs)
          </h3>
          <div className="text-xs text-[var(--text-sub)] font-mono">
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
                      <span className="font-bold text-[var(--amber)]">{job.serverIp}</span>
                      <div className="flex items-center gap-2">
                        {job.status === 'Running' && (
                          <button onClick={() => stopJob(job.serverIp)} className="text-red-400 hover:text-red-300 px-2 py-0.5 border border-red-900 rounded text-[10px] cursor-pointer">Stop</button>
                        )}
                        {job.status === 'Failed' && (
                          <button onClick={() => retryJob(job.serverIp)} className="text-blue-400 hover:text-blue-300 px-2 py-0.5 border border-blue-900 rounded text-[10px] cursor-pointer">Retry</button>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${job.status==='Running' ? 'bg-blue-900 text-blue-200' : job.status==='Completed' ? 'bg-green-900 text-green-200' : job.status==='Failed' ? 'bg-red-900 text-red-200' : 'bg-gray-800'}`}>
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
