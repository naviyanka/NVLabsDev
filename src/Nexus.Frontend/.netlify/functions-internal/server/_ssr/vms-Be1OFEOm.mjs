import { i as __toESM } from "../_runtime.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { I as Play, Mt as Camera, R as Pause, W as Monitor, g as Square } from "../_libs/lucide-react.mjs";
import { t as StatusBadge } from "./StatusBadge-DvNl1BAE.mjs";
import { n as controlVM, s as getVMs } from "./mock-C8obigBb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/vms-Be1OFEOm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function VMsPage() {
	const [server, setServer] = (0, import_react.useState)("nexus01");
	const [vms, setVms] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		getVMs(server).then(setVms);
	}, [server]);
	async function act(id, a) {
		await controlVM(server, id, a);
		setVms((arr) => arr.map((v) => v.id === id ? {
			...v,
			status: a === "start" ? "Running" : a === "stop" ? "Stopped" : a === "pause" ? "Paused" : v.status
		} : v));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Infrastructure",
			title: "Virtual Machines",
			subtitle: "Hyper-V host: NEXUS01"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
			value: server,
			onChange: setServer
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-3 gap-3",
			children: vms.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "nx-card p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "display text-[15px] font-semibold",
							children: v.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mono pt-0.5 text-[10px] text-[var(--text-sub)]",
							children: v.os
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, {
							status: v.status === "Running" ? "online" : v.status === "Paused" ? "warning" : "offline",
							children: v.status
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mono mt-4 grid grid-cols-3 gap-2 text-[10px] text-[var(--text-sub)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "eyebrow pb-0.5",
								children: "CPU"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[var(--amber)]",
								children: [v.cpu, "%"]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "eyebrow pb-0.5",
								children: "Memory"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[var(--teal)]",
								children: [(v.memMB / 1024).toFixed(0), " GB"]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "eyebrow pb-0.5",
								children: "Uptime"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[var(--text)]",
								children: v.uptime
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								onClick: () => act(v.id, "start"),
								icon: Play,
								label: "Start"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								onClick: () => act(v.id, "stop"),
								icon: Square,
								label: "Stop"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								onClick: () => act(v.id, "pause"),
								icon: Pause,
								label: "Pause"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								onClick: () => act(v.id, "checkpoint"),
								icon: Camera,
								label: "Checkpoint"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
								onClick: () => {},
								icon: Monitor,
								label: "Connect"
							})
						]
					})
				]
			}, v.id))
		})
	] });
}
function Btn({ icon: Icon, label, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: "mono flex items-center gap-1 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-sub)] hover:border-[var(--amber)] hover:text-[var(--amber)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 11 }),
			" ",
			label
		]
	});
}
//#endregion
export { VMsPage as component };
