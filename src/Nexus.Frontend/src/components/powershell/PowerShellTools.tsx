import { useState, useMemo } from "react";
import { X, Search, Copy, Check, Play, Plus, BookOpen, Code, Terminal, Save, Trash2, Sliders, Shield, Sparkles, FileCode } from "lucide-react";
import { toast } from "sonner";

export interface CustomScript {
  id: string;
  name: string;
  category: string;
  description: string;
  command: string;
}

const DEFAULT_CUSTOM_SCRIPTS: CustomScript[] = [
  {
    id: "s-1",
    name: "Audit Local Administrators",
    category: "Security & Users",
    description: "Queries all accounts currently assigned to the local Administrators security group.",
    command: "Get-LocalGroupMember -Group 'Administrators' | Select-Object Name, ObjectClass, PrincipalSource\r"
  },
  {
    id: "s-2",
    name: "Active TCP Sockets & Ports",
    category: "Networking",
    description: "Lists established TCP connections along with local and remote endpoints.",
    command: "Get-NetTCPConnection -State Established | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State -First 15\r"
  },
  {
    id: "s-3",
    name: "Storage Replica Volume Status",
    category: "Storage",
    description: "Displays storage replica partnerships and log volume consistency.",
    command: "Get-SRPartnership | Select-Object SourceServerName, SourceRGName, DestinationServerName, DestinationRGName\r"
  },
  {
    id: "s-4",
    name: "Top Memory Consuming Processes",
    category: "Performance",
    description: "Retrieves top 10 processes ranked by physical RAM working set size.",
    command: "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 10 Name, Id, @{N='RAM_MB';E={[math]::Round($_.WorkingSet64/1MB,1)}}\r"
  },
  {
    id: "s-5",
    name: "Windows Event Log - Errors (Last 1hr)",
    category: "System Audit",
    description: "Fetches recent Critical and Error entries from the System event log.",
    command: "Get-EventLog -LogName System -EntryType Error,Warning -Newest 10 | Select-Object TimeGenerated, Source, Message\r"
  }
];

export function getStoredScripts(): CustomScript[] {
  if (typeof window === "undefined") return DEFAULT_CUSTOM_SCRIPTS;
  try {
    const raw = localStorage.getItem("nexus_custom_ps_scripts");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_CUSTOM_SCRIPTS;
}

export function saveStoredScripts(scripts: CustomScript[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("nexus_custom_ps_scripts", JSON.stringify(scripts));
  }
}

/* =========================================================================
   CUSTOM SCRIPT BUILDER MODAL
   ========================================================================= */
export function CustomScriptModal({
  onClose,
  onRunScript,
  onSaveScript
}: {
  onClose: () => void;
  onRunScript: (cmd: string) => void;
  onSaveScript: (script: CustomScript) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("System Audit");
  const [description, setDescription] = useState("");
  const [command, setCommand] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !command.trim()) {
      toast.error("Please provide both a script name and a valid command.");
      return;
    }

    const newScript: CustomScript = {
      id: "script-" + Date.now(),
      name: name.trim(),
      category,
      description: description.trim() || "Custom user PowerShell script",
      command: command.trim().endsWith("\r") ? command.trim() : command.trim() + "\r"
    };

    onSaveScript(newScript);
    toast.success(`Saved script "${newScript.name}" to Library!`);
    onClose();
  };

  const handleTestRun = () => {
    if (!command.trim()) {
      toast.error("Script body is empty.");
      return;
    }
    onRunScript(command.trim());
    toast.info("Dispatched script to active PowerShell PTY terminal.");
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    toast.success("Script code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--amber)]/10 text-[var(--amber)]">
              <Code size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text)]">Custom PowerShell Script Builder</h3>
              <p className="text-xs text-[var(--text-sub)]">Compose, test run, or save `.ps1` automation scripts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-void)]">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-[var(--text-sub)] font-bold mb-1">Script Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Restart Spooler & Clear Queue"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-[var(--text-sub)] font-bold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none cursor-pointer"
              >
                <option value="System Audit">System Audit</option>
                <option value="Security & Users">Security & Users</option>
                <option value="Networking">Networking</option>
                <option value="Storage & Disks">Storage & Disks</option>
                <option value="Performance">Performance</option>
                <option value="Active Directory">Active Directory</option>
                <option value="Hyper-V">Hyper-V & Virtualization</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-[var(--text-sub)] font-bold mb-1">Description</label>
            <input
              type="text"
              placeholder="Brief summary of what this script accomplishes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3 py-2 text-xs text-[var(--text)] font-mono focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-mono uppercase text-[var(--text-sub)] font-bold">PowerShell Command Body (.ps1) *</label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-mono text-[var(--amber)] hover:underline flex items-center gap-1"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy Code"}
              </button>
            </div>
            <textarea
              required
              rows={6}
              placeholder={`# Example PowerShell Script\r\nGet-Service -Name "WinRM" | Restart-Service -PassThru\r\nGet-EventLog -LogName System -Newest 5`}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="w-full bg-[#050508] border border-[var(--border-c)] rounded-xl p-3 text-xs text-[var(--amber)] font-mono focus:border-[var(--amber)] focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-c)]">
            <button
              type="button"
              onClick={handleTestRun}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--teal)]/15 border border-[var(--teal)]/30 text-[var(--teal)] font-mono text-xs font-bold hover:bg-[var(--teal)] hover:text-black transition-all"
            >
              <Play size={14} /> Run in Terminal Now
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[var(--border-c)] text-xs font-mono text-[var(--text-sub)] hover:text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--amber)] text-black font-mono text-xs font-bold hover:bg-[var(--amber-hover)] transition-all shadow-md"
              >
                <Save size={14} /> Save to Library
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   CMDLET CHEAT SHEET DRAWER COMPONENT
   ========================================================================= */
