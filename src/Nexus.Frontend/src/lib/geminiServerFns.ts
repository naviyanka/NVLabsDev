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
      content: m.content || "",
    })),
  ];

  const res = await fetch(cleanUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model || "qwen2.5:0.5b",
      messages: formattedMessages,
      temperature: 0.3,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI Gateway returned HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  // Check if the gateway returned SSE streaming despite stream:false
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/event-stream")) {
    // Parse SSE stream: collect all delta content chunks
    const sseText = await res.text();
    const lines = sseText.split("\n");
    let fullContent = "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const payload = trimmed.slice(6);
      if (payload === "[DONE]") break;
      try {
        const chunk = JSON.parse(payload);
        const delta = chunk.choices?.[0]?.delta?.content || "";
        fullContent += delta;
      } catch {
        // skip malformed SSE lines
      }
    }
    return fullContent || "No response received from AI model.";
  }

  // Standard non-streaming JSON response
  const rawText = await res.text();
  // Some gateways prepend SSE "data: " even with application/json content-type
  let jsonText = rawText;
  if (rawText.trimStart().startsWith("data: ")) {
    // Concatenate SSE data lines
    const lines = rawText.split("\n");
    let fullContent = "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const payload = trimmed.slice(6);
      if (payload === "[DONE]") break;
      try {
        const chunk = JSON.parse(payload);
        // Could be a full response or a delta chunk
        const full = chunk.choices?.[0]?.message?.content;
        if (full) return full;
        const delta = chunk.choices?.[0]?.delta?.content || "";
        fullContent += delta;
      } catch {
        // skip malformed lines
      }
    }
    return fullContent || "No response received from AI model.";
  }

  const json = JSON.parse(jsonText);
  const content = json.choices?.[0]?.message?.content || "No response received from AI model.";
  return content;
}

async function callGeminiRestEndpoint({
  apiKey,
  model = "gemini-2.5-flash",
  messages,
  systemPrompt,
}: {
  apiKey: string;
  model?: string;
  messages: Array<{ role: string; content: string }>;
  systemPrompt: string;
}) {
  const selectedModel = model && model.trim() ? model.trim() : "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey.trim()}`;

  const formattedContents = messages.map((m) => ({
    role: m.role === "model" || m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content || "" }],
  }));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: formattedContents,
      generationConfig: {
        temperature: 0.3,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Gemini REST API returned HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No text response received from Gemini API.");
  }
  return text;
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

    // Default: Gemini Provider via Direct REST API (Zero SDK Module Resolution Errors)
    const apiKey = geminiApiKey || customKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        reply:
          "[Nexus Copilot] GEMINI_API_KEY is not set. Please configure an API Key or switch to Local CPU Ollama / Custom AI Gateway in Settings.\n\nOffline simulation: I am NEXUS Server Operations Copilot. How can I assist with your infrastructure today?",
        fallback: true,
      };
    }

    try {
      const formattedHistory = (history || []).map((h) => ({
        role: h.role,
        content: h.content || h.text || "",
      }));

      const reply = await callGeminiRestEndpoint({
        apiKey,
        model: model || "gemini-2.5-flash",
        messages: [...formattedHistory, { role: "user", content: message }],
        systemPrompt: NEXUS_COPILOT_SYSTEM_PROMPT,
      });

      return { reply };
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
      const selectedModel = type === "powershell" ? "gemini-2.5-pro" : model || "gemini-2.5-flash";

      const analysis = await callGeminiRestEndpoint({
        apiKey,
        model: selectedModel,
        messages: [{ role: "user", content: prompt }],
        systemPrompt: NEXUS_COPILOT_SYSTEM_PROMPT,
      });

      return { analysis };
    } catch (err: any) {
      console.error("Gemini Analyze Error:", err);
      return { analysis: `Error running analysis: ${err.message || "Failed to analyze data"}` };
    }
  });
