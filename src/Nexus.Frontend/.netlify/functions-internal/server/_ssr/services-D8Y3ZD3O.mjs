import { i as __toESM } from "../_runtime.mjs";
import { M as getServicesClient, s as controlServiceClient } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { At as ChevronDown, I as Play, Ot as ChevronUp, g as Square, k as RotateCw, n as X } from "../_libs/lucide-react.mjs";
import { t as StatusBadge } from "./StatusBadge-DvNl1BAE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/services-D8Y3ZD3O.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ServicesPage() {
	const [server, setServer] = (0, import_react.useState)("nexus01");
	const [services, setServices] = (0, import_react.useState)([]);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [q, setQ] = (0, import_react.useState)("");
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [auto, setAuto] = (0, import_react.useState)(true);
	const [sortCol, setSortCol] = (0, import_react.useState)("displayName");
	const [sortAsc, setSortAsc] = (0, import_react.useState)(true);
	const [actionTarget, setActionTarget] = (0, import_react.useState)(null);
	const loadServices = () => {
		getServicesClient(server).then((data) => {
			setServices(data);
			if (selected) {
				const updatedSelected = data.find((s) => s.name === selected.name);
				if (updatedSelected) setSelected(updatedSelected);
			}
		}).catch((err) => {
			console.error("Failed to load services", err);
		});
	};
	(0, import_react.useEffect)(() => {
		let id;
		loadServices();
		if (auto) id = window.setInterval(loadServices, 5e3);
		return () => {
			if (id) window.clearInterval(id);
		};
	}, [server, auto]);
	const handleActionConfirm = async () => {
		if (!actionTarget) return;
		const { action, service } = actionTarget;
		setLoading(true);
		setActionTarget(null);
		try {
			await controlServiceClient(server, service.name, action);
			setTimeout(() => loadServices(), 500);
			setTimeout(() => loadServices(), 2500);
		} catch (err) {
			console.error("Failed to control service", err);
		} finally {
			setLoading(false);
		}
	};
	const handleSort = (col) => {
		if (sortCol === col) setSortAsc(!sortAsc);
		else {
			setSortCol(col);
			setSortAsc(true);
		}
	};
	const SortIcon = ({ col }) => {
		if (sortCol !== col) return null;
		return sortAsc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, {
			size: 14,
			className: "inline ml-1"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
			size: 14,
			className: "inline ml-1"
		});
	};
	const filtered = (0, import_react.useMemo)(() => {
		let res = services.filter((s) => (statusFilter === "all" || s.status === statusFilter) && (q === "" || s.displayName.toLowerCase().includes(q.toLowerCase()) || s.name.toLowerCase().includes(q.toLowerCase())));
		res.sort((a, b) => {
			let valA = a[sortCol];
			let valB = b[sortCol];
			if (typeof valA === "string" && typeof valB === "string") return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
			return 0;
		});
		return res;
	}, [
		services,
		q,
		statusFilter,
		sortCol,
		sortAsc
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Management",
			title: "Services",
			subtitle: `${services.length} services on ${server.toUpperCase()}`
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
			value: server,
			onChange: setServer
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-[1fr_360px] gap-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "nx-card overflow-hidden flex flex-col h-[calc(100vh-200px)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-c)] p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: q,
							onChange: (e) => setQ(e.target.value),
							placeholder: "Search by name…",
							className: "mono w-60 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[12px] placeholder:text-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none transition-colors"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: statusFilter,
							onChange: (e) => setStatusFilter(e.target.value),
							className: "mono rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2 py-1.5 text-[11px] text-[var(--text)] outline-none transition-colors focus:border-[var(--amber)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "all",
									children: "All status"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Running" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Stopped" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Paused" })
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mono flex items-center gap-1.5 text-[11px] text-[var(--text-sub)] cursor-pointer hover:text-white transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: auto,
							onChange: (e) => setAuto(e.target.checked),
							className: "accent-[var(--amber)]"
						}), "Auto-refresh 5s"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 overflow-y-auto outline-none",
					onClick: (e) => {
						if (e.target === e.currentTarget) setSelected(null);
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-[12px] select-none",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "sticky top-0 bg-[var(--bg-card)]/95 backdrop-blur-sm shadow-[0_1px_0_var(--border-c)] z-10",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "eyebrow text-left text-[var(--text-sub)]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
										className: "px-4 py-2 cursor-pointer hover:text-[var(--text)] transition-colors",
										onClick: () => handleSort("name"),
										title: "Sort by Name",
										children: ["Name ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "name" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
										className: "py-2 cursor-pointer hover:text-[var(--text)] transition-colors",
										onClick: () => handleSort("displayName"),
										title: "Sort by Display Name",
										children: ["Display Name ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "displayName" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
										className: "py-2 cursor-pointer hover:text-[var(--text)] transition-colors",
										onClick: () => handleSort("status"),
										title: "Sort by Status",
										children: ["Status ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "status" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
										className: "py-2 cursor-pointer hover:text-[var(--text)] transition-colors",
										onClick: () => handleSort("startupType"),
										title: "Sort by Startup",
										children: ["Startup ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "startupType" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
										className: "py-2 cursor-pointer hover:text-[var(--text)] transition-colors",
										onClick: () => handleSort("logOnAs"),
										title: "Sort by Log On As",
										children: ["Log On As ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "logOnAs" })]
									})
								]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "mono",
							children: filtered.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								onClick: () => setSelected(s),
								title: `Click to view details for ${s.name}`,
								className: "cursor-pointer border-b border-[var(--border-dim)] transition-colors " + (selected?.name === s.name ? "bg-[var(--amber-low)]/40 hover:bg-[var(--amber-low)]/50" : "hover:bg-[var(--amber-low)]/10"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-2 text-[var(--text)] transition-colors " + (selected?.name === s.name ? "border-l-2 border-[var(--amber)] font-medium text-[var(--amber)]" : "border-l-2 border-transparent"),
										children: s.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "text-[var(--text-sub)]",
										children: s.displayName
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, {
										status: s.status.toLowerCase() === "running" ? "online" : s.status.toLowerCase() === "stopped" ? "offline" : "warning",
										label: s.status
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "text-[var(--text-sub)]",
										children: s.startupType
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "text-[var(--text-sub)]",
										children: s.logOnAs
									})
								]
							}, s.name))
						})]
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "nx-card h-[calc(100vh-200px)] flex flex-col p-5 overflow-y-auto",
				children: selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow pb-1",
						children: "Service Detail"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "display text-[16px] font-semibold",
						children: selected.displayName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mono pt-1 text-[11px] text-[var(--text-sub)]",
						children: selected.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pt-3 text-[12px] leading-relaxed text-[var(--text-sub)]",
						children: selected.description || "No description provided."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "my-5 flex gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionBtn, {
								icon: Play,
								label: "Start",
								title: "Start service",
								onClick: () => setActionTarget({
									action: "start",
									service: selected
								}),
								disabled: loading || selected.status === "Running"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionBtn, {
								icon: Square,
								label: "Stop",
								title: selected.acceptStop ? "Stop service" : "Service cannot be stopped",
								onClick: () => setActionTarget({
									action: "stop",
									service: selected
								}),
								disabled: loading || selected.status === "Stopped" || selected.acceptStop === false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionBtn, {
								icon: RotateCw,
								label: "Restart",
								title: selected.acceptStop ? "Restart service" : "Service cannot be restarted",
								onClick: () => setActionTarget({
									action: "restart",
									service: selected
								}),
								disabled: loading || selected.status === "Stopped" || selected.acceptStop === false
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow pb-1",
						children: "Executable Path"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mono text-[11px] text-[var(--text)] bg-[var(--bg-surface)] p-2 rounded border border-[var(--border-dim)] break-all max-h-24 overflow-y-auto mb-4",
						children: selected.pathName || "Unknown"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "eyebrow pb-1",
							children: "Process ID"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mono text-[13px] text-[var(--amber)]",
							children: selected.processId || "None"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "eyebrow pb-1",
							children: "Capabilities"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mono text-[11px] text-[var(--text-sub)] space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Can Stop: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: selected.acceptStop ? "text-[var(--teal)]" : "text-[var(--red)]",
								children: selected.acceptStop ? "Yes" : "No"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Can Pause: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: selected.acceptPause ? "text-[var(--teal)]" : "text-[var(--red)]",
								children: selected.acceptPause ? "Yes" : "No"
							})] })]
						})] })]
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-12 text-center text-[12px] text-[var(--text-sub)]",
					children: "Select a service to view details."
				})
			})]
		}),
		actionTarget && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-md overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `flex items-center justify-between border-b px-4 py-3 ${actionTarget.action === "start" ? "border-[var(--teal)]/30 bg-[var(--teal)]/10" : "border-[var(--crit)]/30 bg-[var(--crit)]/10"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `eyebrow flex items-center gap-2 ${actionTarget.action === "start" ? "text-[var(--teal)]" : "text-[var(--crit)]"}`,
						children: ["Confirm Service ", actionTarget.action]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setActionTarget(null),
						className: "text-[var(--text-sub)] hover:text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[13px] text-[var(--text)] mb-3",
							children: [
								"Are you sure you want to ",
								actionTarget.action,
								" the service ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: actionTarget.service.displayName }),
								"?"
							]
						}),
						actionTarget.action !== "start" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[12px] text-[var(--text-sub)] mb-5",
							children: "WARNING: Stopping or restarting a critical system service may cause other services to fail or the system to become unstable."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-end gap-3 mt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setActionTarget(null),
								className: "rounded px-4 py-1.5 text-[12px] font-medium text-[var(--text-sub)] transition-colors hover:text-white border border-transparent",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: handleActionConfirm,
								className: `rounded px-4 py-1.5 text-[12px] font-semibold text-black transition-colors ${actionTarget.action === "start" ? "bg-[var(--teal)] hover:bg-[var(--teal-hover)]" : "bg-[var(--crit)] text-white hover:bg-[var(--crit-hover)]"}`,
								children: ["Confirm ", actionTarget.action]
							})]
						})
					]
				})]
			})
		})
	] });
}
function ActionBtn({ icon: Icon, label, title, onClick, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		disabled,
		title,
		className: "mono flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors " + (disabled ? "opacity-50 cursor-not-allowed text-[var(--text-sub)] bg-[var(--bg-surface)] border-[var(--border-c)]" : "border-[var(--border-c)] text-[var(--text-sub)] bg-[var(--bg-surface)] hover:border-[var(--amber)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)]"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 12 }),
			" ",
			label
		]
	});
}
//#endregion
export { ServicesPage as component };
