import { createServerFn } from "@tanstack/react-start";

const NEXUS_COPILOT_SYSTEM_PROMPT = `You are NEXUS Copilot, the official AI Systems Operations & Infrastructure Copilot tailored specifically for the NEXUS Server Management Platform.

YOUR SCOPE & DOMAIN FOCUS:
1. You specialize strictly in Windows Server Administration, Linux Host Management, Hyper-V Virtualization, Active Directory, Windows Services, Task Scheduler, Windows Defender, Firewall Rules, Storage Replica, and PowerShell automation.
2. You provide clear, step-by-step diagnostic analysis and copy-pasteable PowerShell/CLI remediation scripts.
3. Keep answers technical, highly accurate, concise, and structured in Markdown with code blocks.
4. If a user asks about non-IT or non-server subjects, gently remind them that you are configured specifically for NEXUS Server & Infrastructure Operations.`;

interface ChatPayload {
  message: string;
  history?: any[];
  model?: string;
  provider?: "gemini" | "openai" | "ollama" | "custom";
  baseUrl?: string;
  apiKey?: string;
  geminiApiKey?: string;
}

interface AnalyzePayload {
  type: string;
  data: any;
  context?: string;
  model?: string;
  provider?: "gemini" | "openai" | "ollama" | "custom";
  baseUrl?: string;
  apiKey?: string;
  geminiApiKey?: string;
}

async function callOpenAICompatibleEndpoint({
  baseUrl = "http://localhost:11434/v1",
  apiKey,
  model = "qwen2.5:0.5b",
  messages,
  systemPrompt,
}: {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  messages: Array<{ role: string; content: string }>;
  systemPrompt: string;
}) {
  const cleanUrl = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey && apiKey.trim()) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }

  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === "model" ? "assistant" : m.role,
      content: m.content,
    })),
  ];

  const res = await fetch(cleanUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model || "qwen2.5:0.5b",
      messages: formattedMessages,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI Gateway returned HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content || "No response received from AI model.";
  return content;
}

export const sendGeminiChatFn = createServerFn({ method: "POST" })
  .validator((data: ChatPayload) => data)
  .handler(async ({ data }) => {
    const { 
      message, 
      history = [], 
      provider = "gemini", 
      baseUrl = "http://localhost:11434/v1", 
      apiKey: customKey, 
      geminiApiKey,
      model = "gemini-2.5-flash" 
    } = data;

    // Handle OpenAI-compatible, Ollama (CPU self-hosted), or Custom Endpoints
    if (provider === "openai" || provider === "ollama" || provider === "custom") {
      try {
        const reply = await callOpenAICompatibleEndpoint({
          baseUrl: provider === "openai" ? "https://api.openai.com/v1" : baseUrl,
          apiKey: customKey || (provider === "gemini" ? geminiApiKey : ""),
          model: model || (provider === "ollama" ? "llama3.2:1b" : "gpt-4o-mini"),
          messages: [...history, { role: "user", content: message }],
          systemPrompt: NEXUS_COPILOT_SYSTEM_PROMPT,
        });
        return { reply };
      } catch (err: any) {
        console.error("OpenAI/Ollama Chat Error:", err);
        return { reply: `⚠️ [${provider.toUpperCase()}] Endpoint error: ${err.message || "Failed to reach AI model gateway"}` };
      }
    }

    // Default: Gemini Provider
    const apiKey = geminiApiKey || customKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        reply:
          "[Nexus Copilot] GEMINI_API_KEY is not set. Please configure an API Key or switch to Local CPU Ollama / Custom AI Gateway in Settings.\n\nOffline simulation: I am NEXUS Server Operations Copilot. How can I assist with your infrastructure today?",
        fallback: true,
      };
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const formattedContents = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const item of history) {
          formattedContents.push({
            role: item.role === "user" ? "user" : "model",
            parts: [{ text: item.content || item.text || "" }],
          });
        }
      }
      formattedContents.push({
        role: "user",
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: model || "gemini-2.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: NEXUS_COPILOT_SYSTEM_PROMPT,
        },
      });

      return { reply: response.text || "No response received from Gemini AI." };
    } catch (err: any) {
      console.error("Gemini Chat Error:", err);
      return { reply: `⚠️ [GEMINI] Error: ${err.message || "Failed to query Gemini AI"}` };
    }
  });

export const runGeminiAnalyzeFn = createServerFn({ method: "POST" })
  .validator((data: AnalyzePayload) => data)
  .handler(async ({ data }) => {
    const { 
      type, 
      data: payload, 
      context = "", 
      provider = "gemini", 
      baseUrl = "http://localhost:11434/v1", 
      apiKey: customKey, 
      geminiApiKey,
      model = "gemini-2.5-flash" 
    } = data;

    let prompt = "";
    if (type === "events" || type === "logs") {
      prompt = `Analyze the following server event logs and identify potential root causes, severity, and step-by-step remediation commands:\n\n${JSON.stringify(payload, null, 2)}`;
    } else if (type === "metrics" || type === "performance") {
      prompt = `Analyze these server performance metrics (CPU, RAM, Disk, IOPS). Identify any bottlenecks or resource exhaustion and suggest optimization actions:\n\n${JSON.stringify(payload, null, 2)}`;
    } else if (type === "powershell" || type === "script") {
      prompt = `Review the following PowerShell script or command request. Provide optimized code, security best practices, and potential side-effects:\n\nContext/Request: ${context}\nScript:\n${payload}`;
    } else if (type === "security" || type === "firewall") {
      prompt = `Perform a security audit on the following server firewall rules and active devices/users:\n\n${JSON.stringify(payload, null, 2)}`;
    } else {
      prompt = `Provide sysadmin analysis and recommendations for the following data:\n\nContext: ${context}\nData: ${JSON.stringify(payload, null, 2)}`;
    }

    if (provider === "openai" || provider === "ollama" || provider === "custom") {
      try {
        const analysis = await callOpenAICompatibleEndpoint({
          baseUrl: provider === "openai" ? "https://api.openai.com/v1" : baseUrl,
          apiKey: customKey || geminiApiKey,
          model: model || (provider === "ollama" ? "llama3.2:1b" : "gpt-4o-mini"),
          messages: [{ role: "user", content: prompt }],
          systemPrompt: NEXUS_COPILOT_SYSTEM_PROMPT,
        });
        return { analysis };
      } catch (err: any) {
        console.error("OpenAI/Ollama Analyze Error:", err);
        return { analysis: `⚠️ [${provider.toUpperCase()}] Analysis error: ${err.message || "Failed to analyze data"}` };
      }
    }

    const apiKey = geminiApiKey || customKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        analysis:
          "[Nexus AI Intelligence] No API key configured. To enable live AI intelligence, configure Gemini API Key or Local CPU Ollama in Settings.\n\nSimulated Analysis: All servers operational. CPU utilization normal. No critical security breaches detected.",
        fallback: true,
      };
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const selectedModel = type === "powershell" ? "gemini-2.5-pro" : model;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          systemInstruction: NEXUS_COPILOT_SYSTEM_PROMPT,
        },
      });

      return { analysis: response.text || "No analysis generated." };
    } catch (err: any) {
      console.error("Gemini Analyze Error:", err);
      return { analysis: `Error running analysis: ${err.message || "Failed to analyze data"}` };
    }
  });
