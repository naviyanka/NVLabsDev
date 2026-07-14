import { i as __toESM } from "../_runtime.mjs";
import { A as getRolesClient, Q as uninstallRoleClient, j as getServersClient, z as installRoleClient } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { A as RefreshCw, At as ChevronDown, Ct as CircleX, Dt as CircleAlert, E as Search, I as Play, It as Boxes, O as Save, Ot as ChevronUp, S as ShieldAlert, T as Server, W as Monitor, Y as Layers, Z as Info, bt as Clock, et as HardDrive, f as TriangleAlert, i as Volume2, j as Radio, n as X, p as Trash2, q as LoaderCircle, tt as Globe, u as Undo2, ut as Download, x as ShieldCheck, xt as Clipboard } from "../_libs/lucide-react.mjs";
import { t as StatusBadge } from "./StatusBadge-DvNl1BAE.mjs";
import { i as getEvents } from "./mock-C8obigBb.mjs";
import { d as createRouter, m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Route$25 } from "./files-meeEwPxJ.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { o as Route$26, s as ThemeContext } from "../__root-H47vz4C-.mjs";
import { t as Route$27 } from "./plugin._id-CkGWTUIo.mjs";
import { t as Route$28 } from "./powershell-BKX_PUQO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-B_iLcBet.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var $$splitComponentImporter$21 = () => import("./vswitches-MZ_7SnAv.mjs");
var Route$24 = createFileRoute("/vswitches")({
	head: () => ({ meta: [{ title: "Virtual Switches — NEXUS" }, {
		name: "description",
		content: "Manage Hyper-V virtual switches."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
var $$splitComponentImporter$20 = () => import("./vms-Be1OFEOm.mjs");
var Route$23 = createFileRoute("/vms")({
	head: () => ({ meta: [{ title: "Virtual Machines — NEXUS" }, {
		name: "description",
		content: "Manage Hyper-V virtual machines."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
var $$splitComponentImporter$19 = () => import("./users-BqRq8PQq.mjs");
var Route$22 = createFileRoute("/users")({
	head: () => ({ meta: [{ title: "Users & Groups — NEXUS" }, {
		name: "description",
		content: "Local users and groups."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
var $$splitComponentImporter$18 = () => import("./updates-BN9XcRUT.mjs");
var Route$21 = createFileRoute("/updates")({
	head: () => ({ meta: [{ title: "Windows Updates — NEXUS" }] }),
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
var $$splitComponentImporter$17 = () => import("./tasks-CjTmCesR.mjs");
var Route$20 = createFileRoute("/tasks")({
	head: () => ({ meta: [{ title: "Scheduled Tasks — NEXUS" }, {
		name: "description",
		content: "Manage Windows scheduled tasks."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$17, "component")
});
var $$splitComponentImporter$16 = () => import("./storage-replica-85zhY5bC.mjs");
var Route$19 = createFileRoute("/storage-replica")({
	head: () => ({ meta: [{ title: "Storage Replica — NEXUS" }, {
		name: "description",
		content: "Block-level volume replication."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
var $$splitComponentImporter$15 = () => import("./storage-BVjToe-M.mjs");
var Route$18 = createFileRoute("/storage")({
	head: () => ({ meta: [{ title: "Storage — NEXUS" }, {
		name: "description",
		content: "Disks, volumes, and storage health."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
var $$splitComponentImporter$14 = () => import("./settings-vrPuI_tt.mjs");
var Route$17 = createFileRoute("/settings")({
	head: () => ({ meta: [{ title: "Global Settings — NEXUS" }] }),
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
var $$splitComponentImporter$13 = () => import("./services-D8Y3ZD3O.mjs");
var Route$16 = createFileRoute("/services")({
	head: () => ({ meta: [{ title: "Services — NEXUS" }, {
		name: "description",
		content: "Manage Windows services across your fleet."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./servers-CWRx_WLB.mjs");
var Route$15 = createFileRoute("/servers")({
	head: () => ({ meta: [{ title: "Servers — NEXUS" }, {
		name: "description",
		content: "Manage your Windows Server fleet."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./security-DMId1ZfC.mjs");
var Route$14 = createFileRoute("/security")({
	head: () => ({ meta: [{ title: "Security Events — NEXUS" }, {
		name: "description",
		content: "Security posture, failed logins, and open ports."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var Route$13 = createFileRoute("/roles")({
	head: () => ({ meta: [{ title: "Roles & Features — NEXUS" }, {
		name: "description",
		content: "Manage Windows Server Roles and Optional Features."
	}] }),
	component: RolesPage
});
function RolesPage() {
	const { theme } = (0, import_react.useContext)(ThemeContext);
	const [server, setServer] = (0, import_react.useState)("");
	const [serverInfo, setServerInfo] = (0, import_react.useState)(null);
	const [roles, setRoles] = (0, import_react.useState)([]);
	const [q, setQ] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("all");
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	const [pendingAction, setPendingAction] = (0, import_react.useState)(null);
	const [sortCol, setSortCol] = (0, import_react.useState)("displayName");
	const [sortAsc, setSortAsc] = (0, import_react.useState)(true);
	const fetchServers = async () => {
		const list = await getServersClient();
		if (list.length > 0) {
			setServer(list[0].ip);
			setServerInfo(list[0]);
		}
	};
	const fetchRoles = (0, import_react.useCallback)(async (id) => {
		setIsLoading(true);
		try {
			const cachedData = await getRolesClient(id, false);
			if (cachedData && cachedData.length > 0) setRoles(cachedData);
			setRoles(await getRolesClient(id, true));
		} catch {
			toast.error("Failed to load roles & features");
		} finally {
			setIsLoading(false);
		}
	}, []);
	const handleRefresh = (0, import_react.useCallback)(() => {
		if (server) fetchRoles(server);
	}, [server, fetchRoles]);
	(0, import_react.useEffect)(() => {
		fetchServers();
	}, []);
	(0, import_react.useEffect)(() => {
		if (server) {
			getServersClient().then((list) => {
				setServerInfo(list.find((x) => x.ip === server || x.id === server) ?? null);
			});
			fetchRoles(server);
		}
	}, [server, fetchRoles]);
	const handleInstall = async (role) => {
		if (!confirm(`Install ${role.displayName}? This may require a server restart.`)) return;
		setPendingAction(`install-${role.name}`);
		try {
			if (await installRoleClient(server, role.name, role.featureType)) {
				toast.success(`${role.displayName} installed`, { description: "Refresh the list to confirm state." });
				fetchRoles(server);
			} else toast.error(`Failed to install ${role.displayName}`, { description: "May require a restart or install sources." });
		} catch {
			toast.error(`Install failed for ${role.displayName}`);
		} finally {
			setPendingAction(null);
		}
	};
	const handleUninstall = async (role) => {
		if (!confirm(`Remove ${role.displayName}? Services depending on it may stop working.`)) return;
		setPendingAction(`uninstall-${role.name}`);
		try {
			if (await uninstallRoleClient(server, role.name, role.featureType)) {
				toast.success(`${role.displayName} removed`, { description: "A restart may be required to complete removal." });
				fetchRoles(server);
			} else toast.error(`Failed to remove ${role.displayName}`, { description: "May require a restart." });
		} catch {
			toast.error(`Removal failed for ${role.displayName}`);
		} finally {
			setPendingAction(null);
		}
	};
	const handleSort = (col) => {
		if (sortCol === col) setSortAsc(!sortAsc);
		else {
			setSortCol(col);
			setSortAsc(true);
		}
	};
	const isRole = (r) => r.featureType === "Role" || r.featureType === "role";
	const counts = {
		all: roles.length,
		role: roles.filter(isRole).length,
		feature: roles.filter((r) => !isRole(r)).length,
		installed: roles.filter((r) => r.installState === "Installed").length
	};
	const filtered = roles.filter((r) => category === "all" || category === "role" && isRole(r) || category === "feature" && !isRole(r)).filter((r) => r.displayName.toLowerCase().includes(q.toLowerCase()) || r.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => {
		const aVal = String(a[sortCol]).toLowerCase();
		const bVal = String(b[sortCol]).toLowerCase();
		if (aVal < bVal) return sortAsc ? -1 : 1;
		if (aVal > bVal) return sortAsc ? 1 : -1;
		return 0;
	});
	const isServerOffline = serverInfo && serverInfo.status !== "online";
	if (theme === "horizon") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-[1600px] mx-auto space-y-6 font-sans",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HorizonHeader, {
				server: serverInfo,
				counts
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
				value: server,
				onChange: setServer
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlBar$1, {
				q,
				setQ,
				category,
				setCategory,
				counts,
				onRefresh: handleRefresh,
				isLoading
			}),
			isServerOffline && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfflineBanner, { status: serverInfo.status }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RolesTable, {
				filtered,
				isLoading,
				sortCol,
				sortAsc,
				onSort: handleSort,
				onInstall: handleInstall,
				onUninstall: handleUninstall,
				pendingAction,
				hasQuery: q !== "" || category !== "all",
				onClear: () => {
					setQ("");
					setCategory("all");
				}
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Management",
			title: "Roles & Features"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
			value: server,
			onChange: setServer
		}),
		serverInfo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mono mt-3 flex items-center gap-2 text-[11px] text-[var(--text-sub)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, { size: 12 }),
				" ",
				serverInfo.name,
				" · ",
				serverInfo.os,
				" · ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: serverInfo.status })
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlBar$1, {
			q,
			setQ,
			category,
			setCategory,
			counts,
			onRefresh: handleRefresh,
			isLoading
		}),
		isServerOffline && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfflineBanner, { status: serverInfo.status }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] overflow-hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RolesTable, {
				filtered,
				isLoading,
				sortCol,
				sortAsc,
				onSort: handleSort,
				onInstall: handleInstall,
				onUninstall: handleUninstall,
				pendingAction,
				hasQuery: q !== "" || category !== "all",
				onClear: () => {
					setQ("");
					setCategory("all");
				}
			})
		})
	] });
}
function HorizonHeader({ server, counts }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
		className: "text-3xl font-extrabold text-[var(--text)]",
		children: "Roles & Features"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "text-sm text-[var(--text-sub)] mt-1",
		children: [
			server ? `${server.name} · ${server.os}` : "Select a server",
			" · ",
			counts.installed,
			" installed of ",
			counts.all
		]
	})] });
}
function ControlBar$1({ q, setQ, category, setCategory, counts, onRefresh, isLoading }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] p-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center gap-2",
				children: [
					{
						v: "all",
						icon: Boxes,
						label: "All",
						n: counts.all
					},
					{
						v: "role",
						icon: ShieldCheck,
						label: "Server Roles",
						n: counts.role
					},
					{
						v: "feature",
						icon: Layers,
						label: "Optional Features",
						n: counts.feature
					}
				].map((opt) => {
					const Icon = opt.icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setCategory(opt.v),
						className: `mono flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] uppercase tracking-[0.15em] transition-colors ${category === opt.v ? "bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]" : "text-[var(--text-sub)] border border-transparent hover:text-[var(--text)]"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 12 }),
							" ",
							opt.label,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-1 rounded bg-[var(--bg-card)] px-1 text-[9px]",
								children: opt.n
							})
						]
					}, opt.v);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex w-full max-w-sm items-center gap-2 rounded bg-[var(--bg-card)] px-2 py-1.5 border border-[var(--border-dim)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
					size: 14,
					className: "text-[var(--text-sub)]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "Search roles or features...",
					className: "w-full bg-transparent text-[12px] outline-none placeholder:text-[var(--text-dim)]"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: onRefresh,
				disabled: isLoading,
				className: "flex items-center gap-2 rounded bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] border border-[var(--border-dim)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
					size: 14,
					className: isLoading ? "animate-spin" : ""
				}), " Refresh"]
			})
		]
	});
}
function OfflineBanner({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 flex items-center gap-2 rounded-md border border-[var(--warn)]/30 bg-[var(--warn)]/5 p-3 text-[12px] text-[var(--warn)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 14 }),
			"Server is currently ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-semibold capitalize",
				children: status
			}),
			" — role operations may fail or be queued."
		]
	});
}
function RolesTable({ filtered, isLoading, sortCol, sortAsc, onSort, onInstall, onUninstall, pendingAction, hasQuery, onClear }) {
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-center gap-2 p-8 text-[13px] text-[var(--text-sub)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
			size: 14,
			className: "animate-spin"
		}), " Loading roles & features…"]
	});
	if (filtered.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-12 text-center flex flex-col items-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, {
				size: 32,
				className: "text-[var(--text-dim)] mb-3"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[14px] font-medium text-[var(--text)]",
				children: hasQuery ? "No roles match your filters" : "No roles or features found"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[12px] text-[var(--text-sub)] mt-1 max-w-md",
				children: hasQuery ? "Try clearing the search or category filter." : "Make sure the server is online and accessible."
			}),
			hasQuery && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: onClear,
				className: "mono mt-3 flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-[var(--amber)] hover:underline",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, { size: 12 }), " Clear filters"]
			})
		]
	});
	const SortIcon = ({ col }) => sortCol === col ? sortAsc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { size: 12 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 12 }) : null;
	const isRole = (r) => r.featureType === "Role" || r.featureType === "role";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full text-left text-[12px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "border-b border-[var(--border-dim)] bg-[var(--bg-card)] text-[11px] uppercase tracking-wider text-[var(--text-sub)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors select-none",
						onClick: () => onSort("displayName"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: ["Display Name ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "displayName" })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors select-none",
						onClick: () => onSort("name"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: ["System Name ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "name" })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors select-none",
						onClick: () => onSort("featureType"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: ["Type ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "featureType" })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors select-none",
						onClick: () => onSort("installState"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: ["Status ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "installState" })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "px-4 py-3 font-medium text-right",
						children: "Actions"
					})
				] })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
				className: "divide-y divide-[var(--border-dim)]",
				children: filtered.map((role) => {
					const installed = role.installState === "Installed";
					const pending = pendingAction === `install-${role.name}` || pendingAction === `uninstall-${role.name}`;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "hover:bg-[var(--bg-card)] transition-colors",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 font-medium",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
										size: 14,
										className: installed ? "text-[var(--amber)]" : "text-[var(--text-dim)]"
									}), role.displayName]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 mono text-[11px] text-[var(--text-sub)]",
								children: role.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1 rounded bg-[var(--bg-card)] px-2 py-0.5 text-[10px] uppercase border border-[var(--border-dim)]",
									children: [isRole(role) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { size: 10 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { size: 10 }), isRole(role) ? "Server Role" : "Optional Feature"]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: installed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1 font-medium text-[var(--ok)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-[var(--ok)]" }), " Installed"]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[var(--text-sub)]",
									children: "Available"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center justify-end gap-2",
									children: pending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
										size: 14,
										className: "animate-spin text-[var(--text-sub)]"
									}) : installed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => onUninstall(role),
										disabled: pendingAction !== null,
										className: "flex items-center gap-1.5 rounded bg-[var(--crit)]/10 px-2 py-1 text-[11px] font-medium text-[var(--crit)] hover:bg-[var(--crit)]/20 disabled:opacity-50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 12 }), " Remove"]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => onInstall(role),
										disabled: pendingAction !== null,
										className: "flex items-center gap-1.5 rounded bg-[var(--amber-low)] border border-[var(--amber)] px-2 py-1 text-[11px] font-medium text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black disabled:opacity-50",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 12 }), " Install"]
									})
								})
							})
						]
					}, role.name);
				})
			})]
		})
	});
}
var Route$12 = createFileRoute("/remote-desktop")({
	head: () => ({ meta: [{ title: "Remote Desktop — NEXUS" }, {
		name: "description",
		content: "Launch and manage Remote Desktop sessions."
	}] }),
	component: RDPPage
});
var DEFAULTS = {
	resolution: "1920x1080",
	colorDepth: "32",
	audio: "local",
	clipboard: true,
	drives: false
};
var RES_OPTIONS = [
	"1280x720",
	"1366x768",
	"1600x900",
	"1920x1080",
	"2560x1440",
	"3840x2160",
	"Full screen"
];
var COLOR_OPTIONS = [
	"8",
	"16",
	"24",
	"32"
];
function RDPPage() {
	const [servers, setServers] = (0, import_react.useState)([]);
	const [loadingServers, setLoadingServers] = (0, import_react.useState)(true);
	const [selectedIp, setSelectedIp] = (0, import_react.useState)("");
	const [adhoc, setAdhoc] = (0, import_react.useState)("");
	const [res, setRes] = (0, import_react.useState)(DEFAULTS.resolution);
	const [colorDepth, setColorDepth] = (0, import_react.useState)(DEFAULTS.colorDepth);
	const [audio, setAudio] = (0, import_react.useState)(DEFAULTS.audio);
	const [clipboard, setClipboard] = (0, import_react.useState)(DEFAULTS.clipboard);
	const [drives, setDrives] = (0, import_react.useState)(DEFAULTS.drives);
	const [connecting, setConnecting] = (0, import_react.useState)(false);
	const [savedSessions, setSavedSessions] = (0, import_react.useState)([]);
	const [showSave, setShowSave] = (0, import_react.useState)(false);
	const [saveLabel, setSaveLabel] = (0, import_react.useState)("");
	const [history, setHistory] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		getServersClient().then((data) => {
			setServers(data);
			if (data.length > 0) setSelectedIp(data[0].ip);
		}).catch(() => toast.error("Failed to load servers")).finally(() => setLoadingServers(false));
		try {
			const raw = localStorage.getItem("nexus-rdp-sessions");
			if (raw) setSavedSessions(JSON.parse(raw));
			const hist = localStorage.getItem("nexus-rdp-history");
			if (hist) setHistory(JSON.parse(hist));
		} catch {}
	}, []);
	const selectedServer = (0, import_react.useMemo)(() => servers.find((s) => s.ip === selectedIp), [servers, selectedIp]);
	const persistSessions = (next) => {
		setSavedSessions(next);
		localStorage.setItem("nexus-rdp-sessions", JSON.stringify(next));
	};
	const launch = async (host, skipLogs) => {
		if (!host || !host.trim()) {
			toast.error("Enter a server hostname or IP");
			return;
		}
		if (connecting) return;
		setConnecting(true);
		const params = new URLSearchParams();
		if (RES_OPTIONS.slice(0, -1).includes(res)) {
			const [w, h] = res.split("x");
			params.set("w", w);
			params.set("h", h);
		}
		params.set("color", colorDepth);
		params.set("audio", audio);
		params.set("clipboard", String(clipboard));
		params.set("drives", String(drives));
		if (RES_OPTIONS.includes(res) && res !== "Full screen") params.set("res", res);
		const url = `mstsc:${encodeURIComponent(host)}?${params.toString()}`;
		await new Promise((r) => setTimeout(r, 400));
		try {
			window.location.href = url;
			toast.success(`Opening Remote Desktop to ${host}`, { description: `${res} · ${colorDepth}-bit · audio ${audio}` });
			if (!skipLogs) {
				const nextHistory = [{
					host,
					at: (/* @__PURE__ */ new Date()).toISOString()
				}, ...history.filter((h) => h.host !== host)].slice(0, 10);
				setHistory(nextHistory);
				localStorage.setItem("nexus-rdp-history", JSON.stringify(nextHistory));
			}
		} catch {
			toast.error("Failed to launch Remote Desktop client");
		} finally {
			setConnecting(false);
		}
	};
	const saveSession = () => {
		if (!selectedServer && !adhoc) {
			toast.error("Select a server or enter a quick connect host first");
			return;
		}
		const host = adhoc || selectedServer?.ip || "";
		persistSessions([{
			id: `${Date.now()}`,
			host,
			label: saveLabel.trim() || selectedServer?.name || host,
			resolution: res,
			colorDepth,
			audio,
			clipboard,
			drives,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		}, ...savedSessions]);
		setSaveLabel("");
		setShowSave(false);
		toast.success("Session saved");
	};
	const deleteSession = (id) => {
		persistSessions(savedSessions.filter((s) => s.id !== id));
		toast.success("Session removed");
	};
	const loadSession = (s) => {
		setRes(s.resolution);
		setColorDepth(s.colorDepth);
		setAudio(s.audio);
		setClipboard(s.clipboard);
		setDrives(s.drives);
		setAdhoc(s.host);
		setSelectedIp("");
		toast.info(`Loaded session ${s.label}`);
	};
	const activeHost = adhoc.trim() || selectedServer?.ip || "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		eyebrow: "Management",
		title: "Remote Desktop",
		right: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => setShowSave((v) => !v),
			className: "mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:text-[var(--text)] transition-colors",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 14 }), " Save Session"]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-6 lg:grid-cols-[1fr_320px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-card p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-4 pb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--amber-low)] text-[var(--amber)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { size: 24 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "display text-lg font-semibold",
						children: "New Session"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-[var(--text-sub)]",
						children: "Configure and launch an RDP connection to a managed server."
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "eyebrow block pb-2",
					children: "Target Server"
				}),
				loadingServers ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-[12px] text-[var(--text-sub)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						size: 14,
						className: "animate-spin"
					}), " Loading servers…"]
				}) : servers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[12px] text-[var(--text-sub)]",
					children: "No servers registered."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: selectedIp,
					onChange: (e) => {
						setSelectedIp(e.target.value);
						setAdhoc("");
					},
					className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none",
					children: servers.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
						value: m.ip,
						children: [
							m.name,
							" — ",
							m.ip,
							" (",
							m.os,
							")",
							m.status !== "online" ? ` [${m.status}]` : ""
						]
					}, m.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "eyebrow block pb-2",
						children: "Quick Connect (override)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: adhoc,
							onChange: (e) => {
								setAdhoc(e.target.value);
								setSelectedIp("");
							},
							placeholder: "hostname or IP",
							className: "mono flex-1 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] placeholder:text-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none"
						}), adhoc && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setAdhoc(""),
							className: "rounded-md border border-[var(--border-c)] px-3 text-[var(--text-sub)] hover:text-[var(--text)]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 grid grid-cols-2 gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "eyebrow block pb-2",
						children: "Resolution"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: res,
						onChange: (e) => setRes(e.target.value),
						className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none",
						children: RES_OPTIONS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: r }, r))
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "eyebrow block pb-2",
						children: "Color Depth"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: colorDepth,
						onChange: (e) => setColorDepth(e.target.value),
						className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none",
						children: COLOR_OPTIONS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: c,
							children: [c, "-bit"]
						}, c))
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "eyebrow mt-5 block pb-2",
					children: "Audio"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						{
							v: "local",
							icon: Volume2,
							label: "Play on this PC"
						},
						{
							v: "remote",
							icon: Volume2,
							label: "Leave on server"
						},
						{
							v: "none",
							icon: X,
							label: "Disable"
						}
					].map((opt) => {
						const Icon = opt.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setAudio(opt.v),
							className: `mono flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] transition-colors ${audio === opt.v ? "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)]" : "border-[var(--border-c)] bg-[var(--bg-card)] text-[var(--text-sub)] hover:text-[var(--text)]"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 13 }),
								" ",
								opt.label
							]
						}, opt.v);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
						icon: Clipboard,
						label: "Clipboard redirection",
						checked: clipboard,
						onChange: setClipboard
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
						icon: HardDrive,
						label: "Drive redirection",
						checked: drives,
						onChange: setDrives
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 rounded-md border border-[var(--border-dim)] bg-[var(--bg-void)]/30 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mono flex items-center justify-between text-[11px] text-[var(--text-sub)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Target" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[var(--text)]",
							children: activeHost || "—"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mono mt-1 flex items-center justify-between text-[11px] text-[var(--text-sub)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Mode" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							res,
							" · ",
							colorDepth,
							"-bit · audio:",
							audio
						] })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					disabled: !activeHost || connecting,
					onClick: () => launch(activeHost),
					className: "mono mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-[var(--amber)] bg-[var(--amber)] py-3 text-[12px] uppercase tracking-[0.2em] text-black transition-colors hover:bg-[var(--amber)]/90 disabled:cursor-not-allowed disabled:opacity-40",
					children: [connecting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						size: 14,
						className: "animate-spin"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 14 }), connecting ? "Connecting…" : "Launch Remote Desktop"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "pt-3 text-center text-[11px] text-[var(--text-sub)]",
					children: "Opens the Windows Remote Desktop Connection client (mstsc) on your local machine."
				}),
				showSave && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "eyebrow block pb-2",
							children: "Session Label"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: saveLabel,
							onChange: (e) => setSaveLabel(e.target.value),
							placeholder: selectedServer?.name || activeHost || "My session",
							className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] text-[var(--text)] focus:border-[var(--amber)] focus:outline-none"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex justify-end gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowSave(false),
								className: "mono rounded-md px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:text-[var(--text)]",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: saveSession,
								className: "mono rounded-md bg-[var(--amber)] px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-black hover:bg-[var(--amber)]/90",
								children: "Save"
							})]
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "nx-card p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "eyebrow",
							children: "Saved Sessions"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
							size: 14,
							className: "text-[var(--teal)]"
						})]
					}), savedSessions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-4 text-center text-[11px] text-[var(--text-sub)]",
						children: "No saved sessions."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2",
						children: savedSessions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "group flex items-center gap-2 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] p-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => loadSession(s),
								className: "flex flex-1 items-center gap-2 text-left",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--amber-low)] text-[var(--amber)]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { size: 14 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-[12px] font-semibold text-[var(--text)]",
										children: s.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mono truncate text-[10px] text-[var(--text-sub)]",
										children: [
											s.host,
											" · ",
											s.resolution
										]
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => launch(s.host),
									title: "Launch",
									className: "grid h-7 w-7 place-items-center rounded-md border border-[var(--border-c)] text-[var(--text-sub)] hover:border-[var(--amber)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 13 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => deleteSession(s.id),
									title: "Remove",
									className: "grid h-7 w-7 place-items-center rounded-md border border-[var(--border-c)] text-[var(--text-sub)] hover:border-[var(--crit)] hover:bg-[var(--crit)]/10 hover:text-[var(--crit)]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 13 })
								})]
							})]
						}, s.id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "nx-card p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
							size: 14,
							className: "text-[var(--text-sub)]"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "eyebrow",
							children: "Recent Connections"
						})]
					}), history.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-4 text-center text-[11px] text-[var(--text-sub)]",
						children: "No recent connections."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "divide-y divide-[var(--border-dim)]",
						children: [history.map((h, i) => {
							const ago = relativeTime(h.at);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => launch(h.host, true),
								className: "flex w-full items-center justify-between py-2 text-left hover:bg-[var(--bg-surface)]/50",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mono text-[12px] text-[var(--text)]",
									children: h.host
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mono text-[10px] text-[var(--text-sub)]",
									children: ago
								})]
							}, i + h.host);
						}), history.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								setHistory([]);
								localStorage.removeItem("nexus-rdp-history");
							},
							className: "mono w-full pt-3 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:text-[var(--crit)]",
							children: "Clear history"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "nx-card p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, {
							size: 12,
							className: "text-[var(--teal)]"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub)]",
							children: "How it works"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] leading-relaxed text-[var(--text-sub)]",
						children: [
							"NEXUS launches the native ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mono text-[var(--text)]",
								children: "mstsc"
							}),
							" client via a custom protocol handler on your machine, passing resolution, color depth and resource options. The client must be installed and the handler registered for the link to open automatically."
						]
					})]
				})
			]
		})]
	})] });
}
function ToggleRow({ icon: Icon, label, checked, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick: () => onChange(!checked),
		className: "flex w-full items-center justify-between rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] px-3 py-2.5 text-left transition-colors hover:border-[var(--amber)]/40",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-center gap-2 text-[13px] text-[var(--text)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 14 }),
				" ",
				label
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-[var(--amber)]" : "bg-[var(--border-dim)]"}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? "left-[18px]" : "left-0.5"}` })
		})]
	});
}
function relativeTime(iso) {
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 6e4);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	return `${Math.floor(hrs / 24)}d ago`;
}
var $$splitComponentImporter$10 = () => import("./registry-DUf21mKa.mjs");
var Route$11 = createFileRoute("/registry")({
	head: () => ({ meta: [{ title: "Registry — NEXUS" }, {
		name: "description",
		content: "Read and explore Windows registry hives."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./processes-BIYpQC0T.mjs");
var Route$10 = createFileRoute("/processes")({
	head: () => ({ meta: [{ title: "Processes — NEXUS" }, {
		name: "description",
		content: "Inspect, end, and prioritize running processes."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./plugins-6kmhyDRm.mjs");
var Route$9 = createFileRoute("/plugins")({
	head: () => ({ meta: [{ title: "Plugins — NEXUS" }] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./performance-DLQK6_Je.mjs");
var Route$8 = createFileRoute("/performance")({
	head: () => ({ meta: [{ title: "Performance — NEXUS" }, {
		name: "description",
		content: "Live CPU, memory, disk and network metrics."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./networks-DOBSt7Ms.mjs");
var Route$7 = createFileRoute("/networks")({
	head: () => ({ meta: [{ title: "Networks — NEXUS" }, {
		name: "description",
		content: "Adapters, IP config, and DNS."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./login-wHviZBzX.mjs");
var Route$6 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./firewall-B5aHWQz_.mjs");
var Route$5 = createFileRoute("/firewall")({
	head: () => ({ meta: [{ title: "Firewall — NEXUS" }, {
		name: "description",
		content: "Firewall profiles and inbound/outbound rules."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var Route$4 = createFileRoute("/events")({
	head: () => ({ meta: [{ title: "Event Viewer — NEXUS" }, {
		name: "description",
		content: "Browse system, application, and security event logs."
	}] }),
	component: EventsPage
});
var LOGS = [
	"Application",
	"System",
	"Security"
];
var ALL_LEVELS = [
	"Critical",
	"Error",
	"Warning",
	"Information",
	"Verbose"
];
var levelIcon = (lv) => lv === "Error" || lv === "Critical" ? CircleX : lv === "Warning" ? TriangleAlert : lv === "Information" ? Info : CircleAlert;
var levelColor = (lv) => lv === "Error" || lv === "Critical" ? "var(--crit)" : lv === "Warning" ? "var(--warn)" : lv === "Information" ? "var(--teal)" : "var(--text-sub)";
function EventsPage() {
	const { theme } = (0, import_react.useContext)(ThemeContext);
	const [server, setServer] = (0, import_react.useState)("");
	const [serverInfo, setServerInfo] = (0, import_react.useState)(null);
	const [log, setLog] = (0, import_react.useState)("System");
	const [events, setEvents] = (0, import_react.useState)([]);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [levels, setLevels] = (0, import_react.useState)(new Set(ALL_LEVELS));
	const [q, setQ] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [autoRefresh, setAutoRefresh] = (0, import_react.useState)(false);
	const [lastRefresh, setLastRefresh] = (0, import_react.useState)(/* @__PURE__ */ new Date());
	const fetchServers = async () => {
		const list = await getServersClient();
		if (list.length > 0) {
			setServer(list[0].ip);
			setServerInfo(list[0]);
		}
	};
	const fetchEvents = (0, import_react.useCallback)(async (id, lg) => {
		setLoading(true);
		try {
			setEvents(await getEvents(id, lg, 100));
			setLastRefresh(/* @__PURE__ */ new Date());
		} catch {
			console.error("Failed to load events");
		} finally {
			setLoading(false);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		fetchServers();
	}, []);
	(0, import_react.useEffect)(() => {
		if (server) {
			getServersClient().then((list) => {
				setServerInfo(list.find((x) => x.ip === server || x.id === server) ?? null);
			});
			fetchEvents(server, log);
			setSelected(null);
		}
	}, [
		server,
		log,
		fetchEvents
	]);
	(0, import_react.useEffect)(() => {
		if (!autoRefresh || !server) return;
		const id = setInterval(() => fetchEvents(server, log), 15e3);
		return () => clearInterval(id);
	}, [
		autoRefresh,
		server,
		log,
		fetchEvents
	]);
	const filtered = (0, import_react.useMemo)(() => events.filter((e) => levels.has(e.level)).filter((e) => q === "" || e.message.toLowerCase().includes(q.toLowerCase()) || e.source.toLowerCase().includes(q.toLowerCase()) || String(e.eventId).includes(q)), [
		events,
		levels,
		q
	]);
	const levelCounts = (0, import_react.useMemo)(() => {
		const c = {
			Critical: 0,
			Error: 0,
			Warning: 0,
			Information: 0,
			Verbose: 0
		};
		events.forEach((e) => {
			if (e.level in c) c[e.level]++;
		});
		return c;
	}, [events]);
	const toggleLevel = (lv) => {
		const n = new Set(levels);
		n.has(lv) ? n.delete(lv) : n.add(lv);
		setLevels(n);
	};
	const exportCsv = () => {
		const header = [
			"Time",
			"Level",
			"Source",
			"EventID",
			"Category",
			"Message"
		];
		const rows = filtered.map((e) => [
			new Date(e.time).toISOString(),
			e.level,
			e.source,
			String(e.eventId),
			e.category,
			`"${e.message.replace(/"/g, "\"\"")}"`
		].join(","));
		const csv = [header.join(","), ...rows].join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `events-${server}-${log}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};
	const clearFilters = () => {
		setQ("");
		setLevels(new Set(ALL_LEVELS));
	};
	const hasQuery = q !== "" || levels.size !== ALL_LEVELS.length;
	if (theme === "horizon") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-[1600px] mx-auto space-y-6 font-sans",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-3xl font-extrabold text-[var(--text)]",
				children: "Event Viewer"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-[var(--text-sub)] mt-1",
				children: [
					serverInfo ? `${serverInfo.name} · ${log} log` : "Select a server",
					" · ",
					filtered.length,
					" of ",
					events.length,
					" shown"
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
				value: server,
				onChange: setServer
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlBar, {
				q,
				setQ,
				onRefresh: () => fetchEvents(server, log),
				onExport: exportCsv,
				autoRefresh,
				setAutoRefresh,
				loading,
				lastRefresh
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-[240px_1fr] gap-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "nx-card h-fit p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogsPanel, {
						log,
						setLog,
						counts: levelCounts,
						events
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LevelsPanel, {
						levels,
						toggleLevel,
						counts: levelCounts
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventsTable, {
						events: filtered,
						selected,
						setSelected,
						loading,
						hasQuery,
						onClear: clearFilters
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventDetail, { selected })]
				})]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Advanced",
			title: "Event Viewer",
			right: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mono flex items-center gap-2 text-[10px] text-[var(--text-sub)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, {
					size: 12,
					className: autoRefresh ? "text-[var(--ok)] animate-pulse" : "text-[var(--text-sub)]"
				}), autoRefresh ? "Live" : lastRefresh.toLocaleTimeString()]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
			value: server,
			onChange: setServer
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlBar, {
			q,
			setQ,
			onRefresh: () => fetchEvents(server, log),
			onExport: exportCsv,
			autoRefresh,
			setAutoRefresh,
			loading,
			lastRefresh
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid grid-cols-[220px_1fr] gap-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "nx-card h-fit p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogsPanel, {
					log,
					setLog,
					counts: levelCounts,
					events
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LevelsPanel, {
					levels,
					toggleLevel,
					counts: levelCounts
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventsTable, {
					events: filtered,
					selected,
					setSelected,
					loading,
					hasQuery,
					onClear: clearFilters
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventDetail, { selected })]
			})]
		})
	] });
}
function ControlBar({ q, setQ, onRefresh, onExport, autoRefresh, setAutoRefresh, loading, lastRefresh }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] p-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex w-full max-w-sm items-center gap-2 rounded bg-[var(--bg-card)] px-2 py-1.5 border border-[var(--border-dim)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
					size: 14,
					className: "text-[var(--text-sub)]"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "Search source, event ID, message...",
					className: "w-full bg-transparent text-[12px] outline-none placeholder:text-[var(--text-dim)]"
				}),
				q && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setQ(""),
					className: "text-[var(--text-sub)] hover:text-[var(--text)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setAutoRefresh(!autoRefresh),
					className: "mono flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] border transition-colors " + (autoRefresh ? "bg-[var(--ok)]/10 text-[var(--ok)] border-[var(--ok)]/30" : "bg-[var(--bg-card)] text-[var(--text-sub)] border-[var(--border-dim)] hover:text-[var(--text)]"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, { size: 12 }),
						" ",
						autoRefresh ? "Live" : "Off"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: onRefresh,
					disabled: loading,
					className: "flex items-center gap-2 rounded bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] border border-[var(--border-dim)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
						size: 14,
						className: loading ? "animate-spin" : ""
					}), " Refresh"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: onExport,
					disabled: loading,
					className: "flex items-center gap-2 rounded bg-[var(--amber-low)] border border-[var(--amber)] px-3 py-1.5 text-[12px] font-medium text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black disabled:opacity-50",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 14 }), " Export"]
				})
			]
		})]
	});
}
function LogsPanel({ log, setLog, counts, events }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "eyebrow px-1 pb-2",
			children: "Windows Logs"
		}),
		LOGS.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => setLog(l),
			className: "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] " + (l === log ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)]"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: l }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mono text-[10px]",
				children: l === log ? events.length : "—"
			})]
		}, l)),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 space-y-0.5",
			children: [
				"Critical",
				"Error",
				"Warning",
				"Information"
			].map((lv) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mono flex items-center justify-between px-2.5 text-[10px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-1.5",
					style: { color: levelColor(lv) },
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "h-1.5 w-1.5 rounded-full",
							style: { background: levelColor(lv) }
						}),
						" ",
						lv
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[var(--text-sub)]",
					children: counts[lv] || 0
				})]
			}, lv))
		})
	] });
}
function LevelsPanel({ levels, toggleLevel, counts }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "eyebrow px-1 pb-2 pt-4",
		children: "Filter Level"
	}), ALL_LEVELS.map((lv) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "mono flex cursor-pointer items-center gap-2 px-2.5 py-1 text-[11px] text-[var(--text-sub)] hover:text-[var(--text)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "checkbox",
				checked: levels.has(lv),
				onChange: () => toggleLevel(lv),
				className: "accent-[var(--amber)]"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex-1",
				children: lv
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] text-[var(--text-dim)]",
				children: counts[lv] || 0
			})
		]
	}, lv))] });
}
function EventsTable({ events, selected, setSelected, loading, hasQuery, onClear }) {
	if (loading && events.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "nx-card flex items-center justify-center gap-2 p-8 text-[13px] text-[var(--text-sub)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
			size: 14,
			className: "animate-spin"
		}), " Loading events…"]
	});
	if (events.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "nx-card p-12 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
				size: 32,
				className: "text-[var(--text-dim)] mb-3 mx-auto"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[14px] text-[var(--text)]",
				children: hasQuery ? "No events match filters" : "No events found"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[12px] text-[var(--text-sub)] mt-1",
				children: hasQuery ? "Try clearing the search or level filters." : "This log may be empty on the selected server."
			}),
			hasQuery && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: onClear,
				className: "mono mt-3 text-[11px] uppercase tracking-[0.2em] text-[var(--amber)] hover:underline",
				children: "Clear filters"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "nx-card overflow-hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "max-h-[50vh] overflow-y-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full text-[12px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "sticky top-0 bg-[var(--bg-card)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "eyebrow border-b border-[var(--border-c)] text-left",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "w-8 px-3 py-2" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Date/Time" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Source" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Event ID" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Description" })
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
					className: "mono",
					children: events.map((e) => {
						const Ic = levelIcon(e.level);
						const color = levelColor(e.level);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							onClick: () => setSelected(e),
							className: "cursor-pointer border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] " + (selected?.id === e.id ? "bg-[var(--amber-low)]" : e.level === "Error" || e.level === "Critical" ? "bg-[var(--crit)]/[0.05]" : e.level === "Warning" ? "bg-[var(--warn)]/[0.05]" : ""),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-1.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ic, {
										size: 12,
										style: { color }
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "text-[var(--text-sub)]",
									children: new Date(e.time).toLocaleString()
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "text-[var(--text)]",
									children: e.source
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "text-[var(--amber)]",
									children: e.eventId
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "truncate text-[var(--text-sub)]",
									children: e.message
								})
							]
						}, e.id);
					})
				})]
			})
		})
	});
}
function EventDetail({ selected }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "nx-card p-4",
		children: selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between pb-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "eyebrow",
					children: ["Event Detail · ID ", selected.eventId]
				}), (() => {
					const Ic = levelIcon(selected.level);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1.5 text-[11px]",
						style: { color: levelColor(selected.level) },
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ic, { size: 12 }),
							" ",
							selected.level
						]
					});
				})()]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[13px] text-[var(--text)]",
				children: selected.message
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mono mt-2 text-[10px] text-[var(--text-sub)]",
				children: [
					"Source: ",
					selected.source,
					" · Category: ",
					selected.category,
					" · ",
					new Date(selected.time).toLocaleString()
				]
			}),
			selected.xml && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "mono mt-3 max-h-40 overflow-auto rounded-md border border-[var(--border-c)] bg-[var(--bg-void)] p-3 text-[10px] text-[var(--text-sub)]",
				children: selected.xml
			})
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "py-6 text-center text-[12px] text-[var(--text-sub)]",
			children: "Select an event to inspect."
		})
	});
}
var $$splitComponentImporter$3 = () => import("./devices-CIBTWBg4.mjs");
var Route$3 = createFileRoute("/devices")({
	head: () => ({ meta: [{ title: "Devices — NEXUS" }, {
		name: "description",
		content: "Device Manager view."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./certificates-D_3KyOLL.mjs");
var Route$2 = createFileRoute("/certificates")({
	head: () => ({ meta: [{ title: "Certificates — NEXUS" }, {
		name: "description",
		content: "Inspect installed certificates."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./apps-BdnGewd0.mjs");
var Route$1 = createFileRoute("/apps")({
	head: () => ({ meta: [{ title: "Installed Apps — NEXUS" }, {
		name: "description",
		content: "Installed software inventory."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./routes-ByUz5SoI.mjs");
var Route = createFileRoute("/")({
	head: () => ({ meta: [{ title: "Dashboard — NEXUS" }, {
		name: "description",
		content: "Live network topology, fleet health, and event stream for your Windows Server estate."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var VswitchesRoute = Route$24.update({
	id: "/vswitches",
	path: "/vswitches",
	getParentRoute: () => Route$26
});
var VmsRoute = Route$23.update({
	id: "/vms",
	path: "/vms",
	getParentRoute: () => Route$26
});
var UsersRoute = Route$22.update({
	id: "/users",
	path: "/users",
	getParentRoute: () => Route$26
});
var UpdatesRoute = Route$21.update({
	id: "/updates",
	path: "/updates",
	getParentRoute: () => Route$26
});
var TasksRoute = Route$20.update({
	id: "/tasks",
	path: "/tasks",
	getParentRoute: () => Route$26
});
var StorageReplicaRoute = Route$19.update({
	id: "/storage-replica",
	path: "/storage-replica",
	getParentRoute: () => Route$26
});
var StorageRoute = Route$18.update({
	id: "/storage",
	path: "/storage",
	getParentRoute: () => Route$26
});
var SettingsRoute = Route$17.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => Route$26
});
var ServicesRoute = Route$16.update({
	id: "/services",
	path: "/services",
	getParentRoute: () => Route$26
});
var ServersRoute = Route$15.update({
	id: "/servers",
	path: "/servers",
	getParentRoute: () => Route$26
});
var SecurityRoute = Route$14.update({
	id: "/security",
	path: "/security",
	getParentRoute: () => Route$26
});
var RolesRoute = Route$13.update({
	id: "/roles",
	path: "/roles",
	getParentRoute: () => Route$26
});
var RemoteDesktopRoute = Route$12.update({
	id: "/remote-desktop",
	path: "/remote-desktop",
	getParentRoute: () => Route$26
});
var RegistryRoute = Route$11.update({
	id: "/registry",
	path: "/registry",
	getParentRoute: () => Route$26
});
var ProcessesRoute = Route$10.update({
	id: "/processes",
	path: "/processes",
	getParentRoute: () => Route$26
});
var PowershellRoute = Route$28.update({
	id: "/powershell",
	path: "/powershell",
	getParentRoute: () => Route$26
});
var PluginsRoute = Route$9.update({
	id: "/plugins",
	path: "/plugins",
	getParentRoute: () => Route$26
});
var PerformanceRoute = Route$8.update({
	id: "/performance",
	path: "/performance",
	getParentRoute: () => Route$26
});
var NetworksRoute = Route$7.update({
	id: "/networks",
	path: "/networks",
	getParentRoute: () => Route$26
});
var LoginRoute = Route$6.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$26
});
var FirewallRoute = Route$5.update({
	id: "/firewall",
	path: "/firewall",
	getParentRoute: () => Route$26
});
var FilesRoute = Route$25.update({
	id: "/files",
	path: "/files",
	getParentRoute: () => Route$26
});
var EventsRoute = Route$4.update({
	id: "/events",
	path: "/events",
	getParentRoute: () => Route$26
});
var DevicesRoute = Route$3.update({
	id: "/devices",
	path: "/devices",
	getParentRoute: () => Route$26
});
var CertificatesRoute = Route$2.update({
	id: "/certificates",
	path: "/certificates",
	getParentRoute: () => Route$26
});
var AppsRoute = Route$1.update({
	id: "/apps",
	path: "/apps",
	getParentRoute: () => Route$26
});
var rootRouteChildren = {
	IndexRoute: Route.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$26
	}),
	AppsRoute,
	CertificatesRoute,
	DevicesRoute,
	EventsRoute,
	FilesRoute,
	FirewallRoute,
	LoginRoute,
	NetworksRoute,
	PerformanceRoute,
	PluginsRoute,
	PowershellRoute,
	ProcessesRoute,
	RegistryRoute,
	RemoteDesktopRoute,
	RolesRoute,
	SecurityRoute,
	ServersRoute,
	ServicesRoute,
	SettingsRoute,
	StorageRoute,
	StorageReplicaRoute,
	TasksRoute,
	UpdatesRoute,
	UsersRoute,
	VmsRoute,
	VswitchesRoute,
	PluginIdRoute: Route$27.update({
		id: "/plugin/$id",
		path: "/plugin/$id",
		getParentRoute: () => Route$26
	})
};
var routeTree = Route$26._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
