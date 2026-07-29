import { createServerFn } from "@tanstack/react-start";

// ─── NEXUS Copilot System Prompt ───────────────────────────────────────────
const NEXUS_COPILOT_SYSTEM_PROMPT = `You are NEXUS Copilot, the official AI Systems Operations & Infrastructure Copilot for the NEXUS Server Management Platform.

YOUR SCOPE & DOMAIN FOCUS:
1. You specialize strictly in Windows Server Administration, Linux Host Management, Hyper-V Virtualization, Active Directory, Windows Services, Task Scheduler, Windows Defender, Firewall Rules, Storage Replica, and PowerShell automation.
2. You provide clear, step-by-step diagnostic analysis and copy-pasteable PowerShell/CLI remediation scripts.
3. Keep answers technical, highly accurate, concise, and structured in Markdown with code blocks.
4. If a user asks about non-IT or non-server subjects, gently remind them that you are configured specifically for NEXUS Server & Infrastructure Operations.

LIVE INFRASTRUCTURE ACCESS:
You have access to NEXUS backend API tools that let you fetch REAL, LIVE data from the managed infrastructure. When a user asks about servers, services, performance, security, etc., you MUST use the appropriate tool to fetch actual data rather than guessing or providing generic advice.

TOOL USAGE RULES:
- Always fetch real data when the user asks about the current state of infrastructure.
- For questions about "all servers" or "the fleet", start with fetch_servers.
- For server-specific queries, first fetch_servers to find the right server IP, then use server-specific tools.
- Summarize data clearly with counts, tables, and highlight any issues found.
- If a tool returns no data or an error, tell the user and suggest troubleshooting steps.
- You may call up to 5 tools per response to gather comprehensive data.`;

// ─── NEXUS Tool Catalog ────────────────────────────────────────────────────
interface NexusTool {
  name: string;
  description: string;
  endpoint: string;
  parameters?: Record<string, { type: string; description: string; required?: boolean }>;
}

const NEXUS_TOOLS: NexusTool[] = [
  { name: "fetch_servers", description: "Get all servers and machines in the managed fleet. Returns name, IP, OS, role, status, CPU/RAM/disk usage, uptime, and site for each machine.", endpoint: "/api/servers" },
  { name: "fetch_server_services", description: "Get Windows services running on a specific server. Returns service name, display name, status (Running/Stopped), startup type, and log-on account.", endpoint: "/api/servers/{serverId}/services", parameters: { serverId: { type: "string", description: "The server IP address or hostname", required: true } } },
  { name: "fetch_server_apps", description: "Get installed applications/software on a specific server. Returns app name, version, publisher, install date.", endpoint: "/api/servers/{serverId}/apps", parameters: { serverId: { type: "string", description: "The server IP address or hostname", required: true } } },
  { name: "fetch_performance", description: "Get real-time CPU, RAM, disk, and network performance metrics for a specific server.", endpoint: "/api/performance/{serverId}", parameters: { serverId: { type: "string", description: "The server IP address or hostname", required: true } } },
  { name: "fetch_processes", description: "Get running processes on a specific server with CPU/memory usage, PID, and command line.", endpoint: "/api/performance/{serverId}/processes", parameters: { serverId: { type: "string", description: "The server IP address or hostname", required: true } } },
  { name: "fetch_firewall", description: "Get Windows Firewall rules on a specific server. Returns rule name, direction, action, protocol, ports.", endpoint: "/api/servers/{serverId}/firewall", parameters: { serverId: { type: "string", description: "The server IP address or hostname", required: true } } },
  { name: "fetch_security", description: "Get security audit data for a server including compliance checks, security events, and admin accounts.", endpoint: "/api/servers/{serverId}/security", parameters: { serverId: { type: "string", description: "The server IP address or hostname", required: true } } },
  { name: "fetch_users", description: "Get local users and group memberships on a specific server.", endpoint: "/api/servers/{serverId}/users", parameters: { serverId: { type: "string", description: "The server IP address or hostname", required: true } } },
  { name: "fetch_disks", description: "Get physical disk information for a specific server.", endpoint: "/api/servers/{serverId}/disks", parameters: { serverId: { type: "string", description: "The server IP address or hostname", required: true } } },
  { name: "fetch_volumes", description: "Get storage volumes with drive letters, capacity, free space, and file system type.", endpoint: "/api/servers/{serverId}/volumes", parameters: { serverId: { type: "string", description: "The server IP address or hostname", required: true } } },
  { name: "fetch_updates", description: "Get Windows Update status and pending updates for a server.", endpoint: "/api/servers/{serverId}/updates", parameters: { serverId: { type: "string", description: "The server IP address or hostname", required: true } } },
  { name: "fetch_events", description: "Get Windows Event Log entries (errors, warnings, critical) from a server.", endpoint: "/api/servers/{serverId}/events", parameters: { serverId: { type: "string", description: "The server IP address or hostname", required: true } } },
  { name: "fetch_certificates", description: "Get SSL/TLS certificates installed on a server with expiration dates.", endpoint: "/api/servers/{serverId}/certificates", parameters: { serverId: { type: "string", description: "The server IP address or hostname", required: true } } },
  { name: "fetch_tasks", description: "Get scheduled tasks on a server with status, triggers, and next run time.", endpoint: "/api/servers/{serverId}/tasks", parameters: { serverId: { type: "string", description: "The server IP address or hostname", required: true } } },
  { name: "fetch_vms", description: "Get Hyper-V virtual machines on a server with state, CPU, memory, and uptime.", endpoint: "/api/servers/{serverId}/vms", parameters: { serverId: { type: "string", description: "The server IP address or hostname", required: true } } },
  { name: "fetch_networks", description: "Get network adapters and IP configuration for a server.", endpoint: "/api/servers/{serverId}/networks", parameters: { serverId: { type: "string", description: "The server IP address or hostname", required: true } } },
  { name: "fetch_health", description: "Get NEXUS platform health status including database, PowerShell, CIM, and Active Directory subsystem states.", endpoint: "/api/health" },
];

