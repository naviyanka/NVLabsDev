import { i as __toESM } from "./_runtime.mjs";
import { T as getNotificationsClient, a as clearNotificationClient, h as getBackendUrl, p as getApiUrl, r as clearAllNotificationsClient, x as getFullUrl } from "./_ssr/client-BFkup_sp.mjs";
import { t as cn } from "./_ssr/utils-C_uf36nf.mjs";
import { s as require_jsx_runtime } from "./_libs/@radix-ui/react-arrow+[...].mjs";
import { u as require_react } from "./_libs/@floating-ui/react-dom+[...].mjs";
import { A as RefreshCw, B as Package, C as Settings, D as ScrollText, E as Search, Et as CircleCheckBig, G as LogOut, J as LayoutDashboard, Kt as AppWindow, Lt as Bell, M as Puzzle, Nt as Calendar, Q as Hexagon, Rt as BadgeCheck, St as Circle, T as Server, Tt as CircleQuestionMark, U as Moon, V as Network, W as Monitor, X as KeyRound, Y as Layers, Z as Info, _t as Cog, a as Users, at as FolderOpen, b as Shield, ct as FileCode, et as HardDrive, f as TriangleAlert, ft as DatabaseZap, gt as CopySlash, h as Sun, jt as Check, kt as ChevronRight, m as Terminal, n as X, nt as GitBranch, o as User, pt as Cpu, qt as Activity } from "./_libs/lucide-react.mjs";
import { a as Label2, c as Root2, d as SubTrigger2, f as Trigger, i as ItemIndicator2, l as Separator2, n as Content2, o as Portal2, r as Item2, s as RadioItem2, t as CheckboxItem2, u as SubContent2 } from "./_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { t as MOCK_SERVERS } from "./_ssr/mock-C8obigBb.mjs";
import { _ as useNavigate, c as HeadContent, f as Outlet, g as Link, h as createRootRouteWithContext, l as useRouterState, s as Scripts, y as useRouter } from "./_libs/@tanstack/react-router+[...].mjs";
import { t as QueryClientProvider } from "./_libs/tanstack__react-query.mjs";
import { n as toast, t as Toaster } from "./_libs/sonner.mjs";
import { t as HubConnectionBuilder } from "./_libs/microsoft__signalr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/__root-H47vz4C-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ICONS$1 = {
	terminal: Terminal,
	shield: Shield,
	activity: Activity,
	"hard-drive": HardDrive,
	network: Network,
	settings: Settings,
	cpu: Cpu,
	"database-zap": DatabaseZap,
	"app-window": AppWindow,
	cog: Cog,
	"folder-open": FolderOpen,
	calendar: Calendar,
	package: Package,
	layers: Layers,
	"refresh-cw": RefreshCw,
	monitor: Monitor,
	"badge-check": BadgeCheck,
	users: Users,
	"key-round": KeyRound,
	server: Server,
	"git-branch": GitBranch,
	"copy-slash": CopySlash,
	"scroll-text": ScrollText,
	puzzle: Puzzle
};
var CORE_ITEMS$1 = [{
	to: "/",
	label: "Dashboard",
	icon: LayoutDashboard
}, {
	to: "/servers",
	label: "Server Fleet",
	icon: Server
}];
var SYSTEM_ITEMS$1 = [{
	to: "/plugins",
	label: "Plugins",
	icon: FileCode
}, {
	to: "/settings",
	label: "Settings",
	icon: Settings
}];
function HorizonLayout({ children }) {
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [plugins, setPlugins] = (0, import_react.useState)([]);
	const [notifications, setNotifications] = (0, import_react.useState)([]);
	const [showNotifications, setShowNotifications] = (0, import_react.useState)(false);
	const [showProfileMenu, setShowProfileMenu] = (0, import_react.useState)(false);
	const [userContext, setUserContext] = (0, import_react.useState)({
		username: "Admin User",
		role: "Luminous Command",
		initials: "NX"
	});
	const [brand, setBrand] = (0, import_react.useState)({
		name: "NEXUS",
		subtitle: "Horizon UI Shell"
	});
	(0, import_react.useEffect)(() => {
		fetch(getApiUrl("/settings")).then((r) => r.json()).then((s) => {
			setBrand({
				name: s.appName || "NEXUS",
				subtitle: s.appSubtitle || "Horizon UI Shell"
			});
			if (s.theme) document.documentElement.setAttribute("data-theme", s.theme);
		}).catch(() => {});
		fetch(getApiUrl("/notifications")).then((r) => r.json()).then((n) => {
			if (Array.isArray(n)) setNotifications(n.map((x) => ({
				id: x.id.toString(),
				msg: x.message,
				time: new Date(x.timestamp)
			})));
		}).catch(() => {});
		const handler = (e) => {
			setBrand({
				name: e.detail.appName || "NEXUS",
				subtitle: e.detail.appSubtitle || "Horizon UI Shell"
			});
		};
		window.addEventListener("nexus-branding-change", handler);
		try {
			const userStr = localStorage.getItem("nexus-user");
			if (userStr) {
				const p = JSON.parse(userStr);
				setUserContext({
					username: p.username || "Admin User",
					role: p.role || "Operator",
					initials: p.username ? p.username.substring(0, 2).toUpperCase() : "NX"
				});
			}
		} catch (e) {}
		const originalSuccess = toast.success;
		const originalError = toast.error;
		toast.success = (msg, data) => {
			setNotifications((prev) => [{
				id: Math.random().toString(),
				msg,
				time: /* @__PURE__ */ new Date()
			}, ...prev]);
			fetch(getApiUrl("/notifications/custom"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					type: "Success",
					message: msg
				})
			}).catch(() => {});
			let toastId;
			toastId = originalSuccess(msg, {
				...data,
				onClick: () => toast.dismiss(toastId)
			});
			return toastId;
		};
		toast.error = (msg, data) => {
			setNotifications((prev) => [{
				id: Math.random().toString(),
				msg,
				time: /* @__PURE__ */ new Date()
			}, ...prev]);
			fetch(getApiUrl("/notifications/custom"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					type: "Error",
					message: msg
				})
			}).catch(() => {});
			let toastId;
			toastId = originalError(msg, {
				...data,
				onClick: () => toast.dismiss(toastId)
			});
			return toastId;
		};
		return () => {
			toast.success = originalSuccess;
			toast.error = originalError;
			window.removeEventListener("nexus-branding-change", handler);
		};
	}, []);
	const fetchPlugins = () => {
		fetch(getApiUrl("/plugins")).then((r) => r.json()).then((data) => setPlugins(data.filter((p) => p.isActive))).catch(() => {});
	};
	(0, import_react.useEffect)(() => {
		fetchPlugins();
		window.addEventListener("plugins-updated", fetchPlugins);
		return () => window.removeEventListener("plugins-updated", fetchPlugins);
	}, []);
	const groupedPlugins = {};
	plugins.forEach((p) => {
		const cat = p.category || "Custom";
		if (!groupedPlugins[cat]) groupedPlugins[cat] = [];
		groupedPlugins[cat].push({
			to: p.targetRoute || `/plugin/${p.id}`,
			label: p.name,
			icon: ICONS$1[p.icon] || Puzzle
		});
	});
	const allGroups = [
		{
			label: "Overview",
			items: CORE_ITEMS$1
		},
		...Object.keys(groupedPlugins).map((cat) => ({
			label: cat,
			items: groupedPlugins[cat]
		})),
		{
			label: "System",
			items: SYSTEM_ITEMS$1
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen w-full bg-[var(--bg-void)] text-[var(--text)] flex overflow-hidden font-sans",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "fixed left-0 top-0 h-screen w-[240px] bg-[var(--bg-surface)] border-r border-[var(--border-c)] shadow-sm flex flex-col py-8 px-4 space-y-2 z-50",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-8 px-4 shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-2xl font-extrabold tracking-tight text-[var(--amber)] flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block w-3 h-3 rounded-full bg-[var(--amber)] animate-pulse shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: brand.name
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-[var(--text-sub)] uppercase tracking-widest mt-1 truncate",
							title: brand.subtitle,
							children: brand.subtitle
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 overflow-y-auto pr-1",
						children: allGroups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] text-[var(--text-sub)] uppercase tracking-widest px-4 mb-2 font-bold",
								children: group.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "space-y-1",
								children: group.items.map((item) => {
									const isActive = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
									const Icon = item.icon;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: item.to,
										className: `flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive ? "bg-[var(--amber)] text-white shadow-md font-semibold translate-x-1" : "text-[var(--text-sub)] hover:text-[var(--amber)] hover:bg-[var(--amber-low)]"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
											size: 16,
											className: isActive ? "text-white" : "text-[var(--text-sub)] group-hover:text-[var(--amber)]"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "truncate",
											children: item.label
										})]
									}) }, item.to);
								})
							})]
						}, group.label))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto pt-4 shrink-0 border-t border-[var(--border-c)] flex flex-col gap-2 relative",
						children: [showProfileMenu && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute bottom-full left-4 mb-2 w-[200px] bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl shadow-lg p-2 z-50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg transition-colors flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { size: 14 }), " Profile Settings"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									localStorage.removeItem("nexus_token");
									localStorage.removeItem("nexus-user");
									navigate({ to: "/login" });
								},
								className: "w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-lg transition-colors flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { size: 14 }), " Sign Out"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setShowProfileMenu(!showProfileMenu),
							className: "flex items-center gap-3 px-2 w-full hover:bg-[var(--bg-void)] p-2 rounded-xl transition-colors text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-10 h-10 rounded-full bg-[var(--amber-low)] flex items-center justify-center border border-[var(--amber)]/30 text-[var(--amber)] font-bold text-sm shrink-0",
								children: userContext.initials
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "overflow-hidden",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-semibold text-[var(--text)] truncate",
									children: userContext.username
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] text-[var(--text-sub)] truncate",
									children: userContext.role
								})]
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "fixed top-0 right-0 h-16 w-[calc(100%-240px)] z-40 bg-[var(--bg-surface)]/90 backdrop-blur-xl border-b border-[var(--border-c)] flex items-center justify-between px-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-[var(--text-sub)] text-xs font-semibold uppercase tracking-widest",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--amber)] font-bold",
								children: brand.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: pathname === "/" ? "Dashboard" : pathname.slice(1).toUpperCase() })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 max-w-md mx-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative focus-within:ring-2 focus-within:ring-[var(--amber)]/30 rounded-full transition-all",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
								size: 16,
								className: "absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-sub)] z-10 pointer-events-none"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "w-full bg-[var(--bg-void)] border border-[var(--border-c)] rounded-full py-2 pl-12 pr-4 text-xs focus:outline-none focus:border-[var(--amber)] focus:bg-[var(--bg-surface)] transition-colors text-[var(--text)] placeholder-[var(--text-sub)]",
								placeholder: "Search servers, IPs, or alerts...",
								type: "text"
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => document.documentElement.classList.toggle("dark"),
								className: "text-[var(--text-sub)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-full p-2 transition-all relative",
								title: "Toggle Dark Mode",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, {
									size: 18,
									className: "hidden dark:block"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, {
									size: 18,
									className: "block dark:hidden"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setShowNotifications(!showNotifications),
									className: "text-[var(--text-sub)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-full p-2 transition-all relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { size: 18 }), notifications.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-1 right-1 w-2 h-2 bg-[var(--amber)] rounded-full animate-pulse" })]
								}), showNotifications && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "absolute top-full mt-2 right-0 w-80 bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-xl shadow-xl z-50 overflow-hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3 border-b border-[var(--border-c)] flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-sm",
											children: "Notifications"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => setNotifications([]),
											className: "text-xs text-[var(--text-sub)] hover:text-[var(--amber)]",
											children: "Clear All"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "max-h-64 overflow-y-auto",
										children: notifications.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "p-4 text-center text-xs text-[var(--text-sub)]",
											children: "No new notifications"
										}) : notifications.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-3 border-b border-[var(--border-c)] hover:bg-[var(--bg-void)] flex justify-between items-start gap-2 group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-[var(--text)]",
												children: n.msg
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-[var(--text-sub)] mt-1",
												children: n.time.toLocaleTimeString()
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => setNotifications((prev) => prev.filter((x) => x.id !== n.id)),
												className: "text-[var(--text-sub)] hover:text-[var(--crit)] opacity-0 group-hover:opacity-100 transition-opacity",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
											})]
										}, n.id))
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "text-[var(--text-sub)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] rounded-full p-2 transition-all",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleQuestionMark, { size: 18 })
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "ml-[240px] mt-16 p-8 w-[calc(100%-240px)] h-[calc(100vh-64px)] overflow-y-auto bg-[var(--bg-void)] text-[var(--text)]",
				children
			})
		]
	});
}
var styles_default = "/assets/styles-mBfIrO3M.css";
var dark_default = "/assets/dark-BS4xupfr.css";
var light_default = "/assets/light-B_RTIF7U.css";
var slate_default = "/assets/slate-kM_Rf8gE.css";
var stealth_default = "/assets/stealth-Bu_DSsmE.css";
var cyberpunk_default = "/assets/cyberpunk-bg9w-s5U.css";
var infrared_default = "/assets/infrared-iMUuZBVL.css";
var horizon_default = "/assets/horizon-DxvUYPo9.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
var ICONS = {
	terminal: Terminal,
	shield: Shield,
	activity: Activity,
	"hard-drive": HardDrive,
	network: Network,
	settings: Settings,
	cpu: Cpu,
	"database-zap": DatabaseZap,
	"app-window": AppWindow,
	cog: Cog,
	"folder-open": FolderOpen,
	calendar: Calendar,
	package: Package,
	layers: Layers,
	"refresh-cw": RefreshCw,
	monitor: Monitor,
	"badge-check": BadgeCheck,
	users: Users,
	"key-round": KeyRound,
	server: Server,
	"git-branch": GitBranch,
	"copy-slash": CopySlash,
	"scroll-text": ScrollText,
	puzzle: Puzzle
};
var CORE_ITEMS = [{
	to: "/",
	label: "Dashboard",
	icon: LayoutDashboard
}, {
	to: "/servers",
	label: "Servers",
	icon: Server
}];
var SYSTEM_ITEMS = [{
	to: "/plugins",
	label: "Plugins",
	icon: Puzzle
}, {
	to: "/settings",
	label: "Settings",
	icon: Settings
}];
function Sidebar() {
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const [plugins, setPlugins] = (0, import_react.useState)([]);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const online = MOCK_SERVERS.filter((s) => s.status === "online").length;
	const fetchPlugins = () => {
		fetch(getApiUrl("/plugins")).then((r) => r.json()).then((data) => setPlugins(data.filter((p) => p.isActive))).catch(() => {});
	};
	(0, import_react.useEffect)(() => {
		fetchPlugins();
		window.addEventListener("plugins-updated", fetchPlugins);
		return () => window.removeEventListener("plugins-updated", fetchPlugins);
	}, []);
	const ALLOWED_SCHEMES = [
		"http:",
		"https:",
		"mailto:"
	];
	const groupedPlugins = {};
	plugins.forEach((p) => {
		const cat = p.category || "Custom";
		if (!groupedPlugins[cat]) groupedPlugins[cat] = [];
		let target = p.targetRoute || `/plugin/${p.id}`;
		try {
			const u = new URL(target, window.location.origin);
			if (ALLOWED_SCHEMES.includes(u.protocol) && u.origin !== window.location.origin) target = `/plugin/${p.id}`;
			else if (!ALLOWED_SCHEMES.includes(u.protocol)) target = `/plugin/${p.id}`;
		} catch {
			target = target.replace(/^[a-z]+:/i, "");
		}
		groupedPlugins[cat].push({
			to: target,
			label: p.name,
			icon: ICONS[p.icon] || Puzzle
		});
	});
	const allGroups = [
		{
			label: "Overview",
			items: CORE_ITEMS
		},
		...Object.keys(groupedPlugins).map((cat) => ({
			label: cat,
			items: groupedPlugins[cat]
		})),
		{
			label: "System",
			items: SYSTEM_ITEMS
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		onMouseEnter: () => setExpanded(true),
		onMouseLeave: () => setExpanded(false),
		className: "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[var(--border-c)] bg-[var(--bg-surface)] transition-[width] duration-200 ease-out",
		style: { width: expanded ? 220 : 56 },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-14 shrink-0 items-center gap-3 border-b border-[var(--border-c)] px-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--amber-low)] text-[var(--amber)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hexagon, {
						size: 18,
						strokeWidth: 2.2
					})
				}), expanded && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "display text-[15px] font-bold tracking-[0.22em] text-[var(--amber)]",
						children: "NEXUS"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mono text-[8.5px] text-[var(--text-sub)]",
						children: "nexuslab.local"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "flex-1 overflow-y-auto overflow-x-hidden py-3",
				children: allGroups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3",
					children: [expanded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow px-4 pb-1.5 pt-1",
						children: g.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-0.5 px-1.5",
						children: g.items.map((it) => {
							const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
							const Icon = it.icon;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: it.to,
								className: ["group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-[13px] transition-colors", active ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-card)] hover:text-[var(--text)]"].join(" "),
								children: [
									active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-[var(--amber)]" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
										size: 16,
										className: "shrink-0"
									}),
									expanded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate",
										children: it.label
									})
								]
							}) }, it.to);
						})
					})]
				}, g.label))
			}),
			expanded && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t border-[var(--border-c)] px-3 py-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "eyebrow pb-1",
					children: "Fleet"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mono text-[12px] text-[var(--text)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[var(--ok)]",
						children: online
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-[var(--text-sub)]",
						children: [
							" / ",
							MOCK_SERVERS.length,
							" online"
						]
					})]
				})]
			})
		]
	});
}
var DropdownMenu = Root2;
var DropdownMenuTrigger = Trigger;
var DropdownMenuSubTrigger = import_react.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SubTrigger2, {
	ref,
	className: cn("flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-auto" })]
}));
DropdownMenuSubTrigger.displayName = SubTrigger2.displayName;
var DropdownMenuSubContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubContent2, {
	ref,
	className: cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}));
DropdownMenuSubContent.displayName = SubContent2.displayName;
var DropdownMenuContent = import_react.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	sideOffset,
	className: cn("z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}) }));
DropdownMenuContent.displayName = Content2.displayName;
var DropdownMenuItem = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0", inset && "pl-8", className),
	...props
}));
DropdownMenuItem.displayName = Item2.displayName;
var DropdownMenuCheckboxItem = import_react.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CheckboxItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	checked,
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), children]
}));
DropdownMenuCheckboxItem.displayName = CheckboxItem2.displayName;
var DropdownMenuRadioItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RadioItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-2 w-2 fill-current" }) })
	}), children]
}));
DropdownMenuRadioItem.displayName = RadioItem2.displayName;
var DropdownMenuLabel = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label2, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
	...props
}));
DropdownMenuLabel.displayName = Label2.displayName;
var DropdownMenuSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator2, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
DropdownMenuSeparator.displayName = Separator2.displayName;
var DropdownMenuShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest opacity-60", className),
		...props
	});
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
function Topbar() {
	const [notifications, setNotifications] = (0, import_react.useState)([]);
	const [showDropdown, setShowDropdown] = (0, import_react.useState)(false);
	const [unreadCount, setUnreadCount] = (0, import_react.useState)(0);
	const seenIds = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const [isLive, setIsLive] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined" && window.__nexus_backend_online !== void 0) return window.__nexus_backend_online;
		return true;
	});
	const navigate = useNavigate();
	const token = typeof window !== "undefined" ? localStorage.getItem("nexus_token") : null;
	let username = "User";
	if (token) try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		username = payload.unique_name || payload.name || "User";
	} catch (e) {}
	const handleLogout = () => {
		localStorage.removeItem("nexus_token");
		navigate({ to: "/login" });
	};
	const fetchNotifications = async () => {
		const data = await getNotificationsClient();
		setNotifications(data);
		const lastRead = Number(localStorage.getItem("nexus_notifications_read") || "0");
		setUnreadCount(data.filter((n) => new Date(n.timestamp).getTime() > lastRead).length);
		if (seenIds.current.size > 0) data.forEach((n) => {
			if (!seenIds.current.has(n.id)) {
				seenIds.current.add(n.id);
				if (n.type === "Success") toast.success(n.message);
				else if (n.type === "Error") toast.error(n.message);
				else toast.info(n.message);
			}
		});
		else data.forEach((n) => seenIds.current.add(n.id));
	};
	(0, import_react.useEffect)(() => {
		fetchNotifications();
		const connection = new HubConnectionBuilder().withUrl(getFullUrl("/hub/notifications"), { accessTokenFactory: () => localStorage.getItem("nexus_token") || "" }).withAutomaticReconnect().build();
		const MAX_NOTIFICATIONS = 100;
		connection.on("ReceiveNotification", (n) => {
			setNotifications((prev) => [n, ...prev].slice(0, MAX_NOTIFICATIONS));
			const lastRead = Number(localStorage.getItem("nexus_notifications_read") || "0");
			if (new Date(n.timestamp).getTime() > lastRead) setUnreadCount((prev) => prev + 1);
			if (!seenIds.current.has(n.id)) {
				seenIds.current.add(n.id);
				if (n.type === "Success") toast.success(n.message);
				else if (n.type === "Error" || n.type === "Critical") toast.error(n.message);
				else if (n.type === "Warning") toast.warning(n.message);
				else toast.info(n.message);
			}
		});
		connection.onreconnecting(() => {
			if (typeof window !== "undefined") window.__nexus_set_backend_offline();
		});
		connection.onreconnected(() => {
			if (typeof window !== "undefined") window.__nexus_set_backend_online();
		});
		connection.onclose(() => {
			if (typeof window !== "undefined") window.__nexus_set_backend_offline();
		});
		connection.start().then(() => {
			if (typeof window !== "undefined") window.__nexus_set_backend_online();
		}).catch((err) => {
			console.error("SignalR Topbar Error: ", err);
			if (typeof window !== "undefined") window.__nexus_set_backend_offline();
		});
		const handleStatusChange = (e) => {
			setIsLive(e.detail.online);
		};
		window.addEventListener("nexus-backend-status", handleStatusChange);
		return () => {
			connection.stop();
			window.removeEventListener("nexus-backend-status", handleStatusChange);
		};
	}, []);
	const handleClear = async (id) => {
		if (await clearNotificationClient(id)) setNotifications((prev) => prev.filter((n) => n.id !== id));
	};
	const handleClearAll = async () => {
		if (await clearAllNotificationsClient()) setNotifications([]);
	};
	const handleToggleDropdown = () => {
		const nextState = !showDropdown;
		setShowDropdown(nextState);
		if (nextState) {
			localStorage.setItem("nexus_notifications_read", Date.now().toString());
			setUnreadCount(0);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center gap-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						size: 14,
						className: "pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-sub)]"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						placeholder: "Search servers, services, events…",
						className: "mono h-9 w-[340px] rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] pl-8 pr-14 text-[12px] text-[var(--text)] placeholder:text-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
						className: "mono absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[var(--border-c)] bg-[var(--bg-void)] px-1.5 py-0.5 text-[9px] text-[var(--text-sub)]",
						children: "⌘K"
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [
				isLive ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mono flex items-center gap-1.5 rounded-full border border-[var(--teal)]/30 bg-[var(--teal-low)] px-2.5 py-1 text-[10px] tracking-[0.2em] text-[var(--teal)] transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "nx-blink h-1.5 w-1.5 rounded-full bg-[var(--teal)]" }), "LIVE"]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mono flex items-center gap-1.5 rounded-full border border-[var(--crit)]/30 bg-[var(--crit)]/10 px-2.5 py-1 text-[10px] tracking-[0.2em] text-[var(--crit)] transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-[var(--crit)]" }), "DEAD"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: handleToggleDropdown,
						className: "relative grid h-8 w-8 place-items-center rounded-md text-[var(--text-sub)] hover:bg-[var(--bg-card)] hover:text-[var(--text)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { size: 14 }), unreadCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--crit)]" })]
					}), showDropdown && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute right-0 top-10 w-80 rounded-md border border-[var(--border-dim)] bg-[var(--bg-surface)] shadow-lg overflow-hidden flex flex-col max-h-[400px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between border-b border-[var(--border-dim)] px-4 py-2 bg-[var(--bg-card)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[12px] font-medium text-[var(--text)]",
								children: "Notifications"
							}), notifications.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: handleClearAll,
								className: "text-[11px] text-[var(--blue)] hover:underline",
								children: "Clear all"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-y-auto flex-1 p-2 space-y-2",
							children: notifications.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "p-4 text-center text-[12px] text-[var(--text-sub)]",
								children: "No new notifications"
							}) : notifications.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `relative group rounded border border-[var(--border-dim)] p-3 pr-8 flex gap-3 items-start ${n.type === "Critical" ? "bg-[var(--crit)]/10 border-[var(--crit)]/30" : "bg-[var(--bg-card)]"}`,
								children: [
									n.type === "Success" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, {
										size: 14,
										className: "text-[var(--green)] mt-0.5 shrink-0"
									}),
									(n.type === "Error" || n.type === "Critical") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
										size: 14,
										className: "text-[var(--crit)] mt-0.5 shrink-0"
									}),
									n.type === "Warning" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
										size: 14,
										className: "text-[var(--amber)] mt-0.5 shrink-0"
									}),
									n.type === "Info" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
										size: 14,
										className: "text-[var(--blue)] mt-0.5 shrink-0"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] font-medium text-[var(--text)] break-words",
											children: n.message
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-[10px] text-[var(--text-sub)] mono",
											children: [
												new Date(n.timestamp).toLocaleTimeString(),
												" - ",
												n.serverIp
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => handleClear(n.id),
										className: "absolute right-2 top-2 text-[var(--text-sub)] hover:text-[var(--text)] opacity-0 group-hover:opacity-100 transition-opacity",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
									})
								]
							}, n.id))
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "display grid h-8 w-8 place-items-center rounded-md bg-[var(--amber-low)] text-[12px] font-bold text-[var(--amber)] hover:bg-[var(--amber)] hover:text-[var(--bg-void)] transition-colors cursor-pointer",
						style: { clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)" },
						children: username.charAt(0).toUpperCase()
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
					align: "end",
					className: "w-56 bg-[var(--bg-card)] border-[var(--border-dim)] text-[var(--text)] shadow-xl rounded-lg mt-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuLabel, {
							className: "font-normal py-3 px-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold leading-none text-[var(--text)]",
									children: username
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs leading-none text-[var(--text-sub)]",
									children: "Administrator"
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, { className: "bg-[var(--border-dim)]" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
							onClick: handleLogout,
							className: "text-[var(--crit)] hover:!bg-[var(--crit)]/10 hover:!text-[var(--crit)] cursor-pointer py-2.5 px-4 font-medium transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "mr-2 h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Log out" })]
						})
					]
				})] })
			]
		})]
	});
}
if (typeof window !== "undefined") {
	if (window.__nexus_backend_online === void 0) window.__nexus_backend_online = true;
	window.__nexus_set_backend_offline = (method) => {
		const wasOnline = window.__nexus_backend_online;
		window.__nexus_backend_online = false;
		if (wasOnline) toast.error("Connection to backend lost. Running in offline mode.");
		else if (method && method.toUpperCase() !== "GET") toast.error("Backend is dead/unreachable. Action failed.");
		window.dispatchEvent(new CustomEvent("nexus-backend-status", { detail: { online: false } }));
	};
	window.__nexus_set_backend_online = () => {
		const wasOffline = !window.__nexus_backend_online;
		window.__nexus_backend_online = true;
		if (wasOffline) toast.success("Backend connection restored.");
		window.dispatchEvent(new CustomEvent("nexus-backend-status", { detail: { online: true } }));
	};
}
if (typeof window !== "undefined" && !window.__nexus_fetch_patched) {
	const originalFetch = window.fetch;
	window.fetch = async (input, init) => {
		let requestUrl = "";
		if (typeof input === "string") requestUrl = input;
		else if (input instanceof Request) requestUrl = input.url;
		const token = localStorage.getItem("nexus_token");
		if (token && (requestUrl.includes("/api/") || requestUrl.includes("/hub/"))) if (input instanceof Request) try {
			input.headers.set("Authorization", `Bearer ${token}`);
		} catch (e) {
			const newHeaders = new Headers(input.headers);
			newHeaders.set("Authorization", `Bearer ${token}`);
			input = new Request(input, { headers: newHeaders });
		}
		else {
			if (!init) init = {};
			if (!init.headers) init.headers = {};
			const newHeaders = new Headers(init.headers);
			newHeaders.set("Authorization", `Bearer ${token}`);
			init.headers = newHeaders;
		}
		let method = "GET";
		if (init?.method) method = init.method;
		else if (input instanceof Request) method = input.method;
		const isHealthCheck = requestUrl.includes("/api/health");
		if (!window.__nexus_backend_online && !isHealthCheck) {
			window.__nexus_set_backend_offline(method);
			throw new TypeError("Failed to fetch (backend offline)");
		}
		try {
			const response = await originalFetch(input, init);
			if (response.status >= 500) window.__nexus_set_backend_offline(method);
			else window.__nexus_set_backend_online();
			if (response.status === 401 && window.location.pathname !== "/login") {
				if (requestUrl.includes("/api/") || requestUrl.includes("/hub/")) {
					localStorage.removeItem("nexus_token");
					window.location.href = "/login";
				}
			}
			return response;
		} catch (error) {
			window.__nexus_set_backend_offline(method);
			throw error;
		}
	};
	window.__nexus_fetch_patched = true;
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-[var(--bg-void)] px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "eyebrow pb-2",
					children: "Error 404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "display text-6xl font-bold text-[var(--amber)]",
					children: "Lost in transit"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-[var(--text-sub)]",
					children: "That route doesn't exist in the NEXUS topology."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/",
					className: "mono mt-6 inline-block rounded-md border border-[var(--amber)] bg-[var(--amber-low)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--amber)] hover:bg-[var(--amber)]/15",
					children: "← Dashboard"
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-[var(--bg-void)] px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "eyebrow pb-2",
					style: { color: "var(--crit)" },
					children: "Critical Fault"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "display text-2xl font-semibold text-[var(--text)]",
					children: "This panel didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-[var(--text-sub)]",
					children: error.message
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "mono rounded-md border border-[var(--amber)] bg-[var(--amber-low)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--amber)]",
						children: "Retry"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "mono rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--text-sub)]",
						children: "Home"
					})]
				})
			]
		})
	});
}
var ThemeContext = (0, import_react.createContext)({
	theme: "dark",
	setTheme: () => {}
});
var Route = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "NEXUS — Network EXecution & Unified Server-hub" },
			{
				name: "description",
				content: "Agentless Windows Server management platform."
			},
			{
				name: "author",
				content: "NEXUS Labs"
			},
			{
				property: "og:title",
				content: "NEXUS — Network EXecution & Unified Server-hub"
			},
			{
				property: "og:description",
				content: "Agentless Windows Server management platform."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary"
			},
			{
				name: "twitter:title",
				content: "NEXUS — Network EXecution & Unified Server-hub"
			},
			{
				name: "twitter:description",
				content: "Agentless Windows Server management platform."
			},
			{
				property: "og:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/91383599-2ab4-4880-ba55-a8c786a77339/id-preview-03466580--09846341-0ff1-4936-bf6d-bc9f4712b7e9.lovable.app-1781526245745.png"
			},
			{
				name: "twitter:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/91383599-2ab4-4880-ba55-a8c786a77339/id-preview-03466580--09846341-0ff1-4936-bf6d-bc9f4712b7e9.lovable.app-1781526245745.png"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "stylesheet",
				href: dark_default
			},
			{
				rel: "stylesheet",
				href: light_default
			},
			{
				rel: "stylesheet",
				href: slate_default
			},
			{
				rel: "stylesheet",
				href: stealth_default
			},
			{
				rel: "stylesheet",
				href: cyberpunk_default
			},
			{
				rel: "stylesheet",
				href: infrared_default
			},
			{
				rel: "stylesheet",
				href: horizon_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: `
          (function() {
            try {
              var t = localStorage.getItem('nexus-theme');
              if (t) document.documentElement.setAttribute('data-theme', t);
              else document.documentElement.setAttribute('data-theme', 'dark');
              
              var tt = localStorage.getItem('nexus-terminal-theme');
              if (tt) document.documentElement.setAttribute('data-terminal-theme', tt);
            } catch(e) {}
          })();
        ` } })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route.useRouteContext();
	const isLoginPage = useRouterState({ select: (s) => s.location.pathname === "/login" });
	const [theme, setTheme] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined") return localStorage.getItem("nexus-theme") || "dark";
		return "dark";
	});
	(0, import_react.useEffect)(() => {
		const handleThemeChange = (e) => {
			const t = e.detail?.theme;
			if (t) {
				setTheme(t);
				document.documentElement.setAttribute("data-theme", t);
			}
		};
		window.addEventListener("nexus-theme-change", handleThemeChange);
		fetch(getApiUrl("/settings")).then((res) => res.json()).then((data) => {
			if (data.theme) {
				setTheme(data.theme);
				document.documentElement.setAttribute("data-theme", data.theme);
				try {
					localStorage.setItem("nexus-theme", data.theme);
				} catch (e) {}
			}
			if (data.terminalTheme) {
				document.documentElement.setAttribute("data-terminal-theme", data.terminalTheme);
				try {
					localStorage.setItem("nexus-terminal-theme", data.terminalTheme);
				} catch (e) {}
			}
			if (data.animationsEnabled !== void 0) {
				try {
					localStorage.setItem("nexus-animations", data.animationsEnabled ? "true" : "false");
				} catch (e) {}
				if (!data.animationsEnabled) document.documentElement.classList.add("no-animations");
				else document.documentElement.classList.remove("no-animations");
			}
		}).catch(() => {});
		return () => {
			window.removeEventListener("nexus-theme-change", handleThemeChange);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const pollHealth = () => {
			const backendUrl = getBackendUrl();
			const healthUrl = backendUrl ? `${backendUrl}/api/health` : "/api/health";
			if (!backendUrl && typeof window !== "undefined" && !window.location.hostname.match(/^(localhost|127\.0\.0\.1)$/)) return;
			fetch(healthUrl).then((res) => {
				if (res.status < 500) window.__nexus_set_backend_online();
				else window.__nexus_set_backend_offline("GET");
			}).catch(() => {
				window.__nexus_set_backend_offline("GET");
			});
		};
		pollHealth();
		const interval = setInterval(pollHealth, 5e3);
		return () => clearInterval(interval);
	}, []);
	if (isLoginPage) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ThemeContext.Provider, {
			value: {
				theme,
				setTheme
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				theme: "dark",
				position: "top-right",
				richColors: true
			})]
		})
	});
	if (theme === "horizon") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ThemeContext.Provider, {
			value: {
				theme,
				setTheme
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HorizonLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				theme: "light",
				position: "top-right",
				richColors: true
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeContext.Provider, {
			value: {
				theme,
				setTheme
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-screen w-full bg-[var(--bg-void)] text-[var(--text)] transition-colors duration-300",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-14 flex min-h-screen flex-col",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Topbar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
							className: "flex-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
						theme: "dark",
						position: "top-right",
						richColors: true
					})
				]
			})
		})
	});
}
//#endregion
export { DropdownMenuTrigger as a, DropdownMenuSeparator as i, DropdownMenuContent as n, Route as o, DropdownMenuItem as r, ThemeContext as s, DropdownMenu as t };
