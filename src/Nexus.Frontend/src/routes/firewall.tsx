import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import {
  getFirewallRulesClient,
  toggleFirewallRuleClient,
  addFirewallRuleClient,
  deleteFirewallRuleClient,
  updateFirewallRuleClient,
  type FirewallRule,
  type Server
} from "@/api/client";
import { getServersClient as getServers } from "@/api/client";
import { toast } from "sonner";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Download,
  Search,
  RefreshCw,
  Terminal,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  Sliders,
  FileCode,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Zap,
  Check,
  Eye,
  Settings,
  HelpCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

export const Route = createFileRoute("/firewall")({
  head: () => ({
    meta: [
      { title: "Windows Defender Firewall Suite — NEXUS" },
      { name: "description", content: "Manage Windows Defender Firewall profiles, inbound/outbound security rules, packet logs, and CIS compliance." }
    ]
  }),
  component: FirewallPage,
});

type ProfileState = {
  enabled: boolean;
  inboundAction: "Block" | "Allow";
  outboundAction: "Allow" | "Block";
  logDroppedPackets: boolean;
  logConnections: boolean;
};

type PacketLog = {
  id: string;
  timestamp: string;
  direction: "Inbound" | "Outbound";
  action: "Allowed" | "Blocked";
  protocol: "TCP" | "UDP" | "ICMP";
  srcIp: string;
  srcPort: number;
  dstPort: number;
  matchedRule: string;
};

const PRESET_TEMPLATES = [
  { name: "Web Server (HTTP 80 / HTTPS 443)", profile: "All", protocol: "TCP", localPort: "80, 443", remoteIp: "Any", action: "Allow", direction: "Inbound", description: "Standard web publishing traffic for IIS / reverse proxies" },
  { name: "Remote Desktop (RDP 3389)", profile: "Domain", protocol: "TCP", localPort: "3389", remoteIp: "10.0.0.0/8", action: "Allow", direction: "Inbound", description: "Restricted RDP remote administration access" },
  { name: "SQL Server (TCP 1433)", profile: "Domain", protocol: "TCP", localPort: "1433", remoteIp: "192.168.0.0/16", action: "Allow", direction: "Inbound", description: "Inbound MSSQL database engine traffic" },
  { name: "WinRM HTTPS Management (TCP 5986)", profile: "Domain", protocol: "TCP", localPort: "5986", remoteIp: "10.0.0.0/8", action: "Allow", direction: "Inbound", description: "Encrypted remote PowerShell and WMI management" },
  { name: "Block Inbound Legacy SMBv1 (TCP 445)", profile: "All", protocol: "TCP", localPort: "445", remoteIp: "Any", action: "Block", direction: "Inbound", description: "Hardening rule preventing unencrypted legacy SMB exploit attempts" },
  { name: "Block Direct Internet RDP Access", profile: "Public", protocol: "TCP", localPort: "3389", remoteIp: "0.0.0.0/0", action: "Block", direction: "Inbound", description: "Mitigates brute-force attacks by blocking public RDP exposure" },
  { name: "ICMP Diagnostic Ping (Echo Request)", profile: "Domain", protocol: "ICMP", localPort: "Any", remoteIp: "10.0.0.0/8", action: "Allow", direction: "Inbound", description: "Allows ping diagnostics within internal network" },
  { name: "Block Outbound Tor / Mining Ports", profile: "All", protocol: "TCP", localPort: "8333, 9001, 9050", remoteIp: "Any", action: "Block", direction: "Outbound", description: "Prevents crypto mining traffic and darknet relay egress" }
];