// ─── Build OpenAI-format tool definitions ──────────────────────────────────
function buildOpenAITools() {
  return NEXUS_TOOLS.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: {
        type: "object",
        properties: Object.fromEntries(
          Object.entries(t.parameters || {}).map(([k, v]) => [k, { type: v.type, description: v.description }])
        ),
        required: Object.entries(t.parameters || {})
          .filter(([, v]) => v.required)
          .map(([k]) => k),
      },
    },
  }));
}

// ─── Build Gemini-format function declarations ─────────────────────────────
function buildGeminiFunctionDeclarations() {
  return NEXUS_TOOLS.map((t) => {
    const properties: Record<string, { type: string; description: string }> = {};
    for (const [k, v] of Object.entries(t.parameters || {})) {
      properties[k] = { type: v.type.toUpperCase(), description: v.description };
    }
    return {
      name: t.name,
      description: t.description,
      parameters: Object.keys(properties).length > 0
        ? { type: "OBJECT", properties, required: Object.entries(t.parameters || {}).filter(([, v]) => v.required).map(([k]) => k) }
        : undefined,
    };
  });
}

// ─── Execute a tool call against the NEXUS backend ─────────────────────────
async function executeToolCall(
  toolName: string,
  args: Record<string, string>,
  backendBaseUrl: string,
  authToken: string
): Promise<string> {
  const tool = NEXUS_TOOLS.find((t) => t.name === toolName);
  if (!tool) return JSON.stringify({ error: `Unknown tool: ${toolName}` });

  let endpoint = tool.endpoint;
  // Replace path parameters like {serverId}
  for (const [key, value] of Object.entries(args)) {
    endpoint = endpoint.replace(`{${key}}`, encodeURIComponent(value));
  }

  const url = `${backendBaseUrl}${endpoint}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return JSON.stringify({ error: `API returned HTTP ${res.status}`, endpoint });
    }

    const data = await res.json();

    // Truncate large arrays to prevent token overflow
    if (Array.isArray(data) && data.length > 50) {
      return JSON.stringify({
        totalCount: data.length,
        showing: "first 50 items",
        data: data.slice(0, 50),
      });
    }

    return JSON.stringify(data);
  } catch (err: any) {
    return JSON.stringify({ error: err.message || "Failed to reach backend API", endpoint });
  }
}

// ─── Parse SSE streaming response ──────────────────────────────────────────
function parseSSEResponse(rawText: string): string {
  const lines = rawText.split("\n");
  let fullContent = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ")) continue;
    const payload = trimmed.slice(6);
    if (payload === "[DONE]") break;
    try {
      const chunk = JSON.parse(payload);
      const full = chunk.choices?.[0]?.message?.content;
      if (full) return full;
      const delta = chunk.choices?.[0]?.delta?.content || "";
      fullContent += delta;
    } catch {
      // skip malformed SSE lines
    }
  }
  return fullContent;
}

// ─── Interfaces ────────────────────────────────────────────────────────────
interface ChatPayload {
  message: string;
  history?: any[];
  model?: string;
  provider?: "gemini" | "openai" | "ollama" | "custom";
  baseUrl?: string;
  apiKey?: string;
  geminiApiKey?: string;
  authToken?: string;
  backendBaseUrl?: string;
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
  authToken?: string;
  backendBaseUrl?: string;
}

// ─── Check if an error indicates tools/functions are not supported ──────────
function isToolNotSupportedError(errorText: string): boolean {
  const lower = errorText.toLowerCase();
  // Match specific phrases that indicate the model/endpoint does not support tool calling.
  // Avoid matching generic mentions of "tool" or "function" in unrelated errors
  // (e.g., rate limits, invalid tool_call_id references).
  return (
    lower.includes("does not support tools") ||
    lower.includes("does not support function") ||
    lower.includes("tools is not supported") ||
    lower.includes("tool_choice is not supported") ||
    lower.includes("functions is not supported") ||
    lower.includes("unrecognized request argument: tools") ||
    lower.includes("unrecognized request argument: tool_choice") ||
    lower.includes("unknown parameter: tools") ||
    lower.includes("unknown parameter: tool_choice") ||
    lower.includes("does not support 'tools'") ||
    lower.includes("does not support 'functions'") ||
    (lower.includes("not supported") && lower.includes("tool_choice")) ||
    (lower.includes("not supported") && lower.includes("tools"))
  );
}

// ─── OpenAI-compatible agentic call (Custom / Ollama / OpenAI) ─────────────
async function callOpenAICompatibleAgentic({
  baseUrl = "http://localhost:11434/v1",
  apiKey,
  model,
  messages,
  systemPrompt,
  backendBaseUrl,
  authToken,
}: {
  baseUrl?: string;
  apiKey?: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  systemPrompt: string;
  backendBaseUrl?: string;
  authToken?: string;
}) {
  const cleanUrl = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
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

  const hasBackend = backendBaseUrl && authToken;
  const tools = hasBackend ? buildOpenAITools() : undefined;

  // ── Pass 1: Send message with tool definitions ──
  const body: any = {
    model,
    messages: formattedMessages,
    temperature: 0.3,
    stream: false,
  };
  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  let res: Response;
  try {
    res = await fetch(cleanUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err: any) {
    throw new Error(`Failed to connect to AI Gateway: ${err.message || "Network error"}`);
  }

  // ── Graceful tool-calling fallback ──
  // If the API returns an error that indicates tools are not supported,
  // retry the request without tools/tool_choice
  if (!res.ok) {
    const errText = await res.text();
    if ((res.status === 400 || res.status === 422) && tools && isToolNotSupportedError(errText)) {
      // Retry without tools
      const fallbackBody: any = {
        model,
        messages: formattedMessages,
        temperature: 0.3,
        stream: false,
      };
      const fallbackRes = await fetch(cleanUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(fallbackBody),
      });
      if (!fallbackRes.ok) {
        const fallbackErr = await fallbackRes.text();
        throw new Error(`AI Gateway returned HTTP ${fallbackRes.status}: ${fallbackErr.slice(0, 300)}`);
      }
      const fallbackRaw = await fallbackRes.text();
      const ct = fallbackRes.headers.get("content-type") || "";
      if (ct.includes("text/event-stream") || fallbackRaw.trimStart().startsWith("data: ")) {
        return parseSSEResponse(fallbackRaw) || "No response received from AI model.";
      }
      const fallbackJson = JSON.parse(fallbackRaw);
      return fallbackJson.choices?.[0]?.message?.content || "No response received from AI model.";
    }
    throw new Error(`AI Gateway returned HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  // Handle SSE responses
  const contentType = res.headers.get("content-type") || "";
  const rawText = await res.text();

  if (contentType.includes("text/event-stream") || rawText.trimStart().startsWith("data: ")) {
    const parsed = parseSSEResponse(rawText);
    return parsed || "No response received from AI model.";
  }

  const firstResponse = JSON.parse(rawText);
  const firstChoice = firstResponse.choices?.[0];

  // If no tool calls, return the direct response
  if (!firstChoice?.message?.tool_calls || firstChoice.message.tool_calls.length === 0) {
    return firstChoice?.message?.content || "No response received from AI model.";
  }

  // ── Execute tool calls against NEXUS backend ──
  const toolCalls = firstChoice.message.tool_calls.slice(0, 5); // max 5
  const toolMessages: any[] = [];

  for (const tc of toolCalls) {
    const fnName = tc.function?.name || "";
    let fnArgs: Record<string, string> = {};
    try {
      fnArgs = JSON.parse(tc.function?.arguments || "{}");
    } catch {}

    const result = await executeToolCall(fnName, fnArgs, backendBaseUrl!, authToken!);
    toolMessages.push({
      role: "tool",
      tool_call_id: tc.id,
      content: result,
    });
  }

  // ── Pass 2: Send tool results back to AI ──
  const pass2Messages = [
    ...formattedMessages,
    firstChoice.message, // assistant message with tool_calls
    ...toolMessages,
  ];

  const res2 = await fetch(cleanUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: pass2Messages,
      temperature: 0.3,
      stream: false,
    }),
  });

  if (!res2.ok) {
    // If pass 2 fails, return a summary of the tool results
    const summaries = toolMessages.map((tm) => tm.content).join("\n\n");
    return `I fetched data from your infrastructure but couldn't generate a summary. Raw data:\n\n${summaries.slice(0, 3000)}`;
  }

  const rawText2 = await res2.text();
  const ct2 = res2.headers.get("content-type") || "";
  if (ct2.includes("text/event-stream") || rawText2.trimStart().startsWith("data: ")) {
    return parseSSEResponse(rawText2) || "No response received from AI model.";
  }

  const secondResponse = JSON.parse(rawText2);
  return secondResponse.choices?.[0]?.message?.content || "No response received from AI model.";
}

