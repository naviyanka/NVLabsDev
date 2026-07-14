import { i as __toESM } from "../_runtime.mjs";
import { F as getUsersClient, S as getGroupsClient } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { Bt as ArrowUpZA, E as Search, Gt as ArrowDownAZ, a as Users, b as Shield, c as UserCheck, q as LoaderCircle, s as UserX } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/users-BqRq8PQq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function UsersPage() {
	const [server, setServer] = (0, import_react.useState)("localhost");
	const [users, setUsers] = (0, import_react.useState)([]);
	const [groups, setGroups] = (0, import_react.useState)([]);
	const [tab, setTab] = (0, import_react.useState)("Users");
	const [expanded, setExpanded] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const [sortCol, setSortCol] = (0, import_react.useState)("name");
	const [sortAsc, setSortAsc] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		setLoading(true);
		Promise.all([getUsersClient(server), getGroupsClient(server)]).then(([uData, gData]) => {
			setUsers(uData);
			setGroups(gData);
		}).catch((err) => {
			console.error(err);
		}).finally(() => {
			setLoading(false);
		});
	}, [server]);
	const toggleSort = (col) => {
		if (sortCol === col) setSortAsc(!sortAsc);
		else {
			setSortCol(col);
			setSortAsc(true);
		}
	};
	const filteredUsers = (0, import_react.useMemo)(() => {
		let result = users;
		if (search) {
			const q = search.toLowerCase();
			result = result.filter((u) => u.name.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q));
		}
		result.sort((a, b) => {
			const valA = a[sortCol];
			const valB = b[sortCol];
			if (valA < valB) return sortAsc ? -1 : 1;
			if (valA > valB) return sortAsc ? 1 : -1;
			return 0;
		});
		return result;
	}, [
		users,
		search,
		sortCol,
		sortAsc
	]);
	const filteredGroups = (0, import_react.useMemo)(() => {
		let result = groups;
		if (search) {
			const q = search.toLowerCase();
			result = result.filter((g) => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
		}
		result.sort((a, b) => {
			const valA = a[sortCol === "name" ? "name" : "description"];
			const valB = b[sortCol === "name" ? "name" : "description"];
			if (valA < valB) return sortAsc ? -1 : 1;
			if (valA > valB) return sortAsc ? 1 : -1;
			return 0;
		});
		return result;
	}, [
		groups,
		search,
		sortCol,
		sortAsc
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Security",
			title: "Local Users & Groups"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
			value: server,
			onChange: setServer
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex flex-wrap items-center justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 p-1 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg backdrop-blur-md shadow-sm",
				children: ["Users", "Groups"].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => {
						setTab(t);
						setSearch("");
						setExpanded(null);
						setSortCol("name");
						setSortAsc(true);
					},
					className: `mono rounded-md px-5 py-2 text-[12px] font-medium transition-all duration-300 flex items-center gap-2 ${tab === t ? "bg-[var(--amber-low)] text-[var(--amber)] shadow-sm" : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)]"}`,
					children: [t === "Users" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "w-4 h-4" }), t]
				}, t))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-sub)]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					placeholder: `Search ${tab.toLowerCase()}...`,
					value: search,
					onChange: (e) => setSearch(e.target.value),
					className: "w-64 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors text-[var(--text)] placeholder:text-[var(--text-sub)]"
				})]
			})]
		}),
		tab === "Users" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-card overflow-hidden flex flex-col h-[calc(100vh-280px)] backdrop-blur-xl border border-[var(--border-dim)] shadow-xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-auto flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-[13px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "sticky top-0 bg-[var(--bg-card)] z-10 backdrop-blur-md",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "eyebrow border-b border-[var(--border-c)] text-left",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group",
									onClick: () => toggleSort("name"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: ["Username ", sortCol === "name" && (sortAsc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownAZ, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpZA, { className: "w-4 h-4" }))]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group",
									onClick: () => toggleSort("fullName"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: ["Full Name ", sortCol === "fullName" && (sortAsc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownAZ, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpZA, { className: "w-4 h-4" }))]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group",
									onClick: () => toggleSort("lastLogin"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: ["Last Login ", sortCol === "lastLogin" && (sortAsc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownAZ, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpZA, { className: "w-4 h-4" }))]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group",
									onClick: () => toggleSort("enabled"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: ["Enabled ", sortCol === "enabled" && (sortAsc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownAZ, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpZA, { className: "w-4 h-4" }))]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Password"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Groups"
								})
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "mono",
						children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							colSpan: 6,
							className: "px-5 py-12 text-center text-[var(--text-sub)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-6 h-6 animate-spin mx-auto mb-2 text-[var(--amber)]" }), "Fetching users..."]
						}) }) : filteredUsers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 6,
							className: "px-5 py-12 text-center text-[var(--text-sub)]",
							children: "No users found."
						}) }) : filteredUsers.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] transition-colors duration-200",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-5 py-4 font-medium text-[var(--amber)] flex items-center gap-2",
									children: [u.enabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserCheck, { className: "w-4 h-4 text-[var(--ok)]" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserX, { className: "w-4 h-4 text-[var(--critical)]" }), u.name]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-5 py-4 text-[var(--text)]",
									children: u.fullName || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-5 py-4 text-[var(--text-sub)]",
									children: u.lastLogin === "—" ? "—" : new Date(u.lastLogin).toLocaleString()
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-5 py-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold ${u.enabled ? "bg-[var(--ok)]/15 text-[var(--ok)]" : "bg-[var(--critical)]/15 text-[var(--critical)]"}`,
										children: u.enabled ? "Enabled" : "Disabled"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-5 py-4 text-[var(--text-sub)]",
									children: u.passwordNeverExpires ? "Never expires" : "Standard"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-5 py-4 text-[var(--text-sub)] truncate max-w-[200px]",
									title: u.groups.join(", "),
									children: u.groups.join(", ")
								})
							]
						}, u.name))
					})]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-3 border-t border-[var(--border-dim)] text-xs text-[var(--text-sub)] bg-[var(--bg-surface)]",
				children: ["Total Users: ", filteredUsers.length]
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-card overflow-hidden flex flex-col h-[calc(100vh-280px)] backdrop-blur-xl border border-[var(--border-dim)] shadow-xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-auto flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-[13px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "sticky top-0 bg-[var(--bg-card)] z-10 backdrop-blur-md",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "eyebrow border-b border-[var(--border-c)] text-left",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group",
									onClick: () => toggleSort("name"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: ["Group ", sortCol === "name" && (sortAsc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownAZ, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpZA, { className: "w-4 h-4" }))]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group",
									onClick: () => toggleSort("description"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: ["Description ", sortCol === "description" && (sortAsc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownAZ, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpZA, { className: "w-4 h-4" }))]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3",
									children: "Members"
								})
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "mono",
						children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							colSpan: 3,
							className: "px-5 py-12 text-center text-[var(--text-sub)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-6 h-6 animate-spin mx-auto mb-2 text-[var(--amber)]" }), "Fetching groups..."]
						}) }) : filteredGroups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 3,
							className: "px-5 py-12 text-center text-[var(--text-sub)]",
							children: "No groups found."
						}) }) : filteredGroups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							onClick: () => setExpanded(expanded === g.name ? null : g.name),
							className: `cursor-pointer border-b border-[var(--border-dim)] transition-colors duration-200 ${expanded === g.name ? "bg-[var(--bg-surface)]" : "hover:bg-[var(--bg-surface)]"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-5 py-4 font-medium text-[var(--amber)] flex items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "w-4 h-4" }),
										" ",
										g.name
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-5 py-4 text-[var(--text-sub)]",
									children: g.description || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-5 py-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "px-3 py-1 rounded-full text-[10px] font-semibold bg-[var(--border-dim)] text-[var(--text)]",
										children: [
											g.members.length,
											" ",
											g.members.length === 1 ? "member" : "members"
										]
									})
								})
							]
						}), expanded === g.name && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 3,
							className: "border-b border-[var(--border-dim)] bg-[var(--bg-card)] px-5 py-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "animate-in fade-in slide-in-from-top-2 duration-300 bg-[var(--bg-surface)] p-6 m-4 rounded-xl border border-[var(--border-dim)] shadow-inner",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "eyebrow mb-3 text-[var(--text-sub)]",
									children: "Group Members"
								}), g.members.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[12px] text-[var(--text-sub)] italic",
									children: "No members in this group."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2",
									children: g.members.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-2 text-[12px] text-[var(--text)] bg-[var(--bg-card)] px-3 py-2 rounded-md border border-[var(--border-dim)]",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "w-3 h-3 text-[var(--amber)] opacity-70" }),
											" ",
											m
										]
									}, m))
								})]
							})
						}) })] }, g.name))
					})]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-3 border-t border-[var(--border-dim)] text-xs text-[var(--text-sub)] bg-[var(--bg-surface)]",
				children: ["Total Groups: ", filteredGroups.length]
			})]
		})
	] });
}
//#endregion
export { UsersPage as component };
