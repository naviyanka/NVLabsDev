import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, createContext, type ReactNode } from "react";
import { Toaster, toast } from "sonner";
import { HorizonLayout } from "../themes/horizon/HorizonLayout";

import appCss from "../styles.css?url";
import darkCssUrl from "../themes/dark/dark.css?url";
import lightCssUrl from "../themes/light/light.css?url";
import slateCssUrl from "../themes/slate/slate.css?url";
import stealthCssUrl from "../themes/stealth/stealth.css?url";
import cyberpunkCssUrl from "../themes/cyberpunk/cyberpunk.css?url";
import infraredCssUrl from "../themes/infrared/infrared.css?url";
import horizonCssUrl from "../themes/horizon/horizon.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getApiUrl, getBackendUrl } from "@/lib/backend";

if (typeof window !== "undefined") {
  if ((window as any).__nexus_backend_online === undefined) {
    (window as any).__nexus_backend_online = true;
  }

  (window as any).__nexus_set_backend_offline = (method?: string) => {
    const wasOnline = (window as any).__nexus_backend_online;
    (window as any).__nexus_backend_online = false;
    
    if (wasOnline) {
      toast.error("Connection to backend lost. Running in offline mode.");
    } else if (method && method.toUpperCase() !== "GET") {
      toast.error("Backend is dead/unreachable. Action failed.");
    }
    
    window.dispatchEvent(new CustomEvent("nexus-backend-status", { detail: { online: false } }));
  };

  (window as any).__nexus_set_backend_online = () => {
    const wasOffline = !(window as any).__nexus_backend_online;
    (window as any).__nexus_backend_online = true;
    
    if (wasOffline) {
      toast.success("Backend connection restored.");
    }
    
    window.dispatchEvent(new CustomEvent("nexus-backend-status", { detail: { online: true } }));
  };
}