// ─── Gemini REST API agentic call ──────────────────────────────────────────
async function callGeminiAgenticEndpoint({
  apiKey,
  model = "gemini-2.5-flash",
  messages,
  systemPrompt,
  backendBaseUrl,
  authToken,
}: {
  apiKey: string;
  model?: string;
  messages: Array<{ role: string; content: string }>;
  systemPrompt: string;
  backendBaseUrl?: string;
  authToken?: string;
}) {
  const selectedModel = model && model.trim() ? model.trim() : "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey.trim()}`;

  const formattedContents = messages.map((m) => ({
    role: m.role === "model" || m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content || "" }],
  }));

  const hasBackend = backendBaseUrl && authToken;

  const body: any = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: formattedContents,
    generationConfig: { temperature: 0.3 },
  };

  if (hasBackend) {
    body.tools = [{ function_declarations: buildGeminiFunctionDeclarations() }];
  }

  // ── Pass 1 ──
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API returned HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const json = await res.json();
  const candidate = json.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  // Check for function calls
  const functionCalls = parts.filter((p: any) => p.functionCall);

  if (functionCalls.length === 0) {
    const textPart = parts.find((p: any) => p.text);
    return textPart?.text || "No response received from Gemini.";
  }

  // ── Execute function calls ──
  const functionResponses: any[] = [];
  for (const fc of functionCalls.slice(0, 5)) {
    const fnName = fc.functionCall.name;
    const fnArgs = fc.functionCall.args || {};
    const result = await executeToolCall(fnName, fnArgs, backendBaseUrl!, authToken!);
    let parsedResult: any;
    try { parsedResult = JSON.parse(result); } catch { parsedResult = { raw: result }; }
    functionResponses.push({
      functionResponse: { name: fnName, response: parsedResult },
    });
  }

  // ── Pass 2: Send function results back ──
  const pass2Body: any = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [
      ...formattedContents,
      { role: "model", parts: functionCalls.map((fc: any) => ({ functionCall: fc.functionCall })) },
      { role: "user", parts: functionResponses },
    ],
    generationConfig: { temperature: 0.3 },
  };

  const res2 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pass2Body),
  });

  if (!res2.ok) {
    const summaries = functionResponses.map((fr) => JSON.stringify(fr.functionResponse.response)).join("\n");
    return `Fetched infrastructure data but couldn't summarize. Raw:\n\n${summaries.slice(0, 3000)}`;
  }

  const json2 = await res2.json();
  const text2 = json2.candidates?.[0]?.content?.parts?.[0]?.text;
  return text2 || "No response received from Gemini after tool execution.";
}

