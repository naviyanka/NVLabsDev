import { i as __toESM } from "../_runtime.mjs";
import { j as getServersClient, p as getApiUrl } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as Play, T as Server, g as Square, m as Terminal, v as SquareCheckBig, wt as CircleStop } from "../_libs/lucide-react.mjs";
import { l as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { s as ThemeContext } from "../__root-H47vz4C-.mjs";
import { t as Route } from "./plugin._id-CkGWTUIo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/plugin._id-CkGJErXf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function MultiServerSelector$1({ value, onChange }) {
	const [servers, setServers] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		getServersClient().then(setServers);
	}, []);
	const allSelected = servers.length > 0 && value.length === servers.length;
	function toggleAll() {
		if (allSelected) onChange([]);
		else onChange(servers.map((s) => s.ip));
	}
	function toggleOne(ip) {
		if (value.includes(ip)) onChange(value.filter((v) => v !== ip));
		else onChange([...value, ip]);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-2 pb-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "eyebrow",
				children: "Select Targets"
			}), servers.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: toggleAll,
				className: "flex items-center gap-1.5 text-[11px] text-[var(--text-sub)] hover:text-[var(--text)] transition-colors",
				children: [allSelected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquareCheckBig, {
					size: 14,
					className: "text-[var(--amber)]"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { size: 14 }), "Select All"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-wrap items-center gap-1.5",
			children: servers.map((s) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => toggleOne(s.ip),
					className: ["mono flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors", value.includes(s.ip) ? "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)]" : "border-[var(--border-c)] bg-[var(--bg-card)] text-[var(--text-sub)] hover:border-[var(--amber)]/40 hover:text-[var(--text)]"].join(" "),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "h-1.5 w-1.5 rounded-full",
							style: { background: s.status === "online" ? "var(--ok)" : s.status === "warning" ? "var(--warn)" : s.status === "critical" ? "var(--crit)" : "var(--text-sub)" }
						}),
						s.name,
						" (",
						s.ip,
						")"
					]
				}, s.id);
			})
		})]
	});
}
function HorizonPlugin() {
	const id = useRouterState({ select: (s) => s.location.pathname }).split("/").pop();
	const [plugin, setPlugin] = (0, import_react.useState)(null);
	const [serverIps, setServerIps] = (0, import_react.useState)([]);
	const [jobs, setJobs] = (0, import_react.useState)([]);
	const [selectedTabIp, setSelectedTabIp] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		fetch(getApiUrl(`/plugins`)).then((r) => r.json()).then((data) => setPlugin(data.find((p) => p.id === id) || null)).catch(() => toast.error("Failed to load plugin details"));
	}, [id]);
	function fetchJobs() {
		fetch(getApiUrl(`/plugins/${id}/jobs`)).then((r) => r.json()).then((data) => {
			setJobs(data);
			if (!selectedTabIp && data.length > 0) setSelectedTabIp(data[0].serverIp);
		}).catch(() => {});
	}
	(0, import_react.useEffect)(() => {
		fetchJobs();
		const interval = setInterval(fetchJobs, 2e3);
		return () => clearInterval(interval);
	}, [id, selectedTabIp]);
	function runPlugin() {
		if (serverIps.length === 0) return toast.error("Select at least one server");
		const queryParams = serverIps.map((ip) => `serverIps=${encodeURIComponent(ip)}`).join("&");
		fetch(getApiUrl(`/plugins/${id}/run?${queryParams}`), { method: "POST" }).then((r) => r.json()).then(() => {
			toast.success("Plugin execution started in background");
			if (serverIps.length > 0) setSelectedTabIp(serverIps[0]);
			fetchJobs();
		}).catch((err) => toast.error(`Failed to execute plugin: ${err.message}`));
	}
	function stopAll() {
		fetch(getApiUrl(`/plugins/${id}/stop`), { method: "POST" }).then((r) => r.json()).then(() => {
			toast.success("Stop command issued to all running jobs");
			fetchJobs();
		}).catch(() => toast.error("Failed to stop jobs"));
	}
	function stopOne(ip) {
		fetch(getApiUrl(`/plugins/${id}/stop?serverIp=${encodeURIComponent(ip)}`), { method: "POST" }).then((r) => r.json()).then(() => {
			toast.success(`Stop command issued for ${ip}`);
			fetchJobs();
		}).catch(() => toast.error(`Failed to stop job on ${ip}`));
	}
	if (!plugin) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "max-w-[1600px] mx-auto space-y-8 font-sans",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[12px] text-[var(--text-sub)]",
			children: "Loading plugin..."
		})
	});
	const hasRunningJobs = jobs.some((j) => j.status === "Running");
	const selectedJob = jobs.find((j) => j.serverIp === selectedTabIp);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-[1600px] mx-auto space-y-8 font-sans",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col md:flex-row md:items-center justify-between gap-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-3xl font-extrabold text-[var(--text)]",
					children: plugin.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-[var(--text-sub)] mt-1",
					children: plugin.description
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "nx-card p-6 mb-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-4 items-end justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 min-w-[300px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MultiServerSelector$1, {
							value: serverIps,
							onChange: setServerIps
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pb-5 flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: runPlugin,
							disabled: serverIps.length === 0,
							className: "flex h-9 items-center gap-2 rounded-md bg-[var(--amber)] px-4 text-[12px] font-semibold text-[var(--bg-void)] hover:bg-[var(--amber-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 14 }), "Run Plugin"]
						}), hasRunningJobs && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: stopAll,
							className: "flex h-9 items-center gap-2 rounded-md bg-[var(--crit)]/20 border border-[var(--crit)]/40 px-4 text-[12px] font-semibold text-[var(--crit)] hover:bg-[var(--crit)] hover:text-black transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleStop, { size: 14 }), "Stop All Running"]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-[220px_1fr] gap-5 h-[550px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "nx-card p-3 flex flex-col gap-2 overflow-y-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "eyebrow px-1 pb-2",
							children: "Active & Recent Jobs"
						}),
						jobs.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] text-[var(--text-sub)] px-1 py-4 text-center",
							children: "No jobs active. Select targets above and click Run Plugin."
						}),
						jobs.map((j) => {
							const isSelected = j.serverIp === selectedTabIp;
							const statusColor = j.status === "Running" ? "var(--amber)" : j.status === "Completed" ? "var(--ok)" : j.status === "Failed" ? "var(--crit)" : "var(--text-sub)";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setSelectedTabIp(j.serverIp),
								className: `flex flex-col items-start gap-1 rounded-md p-2.5 text-[12px] border transition-all ${isSelected ? "bg-[var(--amber-low)] border-[var(--amber)]/40 text-[var(--amber)]" : "bg-[var(--bg-surface)] border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--text)]"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between w-full font-medium",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1.5 mono",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, { size: 12 }), j.serverIp]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "h-2 w-2 rounded-full shrink-0",
										style: { background: statusColor }
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between w-full text-[10px] text-[var(--text-sub)] mono mt-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: j.status }), j.status === "Running" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[var(--amber)] animate-pulse font-semibold",
										children: "Live"
									})]
								})]
							}, j.serverIp);
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "nx-card flex flex-col h-full overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-2.5 flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, {
								size: 14,
								className: "text-[var(--text-sub)]"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mono text-[11px] uppercase tracking-wider text-[var(--text-sub)]",
								children: ["Output Console ", selectedTabIp ? `— ${selectedTabIp}` : ""]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [selectedJob && selectedJob.status === "Running" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => stopOne(selectedJob.serverIp),
								className: "mono flex items-center gap-1 rounded bg-[var(--crit)]/10 border border-[var(--crit)]/30 px-2.5 py-1 text-[11px] font-medium text-[var(--crit)] hover:bg-[var(--crit)] hover:text-black transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleStop, { size: 12 }), " Stop Machine"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mono text-[11px] text-[var(--text-sub)]",
								children: [
									"[",
									plugin.scriptType,
									"]"
								]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 overflow-auto bg-[#0a0a0a] p-4",
						children: selectedJob ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
							className: "mono text-[12px] text-[var(--ok)] leading-relaxed whitespace-pre-wrap",
							children: selectedJob.output || "Connecting to native session..."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[12px] text-[var(--text-sub)] text-center py-12",
							children: "Select a machine from the left sidebar to view its live execution log."
						})
					})]
				})]
			})
		]
	});
}
function MultiServerSelector({ value, onChange }) {
	const [servers, setServers] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		getServersClient().then(setServers);
	}, []);
	const allSelected = servers.length > 0 && value.length === servers.length;
	function toggleAll() {
		if (allSelected) onChange([]);
		else onChange(servers.map((s) => s.ip));
	}
	function toggleOne(ip) {
		if (value.includes(ip)) onChange(value.filter((v) => v !== ip));
		else onChange([...value, ip]);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-2 pb-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "eyebrow",
				children: "Select Targets"
			}), servers.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: toggleAll,
				className: "flex items-center gap-1.5 text-[11px] text-[var(--text-sub)] hover:text-[var(--text)] transition-colors",
				children: [allSelected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquareCheckBig, {
					size: 14,
					className: "text-[var(--amber)]"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { size: 14 }), "Select All"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-wrap items-center gap-1.5",
			children: servers.map((s) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => toggleOne(s.ip),
					className: ["mono flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors", value.includes(s.ip) ? "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)]" : "border-[var(--border-c)] bg-[var(--bg-card)] text-[var(--text-sub)] hover:border-[var(--amber)]/40 hover:text-[var(--text)]"].join(" "),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "h-1.5 w-1.5 rounded-full",
							style: { background: s.status === "online" ? "var(--ok)" : s.status === "warning" ? "var(--warn)" : s.status === "critical" ? "var(--crit)" : "var(--text-sub)" }
						}),
						s.name,
						" (",
						s.ip,
						")"
					]
				}, s.id);
			})
		})]
	});
}
function PluginRunnerPage() {
	const { theme } = (0, import_react.useContext)(ThemeContext);
	if (theme === "horizon") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HorizonPlugin, {});
	const { id } = Route.useParams();
	const [plugin, setPlugin] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [serverIps, setServerIps] = (0, import_react.useState)([]);
	const [jobs, setJobs] = (0, import_react.useState)([]);
	const [selectedTabIp, setSelectedTabIp] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		fetch(`/api/plugins`).then((r) => {
			if (!r.ok) throw new Error("Backend offline");
			return r.json();
		}).then((data) => {
			const found = data.find((p) => p.id === id);
			if (found) {
				setPlugin(found);
				setError(null);
			} else setError("Plugin not found");
		}).catch(() => {
			toast.error("Failed to load plugin details");
			setError("Plugin data unavailable (backend offline)");
		});
	}, [id]);
	function fetchJobs() {
		fetch(`/api/plugins/${id}/jobs`).then((r) => r.json()).then((data) => {
			setJobs(data);
			if (!selectedTabIp && data.length > 0) setSelectedTabIp(data[0].serverIp);
		}).catch(() => {});
	}
	(0, import_react.useEffect)(() => {
		fetchJobs();
		const interval = setInterval(fetchJobs, 2e3);
		return () => clearInterval(interval);
	}, [id, selectedTabIp]);
	function runPlugin() {
		if (serverIps.length === 0) return toast.error("Select at least one server");
		const queryParams = serverIps.map((ip) => `serverIps=${encodeURIComponent(ip)}`).join("&");
		fetch(`/api/plugins/${id}/run?${queryParams}`, { method: "POST" }).then((r) => r.json()).then(() => {
			toast.success("Plugin execution started in background");
			if (serverIps.length > 0) setSelectedTabIp(serverIps[0]);
			fetchJobs();
		}).catch((err) => toast.error(`Failed to execute plugin: ${err.message}`));
	}
	function stopAll() {
		fetch(`/api/plugins/${id}/stop`, { method: "POST" }).then((r) => r.json()).then(() => {
			toast.success("Stop command issued to all running jobs");
			fetchJobs();
		}).catch(() => toast.error("Failed to stop jobs"));
	}
	function stopOne(ip) {
		fetch(`/api/plugins/${id}/stop?serverIp=${encodeURIComponent(ip)}`, { method: "POST" }).then((r) => r.json()).then(() => {
			toast.success(`Stop command issued for ${ip}`);
			fetchJobs();
		}).catch(() => toast.error(`Failed to stop job on ${ip}`));
	}
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageWrapper, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-[12px] text-[var(--crit)] bg-[var(--crit)]/10 border border-[var(--crit)]/30 rounded-lg p-4 max-w-md mx-auto text-center mt-8",
		children: error
	}) });
	if (!plugin) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageWrapper, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-[12px] text-[var(--text-sub)]",
		children: "Loading plugin..."
	}) });
	const hasRunningJobs = jobs.some((j) => j.status === "Running");
	const selectedJob = jobs.find((j) => j.serverIp === selectedTabIp);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Extension",
			title: plugin.name,
			subtitle: plugin.description
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "nx-card p-6 mb-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-4 items-end justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 min-w-[300px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MultiServerSelector, {
						value: serverIps,
						onChange: setServerIps
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pb-5 flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: runPlugin,
						disabled: serverIps.length === 0,
						className: "flex h-9 items-center gap-2 rounded-md bg-[var(--amber)] px-4 text-[12px] font-semibold text-[var(--bg-void)] hover:bg-[var(--amber-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 14 }), "Run Plugin"]
					}), hasRunningJobs && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: stopAll,
						className: "flex h-9 items-center gap-2 rounded-md bg-[var(--crit)]/20 border border-[var(--crit)]/40 px-4 text-[12px] font-semibold text-[var(--crit)] hover:bg-[var(--crit)] hover:text-black transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleStop, { size: 14 }), "Stop All Running"]
					})]
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-[220px_1fr] gap-5 h-[550px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "nx-card p-3 flex flex-col gap-2 overflow-y-auto",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow px-1 pb-2",
						children: "Active & Recent Jobs"
					}),
					jobs.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] text-[var(--text-sub)] px-1 py-4 text-center",
						children: "No jobs active. Select targets above and click Run Plugin."
					}),
					jobs.map((j) => {
						const isSelected = j.serverIp === selectedTabIp;
						const statusColor = j.status === "Running" ? "var(--amber)" : j.status === "Completed" ? "var(--ok)" : j.status === "Failed" ? "var(--crit)" : "var(--text-sub)";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setSelectedTabIp(j.serverIp),
							className: `flex flex-col items-start gap-1 rounded-md p-2.5 text-[12px] border transition-all ${isSelected ? "bg-[var(--amber-low)] border-[var(--amber)]/40 text-[var(--amber)]" : "bg-[var(--bg-surface)] border-[var(--border-c)] text-[var(--text-sub)] hover:text-[var(--text)]"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between w-full font-medium",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-1.5 mono",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, { size: 12 }), j.serverIp]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "h-2 w-2 rounded-full shrink-0",
									style: { background: statusColor }
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between w-full text-[10px] text-[var(--text-sub)] mono mt-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: j.status }), j.status === "Running" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[var(--amber)] animate-pulse font-semibold",
									children: "Live"
								})]
							})]
						}, j.serverIp);
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "nx-card flex flex-col h-full overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-2.5 flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, {
							size: 14,
							className: "text-[var(--text-sub)]"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mono text-[11px] uppercase tracking-wider text-[var(--text-sub)]",
							children: ["Output Console ", selectedTabIp ? `— ${selectedTabIp}` : ""]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [selectedJob && selectedJob.status === "Running" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => stopOne(selectedJob.serverIp),
							className: "mono flex items-center gap-1 rounded bg-[var(--crit)]/10 border border-[var(--crit)]/30 px-2.5 py-1 text-[11px] font-medium text-[var(--crit)] hover:bg-[var(--crit)] hover:text-black transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleStop, { size: 12 }), " Stop Machine"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mono text-[11px] text-[var(--text-sub)]",
							children: [
								"[",
								plugin.scriptType,
								"]"
							]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 overflow-auto bg-[#0a0a0a] p-4",
					children: selectedJob ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "mono text-[12px] text-[var(--ok)] leading-relaxed whitespace-pre-wrap",
						children: selectedJob.output || "Connecting to native session..."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[12px] text-[var(--text-sub)] text-center py-12",
						children: "Select a machine from the left sidebar to view its live execution log."
					})
				})]
			})]
		})
	] });
}
//#endregion
export { PluginRunnerPage as component };
