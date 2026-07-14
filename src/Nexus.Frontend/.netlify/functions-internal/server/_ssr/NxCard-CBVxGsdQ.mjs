import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/NxCard-CBVxGsdQ.js
var import_jsx_runtime = require_jsx_runtime();
function NxCard({ eyebrow, title, right, children, className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "nx-card p-5 " + className,
		children: [(eyebrow || title || right) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-start justify-between gap-3 pb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [eyebrow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "eyebrow pb-1",
				children: eyebrow
			}), title && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "display text-[15px] font-semibold text-[var(--text)]",
				children: title
			})] }), right && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "shrink-0",
				children: right
			})]
		}), children]
	});
}
//#endregion
export { NxCard as t };