// ─── Server Functions ──────────────────────────────────────────────────────
export const sendCopilotChatFn = createServerFn({ method: "POST" })
  .inputValidator((data: ChatPayload) => data)
  .handler(async ({ data }) => {
    const {
      message,
      history = [],
      provider = "gemini",
      baseUrl = "http://localhost:11434/v1",
      apiKey: customKey,
      geminiApiKey,
      model = "gemini-2.5-flash",
      authToken,
      backendBaseUrl,
    } = data;

    // Handle OpenAI-compatible, Ollama (CPU self-hosted), or Custom Endpoints
    if (provider === "openai" || provider === "ollama" || provider === "custom") {
      try {
        const effectiveModel = model || (provider === "ollama" ? "llama3.2:1b" : provider === "openai" ? "gpt-4o-mini" : "");
        if (!effectiveModel) {
          return { reply: `⚠️ [${provider.toUpperCase()}] No model configured. Please set a model name in Settings for your custom endpoint.` };
        }
        const reply = await callOpenAICompatibleAgentic({
          baseUrl: provider === "openai" ? "https://api.openai.com/v1" : baseUrl,
          apiKey: customKey || undefined,
          model: effectiveModel,
          messages: [...history, { role: "user", content: message }],
          systemPrompt: NEXUS_COPILOT_SYSTEM_PROMPT,
          backendBaseUrl,
          authToken,
        });
        return { reply };
      } catch (err: any) {
        console.error("OpenAI/Ollama Chat Error:", err);
        return { reply: `\u26a0\ufe0f [${provider.toUpperCase()}] Endpoint error: ${err.message || "Failed to reach AI model gateway"}` };
      }
    }

    // Default: Gemini Provider via Direct REST API
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

      const reply = await callGeminiAgenticEndpoint({
        apiKey,
        model: model || "gemini-2.5-flash",
        messages: [...formattedHistory, { role: "user", content: message }],
        systemPrompt: NEXUS_COPILOT_SYSTEM_PROMPT,
        backendBaseUrl,
        authToken,
      });

      return { reply };
    } catch (err: any) {
      console.error("Gemini Chat Error:", err);
      return { reply: `\u26a0\ufe0f [GEMINI] Error: ${err.message || "Failed to query Gemini AI"}` };
    }
  });