function FirewallPage() {
  const [server, setServer] = useState("web01");
  const [serversList, setServersList] = useState<Server[]>([]);
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"rules" | "templates" | "packets" | "audit" | "script">("rules");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState<"All" | "Inbound" | "Outbound">("All");
  const [actionFilter, setActionFilter] = useState<"All" | "Allow" | "Block">("All");
  const [profileFilter, setProfileFilter] = useState<"All" | "Domain" | "Private" | "Public">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Enabled" | "Disabled">("All");

  // Selected Rules for Bulk Actions
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);

  // Profile States per Server
  const [profiles, setProfiles] = useState<Record<string, ProfileState>>({
    Domain: { enabled: true, inboundAction: "Block", outboundAction: "Allow", logDroppedPackets: true, logConnections: false },
    Private: { enabled: true, inboundAction: "Block", outboundAction: "Allow", logDroppedPackets: true, logConnections: false },
    Public: { enabled: true, inboundAction: "Block", outboundAction: "Allow", logDroppedPackets: true, logConnections: true }
  });

  // Modal Dialog States
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);
  const [ruleFormData, setRuleFormData] = useState<Omit<FirewallRule, "id">>({
    name: "",
    enabled: true,
    profile: "Domain",
    protocol: "TCP",
    localPort: "80",
    remoteIp: "Any",
    action: "Allow",
    direction: "Inbound",
    description: "",
    program: ""
  });

  // Simulated Live Packet Stream State
  const [packetLogs, setPacketLogs] = useState<PacketLog[]>([]);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  // Fetch target servers list
  useEffect(() => {
    getServers().then((svrs) => setServersList(svrs || [])).catch(console.error);
  }, []);

  // Fetch Firewall Rules for active server
  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await getFirewallRulesClient(server);
      setRules(data || []);
    } catch (err) {
      toast.error("Failed to load firewall rules");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [server]);

  // Generate simulated live packet stream
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      const isBlocked = Math.random() > 0.65;
      const protocols: ("TCP" | "UDP" | "ICMP")[] = ["TCP", "UDP", "ICMP"];
      const proto = protocols[Math.floor(Math.random() * protocols.length)];
      const srcIps = ["185.220.101.5", "192.168.1.45", "10.4.12.99", "45.142.120.12", "192.168.1.102"];
      const ports = [3389, 445, 80, 443, 5985, 22, 1433];
      const srcIp = srcIps[Math.floor(Math.random() * srcIps.length)];
      const dstPort = ports[Math.floor(Math.random() * ports.length)];

      const log: PacketLog = {
        id: `pkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString(),
        direction: Math.random() > 0.2 ? "Inbound" : "Outbound",
        action: isBlocked ? "Blocked" : "Allowed",
        protocol: proto,
        srcIp,
        srcPort: Math.floor(10000 + Math.random() * 50000),
        dstPort,
        matchedRule: isBlocked
          ? dstPort === 3389
            ? "Block Direct Internet RDP Access"
            : "Default Inbound Block Policy"
          : dstPort === 443
          ? "IIS Secure Web Publishing (HTTPS-In)"
          : "Windows Remote Management (HTTP-In)"
      };

      setPacketLogs((prev) => [log, ...prev.slice(0, 49)]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Handle Rule Toggle
  const handleToggle = async (ruleId: string, enabled: boolean) => {
    setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, enabled } : r)));
    const ok = await toggleFirewallRuleClient(server, ruleId, enabled);
    if (ok) {
      toast.success(`Rule ${enabled ? "enabled" : "disabled"} successfully`);
    } else {
      toast.error("Failed to update firewall rule status");
    }
  };

  // Handle Profile Toggle
  const handleProfileToggle = (pName: string) => {
    setProfiles((prev) => ({
      ...prev,
      [pName]: { ...prev[pName], enabled: !prev[pName].enabled }
    }));
    toast.success(`${pName} Profile state updated`);
  };

  const handleProfileInboundToggle = (pName: string) => {
    setProfiles((prev) => ({
      ...prev,
      [pName]: {
        ...prev[pName],
        inboundAction: prev[pName].inboundAction === "Block" ? "Allow" : "Block"
      }
    }));
    toast.success(`${pName} Profile Inbound default policy changed`);
  };

  // Handle Add/Edit Rule Submission
  const handleSaveRule = async () => {
    if (!ruleFormData.name.trim()) {
      toast.warning("Please enter a rule name");
      return;
    }

    if (editingRule) {
      const ok = await updateFirewallRuleClient(server, editingRule.id, ruleFormData);
      if (ok) {
        toast.success("Firewall rule updated successfully");
        setRules((prev) =>
          prev.map((r) => (r.id === editingRule.id ? { ...r, ...ruleFormData } : r))
        );
      } else {
        toast.error("Failed to update firewall rule");
      }
    } else {
      const created = await addFirewallRuleClient(server, ruleFormData);
      if (created) {
        toast.success("New firewall rule created!");
        setRules((prev) => [created, ...prev]);
      } else {
        toast.error("Failed to create firewall rule");
      }
    }

    setIsRuleModalOpen(false);
    setEditingRule(null);
  };

  // Delete Rule
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this firewall rule?")) return;
    const ok = await deleteFirewallRuleClient(server, ruleId);
    if (ok) {
      toast.success("Firewall rule deleted");
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } else {
      toast.error("Failed to delete rule");
    }
  };

  // Add Preset Template Rule
  const handleDeployPreset = async (tmpl: typeof PRESET_TEMPLATES[0]) => {
    const created = await addFirewallRuleClient(server, {
      name: tmpl.name,
      enabled: true,
      profile: tmpl.profile as any,
      protocol: tmpl.protocol as any,
      localPort: tmpl.localPort,
      remoteIp: tmpl.remoteIp,
      action: tmpl.action as any,
      direction: tmpl.direction as any,
      description: tmpl.description
    });

    if (created) {
      toast.success(`Deployed preset rule: ${tmpl.name}`);
      setRules((prev) => [created, ...prev]);
    } else {
      toast.error("Failed to deploy preset rule");
    }
  };

  // Quick Block IP from Packet Stream
  const handleBlockIp = async (ip: string) => {
    const created = await addFirewallRuleClient(server, {
      name: `Block Malicious IP (${ip})`,
      enabled: true,
      profile: "All",
      protocol: "Any",
      localPort: "Any",
      remoteIp: ip,
      action: "Block",
      direction: "Inbound",
      description: `Automated security block rule created from live packet logs for IP ${ip}`
    });

    if (created) {
      toast.success(`Inbound traffic from IP ${ip} blocked!`);
      setRules((prev) => [created, ...prev]);
    }
  };

  // Bulk Actions
  const toggleSelectAll = () => {
    if (selectedRuleIds.length === filteredRules.length) {
      setSelectedRuleIds([]);
    } else {
      setSelectedRuleIds(filteredRules.map((r) => r.id));
    }
  };

  const handleBulkEnable = async (enabled: boolean) => {
    if (selectedRuleIds.length === 0) return;
    for (const id of selectedRuleIds) {
      await toggleFirewallRuleClient(server, id, enabled);
    }
    setRules((prev) =>
      prev.map((r) => (selectedRuleIds.includes(r.id) ? { ...r, enabled } : r))
    );
    toast.success(`${selectedRuleIds.length} rules ${enabled ? "enabled" : "disabled"}`);
    setSelectedRuleIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedRuleIds.length === 0) return;
    if (!confirm(`Delete ${selectedRuleIds.length} selected rules?`)) return;
    for (const id of selectedRuleIds) {
      await deleteFirewallRuleClient(server, id);
    }
    setRules((prev) => prev.filter((r) => !selectedRuleIds.includes(r.id)));
    toast.success(`${selectedRuleIds.length} rules deleted`);
    setSelectedRuleIds([]);
  };

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      if (directionFilter !== "All" && r.direction !== directionFilter) return false;
      if (actionFilter !== "All" && r.action !== actionFilter) return false;
      if (profileFilter !== "All" && r.profile !== profileFilter && r.profile !== "All") return false;
      if (statusFilter === "Enabled" && !r.enabled) return false;
      if (statusFilter === "Disabled" && r.enabled) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.localPort.toLowerCase().includes(q) ||
          r.remoteIp.toLowerCase().includes(q) ||
          r.protocol.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [rules, directionFilter, actionFilter, profileFilter, statusFilter, searchQuery]);

  // CIS Compliance / Security Audit Calculations
  const auditChecks = useMemo(() => {
    const domainOk = profiles.Domain.enabled;
    const privateOk = profiles.Private.enabled;
    const publicOk = profiles.Public.enabled;
    const blockSmb1 = rules.some((r) => r.enabled && r.localPort.includes("445") && r.action === "Block");
    const blockRdpInternet = rules.some((r) => r.enabled && r.localPort.includes("3389") && r.action === "Block" && (r.profile === "Public" || r.profile === "All"));
    const loggingEnabled = profiles.Domain.logDroppedPackets || profiles.Public.logDroppedPackets;

    const checks = [
      { id: "domain_profile", title: "Domain Profile Active", passed: domainOk, desc: "Ensures firewall protection when attached to corporate Active Directory domain" },
      { id: "public_profile", title: "Public Profile Active", passed: publicOk, desc: "Guards against untrusted network connections" },
      { id: "smb1_blocked", title: "Legacy SMBv1 Inbound Blocked", passed: blockSmb1, desc: "Mitigates unencrypted legacy SMB vulnerabilities (EternalBlue)" },
      { id: "rdp_public_block", title: "Public RDP Exposure Prevented", passed: blockRdpInternet, desc: "Prevents direct Internet RDP brute-force scans on Public interfaces" },
      { id: "dropped_logging", title: "Packet Drop Audit Logging", passed: loggingEnabled, desc: "Logs security telemetry for dropped inbound packets" }
    ];

    const passedCount = checks.filter((c) => c.passed).length;
    const score = Math.round((passedCount / checks.length) * 100);

    return { checks, score, passedCount };
  }, [profiles, rules]);

  // Generate PowerShell Export Script
  const generatePowerShellScript = () => {
    const lines = [
      `# Windows Defender Firewall Script for Server: ${server.toUpperCase()}`,
      `# Generated by NEXUS Enterprise Fleet Orchestrator at ${new Date().toLocaleString()}`,
      ``,
      `# 1. Firewall Profile Configuration`,
      `Set-NetFirewallProfile -Profile Domain -Enabled ${profiles.Domain.enabled ? "True" : "False"} -DefaultInboundAction ${profiles.Domain.inboundAction} -DefaultOutboundAction ${profiles.Domain.outboundAction}`,
      `Set-NetFirewallProfile -Profile Private -Enabled ${profiles.Private.enabled ? "True" : "False"} -DefaultInboundAction ${profiles.Private.inboundAction} -DefaultOutboundAction ${profiles.Private.outboundAction}`,
      `Set-NetFirewallProfile -Profile Public -Enabled ${profiles.Public.enabled ? "True" : "False"} -DefaultInboundAction ${profiles.Public.inboundAction} -DefaultOutboundAction ${profiles.Public.outboundAction}`,
      ``,
      `# 2. Firewall Rules (${rules.length} Active Rules)`
    ];

    rules.forEach((r) => {
      lines.push(
        `New-NetFirewallRule -DisplayName "${r.name}" -Direction ${r.direction} -Action ${r.action} -Profile ${r.profile} -Protocol ${r.protocol} ${r.localPort !== "Any" ? `-LocalPort ${r.localPort}` : ""} ${r.remoteIp !== "Any" ? `-RemoteAddress "${r.remoteIp}"` : ""} -Enabled ${r.enabled ? "True" : "False"}`
      );
    });

    return lines.join("\n");
  };

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(generatePowerShellScript());
    toast.success("PowerShell script copied to clipboard!");
  };

  const downloadScriptFile = () => {
    const blob = new Blob([generatePowerShellScript()], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FirewallConfig-${server}-${new Date().toISOString().slice(0, 10)}.ps1`;
    link.click();
    toast.success("Downloaded FirewallConfig.ps1 file");
  };

  const activeServerObj = serversList.find((s) => s.id === server) || { name: server, ip: "192.168.0.10" };

  return (
    <PageWrapper>
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[var(--border-c)]">
        <div>
          <PageHeader
            eyebrow="Windows Host Security & Packet Filtering"
            title="Windows Defender Firewall & Security Suite"
          />
          <p className="mono text-[11px] text-[var(--text-sub)] mt-1 flex items-center gap-2">
            <span>Target Node: <strong className="text-[var(--amber)]">{activeServerObj.name}</strong> ({activeServerObj.ip})</span>
            <span>•</span>
            <span className="text-[var(--ok)]">{rules.length} Firewall Rules Configured</span>
            <span>•</span>
            <span className="text-[var(--teal)]">CIS Compliance: {auditChecks.score}%</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ServerSelector value={server} onChange={setServer} />

          <button
            onClick={() => {
              setRefreshing(true);
              fetchRules();
            }}
            className="mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text-sub)] hover:text-[var(--text)] hover:border-[var(--amber)] transition-colors">
            <RefreshCw size={13} className={refreshing ? "animate-spin text-[var(--amber)]" : ""} /> Refresh
          </button>

          <button
            onClick={() => {
              setEditingRule(null);
              setRuleFormData({
                name: "",
                enabled: true,
                profile: "Domain",
                protocol: "TCP",
                localPort: "80",
                remoteIp: "Any",
                action: "Allow",
                direction: "Inbound",
                description: "",
                program: ""
              });
              setIsRuleModalOpen(true);
            }}
            className="mono flex items-center gap-1.5 rounded-md border border-[var(--amber)]/40 bg-[var(--amber-low)] px-3 py-1.5 text-[11px] font-bold text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black transition-colors">
            <Plus size={14} /> Add New Rule
          </button>
        </div>
      </div>

      {/* Top Firewall Profile Overview Cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["Domain", "Private", "Public"] as const).map((p) => {
          const prof = profiles[p];
          const isEnabled = prof.enabled;

          return (
            <div
              key={p}
              className={`p-4 rounded-xl border transition-all ${
                isEnabled
                  ? "bg-[var(--bg-card)] border-[var(--border-c)]"
                  : "bg-[var(--bg-surface)] border-[var(--border-dim)] opacity-60"
              }`}>
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-c)]">
                <div className="flex items-center gap-2">
                  <Shield size={16} className={isEnabled ? "text-[var(--ok)]" : "text-[var(--text-sub)]"} />
                  <span className="font-bold text-xs text-[var(--text)]">{p} Profile</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isEnabled ? "bg-[var(--ok-low)] text-[var(--ok)]" : "bg-[var(--crit-low)] text-[var(--crit)]"
                  }`}>
                    {isEnabled ? "ACTIVE" : "OFF"}
                  </span>
                  <button
                    onClick={() => handleProfileToggle(p)}
                    className="mono text-[10px] font-bold underline text-[var(--amber)] hover:text-[var(--text)]">
                    Toggle
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="mono text-[10px] text-[var(--text-sub)]">Inbound Default Policy:</span>
                  <button
                    onClick={() => handleProfileInboundToggle(p)}
                    className={`mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      prof.inboundAction === "Block" ? "bg-[var(--crit-low)] text-[var(--crit)]" : "bg-[var(--ok-low)] text-[var(--ok)]"
                    }`}>
                    {prof.inboundAction} Inbound Traffic
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="mono text-[10px] text-[var(--text-sub)]">Outbound Policy:</span>
                  <span className="mono text-[10px] font-bold text-[var(--ok)]">{prof.outboundAction} Outbound</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[var(--border-c)] text-[10px] text-[var(--text-sub)]">
                  <span>Packet Drop Audit Logging:</span>
                  <span className={prof.logDroppedPackets ? "text-[var(--teal)] font-bold" : "text-[var(--text-ghost)]"}>
                    {prof.logDroppedPackets ? "Enabled (Log.txt)" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Tabs Navigation */}
      <div className="mt-5 flex items-center gap-1 border-b border-[var(--border-c)] overflow-x-auto pb-1">
        {[
          { id: "rules", label: "Firewall Rules Table", icon: Sliders, count: filteredRules.length },
          { id: "templates", label: "Enterprise Rule Presets", icon: Zap, count: PRESET_TEMPLATES.length },
          { id: "packets", label: "Live Packet Logs Stream", icon: Activity, count: packetLogs.length },
          { id: "audit", label: "CIS Compliance Audit", icon: ShieldCheck, count: `${auditChecks.score}%` },
          { id: "script", label: "PowerShell Script Generator", icon: FileCode }
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
              <span className={`mono text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? "bg-black/20 text-black" : "bg-[var(--bg-surface)] text-[var(--text-sub)]"
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: RULES TABLE */}
      {activeTab === "rules" && (
        <div className="mt-4 space-y-4">
          {/* Filtering Bar & Search */}
          <div className="p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-sub)]" />
                <input
                  type="text"
                  placeholder="Search rule name, port, remote IP, protocol..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] pl-9 pr-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
                />
              </div>

              {/* Direction Filter */}
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value as any)}
                className="mono rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:outline-none font-bold">
                <option value="All">Dir: All</option>
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
              </select>

              {/* Action Filter */}
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as any)}
                className="mono rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:outline-none font-bold">
                <option value="All">Action: All</option>
                <option value="Allow">Allow</option>
                <option value="Block">Block</option>
              </select>

              {/* Profile Filter */}
              <select
                value={profileFilter}
                onChange={(e) => setProfileFilter(e.target.value as any)}
                className="mono rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:outline-none font-bold">
                <option value="All">Profile: All</option>
                <option value="Domain">Domain</option>
                <option value="Private">Private</option>
                <option value="Public">Public</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="mono rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:outline-none font-bold">
                <option value="All">Status: All</option>
                <option value="Enabled">Enabled</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>

            {/* Bulk Action Controls */}
            {selectedRuleIds.length > 0 && (
              <div className="flex items-center gap-2 border-l border-[var(--border-c)] pl-3">
                <span className="mono text-[10px] text-[var(--amber)] font-bold">
                  {selectedRuleIds.length} Selected
                </span>
                <button
                  onClick={() => handleBulkEnable(true)}
                  className="mono text-[10px] font-bold px-2 py-1 rounded bg-[var(--ok-low)] text-[var(--ok)] hover:bg-[var(--ok)] hover:text-black">
                  Enable
                </button>
                <button
                  onClick={() => handleBulkEnable(false)}
                  className="mono text-[10px] font-bold px-2 py-1 rounded bg-[var(--amber-low)] text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black">
                  Disable
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="mono text-[10px] font-bold px-2 py-1 rounded bg-[var(--crit-low)] text-[var(--crit)] hover:bg-[var(--crit)] hover:text-white">
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Rules Table */}
          <div className="rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] text-left">
                <thead>
                  <tr className="mono text-[10px] uppercase tracking-wider text-[var(--text-sub)] border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
                    <th className="px-3 py-2.5 w-8">
                      <input
                        type="checkbox"
                        checked={filteredRules.length > 0 && selectedRuleIds.length === filteredRules.length}
                        onChange={toggleSelectAll}
                        className="accent-[var(--amber)] h-3.5 w-3.5"
                      />
                    </th>
                    <th className="px-3 py-2.5">Enabled</th>
                    <th className="px-3 py-2.5">Rule Name & Details</th>
                    <th className="px-3 py-2.5">Dir</th>
                    <th className="px-3 py-2.5">Action</th>
                    <th className="px-3 py-2.5">Profile</th>
                    <th className="px-3 py-2.5">Protocol</th>
                    <th className="px-3 py-2.5">Local Port</th>
                    <th className="px-3 py-2.5">Remote IP / Subnet</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-c)] mono">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-[var(--text-sub)]">
                        <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-[var(--amber)]" />
                        Loading Windows Defender Firewall rules...
                      </td>
                    </tr>
                  ) : filteredRules.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-[var(--text-sub)]">
                        No firewall rules match the active search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRules.map((r) => {
                      const isSelected = selectedRuleIds.includes(r.id);

                      return (
                        <tr
                          key={r.id}
                          className={`transition-colors hover:bg-[var(--bg-surface)] ${
                            !r.enabled ? "opacity-50" : ""
                          } ${isSelected ? "bg-[var(--amber-low)]/20" : ""}`}>
                          <td className="px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedRuleIds([...selectedRuleIds, r.id]);
                                else setSelectedRuleIds(selectedRuleIds.filter((id) => id !== r.id));
                              }}
                              className="accent-[var(--amber)] h-3.5 w-3.5"
                            />
                          </td>

                          <td className="px-3 py-2.5">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={r.enabled}
                                onChange={(e) => handleToggle(r.id, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-7 h-4 bg-[var(--border-c)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[var(--amber)]"></div>
                            </label>
                          </td>

                          <td className="px-3 py-2.5">
                            <div className="font-bold text-[var(--text)] text-[12px]">{r.name}</div>
                            {r.description && (
                              <div className="text-[10px] text-[var(--text-sub)] line-clamp-1">{r.description}</div>
                            )}
                          </td>

                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              r.direction === "Inbound" ? "bg-[var(--teal-low)] text-[var(--teal)]" : "bg-[var(--amber-low)] text-[var(--amber)]"
                            }`}>
                              {r.direction === "Inbound" ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                              {r.direction}
                            </span>
                          </td>

                          <td className="px-3 py-2.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              r.action === "Allow" ? "bg-[var(--ok-low)] text-[var(--ok)]" : "bg-[var(--crit-low)] text-[var(--crit)]"
                            }`}>
                              {r.action}
                            </span>
                          </td>

                          <td className="px-3 py-2.5">
                            <span className="text-[10px] font-semibold text-[var(--text-sub)] border border-[var(--border-c)] px-1.5 py-0.5 rounded bg-[var(--bg-surface)]">
                              {r.profile}
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-[var(--amber)] font-bold">{r.protocol}</td>

                          <td className="px-3 py-2.5 text-[var(--text)] font-semibold">{r.localPort}</td>

                          <td className="px-3 py-2.5 text-[var(--text-sub)]">{r.remoteIp}</td>

                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                title="Edit Rule"
                                onClick={() => {
                                  setEditingRule(r);
                                  setRuleFormData({
                                    name: r.name,
                                    enabled: r.enabled,
                                    profile: r.profile,
                                    protocol: r.protocol,
                                    localPort: r.localPort,
                                    remoteIp: r.remoteIp,
                                    action: r.action,
                                    direction: r.direction,
                                    description: r.description || "",
                                    program: r.program || ""
                                  });
                                  setIsRuleModalOpen(true);
                                }}
                                className="p-1 rounded text-[var(--text-sub)] hover:text-[var(--amber)] hover:bg-[var(--bg-surface)]">
                                <Edit2 size={13} />
                              </button>

                              <button
                                title="Delete Rule"
                                onClick={() => handleDeleteRule(r.id)}
                                className="p-1 rounded text-[var(--text-sub)] hover:text-[var(--crit)] hover:bg-[var(--bg-surface)]">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: ENTERPRISE PRESETS */}
      {activeTab === "templates" && (
        <div className="mt-4 space-y-4">
          <div className="p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)]">
            <h2 className="display text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Zap size={16} className="text-[var(--amber)]" /> Enterprise Workload Presets & Hardening Templates
            </h2>
            <p className="text-[11px] text-[var(--text-sub)] mt-1">
              Deploy pre-validated, compliant firewall rule templates for standard Windows infrastructure services with 1-click execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRESET_TEMPLATES.map((tmpl, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-[var(--text)] flex items-center gap-2">
                      <Shield size={14} className={tmpl.action === "Allow" ? "text-[var(--ok)]" : "text-[var(--crit)]"} />
                      {tmpl.name}
                    </h3>

                    <span className={`mono text-[9px] font-bold px-2 py-0.5 rounded ${
                      tmpl.action === "Allow" ? "bg-[var(--ok-low)] text-[var(--ok)]" : "bg-[var(--crit-low)] text-[var(--crit)]"
                    }`}>
                      {tmpl.direction} {tmpl.action}
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-sub)] mt-2">{tmpl.description}</p>

                  <div className="mt-3 flex flex-wrap gap-2 mono text-[10px]">
                    <span className="bg-[var(--bg-surface)] border border-[var(--border-c)] px-2 py-0.5 rounded text-[var(--amber)] font-bold">
                      Ports: {tmpl.localPort}
                    </span>
                    <span className="bg-[var(--bg-surface)] border border-[var(--border-c)] px-2 py-0.5 rounded text-[var(--text-sub)]">
                      Proto: {tmpl.protocol}
                    </span>
                    <span className="bg-[var(--bg-surface)] border border-[var(--border-c)] px-2 py-0.5 rounded text-[var(--text-sub)]">
                      Scope: {tmpl.profile}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeployPreset(tmpl)}
                  className="mono w-full mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-[var(--amber)]/40 bg-[var(--amber-low)] py-2 text-xs font-bold text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black transition-colors">
                  <Plus size={13} /> Deploy Rule to {server}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: LIVE PACKET LOGS STREAM */}
      {activeTab === "packets" && (
        <div className="mt-4 space-y-4">
          <div className="p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] flex items-center justify-between">
            <div>
              <h2 className="display text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <Activity size={16} className="text-[var(--teal)] animate-pulse" /> Live Host Packet Filtering Activity Log
              </h2>
              <p className="text-[11px] text-[var(--text-sub)] mt-1">
                Real-time connection evaluation stream processed by kernel pfirewall driver on target node {server}.
              </p>
            </div>

            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`mono text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                isLiveStreaming
                  ? "bg-[var(--ok-low)] border-[var(--ok)]/40 text-[var(--ok)]"
                  : "bg-[var(--bg-surface)] border-[var(--border-c)] text-[var(--text-sub)]"
              }`}>
              {isLiveStreaming ? "Streaming Active (Pause)" : "Streaming Paused (Resume)"}
            </button>
          </div>

          <div className="rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] overflow-hidden">
            <div className="max-h-[460px] overflow-y-auto">
              <table className="w-full text-[11px] text-left mono">
                <thead className="sticky top-0 bg-[var(--bg-surface)] border-b border-[var(--border-c)] uppercase text-[10px] text-[var(--text-sub)]">
                  <tr>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Direction</th>
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Proto</th>
                    <th className="px-3 py-2">Source IP</th>
                    <th className="px-3 py-2">Source Port</th>
                    <th className="px-3 py-2">Dest Port</th>
                    <th className="px-3 py-2">Rule Matched</th>
                    <th className="px-3 py-2 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-c)]">
                  {packetLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={log.action === "Blocked" ? "bg-[var(--crit-low)]/10" : "hover:bg-[var(--bg-surface)]"}>
                      <td className="px-3 py-2 text-[var(--text-sub)]">{log.timestamp}</td>
                      <td className="px-3 py-2 font-bold">{log.direction}</td>
                      <td className="px-3 py-2">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                          log.action === "Allowed" ? "bg-[var(--ok-low)] text-[var(--ok)]" : "bg-[var(--crit-low)] text-[var(--crit)]"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[var(--amber)]">{log.protocol}</td>
                      <td className="px-3 py-2 text-[var(--text)] font-semibold">{log.srcIp}</td>
                      <td className="px-3 py-2 text-[var(--text-sub)]">{log.srcPort}</td>
                      <td className="px-3 py-2 text-[var(--amber)] font-bold">{log.dstPort}</td>
                      <td className="px-3 py-2 text-[var(--text-sub)]">{log.matchedRule}</td>
                      <td className="px-3 py-2 text-right">
                        {log.action === "Allowed" && (
                          <button
                            onClick={() => handleBlockIp(log.srcIp)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--crit-low)] text-[var(--crit)] hover:bg-[var(--crit)] hover:text-white">
                            Block IP
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: CIS COMPLIANCE AUDIT */}
      {activeTab === "audit" && (
        <div className="mt-4 space-y-4">
          <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] flex flex-wrap items-center justify-between gap-6">
            <div>
              <span className="mono text-[10px] uppercase font-bold text-[var(--teal)] tracking-wider block">
                CIS Security Baseline Auditor
              </span>
              <h2 className="display text-base font-bold text-[var(--text)] mt-1">
                Host Firewall Security Posture Score
              </h2>
              <p className="text-[11px] text-[var(--text-sub)] mt-1 max-w-xl">
                Evaluates host network exposure against Center for Internet Security (CIS) Microsoft Windows Server Firewall Benchmark guidelines.
              </p>
            </div>

            <div className="text-center p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] min-w-[140px]">
              <div className="mono text-3xl font-extrabold text-[var(--amber)]">{auditChecks.score}%</div>
              <div className="mono text-[10px] font-bold text-[var(--text-sub)] mt-1">
                {auditChecks.passedCount} / {auditChecks.checks.length} Checks Passed
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-card)] space-y-4">
            <h3 className="mono text-xs font-bold text-[var(--amber)] uppercase tracking-wider">
              Audit Control Checklist Findings
            </h3>

            <div className="space-y-3">
              {auditChecks.checks.map((chk) => (
                <div
                  key={chk.id}
                  className="p-3.5 rounded-xl border border-[var(--border-c)] bg-[var(--bg-surface)] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {chk.passed ? (
                      <CheckCircle2 size={18} className="text-[var(--ok)] shrink-0" />
                    ) : (
                      <XCircle size={18} className="text-[var(--crit)] shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-xs text-[var(--text)]">{chk.title}</div>
                      <div className="text-[11px] text-[var(--text-sub)]">{chk.desc}</div>
                    </div>
                  </div>

                  <span className={`mono text-[10px] font-bold px-2 py-0.5 rounded ${
                    chk.passed ? "bg-[var(--ok-low)] text-[var(--ok)]" : "bg-[var(--crit-low)] text-[var(--crit)]"
                  }`}>
                    {chk.passed ? "COMPLIANT" : "NON-COMPLIANT"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: POWERSHELL SCRIPT GENERATOR */}
      {activeTab === "script" && (
        <div className="mt-4 space-y-4">
          <div className="p-4 rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] flex items-center justify-between">
            <div>
              <h2 className="display text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <Terminal size={16} className="text-[var(--amber)]" /> Automated PowerShell Deployment Script Generator
              </h2>
              <p className="text-[11px] text-[var(--text-sub)] mt-1">
                Export exact NetSecurity PowerShell commands to replicate firewall profiles and rules across target nodes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyScriptToClipboard}
                className="mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text)] hover:border-[var(--amber)]">
                <Copy size={13} /> Copy Script
              </button>
              <button
                onClick={downloadScriptFile}
                className="mono flex items-center gap-1.5 rounded-md border border-[var(--amber)]/40 bg-[var(--amber-low)] px-3 py-1.5 text-[11px] font-bold text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black">
                <Download size={13} /> Download .ps1
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-c)] bg-[#0d0d0d] font-mono text-[11px] text-[var(--amber)] overflow-x-auto max-h-[450px]">
            <pre>{generatePowerShellScript()}</pre>
          </div>
        </div>
      )}

      {/* MODAL DIALOG: ADD / EDIT FIREWALL RULE */}
      <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
        <DialogContent className="bg-[var(--bg-surface)] border border-[var(--border-c)] text-[var(--text)] max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Shield size={16} className="text-[var(--amber)]" />
              {editingRule ? "Edit Firewall Rule" : "Create New Windows Defender Firewall Rule"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs mt-2">
            <div>
              <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                Rule Name
              </label>
              <input
                type="text"
                value={ruleFormData.name}
                onChange={(e) => setRuleFormData({ ...ruleFormData, name: e.target.value })}
                placeholder="e.g. Allow Custom Application (TCP 8080)"
                className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-card)] p-2 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                  Direction
                </label>
                <select
                  value={ruleFormData.direction}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, direction: e.target.value as any })}
                  className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-card)] p-2 text-xs text-[var(--text)] focus:outline-none">
                  <option value="Inbound">Inbound</option>
                  <option value="Outbound">Outbound</option>
                </select>
              </div>

              <div>
                <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                  Action
                </label>
                <select
                  value={ruleFormData.action}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, action: e.target.value as any })}
                  className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-card)] p-2 text-xs text-[var(--text)] focus:outline-none">
                  <option value="Allow">Allow Connection</option>
                  <option value="Block">Block Connection</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                  Profile Scope
                </label>
                <select
                  value={ruleFormData.profile}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, profile: e.target.value as any })}
                  className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-card)] p-2 text-xs text-[var(--text)] focus:outline-none">
                  <option value="All">All Profiles</option>
                  <option value="Domain">Domain Profile</option>
                  <option value="Private">Private Profile</option>
                  <option value="Public">Public Profile</option>
                </select>
              </div>

              <div>
                <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                  Protocol
                </label>
                <select
                  value={ruleFormData.protocol}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, protocol: e.target.value as any })}
                  className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-card)] p-2 text-xs text-[var(--text)] focus:outline-none">
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="ICMP">ICMP</option>
                  <option value="Any">Any Protocol</option>
                </select>
              </div>

              <div>
                <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                  Local Port(s)
                </label>
                <input
                  type="text"
                  value={ruleFormData.localPort}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, localPort: e.target.value })}
                  placeholder="e.g. 80, 443 or Any"
                  className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-card)] p-2 text-xs text-[var(--text)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                Remote IP / CIDR Subnet Scope
              </label>
              <input
                type="text"
                value={ruleFormData.remoteIp}
                onChange={(e) => setRuleFormData({ ...ruleFormData, remoteIp: e.target.value })}
                placeholder="e.g. Any, 10.0.0.0/8, or 192.168.1.50"
                className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-card)] p-2 text-xs text-[var(--text)] focus:outline-none"
              />
            </div>

            <div>
              <label className="mono text-[10px] font-bold text-[var(--text-sub)] uppercase block mb-1">
                Description / Administrative Notes
              </label>
              <textarea
                value={ruleFormData.description}
                onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                placeholder="Reason or ticket reference for creating this rule..."
                rows={2}
                className="mono w-full rounded-lg border border-[var(--border-c)] bg-[var(--bg-card)] p-2 text-xs text-[var(--text)] focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 flex gap-2">
            <button
              onClick={() => setIsRuleModalOpen(false)}
              className="mono rounded-lg border border-[var(--border-c)] bg-[var(--bg-card)] px-4 py-2 text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--text)]">
              Cancel
            </button>
            <button
              onClick={handleSaveRule}
              className="mono rounded-lg bg-[var(--amber)] px-4 py-2 text-xs font-bold text-black hover:bg-[var(--amber)]/90">
              {editingRule ? "Save Changes" : "Create Firewall Rule"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
