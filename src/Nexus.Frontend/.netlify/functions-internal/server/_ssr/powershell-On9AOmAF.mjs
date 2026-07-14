import { i as __toESM } from "../_runtime.mjs";
import { L as getWsUrl, j as getServersClient } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as Plus, m as Terminal, n as X, p as Trash2 } from "../_libs/lucide-react.mjs";
import { t as MOCK_SERVERS$1 } from "./mock-C8obigBb.mjs";
import { v as useSearch } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as ThemeContext } from "../__root-H47vz4C-.mjs";
import { t as Route } from "./powershell-BKX_PUQO.mjs";
import { t as Dl } from "../_libs/xterm__xterm.mjs";
import { t as o } from "../_libs/xterm__addon-fit.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/powershell-On9AOmAF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function getTheme$1() {
	if (typeof window === "undefined") return {
		bg: "#050508",
		prompt: "#f59e0b",
		output: "#94a3b8",
		cursor: "#f59e0b"
	};
	const id = document.documentElement.getAttribute("data-terminal-theme") || (typeof localStorage !== "undefined" ? localStorage.getItem("nexus-terminal-theme") : null) || "nexus-dark";
	const TERMINAL_THEMES = {
		"nexus-dark": {
			bg: "#050508",
			prompt: "#f59e0b",
			output: "#94a3b8",
			cursor: "#f59e0b"
		},
		"win-classic": {
			bg: "#0c0c0c",
			prompt: "#cccccc",
			output: "#cccccc",
			cursor: "#ffffff"
		},
		"matrix": {
			bg: "#020e02",
			prompt: "#00ff41",
			output: "#009921",
			cursor: "#00ff41"
		},
		"solarized": {
			bg: "#002b36",
			prompt: "#268bd2",
			output: "#839496",
			cursor: "#268bd2"
		},
		"dracula": {
			bg: "#282a36",
			prompt: "#ff79c6",
			output: "#f8f8f2",
			cursor: "#bd93f9"
		},
		"cobalt": {
			bg: "#001e3c",
			prompt: "#00bcd4",
			output: "#b0bec5",
			cursor: "#00bcd4"
		},
		"monokai": {
			bg: "#272822",
			prompt: "#e6db74",
			output: "#f8f8f2",
			cursor: "#a6e22e"
		},
		"nord": {
			bg: "#2e3440",
			prompt: "#88c0d0",
			output: "#d8dee9",
			cursor: "#88c0d0"
		}
	};
	return TERMINAL_THEMES[id] ?? TERMINAL_THEMES["nexus-dark"];
}
function HorizonPowerShell() {
	const search = useSearch({ strict: false });
	search.serverIp;
	const [servers, setServers] = (0, import_react.useState)([]);
	const [sessions, setSessions] = (0, import_react.useState)([]);
	const [activeId, setActiveId] = (0, import_react.useState)("");
	const active = sessions.find((s) => s.id === activeId);
	const [theme, setTheme] = (0, import_react.useState)(() => getTheme$1());
	(0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		getServersClient().then((data) => {
			const svrs = data && data.length > 0 ? data : MOCK_SERVERS;
			setServers(svrs);
			setSessions([{
				id: "s1",
				serverId: search.serverName || svrs[0]?.name || "nexus01"
			}]);
			setActiveId("s1");
		});
	}, [search.serverIp]);
	(0, import_react.useEffect)(() => {
		const observer = new MutationObserver(() => setTheme(getTheme$1()));
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-terminal-theme"]
		});
		return () => observer.disconnect();
	}, []);
	function newSession() {
		const id = "s" + (sessions.length + 1) + "-" + Date.now();
		const targetName = servers.length > 0 ? servers[0].name : "nexus01";
		setSessions((s) => [...s, {
			id,
			serverId: targetName
		}]);
		setActiveId(id);
	}
	function closeSession(id) {
		if (sessions.length === 1) return;
		const idx = sessions.findIndex((s) => s.id === id);
		const next = sessions.filter((s) => s.id !== id);
		setSessions(next);
		if (activeId === id) setActiveId(next[Math.max(0, idx - 1)].id);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-[1600px] mx-auto space-y-8 font-sans",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col md:flex-row md:items-center justify-between gap-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-3xl font-extrabold text-[var(--text)]",
				children: "PowerShell PTY"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-[var(--text-sub)] mt-1",
				children: "True Interactive WebSocket Sessions"
			})] })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-card flex h-[76vh] flex-col overflow-hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1 border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-2 py-1.5 overflow-x-auto",
				children: [
					sessions.map((s) => {
						const sname = servers.find((m) => m.name === s.serverId)?.name ?? s.serverId;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mono flex items-center gap-2 rounded-md px-3 py-1 text-[11px] " + (s.id === activeId ? "bg-[var(--bg-card)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-card)]"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setActiveId(s.id),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, {
									size: 11,
									className: "mr-1.5 inline"
								}), sname]
							}), sessions.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => closeSession(s.id),
								className: "text-[var(--text-ghost)] hover:text-[var(--crit)]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 11 })
							})]
						}, s.id);
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: newSession,
						className: "mono ml-1 grid h-6 w-6 place-items-center rounded text-[var(--text-sub)] hover:bg-[var(--bg-card)] hover:text-[var(--amber)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 12 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-2 shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: active?.serverId || "",
							onChange: (e) => {
								const newServerId = e.target.value;
								const newId = "s" + Date.now();
								setSessions((sl) => sl.map((s) => s.id === activeId ? {
									id: newId,
									serverId: newServerId
								} : s));
								setActiveId(newId);
							},
							className: "mono rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--amber)]",
							children: servers.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: s.name,
								children: s.name
							}, s.name))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => active?.xterm?.clear(),
							className: "grid h-6 w-6 place-items-center rounded text-[var(--text-sub)] hover:text-[var(--crit)]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 12 })
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex-1 w-full h-full relative",
				style: {
					background: theme.bg,
					padding: "12px"
				},
				children: sessions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TerminalSession$1, {
					session: s,
					isActive: s.id === activeId,
					theme
				}, s.id))
			})]
		})]
	});
}
function TerminalSession$1({ session, isActive, theme }) {
	const containerRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!containerRef.current) return;
		if (session.xterm) return;
		const xterm = new Dl({
			theme: {
				background: theme.bg,
				foreground: theme.output,
				cursor: theme.cursor
			},
			fontFamily: "monospace",
			fontSize: 13,
			cursorBlink: true
		});
		const fit = new o();
		xterm.loadAddon(fit);
		xterm.open(containerRef.current);
		const token = localStorage.getItem("nexus_token") || "";
		const wsUrl = getWsUrl(`/api/terminal/ws?serverId=${session.serverId}&access_token=${token}`);
		const ws = new WebSocket(wsUrl);
		ws.onopen = () => {
			xterm.writeln(`\x1b[33mConnected to ${session.serverId}\x1b[0m`);
		};
		ws.onmessage = (ev) => {
			if (typeof ev.data === "string") xterm.write(ev.data);
			else {
				const reader = new FileReader();
				reader.onload = () => {
					const buf = new Uint8Array(reader.result);
					xterm.write(buf);
				};
				reader.readAsArrayBuffer(ev.data);
			}
		};
		ws.onclose = () => {
			xterm.writeln("\x1B[31m\r\nConnection closed\x1B[0m");
		};
		xterm.onData((data) => {
			if (ws.readyState === WebSocket.OPEN) ws.send(data);
		});
		session.xterm = xterm;
		session.fit = fit;
		session.ws = ws;
		const handleResize = () => fit.fit();
		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
			ws.close();
			xterm.dispose();
			session.xterm = void 0;
			session.ws = void 0;
			session.fit = void 0;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (session.xterm) session.xterm.options.theme = {
			background: theme.bg,
			foreground: theme.output,
			cursor: theme.cursor
		};
	}, [theme]);
	(0, import_react.useEffect)(() => {
		if (isActive) setTimeout(() => {
			session.fit?.fit();
			session.xterm?.focus();
		}, 10);
	}, [isActive]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: containerRef,
		style: {
			display: isActive ? "block" : "none",
			width: "100%",
			height: "100%"
		}
	});
}
function getTheme() {
	if (typeof window === "undefined") return {
		bg: "#050508",
		prompt: "#f59e0b",
		output: "#94a3b8",
		cursor: "#f59e0b"
	};
	const id = document.documentElement.getAttribute("data-terminal-theme") || (typeof localStorage !== "undefined" ? localStorage.getItem("nexus-terminal-theme") : null) || "nexus-dark";
	const TERMINAL_THEMES = {
		"nexus-dark": {
			bg: "#050508",
			prompt: "#f59e0b",
			output: "#94a3b8",
			cursor: "#f59e0b"
		},
		"win-classic": {
			bg: "#0c0c0c",
			prompt: "#cccccc",
			output: "#cccccc",
			cursor: "#ffffff"
		},
		"matrix": {
			bg: "#020e02",
			prompt: "#00ff41",
			output: "#009921",
			cursor: "#00ff41"
		},
		"solarized": {
			bg: "#002b36",
			prompt: "#268bd2",
			output: "#839496",
			cursor: "#268bd2"
		},
		"dracula": {
			bg: "#282a36",
			prompt: "#ff79c6",
			output: "#f8f8f2",
			cursor: "#bd93f9"
		},
		"cobalt": {
			bg: "#001e3c",
			prompt: "#00bcd4",
			output: "#b0bec5",
			cursor: "#00bcd4"
		},
		"monokai": {
			bg: "#272822",
			prompt: "#e6db74",
			output: "#f8f8f2",
			cursor: "#a6e22e"
		},
		"nord": {
			bg: "#2e3440",
			prompt: "#88c0d0",
			output: "#d8dee9",
			cursor: "#88c0d0"
		}
	};
	return TERMINAL_THEMES[id] ?? TERMINAL_THEMES["nexus-dark"];
}
function PowerShellPage() {
	const { theme: appTheme } = (0, import_react.useContext)(ThemeContext);
	if (appTheme === "horizon") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HorizonPowerShell, {});
	const search = Route.useSearch();
	search.serverIp;
	const [servers, setServers] = (0, import_react.useState)([]);
	const [sessions, setSessions] = (0, import_react.useState)([]);
	const [activeId, setActiveId] = (0, import_react.useState)("");
	const active = sessions.find((s) => s.id === activeId);
	const [theme, setTheme] = (0, import_react.useState)(() => getTheme());
	(0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		getServersClient().then((data) => {
			const svrs = data && data.length > 0 ? data : MOCK_SERVERS$1;
			setServers(svrs);
			setSessions([{
				id: "s1",
				serverId: search.serverName || svrs[0]?.name || "nexus01"
			}]);
			setActiveId("s1");
		});
	}, [search.serverIp]);
	(0, import_react.useEffect)(() => {
		const observer = new MutationObserver(() => setTheme(getTheme()));
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-terminal-theme"]
		});
		return () => observer.disconnect();
	}, []);
	function newSession() {
		const id = "s" + (sessions.length + 1) + "-" + Date.now();
		const targetName = servers.length > 0 ? servers[0].name : "nexus01";
		setSessions((s) => [...s, {
			id,
			serverId: targetName
		}]);
		setActiveId(id);
	}
	function closeSession(id) {
		if (sessions.length === 1) return;
		const idx = sessions.findIndex((s) => s.id === id);
		const next = sessions.filter((s) => s.id !== id);
		setSessions(next);
		if (activeId === id) setActiveId(next[Math.max(0, idx - 1)].id);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		eyebrow: "Advanced",
		title: "PowerShell PTY",
		subtitle: "True Interactive WebSocket Sessions"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "nx-card flex h-[76vh] flex-col overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-1 border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-2 py-1.5 overflow-x-auto",
			children: [
				sessions.map((s) => {
					const sname = servers.find((m) => m.name === s.serverId)?.name ?? s.serverId;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mono flex items-center gap-2 rounded-md px-3 py-1 text-[11px] " + (s.id === activeId ? "bg-[var(--bg-card)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-card)]"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveId(s.id),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, {
								size: 11,
								className: "mr-1.5 inline"
							}), sname]
						}), sessions.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => closeSession(s.id),
							className: "text-[var(--text-ghost)] hover:text-[var(--crit)]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 11 })
						})]
					}, s.id);
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: newSession,
					className: "mono ml-1 grid h-6 w-6 place-items-center rounded text-[var(--text-sub)] hover:bg-[var(--bg-card)] hover:text-[var(--amber)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 12 })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ml-auto flex items-center gap-2 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: active?.serverId || "",
						onChange: (e) => {
							const newServerId = e.target.value;
							const newId = "s" + Date.now();
							setSessions((sl) => sl.map((s) => s.id === activeId ? {
								id: newId,
								serverId: newServerId
							} : s));
							setActiveId(newId);
						},
						className: "mono rounded border border-[var(--border-c)] bg-[var(--bg-card)] px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--amber)]",
						children: servers.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: s.name,
							children: s.name
						}, s.name))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => active?.xterm?.clear(),
						className: "grid h-6 w-6 place-items-center rounded text-[var(--text-sub)] hover:text-[var(--crit)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 12 })
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex-1 w-full h-full relative",
			style: {
				background: theme.bg,
				padding: "12px"
			},
			children: sessions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TerminalSession, {
				session: s,
				isActive: s.id === activeId,
				theme
			}, s.id))
		})]
	})] });
}
function TerminalSession({ session, isActive, theme }) {
	const containerRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!containerRef.current) return;
		if (session.xterm) return;
		const xterm = new Dl({
			theme: {
				background: theme.bg,
				foreground: theme.output,
				cursor: theme.cursor
			},
			fontFamily: "monospace",
			fontSize: 13,
			cursorBlink: true
		});
		const fit = new o();
		xterm.loadAddon(fit);
		xterm.open(containerRef.current);
		const token = localStorage.getItem("nexus_token") || "";
		const wsUrl = getWsUrl(`/api/terminal/ws?serverId=${session.serverId}&access_token=${token}`);
		const ws = new WebSocket(wsUrl);
		ws.onopen = () => {
			xterm.writeln(`\x1b[33mConnected to ${session.serverId}\x1b[0m`);
		};
		ws.onmessage = (ev) => {
			if (typeof ev.data === "string") xterm.write(ev.data);
			else {
				const reader = new FileReader();
				reader.onload = () => {
					const buf = new Uint8Array(reader.result);
					xterm.write(buf);
				};
				reader.readAsArrayBuffer(ev.data);
			}
		};
		ws.onclose = () => {
			xterm.writeln("\x1B[31m\r\nConnection closed\x1B[0m");
		};
		xterm.onData((data) => {
			if (ws.readyState === WebSocket.OPEN) ws.send(data);
		});
		session.xterm = xterm;
		session.fit = fit;
		session.ws = ws;
		const handleResize = () => fit.fit();
		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
			ws.close();
			xterm.dispose();
			session.xterm = void 0;
			session.ws = void 0;
			session.fit = void 0;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (session.xterm) session.xterm.options.theme = {
			background: theme.bg,
			foreground: theme.output,
			cursor: theme.cursor
		};
	}, [theme]);
	(0, import_react.useEffect)(() => {
		if (isActive) setTimeout(() => {
			session.fit?.fit();
			session.xterm?.focus();
		}, 10);
	}, [isActive]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: containerRef,
		style: {
			display: isActive ? "block" : "none",
			width: "100%",
			height: "100%"
		}
	});
}
//#endregion
export { PowerShellPage as component };