export const runCopilotAnalyzeFn = createServerFn({ method: "POST" })
  .inputValidator((data: AnalyzePayload) => data)
  .handler(async ({ data }) => {
    const {
      type,
      data: payload,
      context = "",
      provider = "gemini",
      baseUrl = "http://localhost:11434/v1",
      apiKey: customKey,
      geminiApiKey,
      model = "gemini-2.5-flash",
      authToken,
      backendBaseUrl,
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
        const effectiveModel = model || (provider === "ollama" ? "llama3.2:1b" : provider === "openai" ? "gpt-4o-mini" : "");
        if (!effectiveModel) {
          return { analysis: `⚠️ [${provider.toUpperCase()}] No model configured. Please set a model name in Settings for your custom endpoint.` };
        }
        const analysis = await callOpenAICompatibleAgentic({
          baseUrl: provider === "openai" ? "https://api.openai.com/v1" : baseUrl,
          apiKey: customKey || undefined,
          model: effectiveModel,
          messages: [{ role: "user", content: prompt }],
          systemPrompt: NEXUS_COPILOT_SYSTEM_PROMPT,
          backendBaseUrl,
          authToken,
        });
        return { analysis };
      } catch (err: any) {
        console.error("OpenAI/Ollama Analyze Error:", err);
        return { analysis: `\u26a0\ufe0f [${provider.toUpperCase()}] Analysis error: ${err.message || "Failed to analyze data"}` };
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

      const analysis = await callGeminiAgenticEndpoint({
        apiKey,
        model: selectedModel,
        messages: [{ role: "user", content: prompt }],
        systemPrompt: NEXUS_COPILOT_SYSTEM_PROMPT,
        backendBaseUrl,
        authToken,
      });

      return { analysis };
    } catch (err: any) {
      console.error("Gemini Analyze Error:", err);
      return { analysis: `Error running analysis: ${err.message || "Failed to analyze data"}` };
    }
  });
