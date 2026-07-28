import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Cpu, Download, Check, RefreshCw, Sparkles, HardDrive, Terminal, ShieldCheck, Play, AlertCircle } from "lucide-react";
import { getApiUrl } from "@/lib/backend";
import { getFrontendSettings, saveFrontendSettings } from "@/lib/frontendSettings";

interface OllamaStatus {
  isInstalled: boolean;
  isRunning: boolean;
  version: string;
  installedModels: string[];
}

interface CuratedModel {
  name: string;
  displayName: string;
  size: string;
  badge: string;
  description: string;
  recommendedFor: string;
  color: string;
}

const RECOMMENDED_MODELS: CuratedModel[] = [
  {
    name: "qwen2.5:0.5b",
    displayName: "Qwen 2.5 (0.5B)",
    size: "~390 MB",
    badge: "Ultra-Lightweight",
    description: "Lightning-fast CPU inference with virtually zero RAM overhead. Perfect for low-end servers.",
    recommendedFor: "Fastest response times on dual-core CPUs",
    color: "amber",
  },
  {
    name: "llama3.2:1b",
    displayName: "Llama 3.2 (1B)",
    size: "~1.3 GB",
    badge: "Best Balance",
    description: "Meta's optimized small model with strong PowerShell & Windows Server administration reasoning.",
    recommendedFor: "Recommended overall for NEXUS Copilot",
    color: "cyan",
  },
  {
    name: "phi3:mini",
    displayName: "Phi-3 Mini (3.8B)",
    size: "~2.2 GB",
    badge: "High Reasoning",
    description: "Microsoft's state-of-the-art compact model with high-precision script generation and diagnostics.",
    recommendedFor: "Complex PowerShell & AD troubleshooting",
    color: "purple",
  },
  {
    name: "gemma2:2b",
    displayName: "Gemma 2 (2B)",
    size: "~1.6 GB",
    badge: "Google Compact",
    description: "Google's lightweight open-weights architecture with excellent log analysis capabilities.",
    recommendedFor: "Event Viewer & Syslog analysis",
    color: "emerald",
  },
];

