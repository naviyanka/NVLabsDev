import { i as __toESM } from "../_runtime.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { Ht as ArrowRight, Ut as ArrowLeftRight } from "../_libs/lucide-react.mjs";
import { t as StatusBadge } from "./StatusBadge-DvNl1BAE.mjs";
import { o as getReplicaPartnerships } from "./mock-C8obigBb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/storage-replica-85zhY5bC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SRPage() {
	const [list, setList] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		getReplicaPartnerships().then(setList);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		eyebrow: "Infrastructure",
		title: "Storage Replica",
		subtitle: "Synchronous & asynchronous volume replication"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-1 gap-4",
		children: list.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-card p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mono text-[12px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[var(--amber)]",
									children: p.sourceServer
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[var(--text-sub)]",
									children: p.sourceVol
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
								className: "text-[var(--text-sub)]",
								size: 16
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mono text-[12px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[var(--teal)]",
									children: p.destServer
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[var(--text-sub)]",
									children: p.destVol
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, {
						status: p.status,
						children: p.status
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid grid-cols-4 gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
							label: "Mode",
							value: p.mode
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
							label: "Last Sync",
							value: new Date(p.lastSync).toLocaleString()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
							label: "Synced",
							value: `${(p.bytes / 1e9).toFixed(2)} GB`,
							color: "var(--teal)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
							label: "Progress",
							value: `${p.progress}%`,
							color: "var(--amber)"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 h-1.5 overflow-hidden rounded bg-[var(--border-dim)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full",
						style: {
							width: `${p.progress}%`,
							background: p.status === "Error" ? "var(--crit)" : "var(--teal)",
							boxShadow: "0 0 7px var(--teal)"
						}
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:border-[var(--amber)] hover:text-[var(--amber)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeftRight, { size: 11 }), "Swap Direction"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "mono rounded-md border border-[var(--crit)]/40 bg-[var(--crit)]/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--crit)]",
						children: "Failover"
					})]
				})
			]
		}, p.id))
	})] });
}
function Cell({ label, value, color = "var(--text)" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "eyebrow pb-0.5",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mono text-[12px]",
		style: { color },
		children: value
	})] });
}
//#endregion
export { SRPage as component };
