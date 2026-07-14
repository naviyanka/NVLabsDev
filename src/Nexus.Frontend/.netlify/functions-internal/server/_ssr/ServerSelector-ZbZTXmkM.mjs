import { i as __toESM } from "../_runtime.mjs";
import { j as getServersClient } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ServerSelector-ZbZTXmkM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ServerSelector({ value, onChange }) {
	const [servers, setServers] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		getServersClient().then(setServers);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!value && servers.length > 0) onChange(servers[0].ip);
	}, [
		servers,
		value,
		onChange
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center gap-1.5 pb-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "eyebrow pr-2",
			children: "Server"
		}), servers.map((s) => {
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => onChange(s.ip),
				className: ["mono flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors", s.ip === value || s.id === value ? "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)]" : "border-[var(--border-c)] bg-[var(--bg-card)] text-[var(--text-sub)] hover:border-[var(--amber)]/40 hover:text-[var(--text)]"].join(" "),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "h-1.5 w-1.5 rounded-full",
					style: { background: s.status === "online" ? "var(--ok)" : s.status === "warning" ? "var(--warn)" : s.status === "critical" ? "var(--crit)" : "var(--text-sub)" }
				}), s.name]
			}, s.id);
		})]
	});
}
//#endregion
export { ServerSelector as t };