const CMDLET_CHEAT_SHEET = [
  {
    category: "System Audit & Info",
    items: [
      { cmd: "Get-ComputerInfo", desc: "Displays OS build, installation date, domain, BIOS and processor hardware spec." },
      { cmd: "Get-HotFix", desc: "Lists installed Windows Updates and KB security patches." },
      { cmd: "Get-Uptime", desc: "Shows system uptime duration since last reboot." },
      { cmd: "Get-EventLog -LogName System -Newest 20", desc: "Fetches recent event log records from System log." }
    ]
  },
  {
    category: "Process & Service Management",
    items: [
      { cmd: "Get-Process | Sort-Object CPU -Descending | Select-Object -First 10", desc: "Top 10 CPU-heavy active processes." },
      { cmd: "Stop-Process -Id <PID> -Force", desc: "Forcefully terminates process by PID." },
      { cmd: "Get-Service | Where-Object Status -eq 'Running'", desc: "List all currently active Windows services." },
      { cmd: "Restart-Service -Name 'WinRM'", desc: "Restarts the Windows Remote Management service." }
    ]
  },
  {
    category: "Storage & Volume Management",
    items: [
      { cmd: "Get-Volume | Select-Object DriveLetter, FileSystemLabel, SizeRemaining, Size", desc: "Drive letters, total and free bytes." },
      { cmd: "Get-Disk | Select-Object Number, FriendlyName, HealthStatus, OperationalStatus", desc: "Physical disks and operational state." },
      { cmd: "Optimize-Volume -DriveLetter C -Defrag -Verbose", desc: "Runs defragmentation/TRIM on drive volume." },
      { cmd: "Get-SRPartnership", desc: "Displays Storage Replica partnerships and replication mode." }
    ]
  },
  {
    category: "Networking & Remote Access",
    items: [
      { cmd: "Get-NetIPAddress -AddressFamily IPv4", desc: "List IPv4 configurations for all network adapters." },
      { cmd: "Test-NetConnection -ComputerName google.com -Port 443", desc: "Ping & TCP port connectivity check." },
      { cmd: "Get-NetTCPConnection -State Established", desc: "List open connected TCP sockets." },
      { cmd: "Get-NetFirewallRule | Where-Object Enabled -eq True", desc: "Enabled Windows Firewall security rules." }
    ]
  },
  {
    category: "Active Directory & Users",
    items: [
      { cmd: "Get-LocalGroupMember -Group 'Administrators'", desc: "Audit users with local Administrator permissions." },
      { cmd: "Get-LocalUser | Select-Object Name, Enabled, LastLogon", desc: "Local accounts on target machine." },
      { cmd: "New-LocalUser -Name 'TempUser' -Password (ConvertTo-SecureString 'P@ss' -AsPlainText -Force)", desc: "Creates a new local user account." }
    ]
  }
];

export function CmdletCheatSheetDrawer({
  onClose,
  onRunCmd
}: {
  onClose: () => void;
  onRunCmd: (cmd: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CMDLET_CHEAT_SHEET;
    const q = search.toLowerCase();
    return CMDLET_CHEAT_SHEET.map(cat => ({
      ...cat,
      items: cat.items.filter(item => item.cmd.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q))
    })).filter(cat => cat.items.length > 0);
  }, [search]);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[var(--bg-card)] border-l border-[var(--border-c)] shadow-2xl flex flex-col font-sans">
      {/* Drawer Header */}
      <div className="p-5 border-b border-[var(--border-c)] bg-[var(--bg-surface)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BookOpen size={18} className="text-[var(--amber)]" />
          <div>
            <h3 className="text-sm font-bold text-[var(--text)]">PowerShell Cmdlet Cheat Sheet</h3>
            <p className="text-[11px] text-[var(--text-sub)]">Quick reference & one-click runner</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-void)]">
          <X size={18} />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-[var(--border-c)] bg-[var(--bg-void)]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" />
          <input
            type="text"
            placeholder="Search cmdlets, keywords, or commands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-[var(--border-c)] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-[var(--text)] placeholder-[var(--text-sub)] focus:border-[var(--amber)] focus:outline-none"
          />
        </div>
      </div>

      {/* Cmdlets List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {filteredCategories.map((cat) => (
          <div key={cat.category} className="space-y-2">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--amber)] flex items-center gap-1">
              <Terminal size={12} /> {cat.category}
            </h4>
            <div className="space-y-2">
              {cat.items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[var(--bg-void)] border border-[var(--border-c)] hover:border-[var(--amber)]/50 transition-all group">
                  <div className="text-xs font-mono text-[var(--teal)] font-bold break-all mb-1">{item.cmd}</div>
                  <div className="text-[11px] text-[var(--text-sub)] mb-2">{item.desc}</div>
                  <button
                    onClick={() => {
                      onRunCmd(item.cmd.endsWith("\r") ? item.cmd : item.cmd + "\r");
                      toast.success(`Ran cmdlet: ${item.cmd}`);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--amber)]/10 text-[var(--amber)] font-mono text-[10px] font-bold hover:bg-[var(--amber)] hover:text-black transition-colors"
                  >
                    <Play size={10} /> Execute
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
