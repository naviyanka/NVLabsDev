import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Bot, User, X, RefreshCw, Terminal, CheckCircle2, Copy, AlertCircle, ShieldAlert, Cpu } from "lucide-react";
import { sendGeminiChatFn } from "@/lib/geminiServerFns";
import { getFrontendSettings } from "@/lib/frontendSettings";

export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  "Analyze current server health and load",
  "Write PowerShell script to clean IIS log files",
  "How do I configure Storage Replica on Windows Server?",
  "Troubleshoot high CPU usage in w3wp.exe",
  "Generate firewall rule to block brute-force RDP",
];

export function GeminiCopilotDrawer({
  isOpen,
  onClose,
  initialContextData,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialContextData?: { type: string; summary: string };
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "model",
      content:
        "Hello! I am **Nexus Copilot**, powered by Gemini AI. I can analyze server performance, troubleshoot Event Logs, write and optimize PowerShell scripts, and audit security rules.\n\nHow can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialContextData) {
      setInput(`Analyze context [${initialContextData.type}]: ${initialContextData.summary}`);
    }
  }, [initialContextData]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

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
      const data = await sendGeminiChatFn({
        data: {
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          geminiApiKey: settings.geminiApiKey,
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
          content: `⚠️ Error contacting Gemini AI: ${err.message || "Network error"}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-xl bg-[var(--surface,#18181b)] border-l border-[var(--border,#27272a)] h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border,#27272a)] flex items-center justify-between bg-[var(--surface-sub,#09090b)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm text-[var(--text,#f4f4f5)]">Nexus Copilot</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono border border-amber-500/30">
                  Gemini 3.6 Flash
                </span>
              </div>
              <p className="text-xs text-[var(--text-sub,#a1a1aa)]">Server Operations & Infrastructure Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              title="Clear Chat"
              className="p-2 rounded-lg text-[var(--text-sub,#a1a1aa)] hover:text-white hover:bg-[var(--surface-hover,#27272a)] transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--text-sub,#a1a1aa)] hover:text-white hover:bg-[var(--surface-hover,#27272a)] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm">
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
                      ? "bg-amber-500 text-white"
                      : "bg-[var(--surface-sub,#27272a)] text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs relative group ${
                    isUser
                      ? "bg-amber-500 text-white rounded-tr-xs"
                      : "bg-[var(--surface-sub,#27272a)] text-[var(--text,#f4f4f5)] border border-[var(--border,#3f3f46)] rounded-tl-xs"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed break-words font-mono text-xs">
                    {msg.content}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] opacity-70 border-t border-white/10 pt-1.5">
                    <span>{msg.timestamp}</span>
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="hover:underline flex items-center gap-1 cursor-pointer"
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
            <div className="flex gap-3 items-center text-xs text-[var(--text-sub,#a1a1aa)] animate-pulse pl-2">
              <Bot className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Gemini is analyzing server context & generating reply...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 border-t border-[var(--border,#27272a)] bg-[var(--surface-sub,#09090b)]">
          <p className="text-[11px] text-[var(--text-sub,#a1a1aa)] font-medium mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Quick Actions:
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="text-[11px] whitespace-nowrap bg-[var(--surface,#18181b)] hover:bg-[var(--surface-hover,#27272a)] text-[var(--text-sub,#a1a1aa)] hover:text-white border border-[var(--border,#3f3f46)] px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-[var(--border,#27272a)] bg-[var(--surface,#18181b)]">
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
              placeholder="Ask Gemini SysAdmin Copilot..."
              className="flex-1 bg-[var(--surface-sub,#09090b)] border border-[var(--border,#3f3f46)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text,#f4f4f5)] placeholder-[var(--text-sub,#71717a)] focus:outline-none focus:border-amber-500 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium transition-all shadow-md cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
