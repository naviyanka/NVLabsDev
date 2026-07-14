import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/PageWrapper-Dvl567y7.js
var import_jsx_runtime = require_jsx_runtime();
function PageHeader({ eyebrow, title, subtitle, right }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start justify-between gap-4 pb-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			eyebrow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "eyebrow pb-1.5",
				children: eyebrow
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "display text-[26px] font-bold text-[var(--text)]",
				children: title
			}),
			subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pt-1 text-[13px] text-[var(--text-sub)]",
				children: subtitle
			})
		] }), right && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex shrink-0 items-center gap-2",
			children: right
		})]
	});
}
function PageWrapper({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "px-7 py-6",
		children
	});
}
//#endregion
export { PageWrapper as n, PageHeader as t };
