import { i as __toESM } from "../_runtime.mjs";
import { I as getVolumesClient, _ as getDisksClient } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { At as ChevronDown, Ot as ChevronUp, at as FolderOpen, lt as Ellipsis } from "../_libs/lucide-react.mjs";
import { t as StatusBadge } from "./StatusBadge-DvNl1BAE.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/storage-BVjToe-M.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PART_COLOR = {
	System: "var(--teal)",
	Data: "var(--amber)",
	Recovery: "var(--text-sub)",
	Unallocated: "var(--text-ghost)"
};
function StoragePage() {
	const [server, setServer] = (0, import_react.useState)("dc");
	const [disks, setDisks] = (0, import_react.useState)([]);
	const [volumes, setVolumes] = (0, import_react.useState)([]);
	const [auto, setAuto] = (0, import_react.useState)(true);
	const [sortCol, setSortCol] = (0, import_react.useState)("letter");
	const [sortAsc, setSortAsc] = (0, import_react.useState)(true);
	const navigate = useNavigate();
	const loadData = () => {
		getDisksClient(server).then(setDisks);
		getVolumesClient(server).then(setVolumes);
	};
	(0, import_react.useEffect)(() => {
		let id;
		loadData();
		if (auto) id = window.setInterval(loadData, 5e3);
		return () => {
			if (id) window.clearInterval(id);
		};
	}, [server, auto]);
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
	const sortedVolumes = (0, import_react.useMemo)(() => {
		let res = [...volumes];
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
		volumes,
		sortCol,
		sortAsc
	]);
	const totalRaw = disks.reduce((s, d) => s + d.sizeGB, 0);
	const totalUsed = volumes.reduce((s, v) => s + v.usedGB, 0);
	const totalSize = volumes.reduce((s, v) => s + v.sizeGB, 0);
	const formatSize = (gb) => {
		if (gb < 1e3) return `${Math.round(gb)} GB`;
		return `${(gb / 1024).toFixed(1)} TB`;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Management",
			title: "Storage",
			subtitle: `${disks.length} disks, ${volumes.length} volumes on ${server.toUpperCase()}`
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
			value: server,
			onChange: setServer
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-4 gap-3 pb-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Total raw",
					value: formatSize(totalRaw)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Used",
					value: formatSize(totalUsed),
					color: "var(--amber)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Free",
					value: formatSize(totalSize - totalUsed),
					color: "#10b981"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Disks · Volumes",
					value: `${disks.length} · ${volumes.length}`
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-card mb-5 p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "eyebrow",
					children: "Physical Disks Map"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-4 text-[11px] mono text-[var(--text-sub)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-2.5 h-2.5 rounded-sm bg-[var(--teal)]" }), " System"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-2.5 h-2.5 rounded-sm bg-[var(--amber)]" }), " Data"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-2.5 h-2.5 rounded-sm bg-[var(--text-sub)]" }), " Recovery"]
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-5",
				children: disks.map((d) => {
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mono flex items-baseline justify-between pb-1.5 text-[11px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--text)] font-semibold",
								children: d.id
							}),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[var(--text-sub)]",
								children: [
									"· ",
									d.model,
									" · ",
									d.bus
								]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[var(--text-sub)]",
							children: [
								d.sizeGB,
								" GB · ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, {
									status: d.health === "Healthy" ? "Healthy" : "warning",
									label: d.health
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-8 w-full overflow-hidden rounded border border-[var(--border-dim)] bg-[var(--bg-surface)] relative flex group",
						children: d.partitions.map((p, i) => {
							const pPct = p.sizeGB / d.sizeGB * 100;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									width: `${pPct}%`,
									backgroundColor: PART_COLOR[p.type] || PART_COLOR.Unallocated
								},
								className: "h-full border-r border-[var(--bg-card)] flex items-center justify-center text-[10px] text-black font-semibold truncate px-1 transition-opacity hover:opacity-80 cursor-default",
								title: `${p.label} (${p.type}) - ${p.sizeGB} GB`,
								children: pPct > 5 ? p.label : ""
							}, `${p.label}-${i}`);
						})
					})] }, d.id);
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-card overflow-hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-c)] p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "eyebrow px-2",
					children: "Mounted Volumes"
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
				className: "overflow-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-[12px] select-none",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "eyebrow border-b border-[var(--border-c)] text-left text-[var(--text-sub)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
								className: "px-4 py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors",
								onClick: () => handleSort("letter"),
								title: "Sort by Letter",
								children: ["Letter ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "letter" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
								className: "py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors",
								onClick: () => handleSort("label"),
								title: "Sort by Label",
								children: ["Label ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "label" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
								className: "py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors",
								onClick: () => handleSort("fs"),
								title: "Sort by File System",
								children: ["FS ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "fs" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
								className: "py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors",
								onClick: () => handleSort("sizeGB"),
								title: "Sort by Total Size",
								children: ["Size ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "sizeGB" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
								className: "py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors",
								onClick: () => handleSort("usedGB"),
								title: "Sort by Used Space",
								children: ["Used ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "usedGB" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2.5",
								children: "Free"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2.5",
								children: "Usage"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
								className: "py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors",
								onClick: () => handleSort("status"),
								title: "Sort by Status",
								children: ["Status ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "status" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
								className: "py-2.5 cursor-pointer hover:text-[var(--text)] transition-colors",
								onClick: () => handleSort("diskId"),
								title: "Sort by Disk",
								children: ["Disk ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "diskId" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "py-2.5 w-10" })
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "mono",
						children: sortedVolumes.map((v) => {
							const pct = v.sizeGB > 0 ? v.usedGB / v.sizeGB * 100 : 0;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-[var(--border-dim)] transition-colors hover:bg-[var(--amber-low)]/10",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-4 py-3 text-[var(--amber)] font-medium border-l-2 border-transparent transition-colors hover:border-[var(--amber)]",
										children: [v.letter, ":"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "text-[var(--text)]",
										children: v.label
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "text-[var(--text-sub)]",
										children: v.fs
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "text-[var(--text-sub)]",
										children: [v.sizeGB, " GB"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "text-[var(--text-sub)]",
										children: [v.usedGB, " GB"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "text-[var(--teal)]",
										children: [Math.round(v.sizeGB - v.usedGB), " GB"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 pr-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-1.5 w-24 rounded bg-[var(--border-dim)] overflow-hidden",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-full rounded",
												style: {
													width: `${pct}%`,
													background: pct > 85 ? "var(--crit)" : pct > 70 ? "var(--warn)" : "#10b981"
												}
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-[var(--text-sub)] text-[10px] w-8 text-right",
											children: [Math.round(pct), "%"]
										})]
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, {
										status: v.status === "Healthy" ? "Healthy" : "warning",
										label: v.status
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "text-[var(--text-sub)]",
										children: v.diskId
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
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "absolute right-0 top-full mt-1 hidden w-36 flex-col overflow-hidden rounded border border-[var(--border-c)] bg-[var(--bg-card)] shadow-xl group-hover:flex z-50",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													onClick: () => navigate({
														to: "/files",
														search: { path: `${v.letter}:\\` }
													}),
													className: "flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)]",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { size: 14 }), " Browse Files"]
												})
											})]
										})
									})
								]
							}, v.letter);
						})
					})]
				})
			})]
		})
	] });
}
function Stat({ label, value, color = "var(--text)" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "nx-card p-4 transition-colors hover:border-[var(--border-c)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "eyebrow pb-1",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "display text-[22px] font-bold",
			style: { color },
			children: value
		})]
	});
}
//#endregion
export { StoragePage as component };
