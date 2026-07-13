import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Shield, Server, KeyRound, User, Lock, Building, Settings2 } from "lucide-react";
import { getApiUrl, getFullUrl, getBackendUrl, setBackendUrl, clearBackendUrl, testBackendConnection } from "@/lib/backend";



export function HorizonLogin() {
  const [brandName, setBrandName] = useState("NEXUS");
  useEffect(() => {
    fetch(getApiUrl("/settings")).then(r => r.json()).then(s => {
      if (s.appName) setBrandName(s.appName);
    }).catch(()=>{});
  }, []);

  const [scope, setScope] = useState<"domain" | "local">("domain");
  const [domain, setDomain] = useState("nvlabs.com");
  const [username, setUsername] = useState("OrgAdmin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [backendInput, setBackendInput] = useState(getBackendUrl());
  const [backendStatus, setBackendStatus] = useState<"unknown" | "testing" | "success" | "error">("unknown");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(getApiUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, domain, username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("nexus_token", data.token);
        localStorage.setItem("nexus-user", JSON.stringify({ 
          username, 
          role: username.toLowerCase() === 'admin' || username.toLowerCase() === 'orgadmin' ? 'Administrator' : 'Operator',
          loginTime: new Date().toISOString()
        }));
        toast.success("Authentication successful");
        navigate({ to: "/" });
      } else {
        toast.error(data.message || "Authentication failed");
      }
    } catch (err) {
      toast.error("Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-void)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-c)] shadow-xl mb-4">
            <Shield className="text-[var(--amber)]" size={32} />
          </div>
          <h1 className="display text-3xl font-bold tracking-tight text-[var(--text)]">{brandName} Security</h1>
          <p className="mt-2 text-sm text-[var(--text-sub)]">Sign in with Administrator privileges</p>
        </div>

        <div className="nx-card p-6 shadow-2xl">
          <div className="flex p-1 bg-[var(--bg-void)] rounded-lg mb-6 border border-[var(--border-c)]">
            <button
              onClick={() => setScope("domain")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                scope === "domain"
                  ? "bg-[var(--bg-card)] text-[var(--text)] shadow-sm border border-[var(--border-c)]"
                  : "text-[var(--text-sub)] hover:text-[var(--text)] border border-transparent"
              }`}
            >
              <Building size={16} />
              Manage Domain
            </button>
            <button
              onClick={() => setScope("local")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                scope === "local"
                  ? "bg-[var(--bg-card)] text-[var(--text)] shadow-sm border border-[var(--border-c)]"
                  : "text-[var(--text-sub)] hover:text-[var(--text)] border border-transparent"
              }`}
            >
              <Server size={16} />
              Local Computer
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {scope === "domain" && (
              <div>
                <label className="eyebrow block mb-1.5">Domain Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" size={16} />
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    required
                    className="w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none transition-colors"
                    placeholder="CORP.LOCAL"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="eyebrow block mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" size={16} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none transition-colors"
                  placeholder="Administrator"
                />
              </div>
            </div>

            <div>
              <label className="eyebrow block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none transition-colors"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-2 rounded-md border border-[var(--amber)] bg-[var(--amber-low)] py-2.5 text-sm font-semibold tracking-wide text-[var(--amber)] transition-colors hover:bg-[var(--amber)] hover:text-[var(--bg-void)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--amber)] border-t-transparent" />
                  Authenticating...
                </span>
              ) : (
                <>
                  <KeyRound size={16} />
                  Authorize Access
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-xs text-[var(--text-sub)] opacity-60">
          {brandName} Management Hub requires Administrative privileges. <br />
          Unauthorized access is strictly prohibited.
        </p>
      </div>

      {/* Backend Config Panel */}
      <div className="absolute bottom-6 right-6">
        {showConfig ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-dim)] p-5 rounded-lg shadow-xl w-[320px] animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-semibold text-sm mb-3 text-[var(--text)] flex justify-between items-center">
              Backend Connection
              {backendStatus === "testing" && <span className="text-xs text-[var(--amber)] animate-pulse">Testing...</span>}
              {backendStatus === "success" && <span className="text-xs text-[var(--ok)] font-medium">Connected</span>}
              {backendStatus === "error" && <span className="text-xs text-rose-400 font-medium">Failed</span>}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={backendInput}
                onChange={(e) => setBackendInput(e.target.value)}
                placeholder="https://xyz.ngrok-free.app"
                className="w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-xs focus:border-[var(--amber)] focus:outline-none"
              />
              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    setBackendStatus("testing");
                    const ok = await testBackendConnection(backendInput);
                    setBackendStatus(ok ? "success" : "error");
                  }}
                  className="px-3 py-1.5 text-xs rounded border border-[var(--border-c)] hover:bg-[var(--bg-surface)] text-[var(--text)]"
                >
                  Test
                </button>
                <button 
                  onClick={() => {
                    if (!backendInput.trim()) clearBackendUrl();
                    else setBackendUrl(backendInput);
                    toast.success("Backend URL saved. Reloading...");
                    setTimeout(() => window.location.reload(), 1000);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded bg-[var(--amber)] text-black hover:bg-[var(--amber-low)] hover:text-[var(--amber)]"
                >
                  Save
                </button>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="px-3 py-1.5 text-xs rounded border border-[var(--border-c)] hover:bg-[var(--bg-surface)] text-[var(--text)]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-c)] hover:border-[var(--amber)]/50 text-xs text-[var(--text-sub)] transition-colors shadow-sm"
          >
            <Settings2 size={14} />
            Configure Server
          </button>
        )}
      </div>
    </div>
  );
}

