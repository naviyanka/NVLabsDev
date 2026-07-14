import { i as __toESM } from "../_runtime.mjs";
import { C as getLiveProcessesClient, D as getProcessDetailsClient, E as getPerformanceHistoryClient, V as killProcessClient } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { At as ChevronDown, Ot as ChevronUp, Z as Info, g as Square, lt as Ellipsis, n as X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/processes-BIYpQC0T.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function formatBytes(bytes, decimals = 2) {
	if (!+bytes) return "0 Bytes";
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = [
		"Bytes",
		"KB",
		"MB",
		"GB",
		"TB",
		"PB",
		"EB",
		"ZB",
		"YB"
	];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
function ProcessesPage() {
	const [server, setServer] = (0, import_react.useState)("dc");
	const [procs, setProcs] = (0, import_react.useState)([]);
	const [sysCpu, setSysCpu] = (0, import_react.useState)(0);
	const [sysMem, setSysMem] = (0, import_react.useState)(0);
	const [q, setQ] = (0, import_react.useState)("");
	const [sel, setSel] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [auto, setAuto] = (0, import_react.useState)(true);
	const [sortCol, setSortCol] = (0, import_react.useState)("cpu");
	const [sortAsc, setSortAsc] = (0, import_react.useState)(false);
	const [killTarget, setKillTarget] = (0, import_react.useState)(null);
	const [detailsTarget, setDetailsTarget] = (0, import_react.useState)(null);
	const [isDetailsLoading, setIsDetailsLoading] = (0, import_react.useState)(false);
	async function load() {
		if (!server) return;
		const p = await getLiveProcessesClient(server);
		setProcs(p);
		const hist = await getPerformanceHistoryClient(server);
		if (hist && hist.length > 0) {
			const latest = hist[hist.length - 1];
			setSysCpu(latest.cpu);
			setSysMem(latest.mem);
		} else {
			let totalCpu = 0;
			let totalMemPct = 0;
			p.forEach((x) => {
				totalCpu += x.cpu;
				totalMemPct += x.memPct;
			});
			setSysCpu(Math.min(100, totalCpu));
			setSysMem(Math.min(100, totalMemPct));
		}
	}
	(0, import_react.useEffect)(() => {
		let id;
		load();
		if (auto) id = window.setInterval(load, 5e3);
		return () => {
			if (id) window.clearInterval(id);
		};
	}, [server, auto]);
	async function handleEndTask() {
		if (!killTarget) return;
		for (const pid of killTarget) {
			await killProcessClient(server, pid);
			setSel((prev) => {
				const n = new Set(prev);
				n.delete(pid);
				return n;
			});
		}
		setKillTarget(null);
		load();
	}
	async function fetchDetails(pid) {
		setIsDetailsLoading(true);
		const existing = procs.find((p) => p.pid === pid);
		if (existing) {
			setDetailsTarget({ ...existing });
			const det = await getProcessDetailsClient(server, pid);
			if (det) setDetailsTarget({
				...existing,
				...det
			});
		}
		setIsDetailsLoading(false);
	}
	const handleSort = (col) => {
		if (sortCol === col) setSortAsc(!sortAsc);
		else {
			setSortCol(col);
			setSortAsc(false);
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
		let res = procs.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || String(p.pid).includes(q));
		res.sort((a, b) => {
			let valA = a[sortCol];
			let valB = b[sortCol];
			if (typeof valA === "string" && typeof valB === "string") return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
			valA = valA || 0;
			valB = valB || 0;
			return sortAsc ? valA - valB : valB - valA;
		});
		return res;
	}, [
		procs,
		q,
		sortCol,
		sortAsc
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Management",
			title: "Processes",
			subtitle: "Live process inventory"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
			value: server,
			onChange: setServer
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-card overflow-hidden",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-c)] p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "Search by name / PID…",
						className: "mono w-72 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[12px] placeholder:text-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none transition-colors"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mono flex items-center gap-1.5 text-[11px] text-[var(--text-sub)] cursor-pointer hover:text-white transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: auto,
								onChange: (e) => setAuto(e.target.checked),
								className: "accent-[var(--amber)]"
							}), "Auto-refresh 5s"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							disabled: sel.size === 0,
							onClick: () => setKillTarget(Array.from(sel)),
							title: "End selected tasks",
							className: "mono flex items-center gap-1.5 rounded-md border border-[var(--crit)]/40 bg-[var(--crit)]/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--crit)] transition-colors hover:bg-[var(--crit)]/20 disabled:opacity-30",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { size: 12 }), " End Task"]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-h-[60vh] overflow-y-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-[12px] select-none",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "sticky top-0 bg-[var(--bg-card)]/95 backdrop-blur-sm shadow-[0_1px_0_var(--border-c)] z-10",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "eyebrow text-left text-[var(--text-sub)]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "w-8 px-3 py-2" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
										className: "py-2 cursor-pointer hover:text-[var(--text)] transition-colors",
										onClick: () => handleSort("name"),
										title: "Sort by Name",
										children: ["Name ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "name" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
										className: "py-2 cursor-pointer hover:text-[var(--text)] transition-colors",
										onClick: () => handleSort("pid"),
										title: "Sort by PID",
										children: ["PID ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "pid" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
										className: "py-2 cursor-pointer hover:text-[var(--text)] transition-colors",
										onClick: () => handleSort("cpu"),
										title: "Sort by CPU",
										children: ["CPU% ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "cpu" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
										className: "py-2 cursor-pointer hover:text-[var(--text)] transition-colors",
										onClick: () => handleSort("memMB"),
										title: "Sort by Memory",
										children: ["Memory ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "memMB" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
										className: "py-2 cursor-pointer hover:text-[var(--text)] transition-colors",
										onClick: () => handleSort("memPct"),
										title: "Sort by Memory %",
										children: ["Mem% ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "memPct" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
										className: "py-2 cursor-pointer hover:text-[var(--text)] transition-colors",
										onClick: () => handleSort("handles"),
										title: "Sort by Handles",
										children: ["Handles ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "handles" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
										className: "py-2 cursor-pointer hover:text-[var(--text)] transition-colors",
										onClick: () => handleSort("threads"),
										title: "Sort by Threads",
										children: ["Threads ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "threads" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2",
										children: "User"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2",
										children: "Status"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "py-2 w-10" })
								]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "mono",
							children: filtered.map((p) => {
								const isSel = sel.has(p.pid);
								const hot = p.cpu > 50;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									onClick: () => {
										const n = new Set(sel);
										isSel ? n.delete(p.pid) : n.add(p.pid);
										setSel(n);
									},
									title: `Click to select ${p.name}`,
									className: `cursor-pointer border-b border-[var(--border-dim)] transition-colors ${isSel ? "bg-[var(--amber-low)]/40 hover:bg-[var(--amber-low)]/50" : hot ? "bg-[var(--warn)]/[0.04] hover:bg-[var(--warn)]/[0.08]" : "hover:bg-[var(--amber-low)]/10"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-3 py-1.5 transition-colors " + (isSel ? "border-l-2 border-[var(--amber)]" : "border-l-2 border-transparent"),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "checkbox",
												checked: isSel,
												onChange: () => {},
												className: "accent-[var(--amber)] pointer-events-none"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--text)]",
											children: p.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--text-sub)]",
											children: p.pid
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: hot ? "text-[var(--warn)]" : "text-[var(--amber)]",
												children: p.cpu.toFixed(1)
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-1 w-12 rounded bg-[var(--border-dim)]",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "h-full rounded bg-[var(--amber)]",
													style: { width: `${Math.min(100, p.cpu)}%` }
												})
											})]
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--text-sub)]",
											children: formatBytes(p.memMB * 1048576)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "text-[var(--text-sub)]",
											children: [p.memPct.toFixed(1), "%"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--text-sub)]",
											children: p.handles
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--text-sub)]",
											children: p.threads
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--text-sub)]",
											children: p.user
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--teal)]",
											children: p.status
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "pr-3 text-right",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative group inline-block",
												onClick: (e) => e.stopPropagation(),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													className: "rounded p-1 text-[var(--text-sub)] hover:bg-[var(--border-c)] hover:text-white transition-colors",
													title: "More Actions",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { size: 14 })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "absolute right-0 top-full mt-1 hidden w-36 flex-col overflow-hidden rounded border border-[var(--border-c)] bg-[var(--bg-card)] shadow-xl group-hover:flex z-50",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
															onClick: () => fetchDetails(p.pid),
															className: "flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)]",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { size: 14 }), " Details"]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-1 h-[1px] bg-[var(--border-dim)]" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
															onClick: () => setKillTarget([p.pid]),
															className: "flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--crit)] transition-colors hover:bg-[var(--crit)]/20",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { size: 14 }), " End Task"]
														})
													]
												})]
											})
										})
									]
								}, p.pid);
							})
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mono flex items-center justify-between border-t border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-2 text-[11px] text-[var(--text-sub)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Total Processes: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[var(--text)]",
							children: procs.length
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["System CPU: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[var(--amber)]",
							children: [sysCpu.toFixed(1), "%"]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["System Memory: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[var(--teal)]",
							children: [sysMem.toFixed(1), "%"]
						})] })
					]
				})
			]
		}),
		killTarget && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-md overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-b border-[var(--crit)]/30 bg-[var(--crit)]/10 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow text-[var(--crit)] flex items-center gap-2",
						children: "Confirm Task Termination"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setKillTarget(null),
						className: "text-[var(--text-sub)] hover:text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[13px] text-[var(--text)] mb-3",
							children: [
								"Are you sure you want to end ",
								killTarget.length,
								" selected process(es)?"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[12px] text-[var(--text-sub)] mb-5",
							children: "WARNING: Terminating a process can cause undesired results including loss of data and system instability. The process will not be given the chance to save its state or data before it is terminated."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-end gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setKillTarget(null),
								className: "rounded px-4 py-1.5 text-[12px] font-medium text-[var(--text-sub)] transition-colors hover:text-white",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: handleEndTask,
								className: "rounded bg-[var(--crit)] px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--crit-hover)]",
								children: "End Process"
							})]
						})
					]
				})]
			})
		}),
		detailsTarget && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-2xl overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow text-[var(--text)] flex items-center gap-2",
						children: "Process Details"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setDetailsTarget(null),
						className: "text-[var(--text-sub)] hover:text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-5 mono text-[12px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-[120px_1fr] gap-3 mb-4 items-baseline",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--text-sub)]",
								children: "Name"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--amber)] text-[14px]",
								children: detailsTarget.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--text-sub)]",
								children: "Process ID"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--text)]",
								children: detailsTarget.pid
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--text-sub)]",
								children: "Status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--teal)]",
								children: detailsTarget.status
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--text-sub)]",
								children: "Memory usage"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[var(--text)]",
								children: [
									formatBytes(detailsTarget.memMB * 1048576),
									" (",
									detailsTarget.memPct.toFixed(1),
									"%)"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--text-sub)]",
								children: "Path"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--text)] bg-[var(--bg-surface)] p-2 rounded break-all border border-[var(--border-c)]",
								children: isDetailsLoading ? "Loading..." : detailsTarget.executablePath || "N/A"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--text-sub)]",
								children: "Command Line"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--text)] bg-[var(--bg-surface)] p-2 rounded break-all border border-[var(--border-c)] max-h-32 overflow-y-auto",
								children: isDetailsLoading ? "Loading..." : detailsTarget.commandLine || "N/A"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-end gap-3 mt-6 border-t border-[var(--border-dim)] pt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setDetailsTarget(null),
							className: "rounded px-4 py-1.5 text-[12px] font-medium text-[var(--text-sub)] hover:text-white transition-colors border border-[var(--border-c)]",
							children: "Close"
						})
					})]
				})]
			})
		})
	] });
}
//#endregion
export { ProcessesPage as component };
