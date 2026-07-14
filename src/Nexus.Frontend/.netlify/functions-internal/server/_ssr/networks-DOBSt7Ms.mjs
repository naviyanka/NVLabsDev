import { i as __toESM } from "../_runtime.mjs";
import { o as controlNetworkClient, w as getNetworksClient } from "./client-BFkup_sp.mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as PageWrapper, t as PageHeader } from "./PageWrapper-Dvl567y7.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { t as ServerSelector } from "./ServerSelector-ZbZTXmkM.mjs";
import { A as RefreshCw, N as Power, P as PowerOff, Pt as Cable, S as ShieldAlert, V as Network, q as LoaderCircle, r as Wifi } from "../_libs/lucide-react.mjs";
import { t as StatusBadge } from "./StatusBadge-DvNl1BAE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/networks-DOBSt7Ms.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function NetworksPage() {
	const [server, setServer] = (0, import_react.useState)("localhost");
	const [adapters, setAdapters] = (0, import_react.useState)([]);
	const [sel, setSel] = (0, import_react.useState)(0);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [actionLoading, setActionLoading] = (0, import_react.useState)(null);
	const fetchNetworks = (0, import_react.useCallback)(async () => {
		setLoading(true);
		try {
			const data = await getNetworksClient(server);
			setAdapters(data);
			if (sel >= data.length) setSel(0);
		} finally {
			setLoading(false);
		}
	}, [server, sel]);
	(0, import_react.useEffect)(() => {
		fetchNetworks();
	}, [fetchNetworks]);
	const handleAction = async (action) => {
		const a = adapters[sel];
		if (!a) return;
		if (action === "disable" && !window.confirm(`Are you sure you want to disable adapter ${a.name}? This might disconnect your server.`)) return;
		setActionLoading(action);
		const success = await controlNetworkClient(server, a.name, action);
		setActionLoading(null);
		if (success) await fetchNetworks();
		else alert(`Failed to ${action} adapter ${a.name}`);
	};
	const a = adapters[sel];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageWrapper, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Infrastructure",
			title: "Networks"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-4 mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServerSelector, {
				value: server,
				onChange: setServer
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: fetchNetworks,
				disabled: loading,
				className: "flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] text-[12px] text-[var(--text-sub)] transition-colors",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
					size: 14,
					className: loading ? "animate-spin text-[var(--amber)]" : ""
				}), "Refresh"]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "nx-card h-[calc(100vh-220px)] flex flex-col p-3 backdrop-blur-xl border border-[var(--border-dim)] shadow-lg overflow-y-auto",
				children: loading && adapters.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center justify-center flex-1 text-[var(--text-sub)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-8 h-8 animate-spin text-[var(--amber)] mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: "Scanning adapters..."
					})]
				}) : adapters.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center justify-center flex-1 text-[var(--text-sub)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "w-8 h-8 opacity-50 mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: "No adapters found."
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: adapters.map((ad, i) => {
						const Icon = ad.type === "WiFi" ? Wifi : ad.type === "Virtual" ? Network : Cable;
						const active = i === sel;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setSel(i),
							className: `flex w-full items-start gap-3 rounded-lg p-4 text-left transition-all duration-200 border ${active ? "bg-[var(--amber-low)] border-[var(--amber)]/30 shadow-md transform scale-[1.02]" : "border-transparent hover:bg-[var(--bg-surface)] hover:border-[var(--border-dim)]"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `p-2 rounded-lg ${active ? "bg-[var(--bg-card)] shadow-sm" : "bg-[var(--bg-surface)]"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									size: 18,
									className: ad.status === "Connected" ? "text-[var(--ok)]" : ad.status === "Disabled" ? "text-[var(--critical)]" : "text-[var(--text-sub)]"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `truncate font-medium text-[13px] ${active ? "text-[var(--amber)]" : "text-[var(--text)]"}`,
									children: ad.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mt-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mono text-[10px] uppercase tracking-wider text-[var(--text-sub)]",
										children: ad.status
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mono text-[10px] text-[var(--text-sub)]",
										children: ad.speedMbps >= 1e3 ? `${(ad.speedMbps / 1e3).toFixed(1)} Gbps` : `${Math.round(ad.speedMbps)} Mbps`
									})]
								})]
							})]
						}, ad.name);
					})
				})
			}), a ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "nx-card p-6 backdrop-blur-xl border border-[var(--border-dim)] shadow-xl relative overflow-hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `absolute top-0 left-0 w-full h-1 ${a.status === "Connected" ? "bg-gradient-to-r from-[var(--teal)] to-[var(--cyan)]" : a.status === "Disabled" ? "bg-gradient-to-r from-[var(--critical)] to-[var(--rose)]" : "bg-gradient-to-r from-gray-500 to-gray-400"} opacity-75` }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-start mb-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "eyebrow pb-1 text-[var(--text-sub)]",
									children: "IPv4 Configuration"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "display pb-1 text-xl font-bold",
									children: a.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[12px] text-[var(--text-sub)] mb-2",
									children: a.description
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, {
									status: a.status === "Connected" ? "online" : a.status === "Disabled" ? "critical" : "warning",
									children: a.status
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2 justify-end max-w-[200px]",
								children: [a.status === "Disabled" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
									action: "enable",
									label: "Enable",
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Power, { size: 14 }),
									loading: actionLoading,
									onClick: handleAction,
									variant: "ok"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
									action: "disable",
									label: "Disable",
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PowerOff, { size: 14 }),
									loading: actionLoading,
									onClick: handleAction,
									variant: "critical"
								}), a.dhcp && a.status === "Connected" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
									action: "release",
									label: "Release",
									loading: actionLoading,
									onClick: handleAction,
									variant: "neutral"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
									action: "renew",
									label: "Renew",
									loading: actionLoading,
									onClick: handleAction,
									variant: "neutral"
								})] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-dim)] shadow-inner",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "mono grid grid-cols-[100px_1fr] gap-y-3 text-[12px]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-[var(--text-sub)] uppercase text-[10px] tracking-wider pt-0.5",
										children: "IP Address"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "text-[var(--amber)] font-bold text-[13px]",
										children: a.ipv4 || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-[var(--text-sub)] uppercase text-[10px] tracking-wider pt-0.5",
										children: "Subnet"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "text-[var(--text)]",
										children: a.subnet || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-[var(--text-sub)] uppercase text-[10px] tracking-wider pt-0.5",
										children: "Gateway"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "text-[var(--text)]",
										children: a.gateway || "—"
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "mono grid grid-cols-[100px_1fr] gap-y-3 text-[12px]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-[var(--text-sub)] uppercase text-[10px] tracking-wider pt-0.5",
										children: "DNS"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "text-[var(--text)] break-words",
										children: a.dns.join(", ") || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-[var(--text-sub)] uppercase text-[10px] tracking-wider pt-0.5",
										children: "DHCP"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "text-[var(--text)]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `px-2 py-0.5 rounded-full text-[10px] font-semibold ${a.dhcp ? "bg-[var(--teal)]/20 text-[var(--teal)]" : "bg-[var(--border-dim)] text-[var(--text-sub)]"}`,
											children: a.dhcp ? "Enabled" : "Disabled"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-[var(--text-sub)] uppercase text-[10px] tracking-wider pt-0.5",
										children: "MAC"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "text-[var(--text-sub)]",
										children: a.mac || "—"
									})
								]
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 md:grid-cols-2 gap-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "nx-card p-6 backdrop-blur-xl border border-[var(--border-dim)] shadow-lg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "eyebrow pb-4 text-[var(--text-sub)] flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Bandwidth Usage" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityIndicator, { active: a.status === "Connected" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Bytes Received",
								value: a.bytesIn,
								color: "var(--teal)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Bytes Sent",
								value: a.bytesOut,
								color: "var(--amber)"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "nx-card p-6 backdrop-blur-xl border border-[var(--border-dim)] shadow-lg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "eyebrow pb-4 text-[var(--text-sub)]",
							children: "IPv6 Configuration"
						}), a.ipv6 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mono text-[13px] text-[var(--text)] bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-dim)] break-all shadow-inner",
							children: a.ipv6
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center justify-center h-16 text-[var(--text-sub)] text-[12px] italic bg-[var(--bg-surface)] rounded-lg border border-[var(--border-dim)] border-dashed",
							children: "IPv6 Not Configured"
						})]
					})]
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "nx-card h-[calc(100vh-220px)] flex flex-col items-center justify-center p-6 backdrop-blur-xl border border-[var(--border-dim)] shadow-lg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Network, { className: "w-16 h-16 opacity-10 mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[var(--text-sub)]",
					children: "Select a network adapter to view details"
				})]
			})]
		})
	] });
}
function Stat({ label, value, color }) {
	const gb = value > 1073741824;
	const valStr = gb ? (value / 1073741824).toFixed(2) : (value / 1048576).toFixed(1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-dim)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "eyebrow pb-2 text-[var(--text-sub)]",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "display text-[24px] font-bold tracking-tight",
			style: { color },
			children: [valStr, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[12px] font-medium text-[var(--text-sub)] ml-1",
				children: gb ? "GB" : "MB"
			})]
		})]
	});
}
function ActivityIndicator({ active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [active && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-1.5 h-1.5 rounded-full bg-[var(--teal)] animate-ping absolute" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-1.5 h-1.5 rounded-full bg-[var(--teal)] relative" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[10px] uppercase tracking-wider text-[var(--text-sub)]",
			children: active ? "Live" : "Offline"
		})]
	});
}
function ActionButton({ action, label, icon, loading, onClick, variant }) {
	const isL = loading === action;
	let colors = "border-[var(--border-c)] text-[var(--text-sub)] hover:border-[var(--text)] hover:text-[var(--text)]";
	if (variant === "ok") colors = "border-[var(--border-dim)] text-[var(--ok)] hover:bg-[var(--ok)]/10 hover:border-[var(--ok)]";
	if (variant === "critical") colors = "border-[var(--border-dim)] text-[var(--critical)] hover:bg-[var(--critical)]/10 hover:border-[var(--critical)]";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick: () => onClick(action),
		disabled: loading !== null,
		className: `flex items-center gap-1.5 mono rounded-md border bg-[var(--bg-surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] font-semibold transition-all shadow-sm ${colors} ${loading !== null && !isL ? "opacity-50 cursor-not-allowed" : ""}`,
		children: [isL ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
			size: 12,
			className: "animate-spin"
		}) : icon, label]
	});
}
//#endregion
export { NetworksPage as component };
