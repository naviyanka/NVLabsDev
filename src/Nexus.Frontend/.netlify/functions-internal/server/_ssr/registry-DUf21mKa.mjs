import { i as __toESM } from "../_runtime.mjs";
import { k as getRegistryContentClient } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { $ as Hash, A as RefreshCw, At as ChevronDown, E as Search, at as FolderOpen, ct as FileCode, d as Type, dt as Database, kt as ChevronRight, q as LoaderCircle, rt as Folder } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/registry-DUf21mKa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TYPE_COLOR = {
	REG_SZ: "var(--teal)",
	REG_DWORD: "var(--amber)",
	REG_QWORD: "var(--amber)",
	REG_BINARY: "var(--text-sub)",
	REG_MULTI_SZ: "var(--ok)",
	REG_EXPAND_SZ: "var(--warn)"
};
var TYPE_ICON = {
	REG_SZ: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, { size: 14 }),
	REG_DWORD: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hash, { size: 14 }),
	REG_QWORD: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hash, { size: 14 }),
	REG_BINARY: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCode, { size: 14 }),
	REG_MULTI_SZ: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, { size: 14 }),
	REG_EXPAND_SZ: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, { size: 14 })
};
function RegistryPage() {
	const [server, setServer] = (0, import_react.useState)("localhost");
	const [path, setPath] = (0, import_react.useState)("HKEY_LOCAL_MACHINE\\SOFTWARE");
	const [inputPath, setInputPath] = (0, import_react.useState)(path);
	const [content, setContent] = (0, import_react.useState)({
		subKeys: [],
		values: []
	});
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const fetchContent = (0, import_react.useCallback)(async (targetPath) => {
		setLoading(true);
		try {
			setContent(await getRegistryContentClient(server, targetPath));
			setPath(targetPath);
			setInputPath(targetPath);
		} finally {
			setLoading(false);
		}
	}, [server]);
	(0, import_react.useEffect)(() => {
		fetchContent(path);
	}, [fetchContent]);
	const handlePathSubmit = (e) => {
		e.preventDefault();
		if (inputPath !== path) fetchContent(inputPath);
	};
	const filteredValues = content.values.filter((v) => search === "" || v.name.toLowerCase().includes(search.toLowerCase()) || v.data.toLowerCase().includes(search.toLowerCase()));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Infrastructure",
			title: "Registry Editor"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-4 mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
				value: server,
				onChange: setServer
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handlePathSubmit,
				className: "flex-1 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-sub)]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						value: inputPath,
						onChange: (e) => setInputPath(e.target.value),
						placeholder: "e.g. HKEY_LOCAL_MACHINE\\SOFTWARE",
						className: "w-full bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg pl-9 pr-4 py-2 text-[13px] font-mono focus:outline-none focus:border-[var(--amber)] transition-colors text-[var(--text)]"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					disabled: loading,
					className: "flex items-center justify-center bg-[var(--amber-low)] text-[var(--amber)] border border-[var(--amber)]/30 rounded-lg px-4 hover:bg-[var(--amber)]/20 transition-colors",
					children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						size: 16,
						className: "animate-spin"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 16 })
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "nx-card p-3 h-[calc(100vh-220px)] overflow-y-auto backdrop-blur-xl border border-[var(--border-dim)] shadow-lg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow pb-3 pl-2 text-[var(--text-sub)]",
						children: "Registry Hives"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HiveNode, {
						name: "HKEY_LOCAL_MACHINE",
						currentPath: path,
						onSelect: fetchContent,
						server,
						defaultOpen: path.startsWith("HKEY_LOCAL_MACHINE")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HiveNode, {
						name: "HKEY_CURRENT_USER",
						currentPath: path,
						onSelect: fetchContent,
						server,
						defaultOpen: path.startsWith("HKEY_CURRENT_USER")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HiveNode, {
						name: "HKEY_CLASSES_ROOT",
						currentPath: path,
						onSelect: fetchContent,
						server,
						defaultOpen: path.startsWith("HKEY_CLASSES_ROOT")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HiveNode, {
						name: "HKEY_USERS",
						currentPath: path,
						onSelect: fetchContent,
						server,
						defaultOpen: path.startsWith("HKEY_USERS")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HiveNode, {
						name: "HKEY_CURRENT_CONFIG",
						currentPath: path,
						onSelect: fetchContent,
						server,
						defaultOpen: path.startsWith("HKEY_CURRENT_CONFIG")
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "nx-card overflow-hidden flex flex-col h-[calc(100vh-220px)] backdrop-blur-xl border border-[var(--border-dim)] shadow-xl relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between p-3 border-b border-[var(--border-dim)] bg-[var(--bg-card)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => fetchContent(path),
							disabled: loading,
							className: "p-1.5 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-sub)] hover:text-[var(--text)] transition-colors",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
								size: 14,
								className: loading ? "animate-spin text-[var(--amber)]" : ""
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[12px] text-[var(--text-sub)] font-mono truncate max-w-[400px]",
							title: path,
							children: path
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-sub)]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							placeholder: "Filter values...",
							value: search,
							onChange: (e) => setSearch(e.target.value),
							className: "w-48 bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-md pl-8 pr-3 py-1.5 text-[12px] focus:outline-none focus:border-[var(--amber)] transition-colors text-[var(--text)] placeholder:text-[var(--text-sub)]"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-auto flex-1 bg-[var(--bg-surface)]/30",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-[13px] border-collapse",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "sticky top-0 bg-[var(--bg-card)] z-10 shadow-sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "eyebrow text-left",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-5 py-3 border-b border-[var(--border-dim)] w-[30%]",
										children: "Name"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-5 py-3 border-b border-[var(--border-dim)] w-[20%]",
										children: "Type"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-5 py-3 border-b border-[var(--border-dim)] w-[50%]",
										children: "Data"
									})
								]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "mono",
							children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								colSpan: 3,
								className: "px-5 py-12 text-center text-[var(--text-sub)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-6 h-6 animate-spin mx-auto mb-2 text-[var(--amber)]" }), "Reading registry..."]
							}) }) : content.values.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 3,
								className: "px-5 py-12 text-center text-[var(--text-sub)]",
								children: "No values in this key."
							}) }) : filteredValues.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 3,
								className: "px-5 py-12 text-center text-[var(--text-sub)]",
								children: "No values match filter."
							}) }) : filteredValues.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] transition-colors",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-5 py-2.5 text-[var(--text)] font-medium truncate max-w-[200px]",
										title: v.name,
										children: v.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-5 py-2.5 flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											style: { color: TYPE_COLOR[v.type] || "var(--text-sub)" },
											children: TYPE_ICON[v.type] || /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCode, { size: 14 })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px]",
											style: { color: TYPE_COLOR[v.type] || "var(--text-sub)" },
											children: v.type
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-5 py-2.5 text-[var(--text-sub)] break-words max-w-[300px]",
										children: v.data === "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "opacity-40 italic",
											children: "(value not set)"
										}) : v.data
									})
								]
							}, v.name))
						})]
					})
				})]
			})]
		})
	] });
}
function HiveNode({ name, currentPath, onSelect, server, defaultOpen = false }) {
	const [isOpen, setIsOpen] = (0, import_react.useState)(defaultOpen);
	const [subKeys, setSubKeys] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [hasSubKeys, setHasSubKeys] = (0, import_react.useState)(true);
	const isSelected = currentPath === name;
	const toggleOpen = async (e) => {
		e.stopPropagation();
		if (!isOpen && !subKeys) {
			setLoading(true);
			try {
				const data = await getRegistryContentClient(server, name);
				setSubKeys(data.subKeys);
				if (data.subKeys.length === 0) setHasSubKeys(false);
			} finally {
				setLoading(false);
			}
		}
		setIsOpen(!isOpen);
	};
	const handleSelect = () => {
		onSelect(name);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pl-3 relative",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute left-[11px] top-6 bottom-0 w-[1px] bg-[var(--border-dim)]",
				style: { display: isOpen ? "block" : "none" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `flex items-center gap-1.5 py-1 px-1.5 rounded-md cursor-pointer transition-colors ${isSelected ? "bg-[var(--amber-low)] text-[var(--amber)]" : "hover:bg-[var(--bg-surface)] text-[var(--text)]"}`,
				onClick: handleSelect,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: toggleOpen,
					disabled: !hasSubKeys,
					className: `p-0.5 rounded-sm hover:bg-[var(--border-c)] flex-shrink-0 ${!hasSubKeys ? "opacity-30 cursor-default" : ""}`,
					children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						size: 12,
						className: "animate-spin text-[var(--amber)]"
					}) : isOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 12 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 12 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-2 font-mono text-[11px] truncate",
					title: name.split("\\").pop(),
					children: [isOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, {
						size: 13,
						className: "text-[var(--amber)] opacity-80"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, {
						size: 13,
						className: "text-[var(--amber)] opacity-80"
					}), name.split("\\").pop()]
				})]
			}),
			isOpen && subKeys && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-0.5",
				children: subKeys.map((sk) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HiveNode, {
					name: sk.path,
					currentPath,
					onSelect,
					server,
					defaultOpen: currentPath.startsWith(sk.path) && currentPath !== sk.path
				}, sk.path))
			})
		]
	});
}
//#endregion
export { RegistryPage as component };
