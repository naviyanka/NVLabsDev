import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, X, Bot, User, Copy, CheckCircle2, RefreshCw } from "lucide-react";
import { getFrontendSettings } from "@/lib/frontendSettings";
import { sendGeminiChatFn } from "@/lib/geminiServerFns";
import { getApiUrl } from "@/lib/backend";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

interface GeminiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

const SUGGESTED_PROMPTS = [
  "Check Active Directory local admins",
  "Diagnose high CPU usage & process spikes",
  "Audit active Windows Firewall inbound rules",
  "Generate PowerShell script for drive space cleanup",
  "Check Hyper-V virtual switch health",
];

export const GeminiCopilotDrawer: React.FC<GeminiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "model",
      content:
        "Hello! I am your NEXUS Infrastructure & Server Operations Copilot. How can I assist with your servers, active processes, PowerShell scripts, or security audits today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const settings = getFrontendSettings();
      // Get auth token and backend base URL for live API access
      const authToken = typeof window !== "undefined" ? localStorage.getItem("nexus_token") || "" : "";
      const rawApiUrl = getApiUrl(""); // e.g. "http://host:5010/api"
      const backendBaseUrl = rawApiUrl.replace(/\/api\/?$/, ""); // strip trailing /api
      const data = await sendGeminiChatFn({
        data: {
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          provider: settings.aiProvider || "gemini",
          baseUrl: settings.aiBaseUrl || "http://localhost:11434/v1",
          apiKey: settings.aiApiKey,
          geminiApiKey: settings.geminiApiKey,
          model: settings.aiModel,
          authToken,
          backendBaseUrl,
        },
      });

      const replyContent = data.reply || "No response received.";

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: `⚠️ Error contacting AI Gateway: ${err.message || "Network error"}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const currentSettings = getFrontendSettings();
  const currentProvider = currentSettings.aiProvider || "gemini";
  const currentModel = currentSettings.aiModel || (currentProvider === "ollama" ? "llama3.2:1b" : "gemini-2.5-flash");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: "welcome-1",
        role: "model",
        content: "Chat history cleared. What else can I assist you with?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-xl bg-[var(--bg-surface)] border-l border-[var(--border-c)] h-full flex flex-col shadow-2xl overflow-hidden text-[var(--text)]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-c)] flex items-center justify-between bg-[var(--bg-void)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm text-[var(--text)]">Nexus Copilot</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono border border-amber-500/30 uppercase font-bold">
                  {currentProvider === "ollama" ? "CPU Ollama" : currentProvider} ({currentModel})
                </span>
              </div>
              <p className="text-xs text-[var(--text-sub)]">Server Operations & Infrastructure Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              title="Clear Chat"
              className="p-2 rounded-lg text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-void)] border border-transparent hover:border-[var(--border-c)] transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-void)] border border-transparent hover:border-[var(--border-c)] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm bg-[var(--bg-surface)]">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                    isUser
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-[var(--bg-void)] text-amber-600 dark:text-amber-400 border border-[var(--border-c)] shadow-2xs"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs relative group ${
                    isUser
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-tr-xs"
                      : "bg-[var(--bg-card)] text-[var(--text)] border border-[var(--border-c)] rounded-tl-xs"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed break-words font-mono text-xs">
                    {msg.content}
                  </div>

                  <div className={`mt-2 flex items-center justify-between text-[10px] ${isUser ? "text-white/80 border-t border-white/20" : "text-[var(--text-sub)] border-t border-[var(--border-c)]"} pt-1.5`}>
                    <span>{msg.timestamp}</span>
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="hover:underline flex items-center gap-1 cursor-pointer font-sans"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-[var(--text-sub)] animate-pulse pl-2">
              <Bot className="w-4 h-4 text-amber-500 animate-spin" />
              <span>Copilot is analyzing infrastructure context & generating reply...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2.5 border-t border-[var(--border-c)] bg-[var(--bg-void)]">
          <p className="text-[11px] text-[var(--text-sub)] font-medium mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Quick Actions:
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="text-[11px] whitespace-nowrap bg-[var(--bg-surface)] hover:bg-amber-500/10 text-[var(--text-sub)] hover:text-amber-600 dark:hover:text-amber-400 border border-[var(--border-c)] hover:border-amber-500/40 px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-[var(--border-c)] bg-[var(--bg-surface)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask NEXUS SysAdmin Copilot..."
              className="flex-1 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-sub)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all font-mono"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-medium transition-all shadow-md cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
