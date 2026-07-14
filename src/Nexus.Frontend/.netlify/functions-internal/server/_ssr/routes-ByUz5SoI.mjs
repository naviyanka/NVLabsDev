import { i as __toESM } from "../_runtime.mjs";
import { T as getNotificationsClient, j as getServersClient, x as getFullUrl } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { A as RefreshCw, At as ChevronDown, Ct as CircleX, D as ScrollText, Et as CircleCheckBig, Ot as ChevronUp, Q as Hexagon, T as Server, W as Monitor, f as TriangleAlert, kt as ChevronRight, m as Terminal } from "../_libs/lucide-react.mjs";
import { t as StatusBadge } from "./StatusBadge-DvNl1BAE.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as HubConnectionBuilder } from "../_libs/microsoft__signalr.mjs";
import { s as ThemeContext } from "../__root-H47vz4C-.mjs";
import { t as NxCard } from "./NxCard-CBVxGsdQ.mjs";
import { t as MetricBar } from "./MetricBar-Dg0Qv4vm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-ByUz5SoI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function HorizonDashboard() {
	const [servers, setServers] = (0, import_react.useState)([]);
	const [notifications, setNotifications] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const navigate = useNavigate();
	const loadData = async () => {
		setServers(await getServersClient());
		setLoading(false);
	};
	const hour = (/* @__PURE__ */ new Date()).getHours();
	let greeting = "Good evening";
	if (hour >= 5 && hour < 12) greeting = "Good morning";
	else if (hour >= 12 && hour < 17) greeting = "Good afternoon";
	const [userName, setUserName] = (0, import_react.useState)(() => {
		try {
			const userStr = localStorage.getItem("nexus-user");
			return userStr ? JSON.parse(userStr).username || "Admin" : "Admin";
		} catch (e) {
			return "Admin";
		}
	});
	(0, import_react.useEffect)(() => {
		loadData();
		getNotificationsClient().then((notifs) => setNotifications(notifs));
		const id = setInterval(() => {
			loadData();
			getNotificationsClient().then((notifs) => setNotifications(notifs));
		}, 1e4);
		return () => clearInterval(id);
	}, []);
	const online = servers.filter((s) => s.status === "online").length;
	const offline = servers.filter((s) => s.status === "critical").length;
	const warning = servers.filter((s) => s.status === "warning").length;
	const alerts = notifications.filter((n) => n.type === "Critical" || n.type === "Warning" || n.type === "Error").slice(0, 5);
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-64 items-center justify-center text-[var(--text-sub)] text-sm",
		children: "Loading Horizon Fleet Data…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-[1600px] mx-auto space-y-8 font-sans",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "relative w-full rounded-[1.5rem] overflow-hidden shadow-sm bg-[var(--bg-surface)] border border-[var(--border-c)] min-h-[220px] flex items-center p-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-r from-[var(--amber-low)] to-transparent pointer-events-none opacity-50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative z-10 max-w-2xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "text-4xl font-extrabold tracking-tight text-[var(--text)] mb-4 leading-tight",
						children: [
							greeting,
							", ",
							userName,
							".",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[var(--amber)]",
								children: [online, " servers online"]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => navigate({ to: "/servers" }),
						className: "bg-[var(--amber)] hover:opacity-90 text-white font-semibold py-3 px-8 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 mt-4",
						children: "View Fleet Management"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid grid-cols-1 md:grid-cols-4 gap-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-[var(--bg-surface)] rounded-[1.2rem] p-6 shadow-sm border border-[var(--border-c)] relative overflow-hidden group hover:-translate-y-1 transition-transform",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-0 w-full h-1 bg-[var(--teal)]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between items-start mb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[var(--text-sub)] text-xs font-semibold uppercase tracking-widest",
									children: "Total Servers"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, {
									size: 20,
									className: "text-[var(--teal)]"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-4xl font-extrabold text-[var(--text)]",
								children: servers.length
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-[var(--bg-surface)] rounded-[1.2rem] p-6 shadow-sm border border-[var(--border-c)] relative overflow-hidden group hover:-translate-y-1 transition-transform",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-0 w-full h-1 bg-[var(--ok)]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between items-start mb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[var(--text-sub)] text-xs font-semibold uppercase tracking-widest",
									children: "Online"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheckBig, {
									size: 20,
									className: "text-[var(--ok)]"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-4xl font-extrabold text-[var(--text)]",
								children: online
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-[var(--bg-surface)] rounded-[1.2rem] p-6 shadow-sm border border-[var(--border-c)] relative overflow-hidden group hover:-translate-y-1 transition-transform",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-0 w-full h-1 bg-[var(--warn)]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between items-start mb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[var(--text-sub)] text-xs font-semibold uppercase tracking-widest",
									children: "Warning Load"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
									size: 20,
									className: "text-[var(--warn)]"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-4xl font-extrabold text-[var(--text)]",
								children: warning
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-[var(--bg-surface)] rounded-[1.2rem] p-6 shadow-sm border border-[var(--border-c)] relative overflow-hidden group hover:-translate-y-1 transition-transform",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-0 w-full h-1 bg-[var(--crit)]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between items-start mb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[var(--text-sub)] text-xs font-semibold uppercase tracking-widest flex items-center gap-2",
									children: ["Critical Faults", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 bg-[var(--crit)] rounded-full animate-pulse" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {
									size: 20,
									className: "text-[var(--crit)]"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-4xl font-extrabold text-[var(--crit)]",
								children: offline
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid grid-cols-1 lg:grid-cols-3 gap-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-2 bg-[var(--bg-surface)] rounded-[1.5rem] shadow-sm border border-[var(--border-c)] overflow-hidden flex flex-col",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-6 border-b border-[var(--border-c)] flex justify-between items-center bg-[var(--amber-low)]/20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-lg font-bold text-[var(--text)]",
							children: "Server Fleet Status"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => navigate({ to: "/servers" }),
							className: "text-[var(--amber)] text-sm font-semibold hover:underline flex items-center gap-1",
							children: ["View All ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 16 })]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full text-left border-collapse",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "bg-[var(--bg-void)] text-[var(--text-sub)] text-[11px] uppercase tracking-widest font-bold border-b border-[var(--border-c)]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "p-4 pl-6 w-16" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-4",
										children: "Name"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-4",
										children: "IP Address"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-4 w-48",
										children: "CPU Usage"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-4",
										children: "RAM"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-4 pr-6 text-right",
										children: "Status"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
								className: "divide-y divide-[var(--border-c)]",
								children: servers.slice(0, 5).map((srv) => {
									const init = srv.name.slice(0, 2).toUpperCase();
									const isOnline = srv.status === "online";
									const isWarn = srv.status === "warning";
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "hover:bg-[var(--amber-low)]/30 transition-colors",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "p-4 pl-6 text-center",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "w-8 h-8 rounded-full bg-[var(--amber-low)] text-[var(--amber)] flex items-center justify-center font-bold text-xs mx-auto border border-[var(--amber)]/20",
													children: init
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "p-4 font-bold text-[var(--text)]",
												children: srv.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "p-4 font-mono text-xs text-[var(--text-sub)]",
												children: srv.ip
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "p-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "w-full h-1.5 bg-[var(--border-dim)] rounded-full overflow-hidden",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "h-full rounded-full",
															style: {
																width: `${srv.cpu}%`,
																backgroundColor: srv.cpu > 80 ? "var(--crit)" : srv.cpu > 50 ? "var(--warn)" : "var(--amber)"
															}
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-xs font-semibold text-[var(--text-sub)] w-8",
														children: [srv.cpu, "%"]
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "p-4 text-xs text-[var(--text-sub)]",
												children: [srv.mem, "% (Used)"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "p-4 pr-6 text-right",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isOnline ? "bg-[var(--ok)]/10 text-[var(--ok)] border border-[var(--ok)]/20" : isWarn ? "bg-[var(--warn)]/10 text-[var(--warn)] border border-[var(--warn)]/20" : "bg-[var(--crit)]/10 text-[var(--crit)] border border-[var(--crit)]/20"}`,
													children: srv.status.toUpperCase()
												})
											})
										]
									}, srv.ip);
								})
							})]
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-[var(--bg-surface)] rounded-[1.5rem] shadow-sm border border-[var(--border-c)] p-6 flex flex-col justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-lg font-bold text-[var(--text)] mb-6",
						children: "Recent Alerts"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative border-l-2 border-[var(--border-c)] ml-3 space-y-8 pb-4",
						children: [alerts.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative pl-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-[var(--bg-surface)] shadow-sm ${n.type === "Critical" || n.type === "Error" ? "bg-[var(--crit)]" : "bg-[var(--warn)]"}` }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-mono text-[var(--text-sub)] mb-1",
									children: new Date(n.timestamp).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
									className: "font-semibold text-[var(--text)] text-sm",
									children: [
										n.type,
										" Alert: ",
										n.serverIp ?? "System"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-[var(--text-sub)] mt-1 leading-snug",
									children: n.message
								})
							]
						}, n.id)), alerts.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "py-12 text-center text-xs text-[var(--text-sub)]",
							children: "No critical alerts detected ✓"
						})]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => navigate({ to: "/events" }),
						className: "w-full mt-6 py-2.5 border border-[var(--border-c)] rounded-full text-xs font-semibold text-[var(--text-sub)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] transition-colors",
						children: "View Alert History"
					})]
				})]
			})
		]
	});
}
function Dashboard() {
	const { theme } = (0, import_react.useContext)(ThemeContext);
	if (theme === "horizon") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HorizonDashboard, {});
	const [servers, setServers] = (0, import_react.useState)([]);
	const [notifications, setNotifications] = (0, import_react.useState)([]);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const navigate = useNavigate();
	const [drawerOpen, setDrawerOpen] = (0, import_react.useState)(true);
	const loadData = async () => {
		const srvs = await getServersClient();
		setServers(srvs);
		if (srvs.length > 0 && !selected) setSelected(srvs[0].ip);
		setLoading(false);
	};
	(0, import_react.useEffect)(() => {
		loadData();
		getNotificationsClient().then((notifs) => setNotifications(notifs));
		const id = setInterval(loadData, 1e4);
		const connection = new HubConnectionBuilder().withUrl(getFullUrl("/hub/notifications"), { accessTokenFactory: () => localStorage.getItem("nexus_token") || "" }).withAutomaticReconnect().build();
		const MAX_NOTIFICATIONS = 100;
		connection.on("ReceiveNotification", (notification) => {
			setNotifications((prev) => [notification, ...prev].slice(0, MAX_NOTIFICATIONS));
		});
		connection.start().catch((err) => console.error("SignalR Connection Error: ", err));
		return () => {
			clearInterval(id);
			connection.stop();
		};
	}, []);
	const server = servers.find((s) => s.ip === selected) ?? servers[0];
	const online = servers.filter((s) => s.status === "online").length;
	const warning = servers.filter((s) => s.status === "warning").length;
	const critical = servers.filter((s) => s.status === "critical").length;
	const alerts = notifications.filter((n) => n.type === "Critical" || n.type === "Warning" || n.type === "Error").slice(0, 5);
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageWrapper, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-64 items-center justify-center text-[var(--text-sub)] text-sm",
		children: "Loading fleet data…"
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-[380px_1fr] gap-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-card p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "eyebrow pb-1",
					children: "Live Topology"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "display pb-4 text-[15px] font-semibold",
					children: "nexuslab.local"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Topology, {
					servers,
					selected,
					onSelect: setSelected
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex items-center justify-center gap-4 text-[10px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
							color: "var(--ok)",
							label: "Online"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
							color: "var(--warn)",
							label: "Warning"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
							color: "var(--crit)",
							label: "Critical"
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-5",
			children: [
				server && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "nx-card p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "eyebrow pb-1",
									children: "Selected Node"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "display text-[22px] font-semibold",
									children: server.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mono pt-1 text-[11px] text-[var(--text-sub)]",
									children: [
										server.role,
										" · ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[var(--text)]",
											children: server.ip
										}),
										" · ",
										server.os
									]
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: server.status })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 grid grid-cols-3 gap-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricBar, {
									label: "CPU",
									value: server.cpu,
									warning: 75,
									critical: 90
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricBar, {
									label: "Memory",
									value: server.mem,
									warning: 75,
									critical: 90
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricBar, {
									label: "Disk C:",
									value: server.disk,
									warning: 75,
									critical: 90
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 grid grid-cols-2 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
									icon: Monitor,
									label: "Remote Desktop",
									onClick: () => navigate({
										to: `/server/$serverId`,
										params: { serverId: server.ip }
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
									icon: Terminal,
									label: "PowerShell",
									onClick: () => navigate({
										to: "/powershell",
										search: { serverIp: server.ip }
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
									icon: RefreshCw,
									label: "Restart Services"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickAction, {
									icon: ScrollText,
									label: "Event Viewer",
									onClick: () => navigate({
										to: `/server/$serverId`,
										params: { serverId: server.ip }
									})
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-3 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
							label: "Online",
							count: online,
							color: "var(--ok)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
							label: "Warning",
							count: warning,
							color: "var(--warn)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatTile, {
							label: "Critical",
							count: critical,
							color: "var(--crit)"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NxCard, {
					eyebrow: "Recent Alerts",
					title: "Across fleet (last 24h)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "divide-y divide-[var(--border-dim)]",
						children: [alerts.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-[80px_70px_1fr] items-center gap-3 py-2 text-[12px]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mono text-[var(--text-sub)]",
									children: new Date(n.timestamp).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, {
									status: n.type === "Critical" || n.type === "Error" ? "critical" : "warning",
									children: n.type
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "truncate text-[var(--text)]",
									children: n.message
								})
							]
						}, n.id)), alerts.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "py-6 text-center text-[12px] text-[var(--text-sub)]",
							children: "No alerts in the last 24h ✓"
						})]
					})
				})
			]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-6 nx-card overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			onClick: () => setDrawerOpen((o) => !o),
			className: "flex w-full items-center justify-between px-5 py-3 hover:bg-[var(--bg-surface)] cursor-pointer",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, {
						size: 14,
						className: "text-[var(--amber)]"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "eyebrow",
						children: "Live Event Stream"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "nx-blink ml-2 h-1.5 w-1.5 rounded-full bg-[var(--teal)]" })
				]
			}), drawerOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
				size: 14,
				className: "text-[var(--text-sub)]"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, {
				size: 14,
				className: "text-[var(--text-sub)]"
			})]
		}), drawerOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-h-[260px] overflow-y-auto border-t border-[var(--border-c)] bg-[var(--bg-void)]/40",
			children: [notifications.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "py-6 text-center text-[12px] text-[var(--text-sub)]",
				children: "No notifications yet."
			}), notifications.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mono flex gap-3 px-5 py-1.5 text-[11px] " + (i % 2 ? "bg-[var(--bg-surface)]/40" : ""),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-[var(--text-sub)]",
						children: [
							"[",
							new Date(n.timestamp).toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
								second: "2-digit"
							}),
							"]"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "w-[60px]",
						style: { color: n.type === "Critical" || n.type === "Error" ? "var(--crit)" : n.type === "Warning" ? "var(--warn)" : "var(--teal)" },
						children: [
							"[",
							n.type.toUpperCase().slice(0, 4),
							"]"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "w-[68px] text-[var(--amber)]",
						children: [
							"[",
							n.serverIp?.slice(0, 8) ?? "---",
							"]"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex-1 truncate text-[var(--text)]",
						children: n.message
					})
				]
			}, n.id))]
		})]
	})] });
}
function Legend({ color, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mono flex items-center gap-1.5 uppercase tracking-[0.2em] text-[var(--text-sub)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "h-1.5 w-1.5 rounded-full",
			style: { background: color }
		}), label]
	});
}
function QuickAction({ icon: Icon, label, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: "group flex items-center gap-2.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2.5 text-[12px] text-[var(--text-sub)] transition-colors hover:border-[var(--amber)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 14 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "truncate",
			children: label
		})]
	});
}
function StatTile({ label, count, color }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "nx-card p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "eyebrow pb-1.5",
			style: { color },
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "display text-[28px] font-bold",
			style: { color },
			children: count
		})]
	});
}
function Topology({ servers, selected, onSelect }) {
	const size = 320, cx = size / 2, cy = size / 2, R = 112;
	const nodes = (0, import_react.useMemo)(() => servers.map((s, i) => {
		const angle = i / Math.max(servers.length, 1) * Math.PI * 2 - Math.PI / 2;
		return {
			...s,
			x: cx + Math.cos(angle) * R,
			y: cy + Math.sin(angle) * R
		};
	}), [
		servers,
		cx,
		cy
	]);
	const colorFor = (s) => s === "online" ? "var(--ok)" : s === "warning" ? "var(--warn)" : s === "critical" ? "var(--crit)" : "var(--text-sub)";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: `0 0 ${size} ${size}`,
		width: size,
		height: size,
		className: "block",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
				style: {
					transformOrigin: `${cx}px ${cy}px`,
					animation: "nx-spin-slow 20s linear infinite"
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx,
					cy,
					r: 136,
					fill: "none",
					stroke: "var(--amber)",
					strokeOpacity: "0.35",
					strokeWidth: "1",
					strokeDasharray: "3 6"
				})
			}),
			nodes.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: cx,
				y1: cy,
				x2: n.x,
				y2: n.y,
				stroke: colorFor(n.status),
				strokeOpacity: "0.35",
				strokeWidth: "1",
				strokeDasharray: "3 4"
			}, "l" + n.ip)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				transform: `translate(${cx} ${cy})`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
						points: "0,-30 26,-15 26,15 0,30 -26,15 -26,-15",
						fill: "var(--amber-low)",
						stroke: "var(--amber)",
						strokeWidth: "1.5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("foreignObject", {
						x: -26,
						y: -12,
						width: "52",
						height: "24",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mono grid h-full place-items-center text-[7.5px] uppercase tracking-[0.18em] text-[var(--amber)]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hexagon, { size: 12 })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						textAnchor: "middle",
						y: 48,
						className: "mono",
						fill: "var(--amber)",
						fontSize: "8",
						letterSpacing: "2",
						children: "NEXUS HUB"
					})
				]
			}),
			nodes.map((n) => {
				const isSel = n.ip === selected;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					transform: `translate(${n.x} ${n.y})`,
					onClick: () => onSelect(n.ip),
					className: "cursor-pointer",
					children: [
						isSel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							r: 18,
							fill: "none",
							stroke: colorFor(n.status),
							strokeOpacity: "0.7",
							strokeWidth: "1.5",
							style: {
								transformOrigin: "0 0",
								animation: "nx-ring-pulse 1.6s ease-out infinite"
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							r: 16,
							fill: "var(--bg-surface)",
							stroke: colorFor(n.status),
							strokeWidth: isSel ? 2 : 1.5
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							textAnchor: "middle",
							dy: "3",
							className: "mono",
							fill: "var(--text)",
							fontSize: "7",
							children: n.name.slice(0, 8)
						})
					]
				}, n.ip);
			})
		]
	});
}
//#endregion
export { Dashboard as component };
