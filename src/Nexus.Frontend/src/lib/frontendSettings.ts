export interface FrontendSettings {
  theme: string;
  terminalTheme: string;
  animationsEnabled: boolean;
  appName: string;
  appSubtitle: string;
  companyLogoUrl: string;
  sidebarState: string;
}

const STORAGE_KEY = "nexus-frontend-settings";

const defaultSettings: FrontendSettings = {
  theme: "horizon",
  terminalTheme: "xterm",
  animationsEnabled: true,
  appName: "NEXUS",
  appSubtitle: "Horizon UI Shell",
  companyLogoUrl: "",
  sidebarState: "expanded",
};

export function getFrontendSettings(): FrontendSettings {
  if (typeof window === "undefined") return defaultSettings;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
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