if (typeof window !== "undefined" && !(window as any).__nexus_fetch_patched) {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    let requestUrl = "";
    if (typeof input === "string") {
      requestUrl = input;
    } else if (input instanceof Request) {
      requestUrl = input.url;
    }

    const token = localStorage.getItem("nexus_token");
    
    if (token && (requestUrl.includes("/api/") || requestUrl.includes("/hub/"))) {
      if (input instanceof Request) {
        try {
          input.headers.set("Authorization", `Bearer ${token}`);
        } catch (e) {
          const newHeaders = new Headers(input.headers);
          newHeaders.set("Authorization", `Bearer ${token}`);
          input = new Request(input, { headers: newHeaders });
        }
      } else {
        if (!init) init = {};
        if (!init.headers) init.headers = {};
        const newHeaders = new Headers(init.headers);
        newHeaders.set("Authorization", `Bearer ${token}`);
        init.headers = newHeaders;
      }
    }

    let method = "GET";
    if (init?.method) {
      method = init.method;
    } else if (input instanceof Request) {
      method = input.method;
    }

    const backendUrl = getBackendUrl();
    const isApiRequest = requestUrl.includes("/api/") || requestUrl.includes("/hub/");
    
    // STRICT MODE: If no backend URL is configured, block all API requests
    if (!backendUrl && isApiRequest) {
      if ((window as any).__nexus_backend_online !== false) {
        (window as any).__nexus_set_backend_offline(method);
      }
      throw new TypeError("Backend disconnected (no URL configured in settings)");
    }

    const isHealthCheck = requestUrl.includes("/api/health");
    if (!(window as any).__nexus_backend_online && !isHealthCheck) {
      (window as any).__nexus_set_backend_offline(method);
      throw new TypeError("Failed to fetch (backend offline)");
    }

    try {
      const response = await originalFetch(input, init);
      
      if (response.status >= 500) {
        (window as any).__nexus_set_backend_offline(method);
      } else {
        (window as any).__nexus_set_backend_online();
      }

      if (response.status === 401 && window.location.pathname !== "/login") {
        if (requestUrl.includes("/api/") || requestUrl.includes("/hub/")) {
          localStorage.removeItem("nexus_token");
          window.location.href = "/login";
        }
      }
      
      return response;
    } catch (error) {
      (window as any).__nexus_set_backend_offline(method);
      throw error;
    }
  };
  (window as any).__nexus_fetch_patched = true;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-void)] px-4">
      <div className="max-w-md text-center">
        <div className="eyebrow pb-2">Error 404</div>
        <h1 className="display text-6xl font-bold text-[var(--amber)]">Lost in transit</h1>
        <p className="mt-3 text-sm text-[var(--text-sub)]">
          That route doesn't exist in the NEXUS topology.
        </p>
        <a href="/" className="mono mt-6 inline-block rounded-md border border-[var(--amber)] bg-[var(--amber-low)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--amber)] hover:bg-[var(--amber)]/15">
          ← Dashboard
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-void)] px-4">
      <div className="max-w-md text-center">
        <div className="eyebrow pb-2" style={{ color: "var(--crit)" }}>Critical Fault</div>
        <h1 className="display text-2xl font-semibold text-[var(--text)]">This panel didn't load</h1>
        <p className="mt-2 text-sm text-[var(--text-sub)]">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="mono rounded-md border border-[var(--amber)] bg-[var(--amber-low)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--amber)]"
          >
            Retry
          </button>
          <a href="/" className="mono rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--text-sub)]">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const ThemeContext = createContext<{ theme: string; setTheme: (t: string) => void }>({ theme: 'dark', setTheme: () => {} });

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NEXUS — Network EXecution & Unified Server-hub" },
      { name: "description", content: "Agentless Windows Server management platform." },
      { name: "author", content: "NEXUS Labs" },
      { property: "og:title", content: "NEXUS — Network EXecution & Unified Server-hub" },
      { property: "og:description", content: "Agentless Windows Server management platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "NEXUS — Network EXecution & Unified Server-hub" },
      { name: "twitter:description", content: "Agentless Windows Server management platform." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/91383599-2ab4-4880-ba55-a8c786a77339/id-preview-03466580--09846341-0ff1-4936-bf6d-bc9f4712b7e9.lovable.app-1781526245745.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/91383599-2ab4-4880-ba55-a8c786a77339/id-preview-03466580--09846341-0ff1-4936-bf6d-bc9f4712b7e9.lovable.app-1781526245745.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: darkCssUrl },
      { rel: "stylesheet", href: lightCssUrl },
      { rel: "stylesheet", href: slateCssUrl },
      { rel: "stylesheet", href: stealthCssUrl },
      { rel: "stylesheet", href: cyberpunkCssUrl },
      { rel: "stylesheet", href: infraredCssUrl },
      { rel: "stylesheet", href: horizonCssUrl },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Anti-FOUC: apply cached theme BEFORE first paint so there is zero flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('nexus-theme');
              if (t) document.documentElement.setAttribute('data-theme', t);
              else document.documentElement.setAttribute('data-theme', 'horizon');
              
              var tt = localStorage.getItem('nexus-terminal-theme');
              if (tt) document.documentElement.setAttribute('data-terminal-theme', tt);
            } catch(e) {}
          })();
        ` }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const isLoginPage = useRouterState({ select: (s) => s.location.pathname === "/login" });
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem('nexus-theme') || 'horizon';
    }
    return 'horizon';
  });

  useEffect(() => {
    const handleThemeChange = (e: CustomEvent) => {
      const t = e.detail?.theme;
      if (t) {
        setTheme(t);
        document.documentElement.setAttribute('data-theme', t);
      }
    };
    window.addEventListener('nexus-theme-change' as any, handleThemeChange as any);

    fetch(getApiUrl("/settings"))
      .then(res => res.json())
      .then(data => {
        // Apply app theme
        if (data.theme) {
          setTheme(data.theme);
          document.documentElement.setAttribute("data-theme", data.theme);
          try { localStorage.setItem("nexus-theme", data.theme); } catch(e) {}
        }
        
        if (data.terminalTheme) {
          document.documentElement.setAttribute("data-terminal-theme", data.terminalTheme);
          try { localStorage.setItem("nexus-terminal-theme", data.terminalTheme); } catch(e) {}
        }

        if (data.animationsEnabled !== undefined) {
          try { localStorage.setItem("nexus-animations", data.animationsEnabled ? "true" : "false"); } catch(e) {}
          if (!data.animationsEnabled) {
            document.documentElement.classList.add("no-animations");
          } else {
            document.documentElement.classList.remove("no-animations");
          }
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('nexus-theme-change' as any, handleThemeChange as any);
    };
  }, []);

  useEffect(() => {
    const pollHealth = () => {
      const backendUrl = getBackendUrl();
      
      if (!backendUrl) {
        if ((window as any).__nexus_backend_online !== false) {
          (window as any).__nexus_set_backend_offline("GET");
        }
        return;
      }
      
      const healthUrl = `${backendUrl}/api/health`;
      fetch(healthUrl)
        .then(res => {
          if (res.status < 500) {
            (window as any).__nexus_set_backend_online();
          } else {
            (window as any).__nexus_set_backend_offline("GET");
          }
        })
        .catch(() => {
          (window as any).__nexus_set_backend_offline("GET");
        });
    };

    pollHealth();
    const interval = setInterval(pollHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoginPage) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeContext.Provider value={{ theme, setTheme }}>
          <Outlet />
          <Toaster theme="dark" position="top-right" richColors />
        </ThemeContext.Provider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <HorizonLayout>
          <Outlet />
        </HorizonLayout>
        <Toaster theme="light" position="top-right" richColors />
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}
