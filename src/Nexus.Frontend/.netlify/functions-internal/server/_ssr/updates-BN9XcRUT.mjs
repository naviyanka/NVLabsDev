import { i as __toESM } from "../_runtime.mjs";
import { B as installUpdatesClient, P as getUpdatesClient, n as checkUpdatesClient } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { A as RefreshCw, At as ChevronDown, Ot as ChevronUp, n as X, ut as Download, v as SquareCheckBig } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/updates-BN9XcRUT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmLabel = "Confirm", isCritical = false }) {
	if (!isOpen) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "eyebrow text-[var(--text)]",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onCancel,
					className: "text-[var(--text-sub)] hover:text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[13px] text-[var(--text)] mb-6",
					children: message
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-end gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onCancel,
						className: "rounded px-4 py-1.5 text-[12px] font-medium text-[var(--text-sub)] hover:text-white",
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onConfirm,
						className: `rounded px-4 py-1.5 text-[12px] font-semibold text-black transition-colors ${isCritical ? "bg-[var(--crit)] hover:bg-[var(--crit)]/80 text-white" : "bg-[var(--amber)] hover:bg-[var(--amber-hover)]"}`,
						children: confirmLabel
					})]
				})]
			})]
		})
	});
}
function UpdatesPage() {
	const [server, setServer] = (0, import_react.useState)("dc");
	const [updates, setUpdates] = (0, import_react.useState)([]);
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	const [selected, setSelected] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [auto, setAuto] = (0, import_react.useState)(true);
	const [sortCol, setSortCol] = (0, import_react.useState)("title");
	const [sortAsc, setSortAsc] = (0, import_react.useState)(true);
	const [confirmState, setConfirmState] = (0, import_react.useState)({
		isOpen: false,
		title: "",
		message: "",
		action: async () => {}
	});
	const fetchCachedUpdates = async (showLoading = true) => {
		if (showLoading) setIsLoading(true);
		try {
			setUpdates(await getUpdatesClient(server));
		} catch (e) {
			console.error(e);
		} finally {
			if (showLoading) setIsLoading(false);
		}
	};
	const handleCheckUpdates = async () => {
		setIsLoading(true);
		try {
			setUpdates(await checkUpdatesClient(server));
			setSelected(/* @__PURE__ */ new Set());
		} catch (e) {
			alert("Failed to check for updates");
		} finally {
			setIsLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		fetchCachedUpdates(true);
		setSelected(/* @__PURE__ */ new Set());
	}, [server]);
	(0, import_react.useEffect)(() => {
		let id;
		if (auto && !isLoading) id = window.setInterval(() => fetchCachedUpdates(false), 5e3);
		return () => {
			if (id) window.clearInterval(id);
		};
	}, [
		server,
		auto,
		isLoading
	]);
	const executeInstall = async (titles) => {
		setConfirmState((p) => ({
			...p,
			isOpen: false
		}));
		setIsLoading(true);
		try {
			if (await installUpdatesClient(server, titles)) {
				setUpdates(updates.filter((u) => !titles.includes(u.title)));
				setSelected(/* @__PURE__ */ new Set());
			} else alert("Failed to start installation.");
		} catch (e) {
			alert("An error occurred starting the installation.");
		} finally {
			setIsLoading(false);
		}
	};
	const handleInstallSelected = () => {
		if (selected.size === 0) return;
		setConfirmState({
			isOpen: true,
			title: "Confirm Installation",
			message: `Are you sure you want to install ${selected.size} updates on ${server.toUpperCase()}? This will run silently in the background.`,
			action: () => executeInstall(Array.from(selected))
		});
	};
	const handleInstallAll = () => {
		if (updates.length === 0) return;
		setConfirmState({
			isOpen: true,
			title: "Confirm Installation",
			message: `Are you sure you want to install all ${updates.length} updates on ${server.toUpperCase()}? This will run silently in the background.`,
			action: () => executeInstall(updates.map((u) => u.title))
		});
	};
	const toggleSelect = (title, e) => {
		if (e) e.stopPropagation();
		const newSel = new Set(selected);
		if (newSel.has(title)) newSel.delete(title);
		else newSel.add(title);
		setSelected(newSel);
	};
	const toggleAll = () => {
		if (selected.size === updates.length) setSelected(/* @__PURE__ */ new Set());
		else setSelected(new Set(updates.map((u) => u.title)));
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
	const sortedUpdates = (0, import_react.useMemo)(() => {
		let res = [...updates];
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
		updates,
		sortCol,
		sortAsc
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Windows Updates",
			description: "Check and install missing software updates across the fleet.",
			icon: Download
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex items-center justify-between rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] p-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
				value: server,
				onChange: setServer
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mono flex items-center gap-1.5 text-[11px] text-[var(--text-sub)] cursor-pointer hover:text-white transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: auto,
						onChange: (e) => setAuto(e.target.checked),
						className: "accent-[var(--amber)]"
					}), "Auto-refresh 5s"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: handleCheckUpdates,
					disabled: isLoading,
					className: "flex items-center gap-2 rounded bg-[var(--bg-card)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] border border-[var(--border-dim)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors disabled:opacity-50",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
						size: 14,
						className: isLoading ? "animate-spin text-[var(--amber)]" : ""
					}), "Check for Updates"]
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-[12px] text-[var(--text-sub)]",
				children: [updates.length, " available updates"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: handleInstallSelected,
					disabled: selected.size === 0 || isLoading,
					className: "rounded bg-[var(--bg-surface)] border border-[var(--border-dim)] px-3 py-1.5 text-[12px] font-medium transition-colors hover:border-[var(--amber)] hover:text-[var(--amber)] disabled:opacity-50 disabled:hover:border-[var(--border-dim)] disabled:hover:text-white",
					children: [
						"Install Selected (",
						selected.size,
						")"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: handleInstallAll,
					disabled: updates.length === 0 || isLoading,
					className: "rounded bg-[var(--amber)] px-4 py-1.5 text-[12px] font-bold text-black transition-colors hover:bg-[var(--amber-hover)] disabled:opacity-50 disabled:bg-[var(--bg-surface)] disabled:text-[var(--text-sub)]",
					children: "Install All"
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] overflow-hidden",
			children: isLoading && updates.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-12 text-center flex flex-col items-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
						size: 24,
						className: "animate-spin text-[var(--amber)] mb-4"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[14px] font-medium text-[var(--text)]",
						children: "Checking for updates..."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[12px] text-[var(--text-sub)] mt-1",
						children: "This usually takes 20-30 seconds."
					})
				]
			}) : updates.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-12 text-center flex flex-col items-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquareCheckBig, {
						size: 32,
						className: "text-[var(--teal)] mb-3"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[14px] font-medium text-[var(--text)]",
						children: "Up to date"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-[12px] text-[var(--text-sub)] mt-1 max-w-md",
						children: [
							"No pending updates found for ",
							server,
							"."
						]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-left text-[12px] select-none",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "border-b border-[var(--border-dim)] bg-[var(--bg-card)] text-[11px] uppercase tracking-wider text-[var(--text-sub)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 w-8",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: selected.size === updates.length && updates.length > 0,
									onChange: toggleAll,
									className: "accent-[var(--amber)]"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
								className: "px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors",
								onClick: () => handleSort("title"),
								title: "Sort by Title",
								children: ["Title ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "title" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Description"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
								className: "px-4 py-3 font-medium cursor-pointer hover:text-[var(--text)] transition-colors",
								onClick: () => handleSort("maxDownloadSize"),
								title: "Sort by Size",
								children: ["Size ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { col: "maxDownloadSize" })]
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "divide-y divide-[var(--border-dim)]",
						children: sortedUpdates.map((u) => {
							const isSelected = selected.has(u.title);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								onClick: () => toggleSelect(u.title),
								className: `group cursor-pointer transition-colors ${isSelected ? "bg-[var(--amber-low)]/40" : "hover:bg-[var(--amber-low)]/15"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: `px-4 py-3 border-l-2 ${isSelected ? "border-[var(--amber)]" : "border-transparent"}`,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: isSelected,
											onChange: (e) => toggleSelect(u.title, e),
											onClick: (e) => e.stopPropagation(),
											className: "accent-[var(--amber)] pointer-events-none"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: `px-4 py-3 font-medium ${isSelected ? "text-[var(--amber)]" : "text-[var(--text)]"}`,
										children: u.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3 text-[11px] text-[var(--text-sub)] max-w-md truncate",
										title: u.description,
										children: u.description
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-4 py-3 text-[11px] mono text-[var(--text-sub)]",
										children: [(u.maxDownloadSize / 1024 / 1024).toFixed(1), " MB"]
									})
								]
							}, u.title);
						})
					})]
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmDialog, {
			isOpen: confirmState.isOpen,
			title: confirmState.title,
			message: confirmState.message,
			onConfirm: confirmState.action,
			onCancel: () => setConfirmState((p) => ({
				...p,
				isOpen: false
			})),
			confirmLabel: "Install Updates"
		})
	] });
}
//#endregion
export { UpdatesPage as component };
