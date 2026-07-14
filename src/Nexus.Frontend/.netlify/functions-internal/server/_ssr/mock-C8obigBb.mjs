//#region node_modules/.nitro/vite/services/ssr/assets/mock-C8obigBb.js
var delay = (ms = 400 + Math.random() * 400) => new Promise((r) => setTimeout(r, ms));
var MOCK_SERVERS = [
	{
		id: "dc01",
		name: "DC01",
		ip: "192.168.0.10",
		role: "Domain Controller",
		os: "Windows Server 2019",
		status: "online",
		cpu: 34,
		mem: 61,
		disk: 45,
		uptime: "47d 3h",
		site: "nexuslab.local"
	},
	{
		id: "nexus01",
		name: "NEXUS01",
		ip: "192.168.0.20",
		role: "Management Server",
		os: "Windows Server 2022",
		status: "online",
		cpu: 58,
		mem: 74,
		disk: 62,
		uptime: "12d 7h",
		site: "nexuslab.local"
	},
	{
		id: "sql01",
		name: "SQL01",
		ip: "192.168.0.30",
		role: "SQL Database",
		os: "Windows Server 2019",
		status: "warning",
		cpu: 87,
		mem: 82,
		disk: 78,
		uptime: "3d 14h",
		site: "nexuslab.local"
	},
	{
		id: "web01",
		name: "WEB01",
		ip: "192.168.0.40",
		role: "IIS Web Server",
		os: "Windows Server 2022",
		status: "online",
		cpu: 22,
		mem: 45,
		disk: 33,
		uptime: "22d 1h",
		site: "nexuslab.local"
	},
	{
		id: "fs01",
		name: "FS01",
		ip: "192.168.0.50",
		role: "File Server",
		os: "Windows Server 2016",
		status: "critical",
		cpu: 96,
		mem: 91,
		disk: 95,
		uptime: "61d 9h",
		site: "nexuslab.local"
	}
];
function rand(seed) {
	let x = Math.sin(seed) * 1e4;
	return x - Math.floor(x);
}
var SOURCES = [
	"Service Control Manager",
	"Microsoft-Windows-Kernel-General",
	"Microsoft-Windows-Security-Auditing",
	"Microsoft-Windows-WinINet",
	"Disk",
	"NTFS",
	"Schannel",
	"DNS Server",
	"TermService",
	"Microsoft-Windows-Hyper-V-VMMS"
];
var MSGS = [
	"The service entered the running state.",
	"Volume shadow copy created successfully.",
	"Failed login attempt from 10.4.21.88 — bad credentials.",
	"Disk read error detected on volume D:.",
	"Certificate chain validation failed for endpoint backup.nexuslab.local.",
	"DNS zone transferred from primary.",
	"Remote Desktop session initiated for NVLABS\\Administrator.",
	"Update KB5034441 installed successfully.",
	"VM 'BUILD-AGENT-04' state changed to Running.",
	"Memory pressure threshold exceeded — recommend investigation."
];
async function getEvents(serverId, log = "System", limit = 60) {
	await delay(200);
	const base = serverId.charCodeAt(0) + log.length;
	return Array.from({ length: limit }, (_, i) => {
		const r = rand(base + i);
		const level = r > .85 ? "Critical" : r > .7 ? "Error" : r > .5 ? "Warning" : r > .05 ? "Information" : "Verbose";
		const t = /* @__PURE__ */ new Date(Date.now() - i * 1e3 * 60 * (1 + rand(i) * 30));
		return {
			id: `${serverId}-${log}-${i}`,
			time: t.toISOString(),
			level,
			source: SOURCES[i % SOURCES.length],
			eventId: 1e3 + Math.floor(r * 8e3),
			category: log,
			message: MSGS[i % MSGS.length],
			xml: `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="${SOURCES[i % SOURCES.length]}"/><EventID>${1e3 + Math.floor(r * 8e3)}</EventID><Level>${level}</Level></System></Event>`
		};
	});
}
var FW_NAMES = [
	"Remote Desktop",
	"File and Printer Sharing",
	"Windows Remote Management",
	"SQL Server",
	"IIS HTTPS",
	"DNS",
	"DHCP",
	"SMB-In",
	"WinRM-HTTPS",
	"Hyper-V Replica HTTPS",
	"Block Inbound SMBv1",
	"Block RDP from Internet",
	"Allow SSH",
	"ICMPv4 Echo",
	"Failover Cluster"
];
async function getFirewallRules(serverId) {
	await delay();
	const base = serverId.charCodeAt(0);
	return FW_NAMES.map((name, i) => ({
		id: `${serverId}-fw-${i}`,
		name,
		enabled: rand(base + i) > .2,
		profile: [
			"Domain",
			"Private",
			"Public",
			"All"
		][i % 4],
		protocol: [
			"TCP",
			"UDP",
			"ICMP",
			"Any"
		][i % 4],
		localPort: [
			"3389",
			"445",
			"5985,5986",
			"1433",
			"443",
			"53",
			"67-68",
			"Any"
		][i % 8],
		remoteIp: i % 3 === 0 ? "Any" : "192.168.0.0/24",
		action: name.startsWith("Block") ? "Block" : "Allow",
		direction: i % 5 === 0 ? "Outbound" : "Inbound"
	}));
}
async function toggleFirewallRule(_s, _id, _enabled) {
	await delay();
}
async function getDevices(_s) {
	await delay();
	return [
		{
			category: "Processors",
			name: "Intel(R) Xeon(R) Gold 6248R CPU @ 3.00GHz",
			manufacturer: "Intel",
			status: "OK",
			driverVersion: "10.0.20348.1",
			driverDate: "2024-04-12"
		},
		{
			category: "Disk drives",
			name: "Samsung SSD 980 PRO 1TB",
			manufacturer: "Samsung",
			status: "OK",
			driverVersion: "10.0.20348.1",
			driverDate: "2024-03-08"
		},
		{
			category: "Display adapters",
			name: "Microsoft Hyper-V Video",
			manufacturer: "Microsoft",
			status: "OK",
			driverVersion: "10.0.20348.169",
			driverDate: "2024-06-20"
		},
		{
			category: "Network adapters",
			name: "Intel(R) 82574L Gigabit Network Connection",
			manufacturer: "Intel",
			status: "OK",
			driverVersion: "12.18.9.23",
			driverDate: "2023-11-02"
		},
		{
			category: "Network adapters",
			name: "Microsoft Hyper-V Network Adapter",
			manufacturer: "Microsoft",
			status: "OK",
			driverVersion: "10.0.20348.1",
			driverDate: "2024-02-19"
		},
		{
			category: "System devices",
			name: "ACPI Fixed Feature Button",
			manufacturer: "Microsoft",
			status: "OK",
			driverVersion: "10.0.20348.1",
			driverDate: "2024-02-19"
		},
		{
			category: "System devices",
			name: "Unknown Device",
			manufacturer: "—",
			status: "Warning",
			driverVersion: "—",
			driverDate: "—"
		}
	];
}
async function getVMs(_s) {
	await delay();
	return [
		{
			id: "vm1",
			name: "BUILD-AGENT-01",
			status: "Running",
			os: "Windows Server 2022",
			cpu: 28,
			memMB: 8192,
			uptime: "12d 4h"
		},
		{
			id: "vm2",
			name: "BUILD-AGENT-02",
			status: "Running",
			os: "Windows Server 2022",
			cpu: 41,
			memMB: 8192,
			uptime: "12d 4h"
		},
		{
			id: "vm3",
			name: "ANSIBLE-CTL",
			status: "Stopped",
			os: "Ubuntu 22.04",
			cpu: 0,
			memMB: 4096,
			uptime: "—"
		},
		{
			id: "vm4",
			name: "JUMPBOX-DMZ",
			status: "Paused",
			os: "Windows Server 2019",
			cpu: 0,
			memMB: 2048,
			uptime: "—"
		},
		{
			id: "vm5",
			name: "TEST-SQL",
			status: "Saved",
			os: "Windows Server 2022",
			cpu: 0,
			memMB: 16384,
			uptime: "—"
		},
		{
			id: "vm6",
			name: "DEV-DESKTOP",
			status: "Running",
			os: "Windows 11",
			cpu: 12,
			memMB: 8192,
			uptime: "3d 1h"
		}
	];
}
async function controlVM(_s, _id, _a) {
	await delay(500);
}
async function getVirtualSwitches(_s) {
	await delay();
	return [
		{
			id: "s1",
			name: "NEXUS-External",
			type: "External",
			adapter: "Ethernet 0",
			vms: ["BUILD-AGENT-01", "BUILD-AGENT-02"]
		},
		{
			id: "s2",
			name: "Lab-Internal",
			type: "Internal",
			vms: ["DEV-DESKTOP"]
		},
		{
			id: "s3",
			name: "Isolated",
			type: "Private",
			vms: ["TEST-SQL", "JUMPBOX-DMZ"]
		}
	];
}
async function getReplicaPartnerships() {
	await delay();
	return [
		{
			id: "r1",
			sourceServer: "FS01",
			sourceVol: "G:",
			destServer: "FS02",
			destVol: "G:",
			status: "Healthy",
			mode: "Synchronous",
			lastSync: "2026-06-15T05:14:00Z",
			bytes: 4402193204,
			progress: 100
		},
		{
			id: "r2",
			sourceServer: "SQL01",
			sourceVol: "L:",
			destServer: "SQL02",
			destVol: "L:",
			status: "Syncing",
			mode: "Asynchronous",
			lastSync: "2026-06-15T05:00:00Z",
			bytes: 1201882002,
			progress: 68
		},
		{
			id: "r3",
			sourceServer: "DC01",
			sourceVol: "S:",
			destServer: "DC02",
			destVol: "S:",
			status: "Error",
			mode: "Asynchronous",
			lastSync: "2026-06-14T22:11:00Z",
			bytes: 200002,
			progress: 12
		}
	];
}
//#endregion
export { getFirewallRules as a, getVirtualSwitches as c, getEvents as i, toggleFirewallRule as l, controlVM as n, getReplicaPartnerships as o, getDevices as r, getVMs as s, MOCK_SERVERS as t };
