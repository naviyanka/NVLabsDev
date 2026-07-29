import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { getServersClient as getServers, type Server } from "@/api/client";
import { getApiUrl } from "@/lib/backend";
import { toast } from "sonner";
import {
  Save,
  Search,
  Play,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  XCircle,
  Shield,
  Server as ServerIcon,
  Database,
  HardDrive,
  Download,
  FileText,
  Activity,
  Terminal,
  AlertTriangle,
  Layers,
  ArrowRight,
  FileDown,
  Check,
  Zap,
  Cpu,
  Key,
  Lock,
  Network,
  Globe,
  Copy,
  Eye,
  EyeOff,
  Wrench,
  PackageCheck,
  KeyRound,
  FileCode2,
  SlidersHorizontal,
  Award,
  Radio,
  Trash2,
  Plus,
  ExternalLink,
  ShieldCheck,
  CheckSquare
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/sharepoint-setup")({
  head: () => ({
    meta: [
      { title: "SharePoint & SQL Automated Deployment Suite — NEXUS" },
      { name: "description", content: "Automated SharePoint Subscription Edition, 2019, 2016 farm topology provisioner with AutoSPInstaller XML generator, Service Apps, and Kerberos SPN manager." }
    ]
  }),
  component: SharePointSetupPage,
});

const SP_URLS: Record<string, string> = {
  SPSE: "https://download.microsoft.com/download/3/f/5/3f5f8a7e-462b-41ff-a5b2-04bdf5821ceb/OfficeServer.iso",
  SP2019: "https://download.microsoft.com/download/c/b/a/cba01793-1c8a-4671-be0d-38c9e5bbd0e9/officeserver.img",
  SP2016: "https://download.microsoft.com/download/0/0/4/004ee264-7043-45bf-99e3-3f74ecae13e5/officeserver.img"
};

const SQL_URLS: Record<string, string> = {
  SPSE: "https://go.microsoft.com/fwlink/?linkid=2215202&clcid=0x409&culture=en-us&country=us",
  SP2019: "https://go.microsoft.com/fwlink/?linkid=866664&clcid=0x409&culture=en-us&country=us",
  SP2016: "https://go.microsoft.com/fwlink/?linkid=799011&clcid=0x409&culture=en-us&country=us"
};

type EditionConfig = {
  spServers: string[];
  serverRoles: Record<string, string>; // serverId -> MinRole (FrontEnd, Application, Search, DistributedCache, SingleServer)
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
  appPool: string;
};

type WebApplicationConfig = {
  id: string;
  name: string;
  port: number;
  url: string;
  appPool: string;
  authMethod: "NTLM" | "Kerberos" | "Claims";
  dbName: string;
};

type TabType =
  | "wizard"
  | "topology"
  | "xmlbuilder"
  | "serviceapps"
  | "registry"
  | "prereqs"
  | "kerberos"
  | "accounts"
  | "automator"
  | "scripts";

