import { i as __toESM } from "../_runtime.mjs";
import { R as installAppClient, Z as uninstallAppClient, b as getFilesSourcesClient, et as uploadInstallerClient, j as getServersClient, m as getAppsClient, y as getFilesListClient } from "./client-BFkup_sp.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { A as RefreshCw, E as Search, F as Plus, Vt as ArrowUpDown, Wt as ArrowDown, et as HardDrive, kt as ChevronRight, l as Upload, mt as CornerLeftUp, n as X, ot as File, p as Trash2, rt as Folder, ut as Download, vt as CloudUpload, zt as ArrowUp } from "../_libs/lucide-react.mjs";
import { a as Portal, i as Overlay, n as Content, o as Root, r as Description, s as Title, t as Close } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { i as Trigger, n as List, r as Root2, t as Content$1 } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/apps-BdnGewd0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Dialog = Root;
var DialogPortal = Portal;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = Overlay.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Content, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Close, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = Content.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = Title.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Description, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = Description.displayName;
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
	ref,
	className: cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = List.displayName;
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow", className),
	...props
}));
TabsTrigger.displayName = Trigger.displayName;
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content$1, {
	ref,
	className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
	...props
}));
TabsContent.displayName = Content$1.displayName;
function RemoteFilePicker({ targetServer, isOpen, onOpenChange, onSelect }) {
	const [activeTab, setActiveTab] = (0, import_react.useState)("remote");
	const [activeServer, setActiveServer] = (0, import_react.useState)(targetServer);
	const [sources, setSources] = (0, import_react.useState)([]);
	const [path, setPath] = (0, import_react.useState)("");
	const [files, setFiles] = (0, import_react.useState)([]);
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	const [isUploading, setIsUploading] = (0, import_react.useState)(false);
	const localInputRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (isOpen) {
			setActiveServer(targetServer);
			setPath("");
			setActiveTab("remote");
		}
	}, [isOpen, targetServer]);
	(0, import_react.useEffect)(() => {
		if (isOpen && activeTab === "remote" && activeServer) getFilesSourcesClient(activeServer).then(setSources);
	}, [
		isOpen,
		activeServer,
		activeTab
	]);
	(0, import_react.useEffect)(() => {
		if (path && activeTab === "remote") {
			const controller = new AbortController();
			setIsLoading(true);
			getFilesListClient(activeServer, path).then(setFiles).catch(() => {
				if (!controller.signal.aborted) setFiles([]);
			}).finally(() => {
				if (!controller.signal.aborted) setIsLoading(false);
			});
			return () => controller.abort();
		} else setFiles([]);
	}, [
		path,
		activeServer,
		activeTab
	]);
	const goUp = () => {
		if (!path) return;
		const parts = path.split("\\").filter(Boolean);
		if (parts.length <= 1) setPath("");
		else {
			parts.pop();
			setPath(parts.join("\\") + "\\");
		}
	};
	const handleLocalUpload = async (e) => {
		const f = e.target.files?.[0];
		if (!f) return;
		setIsUploading(true);
		try {
			const remoteTempPath = await uploadInstallerClient(targetServer, f);
			if (remoteTempPath) onSelect(remoteTempPath, targetServer);
			else alert("Failed to upload installer.");
		} catch (err) {
			alert("Failed to upload installer.");
		} finally {
			setIsUploading(false);
			if (localInputRef.current) localInputRef.current.value = "";
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: isOpen,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-[600px] bg-[var(--bg-card)] border-[var(--border-c)] text-[var(--text)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Select Installer File" }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					value: activeTab,
					onValueChange: setActiveTab,
					className: "mt-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
							className: "grid w-full grid-cols-2 bg-[var(--bg-surface)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "remote",
								className: "data-[state=active]:bg-[var(--bg-card)] data-[state=active]:text-[var(--amber)]",
								children: "Remote Servers"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "local",
								className: "data-[state=active]:bg-[var(--bg-card)] data-[state=active]:text-[var(--amber)]",
								children: "Local Upload"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "remote",
							className: "mt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-[10px] uppercase text-[var(--text-sub)] font-semibold mb-1 block",
									children: "Source Server"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
									value: activeServer,
									onChange: (s) => {
										setActiveServer(s);
										setPath("");
									}
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex h-[350px] flex-col overflow-hidden rounded-md border border-[var(--border-dim)] bg-[var(--bg-surface)] mt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center justify-between border-b border-[var(--border-dim)] bg-[var(--bg-card)] px-3 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 mono text-[12px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											disabled: !path,
											onClick: goUp,
											className: "rounded p-1 hover:bg-[var(--bg-surface)] disabled:opacity-30",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CornerLeftUp, { size: 14 })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1 overflow-hidden",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "cursor-pointer text-[var(--amber)] hover:underline",
												onClick: () => setPath(""),
												children: activeServer
											}), path && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
												size: 14,
												className: "text-[var(--text-sub)]"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "truncate",
												children: path
											})] })]
										})]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex-1 overflow-auto p-2",
									children: !path ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid grid-cols-3 gap-2",
										children: sources.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => setPath(s.path),
											className: "flex items-center gap-2 rounded-md border border-[var(--border-dim)] p-3 text-left hover:border-[var(--amber)] hover:bg-[var(--amber-low)]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, {
												size: 16,
												className: "text-[var(--amber)]"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[12px] font-medium",
													children: s.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] text-[var(--text-sub)]",
													children: s.path
												})]
											})]
										}, s.path))
									}) : isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "p-4 text-center text-[12px] text-[var(--text-sub)]",
										children: "Loading..."
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 gap-1",
										children: [files.map((f) => {
											const isDir = f.type === "folder";
											const isInstaller = !isDir && (f.name.toLowerCase().endsWith(".exe") || f.name.toLowerCase().endsWith(".msi"));
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												onClick: () => isDir ? setPath(path.endsWith("\\") ? path + f.name : path + "\\" + f.name) : isInstaller && onSelect(path.endsWith("\\") ? path + f.name : path + "\\" + f.name, activeServer),
												className: `flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] ${isDir ? "hover:bg-[var(--bg-card)]" : isInstaller ? "hover:bg-[var(--amber-low)] hover:text-[var(--amber)]" : "opacity-50 cursor-default"}`,
												children: [isDir ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, {
													size: 14,
													className: "text-[var(--text-sub)]"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(File, {
													size: 14,
													className: isInstaller ? "text-[var(--text)]" : "text-[var(--text-sub)]"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "truncate",
													children: f.name
												})]
											}, f.name);
										}), files.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "p-4 text-center text-[12px] text-[var(--text-sub)]",
											children: "Folder is empty"
										})]
									})
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "local",
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex h-[350px] flex-col items-center justify-center rounded-md border-2 border-dashed border-[var(--border-dim)] bg-[var(--bg-surface)]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudUpload, {
										size: 48,
										className: "text-[var(--amber)] mb-4"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[14px] font-medium mb-1",
										children: "Upload Installer"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-[12px] text-[var(--text-sub)] mb-6 text-center max-w-xs",
										children: [
											"Select an .exe or .msi file from your local machine to upload and install on ",
											targetServer,
											"."
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "file",
										accept: ".exe,.msi",
										ref: localInputRef,
										className: "hidden",
										onChange: handleLocalUpload
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => localInputRef.current?.click(),
										disabled: isUploading,
										className: "bg-[var(--amber)] text-black px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-[var(--amber-hover)] disabled:opacity-50",
										children: isUploading ? "Uploading to Server..." : "Choose File"
									})
								]
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[11px] text-[var(--text-sub)]",
					children: activeTab === "remote" ? "Select an installer from any remote server. It will be copied to the target automatically if needed." : `The file will be securely transferred to ${targetServer} before execution.`
				}) })
			]
		})
	});
}
function AppsPage() {
	const [server, setServer] = (0, import_react.useState)("dc");
	const [apps, setApps] = (0, import_react.useState)([]);
	const [q, setQ] = (0, import_react.useState)("");
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	const [errorMsg, setErrorMsg] = (0, import_react.useState)(null);
	const [isPickerOpen, setIsPickerOpen] = (0, import_react.useState)(false);
	const [installingPath, setInstallingPath] = (0, import_react.useState)("");
	const [installArgs, setInstallArgs] = (0, import_react.useState)("");
	const [sourceServerIp, setSourceServerIp] = (0, import_react.useState)("");
	const [installAll, setInstallAll] = (0, import_react.useState)(false);
	const [sortColumn, setSortColumn] = (0, import_react.useState)("name");
	const [sortOrder, setSortOrder] = (0, import_react.useState)("asc");
	const fileInputRef = (0, import_react.useRef)(null);
	const fetchApps = async (refresh = false) => {
		setIsLoading(true);
		setErrorMsg(null);
		try {
			setApps(await getAppsClient(server, refresh));
		} catch (err) {
			setErrorMsg("Failed to fetch applications.");
			setApps([]);
		} finally {
			setIsLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		fetchApps();
	}, [server]);
	const handleUninstall = async (app) => {
		if (!confirm(`Are you sure you want to uninstall ${app.name}?`)) return;
		if (await uninstallAppClient(server, app.uninstallString)) {
			alert("Uninstall completed.");
			fetchApps(true);
		} else alert("Failed to uninstall. The process might require interactive input or failed silently.");
	};
	const handleSelectInstaller = (path, srcServer) => {
		setInstallingPath(path);
		setSourceServerIp(srcServer);
		setIsPickerOpen(false);
	};
	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};
	const handleFileChange = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setIsLoading(true);
		try {
			const path = await uploadInstallerClient(server, file);
			if (path) {
				setInstallingPath(path);
				setSourceServerIp(server);
			} else alert("Failed to upload installer.");
		} catch (err) {
			alert("Failed to upload installer.");
		}
		if (fileInputRef.current) fileInputRef.current.value = "";
		setIsLoading(false);
	};
	const handleInstall = async () => {
		if (!installingPath) return;
		setIsLoading(true);
		if (installAll) {
			const servers = await getServersClient();
			const promises = servers.map((s) => installAppClient(s.ip, installingPath, installArgs, sourceServerIp));
			const successCount = (await Promise.allSettled(promises)).filter((r) => r.status === "fulfilled" && r.value === true).length;
			alert(`Install completed on ${successCount} out of ${servers.length} servers.`);
		} else if (await installAppClient(server, installingPath, installArgs, sourceServerIp)) alert("Install completed.");
		else alert("Failed to install. Ensure the installer can run silently.");
		setInstallingPath("");
		setInstallArgs("");
		setSourceServerIp("");
		setInstallAll(false);
		fetchApps(true);
		setIsLoading(false);
	};
	const handleSort = (column) => {
		if (sortColumn === column) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		else {
			setSortColumn(column);
			setSortOrder("asc");
		}
	};
	const exportCsv = () => {
		if (apps.length === 0) return;
		const headers = [
			"Name",
			"Publisher",
			"Version",
			"Installed",
			"Location",
			"Size MB"
		];
		const rows = apps.map((a) => `"${a.name}","${a.publisher}","${a.version}","${a.installDate}","${a.location}","${a.sizeMB}"`);
		const csvContent = [headers.join(","), ...rows].join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.setAttribute("download", `apps_${server}_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};
	const sorted = [...apps.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) || a.publisher.toLowerCase().includes(q.toLowerCase()))].sort((a, b) => {
		let valA = a[sortColumn];
		let valB = b[sortColumn];
		if (sortColumn === "sizeMB") {
			valA = parseFloat(a.sizeMB) || 0;
			valB = parseFloat(b.sizeMB) || 0;
		}
		if (valA < valB) return sortOrder === "asc" ? -1 : 1;
		if (valA > valB) return sortOrder === "asc" ? 1 : -1;
		return 0;
	});
	const SortIcon = ({ column }) => {
		if (sortColumn !== column) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpDown, {
			size: 12,
			className: "opacity-30"
		});
		return sortOrder === "asc" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, {
			size: 12,
			className: "text-[var(--amber)]"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, {
			size: 12,
			className: "text-[var(--amber)]"
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Management",
			title: "Installed Applications",
			right: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "file",
					ref: fileInputRef,
					className: "hidden",
					accept: ".exe,.msi,.ps1",
					onChange: handleFileChange
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: exportCsv,
					disabled: apps.length === 0,
					className: "flex items-center gap-2 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] hover:border-[var(--amber)] hover:text-[var(--amber)] disabled:opacity-50",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 14 }), " Export CSV"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => fetchApps(true),
					disabled: isLoading,
					className: "flex items-center gap-2 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] hover:border-[var(--amber)] hover:text-[var(--amber)] disabled:opacity-50",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
						size: 14,
						className: isLoading ? "animate-spin" : ""
					}), " Refresh"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: handleUploadClick,
					className: "flex items-center gap-2 rounded-md bg-[var(--bg-surface)] border border-[var(--border-c)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] hover:border-[var(--amber)] hover:text-[var(--amber)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 14 }), " Upload"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setIsPickerOpen(true),
					className: "flex items-center gap-2 rounded-md bg-[var(--amber)] px-3 py-1.5 text-[12px] font-semibold text-black hover:bg-[var(--amber-hover)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }), " Install Remote"]
				})
			] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
			value: server,
			onChange: setServer
		}),
		installingPath && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-card p-4 mb-4 mt-4 border border-[var(--amber)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "eyebrow mb-2",
				children: "Install Application"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[10px] text-[var(--text-sub)] uppercase",
							children: "Installer Path"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mono text-[12px]",
							children: installingPath
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[10px] text-[var(--text-sub)] uppercase",
							children: "Install Arguments (Optional)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							value: installArgs,
							onChange: (e) => setInstallArgs(e.target.value),
							placeholder: installingPath.toLowerCase().endsWith(".msi") ? "/qn /norestart" : "/S",
							className: "w-full mt-1 rounded bg-[var(--bg-surface)] border border-[var(--border-c)] px-2 py-1 text-[12px] mono focus:border-[var(--amber)] outline-none"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col justify-end self-stretch pb-0.5 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2 text-[12px] text-[var(--text)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: installAll,
								onChange: (e) => setInstallAll(e.target.checked),
								className: "rounded border-[var(--border-c)]"
							}), "Install on all servers"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: handleInstall,
								disabled: isLoading,
								className: "h-7 px-4 rounded bg-[var(--amber)] text-black text-[12px] font-medium hover:bg-[var(--amber-hover)] disabled:opacity-50",
								children: "Start Install"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setInstallingPath("");
									setInstallAll(false);
								},
								className: "h-7 px-3 ml-2 rounded border border-[var(--border-dim)] text-[var(--text-sub)] text-[12px] hover:text-[var(--text)]",
								children: "Cancel"
							})]
						})]
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "nx-card overflow-hidden mt-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative border-b border-[var(--border-c)] p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
					size: 13,
					className: "pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-sub)]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "Search…",
					className: "mono w-72 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] py-1.5 pl-8 pr-2 text-[12px] focus:border-[var(--amber)] focus:outline-none"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-auto flex-1 h-[calc(100vh-250px)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-[12px] relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "sticky top-0 bg-[#0a0f18]/95 backdrop-blur-sm z-10 shadow-[0_1px_0_var(--border-c)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "eyebrow text-left",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-2 cursor-pointer select-none hover:text-[var(--text)]",
									onClick: () => handleSort("name"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: ["Name ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { column: "name" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "cursor-pointer select-none hover:text-[var(--text)]",
									onClick: () => handleSort("publisher"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: ["Publisher ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { column: "publisher" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "cursor-pointer select-none hover:text-[var(--text)]",
									onClick: () => handleSort("version"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: ["Version ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { column: "version" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "cursor-pointer select-none hover:text-[var(--text)]",
									onClick: () => handleSort("installDate"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: ["Installed ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { column: "installDate" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Location" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "cursor-pointer select-none hover:text-[var(--text)]",
									onClick: () => handleSort("sizeMB"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: ["Size ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortIcon, { column: "sizeMB" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "w-10" })
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "mono",
						children: isLoading && apps.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 7,
							className: "py-4 text-center text-[var(--text-sub)]",
							children: "Loading apps..."
						}) }) : errorMsg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 7,
							className: "py-4 text-center text-red-400",
							children: errorMsg
						}) }) : sorted.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 7,
							className: "py-4 text-center text-[var(--text-sub)]",
							children: "No apps found"
						}) }) : sorted.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-[var(--border-dim)] hover:bg-[var(--bg-surface)] group",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-2 text-[var(--text)]",
									children: a.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "text-[var(--text-sub)]",
									children: a.publisher
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "text-[var(--amber)]",
									children: a.version
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "text-[var(--text-sub)]",
									children: a.installDate
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "truncate text-[var(--text-sub)] max-w-[200px]",
									title: a.location,
									children: a.location
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "text-[var(--text-sub)] whitespace-nowrap",
									children: [a.sizeMB, " MB"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "pr-4 py-2 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => handleUninstall(a),
										title: "Uninstall",
										className: "opacity-0 group-hover:opacity-100 text-[var(--text-sub)] hover:text-red-500 transition-opacity",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
									})
								})
							]
						}, a.id))
					})]
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RemoteFilePicker, {
			targetServer: server,
			isOpen: isPickerOpen,
			onOpenChange: setIsPickerOpen,
			onSelect: handleSelectInstaller
		})
	] });
}
//#endregion
export { AppsPage as component };
