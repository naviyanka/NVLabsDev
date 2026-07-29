import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import React from "react";

const STORAGE_KEY = "nexus_selected_server";

interface ServerContextValue {
  server: string;
  setServer: (server: string) => void;
}

const ServerContext = createContext<ServerContextValue | undefined>(undefined);

export function ServerContextProvider({ children }: { children: ReactNode }) {
  const [server, setServerState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  const setServer = useCallback((value: string) => {
    setServerState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // localStorage unavailable
    }
  }, []);

  useEffect(() => {
    // Sync from localStorage on mount in case another tab changed it
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== server) {
      setServerState(stored);
    }
  }, []);

  return React.createElement(
    ServerContext.Provider,
    { value: { server, setServer } },
    children
  );
}

export function useServerContext(): ServerContextValue {
  const ctx = useContext(ServerContext);
  if (!ctx) {
    throw new Error("useServerContext must be used within a ServerContextProvider");
  }
  return ctx;
}
