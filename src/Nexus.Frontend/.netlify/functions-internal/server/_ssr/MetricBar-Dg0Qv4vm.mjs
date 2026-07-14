import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/MetricBar-Dg0Qv4vm.js
var import_jsx_runtime = require_jsx_runtime();
function MetricBar({ label, value, unit = "%", critical, warning }) {
	const color = critical !== void 0 && value >= critical ? "var(--crit)" : warning !== void 0 && value >= warning ? "var(--warn)" : "var(--teal)";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-baseline justify-between pb-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "eyebrow",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "mono text-[12px] font-semibold",
			style: { color },
			children: [value.toFixed(0), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[var(--text-sub)]",
				children: unit
			})]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "metric-bar",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "metric-fill",
			style: {
				width: `${Math.min(100, value)}%`,
				background: color,
				boxShadow: `0 0 7px ${color}66`
			}
		})
	})] });
}
//#endregion
export { MetricBar as t };
