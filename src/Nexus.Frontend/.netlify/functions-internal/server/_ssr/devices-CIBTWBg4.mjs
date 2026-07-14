import { i as __toESM } from "../_runtime.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { At as ChevronDown, f as TriangleAlert, kt as ChevronRight, pt as Cpu } from "../_libs/lucide-react.mjs";
import { r as getDevices } from "./mock-C8obigBb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/devices-CIBTWBg4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function DevicesPage() {
	const [server, setServer] = (0, import_react.useState)("nexus01");
	const [devices, setDevices] = (0, import_react.useState)([]);
	const [open, setOpen] = (0, import_react.useState)({});
	const [sel, setSel] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		getDevices(server).then(setDevices);
	}, [server]);
	const grouped = (0, import_react.useMemo)(() => {
		const m = {};
		devices.forEach((d) => {
			(m[d.category] ||= []).push(d);
		});
		return m;
	}, [devices]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Infrastructure",
			title: "Devices"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
			value: server,
			onChange: setServer
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-[1fr_360px] gap-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "nx-card p-3",
				children: Object.entries(grouped).map(([cat, list]) => {
					const isOpen = open[cat] ?? true;
					const hasIssue = list.some((d) => d.status !== "OK");
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setOpen({
							...open,
							[cat]: !isOpen
						}),
						className: "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-[var(--text)] hover:bg-[var(--bg-surface)]",
						children: [
							isOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 12 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 12 }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, {
								size: 12,
								className: "text-[var(--teal)]"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "display",
								children: cat
							}),
							hasIssue && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
								size: 11,
								className: "text-[var(--warn)]"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-auto mono text-[10px] text-[var(--text-sub)]",
								children: list.length
							})
						]
					}), isOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "ml-7 border-l border-[var(--border-c)] pl-3",
						children: list.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setSel(d),
							className: "mono flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px] " + (sel?.name === d.name ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)]"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: d.name
							}), d.status !== "OK" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
								size: 11,
								className: "ml-2 text-[var(--warn)]"
							})]
						}) }, d.name))
					})] }, cat);
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "nx-card h-fit p-5",
				children: sel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow pb-1",
						children: "Device"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "display text-[14px] font-semibold",
						children: sel.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mono mt-3 space-y-2 text-[11px]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								k: "Category",
								v: sel.category
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								k: "Manufacturer",
								v: sel.manufacturer
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								k: "Status",
								v: sel.status
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								k: "Driver Version",
								v: sel.driverVersion
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								k: "Driver Date",
								v: sel.driverDate
							})
						]
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-8 text-center text-[12px] text-[var(--text-sub)]",
					children: "Select a device"
				})
			})]
		})
	] });
}
function Field({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-[var(--text-sub)]",
		children: k
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "text-[var(--text)]",
		children: v
	})] });
}
//#endregion
export { DevicesPage as component };
