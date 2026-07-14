import { i as __toESM } from "../_runtime.mjs";
import { E as getPerformanceHistoryClient, O as getProcessesClient } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { Wt as ArrowDown, zt as ArrowUp } from "../_libs/lucide-react.mjs";
import { t as NxCard } from "./NxCard-CBVxGsdQ.mjs";
import { a as XAxis, c as CartesianGrid, d as Tooltip, i as YAxis, l as Bar, n as BarChart, o as Area, r as LineChart, s as Line, t as AreaChart, u as ResponsiveContainer } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/performance-DLQK6_Je.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Performance() {
	const [server, setServer] = (0, import_react.useState)("");
	const [data, setData] = (0, import_react.useState)([]);
	const [procs, setProcs] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		let id;
		let mounted = true;
		async function tick() {
			if (!server) return;
			const [d, p] = await Promise.all([getPerformanceHistoryClient(server), getProcessesClient(server)]);
			if (!mounted) return;
			if (d) setData(d);
			if (p) setProcs(p);
		}
		setData([]);
		setProcs([]);
		tick();
		id = window.setInterval(tick, 3e3);
		return () => {
			mounted = false;
			if (id) window.clearInterval(id);
		};
	}, [server]);
	const last = data.at(-1);
	const avg = (k) => data.length ? Math.round(data.reduce((s, d) => s + d[k], 0) / data.length) : 0;
	const max = (k) => data.length ? Math.round(Math.max(...data.map((d) => d[k]))) : 0;
	const min = (k) => data.length ? Math.round(Math.min(...data.map((d) => d[k]))) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Telemetry",
			title: "Performance Monitor",
			subtitle: "Real-time metric streams refreshing every 3 seconds"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
			value: server,
			onChange: setServer
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-1 gap-4 xl:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
					label: "CPU Usage",
					value: last ? Math.round(last.cpu) : 0,
					unit: "%",
					trend: last && data.at(-2) ? last.cpu - data.at(-2).cpu : 0,
					stats: {
						min: min("cpu"),
						max: max("cpu"),
						avg: avg("cpu")
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: 200,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
							data,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "var(--border-dim)",
									strokeDasharray: "2 4"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "t",
									hide: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									hide: true,
									domain: [0, 100]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
									background: "var(--bg-card)",
									border: "1px solid var(--border-c)",
									fontSize: 11
								} }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "cpu",
									stroke: "var(--amber)",
									strokeWidth: 2,
									dot: false
								})
							]
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
					label: "Memory Usage",
					value: last ? Math.round(last.mem) : 0,
					unit: "%",
					trend: last && data.at(-2) ? last.mem - data.at(-2).mem : 0,
					stats: {
						min: min("mem"),
						max: max("mem"),
						avg: avg("mem")
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: 200,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
							data,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
									id: "memg",
									x1: "0",
									y1: "0",
									x2: "0",
									y2: "1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
										offset: "0%",
										stopColor: "var(--teal)",
										stopOpacity: .6
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
										offset: "100%",
										stopColor: "var(--teal)",
										stopOpacity: 0
									})]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "var(--border-dim)",
									strokeDasharray: "2 4"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "t",
									hide: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									hide: true,
									domain: [0, 100]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
									background: "var(--bg-card)",
									border: "1px solid var(--border-c)",
									fontSize: 11
								} }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
									type: "monotone",
									dataKey: "mem",
									stroke: "var(--teal)",
									fill: "url(#memg)",
									strokeWidth: 2
								})
							]
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
					label: "Disk I/O",
					value: last ? Math.round(last.diskR + last.diskW) : 0,
					unit: " MB/s",
					stats: {
						min: 0,
						max: max("diskR") + max("diskW"),
						avg: avg("diskR") + avg("diskW")
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: 200,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
							data,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "var(--border-dim)",
									strokeDasharray: "2 4"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "t",
									hide: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { hide: true }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
									background: "var(--bg-card)",
									border: "1px solid var(--border-c)",
									fontSize: 11
								} }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									dataKey: "diskR",
									fill: "var(--ok)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
									dataKey: "diskW",
									fill: "var(--crit)"
								})
							]
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartCard, {
					label: "Network Throughput",
					value: last ? Math.round(last.netIn + last.netOut) : 0,
					unit: " Mb/s",
					stats: {
						min: 0,
						max: max("netIn") + max("netOut"),
						avg: avg("netIn") + avg("netOut")
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: 200,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
							data,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "var(--border-dim)",
									strokeDasharray: "2 4"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "t",
									hide: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { hide: true }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
									background: "var(--bg-card)",
									border: "1px solid var(--border-c)",
									fontSize: 11
								} }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "netIn",
									stroke: "var(--teal)",
									strokeWidth: 2,
									dot: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "netOut",
									stroke: "var(--amber)",
									strokeWidth: 2,
									dot: false
								})
							]
						})
					})
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NxCard, {
				eyebrow: "Top Processes",
				title: "By CPU (live)",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-[12px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "eyebrow border-b border-[var(--border-c)] text-left",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2",
								children: "Name"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2",
								children: "PID"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2",
								children: "CPU%"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2",
								children: "Memory"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2",
								children: "Status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "pb-2",
								children: "User"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "mono",
						children: procs.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-[var(--border-dim)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2 text-[var(--text)]",
									children: p.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "text-[var(--text-sub)]",
									children: p.pid
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "text-[var(--amber)]",
									children: [p.cpu, "%"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "text-[var(--text-sub)]",
									children: [p.memMB, " MB"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "text-[var(--teal)]",
									children: p.status
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "text-[var(--text-sub)]",
									children: p.user
								})
							]
						}, p.pid))
					})]
				})
			})
		})
	] });
}
function ChartCard({ label, value, unit, trend = 0, stats, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "nx-card p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-end justify-between pb-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "eyebrow pb-1",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "display flex items-baseline gap-2 text-[26px] font-bold text-[var(--text)]",
					children: [
						value,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[12px] font-normal text-[var(--text-sub)]",
							children: unit
						}),
						trend !== 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mono flex items-center text-[11px]",
							style: { color: trend > 0 ? "var(--crit)" : "var(--ok)" },
							children: [
								trend > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { size: 12 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, { size: 12 }),
								" ",
								Math.abs(Math.round(trend))
							]
						})
					]
				})] })
			}),
			children,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mono mt-3 flex justify-end gap-4 text-[10px] text-[var(--text-sub)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["MIN ", stats.min] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["AVG ", stats.avg] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["MAX ", stats.max] })
				]
			})
		]
	});
}
//#endregion
export { Performance as component };
