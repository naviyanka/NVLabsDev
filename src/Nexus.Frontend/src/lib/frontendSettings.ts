export interface ScriptTemplate {
  id: string;
  name: string;
  category?: string;
  command: string;
  enabled: boolean;
}

export interface FrontendSettings {
  theme: string;
  terminalTheme: string;
  animationsEnabled: boolean;
  appName: string;
  appSubtitle: string;
  companyLogoUrl: string;
  sidebarState: string;
  autoRefreshInterval?: number;
  scriptTemplates?: ScriptTemplate[];
  copilotEnabled?: boolean;
  geminiApiKey?: string;
}

const STORAGE_KEY = "nexus-frontend-settings";

const defaultScriptTemplates: ScriptTemplate[] = [
  { id: "1", name: "Audit Local Admins", category: "Security", command: "Get-LocalGroupMember -Group 'Administrators'\r", enabled: true },
  { id: "2", name: "Active Network Connections", category: "Network", command: "Get-NetTCPConnection -State Established | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State -First 15\r", enabled: true },
  { id: "3", name: "Installed Windows Features", category: "System", command: "Get-WindowsFeature | Where-Object Installed | Select-Object Name, DisplayName -First 15\r", enabled: true },
  { id: "4", name: "Top Memory Processes", category: "Performance", command: "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 10 Name, Id, @{N='RAM_MB';E={[math]::Round($_.WorkingSet64/1MB,1)}}\r", enabled: true },
  { id: "5", name: "Disk Free Space", category: "Storage", command: "Get-Volume | Select-Object DriveLetter, FileSystemLabel, SizeRemaining, Size\r", enabled: true }
];

const defaultSettings: FrontendSettings = {
  theme: "horizon",
  terminalTheme: "stealth",
  animationsEnabled: true,
  appName: "NEXUS",
  appSubtitle: "Horizon UI Shell",
  companyLogoUrl: "",
  sidebarState: "expanded",
  autoRefreshInterval: 30,
  scriptTemplates: defaultScriptTemplates,
  copilotEnabled: true,
  geminiApiKey: ""
};

export function getFrontendSettings(): FrontendSettings {
  if (typeof window === "undefined") return defaultSettings;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { 
        ...defaultSettings, 
        ...parsed,
        scriptTemplates: parsed.scriptTemplates && parsed.scriptTemplates.length > 0 ? parsed.scriptTemplates : defaultScriptTemplates
      };
    }
  } catch (e) {
    console.warn("Failed to parse frontend settings from localStorage", e);
  }
  
  return defaultSettings;
}

export function saveFrontendSettings(updates: Partial<FrontendSettings>) {
  if (typeof window === "undefined") return;

  const current = getFrontendSettings();
  const next = { ...current, ...updates };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    
    // Dispatch events for immediate UI updates
    if (updates.theme) {
      document.documentElement.setAttribute("data-theme", next.theme);
      try { localStorage.setItem("nexus-theme", next.theme); } catch(e) {}
      window.dispatchEvent(new CustomEvent("nexus-theme-change", { detail: { theme: next.theme } }));
    }
    
    if (updates.terminalTheme) {
      document.documentElement.setAttribute("data-terminal-theme", next.terminalTheme);
      try { localStorage.setItem("nexus-terminal-theme", next.terminalTheme); } catch(e) {}
      window.dispatchEvent(new CustomEvent("nexus-terminal-theme-change", { detail: { theme: next.terminalTheme } }));
    }

    if (updates.scriptTemplates) {
      window.dispatchEvent(new CustomEvent("nexus-scripts-change", { detail: { scriptTemplates: next.scriptTemplates } }));
    }
    
    if (updates.animationsEnabled !== undefined) {
      try { localStorage.setItem("nexus-animations", next.animationsEnabled ? "true" : "false"); } catch(e) {}
      if (!next.animationsEnabled) {
        document.documentElement.classList.add("no-animations");
      } else {
        document.documentElement.classList.remove("no-animations");
      }
    }

    if (updates.appName !== undefined || updates.appSubtitle !== undefined) {
      window.dispatchEvent(new CustomEvent("nexus-branding-change", { 
        detail: { appName: next.appName, appSubtitle: next.appSubtitle } 
      }));
    }

    if (updates.copilotEnabled !== undefined || updates.geminiApiKey !== undefined) {
      window.dispatchEvent(new CustomEvent("nexus-copilot-change", {
        detail: { copilotEnabled: next.copilotEnabled, geminiApiKey: next.geminiApiKey }
      }));
    }
  } catch (e) {
    console.error("Failed to save frontend settings", e);
  }
}

export function initFrontendSettings() {
  if (typeof window === "undefined") return;
  
  const settings = getFrontendSettings();
  
  // Apply initial HTML attributes
  document.documentElement.setAttribute("data-theme", settings.theme);
  document.documentElement.setAttribute("data-terminal-theme", settings.terminalTheme);
  
  if (!settings.animationsEnabled) {
    document.documentElement.classList.add("no-animations");
  } else {
    document.documentElement.classList.remove("no-animations");
  }
}
