import { i as __toESM } from "../_runtime.mjs";
import { X as testNotificationClient, Y as testBackendConnection, h as getBackendUrl, i as clearBackendUrl, p as getApiUrl, q as setBackendUrl } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { A as RefreshCw, F as Plus, X as KeyRound, ct as FileCode, dt as Database, m as Terminal, p as Trash2, t as Zap, ut as Download, y as SlidersHorizontal, yt as CloudDownload, z as Palette } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { s as ThemeContext } from "../__root-H47vz4C-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-vrPuI_tt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function HorizonSettings() {
	const [s, setS] = (0, import_react.useState)(null);
	const [activeSection, setActiveSection] = (0, import_react.useState)("appearance");
	const [logs, setLogs] = (0, import_react.useState)([]);
	const [logsEnabled, setLogsEnabled] = (0, import_react.useState)(false);
	const [loadingLogs, setLoadingLogs] = (0, import_react.useState)(false);
	const [exportTimeFilter, setExportTimeFilter] = (0, import_react.useState)("all");
	const [backendInput, setBackendInput] = (0, import_react.useState)(getBackendUrl());
	const [backendStatus, setBackendStatus] = (0, import_react.useState)("unknown");
	const fetchLogs = () => {
		setLoadingLogs(true);
		fetch(getApiUrl("/settings/logs")).then((res) => res.json()).then((data) => {
			setLogs(data.logs || []);
			setLogsEnabled(data.enabled);
		}).catch(() => toast.error("Failed to fetch logs")).finally(() => setLoadingLogs(false));
	};
	(0, import_react.useEffect)(() => {
		let id;
		if (activeSection === "developer") {
			fetchLogs();
			id = setInterval(fetchLogs, 5e3);
		}
		return () => clearInterval(id);
	}, [activeSection]);
	(0, import_react.useEffect)(() => {
		fetch(getApiUrl("/settings")).then((res) => res.json()).then((data) => setS(data)).catch((err) => toast.error("Failed to load settings"));
	}, []);
	function patch(updates) {
		if (!s) return;
		const next = {
			...s,
			...updates
		};
		setS(next);
		if (updates.theme) {
			document.documentElement.setAttribute("data-theme", updates.theme);
			try {
				localStorage.setItem("nexus-theme", updates.theme);
			} catch (e) {}
			window.dispatchEvent(new CustomEvent("nexus-theme-change", { detail: { theme: updates.theme } }));
		}
		if (updates.terminalTheme) {
			document.documentElement.setAttribute("data-terminal-theme", updates.terminalTheme);
			try {
				localStorage.setItem("nexus-terminal-theme", updates.terminalTheme);
			} catch (e) {}
		}
		if (updates.appName !== void 0 || updates.appSubtitle !== void 0) window.dispatchEvent(new CustomEvent("nexus-branding-change", { detail: {
			appName: next.appName,
			appSubtitle: next.appSubtitle
		} }));
		fetch(getApiUrl("/settings"), {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(next)
		}).then((res) => {
			if (res.ok) toast.success("Settings saved successfully");
			else toast.error("Failed to save settings");
		});
	}
	if (!s) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-xs text-[var(--text-sub)]",
		children: "Loading Horizon Settings…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-6xl mx-auto space-y-8 font-sans",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-extrabold text-[var(--text)]",
				children: "Global Settings"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-[var(--text-sub)] mt-1",
				children: "Configure your Horizon environment, plugins, and system preferences."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-1 lg:grid-cols-12 gap-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden lg:block lg:col-span-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sticky top-[100px] flex flex-col gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveSection("appearance"),
							className: `flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${activeSection === "appearance" ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, { size: 20 }), "Appearance"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveSection("general"),
							className: `flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${activeSection === "general" ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { size: 20 }), "General"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveSection("developer"),
							className: `flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${activeSection === "developer" ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, { size: 20 }), "Developer"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveSection("plugins"),
							className: `flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${activeSection === "plugins" ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCode, { size: 20 }), "Plugins"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveSection("infrastructure"),
							className: `flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${activeSection === "infrastructure" ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, { size: 20 }), "Infrastructure"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveSection("alerting"),
							className: `flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${activeSection === "alerting" ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 20 }), "Alerting"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveSection("security"),
							className: `flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${activeSection === "security" ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { size: 20 }), "Admin & Security"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveSection("deployment"),
							className: `flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${activeSection === "deployment" ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudDownload, { size: 20 }), "Deployment"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveSection("ad"),
							className: `flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${activeSection === "ad" ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, { size: 20 }), "Active Directory"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveSection("automation"),
							className: `flex items-center gap-3 p-3 rounded-xl font-medium transition-colors w-full text-left text-sm ${activeSection === "automation" ? "bg-[var(--amber-low)] text-[var(--amber)] font-bold border border-[var(--amber)]/20" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { size: 20 }), "Automation"]
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:col-span-9 flex flex-col gap-8",
				children: [
					activeSection === "appearance" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--amber)] to-[var(--teal)]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 border-b border-[var(--border-c)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-lg font-bold flex items-center gap-2 text-[var(--text)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, {
										size: 20,
										className: "text-[var(--amber)]"
									}), "Appearance & Theme"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-[var(--text-sub)] mt-1",
									children: "Customize the visual interface and shell layout of your workspace."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "p-6 space-y-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-sm font-semibold text-[var(--text)] mb-4",
									children: "Theme Engine Mode"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
									children: [
										{
											id: "horizon",
											name: "🌅 Horizon Luminous Day",
											desc: "Warm coral primary, pure Luminous UI redesign",
											accent: "#ff5e3a"
										},
										{
											id: "dark",
											name: "Signal Room (Dark)",
											desc: "Classic dark mode for low-light environments",
											accent: "#e8a020"
										},
										{
											id: "light",
											name: "Pure Light",
											desc: "Ultra bright minimal light mode",
											accent: "#0d9488"
										},
										{
											id: "slate",
											name: "Slate",
											desc: "Cool blue-gray professional slate",
											accent: "#38bdf8"
										},
										{
											id: "stealth",
											name: "Stealth (OLED)",
											desc: "True black OLED stealth mode",
											accent: "#10b981"
										},
										{
											id: "cyberpunk",
											name: "Cyberpunk Neon",
											desc: "Neon cyberpunk glowing wireframe",
											accent: "#00e5ff"
										},
										{
											id: "infrared",
											name: "🔮 Infrared Command",
											desc: "Deep violet command center",
											accent: "#7c3aed"
										}
									].map((t) => {
										const isSelected = s.theme === t.id;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											onClick: () => patch({ theme: t.id }),
											className: `cursor-pointer rounded-[1.2rem] border-2 p-5 transition-all flex flex-col gap-2 ${isSelected ? "border-[var(--amber)] bg-[var(--amber-low)] shadow-md" : "border-[var(--border-c)] bg-[var(--bg-void)] hover:border-[var(--amber)]/40"}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-bold text-sm text-[var(--text)] flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "w-3 h-3 rounded-full",
														style: { backgroundColor: t.accent }
													}), t.name]
												}), isSelected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] font-extrabold bg-[var(--amber)] text-white px-2 py-0.5 rounded-full uppercase tracking-wider",
													children: "Active"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-[var(--text-sub)]",
												children: t.desc
											})]
										}, t.id);
									})
								})] })
							})
						]
					}),
					activeSection === "general" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-0 right-0 h-1 bg-[var(--amber)]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 border-b border-[var(--border-c)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-lg font-bold flex items-center gap-2 text-[var(--text)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, {
										size: 20,
										className: "text-[var(--amber)]"
									}), "General Configuration"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-[var(--text-sub)] mt-1",
									children: "Configure global platform behavior and refresh intervals."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 space-y-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mb-6 rounded-2xl border border-[var(--border-c)] bg-[var(--bg-void)] p-5 shadow-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between pb-3",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
														className: "font-semibold text-sm text-[var(--text)] uppercase tracking-widest",
														children: "Backend Connection"
													}),
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
														children: "Connection Failed"
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-[var(--text-sub)] pb-4",
												children: "Set a custom backend URL (e.g., ngrok, Cloudflare Tunnel) if hosting the frontend remotely. Leave blank for local development."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "text",
														value: backendInput,
														onChange: (e) => setBackendInput(e.target.value),
														placeholder: "https://abc1234.ngrok-free.app",
														className: "flex-1 w-full bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--text)] focus:outline-none focus:border-[var(--amber)] transition-colors"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: async () => {
															setBackendStatus("testing");
															setBackendStatus(await testBackendConnection(backendInput) ? "success" : "error");
														},
														className: "px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border-c)] hover:bg-[var(--bg-surface)] text-[var(--text)] transition-colors",
														children: "Test"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => {
															if (!backendInput.trim()) clearBackendUrl();
															else setBackendUrl(backendInput);
															toast.success("Backend URL saved. Reloading app...");
															setTimeout(() => window.location.reload(), 1e3);
														},
														className: "px-4 py-2 text-sm font-bold rounded-lg bg-[var(--amber)] text-black hover:bg-[var(--amber-low)] hover:text-[var(--amber)] border border-[var(--amber)] transition-colors shadow-sm",
														children: "Save"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => {
															setBackendInput("");
															clearBackendUrl();
															toast.success("Reverted to local backend. Reloading...");
															setTimeout(() => window.location.reload(), 1e3);
														},
														className: "px-4 py-2 text-sm font-medium rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors",
														children: "Clear"
													})
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 sm:grid-cols-2 gap-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "block text-xs font-semibold text-[var(--text)] uppercase tracking-widest mb-2",
											children: "App Name (Branding)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											value: s.appName || "NEXUS",
											onChange: (e) => patch({ appName: e.target.value }),
											className: "w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors",
											placeholder: "NEXUS"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "block text-xs font-semibold text-[var(--text)] uppercase tracking-widest mb-2",
											children: "App Subtitle (Branding)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											value: s.appSubtitle || "Horizon UI Shell",
											onChange: (e) => patch({ appSubtitle: e.target.value }),
											className: "w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors",
											placeholder: "Horizon UI Shell"
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-xs font-semibold text-[var(--text)] uppercase tracking-widest mb-2",
										children: "Company Logo URL"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: s.companyLogoUrl || "",
										onChange: (e) => patch({ companyLogoUrl: e.target.value }),
										className: "w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors",
										placeholder: "https://example.com/logo.png"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 sm:grid-cols-2 gap-6",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "block text-xs font-semibold text-[var(--text)] uppercase tracking-widest mb-2",
												children: "Sidebar Default State"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												value: s.sidebarState || "expanded",
												onChange: (e) => patch({ sidebarState: e.target.value }),
												className: "w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "expanded",
													children: "Expanded"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "collapsed",
													children: "Collapsed"
												})]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "block text-xs font-semibold text-[var(--text)] uppercase tracking-widest mb-2",
												children: "Custom Accent Color (Hex)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "text",
												value: s.accentColor || "",
												onChange: (e) => patch({ accentColor: e.target.value }),
												className: "w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors",
												placeholder: "#ffb86c"
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "block text-xs font-semibold text-[var(--text)] uppercase tracking-widest mb-2",
												children: "Time Zone Format"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												value: s.timeZoneFormat || "UTC",
												onChange: (e) => patch({ timeZoneFormat: e.target.value }),
												className: "w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "UTC",
													children: "UTC (Coordinated Universal Time)"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "Local",
													children: "Local Device Time"
												})]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "block text-xs font-semibold text-[var(--text)] uppercase tracking-widest mb-2",
												children: "Server Fleet View"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												value: s.defaultViewMode || "list",
												onChange: (e) => patch({ defaultViewMode: e.target.value }),
												className: "w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "list",
													children: "List View"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "grid",
													children: "Grid View"
												})]
											})] })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between p-4 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-semibold text-[var(--text)]",
											children: "Show Status Badges"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] text-[var(--text-sub)]",
											children: "Display live indicators (Up/Down) on server cards."
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: s.showStatusBadges ?? true,
											onChange: (e) => patch({ showStatusBadges: e.target.checked }),
											className: "accent-[var(--amber)] h-5 w-5 rounded"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-semibold text-[var(--text)] mb-2",
										children: "Language / Locale"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										value: s.language,
										onChange: (e) => patch({ language: e.target.value }),
										className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--amber)]",
										children: [
											"en-US",
											"en-GB",
											"fr-FR",
											"de-DE"
										].map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: x,
											children: x
										}, x))
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-semibold text-[var(--text)] mb-2",
										children: "Default Landing Page"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										value: s.defaultLandingPage,
										onChange: (e) => patch({ defaultLandingPage: e.target.value }),
										className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--amber)]",
										children: [
											"dashboard",
											"servers",
											"alerts"
										].map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: x,
											children: x
										}, x))
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "block text-sm font-semibold text-[var(--text)] mb-2",
										children: [
											"Auto-refresh Interval (",
											s.autoRefreshInterval,
											"s)"
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "range",
										min: 5,
										max: 120,
										step: 5,
										value: s.autoRefreshInterval,
										onChange: (e) => patch({ autoRefreshInterval: +e.target.value }),
										className: "w-full accent-[var(--amber)]"
									})] })
								]
							})
						]
					}),
					activeSection === "developer" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-0 right-0 h-1 bg-[var(--crit)]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 border-b border-[var(--border-c)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-lg font-bold flex items-center gap-2 text-[var(--text)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, {
										size: 20,
										className: "text-[var(--crit)]"
									}), "Developer Settings"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-[var(--text-sub)] mt-1",
									children: "Configure advanced settings, API keys, and logs."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 space-y-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
									className: "text-sm font-bold text-[var(--text)] mb-4 border-b border-[var(--border-c)] pb-2 flex items-center justify-between",
									children: ["API Keys", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => {
											const name = prompt("Name for new API key:");
											if (!name) return;
											fetch(getApiUrl("/settings/keys"), {
												method: "POST",
												headers: { "Content-Type": "application/json" },
												body: JSON.stringify({ name })
											}).then((r) => r.json()).then((key) => {
												patch({ apiKeys: [...s.apiKeys || [], key] });
												prompt("New API Key generated. COPY THIS NOW, it won't be shown again:", key.key);
											});
										},
										className: "text-[10px] bg-[var(--amber-low)] text-[var(--amber)] px-2 py-1 rounded flex items-center gap-1 hover:bg-[var(--amber)] hover:text-white transition-all",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 12 }), " New Key"]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [s.apiKeys?.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-[var(--text-sub)] italic",
										children: "No API keys generated."
									}), s.apiKeys?.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between bg-[var(--bg-void)] border border-[var(--border-c)] p-3 rounded-lg",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[12px] font-bold text-[var(--text)]",
											children: k.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-[10px] text-[var(--text-sub)] font-mono mt-1",
											children: ["Created: ", new Date(k.createdAt).toLocaleString()]
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => {
												if (!confirm("Revoke this key?")) return;
												fetch(getApiUrl(`/settings/keys/${k.id}`), { method: "DELETE" }).then(() => patch({ apiKeys: s.apiKeys.filter((x) => x.id !== k.id) }));
											},
											className: "text-[var(--crit)] hover:bg-[var(--crit)] hover:text-white p-1.5 rounded transition-colors",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
										})]
									}, k.id))]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "text-sm font-bold text-[var(--text)] mb-4 border-b border-[var(--border-c)] pb-2",
										children: "Backend Logs"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg border border-[var(--border-c)] bg-[var(--bg-void)]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => {
												fetch(getApiUrl("/settings/logs/toggle"), { method: "POST" }).then((res) => res.json()).then((data) => {
													setLogsEnabled(data.enabled);
													toast.success(data.enabled ? "Backend logging enabled" : "Backend logging disabled");
												});
											},
											className: `mono flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium border transition-all ${logsEnabled ? "bg-[var(--ok)]/10 text-[var(--ok)] border-[var(--ok)]/30" : "bg-[var(--border-c)] text-[var(--text-sub)]"}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2 w-2 rounded-full ${logsEnabled ? "bg-[var(--ok)] animate-pulse" : "bg-[var(--text-sub)]"}` }), logsEnabled ? "Logging: ON" : "Logging: OFF"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: fetchLogs,
											className: "mono flex items-center gap-1.5 rounded bg-[var(--amber-low)] px-3 py-1.5 text-[11px] font-medium text-[var(--amber)]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
												size: 12,
												className: loadingLogs ? "animate-spin" : ""
											}), " Refresh"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "rounded-lg border border-[var(--border-c)] bg-[#09090b] overflow-hidden",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "p-4 mono text-[11px] text-[var(--text-sub)] overflow-y-auto max-h-[300px] space-y-1",
											children: logs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-center py-4",
												children: "No logs captured..."
											}) : logs.map((log, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: log }, i))
										})
									})
								] })]
							})
						]
					}),
					activeSection === "plugins" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-0 right-0 h-1 bg-[var(--teal)]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 border-b border-[var(--border-c)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-lg font-bold flex items-center gap-2 text-[var(--text)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCode, {
										size: 20,
										className: "text-[var(--teal)]"
									}), "Plugin Settings"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-[var(--text-sub)] mt-1",
									children: "Configure global plugin behavior and categories."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 space-y-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-semibold text-[var(--text)] mb-2",
										children: "Plugin Categories (comma separated)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: s.pluginCategories || "Management,Security,Infrastructure,Advanced,Custom",
										onChange: (e) => patch({ pluginCategories: e.target.value }),
										className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--amber)]"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-[var(--text-sub)] mt-2",
										children: "Categories are used to group plugins in the left navigation menu."
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-6 border-t border-[var(--border-c)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => window.location.href = "/plugins",
										className: "flex items-center gap-2 rounded-xl border border-[var(--amber)] bg-[var(--amber-low)] px-4 py-2.5 text-sm font-semibold text-[var(--amber)] transition-colors hover:bg-[var(--amber)] hover:text-black",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCode, { size: 16 }), " Open Plugin Manager"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-[var(--text-sub)] mt-2",
										children: "Use the Plugin Manager to enable or disable features like PowerShell, Processes, Performance, and Security."
									})]
								})]
							})
						]
					}),
					activeSection === "infrastructure" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-0 right-0 h-1 bg-[var(--text)]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 border-b border-[var(--border-c)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-lg font-bold flex items-center gap-2 text-[var(--text)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, {
										size: 20,
										className: "text-[var(--text)]"
									}), "Infrastructure & Connection"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-[var(--text-sub)] mt-1",
									children: "Configure remote connections and session limits."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 space-y-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-semibold text-[var(--text)] mb-2",
										children: "Default WinRM Port"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "number",
										value: s.defaultWinRmPort || 5985,
										onChange: (e) => patch({ defaultWinRmPort: parseInt(e.target.value) }),
										className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-semibold text-[var(--text)]",
											children: "Require HTTPS for Remote"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] text-[var(--text-sub)]",
											children: "Force PowerShell and terminal sessions to use SSL."
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: s.requireHttpsForRemote || false,
											onChange: (e) => patch({ requireHttpsForRemote: e.target.checked }),
											className: "accent-[var(--amber)] h-5 w-5 rounded"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-semibold text-[var(--text)] mb-2",
										children: "Max Concurrent Sessions"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "number",
										value: s.maxConcurrentSessions || 10,
										onChange: (e) => patch({ maxConcurrentSessions: parseInt(e.target.value) }),
										className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]"
									})] })
								]
							})
						]
					}),
					activeSection === "alerting" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-0 right-0 h-1 bg-[var(--warn)]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 border-b border-[var(--border-c)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-lg font-bold flex items-center gap-2 text-[var(--text)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
										size: 20,
										className: "text-[var(--warn)]"
									}), "Advanced Alerting"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-[var(--text-sub)] mt-1",
									children: "Configure automated incident triggers and notifications."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 space-y-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-semibold text-[var(--text)] mb-2",
										children: "Health Check Interval (Seconds)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "number",
										value: s.healthCheckInterval || 60,
										onChange: (e) => patch({ healthCheckInterval: parseInt(e.target.value) }),
										className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-semibold text-[var(--text)] mb-2",
										children: "Log File Output Path"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										placeholder: "C:\\ProgramData\\Nexus\\Logs",
										value: s.logFilePath || "",
										onChange: (e) => patch({ logFilePath: e.target.value }),
										className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-semibold text-[var(--text)] mb-2",
										children: "Disk Alert Threshold (%)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "number",
										value: s.diskAlertThreshold || 90,
										onChange: (e) => patch({ diskAlertThreshold: parseInt(e.target.value) }),
										className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-semibold text-[var(--text)] mb-2",
										children: "Alert Quiet Hours"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										placeholder: "e.g. 22:00-06:00",
										value: s.alertQuietHours || "",
										onChange: (e) => patch({ alertQuietHours: e.target.value }),
										className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-semibold text-[var(--text)] mb-2",
										children: "Discord Webhook URL"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: s.discordWebhookUrl || "",
										onChange: (e) => patch({ discordWebhookUrl: e.target.value }),
										className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-semibold text-[var(--text)] mb-2",
										children: "Slack Webhook URL"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: s.slackWebhookUrl || "",
										onChange: (e) => patch({ slackWebhookUrl: e.target.value }),
										className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]"
									})] })
								]
							})
						]
					}),
					activeSection === "security" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-0 right-0 h-1 bg-[var(--crit)]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 border-b border-[var(--border-c)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-lg font-bold flex items-center gap-2 text-[var(--text)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, {
										size: 20,
										className: "text-[var(--crit)]"
									}), "Admin & Security"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-[var(--text-sub)] mt-1",
									children: "Global security policies and maintenance controls."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 space-y-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-semibold text-[var(--text)] mb-2",
										children: "App Login Method"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: s.appLoginMethod || "Local",
										onChange: (e) => patch({ appLoginMethod: e.target.value }),
										className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Local",
												children: "Local Database Auth"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Windows",
												children: "Integrated Windows Authentication"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "Entra",
												children: "Entra ID SSO"
											})
										]
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between p-4 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-semibold text-[var(--text)]",
											children: "Enable Role-Based Access Control (RBAC)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] text-[var(--text-sub)]",
											children: "Enforce Viewer, Operator, and Admin roles."
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: s.enableRbac || false,
											onChange: (e) => patch({ enableRbac: e.target.checked }),
											className: "accent-[var(--amber)] h-5 w-5 rounded"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between p-4 bg-[var(--crit)]/10 border border-[var(--crit)]/30 rounded-xl",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-bold text-[var(--crit)]",
											children: "Maintenance Mode"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] text-[var(--text-sub)]",
											children: "Locks out all non-admin users across the platform."
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: s.maintenanceMode || false,
											onChange: (e) => patch({ maintenanceMode: e.target.checked }),
											className: "accent-[var(--crit)] h-5 w-5 rounded"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-semibold text-[var(--text)]",
											children: "Enable Audit Logging"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] text-[var(--text-sub)]",
											children: "Record every user action to the database."
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: s.auditLoggingEnabled || false,
											onChange: (e) => patch({ auditLoggingEnabled: e.target.checked }),
											className: "accent-[var(--amber)] h-5 w-5 rounded"
										})]
									})
								]
							})
						]
					}),
					activeSection === "deployment" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-0 right-0 h-1 bg-[var(--text)]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 border-b border-[var(--border-c)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-lg font-bold flex items-center gap-2 text-[var(--text)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudDownload, {
										size: 20,
										className: "text-[var(--text)]"
									}), "Local Environment & Deployment"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-[var(--text-sub)] mt-1",
									children: "Configure where NEXUS stores local data when deployed as an MSI."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 space-y-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between p-4 bg-[var(--bg-void)] border border-[var(--border-c)] rounded-xl",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-semibold text-[var(--text)]",
											children: "First-Run Setup Wizard"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] text-[var(--text-sub)]",
											children: "Launch guided setup if database is blank on next restart."
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: s.isFirstRunSetup ?? true,
											onChange: (e) => patch({ isFirstRunSetup: e.target.checked }),
											className: "accent-[var(--amber)] h-5 w-5 rounded"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-semibold text-[var(--text)] mb-2",
										children: "Data Directory Path"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										placeholder: "D:\\NexusData",
										value: s.dataDirectoryPath || "",
										onChange: (e) => patch({ dataDirectoryPath: e.target.value }),
										className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-sm font-semibold text-[var(--text)] mb-2",
										children: "Web Binding Port"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "number",
										value: s.webBindingPort || 5011,
										onChange: (e) => patch({ webBindingPort: parseInt(e.target.value) }),
										className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]"
									})] })
								]
							})
						]
					}),
					activeSection === "ad" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-0 right-0 h-1 bg-[var(--text)]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 border-b border-[var(--border-c)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-lg font-bold flex items-center gap-2 text-[var(--text)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, {
										size: 20,
										className: "text-[var(--text)]"
									}), "Active Directory Integration"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-[var(--text-sub)] mt-1",
									children: "Configure LDAP search roots and trusted domains."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 space-y-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-sm font-semibold text-[var(--text)] mb-2",
									children: "Default Domain Name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "nvlabs.com",
									value: s.defaultDomainName || "",
									onChange: (e) => patch({ defaultDomainName: e.target.value }),
									className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-sm font-semibold text-[var(--text)] mb-2",
									children: "Trust Relationship Presets (Comma Separated)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "child.nvlabs.com, external.local",
									value: s.trustRelationshipPresets || "",
									onChange: (e) => patch({ trustRelationshipPresets: e.target.value }),
									className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]"
								})] })]
							})
						]
					}),
					activeSection === "automation" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "bg-[var(--bg-surface)] rounded-[1.5rem] border border-[var(--border-c)] shadow-sm overflow-hidden relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-0 right-0 h-1 bg-[var(--text)]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 border-b border-[var(--border-c)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-lg font-bold flex items-center gap-2 text-[var(--text)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, {
										size: 20,
										className: "text-[var(--text)]"
									}), "Automation & PowerShell"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-[var(--text-sub)] mt-1",
									children: "Configure global PowerShell behavior and local scripting library."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-6 space-y-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-sm font-semibold text-[var(--text)] mb-2",
									children: "PowerShell Execution Policy"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: s.psExecutionPolicy || "RemoteSigned",
									onChange: (e) => patch({ psExecutionPolicy: e.target.value }),
									className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "Bypass",
											children: "Bypass"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "RemoteSigned",
											children: "RemoteSigned"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "Restricted",
											children: "Restricted"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "Unrestricted",
											children: "Unrestricted"
										})
									]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-sm font-semibold text-[var(--text)] mb-2",
									children: "Script Library Path"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "C:\\Scripts",
									value: s.scriptLibraryPath || "",
									onChange: (e) => patch({ scriptLibraryPath: e.target.value }),
									className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--amber)]"
								})] })]
							})
						]
					})
				]
			})]
		})]
	});
}
var SECTIONS = [
	"General",
	"Appearance",
	"Security & Access",
	"Monitoring & Alerts",
	"Data & Maintenance",
	"Extensions",
	"Testing & Diagnostics",
	"Backend Logs"
];
var TERMINAL_THEMES = [
	{
		id: "nexus-dark",
		name: "Nexus Dark",
		bg: "#050508",
		prompt: "#f59e0b",
		output: "#94a3b8",
		cursor: "#f59e0b"
	},
	{
		id: "win-classic",
		name: "Win Classic",
		bg: "#0c0c0c",
		prompt: "#cccccc",
		output: "#cccccc",
		cursor: "#ffffff"
	},
	{
		id: "matrix",
		name: "Matrix",
		bg: "#020e02",
		prompt: "#00ff41",
		output: "#009921",
		cursor: "#00ff41"
	},
	{
		id: "solarized",
		name: "Solarized Dark",
		bg: "#002b36",
		prompt: "#268bd2",
		output: "#839496",
		cursor: "#268bd2"
	},
	{
		id: "dracula",
		name: "Dracula",
		bg: "#282a36",
		prompt: "#ff79c6",
		output: "#f8f8f2",
		cursor: "#bd93f9"
	},
	{
		id: "cobalt",
		name: "Cobalt Blue",
		bg: "#001e3c",
		prompt: "#00bcd4",
		output: "#b0bec5",
		cursor: "#00bcd4"
	},
	{
		id: "monokai",
		name: "Monokai",
		bg: "#272822",
		prompt: "#e6db74",
		output: "#f8f8f2",
		cursor: "#a6e22e"
	},
	{
		id: "nord",
		name: "Nord",
		bg: "#2e3440",
		prompt: "#88c0d0",
		output: "#d8dee9",
		cursor: "#88c0d0"
	}
];
function GlobalSettingsPage() {
	const { theme } = (0, import_react.useContext)(ThemeContext);
	if (theme === "horizon") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HorizonSettings, {});
	const [s, setS] = (0, import_react.useState)(null);
	const [sec, setSec] = (0, import_react.useState)("General");
	const [logs, setLogs] = (0, import_react.useState)([]);
	const [loadingLogs, setLoadingLogs] = (0, import_react.useState)(false);
	const [exportTimeFilter, setExportTimeFilter] = (0, import_react.useState)("all");
	const [logsEnabled, setLogsEnabled] = (0, import_react.useState)(true);
	const [backendInput, setBackendInput] = (0, import_react.useState)(getBackendUrl());
	const [backendStatus, setBackendStatus] = (0, import_react.useState)("unknown");
	function fetchLogs() {
		setLoadingLogs(true);
		fetch(getApiUrl("/settings/logs")).then((res) => res.json()).then((data) => {
			setLogs((data.logs || []).slice(0, 500));
			if (data.enabled !== void 0) setLogsEnabled(data.enabled);
		}).catch(() => toast.error("Failed to fetch logs")).finally(() => setLoadingLogs(false));
	}
	(0, import_react.useEffect)(() => {
		fetchLogs();
		const interval = setInterval(fetchLogs, 5e3);
		return () => clearInterval(interval);
	}, []);
	(0, import_react.useEffect)(() => {
		fetch(getApiUrl("/settings")).then((res) => res.json()).then((data) => {
			setS(data);
			document.documentElement.setAttribute("data-theme", data.theme);
		}).catch((err) => toast.error("Failed to load settings"));
	}, []);
	function patch(p) {
		if (!s) return;
		const next = {
			...s,
			...p
		};
		setS(next);
		if (p.theme) {
			document.documentElement.setAttribute("data-theme", p.theme);
			try {
				localStorage.setItem("nexus-theme", p.theme);
			} catch (e) {}
			window.dispatchEvent(new CustomEvent("nexus-theme-change", { detail: { theme: p.theme } }));
		}
		if (p.terminalTheme) {
			document.documentElement.setAttribute("data-terminal-theme", p.terminalTheme);
			try {
				localStorage.setItem("nexus-terminal-theme", p.terminalTheme);
			} catch (e) {}
		}
		if (p.animationsEnabled !== void 0) {
			try {
				localStorage.setItem("nexus-animations", p.animationsEnabled ? "true" : "false");
			} catch (e) {}
			if (!p.animationsEnabled) document.documentElement.classList.add("no-animations");
			else document.documentElement.classList.remove("no-animations");
		}
		fetch(getApiUrl("/settings"), {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(next)
		}).then((res) => {
			if (res.ok) toast.success("Settings saved");
			else toast.error("Failed to save settings");
		});
	}
	if (!s) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageWrapper, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-[12px] text-[var(--text-sub)]",
		children: "Loading…"
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		eyebrow: "App Management",
		title: "Global Settings"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-[220px_1fr] gap-5 mt-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
			className: "nx-card h-fit p-2",
			children: SECTIONS.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => setSec(x),
				className: "flex w-full items-center rounded-md px-3 py-2 text-left text-[12px] " + (sec === x ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)]"),
				children: x
			}, x))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-card p-6",
			children: [
				sec === "General" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Group, {
					title: "General Settings",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-6 rounded-lg border border-[var(--border-dim)] bg-[var(--bg-card)] p-4 shadow-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between pb-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-semibold text-[14px]",
											children: "Backend Connection"
										}),
										backendStatus === "testing" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[12px] text-[var(--amber)] animate-pulse",
											children: "Testing..."
										}),
										backendStatus === "success" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[12px] text-[var(--ok)] font-medium flex items-center gap-1",
											children: "Connected"
										}),
										backendStatus === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[12px] text-rose-400 font-medium",
											children: "Connection Failed"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[12px] text-[var(--text-sub)] pb-4",
									children: "Set a custom backend URL (e.g., ngrok, Cloudflare Tunnel) if hosting the frontend remotely. Leave blank for local development."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											value: backendInput,
											onChange: (e) => setBackendInput(e.target.value),
											placeholder: "https://abc1234.ngrok-free.app",
											className: "flex-1 mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: async () => {
												setBackendStatus("testing");
												setBackendStatus(await testBackendConnection(backendInput) ? "success" : "error");
											},
											className: "px-3 py-2 text-[12px] rounded border border-[var(--border-c)] hover:bg-[var(--bg-surface)]",
											children: "Test"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => {
												if (!backendInput.trim()) clearBackendUrl();
												else setBackendUrl(backendInput);
												toast.success("Backend URL saved. Reloading app...");
												setTimeout(() => window.location.reload(), 1e3);
											},
											className: "px-4 py-2 text-[12px] font-medium rounded bg-[var(--amber)] text-black hover:bg-[var(--amber-low)] hover:text-[var(--amber)] transition-colors",
											children: "Save"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => {
												setBackendInput("");
												clearBackendUrl();
												toast.success("Reverted to local backend. Reloading...");
												setTimeout(() => window.location.reload(), 1e3);
											},
											className: "px-3 py-2 text-[12px] rounded border border-rose-500/30 text-rose-400 hover:bg-rose-500/10",
											children: "Clear"
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Language / Locale",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								value: s.language,
								onChange: (e) => patch({ language: e.target.value }),
								className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px]",
								children: [
									"en-US",
									"en-GB",
									"fr-FR",
									"de-DE"
								].map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: x,
									children: x
								}, x))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Default Landing Page",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								value: s.defaultLandingPage,
								onChange: (e) => patch({ defaultLandingPage: e.target.value }),
								className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px]",
								children: [
									"dashboard",
									"servers",
									"alerts"
								].map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: x,
									children: x
								}, x))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: `Auto-refresh interval: ${s.autoRefreshInterval}s`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 5,
								max: 120,
								step: 5,
								value: s.autoRefreshInterval,
								onChange: (e) => patch({ autoRefreshInterval: +e.target.value }),
								className: "w-full accent-[var(--amber)]"
							})
						})
					]
				}),
				sec === "Appearance" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Group, {
					title: "Appearance",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Theme",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [
									{
										id: "dark",
										name: "Signal Room (Dark)",
										preview: "#09090f"
									},
									{
										id: "light",
										name: "Pure Light",
										preview: "#f8fafc"
									},
									{
										id: "slate",
										name: "Slate",
										preview: "#0f172a"
									},
									{
										id: "stealth",
										name: "Stealth (OLED)",
										preview: "#000000"
									},
									{
										id: "cyberpunk",
										name: "Cyberpunk Neon",
										preview: "hsl(255,20%,4%)",
										accent: "#00e5ff"
									},
									{
										id: "infrared",
										name: "🔮 Infrared Command",
										preview: "#05050a",
										accent: "#7c3aed"
									},
									{
										id: "horizon",
										name: "🌅 Horizon Luminous Day",
										preview: "#fafaf9",
										accent: "#ff5e3a"
									}
								].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => patch({ theme: t.id }),
									style: s.theme === t.id && t.accent ? {
										borderColor: t.accent,
										background: `${t.accent}18`,
										color: t.accent
									} : {},
									className: "p-3 rounded-md border text-[12px] text-center transition-all " + (s.theme === t.id ? t.accent ? "" : "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)]" : "border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)] hover:border-[var(--amber)]/40"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "inline-block w-2 h-2 rounded-full mr-1.5",
										style: { background: t.accent || "var(--amber)" }
									}), t.name]
								}, t.id))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "UI Density",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								value: s.uiDensity,
								onChange: (e) => patch({ uiDensity: e.target.value }),
								className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px]",
								children: ["comfortable", "compact"].map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: x,
									children: x
								}, x))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
							label: "Enable Animations",
							on: s.animationsEnabled,
							onChange: (v) => patch({ animationsEnabled: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pt-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "mb-3 block text-[12px] text-[var(--text-sub)]",
								children: "PowerShell Terminal Theme"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-4 gap-3",
								children: TERMINAL_THEMES.map((t) => {
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => patch({ terminalTheme: t.id }),
										className: "rounded-lg border-2 overflow-hidden transition-all " + ((s.terminalTheme ?? "nexus-dark") === t.id ? "border-[var(--amber)] scale-[1.02]" : "border-[var(--border-c)] hover:border-[var(--amber)]/50"),
										title: t.name,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											style: {
												background: t.bg,
												padding: "8px 10px",
												fontFamily: "monospace",
												fontSize: "9px",
												lineHeight: "1.5",
												textAlign: "left"
											},
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													style: { color: t.prompt },
													children: ["PS C:\\> ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														style: { color: t.output },
														children: "Get-Process"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													style: { color: t.output },
													children: "Name      CPU"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													style: { color: t.output },
													children: "svchost   1.2"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													style: { display: "flex" },
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														style: { color: t.prompt },
														children: "PS C:\\> "
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														style: {
															display: "inline-block",
															background: t.cursor,
															color: t.bg,
															minWidth: "6px",
															marginLeft: "2px"
														},
														children: "\xA0"
													})]
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											style: {
												background: t.bg,
												borderTop: `1px solid ${t.prompt}22`,
												padding: "4px 8px",
												color: t.prompt,
												fontSize: "9px",
												fontFamily: "monospace",
												textAlign: "center"
											},
											children: t.name
										})]
									}, t.id);
								})
							})]
						})
					]
				}),
				sec === "Security & Access" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Group, {
					title: "Security & Access",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: `AD Sync Interval: ${s.adSyncInterval}m`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 5,
								max: 1440,
								step: 5,
								value: s.adSyncInterval,
								onChange: (e) => patch({ adSyncInterval: +e.target.value }),
								className: "w-full accent-[var(--amber)]"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: `Session Timeout: ${s.sessionTimeout}m`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 5,
								max: 120,
								step: 5,
								value: s.sessionTimeout,
								onChange: (e) => patch({ sessionTimeout: +e.target.value }),
								className: "w-full accent-[var(--amber)]"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
							label: "Require MFA for Admins",
							on: s.mfaRequired,
							onChange: (v) => patch({ mfaRequired: v })
						})
					]
				}),
				sec === "Monitoring & Alerts" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Group, {
					title: "Monitoring & Alerts",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: `CPU Alert Threshold: ${s.cpuAlertThreshold}%`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 50,
								max: 100,
								step: 1,
								value: s.cpuAlertThreshold,
								onChange: (e) => patch({ cpuAlertThreshold: +e.target.value }),
								className: "w-full accent-[var(--amber)]"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: `RAM Alert Threshold: ${s.ramAlertThreshold}%`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "range",
								min: 50,
								max: 100,
								step: 1,
								value: s.ramAlertThreshold,
								onChange: (e) => patch({ ramAlertThreshold: +e.target.value }),
								className: "w-full accent-[var(--amber)]"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Notification Email",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: s.notificationEmail,
								onChange: (v) => patch({ notificationEmail: v })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Webhook URL (Slack/Teams)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: s.webhookUrl,
								onChange: (v) => patch({ webhookUrl: v })
							})
						})
					]
				}),
				sec === "Data & Maintenance" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Group, {
					title: "Data & Maintenance",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: `Telemetry Retention: ${s.telemetryRetentionDays} days`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								value: s.telemetryRetentionDays,
								onChange: (e) => patch({ telemetryRetentionDays: +e.target.value }),
								className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px]",
								children: [
									7,
									14,
									30,
									90,
									365
								].map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: x,
									children: [x, " days"]
								}, x))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "Log Level",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								value: s.logLevel,
								onChange: (e) => patch({ logLevel: e.target.value }),
								className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px]",
								children: [
									"debug",
									"info",
									"warn",
									"error"
								].map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: x,
									children: x
								}, x))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2 pt-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "mono rounded-md border border-[var(--amber)] bg-[var(--amber-low)] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--amber)] hover:bg-[var(--amber)] hover:text-[var(--bg-void)] transition-colors",
								children: "Backup Database"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "mono rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:text-[var(--text)] transition-colors",
								children: "Clear Caches"
							})]
						})
					]
				}),
				sec === "Extensions" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Group, {
					title: "Extension Management",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "Plugin Categories (comma separated)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: s.pluginCategories || "Management,Security,Infrastructure,Advanced",
							onChange: (v) => patch({ pluginCategories: v })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[12px] text-[var(--text-sub)] mt-2",
						children: "Categories are used to group plugins in the left navigation menu. To add a new category, simply add it to the comma-separated list above."
					})]
				}),
				sec === "Testing & Diagnostics" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Group, {
					title: "Testing & Diagnostics",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[12px] text-[var(--text-sub)] mb-4",
						children: "Use these tools to verify system connectivity and push notifications."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						label: "SignalR Notifications",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => testNotificationClient("Info", "Test Info Notification"),
									className: "rounded bg-[var(--blue)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--blue)] hover:bg-[var(--blue)]/20 border border-[var(--blue)]/20",
									children: "Info"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => testNotificationClient("Success", "Test Success Notification"),
									className: "rounded bg-[var(--ok)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--ok)] hover:bg-[var(--ok)]/20 border border-[var(--ok)]/20",
									children: "Success"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => testNotificationClient("Warning", "Test Warning Notification"),
									className: "rounded bg-[var(--warn)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--warn)] hover:bg-[var(--warn)]/20 border border-[var(--warn)]/20",
									children: "Warning"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => testNotificationClient("Critical", "Test Critical Notification"),
									className: "rounded bg-[var(--crit)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--crit)] hover:bg-[var(--crit)]/20 border border-[var(--crit)]/20",
									children: "Critical"
								})
							]
						})
					})]
				}),
				sec === "Backend Logs" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Group, {
					title: "Backend Live Logs & Export",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[12px] text-[var(--text-sub)] mb-4",
							children: "Monitor live ASP.NET Core & Kestrel server telemetry. Use the export tools to download complete logs or filter by specific timeframes."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg border border-[var(--border-c)] bg-[var(--bg-surface)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 mr-auto",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => {
											fetch(getApiUrl("/settings/logs/toggle"), { method: "POST" }).then((res) => res.json()).then((data) => {
												setLogsEnabled(data.enabled);
												toast.success(data.enabled ? "Backend logging enabled" : "Backend logging disabled");
											}).catch(() => toast.error("Failed to toggle logging"));
										},
										className: `mono flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium border transition-all ${logsEnabled ? "bg-[var(--ok)]/10 text-[var(--ok)] border-[var(--ok)]/30 hover:bg-[var(--ok)]/20" : "bg-[var(--border-c)] text-[var(--text-sub)] border-[var(--border-c)] hover:bg-[var(--border-c)]/80"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2 w-2 rounded-full ${logsEnabled ? "bg-[var(--ok)] animate-pulse" : "bg-[var(--text-sub)]"}` }), logsEnabled ? "Logging: ON (3-Day Retention)" : "Logging: OFF"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: fetchLogs,
										className: "mono flex items-center gap-1.5 rounded bg-[var(--amber-low)] px-3 py-1.5 text-[11px] font-medium text-[var(--amber)] border border-[var(--amber)]/30 hover:bg-[var(--amber)] hover:text-black transition-all",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
											size: 12,
											className: loadingLogs ? "animate-spin" : ""
										}), " Refresh Live Stream"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[11px] text-[var(--text-ghost)]",
										children: [
											"(",
											logs.length,
											" lines captured)"
										]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: exportTimeFilter,
									onChange: (e) => setExportTimeFilter(e.target.value),
									className: "mono rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-2.5 py-1.5 text-[11px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "all",
											children: "All Available Logs"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "5",
											children: "Last 5 Minutes"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "15",
											children: "Last 15 Minutes"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "60",
											children: "Last 1 Hour"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => {
										let filtered = logs;
										if (exportTimeFilter !== "all") {
											const mins = parseInt(exportTimeFilter, 10);
											const cutoff = /* @__PURE__ */ new Date(Date.now() - mins * 6e4);
											filtered = logs.filter((line) => {
												const match = line.match(/^\[(\d{2}):(\d{2}):(\d{2})\]/);
												if (!match) return true;
												const [, h, m, s] = match;
												const now = /* @__PURE__ */ new Date();
												return new Date(now.getFullYear(), now.getMonth(), now.getDate(), +h, +m, +s) >= cutoff;
											});
										}
										const blob = new Blob([filtered.join("\n")], { type: "text/plain" });
										const url = URL.createObjectURL(blob);
										const a = document.createElement("a");
										a.href = url;
										a.download = `nexus_backend_logs_${exportTimeFilter === "all" ? "all" : "last_" + exportTimeFilter + "m"}_${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.txt`;
										document.body.appendChild(a);
										a.click();
										document.body.removeChild(a);
										URL.revokeObjectURL(url);
										toast.success(`Exported ${filtered.length} log lines successfully`);
									},
									className: "mono flex items-center gap-1.5 rounded bg-[var(--ok)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--ok)] border border-[var(--ok)]/20 hover:bg-[var(--ok)]/20 transition-all",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 12 }), " Export Logs"]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-[var(--border-c)] bg-[#09090b] overflow-hidden shadow-2xl w-full",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between border-b border-[var(--border-c)] bg-[#18181b] px-4 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "relative flex h-2 w-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-emerald-500" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mono text-[11px] font-medium text-[var(--text)] tracking-wider uppercase",
										children: "Kestrel / ASP.NET Core Live Monitor"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mono text-[10px] text-[var(--text-ghost)]",
									children: "AUTO-POLLING (5s)"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "p-4 mono text-[11px] leading-relaxed text-[var(--text-sub)] overflow-y-auto max-h-[500px] space-y-1 select-text scrollbar-thin",
								children: logs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-center py-12 text-[var(--text-ghost)]",
									children: "No logs captured yet..."
								}) : logs.map((log, i) => {
									let color = "text-slate-300";
									if (log.includes("[Error]")) color = "text-rose-400 font-medium bg-rose-500/10 px-1 rounded";
									else if (log.includes("[Warning]")) color = "text-amber-400 font-medium bg-amber-500/10 px-1 rounded";
									else if (log.includes("[Information]")) color = "text-sky-300";
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `whitespace-pre-wrap font-mono ${color}`,
										children: log
									}, i);
								})
							})]
						})
					]
				})
			]
		})]
	})] });
}
function Group({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "eyebrow pb-1",
			children: title
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "display pb-5 text-[18px] font-semibold",
			children: title
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-4",
			children
		})
	] });
}
function Row({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-[200px_1fr] items-center gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
			className: "text-[12px] text-[var(--text-sub)]",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children })]
	});
}
function Input({ value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		value,
		onChange: (e) => onChange(e.target.value),
		className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
	});
}
function Toggle({ label, on, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[12px] text-[var(--text-sub)]",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onClick: () => onChange(!on),
			className: "relative h-5 w-9 rounded-full transition-colors " + (on ? "bg-[var(--amber)]" : "bg-[var(--border-c)]"),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-0.5 h-4 w-4 rounded-full bg-[var(--bg-void)] transition-transform " + (on ? "translate-x-4" : "translate-x-0.5") })
		})]
	});
}
//#endregion
export { GlobalSettingsPage as component };
