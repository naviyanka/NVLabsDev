import { i as __toESM } from "../_runtime.mjs";
import { Y as testBackendConnection, h as getBackendUrl, i as clearBackendUrl, p as getApiUrl, q as setBackendUrl } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { Ft as Building, K as Lock, T as Server, X as KeyRound, b as Shield, o as User, w as Settings2 } from "../_libs/lucide-react.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { s as ThemeContext } from "../__root-H47vz4C-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-wHviZBzX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function HorizonLogin() {
	const [brandName, setBrandName] = (0, import_react.useState)("NEXUS");
	(0, import_react.useEffect)(() => {
		fetch(getApiUrl("/settings")).then((r) => r.json()).then((s) => {
			if (s.appName) setBrandName(s.appName);
		}).catch(() => {});
	}, []);
	const [scope, setScope] = (0, import_react.useState)("domain");
	const [domain, setDomain] = (0, import_react.useState)("nvlabs.com");
	const [username, setUsername] = (0, import_react.useState)("OrgAdmin");
	const [password, setPassword] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [showConfig, setShowConfig] = (0, import_react.useState)(false);
	const [backendInput, setBackendInput] = (0, import_react.useState)(getBackendUrl());
	const [backendStatus, setBackendStatus] = (0, import_react.useState)("unknown");
	const navigate = useNavigate();
	const handleLogin = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			const res = await fetch(getApiUrl("/auth/login"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					scope,
					domain,
					username,
					password
				})
			});
			const data = await res.json();
			if (res.ok) {
				localStorage.setItem("nexus_token", data.token);
				localStorage.setItem("nexus-user", JSON.stringify({
					username,
					role: username.toLowerCase() === "admin" || username.toLowerCase() === "orgadmin" ? "Administrator" : "Operator",
					loginTime: (/* @__PURE__ */ new Date()).toISOString()
				}));
				toast.success("Authentication successful");
				navigate({ to: "/" });
			} else toast.error(data.message || "Authentication failed");
		} catch (err) {
			toast.error("Network error. Is the backend running?");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen items-center justify-center bg-[var(--bg-void)] px-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center mb-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-c)] shadow-xl mb-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, {
								className: "text-[var(--amber)]",
								size: 32
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "display text-3xl font-bold tracking-tight text-[var(--text)]",
							children: [brandName, " Security"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-[var(--text-sub)]",
							children: "Sign in with Administrator privileges"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "nx-card p-6 shadow-2xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex p-1 bg-[var(--bg-void)] rounded-lg mb-6 border border-[var(--border-c)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setScope("domain"),
							className: `flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${scope === "domain" ? "bg-[var(--bg-card)] text-[var(--text)] shadow-sm border border-[var(--border-c)]" : "text-[var(--text-sub)] hover:text-[var(--text)] border border-transparent"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building, { size: 16 }), "Manage Domain"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setScope("local"),
							className: `flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${scope === "local" ? "bg-[var(--bg-card)] text-[var(--text)] shadow-sm border border-[var(--border-c)]" : "text-[var(--text-sub)] hover:text-[var(--text)] border border-transparent"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, { size: 16 }), "Local Computer"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleLogin,
						className: "space-y-4",
						children: [
							scope === "domain" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "eyebrow block mb-1.5",
								children: "Domain Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building, {
									className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]",
									size: 16
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									value: domain,
									onChange: (e) => setDomain(e.target.value),
									required: true,
									className: "w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none transition-colors",
									placeholder: "CORP.LOCAL"
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "eyebrow block mb-1.5",
								children: "Username"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, {
									className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]",
									size: 16
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									value: username,
									onChange: (e) => setUsername(e.target.value),
									required: true,
									className: "w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none transition-colors",
									placeholder: "Administrator"
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "eyebrow block mb-1.5",
								children: "Password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
									className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]",
									size: 16
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "password",
									value: password,
									onChange: (e) => setPassword(e.target.value),
									required: true,
									className: "w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none transition-colors",
									placeholder: "••••••••••••"
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: loading,
								className: "w-full mt-6 flex items-center justify-center gap-2 rounded-md border border-[var(--amber)] bg-[var(--amber-low)] py-2.5 text-sm font-semibold tracking-wide text-[var(--amber)] transition-colors hover:bg-[var(--amber)] hover:text-[var(--bg-void)] disabled:opacity-50 disabled:cursor-not-allowed",
								children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 w-4 animate-spin rounded-full border-2 border-[var(--amber)] border-t-transparent" }), "Authenticating..."]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { size: 16 }), "Authorize Access"] })
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-8 text-center text-xs text-[var(--text-sub)] opacity-60",
					children: [
						brandName,
						" Management Hub requires Administrative privileges. ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"Unauthorized access is strictly prohibited."
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute bottom-6 right-6",
			children: showConfig ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-[var(--bg-card)] border border-[var(--border-dim)] p-5 rounded-lg shadow-xl w-[320px] animate-in fade-in slide-in-from-bottom-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
					className: "font-semibold text-sm mb-3 text-[var(--text)] flex justify-between items-center",
					children: [
						"Backend Connection",
						backendStatus === "testing" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-[var(--amber)] animate-pulse",
							children: "Testing..."
						}),
						backendStatus === "success" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-[var(--ok)] font-medium",
							children: "Connected"
						}),
						backendStatus === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-rose-400 font-medium",
							children: "Failed"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						value: backendInput,
						onChange: (e) => setBackendInput(e.target.value),
						placeholder: "https://xyz.ngrok-free.app",
						className: "w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-xs focus:border-[var(--amber)] focus:outline-none"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: async () => {
									setBackendStatus("testing");
									setBackendStatus(await testBackendConnection(backendInput) ? "success" : "error");
								},
								className: "px-3 py-1.5 text-xs rounded border border-[var(--border-c)] hover:bg-[var(--bg-surface)] text-[var(--text)]",
								children: "Test"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									if (!backendInput.trim()) clearBackendUrl();
									else setBackendUrl(backendInput);
									toast.success("Backend URL saved. Reloading...");
									setTimeout(() => window.location.reload(), 1e3);
								},
								className: "flex-1 px-3 py-1.5 text-xs font-medium rounded bg-[var(--amber)] text-black hover:bg-[var(--amber-low)] hover:text-[var(--amber)]",
								children: "Save"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowConfig(false),
								className: "px-3 py-1.5 text-xs rounded border border-[var(--border-c)] hover:bg-[var(--bg-surface)] text-[var(--text)]",
								children: "Close"
							})
						]
					})]
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setShowConfig(true),
				className: "flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-c)] hover:border-[var(--amber)]/50 text-xs text-[var(--text-sub)] transition-colors shadow-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { size: 14 }), "Configure Server"]
			})
		})]
	});
}
function LoginPage() {
	const { theme } = (0, import_react.useContext)(ThemeContext);
	if (theme === "horizon") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HorizonLogin, {});
	const [scope, setScope] = (0, import_react.useState)("domain");
	const [domain, setDomain] = (0, import_react.useState)("nvlabs.com");
	const [username, setUsername] = (0, import_react.useState)("OrgAdmin");
	const [password, setPassword] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [showConfig, setShowConfig] = (0, import_react.useState)(false);
	const [backendInput, setBackendInput] = (0, import_react.useState)(getBackendUrl());
	const [backendStatus, setBackendStatus] = (0, import_react.useState)("unknown");
	const navigate = useNavigate();
	const handleLogin = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			const res = await fetch(getApiUrl("/auth/login"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					scope,
					domain,
					username,
					password
				})
			});
			const data = await res.json();
			if (res.ok) {
				localStorage.setItem("nexus_token", data.token);
				toast.success("Authentication successful");
				navigate({ to: "/" });
			} else toast.error(data.message || "Authentication failed");
		} catch (err) {
			toast.error("Network error. Is the backend running?");
		} finally {
			setLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen items-center justify-center bg-[var(--bg-void)] px-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center mb-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-c)] shadow-xl mb-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, {
								className: "text-[var(--amber)]",
								size: 32
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "display text-3xl font-bold tracking-tight text-[var(--text)]",
							children: "NEXUS Security"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-[var(--text-sub)]",
							children: "Sign in with Administrator privileges"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "nx-card p-6 shadow-2xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex p-1 bg-[var(--bg-void)] rounded-lg mb-6 border border-[var(--border-c)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setScope("domain"),
							className: `flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${scope === "domain" ? "bg-[var(--bg-card)] text-[var(--text)] shadow-sm border border-[var(--border-c)]" : "text-[var(--text-sub)] hover:text-[var(--text)] border border-transparent"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building, { size: 16 }), "Manage Domain"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setScope("local"),
							className: `flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${scope === "local" ? "bg-[var(--bg-card)] text-[var(--text)] shadow-sm border border-[var(--border-c)]" : "text-[var(--text-sub)] hover:text-[var(--text)] border border-transparent"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, { size: 16 }), "Local Computer"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleLogin,
						className: "space-y-4",
						children: [
							scope === "domain" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "eyebrow block mb-1.5",
								children: "Domain Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building, {
									className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]",
									size: 16
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									value: domain,
									onChange: (e) => setDomain(e.target.value),
									required: true,
									className: "w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none transition-colors",
									placeholder: "CORP.LOCAL"
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "eyebrow block mb-1.5",
								children: "Username"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, {
									className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]",
									size: 16
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									value: username,
									onChange: (e) => setUsername(e.target.value),
									required: true,
									className: "w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none transition-colors",
									placeholder: "Administrator"
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "eyebrow block mb-1.5",
								children: "Password"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
									className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]",
									size: 16
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "password",
									value: password,
									onChange: (e) => setPassword(e.target.value),
									required: true,
									className: "w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none transition-colors",
									placeholder: "••••••••••••"
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: loading,
								className: "w-full mt-6 flex items-center justify-center gap-2 rounded-md border border-[var(--amber)] bg-[var(--amber-low)] py-2.5 text-sm font-semibold tracking-wide text-[var(--amber)] transition-colors hover:bg-[var(--amber)] hover:text-[var(--bg-void)] disabled:opacity-50 disabled:cursor-not-allowed",
								children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 w-4 animate-spin rounded-full border-2 border-[var(--amber)] border-t-transparent" }), "Authenticating..."]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { size: 16 }), "Authorize Access"] })
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-8 text-center text-xs text-[var(--text-sub)] opacity-60",
					children: [
						"NEXUS Management Hub requires Administrative privileges. ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"Unauthorized access is strictly prohibited."
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute bottom-6 right-6",
			children: showConfig ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-[var(--bg-card)] border border-[var(--border-dim)] p-5 rounded-lg shadow-xl w-[320px] animate-in fade-in slide-in-from-bottom-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
					className: "font-semibold text-sm mb-3 text-[var(--text)] flex justify-between items-center",
					children: [
						"Backend Connection",
						backendStatus === "testing" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-[var(--amber)] animate-pulse",
							children: "Testing..."
						}),
						backendStatus === "success" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-[var(--ok)] font-medium",
							children: "Connected"
						}),
						backendStatus === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-rose-400 font-medium",
							children: "Failed"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						value: backendInput,
						onChange: (e) => setBackendInput(e.target.value),
						placeholder: "https://xyz.ngrok-free.app",
						className: "w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-xs focus:border-[var(--amber)] focus:outline-none"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: async () => {
									setBackendStatus("testing");
									setBackendStatus(await testBackendConnection(backendInput) ? "success" : "error");
								},
								className: "px-3 py-1.5 text-xs rounded border border-[var(--border-c)] hover:bg-[var(--bg-surface)]",
								children: "Test"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									if (!backendInput.trim()) clearBackendUrl();
									else setBackendUrl(backendInput);
									toast.success("Backend URL saved. Reloading...");
									setTimeout(() => window.location.reload(), 1e3);
								},
								className: "flex-1 px-3 py-1.5 text-xs font-medium rounded bg-[var(--amber)] text-black hover:bg-[var(--amber-low)] hover:text-[var(--amber)]",
								children: "Save"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowConfig(false),
								className: "px-3 py-1.5 text-xs rounded border border-[var(--border-c)] hover:bg-[var(--bg-surface)]",
								children: "Close"
							})
						]
					})]
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setShowConfig(true),
				className: "flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-c)] hover:border-[var(--amber)]/50 text-xs text-[var(--text-sub)] transition-colors shadow-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { size: 14 }), "Configure Server"]
			})
		})]
	});
}
//#endregion
export { LoginPage as component };
