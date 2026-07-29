import { useState, useEffect } from "react";
import { Bell, Plus, Trash2, Power, PowerOff, Save, X } from "lucide-react";
import { getApiUrl } from "@/lib/backend";

interface AlertRule {
  id: number;
  name: string;
  metric: string;
  comparison: string;
  threshold: number;
  durationSeconds: number;
  serverIp: string;
  channel: string;
  enabled: boolean;
  lastFiredAt: string | null;
  createdAt: string;
}

export function AlertRulesManager() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [metric, setMetric] = useState("cpu");
  const [comparison, setComparison] = useState("gt");
  const [threshold, setThreshold] = useState(90);
  const [duration, setDuration] = useState(60);
  const [serverIp, setServerIp] = useState("*");
  const [channel, setChannel] = useState("notification");

  const fetchRules = async () => {
    try {
      const res = await fetch(getApiUrl("/alert-rules"));
      if (res.ok) setRules(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const res = await fetch(getApiUrl("/alert-rules"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, metric, comparison, threshold, durationSeconds: duration, serverIp, channel, enabled: true }),
    });
    if (res.ok) {
      setShowForm(false);
      setName("");
      fetchRules();
    }
  };

  const toggleRule = async (rule: AlertRule) => {
    await fetch(getApiUrl(`/alert-rules/${rule.id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rule, enabled: !rule.enabled }),
    });
    fetchRules();
  };

  const deleteRule = async (id: number) => {
    await fetch(getApiUrl(`/alert-rules/${id}`), { method: "DELETE" });
    fetchRules();
  };

  const metricLabel = (m: string) => ({ cpu: "CPU %", ram: "RAM %", disk: "Disk %", status: "Status" }[m] || m);
  const compLabel = (c: string) => ({ gt: ">", lt: "<", eq: "=" }[c] || c);

  return (
    <section className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--border-c)] pb-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <Bell size={20} className="text-[var(--amber)]" /> Alert Rules Engine
          </h3>
          <p className="text-xs text-[var(--text-sub)] mt-0.5">
            Trigger notifications when server metrics cross thresholds. Supports Discord, Slack, and custom webhooks.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-[var(--amber)] text-black px-3 py-1.5 rounded-xl text-xs font-bold hover:brightness-110 transition-all cursor-pointer"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "New Rule"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-[var(--bg-void)] rounded-xl border border-[var(--border-c)]">
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-sub)] uppercase tracking-wider mb-1">Rule Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="High CPU Alert"
              className="w-full bg-[var(--bg-card)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-sub)] uppercase tracking-wider mb-1">Metric</label>
            <select value={metric} onChange={e => setMetric(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none">
              <option value="cpu">CPU %</option>
              <option value="ram">RAM %</option>
              <option value="disk">Disk %</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-sub)] uppercase tracking-wider mb-1">Condition</label>
            <div className="flex gap-2">
              <select value={comparison} onChange={e => setComparison(e.target.value)}
                className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-lg px-2 py-2 text-xs text-[var(--text)] focus:outline-none">
                <option value="gt">Greater than</option>
                <option value="lt">Less than</option>
                <option value="eq">Equals</option>
              </select>
              <input type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))}
                className="w-20 bg-[var(--bg-card)] border border-[var(--border-c)] rounded-lg px-2 py-2 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-sub)] uppercase tracking-wider mb-1">Server Target</label>
            <input value={serverIp} onChange={e => setServerIp(e.target.value)} placeholder="* (all servers)"
              className="w-full bg-[var(--bg-card)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-sub)] uppercase tracking-wider mb-1">Cooldown (seconds)</label>
            <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-sub)] uppercase tracking-wider mb-1">Channel</label>
            <select value={channel} onChange={e => setChannel(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none">
              <option value="notification">In-App Notification</option>
              <option value="discord">Discord Webhook</option>
              <option value="slack">Slack Webhook</option>
              <option value="webhook">Custom Webhook</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
            <button onClick={handleCreate}
              className="flex items-center gap-1.5 bg-[var(--amber)] text-black px-4 py-2 rounded-xl text-xs font-bold hover:brightness-110 transition-all cursor-pointer">
              <Save size={14} /> Create Alert Rule
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-[var(--text-sub)]">Loading rules...</div>
      ) : rules.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--text-sub)]">
          No alert rules configured. Click "New Rule" to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => (
            <div key={rule.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${rule.enabled ? "bg-[var(--bg-card)] border-[var(--border-c)]" : "bg-[var(--bg-void)] border-[var(--border-dim)] opacity-60"}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${rule.enabled ? "bg-emerald-400" : "bg-[var(--text-ghost)]"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)] truncate">{rule.name}</p>
                  <p className="text-[11px] text-[var(--text-sub)] font-mono">
                    {metricLabel(rule.metric)} {compLabel(rule.comparison)} {rule.threshold}% · {rule.serverIp === "*" ? "All Servers" : rule.serverIp} · {rule.channel} · {rule.durationSeconds}s cooldown
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {rule.lastFiredAt && (
                  <span className="text-[10px] text-[var(--warn)] font-mono hidden sm:inline">
                    Fired {new Date(rule.lastFiredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                <button onClick={() => toggleRule(rule)} title={rule.enabled ? "Disable" : "Enable"}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-void)] text-[var(--text-sub)] hover:text-[var(--text)] transition-colors cursor-pointer">
                  {rule.enabled ? <Power size={14} className="text-emerald-400" /> : <PowerOff size={14} />}
                </button>
                <button onClick={() => deleteRule(rule.id)} title="Delete"
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[var(--text-sub)] hover:text-rose-400 transition-colors cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
