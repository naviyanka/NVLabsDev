import { createServerFn } from "@tanstack/react-start";

export const sendGeminiChatFn = createServerFn({ method: "POST" })
  .validator((data: { message: string; history?: any[]; model?: string; geminiApiKey?: string }) => data)
  .handler(async ({ data }) => {
    const { message, history = [], model = "gemini-3.6-flash", geminiApiKey } = data;
    const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        reply:
          "[Nexus Copilot] GEMINI_API_KEY is not set in environment settings. Please configure GEMINI_API_KEY to enable live Gemini AI queries.\n\nOffline response simulation: I am your Nexus Server Operations Copilot. How can I assist with your servers today?",
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
        model,
        contents: formattedContents,
        config: {
          systemInstruction:
            "You are Nexus AI Copilot, an expert Systems Administrator, DevOps Engineer, and Infrastructure Architect. You assist users in managing Windows Server, Linux hosts, Hyper-V VMs, PowerShell scripts, Active Directory, network firewalls, and system performance. Provide clear, well-formatted Markdown responses with code blocks where appropriate.",
        },
      });

      return { reply: response.text || "No response received from Gemini." };
    } catch (err: any) {
      console.error("Gemini Chat ServerFn Error:", err);
      return { reply: `Error from Gemini AI: ${err.message || "Failed to process query"}` };
    }
  });

export const runGeminiAnalyzeFn = createServerFn({ method: "POST" })
  .validator((data: { type: string; data: any; context?: string; model?: string; geminiApiKey?: string }) => data)
  .handler(async ({ data }) => {
    const { type, data: payload, context = "", model = "gemini-3.6-flash", geminiApiKey } = data;
    const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        analysis:
          "[Nexus AI Intelligence] GEMINI_API_KEY environment variable is missing. To enable live AI intelligence, please set GEMINI_API_KEY in project settings.\n\nSimulated Analysis: All servers are operational. CPU utilization is within acceptable limits. No critical security breaches detected.",
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

      const selectedModel = type === "powershell" ? "gemini-3.1-pro-preview" : model;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          systemInstruction:
            "You are an expert Systems Infrastructure Intelligence Engine. Provide concise, high-value, actionable diagnostic reports with bulleted root causes, impact, and concrete PowerShell/bash remediation scripts.",
        },
      });

      return { analysis: response.text || "No analysis generated." };
    } catch (err: any) {
      console.error("Gemini Analyze ServerFn Error:", err);
      return { analysis: `Error running Gemini analysis: ${err.message || "Failed to analyze data"}` };
    }
  });
