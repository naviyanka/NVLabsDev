import { useState } from "react";
import { Sparkles, Play, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { getApiUrl } from "@/lib/backend";
import { toast } from "sonner";

interface AiCommandBarProps {
  serverIp: string;
  onRunCommand: (cmd: string) => void;
}

export function AiCommandBar({ serverIp, onRunCommand }: AiCommandBarProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    command: string;
    safety: string;
    description: string;
    generated: boolean;
  } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(getApiUrl("/copilot/generate-command"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, serverIp }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        toast.error("Failed to generate command");
      }
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  };

  const handleRun = () => {
    if (!result?.command) return;
    if (result.safety === "destructive") {
      if (!confirm(`This command is classified as DESTRUCTIVE. Run on ${serverIp}?`)) return;
    }
    onRunCommand(result.command);
    setResult(null);
    setPrompt("");
  };

  const safetyBadge = (safety: string) => {
    switch (safety) {
      case "safe":
        return <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold"><Shield size={10} /> Safe</span>;
      case "destructive":
        return <span className="flex items-center gap-1 text-rose-400 text-[10px] font-bold"><AlertTriangle size={10} /> Destructive</span>;
      default:
        return <span className="text-[10px] text-[var(--text-sub)]">Unknown</span>;
    }
  };

  return (
    <div className="space-y-2">
      {/* Input Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Sparkles size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--amber)]" />
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleGenerate(); }}
            placeholder="Describe what you want... (e.g. 'show stopped auto-start services')"
            className="w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text)] focus:border-[var(--amber)] focus:outline-none placeholder:text-[var(--text-sub)]"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[var(--amber)]/10 border border-[var(--amber)]/30 text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          Generate
        </button>
      </div>

      {/* Result Preview */}
      {result && result.generated && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-sub)]">{result.description}</p>
            {safetyBadge(result.safety)}
          </div>
          <pre className="bg-black/30 rounded-lg p-2 text-[11px] font-mono text-[var(--text)] overflow-x-auto whitespace-pre-wrap">{result.command}</pre>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                result.safety === "destructive"
                  ? "bg-rose-500/10 border border-rose-400/30 text-rose-400 hover:bg-rose-500/20"
                  : "bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              <Play size={12} /> Run on {serverIp}
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(result.command); toast.success("Copied to clipboard"); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--text)] cursor-pointer"
            >
              Copy
            </button>
            <button
              onClick={() => setResult(null)}
              className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-sub)] hover:text-[var(--text)] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {result && !result.generated && (
        <p className="text-xs text-[var(--text-sub)] italic px-1">{result.description}</p>
      )}
    </div>
  );
}
