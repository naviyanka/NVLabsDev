import { i as __toESM } from "../_runtime.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { a as getFirewallRules, l as toggleFirewallRule } from "./mock-C8obigBb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/firewall-B5aHWQz_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function FirewallPage() {
	const [server, setServer] = (0, import_react.useState)("web01");
	const [rules, setRules] = (0, import_react.useState)([]);
	const [tab, setTab] = (0, import_react.useState)("Inbound");
	(0, import_react.useEffect)(() => {
		getFirewallRules(server).then(setRules);
	}, [server]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Security",
			title: "Windows Defender Firewall"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
			value: server,
			onChange: setServer
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-5 grid grid-cols-3 gap-3",
			children: [
				"Domain",
				"Private",
				"Public"
			].map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "nx-card p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "eyebrow pb-1",
						children: [p, " profile"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "display text-[16px] font-semibold text-[var(--ok)]",
						children: "On"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "mono rounded-full bg-[var(--ok)] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-[#0a0a0a]",
						children: "Enabled"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mono mt-3 text-[10px] text-[var(--text-sub)]",
					children: "Inbound: Block (default) · Outbound: Allow"
				})]
			}, p))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-3 inline-flex rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] p-1",
			children: [
				"Inbound",
				"Outbound",
				"Security"
			].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => setTab(t),
				className: "mono rounded px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] " + (tab === t ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)]"),
				children: t
			}, t))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "nx-card overflow-hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full text-[12px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "eyebrow border-b border-[var(--border-c)] text-left",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2",
							children: "Enabled"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Name" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Profile" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Protocol" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Local Port" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Remote IP" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Action" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Direction" })
					]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
					className: "mono",
					children: rules.filter((r) => tab === "Security" ? false : r.direction === tab).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-[var(--border-dim)] " + (r.action === "Allow" ? "bg-[var(--ok)]/[0.03]" : "bg-[var(--crit)]/[0.04]"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-1.5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									defaultChecked: r.enabled,
									onChange: (e) => toggleFirewallRule(server, r.id, e.target.checked),
									className: "accent-[var(--amber)]"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "text-[var(--text)]",
								children: r.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "text-[var(--text-sub)]",
								children: r.profile
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "text-[var(--text-sub)]",
								children: r.protocol
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "text-[var(--amber)]",
								children: r.localPort
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "text-[var(--text-sub)]",
								children: r.remoteIp
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								style: { color: r.action === "Allow" ? "var(--ok)" : "var(--crit)" },
								children: r.action
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "text-[var(--text-sub)]",
								children: r.direction
							})
						]
					}, r.id))
				})]
			})
		})
	] });
}
//#endregion
export { FirewallPage as component };
