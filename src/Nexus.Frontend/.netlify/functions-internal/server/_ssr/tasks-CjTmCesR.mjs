import { i as __toESM } from "../_runtime.mjs";
import { K as runTaskClient, N as getTasksClient } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { I as Play } from "../_libs/lucide-react.mjs";
import { t as StatusBadge } from "./StatusBadge-DvNl1BAE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tasks-CjTmCesR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function TasksPage() {
	const [server, setServer] = (0, import_react.useState)("dc");
	const [tasks, setTasks] = (0, import_react.useState)([]);
	const [sel, setSel] = (0, import_react.useState)(null);
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	const [isActivating, setIsActivating] = (0, import_react.useState)(false);
	const fetchTasks = async () => {
		setIsLoading(true);
		try {
			const data = await getTasksClient(server);
			setTasks(data);
			if (sel) setSel(data.find((t) => t.name === sel.name && t.path === sel.path) || null);
		} finally {
			setIsLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		fetchTasks();
	}, [server]);
	const handleRunTask = async () => {
		if (!sel) return;
		setIsActivating(true);
		try {
			if (await runTaskClient(server, sel.path.endsWith("\\") ? sel.path + sel.name : sel.path + "\\" + sel.name)) await fetchTasks();
			else alert("Failed to start task.");
		} finally {
			setIsActivating(false);
		}
	};
	const getLibraryFolders = () => {
		const folders = /* @__PURE__ */ new Set();
		tasks.forEach((t) => {
			folders.add(t.path);
			let p = t.path;
			while (p.lastIndexOf("\\") > 0) {
				p = p.substring(0, p.lastIndexOf("\\"));
				folders.add(p);
			}
		});
		return Array.from(folders).sort();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Management",
			title: "Scheduled Tasks"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
			value: server,
			onChange: setServer
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-[260px_1fr_320px] gap-5 pt-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "nx-card h-fit p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow px-1 pb-2",
						children: "Library"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "max-h-[600px] overflow-y-auto",
						children: isLoading && tasks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] text-[var(--text-sub)] px-2 py-2",
							children: "Loading library..."
						}) : getLibraryFolders().map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							title: f,
							className: "mono flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] text-[var(--text-sub)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate pr-2",
								children: f
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] shrink-0 text-[var(--text-ghost)]",
								children: tasks.filter((t) => t.path === f || t.path.startsWith(f + "\\")).length
							})]
						}, f))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "nx-card overflow-hidden flex flex-col h-[700px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-auto flex-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full text-[12px]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "sticky top-0 bg-[var(--bg-card)] shadow-sm z-10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "eyebrow border-b border-[var(--border-c)] text-left",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "px-3 py-2",
											children: "Name"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Last Run" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Result" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Next Run" })
									]
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
								className: "mono",
								children: isLoading && tasks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 5,
									className: "py-4 text-center text-[var(--text-sub)]",
									children: "Loading tasks..."
								}) }) : tasks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 5,
									className: "py-4 text-center text-[var(--text-sub)]",
									children: "No tasks found"
								}) }) : tasks.filter((t) => t.name).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									onClick: () => setSel(t),
									className: "cursor-pointer border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] " + (sel?.name === t.name && sel?.path === t.path ? "bg-[var(--amber-low)]" : ""),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-3 py-2 text-[var(--text)] truncate max-w-[200px]",
											title: t.name,
											children: t.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, {
											status: t.status === "Running" ? "Syncing" : t.status,
											children: t.status
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--text-sub)] whitespace-nowrap",
											children: t.lastRun
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--text-sub)]",
											children: t.lastResult
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--text-sub)] whitespace-nowrap",
											children: t.nextRun
										})
									]
								}, `${t.path}-${t.name}`))
							})]
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					className: "nx-card h-fit p-5 sticky top-4",
					children: sel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "eyebrow pb-1",
							children: "Task"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "display text-[15px] font-semibold break-words",
							children: sel.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mono pt-0.5 text-[10px] text-[var(--text-sub)] break-words",
							children: sel.path
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "my-4 flex gap-1.5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: handleRunTask,
								disabled: isActivating,
								className: `mono flex items-center gap-1.5 rounded-md border border-[var(--amber)] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors ${isActivating ? "opacity-50 cursor-not-allowed bg-[var(--amber-low)] text-[var(--amber)]" : "bg-[var(--bg-surface)] text-[var(--amber)] hover:bg-[var(--amber-low)]"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { size: 11 }),
									" ",
									isActivating ? "Starting..." : "Run Now"
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "eyebrow pb-1 pt-2",
							children: "Triggers"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mono text-[11px] text-[var(--text-sub)] max-h-[150px] overflow-y-auto",
							children: sel.triggers.length ? sel.triggers.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "py-0.5",
								children: ["· ", t]
							}, i)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "None" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "eyebrow pb-1 pt-4",
							children: "Status"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mono text-[11px] text-[var(--text)]",
							children: [
								sel.status,
								" — last result ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[var(--amber)]",
									children: sel.lastResult
								})
							]
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "py-8 text-center text-[12px] text-[var(--text-sub)]",
						children: "Select a task"
					})
				})
			]
		})
	] });
}
//#endregion
export { TasksPage as component };
