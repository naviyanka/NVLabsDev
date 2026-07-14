import { i as __toESM } from "../_runtime.mjs";
import { G as restartServerClient, J as shutdownServerClient, d as deleteServerClient, f as editServerClient, j as getServersClient, t as addServerClient } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { A as RefreshCw, E as Search, F as Plus, N as Power, P as PowerOff, T as Server, W as Monitor, _ as SquarePen, bt as Clock, lt as Ellipsis, m as Terminal, n as X, p as Trash2 } from "../_libs/lucide-react.mjs";
import { t as StatusBadge } from "./StatusBadge-DvNl1BAE.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as DropdownMenuTrigger, i as DropdownMenuSeparator, n as DropdownMenuContent, r as DropdownMenuItem, s as ThemeContext, t as DropdownMenu } from "../__root-H47vz4C-.mjs";
import { t as MetricBar } from "./MetricBar-Dg0Qv4vm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/servers-CWRx_WLB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function HorizonServers() {
	const [servers, setServers] = (0, import_react.useState)([]);
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [selectedIp, setSelectedIp] = (0, import_react.useState)(null);
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [lastRefresh, setLastRefresh] = (0, import_react.useState)(/* @__PURE__ */ new Date());
	const [refreshing, setRefreshing] = (0, import_react.useState)(false);
	const [isAddOpen, setIsAddOpen] = (0, import_react.useState)(false);
	const [isEditOpen, setIsEditOpen] = (0, import_react.useState)(false);
	const navigate = useNavigate();
	const loadData = (0, import_react.useCallback)(async () => {
		try {
			setServers(await getServersClient());
			setLastRefresh(/* @__PURE__ */ new Date());
		} catch (e) {
			console.error("Failed to load servers:", e);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);
	const handleRefresh = async () => {
		setRefreshing(true);
		await loadData();
		toast.success("Fleet data refreshed");
	};
	(0, import_react.useEffect)(() => {
		loadData();
		const id = setInterval(loadData, 1e4);
		return () => clearInterval(id);
	}, [loadData]);
	const filteredServers = servers.filter((s) => {
		const matchesFilter = filter === "all" || s.status === filter;
		const matchesSearch = searchQuery === "" || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.ip.includes(searchQuery) || s.os.toLowerCase().includes(searchQuery.toLowerCase()) || s.role.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesFilter && matchesSearch;
	});
	const filterCounts = {
		all: servers.length,
		online: servers.filter((s) => s.status === "online").length,
		warning: servers.filter((s) => s.status === "warning").length,
		critical: servers.filter((s) => s.status === "critical").length
	};
	const handleDelete = async () => {
		if (!selectedIp) return;
		const srv = servers.find((s) => s.ip === selectedIp);
		if (!confirm(`Delete ${srv?.name}? This action cannot be undone.`)) return;
		try {
			if (await deleteServerClient(selectedIp)) {
				toast.success(`${srv?.name} deleted`);
				setSelectedIp(null);
				loadData();
			} else toast.error(`Failed to delete ${srv?.name}`);
		} catch (e) {
			toast.error(`Delete failed: ${e instanceof Error ? e.message : "Unknown error"}`);
		}
	};
	const handleRestart = async (ip, name) => {
		if (!confirm(`Restart ${name}?`)) return;
		toast.info(`Restarting ${name}...`);
		try {
			if (await restartServerClient(ip)) {
				toast.success(`${name} is restarting`);
				loadData();
			} else toast.error(`Failed to restart ${name}`);
		} catch (e) {
			toast.error(`Restart failed: ${e instanceof Error ? e.message : "Unknown error"}`);
		}
	};
	const handleShutdown = async (ip, name) => {
		if (!confirm(`Shut down ${name}? This will power off the server.`)) return;
		toast.info(`Shutting down ${name}...`);
		try {
			if (await shutdownServerClient(ip)) {
				toast.success(`${name} is shutting down`);
				loadData();
			} else toast.error(`Failed to shut down ${name}`);
		} catch (e) {
			toast.error(`Shutdown failed: ${e instanceof Error ? e.message : "Unknown error"}`);
		}
	};
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center justify-center h-64",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
				size: 24,
				className: "animate-spin text-[var(--amber)] mx-auto mb-3"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-[var(--text-sub)]",
				children: "Loading Horizon Fleet…"
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-[1600px] mx-auto space-y-8 font-sans",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col md:flex-row md:items-center justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-3xl font-extrabold text-[var(--text)]",
					children: "Server Fleet"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-[var(--text-sub)] mt-1",
					children: ["Manage and monitor compute resources across all availability zones.", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1.5 ml-3 text-[10px] text-[var(--text-sub)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { size: 11 }),
							"Last updated ",
							lastRefresh.toLocaleTimeString()
						]
					})]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: handleRefresh,
							disabled: refreshing,
							className: "flex items-center gap-2 bg-transparent border border-[var(--border-c)] px-4 py-2.5 rounded-full font-semibold text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)] transition-colors disabled:opacity-50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
								size: 16,
								className: refreshing ? "animate-spin" : ""
							}), "Refresh"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setIsAddOpen(true),
							className: "flex items-center gap-2 bg-[var(--amber)] text-white px-5 py-2.5 rounded-full font-semibold hover:opacity-90 transition-all shadow-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 18 }), "Add Server"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => selectedIp ? setIsEditOpen(true) : toast.info("Select a server first"),
							className: `flex items-center gap-2 bg-transparent border border-[var(--border-c)] px-5 py-2.5 rounded-full font-semibold transition-colors ${selectedIp ? "text-[var(--text)] hover:bg-[var(--bg-surface)]" : "text-[var(--text-sub)] opacity-50 cursor-not-allowed"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { size: 18 }), "Edit"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => selectedIp ? handleDelete() : toast.info("Select a server first"),
							className: `flex items-center gap-2 bg-transparent border border-[var(--border-c)] px-5 py-2.5 rounded-full font-semibold transition-colors ${selectedIp ? "text-[var(--text)] hover:bg-[var(--crit)]/10 hover:text-[var(--crit)] hover:border-[var(--crit)]/50" : "text-[var(--text-sub)] opacity-50 cursor-not-allowed"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 18 }), "Remove"]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative max-w-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						size: 16,
						className: "absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-sub)]"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: searchQuery,
						onChange: (e) => setSearchQuery(e.target.value),
						placeholder: "Search by name, IP, OS, or role...",
						className: "w-full bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-full py-2.5 pl-11 pr-4 text-sm text-[var(--text)] placeholder-[var(--text-sub)] focus:border-[var(--amber)] focus:outline-none transition-colors"
					}),
					searchQuery && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setSearchQuery(""),
						className: "absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)] hover:text-[var(--text)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "inline-flex bg-[var(--bg-surface)] border border-[var(--border-c)] p-1.5 rounded-full w-max shadow-sm gap-1",
				children: [
					"all",
					"online",
					"warning",
					"critical"
				].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setFilter(f),
					className: `px-5 py-2 rounded-full text-xs font-bold capitalize transition-all flex items-center gap-2 ${filter === f ? "bg-[var(--amber)] text-white shadow-md" : "text-[var(--text-sub)] hover:text-[var(--text)]"}`,
					children: [f, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${filter === f ? "bg-white/20 text-white" : "bg-[var(--bg-void)] text-[var(--text-sub)]"}`,
						children: filterCounts[f]
					})]
				}, f))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-[var(--bg-surface)] border border-[var(--border-c)] rounded-[1.5rem] shadow-sm overflow-hidden relative",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1 w-full bg-[var(--amber)] absolute top-0 left-0" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto w-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full text-left whitespace-nowrap",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "bg-[var(--bg-void)] border-b border-[var(--border-c)] text-[11px] font-extrabold text-[var(--text-sub)] uppercase tracking-wider",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-6 py-4",
										children: "Name"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-6 py-4",
										children: "IP Address"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-6 py-4",
										children: "OS"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-6 py-4",
										children: "Role"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-6 py-4",
										children: "Status"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-6 py-4",
										children: "CPU%"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-6 py-4",
										children: "RAM%"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-6 py-4",
										children: "Disk%"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-6 py-4",
										children: "Actions"
									})
								] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
								className: "divide-y divide-[var(--border-c)] font-sans text-sm text-[var(--text)]",
								children: filteredServers.map((srv) => {
									const isOnline = srv.status === "online";
									const isWarn = srv.status === "warning";
									const isSelected = selectedIp === srv.ip;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										onClick: () => setSelectedIp(srv.ip),
										className: `cursor-pointer transition-colors ${isSelected ? "bg-[var(--amber-low)]" : "hover:bg-[var(--bg-void)]/50"}`,
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-6 py-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "radio",
														checked: isSelected,
														readOnly: true,
														className: "accent-[var(--amber)]"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-[var(--text)]",
														children: srv.name
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-6 py-4 font-mono text-xs text-[var(--text-sub)]",
												children: srv.ip
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-6 py-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 text-xs text-[var(--text-sub)]",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, {
														size: 14,
														className: "text-[var(--teal)]"
													}), srv.os]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-6 py-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[var(--bg-void)] border border-[var(--border-c)] text-[var(--text)]",
													children: srv.role
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-6 py-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isOnline ? "bg-[var(--ok)]/10 text-[var(--ok)] border border-[var(--ok)]/20" : isWarn ? "bg-[var(--warn)]/10 text-[var(--warn)] border border-[var(--warn)]/20" : "bg-[var(--crit)]/10 text-[var(--crit)] border border-[var(--crit)]/20"}`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `w-1.5 h-1.5 rounded-full ${isOnline ? "bg-[var(--ok)]" : isWarn ? "bg-[var(--warn)]" : "bg-[var(--crit)]"} animate-pulse` }), srv.status.toUpperCase()]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-6 py-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 w-28",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "w-8 text-right font-mono text-xs font-semibold",
														children: [srv.cpu, "%"]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "h-1.5 flex-1 bg-[var(--border-dim)] rounded-full overflow-hidden",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "h-full rounded-full transition-all duration-500",
															style: {
																width: `${srv.cpu}%`,
																backgroundColor: srv.cpu > 80 ? "var(--crit)" : srv.cpu > 50 ? "var(--warn)" : "var(--amber)"
															}
														})
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-6 py-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 w-28",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "w-8 text-right font-mono text-xs font-semibold",
														children: [srv.mem, "%"]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "h-1.5 flex-1 bg-[var(--border-dim)] rounded-full overflow-hidden",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "h-full rounded-full transition-all duration-500",
															style: {
																width: `${srv.mem}%`,
																backgroundColor: srv.mem > 80 ? "var(--crit)" : srv.mem > 50 ? "var(--warn)" : "var(--teal)"
															}
														})
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-6 py-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 w-28",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "w-8 text-right font-mono text-xs font-semibold",
														children: [srv.disk, "%"]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "h-1.5 flex-1 bg-[var(--border-dim)] rounded-full overflow-hidden",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "h-full rounded-full transition-all duration-500",
															style: {
																width: `${srv.disk}%`,
																backgroundColor: srv.disk > 80 ? "var(--crit)" : srv.disk > 50 ? "var(--warn)" : "var(--amber)"
															}
														})
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "px-6 py-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-1.5",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															onClick: (e) => {
																e.stopPropagation();
																navigate({
																	to: `/server/$serverId`,
																	params: { serverId: srv.ip }
																});
															},
															className: "p-2 rounded-lg border border-[var(--border-c)] bg-[var(--bg-void)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] transition-all text-[var(--text-sub)]",
															title: "Remote Desktop",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { size: 14 })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															onClick: (e) => {
																e.stopPropagation();
																navigate({
																	to: "/powershell",
																	search: { serverIp: srv.ip }
																});
															},
															className: "p-2 rounded-lg border border-[var(--border-c)] bg-[var(--bg-void)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] transition-all text-[var(--text-sub)]",
															title: "PowerShell",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, { size: 14 })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															onClick: (e) => {
																e.stopPropagation();
																handleRestart(srv.ip, srv.name);
															},
															className: "p-2 rounded-lg border border-[var(--border-c)] bg-[var(--bg-void)] hover:bg-[var(--ok)]/10 hover:text-[var(--ok)] transition-all text-[var(--text-sub)]",
															title: "Restart Server",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 14 })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															onClick: (e) => {
																e.stopPropagation();
																handleShutdown(srv.ip, srv.name);
															},
															className: "p-2 rounded-lg border border-[var(--border-c)] bg-[var(--bg-void)] hover:bg-[var(--crit)]/10 hover:text-[var(--crit)] transition-all text-[var(--text-sub)]",
															title: "Shutdown Server",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PowerOff, { size: 14 })
														})
													]
												})
											})
										]
									}, srv.ip);
								})
							})]
						})
					}),
					filteredServers.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "py-16 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, {
								size: 40,
								className: "mx-auto mb-3 text-[var(--text-sub)] opacity-30"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-[var(--text-sub)]",
								children: servers.length === 0 ? "No servers registered yet." : "No servers match your search."
							}),
							servers.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setSearchQuery("");
									setFilter("all");
								},
								className: "mt-3 text-xs text-[var(--amber)] hover:underline",
								children: "Clear filters"
							})
						]
					})
				]
			}),
			isAddOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerModal, {
				type: "add",
				onClose: () => setIsAddOpen(false),
				onSaved: loadData
			}),
			isEditOpen && selectedIp && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerModal, {
				type: "edit",
				server: servers.find((s) => s.ip === selectedIp),
				onClose: () => setIsEditOpen(false),
				onSaved: loadData
			})
		]
	});
}
function ServerModal({ type, server, onClose, onSaved }) {
	const [name, setName] = (0, import_react.useState)(server?.name || "");
	const [ip, setIp] = (0, import_react.useState)(server?.ip || "");
	const [role, setRole] = (0, import_react.useState)(server?.role || "");
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitting(true);
		try {
			if (type === "add") {
				await addServerClient({
					name,
					ip,
					role
				});
				toast.success("Server added successfully");
			} else if (server) {
				await editServerClient(server.ip, {
					name,
					ip,
					role
				});
				toast.success("Server updated successfully");
			}
			onSaved();
			onClose();
		} catch (e) {
			toast.error(`${type === "add" ? "Add" : "Update"} failed: ${e instanceof Error ? e.message : "Unknown error"}`);
		} finally {
			setSubmitting(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: handleSubmit,
			className: "bg-[var(--bg-card)] border border-[var(--border-c)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between p-6 border-b border-[var(--border-c)] bg-[var(--bg-surface)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xl font-bold text-[var(--text)]",
						children: type === "add" ? "Add Server" : "Edit Server"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClose,
						className: "text-[var(--text-sub)] hover:text-[var(--text)] p-1 rounded-full hover:bg-[var(--bg-void)] transition-colors",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 20 })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-6 space-y-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-sm font-semibold text-[var(--text-sub)] mb-2 uppercase tracking-wider",
							children: "Hostname"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							required: true,
							value: name,
							onChange: (e) => setName(e.target.value),
							className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none transition-colors",
							placeholder: "e.g. SRV-01"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-sm font-semibold text-[var(--text-sub)] mb-2 uppercase tracking-wider",
							children: "IP Address"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							required: true,
							value: ip,
							onChange: (e) => setIp(e.target.value),
							className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none transition-colors font-mono",
							placeholder: "192.168.1.50"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-sm font-semibold text-[var(--text-sub)] mb-2 uppercase tracking-wider",
							children: "Server Role"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							required: true,
							value: role,
							onChange: (e) => setRole(e.target.value),
							className: "w-full rounded-xl border border-[var(--border-c)] bg-[var(--bg-void)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none transition-colors",
							placeholder: "e.g. Web Server"
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-6 pt-2 flex justify-end gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClose,
						className: "px-5 py-2.5 rounded-full font-semibold text-[var(--text-sub)] hover:bg-[var(--bg-void)] hover:text-[var(--text)] transition-colors",
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						disabled: submitting,
						type: "submit",
						className: "px-6 py-2.5 rounded-full font-bold bg-[var(--amber)] text-white hover:opacity-90 shadow-md transition-opacity disabled:opacity-50",
						children: submitting ? "Saving..." : "Save"
					})]
				})
			]
		})
	});
}
function ServersPage() {
	const { theme } = (0, import_react.useContext)(ThemeContext);
	if (theme === "horizon") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HorizonServers, {});
	const [servers, setServers] = (0, import_react.useState)([]);
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
	const [osFilters, setOsFilters] = (0, import_react.useState)([]);
	const [q, setQ] = (0, import_react.useState)("");
	const [isAdding, setIsAdding] = (0, import_react.useState)(false);
	const [newName, setNewName] = (0, import_react.useState)("");
	const [newIp, setNewIp] = (0, import_react.useState)("");
	const [newRole, setNewRole] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const loadServers = async () => {
		setLoading(true);
		try {
			setServers(await getServersClient());
		} catch (e) {
			toast.error("Failed to load servers");
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		loadServers();
	}, []);
	const handleAdd = async (e) => {
		e.preventDefault();
		try {
			await addServerClient({
				name: newName,
				ip: newIp,
				role: newRole
			});
			toast.success("Server added");
			setIsAdding(false);
			setNewName("");
			setNewIp("");
			setNewRole("");
			loadServers();
		} catch (e) {
			toast.error("Failed to add server");
		}
	};
	const filtered = servers.filter((s) => (statusFilter === "all" || s.status === statusFilter) && (osFilters.length === 0 || osFilters.includes(s.os)) && (q === "" || s.name.toLowerCase().includes(q.toLowerCase()) || s.ip.includes(q) || s.role.toLowerCase().includes(q.toLowerCase())));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Infrastructure",
			title: "Server Fleet",
			subtitle: `${servers.length} servers · ${servers.filter((s) => s.status === "online").length} online`,
			right: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: loadServers,
					disabled: loading,
					className: "mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:text-[var(--text)] transition-colors disabled:opacity-50",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
						size: 14,
						className: loading ? "animate-spin" : ""
					}), " Refresh"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setIsAdding(true),
					className: "mono flex items-center gap-1.5 rounded-md border border-[var(--amber)] bg-[var(--amber-low)] px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--amber)] hover:bg-[var(--amber)] hover:text-black transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }), " Add Server"]
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-[240px_1fr] gap-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "nx-card h-fit p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "Search…",
						className: "mono mb-4 w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-2 text-[12px] placeholder:text-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow pb-2",
						children: "Status"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-1",
						children: [
							"all",
							"online",
							"warning",
							"critical"
						].map((k) => {
							const count = k === "all" ? servers.length : servers.filter((s) => s.status === k).length;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setStatusFilter(k),
								className: "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] capitalize transition-colors " + (statusFilter === k ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: k }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mono text-[10px]",
									children: count
								})]
							}, k);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow pb-2 pt-5",
						children: "OS"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-1 text-[12px] text-[var(--text-sub)]",
						children: [
							"Windows Server 2016",
							"Windows Server 2019",
							"Windows Server 2022"
						].map((os) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2 px-2.5 py-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								defaultChecked: true,
								className: "accent-[var(--amber)]"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: os.replace("Windows Server ", "WS ") })]
						}, os))
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 gap-4 xl:grid-cols-2",
				children: [filtered.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerCard, {
					s,
					onAction: loadServers
				}, s.id)), filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "nx-card col-span-full p-12 text-center text-[13px] text-[var(--text-sub)]",
					children: "No servers match those filters."
				})]
			})]
		}),
		isAdding && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handleAdd,
				className: "nx-card w-[400px] p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mb-4 text-lg font-semibold",
						children: "Add Server"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "mb-1 block text-sm text-[var(--text-sub)]",
								children: "Hostname"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								required: true,
								value: newName,
								onChange: (e) => setNewName(e.target.value),
								className: "w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none",
								placeholder: "e.g. SRV-01"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "mb-1 block text-sm text-[var(--text-sub)]",
								children: "IP Address"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								required: true,
								value: newIp,
								onChange: (e) => setNewIp(e.target.value),
								className: "w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none",
								placeholder: "e.g. 192.168.1.50"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "mb-1 block text-sm text-[var(--text-sub)]",
								children: "Server Role"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								required: true,
								value: newRole,
								onChange: (e) => setNewRole(e.target.value),
								className: "w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--amber)] focus:outline-none",
								placeholder: "e.g. Database Server"
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex justify-end gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setIsAdding(false),
							className: "rounded px-4 py-2 text-sm text-[var(--text-sub)] hover:text-[var(--text)]",
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							className: "rounded bg-[var(--amber)] px-4 py-2 text-sm font-medium text-black",
							children: "Add"
						})]
					})
				]
			})
		})
	] });
}
function ServerCard({ s, onAction }) {
	const stripe = s.status === "online" ? "var(--ok)" : s.status === "warning" ? "var(--warn)" : "var(--crit)";
	const navigate = useNavigate();
	const handleRestart = async () => {
		toast.info(`Restarting ${s.name}...`);
		if (await restartServerClient(s.ip)) {
			toast.success(`${s.name} is restarting`);
			onAction();
		} else toast.error(`Failed to restart ${s.name}`);
	};
	const handleShutdown = async () => {
		toast.info(`Shutting down ${s.name}...`);
		if (await shutdownServerClient(s.ip)) {
			toast.success(`${s.name} is shutting down`);
			onAction();
		} else toast.error(`Failed to shutdown ${s.name}`);
	};
	const handleDelete = async () => {
		if (!confirm(`Are you sure you want to delete ${s.name}?`)) return;
		if (await deleteServerClient(s.ip)) {
			toast.success(`${s.name} deleted`);
			onAction();
		} else toast.error(`Failed to delete ${s.name}`);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "nx-card relative overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "absolute left-0 top-0 h-full w-[3px]",
			style: { background: stripe }
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "display text-[18px] font-semibold",
						children: s.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mono pt-0.5 text-[11px] text-[var(--text-sub)]",
						children: [
							s.ip,
							" · ",
							s.os
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: s.status })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mono mt-2 inline-block rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] text-[var(--text-sub)]",
					children: s.role
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 grid grid-cols-3 gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricBar, {
							label: "CPU",
							value: s.cpu,
							warning: 75,
							critical: 90
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricBar, {
							label: "Mem",
							value: s.mem,
							warning: 75,
							critical: 90
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricBar, {
							label: "Disk",
							value: s.disk,
							warning: 75,
							critical: 90
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub)]",
						children: ["Uptime · ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[var(--teal)]",
							children: s.uptime
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconAction, {
								icon: Monitor,
								label: "Connect",
								onClick: () => navigate({
									to: `/server/$serverId`,
									params: { serverId: s.ip }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconAction, {
								icon: Terminal,
								label: "PowerShell",
								onClick: () => navigate({
									to: "/powershell",
									search: { serverIp: s.ip }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									title: "More",
									className: "grid h-7 w-7 place-items-center rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)] transition-colors hover:border-[var(--amber)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)] outline-none",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { size: 13 })
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
								align: "end",
								className: "w-48 bg-[var(--bg-card)] border-[var(--border-dim)]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
										onClick: handleRestart,
										className: "cursor-pointer hover:bg-[var(--bg-surface)] text-[var(--text)]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "mr-2 h-4 w-4" }), " Restart"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
										onClick: handleShutdown,
										className: "cursor-pointer hover:bg-[var(--bg-surface)] text-[var(--text)]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Power, { className: "mr-2 h-4 w-4" }), " Shutdown"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, { className: "bg-[var(--border-dim)]" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
										onClick: handleDelete,
										className: "cursor-pointer text-[var(--crit)] hover:!bg-[var(--crit)]/10 hover:!text-[var(--crit)] transition-colors",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-2 h-4 w-4" }), " Remove Server"]
									})
								]
							})] })
						]
					})]
				})
			]
		})]
	});
}
function IconAction({ icon: Icon, label, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		title: label,
		className: "grid h-7 w-7 place-items-center rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)] transition-colors hover:border-[var(--amber)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 13 })
	});
}
//#endregion
export { ServersPage as component };
