import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Shield,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Activity,
  BarChart3,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { getApiUrl } from "@/lib/backend";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Trail - NEXUS" },
      { name: "description", content: "View system audit logs, verify integrity, and manage retention." },
    ],
  }),
  component: AuditPage,
});

// Types
interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string | null;
  httpMethod: string;
  requestPath: string;
  statusCode: number;
  ipAddress: string;
  userAgent: string;
  durationMs: number;
  requestBody: string | null;
  responseSummary: string | null;
  serverContext: string | null;
  previousHash: string | null;
  hash: string;
}

interface AuditQueryResult {
  items: AuditLogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface IntegrityResult {
  isValid: boolean;
  totalChecked: number;
  validEntries: number;
  invalidEntries: number;
  firstInvalidId: string | null;
  firstInvalidTimestamp: string | null;
  message: string;
}

interface AuditStats {
  totalEntries: number;
  dailyCounts: { date: string; count: number }[];
  topUsers: { name: string; count: number }[];
  topResources: { name: string; count: number }[];
  topActions: { name: string; count: number }[];
}

// API functions
async function fetchAuditLogs(params: Record<string, string>): Promise<AuditQueryResult | null> {
  try {
    const queryString = new URLSearchParams(params).toString();
    const res = await fetch(getApiUrl(`/audit/logs?${queryString}`));
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch audit logs", e);
  }
  return null;
}

async function fetchAuditStats(): Promise<AuditStats | null> {
  try {
    const res = await fetch(getApiUrl("/audit/stats"));
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to fetch audit stats", e);
  }
  return null;
}

async function verifyIntegrity(start?: string, end?: string): Promise<IntegrityResult | null> {
  try {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const res = await fetch(getApiUrl(`/audit/integrity?${params.toString()}`));
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Failed to verify integrity", e);
  }
  return null;
}

async function purgeAuditLogs(retentionDays: number): Promise<boolean> {
  try {
    const res = await fetch(getApiUrl("/audit/purge"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retentionDays }),
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to purge audit logs", e);
    return false;
  }
}

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<IntegrityResult | null>(null);
  const [integrityLoading, setIntegrityLoading] = useState(false);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  // Filters
  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {
      page: page.toString(),
      pageSize: pageSize.toString(),
    };
    if (userFilter) params.userName = userFilter;
    if (actionFilter) params.action = actionFilter;
    if (resourceFilter) params.resource = resourceFilter;
    if (methodFilter) params.httpMethod = methodFilter;
    if (startDate) params.startDate = new Date(startDate).toISOString();
    if (endDate) params.endDate = new Date(endDate).toISOString();

    const result = await fetchAuditLogs(params);
    if (result) {
      setLogs(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    }
    setLoading(false);
  }, [page, pageSize, userFilter, actionFilter, resourceFilter, methodFilter, startDate, endDate]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const result = await fetchAuditStats();
    setStats(result);
    setStatsLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleVerifyIntegrity = async () => {
    setIntegrityLoading(true);
    const result = await verifyIntegrity(
      startDate ? new Date(startDate).toISOString() : undefined,
      endDate ? new Date(endDate).toISOString() : undefined
    );
    setIntegrityResult(result);
    setIntegrityLoading(false);
  };

  const handlePurge = async () => {
    if (!confirm("Are you sure you want to purge audit logs older than 90 days?")) return;
    await purgeAuditLogs(90);
    fetchLogs();
    loadStats();
  };

