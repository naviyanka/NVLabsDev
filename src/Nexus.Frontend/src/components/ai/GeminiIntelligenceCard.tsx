import React, { useState, useEffect } from "react";
import { Sparkles, RefreshCw, AlertTriangle, CheckCircle2, Terminal, Code2, ShieldAlert } from "lucide-react";
import { runGeminiAnalyzeFn } from "@/lib/geminiServerFns";
import { getFrontendSettings } from "@/lib/frontendSettings";

interface GeminiIntelligenceCardProps {
  title: string;
  type: "events" | "metrics" | "powershell" | "security" | "general";
  dataToAnalyze: any;
  contextMessage?: string;
  defaultPromptLabel?: string;
}

export function GeminiIntelligenceCard({
  title,
  type,
  dataToAnalyze,
  contextMessage = "Analyze current operational state and identify potential anomalies or recommended actions.",
  defaultPromptLabel = "Run Gemini AI Analysis",
}: GeminiIntelligenceCardProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copilotEnabled, setCopilotEnabled] = useState(true);
  const [geminiApiKey, setGeminiApiKey] = useState("");

  useEffect(() => {
    const settings = getFrontendSettings();
    setCopilotEnabled(settings.copilotEnabled !== false);
    setGeminiApiKey(settings.geminiApiKey || "");

    const handleCopilotChange = (e: any) => {
      if (e.detail) {
        if (e.detail.copilotEnabled !== undefined) {
          setCopilotEnabled(e.detail.copilotEnabled);
        }
        if (e.detail.geminiApiKey !== undefined) {
          setGeminiApiKey(e.detail.geminiApiKey);
        }
      }
    };
    window.addEventListener("nexus-copilot-change", handleCopilotChange);
    return () => window.removeEventListener("nexus-copilot-change", handleCopilotChange);
  }, []);

  if (!copilotEnabled) {
    return null;
  }

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runGeminiAnalyzeFn({
        data: {
          type,
          data: dataToAnalyze,
          context: contextMessage,
          geminiApiKey: geminiApiKey,
        },
      });

      setAnalysis(data.analysis || "No recommendations generated.");
    } catch (err: any) {
      setError(err.message || "Failed to execute Gemini analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[var(--surface,#18181b)] via-[var(--surface-sub,#09090b)] to-amber-950/10 p-5 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text,#f4f4f5)] flex items-center gap-2">
              {title}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Gemini Intelligence
              </span>
            </h3>
            <p className="text-xs text-[var(--text-sub,#a1a1aa)]">Real-time SysAdmin AI diagnosis & recommendations</p>
          </div>
        </div>

        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Analyzing..." : defaultPromptLabel}</span>
        </button>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {analysis ? (
        <div className="mt-3 p-4 rounded-xl bg-[var(--surface-sub,#09090b)] border border-[var(--border,#27272a)] text-xs text-[var(--text,#f4f4f5)] font-mono leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
          {analysis}
        </div>
      ) : (
        !loading && (
          <div className="mt-2 p-3 rounded-xl border border-dashed border-[var(--border,#3f3f46)] bg-black/20 text-xs text-[var(--text-sub,#71717a)] flex items-center justify-between">
            <span>Click the button above to execute a Gemini AI diagnostic pass over this section.</span>
            <span className="text-[10px] text-amber-400 font-mono">gemini-3.6-flash</span>
          </div>
        )
      )}
    </div>
  );
}
