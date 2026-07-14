import { createFileRoute } from "@tanstack/react-router";
import { getApiUrl } from "@/lib/backend";
import { useEffect, useState, useContext } from "react";
import { toast } from "sonner";
import { RefreshCw, Download } from "lucide-react";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { testNotificationClient } from "@/api/client";
import { HorizonSettings } from "../themes/horizon/pages/HorizonSettings";
import { getBackendUrl, setBackendUrl, clearBackendUrl, testBackendConnection } from "@/lib/backend";
import { ThemeContext } from "./__root";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Global Settings — NEXUS" }] }),
  component: GlobalSettingsPage,
});

const SECTIONS = [
  "General",
  "Appearance",
  "Security & Access",
  "Monitoring & Alerts",
  "Data & Maintenance",
  "Extensions",
  "Testing & Diagnostics",
  "Backend Logs"
] as const;

interface AppSettings {
  id: string;
  language: string;
  defaultLandingPage: string;
  autoRefreshInterval: number;
  theme: "dark" | "light" | "slate" | "stealth" | "cyberpunk" | "infrared" | "horizon";
  uiDensity: string;
  animationsEnabled: boolean;
  adSyncInterval: number;
  sessionTimeout: number;
  mfaRequired: boolean;
  cpuAlertThreshold: number;
  ramAlertThreshold: number;
  notificationEmail: string;
  webhookUrl: string;
  telemetryRetentionDays: number;
  logLevel: string;
  pluginCategories: string;
  terminalTheme: string;
}

const TERMINAL_THEMES: { id: string; name: string; bg: string; prompt: string; output: string; cursor: string }[] = [
  { id: "nexus-dark",   name: "Nexus Dark",     bg: "#050508", prompt: "#f59e0b", output: "#94a3b8", cursor: "#f59e0b" },
  { id: "win-classic", name: "Win Classic",    bg: "#0c0c0c", prompt: "#cccccc", output: "#cccccc", cursor: "#ffffff" },
  { id: "matrix",      name: "Matrix",         bg: "#020e02", prompt: "#00ff41", output: "#009921", cursor: "#00ff41" },
  { id: "solarized",   name: "Solarized Dark", bg: "#002b36", prompt: "#268bd2", output: "#839496", cursor: "#268bd2" },
  { id: "dracula",     name: "Dracula",         bg: "#282a36", prompt: "#ff79c6", output: "#f8f8f2", cursor: "#bd93f9" },
  { id: "cobalt",      name: "Cobalt Blue",    bg: "#001e3c", prompt: "#00bcd4", output: "#b0bec5", cursor: "#00bcd4" },
  { id: "monokai",     name: "Monokai",        bg: "#272822", prompt: "#e6db74", output: "#f8f8f2", cursor: "#a6e22e" },
  { id: "nord",        name: "Nord",           bg: "#2e3440", prompt: "#88c0d0", output: "#d8dee9", cursor: "#88c0d0" },
];

function GlobalSettingsPage() {
  return <HorizonSettings />;
}