  const clearFilters = () => {
    setUserFilter("");
    setActionFilter("");
    setResourceFilter("");
    setMethodFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasFilters = useMemo(
    () => !!(userFilter || actionFilter || resourceFilter || methodFilter || startDate || endDate),
    [userFilter, actionFilter, resourceFilter, methodFilter, startDate, endDate]
  );

  const methodColor = (method: string) => {
    switch (method) {
      case "GET": return "var(--teal)";
      case "POST": return "var(--ok)";
      case "PUT": return "var(--warn)";
      case "DELETE": return "var(--crit)";
      case "PATCH": return "var(--amber)";
      default: return "var(--text-sub)";
    }
  };

  const statusColor = (code: number) => {
    if (code >= 200 && code < 300) return "var(--ok)";
    if (code >= 400 && code < 500) return "var(--warn)";
    if (code >= 500) return "var(--crit)";
    return "var(--text-sub)";
  };

  return (
    <PageWrapper>
      <PageHeader
        eyebrow="Security"
        title="Audit Trail"
        subtitle={`${totalCount} total events tracked`}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={handlePurge}
              className="flex items-center gap-1.5 rounded border border-[var(--border-dim)] bg-[var(--bg-card)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-sub)] hover:text-[var(--crit)] hover:border-[var(--crit)]"
            >
              <Trash2 size={12} /> Purge
            </button>
            <button
              onClick={handleVerifyIntegrity}
              disabled={integrityLoading}
              className="flex items-center gap-1.5 rounded border border-[var(--amber)]/30 bg-[var(--amber-low)] px-3 py-1.5 text-[11px] font-medium text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black disabled:opacity-50"
            >
              {integrityLoading ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
              Verify Integrity
            </button>
          </div>
        }
      />

      {/* Integrity result banner */}
      {integrityResult && (
        <div
          className={`mb-4 flex items-center gap-3 rounded-md border p-3 text-[12px] ${
            integrityResult.isValid
              ? "border-[var(--ok)]/30 bg-[var(--ok)]/5 text-[var(--ok)]"
              : "border-[var(--crit)]/30 bg-[var(--crit)]/5 text-[var(--crit)]"
          }`}
        >
          {integrityResult.isValid ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span className="font-medium">{integrityResult.message}</span>
          <span className="mono ml-auto text-[10px] opacity-70">
            {integrityResult.totalChecked} entries checked | {integrityResult.validEntries} valid | {integrityResult.invalidEntries} invalid
          </span>
          <button
            onClick={() => setIntegrityResult(null)}
            className="ml-2 text-[var(--text-sub)] hover:text-[var(--text)]"
          >
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* Stats Panel */}
      {stats && (
        <div className="mb-4 grid grid-cols-4 gap-3">
          <div className="nx-card p-3">
            <div className="flex items-center gap-2 text-[var(--text-sub)]">
              <Activity size={14} />
              <span className="eyebrow text-[10px]">Total Events</span>
            </div>
            <div className="mt-1 text-[20px] font-bold text-[var(--text)]">{stats.totalEntries.toLocaleString()}</div>
          </div>
          <div className="nx-card p-3">
            <div className="flex items-center gap-2 text-[var(--text-sub)]">
              <BarChart3 size={14} />
              <span className="eyebrow text-[10px]">Today</span>
            </div>
            <div className="mt-1 text-[20px] font-bold text-[var(--text)]">
              {stats.dailyCounts.length > 0 ? stats.dailyCounts[stats.dailyCounts.length - 1].count : 0}
            </div>
          </div>
          <div className="nx-card p-3">
            <div className="flex items-center gap-2 text-[var(--text-sub)]">
              <User size={14} />
              <span className="eyebrow text-[10px]">Top User (7d)</span>
            </div>
            <div className="mono mt-1 truncate text-[13px] font-medium text-[var(--text)]">
              {stats.topUsers[0]?.name || "N/A"}
            </div>
            <div className="mono text-[10px] text-[var(--text-sub)]">{stats.topUsers[0]?.count || 0} events</div>
          </div>
          <div className="nx-card p-3">
            <div className="flex items-center gap-2 text-[var(--text-sub)]">
              <Calendar size={14} />
              <span className="eyebrow text-[10px]">7-Day Total</span>
            </div>
            <div className="mt-1 text-[20px] font-bold text-[var(--text)]">
              {stats.dailyCounts.reduce((acc, d) => acc + d.count, 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Daily chart mini-bar */}
      {stats && stats.dailyCounts.length > 0 && (
        <div className="nx-card mb-4 p-3">
          <div className="eyebrow pb-2">Events per Day (last 7 days)</div>
          <div className="flex items-end gap-1" style={{ height: 48 }}>
            {stats.dailyCounts.map((d) => {
              const max = Math.max(...stats.dailyCounts.map((x) => x.count), 1);
              const pct = (d.count / max) * 100;
              return (
                <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.count}`}>
                  <div
                    className="w-full rounded-sm bg-[var(--amber)]/60 transition-all group-hover:bg-[var(--amber)]"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-[var(--text-dim)]">
                    {d.date.slice(5)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5" />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] p-2">
        <div className="flex items-center gap-1.5 rounded bg-[var(--bg-card)] px-2 py-1.5 border border-[var(--border-dim)]">
          <Search size={12} className="text-[var(--text-sub)]" />
          <input
            value={userFilter}
            onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
            placeholder="User..."
            className="w-24 bg-transparent text-[11px] outline-none placeholder:text-[var(--text-dim)]"
          />
        </div>
        <input
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          placeholder="Action..."
          className="rounded border border-[var(--border-dim)] bg-[var(--bg-card)] px-2 py-1.5 text-[11px] outline-none placeholder:text-[var(--text-dim)] w-28"
        />
        <input
          value={resourceFilter}
          onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
          placeholder="Resource..."
          className="rounded border border-[var(--border-dim)] bg-[var(--bg-card)] px-2 py-1.5 text-[11px] outline-none placeholder:text-[var(--text-dim)] w-28"
        />
        <select
          value={methodFilter}
          onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
          className="rounded border border-[var(--border-dim)] bg-[var(--bg-card)] px-2 py-1.5 text-[11px] outline-none text-[var(--text)]"
        >
          <option value="">All Methods</option>
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="rounded border border-[var(--border-dim)] bg-[var(--bg-card)] px-2 py-1.5 text-[11px] outline-none text-[var(--text)]"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="rounded border border-[var(--border-dim)] bg-[var(--bg-card)] px-2 py-1.5 text-[11px] outline-none text-[var(--text)]"
        />
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="mono text-[10px] uppercase tracking-[0.15em] text-[var(--amber)] hover:underline"
          >
            Clear
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 rounded bg-[var(--bg-card)] border border-[var(--border-dim)] px-3 py-1.5 text-[11px] text-[var(--text)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Audit table */}
      <div className="nx-card overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center gap-2 p-8 text-[13px] text-[var(--text-sub)]">
            <Loader2 size={14} className="animate-spin" /> Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Shield size={32} className="mx-auto mb-3 text-[var(--text-dim)]" />
            <div className="text-[14px] text-[var(--text)]">No audit events found</div>
            <div className="mt-1 text-[12px] text-[var(--text-sub)]">
              {hasFilters ? "Try adjusting your filters." : "Audit events will appear as authenticated users interact with the API."}
            </div>
          </div>
        ) : (
          <div className="max-h-[55vh] overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-[var(--bg-card)] z-10">
                <tr className="eyebrow border-b border-[var(--border-c)] text-left">
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Action</th>
                  <th className="px-2 py-2">Resource</th>
                  <th className="px-2 py-2">Method</th>
                  <th className="px-2 py-2">Path</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Duration</th>
                  <th className="px-2 py-2">IP</th>
                </tr>
              </thead>
              <tbody className="mono">
                {logs.map((entry) => {
                  const isSel = selected?.id === entry.id;
                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setSelected(isSel ? null : entry)}
                      className={`cursor-pointer border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] ${
                        isSel ? "bg-[var(--amber-low)]" : ""
                      }`}
                    >
                      <td className="px-3 py-1.5 text-[var(--text-sub)] whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="px-2 py-1.5 text-[var(--text)]">{entry.userName || entry.userId}</td>
                      <td className="px-2 py-1.5 text-[var(--amber)]">{entry.action}</td>
                      <td className="px-2 py-1.5 text-[var(--text-sub)]">{entry.resource}</td>
                      <td className="px-2 py-1.5">
                        <span style={{ color: methodColor(entry.httpMethod) }}>{entry.httpMethod}</span>
                      </td>
                      <td className="px-2 py-1.5 max-w-[200px] truncate text-[var(--text-sub)]">{entry.requestPath}</td>
                      <td className="px-2 py-1.5">
                        <span style={{ color: statusColor(entry.statusCode) }}>{entry.statusCode}</span>
                      </td>
                      <td className="px-2 py-1.5 text-[var(--text-sub)]">{entry.durationMs}ms</td>
                      <td className="px-2 py-1.5 text-[var(--text-sub)]">{entry.ipAddress}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <div className="mono text-[10px] text-[var(--text-sub)]">
            Page {page} of {totalPages} ({totalCount} total)
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded border border-[var(--border-dim)] bg-[var(--bg-card)] p-1.5 text-[var(--text-sub)] hover:text-[var(--text)] disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded border border-[var(--border-dim)] bg-[var(--bg-card)] p-1.5 text-[var(--text-sub)] hover:text-[var(--text)] disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="nx-card mt-4 p-4">
          <div className="flex items-center justify-between pb-2">
            <div className="eyebrow">Audit Entry Detail</div>
            <button onClick={() => setSelected(null)} className="text-[var(--text-sub)] hover:text-[var(--text)]">
              <XCircle size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
            <div><span className="text-[var(--text-sub)]">ID:</span> <span className="mono text-[var(--text)]">{selected.id}</span></div>
            <div><span className="text-[var(--text-sub)]">Timestamp:</span> <span className="text-[var(--text)]">{new Date(selected.timestamp).toLocaleString()}</span></div>
            <div><span className="text-[var(--text-sub)]">User:</span> <span className="text-[var(--text)]">{selected.userName} ({selected.userId})</span></div>
            <div><span className="text-[var(--text-sub)]">Action:</span> <span className="text-[var(--amber)]">{selected.action}</span></div>
            <div><span className="text-[var(--text-sub)]">Resource:</span> <span className="text-[var(--text)]">{selected.resource}</span></div>
            <div><span className="text-[var(--text-sub)]">Resource ID:</span> <span className="text-[var(--text)]">{selected.resourceId || "N/A"}</span></div>
            <div><span className="text-[var(--text-sub)]">Method:</span> <span style={{ color: methodColor(selected.httpMethod) }}>{selected.httpMethod}</span></div>
            <div><span className="text-[var(--text-sub)]">Status:</span> <span style={{ color: statusColor(selected.statusCode) }}>{selected.statusCode}</span></div>
            <div><span className="text-[var(--text-sub)]">Duration:</span> <span className="text-[var(--text)]">{selected.durationMs}ms</span></div>
            <div><span className="text-[var(--text-sub)]">IP:</span> <span className="text-[var(--text)]">{selected.ipAddress}</span></div>
            <div className="col-span-2"><span className="text-[var(--text-sub)]">Path:</span> <span className="mono text-[var(--text)]">{selected.requestPath}</span></div>
            <div className="col-span-2"><span className="text-[var(--text-sub)]">User Agent:</span> <span className="mono text-[10px] text-[var(--text-sub)]">{selected.userAgent}</span></div>
            {selected.serverContext && (
              <div className="col-span-2"><span className="text-[var(--text-sub)]">Server Context:</span> <span className="text-[var(--text)]">{selected.serverContext}</span></div>
            )}
          </div>
          {selected.requestBody && (
            <div className="mt-3">
              <div className="eyebrow pb-1">Request Body (Sanitized)</div>
              <pre className="mono max-h-32 overflow-auto rounded border border-[var(--border-c)] bg-[var(--bg-void)] p-2 text-[10px] text-[var(--text-sub)]">
                {selected.requestBody}
              </pre>
            </div>
          )}
          <div className="mt-3 flex items-center gap-3 border-t border-[var(--border-dim)] pt-2">
            <div className="mono text-[9px] text-[var(--text-dim)]">
              <AlertTriangle size={10} className="inline mr-1" />
              Hash: {selected.hash}
            </div>
            {selected.previousHash && (
              <div className="mono text-[9px] text-[var(--text-dim)]">
                Prev: {selected.previousHash.slice(0, 16)}...
              </div>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
