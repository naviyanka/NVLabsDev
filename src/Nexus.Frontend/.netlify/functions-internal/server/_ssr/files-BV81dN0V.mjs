import { i as __toESM } from "../_runtime.mjs";
import { $ as uploadFileClient, H as moveFileClient, U as readTextFileClient, W as renameFileClient, b as getFilesSourcesClient, c as copyFileClient, l as createFolderClient, tt as writeTextFileClient, u as deleteFileClient, v as getDownloadUrl, y as getFilesListClient } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { F as Plus, H as MoveRight, L as Pen, O as Save, at as FolderOpen, d as Type, ht as Copy, it as FolderPlus, kt as ChevronRight, l as Upload, lt as Ellipsis, n as X, ot as File, p as Trash2, rt as Folder, st as FilePlus, ut as Download } from "../_libs/lucide-react.mjs";
import { t as Route } from "./files-meeEwPxJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/files-BV81dN0V.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function formatBytes(bytes, decimals = 2) {
	if (!+bytes) return "0 Bytes";
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = [
		"Bytes",
		"KB",
		"MB",
		"GB",
		"TB",
		"PB",
		"EB",
		"ZB",
		"YB"
	];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
function isTextFile(ext) {
	return [
		"txt",
		"json",
		"md",
		"csv",
		"ps1",
		"bat",
		"cmd",
		"xml",
		"ini",
		"log",
		"yaml",
		"yml",
		"js",
		"ts",
		"html",
		"css"
	].includes(ext.toLowerCase());
}
function PromptDialog({ isOpen, title, description, initialValue, placeholder, onConfirm, onCancel, confirmLabel = "Save" }) {
	const [value, setValue] = (0, import_react.useState)(initialValue || "");
	(0, import_react.useEffect)(() => {
		if (isOpen) setValue(initialValue || "");
	}, [isOpen, initialValue]);
	if (!isOpen) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "eyebrow text-[var(--text)]",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onCancel,
					className: "text-[var(--text-sub)] hover:text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-5",
				children: [
					description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[12px] text-[var(--text-sub)] mb-3",
						children: description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						autoFocus: true,
						value,
						onChange: (e) => setValue(e.target.value),
						placeholder,
						onKeyDown: (e) => {
							if (e.key === "Enter") onConfirm(value);
							if (e.key === "Escape") onCancel();
						},
						className: "mono w-full rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus:border-[var(--amber)]"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex justify-end gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onCancel,
							className: "rounded px-4 py-1.5 text-[12px] font-medium text-[var(--text-sub)] hover:text-white",
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onConfirm(value),
							className: "rounded bg-[var(--amber)] px-4 py-1.5 text-[12px] font-semibold text-black hover:bg-[var(--amber-hover)]",
							children: confirmLabel
						})]
					})
				]
			})]
		})
	});
}
function FolderPickerDialog({ isOpen, server, title, initialPath, onConfirm, onCancel }) {
	const [sources, setSources] = (0, import_react.useState)([]);
	const [currentPath, setCurrentPath] = (0, import_react.useState)([]);
	const [folders, setFolders] = (0, import_react.useState)([]);
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (isOpen) {
			if (initialPath) setCurrentPath(initialPath.split("\\").filter(Boolean));
			getFilesSourcesClient(server).then(setSources).catch(console.error);
		}
	}, [
		isOpen,
		server,
		initialPath
	]);
	(0, import_react.useEffect)(() => {
		if (isOpen && currentPath.length > 0) {
			setIsLoading(true);
			getFilesListClient(server, currentPath.join("\\")).then((data) => setFolders(data.filter((f) => f.type === "folder"))).catch(() => setFolders([])).finally(() => setIsLoading(false));
		} else setFolders([]);
	}, [
		isOpen,
		currentPath,
		server
	]);
	if (!isOpen) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-[60vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow text-[var(--text)]",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onCancel,
						className: "text-[var(--text-sub)] hover:text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-1 overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "w-48 border-r border-[var(--border-c)] bg-[var(--bg-surface)]/50 p-2 overflow-y-auto",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "eyebrow mb-2 px-2 text-[10px]",
							children: "Sources"
						}), sources.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setCurrentPath([s.path]),
							className: `flex w-full items-center gap-2 rounded px-2 py-1.5 text-[12px] ${currentPath[0] === s.path ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)] hover:bg-[var(--border-c)] hover:text-white"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, {
									size: 12,
									className: s.type === "Disk" ? "text-[var(--amber)]" : "text-[var(--teal)]"
								}),
								" ",
								s.name
							]
						}, s.path))]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-1 flex-col overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-b border-[var(--border-c)] p-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mono text-[11px] text-[var(--text-sub)] overflow-x-auto whitespace-nowrap hide-scrollbar flex items-center gap-1",
								children: currentPath.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setCurrentPath(currentPath.slice(0, i + 1)),
										className: "hover:text-[var(--amber)]",
										children: p
									}), i < currentPath.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 10 })]
								}, i))
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 overflow-y-auto p-2",
							children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-center text-[12px] text-[var(--text-sub)] p-4",
								children: "Loading..."
							}) : folders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-center text-[12px] text-[var(--text-sub)] p-4",
								children: "No folders"
							}) : folders.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onDoubleClick: () => setCurrentPath([...currentPath, f.name]),
								className: "flex w-full items-center gap-2 rounded p-2 text-left text-[12px] text-[var(--text)] hover:bg-[var(--bg-surface)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, {
									size: 14,
									className: "text-[var(--amber)]"
								}), f.name]
							}, f.name))
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-t border-[var(--border-c)] bg-[var(--bg-surface)] p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mono text-[11px] text-[var(--text-sub)] truncate max-w-[300px]",
						children: ["Target: ", currentPath.join("\\")]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onCancel,
							className: "rounded px-4 py-1.5 text-[12px] font-medium text-[var(--text-sub)] hover:text-white",
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onConfirm(currentPath.join("\\")),
							disabled: currentPath.length === 0,
							className: "rounded bg-[var(--amber)] px-4 py-1.5 text-[12px] font-semibold text-black hover:bg-[var(--amber-hover)] disabled:opacity-50",
							children: "Select Folder"
						})]
					})]
				})
			]
		})
	});
}
function FilesPage() {
	const { path: queryPath } = Route.useSearch();
	const [server, setServer] = (0, import_react.useState)("dc");
	const [sources, setSources] = (0, import_react.useState)([]);
	const [path, setPath] = (0, import_react.useState)(queryPath ? queryPath.split("\\").filter(Boolean) : []);
	const [pathInput, setPathInput] = (0, import_react.useState)("");
	const [files, setFiles] = (0, import_react.useState)([]);
	const [selectedFile, setSelectedFile] = (0, import_react.useState)(null);
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	const [isEditorOpen, setIsEditorOpen] = (0, import_react.useState)(false);
	const [editorContent, setEditorContent] = (0, import_react.useState)("");
	const [editorFile, setEditorFile] = (0, import_react.useState)(null);
	const [isSaving, setIsSaving] = (0, import_react.useState)(false);
	const [promptState, setPromptState] = (0, import_react.useState)({
		isOpen: false,
		type: null,
		title: "",
		description: "",
		initialValue: "",
		placeholder: ""
	});
	const [folderPickerState, setFolderPickerState] = (0, import_react.useState)({
		isOpen: false,
		type: null,
		title: ""
	});
	const fileInputRef = (0, import_react.useRef)(null);
	const fetchSources = async () => {
		try {
			const data = await getFilesSourcesClient(server);
			setSources(data);
			if (data.length > 0 && path.length === 0 && !queryPath) setPath([data[0].path]);
		} catch (e) {
			console.error(e);
		}
	};
	const fetchFiles = async () => {
		if (path.length === 0) return;
		setIsLoading(true);
		setSelectedFile(null);
		try {
			setFiles(await getFilesListClient(server, path.join("\\")));
		} catch (e) {
			console.error(e);
			setFiles([]);
		} finally {
			setIsLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		fetchSources();
	}, [server]);
	(0, import_react.useEffect)(() => {
		setPathInput(path.join("\\"));
		fetchFiles();
	}, [path, server]);
	const handleCreateFolder = () => {
		setPromptState({
			isOpen: true,
			type: "newFolder",
			title: "New Folder",
			description: "Enter a name for the new folder.",
			initialValue: "",
			placeholder: "New folder"
		});
	};
	const handleRename = () => {
		if (!selectedFile) return;
		setPromptState({
			isOpen: true,
			type: "rename",
			title: "Rename",
			description: `Enter a new name for ${selectedFile.name}.`,
			initialValue: selectedFile.name,
			placeholder: "New name"
		});
	};
	const handleMove = () => {
		if (!selectedFile) return;
		setFolderPickerState({
			isOpen: true,
			type: "move",
			title: `Move ${selectedFile.name} To...`
		});
	};
	const handleCopy = () => {
		if (!selectedFile) return;
		setFolderPickerState({
			isOpen: true,
			type: "copy",
			title: `Copy ${selectedFile.name} To...`
		});
	};
	const handlePromptConfirm = async (val) => {
		if (!val) return;
		const { type } = promptState;
		setPromptState((p) => ({
			...p,
			isOpen: false
		}));
		try {
			if (type === "newFolder") await createFolderClient(server, path.join("\\"), val);
			else if (type === "newFile") await writeTextFileClient(server, path.join("\\") + "\\" + val, "");
			else if (type === "rename" && selectedFile && val !== selectedFile.name) await renameFileClient(server, path.join("\\") + "\\" + selectedFile.name, val);
			fetchFiles();
		} catch (e) {
			alert(`Operation failed: ${e.message || "Unknown error"}`);
		}
	};
	const handleFolderPickerConfirm = async (destPath) => {
		if (!destPath || !selectedFile) return;
		const { type } = folderPickerState;
		setFolderPickerState((p) => ({
			...p,
			isOpen: false
		}));
		try {
			if (type === "move" && destPath !== path.join("\\")) await moveFileClient(server, path.join("\\") + "\\" + selectedFile.name, destPath + "\\" + selectedFile.name);
			else if (type === "copy") {
				let fullDest = destPath;
				if (!fullDest.endsWith("\\" + selectedFile.name)) fullDest = fullDest + "\\" + selectedFile.name;
				if (fullDest === path.join("\\") + "\\" + selectedFile.name) fullDest = path.join("\\") + "\\Copy of " + selectedFile.name;
				await copyFileClient(server, path.join("\\") + "\\" + selectedFile.name, fullDest);
			}
			fetchFiles();
		} catch (e) {
			alert(`Operation failed: ${e.message || "Unknown error"}`);
		}
	};
	const handleDelete = async () => {
		if (!selectedFile) return;
		if (!confirm(`Are you sure you want to delete ${selectedFile.name}?`)) return;
		try {
			await deleteFileClient(server, path.join("\\") + "\\" + selectedFile.name);
			fetchFiles();
		} catch (e) {
			alert("Failed to delete");
		}
	};
	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};
	const handleFileChange = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setIsLoading(true);
		try {
			await uploadFileClient(server, path.join("\\"), file);
			fetchFiles();
		} catch (err) {
			alert("Failed to upload");
		} finally {
			setIsLoading(false);
		}
		if (fileInputRef.current) fileInputRef.current.value = "";
	};
	const openEditor = async (fileName) => {
		setEditorFile(fileName);
		setEditorContent("Loading...");
		setIsEditorOpen(true);
		try {
			setEditorContent(await readTextFileClient(server, path.join("\\") + "\\" + fileName));
		} catch (e) {
			setEditorContent("Failed to load file. It might be binary or too large.");
		}
	};
	const saveEditor = async () => {
		if (!editorFile) return;
		setIsSaving(true);
		try {
			await writeTextFileClient(server, path.join("\\") + "\\" + editorFile, editorContent);
			alert("File saved successfully.");
			setIsEditorOpen(false);
			fetchFiles();
		} catch (e) {
			alert("Failed to save file.");
		} finally {
			setIsSaving(false);
		}
	};
	const handleOpenItem = (f) => {
		if (f.type === "folder") setPath([...path, f.name]);
		else if (isTextFile(f.type)) openEditor(f.name);
		else window.open(getDownloadUrl(server, path.join("\\") + "\\" + f.name), "_blank");
	};
	const handleDownload = () => {
		if (!selectedFile) return;
		window.open(getDownloadUrl(server, path.join("\\") + "\\" + selectedFile.name), "_blank");
	};
	const disks = sources.filter((s) => s.type === "Disk");
	const shares = sources.filter((s) => s.type === "Share");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Management",
			title: "Files"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
			value: server,
			onChange: setServer
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-[240px_1fr] gap-5 pt-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "nx-card h-fit p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow px-1 pb-2",
						children: "This PC"
					}),
					disks.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setPath([d.path]),
						title: `Open ${d.name}`,
						className: `flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] transition-colors hover:bg-[var(--amber-low)]/50 hover:text-[var(--amber)] ${path[0] === d.path ? "bg-[var(--amber-low)] text-[var(--amber)]" : "text-[var(--text-sub)]"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, {
								size: 13,
								className: "text-[var(--amber)]"
							}),
							" ",
							d.name
						]
					}, d.path)),
					shares.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "eyebrow px-1 pb-2 pt-4",
						children: "Network Shares"
					}), shares.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setPath([d.path]),
						title: `Open Network Share ${d.name}`,
						className: `flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] transition-colors hover:bg-[var(--teal-low)]/50 hover:text-[var(--teal)] ${path[0] === d.path ? "bg-[var(--teal-low)] text-[var(--teal)]" : "text-[var(--text-sub)]"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, {
								size: 13,
								className: "text-[var(--teal)]"
							}),
							" ",
							d.name
						]
					}, d.path))] })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "nx-card flex flex-col h-[calc(100vh-200px)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between border-b border-[var(--border-c)] p-3 bg-[var(--bg-card)] gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 flex items-center gap-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							value: pathInput,
							onChange: (e) => setPathInput(e.target.value),
							onKeyDown: (e) => {
								if (e.key === "Enter") setPath(pathInput.split("\\").filter(Boolean));
							},
							title: "Type path here and press Enter to navigate",
							className: "mono w-full flex-1 rounded border border-[var(--border-c)] bg-[var(--bg-surface)] px-3 py-1.5 text-[12px] text-[var(--text)] outline-none focus:border-[var(--amber)] transition-colors hover:border-[var(--amber-low)]",
							placeholder: "C:\\Path\\To\\Folder"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "file",
								ref: fileInputRef,
								className: "hidden",
								onChange: handleFileChange
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative group",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TBtn, {
									icon: Plus,
									label: "",
									title: "Create New (Folder/File)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "absolute right-0 top-full mt-1 hidden w-40 flex-col overflow-hidden rounded border border-[var(--border-c)] bg-[var(--bg-card)] shadow-xl group-hover:flex z-50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: handleCreateFolder,
										title: "Create a new folder in this directory",
										className: "flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPlus, { size: 14 }), " New Folder"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => {
											setPromptState({
												isOpen: true,
												type: "newFile",
												title: "New File",
												description: "Enter a name for the new file.",
												initialValue: "",
												placeholder: "newfile.txt"
											});
										},
										title: "Create a new text file",
										className: "flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilePlus, { size: 14 }), " New File"]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative group",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TBtn, {
									icon: Ellipsis,
									label: "",
									title: "More Actions"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "absolute right-0 top-full mt-1 hidden w-40 flex-col overflow-hidden rounded border border-[var(--border-c)] bg-[var(--bg-card)] shadow-xl group-hover:flex z-50",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: handleUploadClick,
											title: "Upload file to this folder",
											className: "flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { size: 14 }), " Upload"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-1 h-[1px] bg-[var(--border-dim)]" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: handleDownload,
											disabled: !selectedFile,
											title: "Download selected item",
											className: "flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)] disabled:opacity-50",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 14 }), " Download"]
										}),
										selectedFile?.type === "folder" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => handleOpenItem(selectedFile),
											title: "Open selected folder",
											className: "flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { size: 14 }), " Open"]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => selectedFile && openEditor(selectedFile.name),
											disabled: !selectedFile || !isTextFile(selectedFile.type),
											title: "Edit selected text file",
											className: "flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)] disabled:opacity-50",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { size: 14 }), " Edit"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: handleRename,
											disabled: !selectedFile,
											title: "Rename selected item",
											className: "flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)] disabled:opacity-50",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, { size: 14 }), " Rename"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: handleCopy,
											disabled: !selectedFile,
											title: "Copy selected item to another location",
											className: "flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)] disabled:opacity-50",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { size: 14 }), " Copy"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: handleMove,
											disabled: !selectedFile,
											title: "Move selected item to another location",
											className: "flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--amber-low)] hover:text-[var(--amber)] disabled:opacity-50",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoveRight, { size: 14 }), " Move"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-1 h-[1px] bg-[var(--border-dim)]" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: handleDelete,
											disabled: !selectedFile,
											title: "Delete selected item",
											className: "flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--red)] transition-colors hover:bg-[var(--crit)]/20 hover:text-[var(--crit)] disabled:opacity-50",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 }), " Delete"]
										})
									]
								})]
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-auto flex-1 outline-none",
					onClick: (e) => {
						if (e.target === e.currentTarget) setSelectedFile(null);
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-[12px] relative select-none",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "sticky top-0 bg-[var(--bg-card)]/95 backdrop-blur-sm z-10 shadow-[0_1px_0_var(--border-c)]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "eyebrow text-left",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-4 py-2 font-normal",
										children: "Name"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "font-normal",
										children: "Type"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "font-normal",
										children: "Size"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "font-normal",
										children: "Modified"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "font-normal",
										children: "Attributes"
									})
								]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "mono",
							children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 5,
								className: "py-4 text-center text-[var(--text-sub)]",
								children: "Loading..."
							}) }) : files.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 5,
								className: "py-4 text-center text-[var(--text-sub)]",
								children: "Folder is empty"
							}) }) : files.map((f) => {
								const isSelected = selectedFile?.name === f.name;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									onClick: (e) => {
										e.stopPropagation();
										setSelectedFile(f);
									},
									onDoubleClick: (e) => {
										e.stopPropagation();
										handleOpenItem(f);
									},
									title: `Double-click to open ${f.name}`,
									className: `cursor-pointer border-b border-[var(--border-dim)] transition-colors ${isSelected ? "bg-[var(--amber-low)]/40" : "hover:bg-[var(--amber-low)]/15"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "flex items-center gap-2 px-4 py-2 text-[var(--text)]",
											children: [f.type === "folder" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, {
												size: 13,
												className: "text-[var(--amber)]"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(File, {
												size: 13,
												className: "text-[var(--text-sub)]"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: isSelected ? "text-[var(--amber)] font-medium" : "",
												children: f.name
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--text-sub)]",
											children: f.type === "folder" ? "File folder" : f.type.toUpperCase() + " File"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--text-sub)]",
											children: f.type === "folder" ? "" : formatBytes(f.size)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--text-sub)]",
											children: f.modified
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "text-[var(--text-sub)]",
											children: f.attrs
										})
									]
								}, f.name);
							})
						})]
					})
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptDialog, {
			isOpen: promptState.isOpen,
			title: promptState.title,
			description: promptState.description,
			initialValue: promptState.initialValue,
			placeholder: promptState.placeholder,
			onConfirm: handlePromptConfirm,
			onCancel: () => setPromptState((p) => ({
				...p,
				isOpen: false
			})),
			confirmLabel: "Confirm"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPickerDialog, {
			isOpen: folderPickerState.isOpen,
			server,
			title: folderPickerState.title,
			initialPath: path.join("\\"),
			onConfirm: handleFolderPickerConfirm,
			onCancel: () => setFolderPickerState((p) => ({
				...p,
				isOpen: false
			}))
		}),
		isEditorOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-[80vh] w-[80vw] flex-col overflow-hidden rounded-xl border border-[var(--border-c)] bg-[var(--bg-card)] shadow-2xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mono flex items-center gap-2 text-[12px] text-[var(--text)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, {
								size: 14,
								className: "text-[var(--amber)]"
							}),
							"Editing: ",
							editorFile
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TBtn, {
							icon: Save,
							label: isSaving ? "Saving..." : "Save",
							onClick: saveEditor,
							disabled: isSaving
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setIsEditorOpen(false),
							className: "rounded p-1 text-[var(--text-sub)] hover:bg-[var(--border-dim)] hover:text-white",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 16 })
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					className: "mono h-full w-full resize-none bg-transparent p-4 text-[13px] text-[var(--text)] outline-none",
					value: editorContent,
					onChange: (e) => setEditorContent(e.target.value),
					spellCheck: false
				})]
			})
		})
	] });
}
function TBtn({ icon: Icon, label, onClick, disabled, title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		disabled,
		title: title || label || "Options",
		className: `mono flex items-center gap-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors ${disabled ? "opacity-50 cursor-not-allowed text-[var(--text-sub)]" : "text-[var(--text)] hover:border-[var(--amber)] hover:bg-[var(--amber-low)] hover:text-[var(--amber)]"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 12 }),
			" ",
			label
		]
	});
}
//#endregion
export { FilesPage as component };
