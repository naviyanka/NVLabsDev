import React, { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/backend";
import { toast } from "sonner";
import { Activity, Terminal, RefreshCw, StopCircle, CheckCircle, XCircle } from "lucide-react";

type TabType = "All" | "Running" | "Completed/Failed";

export function BackgroundJobsView() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [logs, setLogs] = useState<string>("");
  const [logStatus, setLogStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabType>("All");

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem("nexus_token");
      const res = await fetch(getApiUrl("/jobs"), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const id = setInterval(fetchJobs, 3000);
    return () => clearInterval(id);
  }, []);

  const fetchLogs = async (id: number) => {
    try {
      const token = localStorage.getItem("nexus_token");
      const res = await fetch(getApiUrl(`/jobs/${id}/logs`), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.output);
        setLogStatus(data.status);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedJobId) {
      fetchLogs(selectedJobId);
      const id = setInterval(() => fetchLogs(selectedJobId), 2000);
      return () => clearInterval(id);
    }
  }, [selectedJobId]);

  const stopJob = async (id: number) => {
    const token = localStorage.getItem("nexus_token");
    const res = await fetch(getApiUrl(`/jobs/${id}/stop`), { method: "POST", headers: { "Authorization": `Bearer ${token}` }});
    if (res.ok) {
      toast.success("Stop command sent");
      fetchJobs();
    }
  };

  const retryJob = async (id: number) => {
    const token = localStorage.getItem("nexus_token");
    const res = await fetch(getApiUrl(`/jobs/${id}/retry`), { method: "POST", headers: { "Authorization": `Bearer ${token}` }});
    if (res.ok) {
      toast.success("Retry command sent");
      fetchJobs();
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (activeTab === "All") return true;
    if (activeTab === "Running") return job.status === "Running";
    if (activeTab === "Completed/Failed") return job.status === "Completed" || job.status === "Failed" || job.status === "Stopped";
    return true;
  });

  return (
    <section className="bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
      
      <div className="p-6 border-b border-[var(--border-c)]">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text)]">
              <Activity size={20} className="text-blue-500" />
              Background Jobs
            </h3>
            <p className="text-sm text-[var(--text-sub)] mt-1">
              Monitor and manage background tasks running across all plugins.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-[var(--bg-card)] p-1 rounded-lg w-max border border-[var(--border-c)]">
            {(["All", "Running", "Completed/Failed"] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab 
                    ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" 
                    : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] border border-transparent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-sm text-[var(--text-sub)]">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-sm text-[var(--text-sub)]">No background jobs found for this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-c)] text-[var(--text-sub)]">
                  <th className="pb-2 font-medium px-2">ID</th>
                  <th className="pb-2 font-medium px-2">Plugin</th>
                  <th className="pb-2 font-medium px-2">Target IP</th>
                  <th className="pb-2 font-medium px-2">Status</th>
                  <th className="pb-2 font-medium px-2">Started</th>
                  <th className="pb-2 font-medium px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-c)] text-[var(--text)]">
                {filteredJobs.map(job => (
                  <tr key={job.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-2 font-mono text-xs">{job.id}</td>
                    <td className="py-3 px-2 font-medium">{job.pluginId}</td>
                    <td className="py-3 px-2">{job.serverIp}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${job.status === "Running" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : 
                          job.status === "Completed" ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                          job.status === "Failed" ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                          "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}
                      >
                        {job.status === "Running" && <RefreshCw size={12} className="animate-spin" />}
                        {job.status === "Completed" && <CheckCircle size={12} />}
                        {job.status === "Failed" && <XCircle size={12} />}
                        {job.status === "Stopped" && <StopCircle size={12} />}
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-xs text-[var(--text-sub)]">
                      {new Date(job.startTime).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setSelectedJobId(job.id)}
                          className="px-3 py-1.5 rounded bg-[var(--bg-card)] border border-[var(--border-c)] hover:bg-[var(--bg-hover)] text-xs font-medium"
                        >
                          View Logs
                        </button>
                        {job.status === "Running" && (
                          <button 
                            onClick={() => stopJob(job.id)}
                            className="px-3 py-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-medium border border-red-500/20"
                          >
                            Stop
                          </button>
                        )}
                        {(job.status === "Failed" || job.status === "Stopped") && (
                          <button 
                            onClick={() => retryJob(job.id)}
                            className="px-3 py-1.5 rounded bg-[var(--amber-low)] text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black border border-[var(--amber)]/20 text-xs font-medium"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-[var(--border-c)] flex justify-between items-center bg-[var(--bg-card)] rounded-t-xl">
              <h3 className="font-bold flex items-center gap-2">
                <Terminal size={18} className="text-blue-500" /> 
                Job Logs (ID: {selectedJobId}) - {logStatus}
              </h3>
              <button 
                onClick={() => setSelectedJobId(null)}
                className="p-1 hover:bg-[var(--bg-hover)] rounded-md text-[var(--text-sub)] hover:text-[var(--text)] transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto font-mono text-sm whitespace-pre-wrap bg-[#050508] text-[#94a3b8] rounded-b-xl flex-1">
              {logs || "No logs available."}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
