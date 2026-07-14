import { i as __toESM } from "../_runtime.mjs";
import { g as getCertificatesClient } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { Bt as ArrowUpZA, E as Search, Gt as ArrowDownAZ, q as LoaderCircle, x as ShieldCheck } from "../_libs/lucide-react.mjs";
import { t as StatusBadge } from "./StatusBadge-DvNl1BAE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/certificates-D_3KyOLL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function expiryStatus(to) {
	const days = Math.round((new Date(to).getTime() - Date.now()) / (1e3 * 60 * 60 * 24));
	if (days < 0) return {
		label: "Expired",
		status: "critical"
	};
	if (days < 30) return {
		label: `Expires in ${days}d`,
		status: "warning"
	};
	return {
		label: `${days}d remaining`,
		status: "online"
	};
}
function CertificatesPage() {
	const [server, setServer] = (0, import_react.useState)("localhost");
	const [certs, setCerts] = (0, import_react.useState)([]);
	const [sel, setSel] = (0, import_react.useState)(null);
	const [store, setStore] = (0, import_react.useState)("Personal");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const [sortCol, setSortCol] = (0, import_react.useState)("subject");
	const [sortAsc, setSortAsc] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		setLoading(true);
		getCertificatesClient(server, store).then((data) => {
			setCerts(data);
			setSel(null);
		}).catch((err) => {
			console.error("Failed to load certificates", err);
		}).finally(() => {
			setLoading(false);
		});
	}, [server, store]);
	const filteredCerts = (0, import_react.useMemo)(() => {
		let result = certs;
		if (search) {
			const q = search.toLowerCase();
			result = result.filter((c) => c.subject.toLowerCase().includes(q) || c.issuer.toLowerCase().includes(q));
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
		certs,
		search,
		sortCol,
		sortAsc
	]);
	const toggleSort = (col) => {
		if (sortCol === col) setSortAsc(!sortAsc);
		else {
			setSortCol(col);
			setSortAsc(true);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Security",
			title: "Certificates"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
			value: server,
			onChange: setServer
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex flex-wrap items-center justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 p-1 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg backdrop-blur-md",
				children: [
					"Personal",
					"Trusted Root CAs",
					"Intermediate CAs",
					"Enterprise Trust"
				].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setStore(s),
					className: `mono rounded-md px-4 py-2 text-[12px] font-medium transition-all duration-300 ${s === store ? "bg-[var(--amber-low)] text-[var(--amber)] shadow-sm" : "text-[var(--text-sub)] hover:text-[var(--text)] hover:bg-[var(--bg-surface)]"}`,
					children: s
				}, s))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-sub)]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					placeholder: "Search certificates...",
					value: search,
					onChange: (e) => setSearch(e.target.value),
					className: "w-64 bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--amber)] transition-colors text-[var(--text)] placeholder:text-[var(--text-sub)]"
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
										onClick: () => toggleSort("subject"),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1",
											children: ["Subject ", sortCol === "subject" && (sortAsc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownAZ, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpZA, { className: "w-4 h-4" }))]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group",
										onClick: () => toggleSort("issuer"),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1",
											children: ["Issuer ", sortCol === "issuer" && (sortAsc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownAZ, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpZA, { className: "w-4 h-4" }))]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-5 py-3 cursor-pointer hover:text-[var(--text)] transition-colors group",
										onClick: () => toggleSort("to"),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1",
											children: ["Valid To ", sortCol === "to" && (sortAsc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownAZ, { className: "w-4 h-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpZA, { className: "w-4 h-4" }))]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-5 py-3",
										children: "Status"
									})
								]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "mono",
							children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								colSpan: 4,
								className: "px-5 py-12 text-center text-[var(--text-sub)]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-6 h-6 animate-spin mx-auto mb-2 text-[var(--amber)]" }),
									"Fetching certificates from ",
									server,
									"..."
								]
							}) }) : filteredCerts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 4,
								className: "px-5 py-12 text-center text-[var(--text-sub)]",
								children: "No certificates found."
							}) }) : filteredCerts.map((c) => {
								const e = expiryStatus(c.to);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									onClick: () => setSel(c),
									className: `cursor-pointer border-b border-[var(--border-dim)] transition-colors duration-200 ${sel?.id === c.id ? "bg-[var(--amber-low)]" : "hover:bg-[var(--bg-surface)]"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-5 py-3 font-medium text-[var(--text)] truncate max-w-[200px]",
											title: c.subject,
											children: c.subject
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-5 py-3 text-[var(--text-sub)] truncate max-w-[150px]",
											title: c.issuer,
											children: c.issuer
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-5 py-3 text-[var(--text-sub)]",
											children: c.to
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-5 py-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, {
												status: e.status,
												children: e.label
											})
										})
									]
								}, c.id);
							})
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-3 border-t border-[var(--border-dim)] text-xs text-[var(--text-sub)] bg-[var(--bg-surface)]",
					children: ["Total Certificates: ", filteredCerts.length]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "nx-card h-fit p-6 backdrop-blur-xl border border-[var(--border-dim)] shadow-2xl relative overflow-hidden group",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--amber)] to-[var(--rose)] opacity-50" }), sel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "animate-in fade-in slide-in-from-right-4 duration-500",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-3 bg-[var(--bg-surface)] rounded-xl text-[var(--amber)] border border-[var(--border-dim)]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-6 h-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "eyebrow text-[var(--text-sub)]",
							children: "Certificate Details"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "display break-all text-sm font-semibold leading-tight",
							children: sel.subject
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-4 mt-6 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-dim)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mono space-y-4 text-[12px]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									k: "Issuer",
									v: sel.issuer
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									k: "Valid From",
									v: sel.from
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									k: "Valid To",
									v: sel.to
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									k: "Thumbprint",
									v: sel.thumbprint
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									k: "Purpose",
									v: sel.purpose
								})
							]
						})
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "py-16 text-center text-[var(--text-sub)] flex flex-col items-center justify-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-12 h-12 mb-4 opacity-20" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: "Select a certificate to view details"
					})]
				})]
			})]
		})
	] });
}
function Field({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-1 border-b border-[var(--border-dim)] pb-3 last:border-0 last:pb-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-[var(--text-sub)] font-medium uppercase tracking-wider text-[10px]",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "break-all text-[var(--text)] font-semibold",
			children: v
		})]
	});
}
//#endregion
export { CertificatesPage as component };
