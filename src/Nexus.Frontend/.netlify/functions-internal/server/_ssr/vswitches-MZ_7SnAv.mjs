import { i as __toESM } from "../_runtime.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { c as getVirtualSwitches } from "./mock-C8obigBb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/vswitches-MZ_7SnAv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var COLOR = {
	External: "var(--amber)",
	Internal: "var(--teal)",
	Private: "var(--text-sub)"
};
function VSwitchesPage() {
	const [server, setServer] = (0, import_react.useState)("nexus01");
	const [list, setList] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		getVirtualSwitches(server).then(setList);
	}, [server]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Infrastructure",
			title: "Virtual Switches"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
			value: server,
			onChange: setServer
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-3 gap-3",
			children: list.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "nx-card p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mono inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em]",
						style: {
							color: COLOR[s.type],
							borderColor: COLOR[s.type] + "55",
							background: COLOR[s.type] + "15"
						},
						children: s.type
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "display pt-2 text-[15px] font-semibold",
						children: s.name
					}),
					s.adapter && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mono pt-0.5 text-[10px] text-[var(--text-sub)]",
						children: ["via ", s.adapter]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "eyebrow pb-1",
							children: [
								"Connected VMs (",
								s.vms.length,
								")"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mono space-y-0.5 text-[11px] text-[var(--text-sub)]",
							children: s.vms.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["· ", v] }, v))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "mono rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub)] hover:border-[var(--amber)] hover:text-[var(--amber)]",
							children: "Rename"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "mono rounded-md border border-[var(--crit)]/40 bg-[var(--crit)]/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--crit)]",
							children: "Delete"
						})]
					})
				]
			}, s.id))
		})
	] });
}
//#endregion
export { VSwitchesPage as component };
