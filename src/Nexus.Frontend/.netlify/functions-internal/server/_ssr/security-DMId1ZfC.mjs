import { i as __toESM } from "../_runtime.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { t as NxCard } from "./NxCard-CBVxGsdQ.mjs";
import { a as XAxis, c as CartesianGrid, d as Tooltip, i as YAxis, l as Bar, n as BarChart, u as ResponsiveContainer } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/security-DMId1ZfC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SecurityPage() {
	const [server, setServer] = (0, import_react.useState)("dc01");
	const [data, setData] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const fetchData = async (refresh = false) => {
		setLoading(true);
		try {
			const res = await fetch(`/api/servers/${server}/security?refresh=${refresh}`);
			if (res.ok) setData(await res.json());
		} catch (err) {
			console.error(err);
		}
		setLoading(false);
	};
	(0, import_react.useEffect)(() => {
		fetchData(false);
	}, [server]);
	const score = data ? Math.max(0, 100 - data.failedLogins24h / 10 - data.openPorts.length / 2) : 100;
	const loginHist = (0, import_react.useMemo)(() => Array.from({ length: 24 }, (_, h) => ({
		hour: `${h}:00`,
		fails: data ? Math.floor(Math.random() * (data.failedLogins24h / 10)) : 0
	})), [data]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Security",
			title: "Security Center"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between mb-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
				value: server,
				onChange: setServer
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-4",
				children: [data && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-[12px] text-[var(--text-sub)]",
					children: ["Last updated: ", new Date(data.lastUpdated).toLocaleTimeString()]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => fetchData(true),
					disabled: loading,
					className: "mono rounded-md border border-[var(--amber)] bg-[var(--amber-low)] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--amber)] disabled:opacity-50",
					children: loading ? "Refreshing..." : "Refresh Data"
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-card mb-5 flex items-center gap-6 p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { value: score }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid flex-1 grid-cols-4 gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "Open Ports",
						value: data?.openPorts.length ?? 0,
						color: "var(--amber)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "Failed Logins (24h)",
						value: data?.failedLogins24h ?? 0,
						color: "var(--crit)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "Local Admins",
						value: data?.localAdmins.length ?? 0,
						color: "var(--warn)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "Events Stored",
						value: data?.events.length ?? 0,
						color: "var(--teal)"
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-2 gap-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NxCard, {
					eyebrow: "Recent Security Events",
					title: "Last 20 entries",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "max-h-[280px] overflow-y-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
							className: "w-full text-[12px]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
								className: "mono",
								children: data?.events.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-[var(--border-dim)]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-1.5 text-[var(--amber)]",
											children: e.eventId
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--text-sub)]",
											children: new Date(e.timeCreated).toLocaleTimeString()
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--text)]",
											children: e.level
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "truncate text-[var(--text-sub)]",
											children: e.message
										})
									]
								}, e.id))
							})
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NxCard, {
					eyebrow: "Failed Logins",
					title: "Last 24 hours",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: 240,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
							data: loginHist,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "var(--border-dim)",
									strokeDasharray: "2 4"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "hour",
									stroke: "var(--text-sub)",
									fontSize: 9
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									stroke: "var(--text-sub)",
									fontSize: 9
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
									background: "var(--bg-card)",
									border: "1px solid var(--border-c)",
									fontSize: 11
								} }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									dataKey: "fails",
									fill: "var(--crit)"
								})
							]
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NxCard, {
					eyebrow: "Open Ports",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
						className: "w-full text-[12px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "mono",
							children: data?.openPorts.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-[var(--border-dim)]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-1.5 text-[var(--amber)]",
										children: r.localPort
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "text-[var(--text-sub)]",
										children: r.protocol
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "text-[var(--text)]",
										children: r.processName
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "text-[var(--teal)]",
										children: r.state
									})
								]
							}, i))
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NxCard, {
					eyebrow: "Local Admins",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
						className: "w-full text-[12px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "mono",
							children: data?.localAdmins.map((u, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-[var(--border-dim)]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-1.5 text-[var(--text)]",
										children: u.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "text-[var(--text-sub)]",
										children: u.principalSource
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mono rounded-full px-2 py-0.5 text-[10px] " + (u.expected ? "bg-[var(--ok)]/15 text-[var(--ok)]" : "bg-[var(--crit)]/15 text-[var(--crit)]"),
										children: u.expected ? "Expected" : "Unexpected"
									}) })
								]
							}, i))
						})
					})
				})
			]
		})
	] });
}
function Mini({ label, value, color }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "eyebrow pb-1",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "display text-[26px] font-bold",
		style: { color },
		children: value
	})] });
}
function Gauge({ value }) {
	const r = 50, c = 2 * Math.PI * r;
	const off = c - value / 100 * c;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: 140,
		height: 140,
		viewBox: "0 0 140 140",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: 70,
				cy: 70,
				r,
				stroke: "var(--border-c)",
				strokeWidth: 9,
				fill: "none"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: 70,
				cy: 70,
				r,
				stroke: "var(--amber)",
				strokeWidth: 9,
				strokeLinecap: "round",
				fill: "none",
				strokeDasharray: c,
				strokeDashoffset: off,
				transform: "rotate(-90 70 70)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: 70,
				y: 75,
				textAnchor: "middle",
				fill: "var(--amber)",
				fontSize: "26",
				fontFamily: "var(--font-display)",
				fontWeight: 700,
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: 70,
				y: 92,
				textAnchor: "middle",
				fill: "var(--text-sub)",
				fontSize: "8",
				letterSpacing: "2",
				children: "SCORE"
			})
		]
	});
}
//#endregion
export { SecurityPage as component };