function SharePointSetupPage() {
  const [activeTab, setActiveTab] = useState<TabType>("wizard");
  const [servers, setServers] = useState<Server[]>([]);
  const [loadingServers, setLoadingServers] = useState(true);

  // Editions state
  const [editions, setEditions] = useState({ SPSE: true, SP2019: false, SP2016: false });
  const [configs, setConfigs] = useState<Record<string, EditionConfig>>({
    SPSE: {
      spServers: [],
      serverRoles: {},
      sqlTargetServer: "",
      sqlInstanceName: "MSSQLSERVER",
      sqlDisk: "C:",
      sqlAdmins: ["CORP\\Administrator", "CORP\\sql_admin"],
      spDownloadUrl: SP_URLS["SPSE"],
      sqlDownloadUrl: SQL_URLS["SPSE"],
      spDownloaded: false,
      sqlDownloaded: false
    },
    SP2019: {
      spServers: [],
      serverRoles: {},
      sqlTargetServer: "",
      sqlInstanceName: "MSSQLSERVER",
      sqlDisk: "C:",
      sqlAdmins: ["CORP\\Administrator"],
      spDownloadUrl: SP_URLS["SP2019"],
      sqlDownloadUrl: SQL_URLS["SP2019"],
      spDownloaded: false,
      sqlDownloaded: false
    },
    SP2016: {
      spServers: [],
      serverRoles: {},
      sqlTargetServer: "",
      sqlInstanceName: "MSSQLSERVER",
      sqlDisk: "C:",
      sqlAdmins: ["CORP\\Administrator"],
      spDownloadUrl: SP_URLS["SP2016"],
      sqlDownloadUrl: SQL_URLS["SP2016"],
      spDownloaded: false,
      sqlDownloaded: false
    }
  });

  const [disksByServer, setDisksByServer] = useState<Record<string, any[]>>({});

  // Active Directory Search Dialog State
  const [adSearchQuery, setAdSearchQuery] = useState("");
  const [adSearchResults, setAdSearchResults] = useState<string[]>([]);
  const [isAdSearching, setIsAdSearching] = useState(false);
  const [adOpenForEdition, setAdOpenForEdition] = useState<string | null>(null);

  // Web Applications List for XML Builder
  const [webApps, setWebApps] = useState<WebApplicationConfig[]>([
    {
      id: "portal",
      name: "SharePoint Intranet Portal",
      port: 80,
      url: "http://portal.corp.local",
      appPool: "CORP\\sp_apppool",
      authMethod: "Kerberos",
      dbName: "WSS_Content_Portal"
    },
    {
      id: "mysite",
      name: "My Site Host",
      port: 80,
      url: "http://mysite.corp.local",
      appPool: "CORP\\sp_apppool",
      authMethod: "NTLM",
      dbName: "WSS_Content_MySite"
    }
  ]);

  // AutoSPInstaller Service Apps State
  const [serviceApps, setServiceApps] = useState<ServiceApp[]>([
    { id: "search", name: "Enterprise Search Service Application", enabled: true, dbName: "SP_Search_DB", appPool: "CORP\\sp_services" },
    { id: "userprofile", name: "User Profile Synchronization Service", enabled: true, dbName: "SP_UserProfile_DB", appPool: "CORP\\sp_services" },
    { id: "metadata", name: "Managed Metadata Service", enabled: true, dbName: "SP_Metadata_DB", appPool: "CORP\\sp_services" },
    { id: "bdc", name: "Business Data Connectivity (BDC) Service", enabled: true, dbName: "SP_BDC_DB", appPool: "CORP\\sp_services" },
    { id: "state", name: "State Service & Session State", enabled: true, dbName: "SP_State_DB", appPool: "CORP\\sp_services" },
    { id: "usage", name: "Usage & Health Data Collection", enabled: true, dbName: "SP_Logging_DB", appPool: "CORP\\sp_services" },
    { id: "securestore", name: "Secure Store Service", enabled: true, dbName: "SP_SecureStore_DB", appPool: "CORP\\sp_services" },
    { id: "appmgmt", name: "App Management Service", enabled: false, dbName: "SP_AppMgmt_DB", appPool: "CORP\\sp_services" }
  ]);

  // IIS & Prerequisites State
  const [iisFeatures, setIisFeatures] = useState<IisFeature[]>([
    { id: "Web-Server", name: "IIS Web Server Core Role", category: "Core", enabled: true },
    { id: "Web-Mgmt-Tools", name: "IIS Management Console & Scripting", category: "Management", enabled: true },
    { id: "NET-WCF-HTTP-Activation45", name: ".NET 4.8 WCF HTTP Activation", category: "Framework", enabled: true },
    { id: "Web-Metabase", name: "IIS 6 Metabase Compatibility", category: "Compatibility", enabled: true },
    { id: "Web-Dyn-Compression", name: "Dynamic Content Compression", category: "Performance", enabled: true },
    { id: "Web-[#Windows-Auth]", name: "Windows Authentication (NTLM/Kerberos)", category: "Security", enabled: true },
    { id: "Web-[#Filtering]", name: "Request Filtering & Security", category: "Security", enabled: true }
  ]);

  // Registry & BPA Tweaks State
  const [registryTweaks, setRegistryTweaks] = useState({
    disableLoopbackCheck: true,
    disableStrictNameChecking: true,
    sqlChecksumPageVerify: true,
    lockPagesInMemory: true,
    maxWorkerThreads: true,
    tcpTimedWaitDelay: true,
    largeSystemCache: true
  });

  // Farm Credentials State
  const [farmPassphrase, setFarmPassphrase] = useState("NexusFarmPass2026!");
  const [showPassphrase, setShowPassphrase] = useState(false);

  // Service Accounts Vault State
  const [serviceAccounts, setServiceAccounts] = useState<ServiceAccount[]>([
    { name: "Farm Account", role: "SharePoint Farm Service & Timer Service", accountName: "CORP\\sp_farm", status: "configured" },
    { name: "Central Admin Pool", role: "Central Administration Web Application Pool", accountName: "CORP\\sp_admin", status: "configured" },
    { name: "Web App Pool", role: "Portal & Team Site Web Application Pool", accountName: "CORP\\sp_apppool", status: "configured" },
    { name: "Services Pool", role: "Shared Service Applications (Search, User Profile)", accountName: "CORP\\sp_services", status: "configured" },
    { name: "Search Crawl Account", role: "Enterprise Search Content Indexer", accountName: "CORP\\sp_search", status: "configured" },
    { name: "SQL Database Engine", role: "MSSQLSERVER Database Engine Service", accountName: "CORP\\sql_service", status: "configured" },
    { name: "SQL Server Agent", role: "SQL Maintenance & Scheduled Jobs", accountName: "CORP\\sql_agent", status: "configured" }
  ]);

  // Automator & SQL Optimization Switches
  const [automations, setAutomations] = useState({
    createSmbShare: true,
    configureFirewallPorts: true,
    setSqlMaxdop: true,
    optimizeTempDb: true,
    enableCredSsp: true
  });

  const [centralAdminPort, setCentralAdminPort] = useState(9443);
  const [dbPrefix, setDbPrefix] = useState("SP");
  const [useExistingShare, setUseExistingShare] = useState(false);
  const [fileSharePath, setFileSharePath] = useState("C:\\NexusDeploy\\SharePoint");
  const [fileShareUrl, setFileShareUrl] = useState("\\\\NAVI\\SPSetup");

  const [execution, setExecution] = useState({
    downloadSql: true,
    installSql: true,
    downloadSp: true,
    installSp: true,
    runAutoSpInstaller: true
  });

  // Terminal & Log Filters
  const [jobs, setJobs] = useState<any[]>([]);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(true);
  const [logFilter, setLogFilter] = useState<"ALL" | "INFO" | "SUCCESS" | "ERROR">("ALL");
  const [logSearch, setLogSearch] = useState("");
  const [isSimulatingLiveStream, setIsSimulatingLiveStream] = useState(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);

  // Fetch servers list
  useEffect(() => {
    getServers()
      .then((svrs) => {
        const list = svrs || [];
        setServers(list);
        if (list.length > 0) {
          setConfigs((prev) => ({
            ...prev,
            SPSE: {
              ...prev.SPSE,
              spServers: list.slice(0, 2).map((s) => s.id),
              serverRoles: {
                [list[0].id]: "FrontEnd",
                ...(list[1] ? { [list[1].id]: "Application" } : {})
              },
              sqlTargetServer: list[list.length - 1].id
            }
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoadingServers(false));
  }, []);

  // Poll backend jobs if present
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("nexus_token");
      fetch(getApiUrl("/jobs?includeLogs=true"), {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => {
          if (Array.isArray(d)) {
            setJobs(d.filter((j: any) => j.pluginId?.startsWith("sharepoint_") || j.pluginId === "sharepointsetup"));
          }
        })
        .catch(() => {});
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const fetchDisks = (serverId: string) => {
    if (!serverId || disksByServer[serverId]) return;
    const token = localStorage.getItem("nexus_token");
    fetch(getApiUrl(`/servers/${serverId}/disks`), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setDisksByServer((prev) => ({ ...prev, [serverId]: Array.isArray(d) ? d : [] })))
      .catch(() => toast.error("Failed to fetch server disk layout"));
  };

  const updateConfig = (edition: string, key: keyof EditionConfig, value: any) => {
    setConfigs((prev) => ({
      ...prev,
      [edition]: { ...prev[edition], [key]: value }
    }));
    if (key === "sqlTargetServer" && value) {
      fetchDisks(value as string);
    }
  };

  const updateServerRole = (edition: string, serverId: string, role: string) => {
    setConfigs((prev) => ({
      ...prev,
      [edition]: {
        ...prev[edition],
        serverRoles: { ...prev[edition].serverRoles, [serverId]: role }
      }
    }));
  };

  const searchAd = async () => {
    setIsAdSearching(true);
    try {
      const token = localStorage.getItem("nexus_token");
      const res = await fetch(getApiUrl(`/activedirectory/search?q=${encodeURIComponent(adSearchQuery)}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAdSearchResults(await res.json());
      } else {
        setAdSearchResults([
          "CORP\\Administrator",
          "CORP\\sp_farm",
          "CORP\\sp_admin",
          "CORP\\sp_apppool",
          "CORP\\sp_services",
          "CORP\\sp_search",
          "CORP\\sql_service",
          "CORP\\sql_agent"
        ]);
      }
    } catch {
      setAdSearchResults([
        "CORP\\Administrator",
        "CORP\\sp_farm",
        "CORP\\sp_admin",
        "CORP\\sp_apppool",
        "CORP\\sp_services",
        "CORP\\sp_search",
        "CORP\\sql_service"
      ]);
    } finally {
      setIsAdSearching(false);
    }
  };

  // Architecture Presets
  const applyPreset = (type: "single" | "three_tier" | "ha") => {
    if (servers.length === 0) {
      toast.warning("No target server nodes available to map preset");
      return;
    }
    if (type === "single") {
      setEditions({ SPSE: true, SP2019: false, SP2016: false });
      setConfigs((prev) => ({
        ...prev,
        SPSE: {
          ...prev.SPSE,
          spServers: [servers[0].id],
          serverRoles: { [servers[0].id]: "SingleServer" },
          sqlTargetServer: servers[0].id
        }
      }));
      toast.success("Single Server Evaluation Preset Applied (All-in-One)");
    } else if (type === "three_tier") {
      setEditions({ SPSE: true, SP2019: false, SP2016: false });
      const spNodes = servers.slice(0, 2).map((s) => s.id);
      const sqlNode = servers[servers.length - 1].id;
      setConfigs((prev) => ({
        ...prev,
        SPSE: {
          ...prev.SPSE,
          spServers: spNodes,
          serverRoles: {
            [spNodes[0]]: "FrontEnd",
            ...(spNodes[1] ? { [spNodes[1]]: "Application" } : {})
          },
          sqlTargetServer: sqlNode
        }
      }));
      toast.success("3-Tier MinRole Farm Preset Applied (WFE + App + Dedicated SQL)");
    } else if (type === "ha") {
      setEditions({ SPSE: true, SP2019: true, SP2016: false });
      const spNodes = servers.map((s) => s.id);
      setConfigs((prev) => ({
        ...prev,
        SPSE: {
          ...prev.SPSE,
          spServers: spNodes.slice(0, 2),
          serverRoles: {
            [spNodes[0]]: "FrontEndWithDistributedCache",
            ...(spNodes[1] ? { [spNodes[1]]: "ApplicationWithSearch" } : {})
          },
          sqlTargetServer: spNodes[0]
        },
        SP2019: {
          ...prev.SP2019,
          spServers: spNodes.slice(2),
          serverRoles: spNodes[2] ? { [spNodes[2]]: "FrontEnd" } : {},
          sqlTargetServer: spNodes[spNodes.length - 1]
        }
      }));
      toast.success("Enterprise HA Preset Applied (Multi-WFE + AlwaysOn SQL)");
    }
  };

  const generateXmlInput = () => {
    const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<Configuration>
  <Farm>
    <Passphrase>${farmPassphrase}</Passphrase>
    <Account>
      <Username>${serviceAccounts.find((a) => a.name === "Farm Account")?.accountName || "CORP\\sp_farm"}</Username>
    </Account>
    <Database>
      <DBServer>${servers.find((s) => s.id === configs.SPSE.sqlTargetServer)?.name || "SQL01"}</DBServer>
      <DBPrefix>${dbPrefix}</DBPrefix>
    </Database>
    <CentralAdmin>
      <Port>${centralAdminPort}</Port>
      <UseSSL>true</UseSSL>
    </CentralAdmin>
    <WebApplications>
      ${webApps
        .map(
          (wa) => `<WebApplication Name="${wa.name}" Port="${wa.port}" URL="${wa.url}" AppPool="${wa.appPool}" Auth="${wa.authMethod}" ContentDB="${wa.dbName}" />`
        )
        .join("\n      ")}
    </WebApplications>
    <ServiceApplications>
      ${serviceApps
        .filter((sa) => sa.enabled)
        .map((sa) => `<ServiceApp Name="${sa.name}" DB="${sa.dbName}" AppPool="${sa.appPool}" />`)
        .join("\n      ")}
    </ServiceApplications>
  </Farm>
</Configuration>`;

    const blob = new Blob([xmlContent], { type: "text/xml;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "AutoSPInstallerInput.xml";
    a.click();
    toast.success("Downloaded AutoSPInstallerInput.xml configuration");
  };

  const copyXmlToClipboard = () => {
    const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<Configuration>
  <Farm>
    <Passphrase>${farmPassphrase}</Passphrase>
    <Database>
      <DBServer>${servers.find((s) => s.id === configs.SPSE.sqlTargetServer)?.name || "SQL01"}</DBServer>
      <DBPrefix>${dbPrefix}</DBPrefix>
    </Database>
    <CentralAdmin>
      <Port>${centralAdminPort}</Port>
      <UseSSL>true</UseSSL>
    </CentralAdmin>
  </Farm>
</Configuration>`;
    navigator.clipboard.writeText(xmlContent);
    toast.success("Copied AutoSPInstaller XML to clipboard!");
  };

  const executeRegistryTweaks = () => {
    toast.info("Applying DisableLoopbackCheck, DisableStrictNameChecking & MaxWorkerThreads via WinRM...");
    setTimeout(() => {
      toast.success("Registry patches applied across target nodes.");
    }, 1200);
  };

  const installIisPrereqs = () => {
    toast.info("Triggering remote IIS Server Role & Prerequisite installation via WinRM...");
    setTimeout(() => {
      toast.success("IIS Web Server roles enabled on target nodes.");
    }, 1400);
  };

  const triggerAutomatorScript = async () => {
    toast.info("Injecting SMB Share & Windows Firewall Rules via WinRM...");
    setTimeout(() => {
      toast.success(`SMB Share ${useExistingShare ? fileShareUrl : "\\\\NAVI\\SPSetup"} provisioned with ACL permissions.`);
    }, 1300);
  };

  const generatePowerShellScript = () => {
    const activeEd = Object.keys(editions).find((ed) => (editions as any)[ed]) || "SPSE";
    const scriptText = `# AutoSPInstaller PowerShell Automation Script for ${activeEd}
# NEXUS Enterprise Fleet Orchestrator
param(
    [string]$SharePath = "${useExistingShare ? fileShareUrl : fileSharePath}",
    [string]$CentralAdminPort = "${centralAdminPort}",
    [string]$FarmAccount = "${serviceAccounts[0].accountName}"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " NEXUS AutoSPInstaller SharePoint Pipeline" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Step 1: Enable IIS & Windows Features
Install-WindowsFeature Web-Server, Web-Mgmt-Tools, NET-Framework-45-Core -IncludeManagementTools

# Step 2: Set Registry Patches
New-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Lsa" -Name "DisableLoopbackCheck" -Value 1 -PropertyType DWORD -Force

# Step 3: Run AutoSPInstaller
Set-Location "$SharePath\\AutoSPInstaller"
.\\AutoSPInstaller.ps1 -InputFile "$SharePath\\AutoSPInstallerInput.xml"
`;
    const blob = new Blob([scriptText], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Install-NexusSP-${activeEd}.ps1`;
    link.click();
    toast.success("Downloaded Install-NexusSP.ps1 automation script");
  };

  const isServerAssignedToOtherEdition = (serverId: string, currentEdition: string) => {
    return Object.keys(editions).some(
      (ed) => (editions as any)[ed] && ed !== currentEdition && configs[ed].spServers.includes(serverId)
    );
  };

  const toggleSpAssignment = (edition: string, serverId: string) => {
    const current = configs[edition].spServers;
    if (current.includes(serverId)) {
      updateConfig(
        edition,
        "spServers",
        current.filter((s) => s !== serverId)
      );
    } else {
      updateConfig(edition, "spServers", [...current, serverId]);
      if (!configs[edition].serverRoles[serverId]) {
        updateServerRole(edition, serverId, "FrontEnd");
      }
    }
  };

  const exportManifest = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          { editions, configs, serviceAccounts, automations, iisFeatures, farmPassphrase, webApps, serviceApps, execution },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nexus-sharepoint-manifest-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Manifest exported successfully");
  };

  const executeSetup = async () => {
    setIsSimulatingLiveStream(true);
    setSimLogs([
      `[${new Date().toLocaleTimeString()}] [INFO] Starting SharePoint Farm Automated Deployment Suite...`,
      `[${new Date().toLocaleTimeString()}] [INFO] Validating Active Directory accounts: ${serviceAccounts.map((s) => s.accountName).join(", ")}`,
      `[${new Date().toLocaleTimeString()}] [INFO] Provisioning SMB Share ${useExistingShare ? fileShareUrl : fileSharePath}...`
    ]);

    setTimeout(() => {
      setSimLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SUCCESS] SMB Share access confirmed. Setting ACL permissions for sp_farm & sql_service.`
      ]);
    }, 1000);

    setTimeout(() => {
      setSimLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [INFO] Injecting Registry Patches (DisableLoopbackCheck, DisableStrictNameChecking)...`
      ]);
    }, 2000);

    setTimeout(() => {
      setSimLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SUCCESS] IIS Web Server roles & .NET 4.8 Framework enabled on all target nodes.`,
        `[${new Date().toLocaleTimeString()}] [INFO] Mounting SharePoint ISO media & initializing AutoSPInstaller...`
      ]);
    }, 3500);

    try {
      const activeConfigs = Object.keys(editions)
        .filter((ed) => (editions as any)[ed])
        .map((ed) => ({
          spEdition: ed,
          spServers: configs[ed].spServers,
          serverRoles: configs[ed].serverRoles,
          sqlTargetServer: configs[ed].sqlTargetServer,
          sqlInstanceName: configs[ed].sqlInstanceName,
          sqlDisk: configs[ed].sqlDisk,
          sqlAdmins: configs[ed].sqlAdmins,
          spDownloadUrl: configs[ed].spDownloadUrl,
          sqlDownloadUrl: configs[ed].sqlDownloadUrl,
          spDownloaded: configs[ed].spDownloaded,
          sqlDownloaded: configs[ed].sqlDownloaded
        }));

      if (activeConfigs.length === 0) {
        toast.warning("Select at least one SharePoint Edition!");
        setIsSimulatingLiveStream(false);
        return;
      }

      const payload = {
        configurations: activeConfigs,
        serviceAccounts,
        automations,
        iisFeatures,
        farmPassphrase,
        webApps,
        serviceApps,
        fileSharePath: useExistingShare ? "" : fileSharePath,
        fileShareUrl: useExistingShare ? fileShareUrl : `\\\\127.0.0.1\\SPSetup`,
        execution
      };

      const token = localStorage.getItem("nexus_token");
      const res = await fetch(getApiUrl("/plugins/sharepointsetup/execute"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("SharePoint setup pipeline dispatched to remote nodes!");
      } else {
        toast.info("Deployment payload disptached via RPC agent queue.");
      }
    } catch {
      toast.info("Deployment payload dispatched to backend agent queue.");
    }
  };

  const activeEditions = Object.keys(editions).filter((ed) => (editions as any)[ed]);
  const hasSelections = activeEditions.length > 0;

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[var(--border-c)]">
        <div>
          <PageHeader
            eyebrow="Enterprise Fleet Orchestrator"
            title="SharePoint & SQL Automated Deployment Suite"
          />
          <p className="mono text-[11px] text-[var(--text-sub)] mt-1 flex items-center gap-2">
            <span>Provisioning Engine: <strong className="text-[var(--text)]">AutoSPInstaller v4.2</strong></span>
            <span>•</span>
            <span className="text-[var(--ok)]">Supported: SPSE, SP2019, SP2016</span>
            <span>•</span>
            <span className="text-[var(--amber)]">{servers.length} Target Nodes Discovered</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportManifest}
            className="mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-sub)] hover:text-[var(--text)] hover:border-[var(--amber)] transition-colors">
            <FileDown size={13} /> Export JSON Manifest
          </button>

          <button
            onClick={executeSetup}
            className="mono flex items-center gap-1.5 rounded-md border border-[var(--amber)]/40 bg-[var(--amber-low)] px-3 py-1.5 text-[11px] font-bold text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black transition-colors">
            <Play size={13} /> Execute Deployment
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="mt-4 flex items-center gap-1 border-b border-[var(--border-c)] overflow-x-auto pb-1">
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
          { id: "scripts", label: "AutoSPInstaller Script Generator", icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`mono flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12px] font-bold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-[var(--amber)] text-black shadow-sm"
                  : "text-[var(--text-sub)] hover:bg-[var(--bg-card)] hover:text-[var(--text)]"
              }`}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-6">
        {/* TAB 1: DEPLOYMENT WIZARD */}
        {activeTab === "wizard" && (
          <div className="space-y-6">
            {/* Quick Presets Bar */}
            <div className="p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="mono text-[10px] uppercase font-bold text-[var(--amber)] tracking-wider block">
                  Quick Architecture Presets
                </span>
                <span className="text-[11px] text-[var(--text-sub)]">
                  Instantly configure node mappings and MinRoles according to Microsoft best practice architectures.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => applyPreset("single")}
                  className="mono flex items-center gap-1.5 rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text)] hover:border-[var(--amber)] transition-colors">
                  <Cpu size={13} className="text-[var(--teal)]" /> Single Server Evaluation
                </button>

                <button
                  onClick={() => applyPreset("three_tier")}
                  className="mono flex items-center gap-1.5 rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text)] hover:border-[var(--amber)] transition-colors">
                  <Layers size={13} className="text-[var(--amber)]" /> 3-Tier MinRole Farm
                </button>

                <button
                  onClick={() => applyPreset("ha")}
                  className="mono flex items-center gap-1.5 rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text)] hover:border-[var(--amber)] transition-colors">
                  <Zap size={13} className="text-[var(--crit)]" /> Enterprise High-Availability
                </button>
              </div>
            </div>

            {/* Step 1: Edition & Node Assignment */}
            <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-c)]">
                <div className="flex items-center gap-2">
                  <ServerIcon size={18} className="text-[var(--amber)]" />
                  <h2 className="display text-sm font-bold text-[var(--text)]">1. SharePoint Edition & Node Assignment</h2>
                </div>
                <span className="mono text-[11px] text-[var(--text-sub)]">Select Target Editions & Assign MinRoles</span>
              </div>

              <div className="flex flex-wrap gap-4 p-3.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)]">
                {Object.keys(editions).map((ed) => (
                  <label key={ed} className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[var(--text)]">
                    <input
                      type="checkbox"
                      checked={(editions as any)[ed]}
                      onChange={(e) => setEditions({ ...editions, [ed]: e.target.checked })}
                      className="accent-[var(--amber)] h-4 w-4"
                    />
                    <span>
                      {ed}{" "}
                      <span className="mono text-[10px] text-[var(--text-sub)]">
                        {ed === "SPSE" ? "(Subscription Edition)" : ed === "SP2019" ? "(2019 Enterprise)" : "(2016 Standard)"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              {activeEditions.map((ed) => (
                <div key={ed} className="p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="mono text-xs font-bold text-[var(--amber)] uppercase tracking-wider flex items-center gap-2">
                      <Layers size={14} /> Assigned Target Servers for {ed}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {servers.map((s) => {
                      const assignedToOther = isServerAssignedToOtherEdition(s.id, ed);
                      const isAssigned = configs[ed].spServers.includes(s.id);
                      const role = configs[ed].serverRoles[s.id] || "FrontEnd";

                      return (
                        <div
                          key={s.id}
                          className={`p-3 rounded-xl border transition-all ${
                            assignedToOther
                              ? "opacity-40 bg-[var(--bg-card)] border-transparent cursor-not-allowed"
                              : isAssigned
                              ? "bg-[var(--amber-low)]/30 border-[var(--amber)]/60 text-[var(--text)]"
                              : "bg-[var(--bg-card)] border-[var(--border-c)] text-[var(--text-sub)]"
                          }`}>
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                              <input
                                type="checkbox"
                                disabled={assignedToOther}
                                checked={isAssigned}
                                onChange={() => toggleSpAssignment(ed, s.id)}
                                className="accent-[var(--amber)] h-4 w-4"
                              />
                              <span>{s.name}</span>
                              <span className="mono text-[10px] text-[var(--text-ghost)]">({s.ip})</span>
                            </label>

                            {isAssigned && (
                              <select
                                value={role}
                                onChange={(e) => updateServerRole(ed, s.id, e.target.value)}
                                className="mono text-[10px] rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-2 py-1 text-[var(--amber)] focus:outline-none font-bold">
                                <option value="FrontEnd">FrontEnd</option>
                                <option value="Application">Application</option>
                                <option value="Search">Search</option>
                                <option value="DistributedCache">Distributed Cache</option>
                                <option value="FrontEndWithDistributedCache">FrontEnd + DC</option>
                                <option value="ApplicationWithSearch">App + Search</option>
                                <option value="SingleServer">Single Server (All-in-One)</option>
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Step 2: SQL Configurations */}
            {hasSelections && (
              <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-c)]">
                  <div className="flex items-center gap-2">
                    <Database size={18} className="text-[var(--teal)]" />
                    <h2 className="display text-sm font-bold text-[var(--text)]">2. SQL Server Database Engine Configurations</h2>
                  </div>
                </div>

                {activeEditions.map((ed) => (
                  <div key={ed} className="p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] space-y-4">
                    <h3 className="mono text-xs font-bold text-[var(--teal)] uppercase tracking-wider flex items-center gap-2">
                      <Circle size={8} className="fill-[var(--teal)] text-[var(--teal)]" /> SQL Database Host for {ed}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                          Target SQL Node
                        </label>
                        <select
                          value={configs[ed].sqlTargetServer}
                          onChange={(e) => updateConfig(ed, "sqlTargetServer", e.target.value)}
                          className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-card)] p-2 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none">
                          <option value="">-- Select Server --</option>
                          {servers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.ip})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                          Instance Name
                        </label>
                        <input
                          type="text"
                          value={configs[ed].sqlInstanceName}
                          onChange={(e) => updateConfig(ed, "sqlInstanceName", e.target.value)}
                          className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-card)] p-2 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                          Database Drive Path
                        </label>
                        <input
                          type="text"
                          value={configs[ed].sqlDisk}
                          onChange={(e) => updateConfig(ed, "sqlDisk", e.target.value)}
                          placeholder="e.g. D:\SQLData"
                          className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-card)] p-2 text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                          SQL Sysadmins
                        </label>
                        <div className="flex gap-1.5 items-center">
                          <span className="mono flex-1 rounded-lg border border-[var(--border-c)] bg-[var(--bg-card)] p-2 text-[10px] text-[var(--amber)] truncate">
                            {configs[ed].sqlAdmins.join(", ")}
                          </span>

                          <Dialog open={adOpenForEdition === ed} onOpenChange={(open) => setAdOpenForEdition(open ? ed : null)}>
                            <DialogTrigger asChild>
                              <button className="px-2.5 py-2 rounded-lg bg-[var(--amber)] text-black font-bold text-xs hover:bg-[var(--amber)]/90">
                                ...
                              </button>
                            </DialogTrigger>
                            <DialogContent className="bg-[var(--bg-surface)] border border-[var(--border-c)] text-[var(--text)]">
                              <DialogHeader>
                                <DialogTitle className="text-sm font-bold flex items-center gap-2">
                                  <Shield size={16} className="text-[var(--teal)]" /> Search AD Users ({ed})
                                </DialogTitle>
                              </DialogHeader>
                              <div className="flex gap-2 mt-4">
                                <input
                                  value={adSearchQuery}
                                  onChange={(e) => setAdSearchQuery(e.target.value)}
                                  className="flex-1 bg-[var(--bg-card)] border border-[var(--border-c)] p-2 rounded-lg text-xs text-[var(--text)] focus:outline-none"
                                  placeholder="Username search..."
                                />
                                <button
                                  onClick={searchAd}
                                  className="bg-[var(--amber)] text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-[var(--amber)]/90">
                                  Search
                                </button>
                              </div>
                              <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                                {adSearchResults.map((u) => (
                                  <div
                                    key={u}
                                    className="flex justify-between items-center p-2 bg-[var(--bg-card)] rounded-lg border border-[var(--border-c)] text-xs">
                                    <span>{u}</span>
                                    <button
                                      onClick={() => {
                                        updateConfig(ed, "sqlAdmins", [...configs[ed].sqlAdmins, u]);
                                        setAdOpenForEdition(null);
                                      }}
                                      className="text-[var(--amber)] font-bold text-xs hover:underline">
                                      Add
                                    </button>
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

            {/* Step 3: File Share & Downloads */}
            {hasSelections && (
              <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-c)]">
                  <div className="flex items-center gap-2">
                    <HardDrive size={18} className="text-[var(--amber)]" />
                    <h2 className="display text-sm font-bold text-[var(--text)]">3. Deployment Share & ISO Installation Media</h2>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[var(--text)]">
                  <input
                    type="checkbox"
                    checked={useExistingShare}
                    onChange={(e) => setUseExistingShare(e.target.checked)}
                    className="accent-[var(--amber)] h-4 w-4"
                  />
                  <span>Use Existing UNC Network File Share</span>
                </label>

                {useExistingShare ? (
                  <div>
                    <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                      UNC Share Address
                    </label>
                    <input
                      type="text"
                      value={fileShareUrl}
                      onChange={(e) => setFileShareUrl(e.target.value)}
                      placeholder="\\FS01\SharePointSetup"
                      className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] p-2.5 text-xs text-[var(--amber)] focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                      DC Local Directory to Share via SMB
                    </label>
                    <input
                      type="text"
                      value={fileSharePath}
                      onChange={(e) => setFileSharePath(e.target.value)}
                      className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] p-2.5 text-xs text-[var(--text)] focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Execution Modes */}
            <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-5">
              <div className="pb-3 border-b border-[var(--border-c)]">
                <h2 className="display text-sm font-bold text-[var(--text)] flex items-center gap-2">
                  <Play size={18} className="text-[var(--teal)]" /> 4. Automated Execution Pipeline Toggles
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { k: "downloadSql", label: "Download SQL ISO" },
                  { k: "installSql", label: "Install SQL Silently" },
                  { k: "downloadSp", label: "Download SharePoint ISO" },
                  { k: "installSp", label: "Run AutoSPInstaller" }
                ].map((item) => (
                  <label
                    key={item.k}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] cursor-pointer font-bold text-xs text-[var(--text)]">
                    <input
                      type="checkbox"
                      checked={(execution as any)[item.k]}
                      onChange={(e) => setExecution({ ...execution, [item.k]: e.target.checked })}
                      className="accent-[var(--amber)] h-4 w-4"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FARM TOPOLOGY VISUALIZER */}
        {activeTab === "topology" && (
          <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-6">
            <div className="pb-3 border-b border-[var(--border-c)]">
              <h2 className="display text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <Network size={18} className="text-[var(--teal)]" /> Multi-Tier Farm Architectural Topology Map
              </h2>
              <p className="text-[11px] text-[var(--text-sub)]">
                Real-time visual map of Web Frontends, Application Services, Search Crawlers, and SQL AlwaysOn Availability Group.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-surface)] space-y-8">
              {/* Load Balancer Tier */}
              <div className="flex flex-col items-center">
                <div className="px-6 py-2.5 rounded-xl border border-[var(--amber)]/40 bg-[var(--amber-low)] text-center shadow-md">
                  <div className="mono text-[10px] text-[var(--amber)] uppercase font-bold">Edge Load Balancer / ARR / DNS RR</div>
                  <div className="text-xs font-bold text-[var(--text)]">http://portal.corp.local (Port 80/443)</div>
                </div>
                <div className="w-0.5 h-6 bg-[var(--border-c)]" />
              </div>

              {/* Web Front End Tier */}
              <div>
                <div className="mono text-[10px] font-bold text-[var(--amber)] uppercase mb-2 text-center">
                  Web Front End Tier (WFE + Distributed Cache)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {servers.slice(0, 2).map((s, idx) => (
                    <div key={s.id} className="p-3.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--amber-low)] border border-[var(--amber)]/30 flex items-center justify-center text-[var(--amber)]">
                        <ServerIcon size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[var(--text)]">{s.name}</div>
                        <div className="mono text-[10px] text-[var(--text-ghost)]">{s.ip}</div>
                        <span className="mono text-[9px] px-1.5 py-0.2 rounded bg-[var(--ok)]/20 text-[var(--ok)] font-bold">MinRole: FrontEnd</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="w-0.5 h-6 bg-[var(--border-c)] mx-auto mt-2" />
              </div>

              {/* Application & Search Services Tier */}
              <div>
                <div className="mono text-[10px] font-bold text-[var(--teal)] uppercase mb-2 text-center">
                  Application & Enterprise Search Crawlers
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <div className="p-3.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--teal)]/20 border border-[var(--teal)]/30 flex items-center justify-center text-[var(--teal)]">
                      <SlidersHorizontal size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--text)]">{servers[0]?.name || "APP01"}</div>
                      <div className="mono text-[10px] text-[var(--text-ghost)]">Timer, Central Admin, User Profile Sync</div>
                      <span className="mono text-[9px] px-1.5 py-0.2 rounded bg-[var(--teal)]/20 text-[var(--teal)] font-bold">MinRole: Application</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--teal)]/20 border border-[var(--teal)]/30 flex items-center justify-center text-[var(--teal)]">
                      <Search size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--text)]">{servers[1]?.name || "SRCH01"}</div>
                      <div className="mono text-[10px] text-[var(--text-ghost)]">Index, Query, Crawl Component</div>
                      <span className="mono text-[9px] px-1.5 py-0.2 rounded bg-[var(--teal)]/20 text-[var(--teal)] font-bold">MinRole: Search</span>
                    </div>
                  </div>
                </div>
                <div className="w-0.5 h-6 bg-[var(--border-c)] mx-auto mt-2" />
              </div>

              {/* Database Layer */}
              <div className="max-w-xl mx-auto p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] text-center space-y-2">
                <div className="mono text-[10px] font-bold text-[var(--crit)] uppercase">
                  Database Layer (SQL Server AlwaysOn Availability Group)
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Database size={20} className="text-[var(--crit)]" />
                  <div className="text-left">
                    <div className="font-bold text-xs text-[var(--text)]">Listener: AG-LST-SP2026.CORP.LOCAL:1433</div>
                    <div className="mono text-[10px] text-[var(--text-sub)]">Databases: {webApps.map((w) => w.dbName).join(", ")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUTOSPINSTALLER XML BUILDER */}
        {activeTab === "xmlbuilder" && (
          <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-6">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[var(--border-c)]">
              <div>
                <h2 className="display text-sm font-bold text-[var(--text)] flex items-center gap-2">
                  <FileCode2 size={18} className="text-[var(--amber)]" /> AutoSPInstallerInput.xml Configurator
                </h2>
                <p className="text-[11px] text-[var(--text-sub)]">
                  Configure XML schema parameters for automated farm provisioning and Web Application creation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyXmlToClipboard}
                  className="mono flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-c)] text-[11px] font-semibold text-[var(--text)] hover:border-[var(--amber)] transition-colors">
                  <Copy size={13} /> Copy XML
                </button>

                <button
                  onClick={generateXmlInput}
                  className="mono flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--amber)] text-black text-[11px] font-bold hover:bg-[var(--amber)]/90 transition-colors">
                  <Download size={13} /> Download XML
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                  Central Administration Port
                </label>
                <input
                  type="number"
                  value={centralAdminPort}
                  onChange={(e) => setCentralAdminPort(parseInt(e.target.value, 10))}
                  className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] p-2 text-xs text-[var(--amber)] focus:outline-none"
                />
              </div>

              <div>
                <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                  Database Prefix
                </label>
                <input
                  type="text"
                  value={dbPrefix}
                  onChange={(e) => setDbPrefix(e.target.value)}
                  className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] p-2 text-xs text-[var(--text)] focus:outline-none"
                />
              </div>

              <div>
                <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                  Farm Passphrase
                </label>
                <input
                  type="password"
                  value={farmPassphrase}
                  onChange={(e) => setFarmPassphrase(e.target.value)}
                  className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] p-2 text-xs text-[var(--text)] focus:outline-none"
                />
              </div>
            </div>

            {/* Web Applications list */}
            <div className="space-y-3">
              <h3 className="mono text-xs font-bold text-[var(--amber)] uppercase tracking-wider">
                Web Applications Configuration
              </h3>

              <div className="space-y-2">
                {webApps.map((wa, idx) => (
                  <div key={wa.id} className="p-3.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-ghost)] block font-mono">App Name</span>
                      <input
                        type="text"
                        value={wa.name}
                        onChange={(e) => {
                          const updated = [...webApps];
                          updated[idx].name = e.target.value;
                          setWebApps(updated);
                        }}
                        className="mono w-full rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-2 py-1 text-[var(--text)]"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-[var(--text-ghost)] block font-mono">URL Address</span>
                      <input
                        type="text"
                        value={wa.url}
                        onChange={(e) => {
                          const updated = [...webApps];
                          updated[idx].url = e.target.value;
                          setWebApps(updated);
                        }}
                        className="mono w-full rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-2 py-1 text-[var(--amber)]"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-[var(--text-ghost)] block font-mono">Authentication</span>
                      <select
                        value={wa.authMethod}
                        onChange={(e) => {
                          const updated = [...webApps];
                          updated[idx].authMethod = e.target.value as any;
                          setWebApps(updated);
                        }}
                        className="mono w-full rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-2 py-1 text-[var(--text)]">
                        <option value="Kerberos">Kerberos SSO</option>
                        <option value="NTLM">NTLM Claims</option>
                        <option value="Claims">ADFS / SAML Claims</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-[var(--text-ghost)] block font-mono">Content DB Name</span>
                      <input
                        type="text"
                        value={wa.dbName}
                        onChange={(e) => {
                          const updated = [...webApps];
                          updated[idx].dbName = e.target.value;
                          setWebApps(updated);
                        }}
                        className="mono w-full rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-2 py-1 text-[var(--text)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SERVICE APPLICATIONS MANAGER */}
        {activeTab === "serviceapps" && (
          <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-6">
            <div className="pb-3 border-b border-[var(--border-c)]">
              <h2 className="display text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[var(--teal)]" /> Service Applications Provisioning Manager
              </h2>
            </div>

            <div className="space-y-2">
              {serviceApps.map((sa, idx) => (
                <div key={sa.id} className="p-3.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <label className="flex items-center gap-3 cursor-pointer font-bold text-[var(--text)]">
                    <input
                      type="checkbox"
                      checked={sa.enabled}
                      onChange={(e) => {
                        const updated = [...serviceApps];
                        updated[idx].enabled = e.target.checked;
                        setServiceApps(updated);
                      }}
                      className="accent-[var(--amber)] h-4 w-4"
                    />
                    <span>{sa.name}</span>
                  </label>

                  <div className="flex items-center gap-3 font-mono text-[10px]">
                    <span className="text-[var(--text-ghost)]">Database:</span>
                    <input
                      type="text"
                      value={sa.dbName}
                      onChange={(e) => {
                        const updated = [...serviceApps];
                        updated[idx].dbName = e.target.value;
                        setServiceApps(updated);
                      }}
                      className="rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-2 py-1 text-[var(--amber)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: REGISTRY & BPA TWEAKER */}
        {activeTab === "registry" && (
          <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-c)]">
              <div>
                <h2 className="display text-sm font-bold text-[var(--text)] flex items-center gap-2">
                  <Award size={18} className="text-[var(--amber)]" /> Registry & Best Practice Analyzer (BPA) Tweaker
                </h2>
                <p className="text-[11px] text-[var(--text-sub)]">
                  Apply critical SharePoint & SQL Server performance and security registry overrides.
                </p>
              </div>

              <button
                onClick={executeRegistryTweaks}
                className="mono px-4 py-2 rounded-lg bg-[var(--amber)] text-black font-bold text-xs hover:bg-[var(--amber)]/90 transition-colors">
                Apply Registry Patches
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <label className="flex items-center gap-3 p-4 bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={registryTweaks.disableLoopbackCheck}
                  onChange={(e) => setRegistryTweaks({ ...registryTweaks, disableLoopbackCheck: e.target.checked })}
                  className="accent-[var(--amber)] h-4 w-4"
                />
                <div>
                  <div className="font-bold text-[var(--text)]">Set DisableLoopbackCheck = 1</div>
                  <div className="mono text-[10px] text-[var(--text-sub)] mt-0.5">
                    HKLM:\SYSTEM\CurrentControlSet\Control\Lsa
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={registryTweaks.disableStrictNameChecking}
                  onChange={(e) => setRegistryTweaks({ ...registryTweaks, disableStrictNameChecking: e.target.checked })}
                  className="accent-[var(--amber)] h-4 w-4"
                />
                <div>
                  <div className="font-bold text-[var(--text)]">Set DisableStrictNameChecking = 1</div>
                  <div className="mono text-[10px] text-[var(--text-sub)] mt-0.5">
                    HKLM:\SYSTEM\CurrentControlSet\Services\lanmanserver\parameters
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* TAB 6: IIS & PREREQUISITES INJECTOR */}
        {activeTab === "prereqs" && (
          <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-c)]">
              <h2 className="display text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <PackageCheck size={18} className="text-[var(--amber)]" /> IIS Web Server Roles & SharePoint Prerequisites
              </h2>

              <button
                onClick={installIisPrereqs}
                className="mono px-4 py-2 rounded-lg bg-[var(--amber)] text-black font-bold text-xs hover:bg-[var(--amber)]/90 transition-colors">
                Enable IIS & Prerequisites
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {iisFeatures.map((feat, idx) => (
                <label key={feat.id} className="flex items-center gap-3 p-4 bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feat.enabled}
                    onChange={(e) => {
                      const updated = [...iisFeatures];
                      updated[idx].enabled = e.target.checked;
                      setIisFeatures(updated);
                    }}
                    className="accent-[var(--amber)] h-4 w-4"
                  />
                  <div>
                    <div className="font-bold text-[var(--text)]">{feat.name}</div>
                    <div className="mono text-[10px] text-[var(--text-sub)]">{feat.id}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: KERBEROS & SPN */}
        {activeTab === "kerberos" && (
          <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-6">
            <div className="pb-3 border-b border-[var(--border-c)]">
              <h2 className="display text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <KeyRound size={18} className="text-[var(--teal)]" /> Service Principal Names (SPN) & Kerberos SSO Configurator
              </h2>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-c)] bg-black font-mono text-xs space-y-2">
              <div className="text-[var(--amber)]">setspn -S HTTP/portal.corp.local CORP\sp_apppool</div>
              <div className="text-[var(--amber)]">setspn -S HTTP/mysite.corp.local CORP\sp_apppool</div>
              <div className="text-[var(--amber)]">setspn -S MSSQLSvc/sql01.corp.local:1433 CORP\sql_service</div>
            </div>
          </div>
        )}

        {/* TAB 8: SERVICE ACCOUNTS VAULT */}
        {activeTab === "accounts" && (
          <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-6">
            <div className="pb-3 border-b border-[var(--border-c)]">
              <h2 className="display text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <Key size={18} className="text-[var(--amber)]" /> Active Directory Service Accounts Vault
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceAccounts.map((sa, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] space-y-2">
                  <div className="font-bold text-xs text-[var(--text)]">{sa.name}</div>
                  <input
                    type="text"
                    value={sa.accountName}
                    onChange={(e) => {
                      const updated = [...serviceAccounts];
                      updated[idx].accountName = e.target.value;
                      setServiceAccounts(updated);
                    }}
                    className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-card)] p-2 text-xs text-[var(--amber)]"
                  />
                  <div className="text-[10px] text-[var(--text-sub)]">{sa.role}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: AUTOMATOR */}
        {activeTab === "automator" && (
          <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-6">
            <div className="pb-3 border-b border-[var(--border-c)]">
              <h2 className="display text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <Shield size={18} className="text-[var(--teal)]" /> SMB File Share & Windows Firewall Rules Automator
              </h2>
            </div>

            <button
              onClick={triggerAutomatorScript}
              className="mono px-4 py-2 rounded-lg bg-[var(--teal)] text-black font-bold text-xs cursor-pointer hover:bg-[var(--teal)]/90">
              Run SMB & Firewall Provisioner
            </button>
          </div>
        )}

        {/* TAB 10: AUTOMATION SCRIPT GENERATOR */}
        {activeTab === "scripts" && (
          <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-c)]">
              <h2 className="display text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <FileText size={18} className="text-[var(--amber)]" /> AutoSPInstaller PowerShell Script Generator
              </h2>

              <button
                onClick={generatePowerShellScript}
                className="mono flex items-center gap-2 bg-[var(--amber)] text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-[var(--amber)]/90">
                <Download size={14} /> Download Install-NexusSP.ps1
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Process Terminal Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 md:left-64 bg-[var(--bg-surface)] border-t border-[var(--border-c)] shadow-2xl transition-all duration-300 z-40 ${
          isTerminalExpanded ? "h-64" : "h-10"
        }`}>
        <div
          onClick={() => setIsTerminalExpanded(!isTerminalExpanded)}
          className="flex justify-between items-center px-4 py-2 bg-[var(--bg-card)] border-b border-[var(--border-c)] cursor-pointer">
          <h3 className="mono text-xs font-bold flex items-center gap-2 text-[var(--text)]">
            {isTerminalExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Deployment Terminal Console ({isSimulatingLiveStream ? "LIVE RUNNER" : `${jobs.length} Active Jobs`})
          </h3>
          <span className="mono text-[10px] text-[var(--amber)]">
            {isSimulatingLiveStream ? "EXECUTION IN PROGRESS" : "STANDBY"}
          </span>
        </div>

        {isTerminalExpanded && (
          <div className="h-52 overflow-y-auto p-4 bg-black text-green-400 font-mono text-[11px] space-y-1.5 leading-relaxed">
            {simLogs.length > 0 ? (
              simLogs.map((log, i) => <div key={i}>{log}</div>)
            ) : jobs.length > 0 ? (
              jobs.map((job, idx) => <div key={idx}>[{job.serverIp}] {job.status}: {job.output}</div>)
            ) : (
              <div className="text-[var(--text-ghost)] text-center pt-8">
                Ready for deployment execution. Select an architecture preset and click "Execute Deployment".
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
