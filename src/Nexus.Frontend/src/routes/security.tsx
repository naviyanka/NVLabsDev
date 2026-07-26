import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ServerSelector } from "@/components/ui/ServerSelector";
import { 
  getSecurityClient, 
  updateComplianceCheckClient,
  updateSecurityEventStatusClient,
  toggleLocalAdminExpectedClient,
  type SecurityData,
  type SecurityEvent,
  type SecurityComplianceCheck,
  type OpenPort,
  type LocalAdmin
} from "@/api/client";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldX, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Download, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Key, 
  Eye, 
  FileText, 
  Terminal, 
  Radio, 
  Check, 
  X, 
  Zap, 
  Users, 
  Activity, 
  Server, 
  ArrowUpRight,
  Info,
  Filter
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/security")({
  head: () => ({ 
    meta: [
      { title: "Security Center — NEXUS" }, 
      { name: "description", content: "Enterprise security posture, failed logins, CIS compliance benchmarks, and threat intelligence." }
    ] 
  }),
  component: SecurityPage,
});

type TabType = "Overview" | "Events" | "Ports" | "Admins" | "Compliance";
type LevelFilter = "All" | "Critical" | "Error" | "Warning" | "Information";

export function SecurityPage() {
  const [server, setServer] = useState("dc01");
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("Overview");

  // Filters & Search State
  const [eventSearch, setEventSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("All");
  const [portSearch, setPortSearch] = useState("");
  const [complianceCategory, setComplianceCategory] = useState<string>("All");

  // Selected Item Modals
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const fetchData = async (refresh = false) => {
    setLoading(true);
    try {
      const d = await getSecurityClient(server, refresh);
      if (d) setData(d);
    } catch {
      toast.error("Failed to load security assessment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);
  }, [server]);

  // Handle Compliance Toggle Action
  const handleToggleCompliance = async (check: SecurityComplianceCheck) => {
    const nextPassed = !check.passed;
    try {
      const ok = await updateComplianceCheckClient(server, check.id, nextPassed);
      if (ok) {
        toast.success(`Rule "${check.title}" updated: ${nextPassed ? "Passed" : "Failed"}`);
        fetchData();
      } else {
        toast.error("Failed to update compliance check");
      }
    } catch {
      toast.error("Compliance update failed");
    }
  };

  // Handle Security Event Status Action
  const handleUpdateEventStatus = async (eventId: string, status: "Reviewed" | "Resolved") => {
    try {
      const ok = await updateSecurityEventStatusClient(server, eventId, status);
      if (ok) {
        toast.success(`Event marked as ${status}`);
        if (selectedEvent && (selectedEvent.id === eventId || String(selectedEvent.eventId) === eventId)) {
          setSelectedEvent({ ...selectedEvent, status });
        }
        fetchData();
      } else {
        toast.error("Failed to update event status");
      }
    } catch {
      toast.error("Event update failed");
    }
  };

  // Handle Toggle Expected Admin Account
  const handleToggleExpectedAdmin = async (admin: LocalAdmin) => {
    const nextExpected = !admin.expected;
    try {
      const ok = await toggleLocalAdminExpectedClient(server, admin.name, nextExpected);
      if (ok) {
        toast.success(`Admin "${admin.name}" marked as ${nextExpected ? "Expected" : "Unexpected"}`);
        fetchData();
      } else {
        toast.error("Failed to update local admin status");
      }
    } catch {
      toast.error("Admin status update failed");
    }
  };

  // Export JSON Report
  const handleExportAssessment = () => {
    if (!data) return;
    const report = {
      title: "NEXUS Enterprise Security Assessment",
      server,
      exportedAt: new Date().toISOString(),
      securityScore: computedScore,
      summary: {
        failedLogins24h: data.failedLogins24h,
        openPortsCount: data.openPorts.length,
        localAdminsCount: data.localAdmins.length,
        unexpectedAdminsCount: unexpectedAdmins.length,
        compliancePassedCount: passedComplianceCount,
        complianceTotalCount: totalComplianceCount,
        unreviewedEventsCount: unreviewedEventsCount
      },
      data
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NEXUS_SecurityReport_${server}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Security Assessment report downloaded successfully");
  };

  // Computed Metrics & Security Health Score
  const complianceChecks = data?.complianceChecks ?? [];
  const totalComplianceCount = complianceChecks.length;
  const passedComplianceCount = complianceChecks.filter(c => c.passed).length;
  const complianceRate = totalComplianceCount > 0 ? Math.round((passedComplianceCount / totalComplianceCount) * 100) : 100;

  const unexpectedAdmins = useMemo(() => {
    return (data?.localAdmins ?? []).filter(a => !a.expected);
  }, [data]);

  const unreviewedEventsCount = useMemo(() => {
    return (data?.events ?? []).filter(e => !e.status || e.status === "Unreviewed").length;
  }, [data]);

  // Calculate Dynamic Security Score (0-100)
  const computedScore = useMemo(() => {
    if (!data) return 100;
    let base = 100;
    // Failed logins penalty
    base -= Math.min(20, (data.failedLogins24h || 0) * 1.5);
    // Unexpected admins penalty (-15 per unexpected admin)
    base -= unexpectedAdmins.length * 15;
    // Failed compliance check penalty (-10 per failed rule)
    const failedCompliance = totalComplianceCount - passedComplianceCount;
    base -= failedCompliance * 8;
    // Unreviewed critical/error events (-5 each)
    const criticalEvents = data.events.filter(e => (e.level === "Critical" || e.level === "Error") && e.status !== "Resolved").length;
    base -= criticalEvents * 5;

    return Math.max(0, Math.min(100, Math.round(base)));
  }, [data, unexpectedAdmins, totalComplianceCount, passedComplianceCount]);

  // Score Grade letter
  const scoreGrade = useMemo(() => {
    if (computedScore >= 90) return { grade: "A+", color: "var(--ok)", label: "Excellent Security Posture" };
    if (computedScore >= 78) return { grade: "B", color: "var(--teal)", label: "Good - Minor Compliance Gaps" };
    if (computedScore >= 65) return { grade: "C", color: "var(--amber)", label: "Warning - Action Required" };
    return { grade: "F", color: "var(--crit)", label: "Critical Risk - Immediate Hardening Needed" };
  }, [computedScore]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    let result = [...(data?.events ?? [])];
    if (levelFilter !== "All") {
      result = result.filter(e => e.level === levelFilter);
    }
    if (eventSearch) {
      const q = eventSearch.toLowerCase();
      result = result.filter(e => 
        e.message.toLowerCase().includes(q) || 
        String(e.eventId).includes(q) ||
        (e.user && e.user.toLowerCase().includes(q)) ||
        (e.source && e.source.toLowerCase().includes(q))
      );
    }
    return result;
  }, [data?.events, levelFilter, eventSearch]);

  // Filtered Ports
  const filteredPorts = useMemo(() => {
    let result = [...(data?.openPorts ?? [])];
    if (portSearch) {
      const q = portSearch.toLowerCase();
      result = result.filter(p => 
        String(p.localPort).includes(q) || 
        p.processName.toLowerCase().includes(q) || 
        p.protocol.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q)
      );
    }
    return result;
  }, [data?.openPorts, portSearch]);

  // Filtered Compliance Checks
  const filteredCompliance = useMemo(() => {
    let result = [...complianceChecks];
    if (complianceCategory !== "All") {
      result = result.filter(c => c.category === complianceCategory);
    }
    return result;
  }, [complianceChecks, complianceCategory]);

  return (
    <PageWrapper>
      <PageHeader 
        eyebrow="Security Posture & Threat Center" 
        title="Enterprise Security Center" 
      />

      {/* Control Header & Server Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <ServerSelector value={server} onChange={setServer} />
        <div className="flex items-center gap-3">
          {data && (
            <span className="text-[12px] mono text-[var(--text-sub)] hidden sm:inline">
              Last Assessed: <span className="text-[var(--text)] font-semibold">{new Date(data.lastUpdated).toLocaleTimeString()}</span>
            </span>
          )}
          <button
            onClick={handleExportAssessment}
            title="Download NEXUS Security Assessment JSON"
            className="flex items-center gap-2 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-card)] px-3.5 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--amber)] transition-colors shadow-sm"
          >
            <Download size={14} className="text-[var(--amber)]" /> Export Assessment
          </button>
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[var(--amber)] text-black px-4 py-2 text-xs font-bold hover:bg-[var(--amber-hover)] transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Scanning..." : "Run Security Scan"}
          </button>
        </div>
      </div>

      {/* Primary KPI & Security Gauge Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Posture Score Gauge Card */}
        <div className="lg:col-span-5 nx-card p-5 border border-[var(--border-dim)] bg-[var(--bg-card)] backdrop-blur-xl flex items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-5">
            <GaugeGauge value={computedScore} color={scoreGrade.color} />
            <div>
              <div className="eyebrow text-[var(--text-sub)]">Overall Security Health</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-3xl font-extrabold tracking-tight text-[var(--text)]">{computedScore}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wide border" style={{ color: scoreGrade.color, borderColor: `${scoreGrade.color}40`, backgroundColor: `${scoreGrade.color}15` }}>
                  Grade {scoreGrade.grade}
                </span>
              </div>
              <p className="text-[11px] font-medium mt-1 text-[var(--text-sub)] max-w-[190px]">
                {scoreGrade.label}
              </p>
            </div>
          </div>
          {unexpectedAdmins.length > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-[var(--crit)] bg-[var(--crit)]/10 px-2.5 py-1 rounded-full border border-[var(--crit)]/20">
              <ShieldAlert size={12} /> {unexpectedAdmins.length} Security Anomaly
            </div>
          )}
        </div>

        {/* 4 Mini KPI Cards */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="nx-card p-4 border border-[var(--border-dim)] bg-[var(--bg-card)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[var(--text-sub)] mb-2">
              <span className="eyebrow text-[10px]">Failed Logins (24h)</span>
              <AlertTriangle className="w-4 h-4 text-[var(--crit)]" />
            </div>
            <div className="text-2xl font-black text-[var(--crit)]">{data?.failedLogins24h ?? 0}</div>
            <div className="text-[10px] text-[var(--text-sub)] mt-1 font-medium">Authentication failures</div>
          </div>

          <div className="nx-card p-4 border border-[var(--border-dim)] bg-[var(--bg-card)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[var(--text-sub)] mb-2">
              <span className="eyebrow text-[10px]">CIS Benchmarks</span>
              <ShieldCheck className="w-4 h-4 text-[var(--ok)]" />
            </div>
            <div className="text-2xl font-black text-[var(--ok)]">{complianceRate}%</div>
            <div className="text-[10px] text-[var(--text-sub)] mt-1 font-medium">{passedComplianceCount} of {totalComplianceCount} rules passed</div>
          </div>

          <div className="nx-card p-4 border border-[var(--border-dim)] bg-[var(--bg-card)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[var(--text-sub)] mb-2">
              <span className="eyebrow text-[10px]">Open Listening Ports</span>
              <Radio className="w-4 h-4 text-[var(--amber)]" />
            </div>
            <div className="text-2xl font-black text-[var(--amber)]">{data?.openPorts.length ?? 0}</div>
            <div className="text-[10px] text-[var(--text-sub)] mt-1 font-medium">TCP/UDP endpoints</div>
          </div>

          <div className="nx-card p-4 border border-[var(--border-dim)] bg-[var(--bg-card)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[var(--text-sub)] mb-2">
              <span className="eyebrow text-[10px]">Privilege Audit</span>
              <Users className="w-4 h-4 text-[var(--teal)]" />
            </div>
            <div className="text-2xl font-black text-[var(--text)]">{data?.localAdmins.length ?? 0}</div>
            <div className="text-[10px] text-[var(--text-sub)] mt-1 font-medium">
              {unexpectedAdmins.length > 0 ? (
                <span className="text-[var(--crit)] font-bold">{unexpectedAdmins.length} Unexpected</span>
              ) : (
                <span className="text-[var(--ok)] font-medium">All accounts verified</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-dim)] pb-3">
        <div className="flex items-center gap-2 p-1 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-xl backdrop-blur-md">
          {(["Overview", "Compliance", "Events", "Ports", "Admins"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`mono text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${activeTab === tab ? "bg-[var(--amber-low)] text-[var(--amber)] shadow-sm font-bold" : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)]"}`}
            >
              {tab === "Overview" && <Activity size={14} />}
              {tab === "Compliance" && <ShieldCheck size={14} />}
              {tab === "Events" && <FileText size={14} />}
              {tab === "Ports" && <Radio size={14} />}
              {tab === "Admins" && <Users size={14} />}
              {tab === "Overview" ? "Security Posture" : tab === "Compliance" ? "CIS Benchmarks" : tab === "Events" ? "Security Events" : tab === "Ports" ? "Listening Ports" : "Local Administrators"}
            </button>
          ))}
        </div>

        {/* Tab-specific Search / Controls */}
        {activeTab === "Events" && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg p-1 text-[11px] mono">
              {(["All", "Critical", "Error", "Warning", "Information"] as LevelFilter[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-2.5 py-1 rounded ${levelFilter === lvl ? "bg-[var(--amber)] text-black font-bold" : "text-[var(--text-sub)] hover:text-[var(--text)]"}`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-sub)]" />
              <input
                type="text"
                placeholder="Search security logs..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="w-48 sm:w-60 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[var(--amber)] text-[var(--text)]"
              />
            </div>
          </div>
        )}

        {activeTab === "Ports" && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-sub)]" />
            <input
              type="text"
              placeholder="Filter ports or process..."
              value={portSearch}
              onChange={(e) => setPortSearch(e.target.value)}
              className="w-56 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[var(--amber)] text-[var(--text)]"
            />
          </div>
        )}

        {activeTab === "Compliance" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-sub)] font-medium">Category:</span>
            <select
              value={complianceCategory}
              onChange={(e) => setComplianceCategory(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
            >
              <option value="All">All Categories ({complianceChecks.length})</option>
              <option value="Identity">Identity & Access</option>
              <option value="Network">Network Security</option>
              <option value="Endpoint">Endpoint & System</option>
              <option value="Encryption">Encryption</option>
              <option value="Auditing">Audit & Event Logging</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: OVERVIEW & HARDENING */}
      {activeTab === "Overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Security Incidents Feed */}
          <div className="lg:col-span-7 space-y-5">
            <div className="nx-card p-5 border border-[var(--border-dim)] bg-[var(--bg-card)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-[var(--amber)]" />
                  <h3 className="font-bold text-sm text-[var(--text)] uppercase tracking-wider">Active Security Alerts</h3>
                </div>
                <span className="text-[11px] text-[var(--text-sub)] mono font-medium">
                  {unreviewedEventsCount} requiring review
                </span>
              </div>

              <div className="space-y-3">
                {data?.events.slice(0, 5).map((evt) => {
                  const isCritical = evt.level === "Critical" || evt.level === "Error";
                  return (
                    <div 
                      key={evt.id} 
                      onClick={() => setSelectedEvent(evt)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${isCritical ? "bg-[var(--crit)]/10 border-[var(--crit)]/30 hover:border-[var(--crit)]" : "bg-[var(--bg-surface)] border-[var(--border-dim)] hover:border-[var(--amber)]"}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${evt.level === "Critical" ? "bg-[var(--crit)] text-white" : evt.level === "Error" ? "bg-[var(--crit)]/20 text-[var(--crit)]" : evt.level === "Warning" ? "bg-[var(--amber-low)] text-[var(--amber)]" : "bg-[var(--teal)]/20 text-[var(--teal)]"}`}>
                            Event {evt.eventId} • {evt.level}
                          </span>
                          <span className="text-[11px] text-[var(--text-sub)] mono">{new Date(evt.timeCreated).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-[var(--text)] line-clamp-2 font-mono">{evt.message}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${evt.status === "Resolved" ? "bg-[var(--ok)]/15 text-[var(--ok)]" : evt.status === "Reviewed" ? "bg-[var(--teal)]/15 text-[var(--teal)]" : "bg-[var(--crit)]/15 text-[var(--crit)]"}`}>
                          {evt.status || "Unreviewed"}
                        </span>
                        <span className="text-[10px] text-[var(--amber)] font-medium hover:underline flex items-center gap-1">
                          Inspect <ArrowUpRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Hardening Actions */}
            <div className="nx-card p-5 border border-[var(--border-dim)] bg-[var(--bg-card)]">
              <h3 className="font-bold text-sm text-[var(--text)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap size={16} className="text-[var(--amber)]" /> Automated Security Hardening
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {complianceChecks.filter(c => !c.passed).slice(0, 4).map(c => (
                  <div key={c.id} className="p-3 rounded-xl border border-[var(--border-dim)] bg-[var(--bg-surface)] flex flex-col justify-between gap-2">
                    <div>
                      <div className="font-bold text-[var(--text)]">{c.title}</div>
                      <div className="text-[11px] text-[var(--text-sub)] mt-0.5">{c.recommendation}</div>
                    </div>
                    <button
                      onClick={() => handleToggleCompliance(c)}
                      className="w-full py-1.5 px-3 rounded-lg bg-[var(--amber)] text-black text-[11px] font-bold hover:bg-[var(--amber-hover)] transition-colors flex items-center justify-center gap-1"
                    >
                      <ShieldCheck size={13} /> Remediate ({c.id})
                    </button>
                  </div>
                ))}
                {complianceChecks.filter(c => !c.passed).length === 0 && (
                  <div className="col-span-2 p-4 text-center text-xs text-[var(--ok)] font-medium bg-[var(--ok)]/10 border border-[var(--ok)]/20 rounded-xl">
                    <CheckCircle2 size={18} className="mx-auto mb-1 text-[var(--ok)]" /> All CIS baseline compliance checks are currently passing!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column Audit Summary */}
          <div className="lg:col-span-5 space-y-5">
            {/* Privilege Security Box */}
            <div className="nx-card p-5 border border-[var(--border-dim)] bg-[var(--bg-card)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} className="text-[var(--teal)]" /> Local Admin Privilege Audit
                </h3>
                <span className="text-[11px] text-[var(--text-sub)] mono font-bold">{data?.localAdmins.length} Users</span>
              </div>

              <div className="space-y-2">
                {data?.localAdmins.map((adm) => (
                  <div key={adm.name} className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-dim)] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[var(--amber)] block">{adm.name}</span>
                      <span className="text-[10px] text-[var(--text-sub)]">{adm.principalSource}</span>
                    </div>
                    <button
                      onClick={() => handleToggleExpectedAdmin(adm)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${adm.expected ? "bg-[var(--ok)]/15 text-[var(--ok)] hover:bg-[var(--crit)]/15 hover:text-[var(--crit)]" : "bg-[var(--crit)]/15 text-[var(--crit)] hover:bg-[var(--ok)]/15 hover:text-[var(--ok)]"}`}
                      title="Click to toggle expected state"
                    >
                      {adm.expected ? "Expected" : "Unexpected"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Open Ports Warning */}
            <div className="nx-card p-5 border border-[var(--border-dim)] bg-[var(--bg-card)]">
              <h3 className="font-bold text-sm text-[var(--text)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Radio size={16} className="text-[var(--amber)]" /> Open Endpoint Services
              </h3>
              <div className="space-y-2 text-xs mono">
                {data?.openPorts.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-dim)]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--amber)]">:{p.localPort}</span>
                      <span className="text-[var(--text-sub)] text-[11px]">({p.protocol})</span>
                      <span className="text-[var(--text)] font-semibold truncate max-w-[120px]">{p.processName}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--teal)]/15 text-[var(--teal)] font-bold">{p.state}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CIS COMPLIANCE BENCHMARKS */}
      {activeTab === "Compliance" && (
        <div className="nx-card overflow-hidden border border-[var(--border-dim)] bg-[var(--bg-card)] shadow-xl">
          <div className="p-4 border-b border-[var(--border-dim)] bg-[var(--bg-surface)] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[var(--text)]">CIS Benchmark Compliance Matrix</h3>
              <p className="text-[11px] text-[var(--text-sub)]">Hardening checks based on CIS Microsoft Windows Server 2022 Benchmark v1.0</p>
            </div>
            <div className="text-xs font-mono">
              Passed: <span className="text-[var(--ok)] font-bold">{passedComplianceCount}</span> / {totalComplianceCount} ({complianceRate}%)
            </div>
          </div>

          <div className="divide-y divide-[var(--border-dim)]">
            {filteredCompliance.map((c) => (
              <div key={c.id} className="p-4 hover:bg-[var(--bg-surface)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-dim)] text-[var(--text-sub)] mono">
                      {c.id}
                    </span>
                    <span className="text-xs font-bold text-[var(--text)]">{c.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${c.severity === "Critical" ? "bg-[var(--crit)]/20 text-[var(--crit)]" : c.severity === "High" ? "bg-[var(--amber-low)] text-[var(--amber)]" : "bg-[var(--teal)]/20 text-[var(--teal)]"}`}>
                      {c.severity}
                    </span>
                    <span className="text-[10px] text-[var(--text-sub)] uppercase tracking-wider font-semibold">
                      [{c.category}]
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-sub)]">{c.description}</p>
                  <p className="text-[11px] text-[var(--amber)] font-mono">Recommendation: {c.recommendation}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${c.passed ? "bg-[var(--ok)]/15 text-[var(--ok)]" : "bg-[var(--crit)]/15 text-[var(--crit)]"}`}>
                    {c.passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {c.passed ? "PASS" : "FAIL"}
                  </span>

                  <button
                    onClick={() => handleToggleCompliance(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${c.passed ? "border border-[var(--border-dim)] bg-[var(--bg-surface)] text-[var(--text-sub)] hover:text-[var(--crit)] hover:border-[var(--crit)]" : "bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)]"}`}
                  >
                    {c.passed ? "Mark Failed" : "Enforce Policy"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY EVENTS LOG */}
      {activeTab === "Events" && (
        <div className="nx-card overflow-hidden border border-[var(--border-dim)] bg-[var(--bg-card)] shadow-xl flex flex-col h-[calc(100vh-320px)] min-h-[450px]">
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[var(--bg-surface)] z-10 border-b border-[var(--border-dim)] text-left eyebrow">
                <tr>
                  <th className="px-4 py-3">Event ID</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">User / Account</th>
                  <th className="px-4 py-3">Log Message</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="mono divide-y divide-[var(--border-dim)]">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[var(--text-sub)]">
                      No security events match the current search or severity filter.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((e) => (
                    <tr key={e.id} className="hover:bg-[var(--bg-surface)] transition-colors cursor-pointer" onClick={() => setSelectedEvent(e)}>
                      <td className="px-4 py-3 text-[var(--amber)] font-bold">{e.eventId}</td>
                      <td className="px-4 py-3 text-[var(--text-sub)]">{new Date(e.timeCreated).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${e.level === "Critical" ? "bg-[var(--crit)] text-white" : e.level === "Error" ? "bg-[var(--crit)]/20 text-[var(--crit)]" : e.level === "Warning" ? "bg-[var(--amber-low)] text-[var(--amber)]" : "bg-[var(--teal)]/20 text-[var(--teal)]"}`}>
                          {e.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text)] font-medium">{e.user || "SYSTEM"}</td>
                      <td className="px-4 py-3 text-[var(--text-sub)] truncate max-w-[320px]" title={e.message}>{e.message}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${e.status === "Resolved" ? "bg-[var(--ok)]/15 text-[var(--ok)]" : e.status === "Reviewed" ? "bg-[var(--teal)]/15 text-[var(--teal)]" : "bg-[var(--crit)]/15 text-[var(--crit)]"}`}>
                          {e.status || "Unreviewed"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateEventStatus(e.id, "Reviewed")}
                            className="p-1 rounded hover:bg-[var(--bg-surface)] text-[var(--text-sub)] hover:text-[var(--amber)]"
                            title="Mark Reviewed"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleUpdateEventStatus(e.id, "Resolved")}
                            className="p-1 rounded hover:bg-[var(--bg-surface)] text-[var(--text-sub)] hover:text-[var(--ok)]"
                            title="Mark Resolved"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LISTENING PORTS */}
      {activeTab === "Ports" && (
        <div className="nx-card overflow-hidden border border-[var(--border-dim)] bg-[var(--bg-card)] shadow-xl">
          <table className="w-full text-xs">
            <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-dim)] text-left eyebrow">
              <tr>
                <th className="px-5 py-3">Local Port</th>
                <th className="px-5 py-3">Protocol</th>
                <th className="px-5 py-3">Process Name</th>
                <th className="px-5 py-3">PID</th>
                <th className="px-5 py-3">State</th>
                <th className="px-5 py-3">Risk Level</th>
              </tr>
            </thead>
            <tbody className="mono divide-y divide-[var(--border-dim)]">
              {filteredPorts.map((p, i) => {
                const isSensitive = [3389, 445, 5985, 5986, 22, 21].includes(p.localPort);
                return (
                  <tr key={i} className="hover:bg-[var(--bg-surface)] transition-colors">
                    <td className="px-5 py-3.5 font-bold text-[var(--amber)]">:{p.localPort}</td>
                    <td className="px-5 py-3.5 text-[var(--text-sub)]">{p.protocol}</td>
                    <td className="px-5 py-3.5 text-[var(--text)] font-semibold">{p.processName}</td>
                    <td className="px-5 py-3.5 text-[var(--text-sub)]">{p.pid || 4}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-[var(--teal)]/15 text-[var(--teal)] font-bold text-[10px]">
                        {p.state}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {isSensitive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--amber-low)] text-[var(--amber)] flex items-center gap-1 w-fit">
                          <AlertTriangle size={10} /> Sensitive Management Port
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--ok)]/15 text-[var(--ok)] w-fit block">
                          Low Risk
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: LOCAL ADMINISTRATORS */}
      {activeTab === "Admins" && (
        <div className="nx-card overflow-hidden border border-[var(--border-dim)] bg-[var(--bg-card)] shadow-xl">
          <table className="w-full text-xs">
            <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-dim)] text-left eyebrow">
              <tr>
                <th className="px-5 py-3">Account Name</th>
                <th className="px-5 py-3">Principal Source</th>
                <th className="px-5 py-3">Compliance Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="mono divide-y divide-[var(--border-dim)]">
              {data?.localAdmins.map((adm) => (
                <tr key={adm.name} className="hover:bg-[var(--bg-surface)] transition-colors">
                  <td className="px-5 py-4 font-bold text-[var(--amber)] flex items-center gap-2">
                    <Users size={16} className="text-[var(--amber)]" /> {adm.name}
                  </td>
                  <td className="px-5 py-4 text-[var(--text-sub)]">{adm.principalSource}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${adm.expected ? "bg-[var(--ok)]/15 text-[var(--ok)]" : "bg-[var(--crit)]/15 text-[var(--crit)]"}`}>
                      {adm.expected ? "Verified / Expected" : "Unexpected Privilege Anomaly"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleToggleExpectedAdmin(adm)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${adm.expected ? "border border-[var(--border-dim)] text-[var(--text-sub)] hover:text-[var(--crit)]" : "bg-[var(--amber)] text-black hover:bg-[var(--amber-hover)]"}`}
                    >
                      {adm.expected ? "Mark Unexpected" : "Verify Account"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EVENT INSPECTOR MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-[var(--amber)]" />
                <h3 className="text-sm font-bold text-[var(--text)]">Event {selectedEvent.eventId} Audit Details</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1 rounded-full text-[var(--text-sub)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs mono">
              <div>
                <span className="text-[var(--text-sub)] text-[10px] uppercase font-bold block mb-1">Time Created</span>
                <span className="text-[var(--text)] bg-[var(--bg-surface)] p-2 rounded-lg block border border-[var(--border-dim)]">
                  {new Date(selectedEvent.timeCreated).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[var(--text-sub)] text-[10px] uppercase font-bold block mb-1">Level</span>
                  <span className="text-[var(--amber)] font-bold">{selectedEvent.level}</span>
                </div>
                <div>
                  <span className="text-[var(--text-sub)] text-[10px] uppercase font-bold block mb-1">User</span>
                  <span className="text-[var(--text)] font-semibold">{selectedEvent.user || "SYSTEM"}</span>
                </div>
              </div>

              <div>
                <span className="text-[var(--text-sub)] text-[10px] uppercase font-bold block mb-1">Full Log Message</span>
                <p className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-dim)] text-[var(--text)] leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
                  {selectedEvent.message}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border-c)] bg-[var(--bg-surface)] flex justify-between items-center">
              <span className="text-[11px] text-[var(--text-sub)]">
                Status: <strong className="text-[var(--amber)]">{selectedEvent.status || "Unreviewed"}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateEventStatus(selectedEvent.id, "Reviewed")}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border-dim)] text-xs font-semibold text-[var(--text)] hover:border-[var(--amber)]"
                >
                  Mark Reviewed
                </button>
                <button
                  onClick={() => handleUpdateEventStatus(selectedEvent.id, "Resolved")}
                  className="px-4 py-1.5 rounded-xl bg-[var(--amber)] text-black text-xs font-bold hover:bg-[var(--amber-hover)]"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

{/* SVG GAUGE COMPONENT */}
function GaugeGauge({ value, color }: { value: number; color: string }) {
  const r = 48, c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg width={120} height={120} viewBox="0 0 120 120" className="shrink-0">
      <circle cx={60} cy={60} r={r} stroke="var(--border-c)" strokeWidth={8} fill="none" />
      <circle 
        cx={60} 
        cy={60} 
        r={r} 
        stroke={color} 
        strokeWidth={8} 
        strokeLinecap="round" 
        fill="none" 
        strokeDasharray={c} 
        strokeDashoffset={off} 
        transform="rotate(-90 60 60)" 
        className="transition-all duration-700 ease-out"
      />
      <text x={60} y={64} textAnchor="middle" fill={color} fontSize="24" fontFamily="var(--font-display)" fontWeight={800}>{value}</text>
      <text x={60} y={78} textAnchor="middle" fill="var(--text-sub)" fontSize="8" letterSpacing="1.5" fontWeight={700}>SCORE</text>
    </svg>
  );
}