export const OllamaManager: React.FC = () => {
  const [status, setStatus] = useState<OllamaStatus>({
    isInstalled: false,
    isRunning: false,
    version: "",
    installedModels: [],
  });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [pullingModel, setPullingModel] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch(getApiUrl("/ollama/status"));
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        setStatus({ isInstalled: false, isRunning: false, version: "", installedModels: [] });
      }
    } catch {
      setStatus({ isInstalled: false, isRunning: false, version: "", installedModels: [] });
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleInstallOllama = async () => {
    setInstalling(true);
    toast.info("Initiating One-Click Ollama Installation for Windows...");
    try {
      const res = await fetch(getApiUrl("/ollama/install"), { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Ollama setup initiated successfully! Checking status...");
        setTimeout(fetchStatus, 5000);
      } else {
        toast.error(`Installation error: ${data.message || "Failed to run setup"}`);
      }
    } catch (e: any) {
      toast.error(`Error executing installer: ${e.message}`);
    } finally {
      setInstalling(false);
    }
  };

  const handlePullModel = async (modelName: string) => {
    setPullingModel(modelName);
    toast.info(`Pulling lightweight CPU model '${modelName}'... This may take 1-2 minutes depending on connection.`);
    try {
      const res = await fetch(getApiUrl("/ollama/pull"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelName }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Model '${modelName}' downloaded successfully!`);
        
        // Auto-configure Ollama as active AI provider in settings
        const settings = getFrontendSettings();
        saveFrontendSettings({
          ...settings,
          aiProvider: "ollama",
          aiBaseUrl: settings.aiBaseUrl || "http://localhost:11434/v1",
          aiModel: modelName,
        });
        toast.success(`NEXUS Copilot configured to run locally using '${modelName}'!`);
        
        fetchStatus();
      } else {
        toast.error(`Failed to pull model: ${data.message || "Pull command failed"}`);
      }
    } catch (e: any) {
      toast.error(`Error pulling model: ${e.message}`);
    } finally {
      setPullingModel(null);
    }
  };

  const currentSettings = getFrontendSettings();
  const activeModel = currentSettings.aiModel;

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-c)] p-6 space-y-6 shadow-sm">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-c)] pb-5">
        <div>
          <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-500" /> One-Click Local CPU AI Setup (Ollama)
          </h3>
          <p className="text-xs text-[var(--text-sub)] mt-1">
            Run lightweight LLMs completely on your CPU. No GPU required, 100% free, private, and air-gapped.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchStatus}
            disabled={loadingStatus}
            className="p-2 rounded-xl bg-[var(--bg-void)] hover:bg-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--text)] border border-[var(--border-c)] transition-all cursor-pointer"
            title="Refresh Ollama Status"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStatus ? "animate-spin" : ""}`} />
          </button>

          {!status.isInstalled ? (
            <button
              onClick={handleInstallOllama}
              disabled={installing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {installing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Installing Ollama...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Install Ollama (One-Click)
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold">
              <Check className="w-4 h-4 text-emerald-500" /> Ollama Installed {status.isRunning ? "(Service Online)" : "(Service Stopped)"}
            </div>
          )}
        </div>
      </div>

      {/* Installed Models Overview */}
      {status.isInstalled && (
        <div className="p-4 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-cyan-500" /> Locally Available Models ({status.installedModels.length})
            </span>
            <span className="font-mono text-[11px] text-[var(--text-sub)]">{status.version}</span>
          </div>
          {status.installedModels.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {status.installedModels.map((m) => (
                <span
                  key={m}
                  className={`text-xs px-2.5 py-1 rounded-lg font-mono flex items-center gap-1.5 border ${
                    activeModel === m
                      ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/40 font-bold"
                      : "bg-[var(--bg-surface)] text-[var(--text-sub)] border-[var(--border-c)]"
                  }`}
                >
                  {m}
                  {activeModel === m && <span className="text-[10px] bg-cyan-500 text-white px-1.5 py-0.2 rounded-full uppercase">Active</span>}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-sub)]">No models pulled yet. Select a lightweight model below to download with one click.</p>
          )}
        </div>
      )}

      {/* Curated Models Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Recommended CPU Models for NEXUS Platform
          </h4>
          <span className="text-[11px] text-[var(--text-sub)] font-medium">Quantized GGUF • High Performance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RECOMMENDED_MODELS.map((model) => {
            const isInstalled = status.installedModels.some((m) => m.startsWith(model.name.split(":")[0]));
            const isActive = activeModel === model.name;
            const isPulling = pullingModel === model.name;

            return (
              <div
                key={model.name}
                className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between ${
                  isActive
                    ? "border-cyan-500 bg-cyan-500/10 shadow-xs ring-1 ring-cyan-500/30"
                    : "border-[var(--border-c)] bg-[var(--bg-surface)] hover:border-zinc-400"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-xs text-[var(--text)]">{model.displayName}</h5>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-void)] border border-[var(--border-c)] text-[var(--text-sub)]">
                        {model.size}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-${model.color}-500/15 text-${model.color}-600 dark:text-${model.color}-400 border border-${model.color}-500/30`}>
                      {model.badge}
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-sub)] mt-2 leading-relaxed">{model.description}</p>
                  
                  <div className="mt-2 text-[10px] text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {model.recommendedFor}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border-c)] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[var(--text-sub)]">{model.name}</span>
                  
                  <button
                    onClick={() => handlePullModel(model.name)}
                    disabled={isPulling}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                      isActive
                        ? "bg-cyan-500 text-white shadow-xs"
                        : isInstalled
                        ? "bg-[var(--bg-void)] hover:bg-cyan-500/10 text-[var(--text)] border border-[var(--border-c)] hover:border-cyan-500/40"
                        : "bg-cyan-500/15 hover:bg-cyan-500 text-cyan-600 dark:text-cyan-400 hover:text-white border border-cyan-500/30"
                    }`}
                  >
                    {isPulling ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Pulling Model...
                      </>
                    ) : isActive ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Active Model
                      </>
                    ) : isInstalled ? (
                      <>
                        <Play className="w-3.5 h-3.5" /> Use This Model
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" /> One-Click Pull ({model.size})
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
