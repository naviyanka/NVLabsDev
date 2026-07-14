import { i as __toESM } from "../_runtime.mjs";
import { p as getApiUrl } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { A as RefreshCw, B as Package, C as Settings, D as ScrollText, E as Search, F as Plus, Kt as AppWindow, L as Pen, M as Puzzle, Nt as Calendar, Rt as BadgeCheck, T as Server, V as Network, W as Monitor, X as KeyRound, Y as Layers, _t as Cog, a as Users, at as FolderOpen, b as Shield, et as HardDrive, ft as DatabaseZap, gt as CopySlash, m as Terminal, n as X, nt as GitBranch, p as Trash2, pt as Cpu, qt as Activity } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { s as ThemeContext } from "../__root-H47vz4C-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/plugins-6kmhyDRm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ICONS$1 = {
	terminal: Terminal,
	shield: Shield,
	activity: Activity,
	"hard-drive": HardDrive,
	network: Network,
	settings: Settings,
	cpu: Cpu,
	"database-zap": DatabaseZap,
	"app-window": AppWindow,
	cog: Cog,
	"folder-open": FolderOpen,
	calendar: Calendar,
	package: Package,
	layers: Layers,
	"refresh-cw": RefreshCw,
	monitor: Monitor,
	"badge-check": BadgeCheck,
	users: Users,
	"key-round": KeyRound,
	server: Server,
	"git-branch": GitBranch,
	"copy-slash": CopySlash,
	"scroll-text": ScrollText,
	puzzle: Puzzle
};
function HorizonPlugins() {
	const [plugins, setPlugins] = (0, import_react.useState)([]);
	const [categories, setCategories] = (0, import_react.useState)([
		"Management",
		"Security",
		"Infrastructure",
		"Advanced",
		"Custom"
	]);
	const [cat, setCat] = (0, import_react.useState)("All");
	const [q, setQ] = (0, import_react.useState)("");
	const [editingPlugin, setEditingPlugin] = (0, import_react.useState)(null);
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
	function load() {
		fetch(getApiUrl("/plugins")).then((r) => r.json()).then(setPlugins).catch(() => toast.error("Failed to load plugins"));
		fetch(getApiUrl("/settings")).then((r) => r.json()).then((data) => {
			if (data.pluginCategories) setCategories(data.pluginCategories.split(",").map((c) => c.trim()).filter(Boolean));
		}).catch(() => {});
	}
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	const stats = (0, import_react.useMemo)(() => ({
		total: plugins.length,
		active: plugins.filter((p) => p.isActive).length,
		disabled: plugins.filter((p) => !p.isActive).length
	}), [plugins]);
	const filtered = plugins.filter((p) => {
		const matchCat = cat === "All" || p.category === cat;
		const matchQ = p.name.toLowerCase().includes(q.toLowerCase());
		const matchStatus = statusFilter === "all" ? true : statusFilter === "active" ? p.isActive : !p.isActive;
		return matchCat && matchQ && matchStatus;
	});
	function toggle(p) {
		const next = {
			...p,
			isActive: !p.isActive
		};
		setPlugins((ps) => ps.map((x) => x.id === p.id ? next : x));
		fetch(getApiUrl(`/plugins/${p.id}`), {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(next)
		}).then(() => {
			window.dispatchEvent(new Event("plugins-updated"));
		}).catch(() => {
			toast.error("Failed to toggle");
			load();
		});
	}
	function deletePlugin(id) {
		if (!confirm("Delete this plugin permanently?")) return;
		fetch(getApiUrl(`/plugins/${id}`), { method: "DELETE" }).then((r) => {
			if (!r.ok) throw new Error("Failed");
			load();
			window.dispatchEvent(new Event("plugins-updated"));
		}).catch(() => toast.error("Failed to delete"));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-[1600px] mx-auto space-y-8 font-sans",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col md:flex-row md:items-center justify-between gap-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-3xl font-extrabold text-[var(--text)]",
					children: "Plugin Manager"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-[var(--text-sub)] mt-1",
					children: "Manage built-in and custom extensions."
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-end pb-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setEditingPlugin("new"),
					className: "flex items-center gap-2 rounded-md bg-[var(--amber)] px-4 py-2 text-[12px] font-semibold text-[var(--bg-void)] hover:bg-[var(--amber-hover)] transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }), " Create Plugin"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-3 pb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						label: "Total Plugins",
						value: stats.total,
						color: "var(--text)",
						active: statusFilter === "all",
						onClick: () => setStatusFilter("all")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						label: "Active",
						value: stats.active,
						color: "var(--ok)",
						active: statusFilter === "active",
						onClick: () => setStatusFilter("active")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						label: "Disabled",
						value: stats.disabled,
						color: "var(--text-sub)",
						active: statusFilter === "disabled",
						onClick: () => setStatusFilter("disabled")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-[200px_1fr] gap-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "nx-card h-fit p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow px-1 pb-2",
						children: "Category"
					}), ["All", ...categories].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setCat(c),
						className: "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] " + (c === cat ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)]"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mono text-[10px]",
							children: c === "All" ? plugins.length : plugins.filter((p) => p.category === c).length
						})]
					}, c))]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative pb-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						size: 14,
						className: "pointer-events-none absolute left-3 top-3 text-[var(--text-sub)]"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "Search plugins…",
						className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] py-2 pl-9 pr-3 text-[12px] focus:border-[var(--amber)] focus:outline-none"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3",
					children: [filtered.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PluginCard$1, {
						p,
						onToggle: () => toggle(p),
						onEdit: () => setEditingPlugin(p),
						onDelete: () => deletePlugin(p.id)
					}, p.id)), filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "col-span-2 text-center text-[var(--text-sub)] py-10",
						children: "No plugins found."
					})]
				})] })]
			}),
			editingPlugin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PluginModal$1, {
				plugin: editingPlugin === "new" ? null : editingPlugin,
				categories,
				onClose: () => setEditingPlugin(null),
				onSaved: () => {
					load();
					window.dispatchEvent(new Event("plugins-updated"));
				}
			})
		]
	});
}
function PluginModal$1({ plugin, categories, onClose, onSaved }) {
	const [form, setForm] = (0, import_react.useState)(plugin || {
		name: "",
		description: "",
		scriptType: "powershell",
		sourceType: "inline",
		scriptContent: "",
		icon: "terminal",
		category: "Custom"
	});
	const [showIconPicker, setShowIconPicker] = (0, import_react.useState)(false);
	const iconPickerRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		function handleClickOutside(event) {
			if (iconPickerRef.current && !iconPickerRef.current.contains(event.target)) setShowIconPicker(false);
		}
		if (showIconPicker) document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [showIconPicker]);
	function save() {
		const isNew = !plugin;
		const url = isNew ? getApiUrl("/plugins") : getApiUrl(`/plugins/${plugin.id}`);
		fetch(url, {
			method: isNew ? "POST" : "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(form)
		}).then((r) => {
			if (r.ok) {
				onSaved();
				onClose();
			} else toast.error("Failed to save");
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-card w-full max-w-2xl overflow-hidden flex flex-col max-h-full",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-b border-[var(--border-c)] p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold text-[var(--text)]",
						children: plugin ? "Edit Plugin" : "Create Custom Plugin"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "text-[var(--text-sub)] hover:text-[var(--text)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-6 space-y-4 overflow-y-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "eyebrow block pb-1",
								children: "Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: form.name,
								disabled: form.isBuiltIn,
								onChange: (e) => setForm({
									...form,
									name: e.target.value
								}),
								className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none disabled:opacity-50"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "eyebrow block pb-1",
								children: "Category"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								value: form.category,
								onChange: (e) => setForm({
									...form,
									category: e.target.value
								}),
								className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none",
								children: categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: c,
									children: c
								}, c))
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "eyebrow block pb-1",
							children: "Description"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: form.description,
							disabled: form.isBuiltIn,
							onChange: (e) => setForm({
								...form,
								description: e.target.value
							}),
							className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none disabled:opacity-50"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "eyebrow block pb-1",
								children: "Icon"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								ref: iconPickerRef,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: form.isBuiltIn,
									onClick: () => setShowIconPicker(!showIconPicker),
									className: "mono flex w-full items-center justify-between rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none disabled:opacity-50",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-2",
										children: [(() => {
											const IconComp = ICONS$1[form.icon || "terminal"];
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconComp, { size: 14 });
										})(), form.icon]
									})
								}), showIconPicker && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] p-2 shadow-lg",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid grid-cols-6 gap-2",
										children: Object.keys(ICONS$1).map((c) => {
											const IconComp = ICONS$1[c];
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => {
													setForm({
														...form,
														icon: c
													});
													setShowIconPicker(false);
												},
												title: c,
												className: "flex aspect-square items-center justify-center rounded-md border transition-colors " + (form.icon === c ? "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)]" : "border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)] hover:text-[var(--text)]"),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconComp, { size: 16 })
											}, c);
										})
									})
								})]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "eyebrow block pb-1",
								children: "Script Type"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: form.scriptType,
								disabled: form.isBuiltIn,
								onChange: (e) => setForm({
									...form,
									scriptType: e.target.value
								}),
								className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none disabled:opacity-50",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "powershell",
										children: "PowerShell"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "bat",
										children: "Batch (.bat)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "vbs",
										children: "VBScript (.vbs)"
									})
								]
							})] })]
						}),
						!form.isBuiltIn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-4 pb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-2 text-[12px] text-[var(--text)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "radio",
									checked: form.sourceType !== "file",
									onChange: () => setForm({
										...form,
										sourceType: "inline"
									}),
									className: "accent-[var(--amber)]"
								}), "Inline Script"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-2 text-[12px] text-[var(--text)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "radio",
									checked: form.sourceType === "file",
									onChange: () => setForm({
										...form,
										sourceType: "file"
									}),
									className: "accent-[var(--amber)]"
								}), "Upload File"]
							})]
						}), form.sourceType === "file" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							onChange: (e) => {
								const file = e.target.files?.[0];
								if (file) {
									const reader = new FileReader();
									reader.onload = (ev) => setForm({
										...form,
										scriptContent: ev.target?.result
									});
									reader.readAsText(file);
								}
							},
							className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] file:mr-4 file:rounded file:border-0 file:bg-[var(--amber-low)] file:px-4 file:py-1 file:text-[11px] file:font-semibold file:text-[var(--amber)] hover:file:bg-[var(--amber)] hover:file:text-[var(--bg-void)] file:cursor-pointer"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: form.scriptContent,
							onChange: (e) => setForm({
								...form,
								scriptContent: e.target.value
							}),
							rows: 10,
							className: "mono w-full rounded-md border border-[var(--border-c)] bg-[#0d0d0d] text-[var(--ok)] px-3 py-3 text-[12px] focus:border-[var(--amber)] focus:outline-none font-mono leading-relaxed",
							placeholder: "# Write your script here..."
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-end gap-3 border-t border-[var(--border-c)] p-4 bg-[var(--bg-surface)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "px-4 py-2 text-[12px] text-[var(--text-sub)] hover:text-[var(--text)]",
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: save,
						className: "rounded-md bg-[var(--amber)] px-4 py-2 text-[12px] font-semibold text-[var(--bg-void)] hover:bg-[var(--amber-hover)]",
						children: "Save Plugin"
					})]
				})
			]
		})
	});
}
function Stat$1({ label, value, color, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: "nx-card p-4 text-left transition-all block w-full " + (active ? "border-[var(--amber)] bg-[var(--amber-low)] ring-1 ring-[var(--amber)] scale-[1.02]" : "hover:border-[var(--border-c)]/80"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "eyebrow pb-1",
			style: { color },
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "display text-[24px] font-bold",
			style: { color },
			children: value
		})]
	});
}
var CAT_COLOR$1 = {
	Security: "var(--crit)",
	Storage: "var(--teal)",
	Monitoring: "var(--amber)",
	Network: "#60a5fa",
	Management: "var(--ok)",
	Custom: "var(--text-sub)",
	Advanced: "var(--purple)",
	Infrastructure: "var(--blue)"
};
function PluginCard$1({ p, onToggle, onEdit, onDelete }) {
	const catColor = CAT_COLOR$1[p.category] || "var(--text-sub)";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "nx-card flex flex-col justify-between p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mono inline-block rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em]",
						style: {
							color: catColor,
							borderColor: catColor + "55",
							background: catColor + "15"
						},
						children: p.category
					}), p.isBuiltIn && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mono inline-block rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-[var(--text)] border-[var(--border-c)] bg-[var(--bg-surface)]",
						children: "BUILT-IN"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "display pt-2 text-[14px] font-semibold text-[var(--text)]",
					children: p.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mono pt-0.5 text-[10px] text-[var(--text-sub)]",
					children: [
						p.isBuiltIn ? "NATIVE UI" : p.scriptType.toUpperCase(),
						" · ",
						p.author
					]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle$1, {
				on: p.isActive,
				onChange: onToggle
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "pt-3 text-[12px] leading-relaxed text-[var(--text-sub)]",
			children: p.description
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex justify-end gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: onEdit,
				className: "text-[var(--text-sub)] hover:text-[var(--text)] transition-colors",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { size: 14 })
			}), !p.isBuiltIn && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: onDelete,
				className: "text-[var(--text-sub)] hover:text-[var(--crit)] transition-colors",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
			})]
		})]
	});
}
function Toggle$1({ on, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick: onChange,
		className: "relative shrink-0 h-5 w-9 rounded-full transition-colors " + (on ? "bg-[var(--amber)]" : "bg-[var(--border-c)]"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute left-0 top-0.5 h-4 w-4 rounded-full bg-[var(--bg-void)] transition-transform " + (on ? "translate-x-4" : "translate-x-0.5") })
	});
}
var ICONS = {
	terminal: Terminal,
	shield: Shield,
	activity: Activity,
	"hard-drive": HardDrive,
	network: Network,
	settings: Settings,
	cpu: Cpu,
	"database-zap": DatabaseZap,
	"app-window": AppWindow,
	cog: Cog,
	"folder-open": FolderOpen,
	calendar: Calendar,
	package: Package,
	layers: Layers,
	"refresh-cw": RefreshCw,
	monitor: Monitor,
	"badge-check": BadgeCheck,
	users: Users,
	"key-round": KeyRound,
	server: Server,
	"git-branch": GitBranch,
	"copy-slash": CopySlash,
	"scroll-text": ScrollText,
	puzzle: Puzzle
};
function PluginsPage() {
	const { theme } = (0, import_react.useContext)(ThemeContext);
	if (theme === "horizon") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HorizonPlugins, {});
	const [plugins, setPlugins] = (0, import_react.useState)([]);
	const [categories, setCategories] = (0, import_react.useState)([
		"Management",
		"Security",
		"Infrastructure",
		"Advanced",
		"Custom"
	]);
	const [cat, setCat] = (0, import_react.useState)("All");
	const [q, setQ] = (0, import_react.useState)("");
	const [editingPlugin, setEditingPlugin] = (0, import_react.useState)(null);
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
	function load() {
		fetch(getApiUrl("/plugins")).then((r) => r.json()).then(setPlugins).catch(() => toast.error("Failed to load plugins"));
		fetch(getApiUrl("/settings")).then((r) => r.json()).then((data) => {
			if (data.pluginCategories) setCategories(data.pluginCategories.split(",").map((c) => c.trim()).filter(Boolean));
		}).catch(() => {});
	}
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	const stats = (0, import_react.useMemo)(() => ({
		total: plugins.length,
		active: plugins.filter((p) => p.isActive).length,
		disabled: plugins.filter((p) => !p.isActive).length
	}), [plugins]);
	const filtered = plugins.filter((p) => {
		const matchCat = cat === "All" || p.category === cat;
		const matchQ = p.name.toLowerCase().includes(q.toLowerCase());
		const matchStatus = statusFilter === "all" ? true : statusFilter === "active" ? p.isActive : !p.isActive;
		return matchCat && matchQ && matchStatus;
	});
	function toggle(p) {
		const next = {
			...p,
			isActive: !p.isActive
		};
		setPlugins((ps) => ps.map((x) => x.id === p.id ? next : x));
		fetch(getApiUrl(`/plugins/${p.id}`), {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(next)
		}).then(() => {
			window.dispatchEvent(new Event("plugins-updated"));
		}).catch(() => {
			toast.error("Failed to toggle");
			load();
		});
	}
	function deletePlugin(id) {
		if (!confirm("Delete this plugin permanently?")) return;
		fetch(getApiUrl(`/plugins/${id}`), { method: "DELETE" }).then((r) => {
			if (!r.ok) throw new Error("Failed");
			load();
			window.dispatchEvent(new Event("plugins-updated"));
		}).catch(() => toast.error("Failed to delete"));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "System",
			title: "Plugin Manager",
			subtitle: "Manage built-in and custom extensions"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex justify-end pb-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setEditingPlugin("new"),
				className: "flex items-center gap-2 rounded-md bg-[var(--amber)] px-4 py-2 text-[12px] font-semibold text-[var(--bg-void)] hover:bg-[var(--amber-hover)] transition-colors",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }), " Create Plugin"]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-3 gap-3 pb-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Total Plugins",
					value: stats.total,
					color: "var(--text)",
					active: statusFilter === "all",
					onClick: () => setStatusFilter("all")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Active",
					value: stats.active,
					color: "var(--ok)",
					active: statusFilter === "active",
					onClick: () => setStatusFilter("active")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Disabled",
					value: stats.disabled,
					color: "var(--text-sub)",
					active: statusFilter === "disabled",
					onClick: () => setStatusFilter("disabled")
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-[200px_1fr] gap-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "nx-card h-fit p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "eyebrow px-1 pb-2",
					children: "Category"
				}), ["All", ...categories].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setCat(c),
					className: "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] " + (c === cat ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--bg-surface)]"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mono text-[10px]",
						children: c === "All" ? plugins.length : plugins.filter((p) => p.category === c).length
					})]
				}, c))]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative pb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
					size: 14,
					className: "pointer-events-none absolute left-3 top-3 text-[var(--text-sub)]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "Search plugins…",
					className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] py-2 pl-9 pr-3 text-[12px] focus:border-[var(--amber)] focus:outline-none"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3",
				children: [filtered.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PluginCard, {
					p,
					onToggle: () => toggle(p),
					onEdit: () => setEditingPlugin(p),
					onDelete: () => deletePlugin(p.id)
				}, p.id)), filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "col-span-2 text-center text-[var(--text-sub)] py-10",
					children: "No plugins found."
				})]
			})] })]
		}),
		editingPlugin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PluginModal, {
			plugin: editingPlugin === "new" ? null : editingPlugin,
			categories,
			onClose: () => setEditingPlugin(null),
			onSaved: () => {
				load();
				window.dispatchEvent(new Event("plugins-updated"));
			}
		})
	] });
}
function PluginModal({ plugin, categories, onClose, onSaved }) {
	const [form, setForm] = (0, import_react.useState)(plugin || {
		name: "",
		description: "",
		scriptType: "powershell",
		sourceType: "inline",
		scriptContent: "",
		icon: "terminal",
		category: "Custom"
	});
	const [showIconPicker, setShowIconPicker] = (0, import_react.useState)(false);
	const iconPickerRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		function handleClickOutside(event) {
			if (iconPickerRef.current && !iconPickerRef.current.contains(event.target)) setShowIconPicker(false);
		}
		if (showIconPicker) document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [showIconPicker]);
	function save() {
		const isNew = !plugin;
		const url = isNew ? getApiUrl("/plugins") : getApiUrl(`/plugins/${plugin.id}`);
		fetch(url, {
			method: isNew ? "POST" : "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(form)
		}).then((r) => {
			if (r.ok) {
				onSaved();
				onClose();
			} else toast.error("Failed to save");
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-card w-full max-w-2xl overflow-hidden flex flex-col max-h-full",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-b border-[var(--border-c)] p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold text-[var(--text)]",
						children: plugin ? "Edit Plugin" : "Create Custom Plugin"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "text-[var(--text-sub)] hover:text-[var(--text)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-6 space-y-4 overflow-y-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "eyebrow block pb-1",
								children: "Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: form.name,
								disabled: form.isBuiltIn,
								onChange: (e) => setForm({
									...form,
									name: e.target.value
								}),
								className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none disabled:opacity-50"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "eyebrow block pb-1",
								children: "Category"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								value: form.category,
								onChange: (e) => setForm({
									...form,
									category: e.target.value
								}),
								className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none",
								children: categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: c,
									children: c
								}, c))
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "eyebrow block pb-1",
							children: "Description"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: form.description,
							disabled: form.isBuiltIn,
							onChange: (e) => setForm({
								...form,
								description: e.target.value
							}),
							className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none disabled:opacity-50"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "eyebrow block pb-1",
								children: "Icon"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								ref: iconPickerRef,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: form.isBuiltIn,
									onClick: () => setShowIconPicker(!showIconPicker),
									className: "mono flex w-full items-center justify-between rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none disabled:opacity-50",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-2",
										children: [(() => {
											const IconComp = ICONS[form.icon || "terminal"];
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconComp, { size: 14 });
										})(), form.icon]
									})
								}), showIconPicker && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] p-2 shadow-lg",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid grid-cols-6 gap-2",
										children: Object.keys(ICONS).map((c) => {
											const IconComp = ICONS[c];
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => {
													setForm({
														...form,
														icon: c
													});
													setShowIconPicker(false);
												},
												title: c,
												className: "flex aspect-square items-center justify-center rounded-md border transition-colors " + (form.icon === c ? "border-[var(--amber)] bg-[var(--amber-low)] text-[var(--amber)]" : "border-[var(--border-c)] bg-[var(--bg-surface)] text-[var(--text-sub)] hover:text-[var(--text)]"),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconComp, { size: 16 })
											}, c);
										})
									})
								})]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "eyebrow block pb-1",
								children: "Script Type"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: form.scriptType,
								disabled: form.isBuiltIn,
								onChange: (e) => setForm({
									...form,
									scriptType: e.target.value
								}),
								className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] focus:border-[var(--amber)] focus:outline-none disabled:opacity-50",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "powershell",
										children: "PowerShell"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "bat",
										children: "Batch (.bat)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "vbs",
										children: "VBScript (.vbs)"
									})
								]
							})] })]
						}),
						!form.isBuiltIn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-4 pb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-2 text-[12px] text-[var(--text)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "radio",
									checked: form.sourceType !== "file",
									onChange: () => setForm({
										...form,
										sourceType: "inline"
									}),
									className: "accent-[var(--amber)]"
								}), "Inline Script"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-2 text-[12px] text-[var(--text)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "radio",
									checked: form.sourceType === "file",
									onChange: () => setForm({
										...form,
										sourceType: "file"
									}),
									className: "accent-[var(--amber)]"
								}), "Upload File"]
							})]
						}), form.sourceType === "file" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							onChange: (e) => {
								const file = e.target.files?.[0];
								if (file) {
									const reader = new FileReader();
									reader.onload = (ev) => setForm({
										...form,
										scriptContent: ev.target?.result
									});
									reader.readAsText(file);
								}
							},
							className: "mono w-full rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] file:mr-4 file:rounded file:border-0 file:bg-[var(--amber-low)] file:px-4 file:py-1 file:text-[11px] file:font-semibold file:text-[var(--amber)] hover:file:bg-[var(--amber)] hover:file:text-[var(--bg-void)] file:cursor-pointer"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: form.scriptContent,
							onChange: (e) => setForm({
								...form,
								scriptContent: e.target.value
							}),
							rows: 10,
							className: "mono w-full rounded-md border border-[var(--border-c)] bg-[#0d0d0d] text-[var(--ok)] px-3 py-3 text-[12px] focus:border-[var(--amber)] focus:outline-none font-mono leading-relaxed",
							placeholder: "# Write your script here..."
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-end gap-3 border-t border-[var(--border-c)] p-4 bg-[var(--bg-surface)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "px-4 py-2 text-[12px] text-[var(--text-sub)] hover:text-[var(--text)]",
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: save,
						className: "rounded-md bg-[var(--amber)] px-4 py-2 text-[12px] font-semibold text-[var(--bg-void)] hover:bg-[var(--amber-hover)]",
						children: "Save Plugin"
					})]
				})
			]
		})
	});
}
function Stat({ label, value, color, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: "nx-card p-4 text-left transition-all block w-full " + (active ? "border-[var(--amber)] bg-[var(--amber-low)] ring-1 ring-[var(--amber)] scale-[1.02]" : "hover:border-[var(--border-c)]/80"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "eyebrow pb-1",
			style: { color },
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "display text-[24px] font-bold",
			style: { color },
			children: value
		})]
	});
}
var CAT_COLOR = {
	Security: "var(--crit)",
	Storage: "var(--teal)",
	Monitoring: "var(--amber)",
	Network: "#60a5fa",
	Management: "var(--ok)",
	Custom: "var(--text-sub)",
	Advanced: "var(--purple)",
	Infrastructure: "var(--blue)"
};
function PluginCard({ p, onToggle, onEdit, onDelete }) {
	const catColor = CAT_COLOR[p.category] || "var(--text-sub)";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "nx-card flex flex-col justify-between p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mono inline-block rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em]",
						style: {
							color: catColor,
							borderColor: catColor + "55",
							background: catColor + "15"
						},
						children: p.category
					}), p.isBuiltIn && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mono inline-block rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-[var(--text)] border-[var(--border-c)] bg-[var(--bg-surface)]",
						children: "BUILT-IN"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "display pt-2 text-[14px] font-semibold text-[var(--text)]",
					children: p.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mono pt-0.5 text-[10px] text-[var(--text-sub)]",
					children: [
						p.isBuiltIn ? "NATIVE UI" : p.scriptType.toUpperCase(),
						" · ",
						p.author
					]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
				on: p.isActive,
				onChange: onToggle
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "pt-3 text-[12px] leading-relaxed text-[var(--text-sub)]",
			children: p.description
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex justify-end gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: onEdit,
				className: "text-[var(--text-sub)] hover:text-[var(--text)] transition-colors",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { size: 14 })
			}), !p.isBuiltIn && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: onDelete,
				className: "text-[var(--text-sub)] hover:text-[var(--crit)] transition-colors",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
			})]
		})]
	});
}
function Toggle({ on, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick: onChange,
		className: "relative shrink-0 h-5 w-9 rounded-full transition-colors " + (on ? "bg-[var(--amber)]" : "bg-[var(--border-c)]"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute left-0 top-0.5 h-4 w-4 rounded-full bg-[var(--bg-void)] transition-transform " + (on ? "translate-x-4" : "translate-x-0.5") })
	});
}
//#endregion
export { PluginsPage as component };
