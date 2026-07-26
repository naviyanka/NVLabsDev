import { Terminal } from "@xterm/xterm";

export interface SimulatedPowerShellSession {
  serverId: string;
  xterm: Terminal;
  history: string[];
  historyIndex: number;
  currentInput: string;
  cursorPos: number;
  active: boolean;
}

export function createSimulatedPowerShell(xterm: Terminal, serverId: string): {
  handleInput: (data: string) => void;
  runCommand: (cmd: string) => void;
  destroy: () => void;
} {
  let history: string[] = [
    "Get-Process | Select-Object -First 5",
    "Get-Service | Where-Object Status -eq 'Running'",
    "Get-Volume",
    "ipconfig"
  ];
  let historyIndex = history.length;
  let currentInput = "";
  let promptStr = `PS C:\\Users\\Administrator.NEXUS> `;

  function writePrompt() {
    xterm.write(`\r\n\x1b[38;2;245;158;11m${promptStr}\x1b[0m`);
  }

  function printBanner() {
    xterm.writeln(`\x1b[36mPowerShell 7.4.2\x1b[0m`);
    xterm.writeln(`\x1b[90mConnected to Remote Management PTY Gateway [Server: ${serverId}]\x1b[0m`);
    xterm.writeln(`\x1b[90mType 'help' or 'Get-Help' for available commands and quick hints.\x1b[0m`);
    xterm.write(`\x1b[38;2;245;158;11m${promptStr}\x1b[0m`);
  }

  printBanner();

  function evaluateCommand(cmd: string) {
    const trimmed = cmd.trim();
    if (!trimmed) {
      writePrompt();
      return;
    }

    // Add to history
    if (history[history.length - 1] !== trimmed) {
      history.push(trimmed);
    }
    historyIndex = history.length;

    const lower = trimmed.toLowerCase();

    xterm.writeln("");

    if (lower === "cls" || lower === "clear" || lower === "clear-host") {
      xterm.clear();
      xterm.write(`\x1b[38;2;245;158;11m${promptStr}\x1b[0m`);
      return;
    }

    if (lower === "help" || lower === "get-help") {
      xterm.writeln(`\x1b[33mNEXUS Remote PowerShell Interactive Shell Commands:\x1b[0m`);
      xterm.writeln(`  \x1b[36mGet-Process\x1b[0m          - List active processes with CPU and Memory usage`);
      xterm.writeln(`  \x1b[36mGet-Service\x1b[0m          - List Windows services and operational state`);
      xterm.writeln(`  \x1b[36mGet-Volume\x1b[0m           - Display drive letters, labels, and free storage`);
      xterm.writeln(`  \x1b[36mGet-Disk\x1b[0m             - Show physical storage disks and status`);
      xterm.writeln(`  \x1b[36mGet-NetTCPConnection\x1b[0m - List active TCP network sockets`);
      xterm.writeln(`  \x1b[36mipconfig / Get-NetIPAddress\x1b[0m - Show network interface configurations`);
      xterm.writeln(`  \x1b[36mGet-LocalUser\x1b[0m        - List local user accounts on ${serverId}`);
      xterm.writeln(`  \x1b[36mwhoami\x1b[0m               - Display current security context`);
      xterm.writeln(`  \x1b[36mhostname\x1b[0m             - Print server hostname`);
      xterm.writeln(`  \x1b[36mGet-Date\x1b[0m             - Output current system date and time`);
      xterm.writeln(`  \x1b[36mClear-Host / cls\x1b[0m     - Clear terminal screen buffer`);
      xterm.writeln(`\x1b[90mTip: Press [TAB] for cmdlet autocompletion, or use Preset Scripts from top menu.\x1b[0m`);
      writePrompt();
      return;
    }

    if (lower === "whoami") {
      xterm.writeln(`NEXUS-DOMAIN\\Administrator`);
      writePrompt();
      return;
    }

    if (lower === "hostname") {
      xterm.writeln(serverId.toUpperCase());
      writePrompt();
      return;
    }

    if (lower === "get-date") {
      xterm.writeln(new Date().toString());
      writePrompt();
      return;
    }

    if (lower.startsWith("get-process") || lower === "ps") {
      xterm.writeln(`\x1b[33mHandles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id ProcessName\x1b[0m`);
      xterm.writeln(`\x1b[90m-------  ------    -----      -----     ------     -- -----------\x1b[0m`);
      const mockProcs = [
        { id: 4, handles: 1850, npm: 0, pm: 240, ws: 1024, cpu: 124.5, name: "System" },
        { id: 712, handles: 450, npm: 18, pm: 12500, ws: 48900, cpu: 12.3, name: "lsass" },
        { id: 1104, handles: 320, npm: 14, pm: 8900, ws: 31200, cpu: 8.7, name: "svchost" },
        { id: 2450, handles: 890, npm: 42, pm: 154000, ws: 210000, cpu: 45.1, name: "sqlservr" },
        { id: 3180, handles: 510, npm: 28, pm: 45000, ws: 92000, cpu: 18.9, name: "powershell" },
        { id: 4100, handles: 210, npm: 12, pm: 18000, ws: 34000, cpu: 3.2, name: "nexus-agent" },
        { id: 5210, handles: 180, npm: 10, pm: 14000, ws: 28000, cpu: 1.1, name: "vmms" },
      ];
      mockProcs.forEach(p => {
        const line = `${p.handles.toString().padStart(7)} ${p.npm.toString().padStart(7)} ${p.pm.toString().padStart(8)} ${p.ws.toString().padStart(10)} ${(p.cpu).toFixed(2).padStart(10)} ${p.id.toString().padStart(6)} \x1b[36m${p.name}\x1b[0m`;
        xterm.writeln(line);
      });
      writePrompt();
      return;
    }

    if (lower.startsWith("get-service") || lower === "gsv") {
      xterm.writeln(`\x1b[33mStatus   Name               DisplayName\x1b[0m`);
      xterm.writeln(`\x1b[90m------   ----               -----------\x1b[0m`);
      const svcs = [
        { status: "Running", name: "LanmanServer", display: "Server" },
        { status: "Running", name: "LanmanWorkstation", display: "Workstation" },
        { status: "Running", name: "WinRM", display: "Windows Remote Management (WS-Management)" },
        { status: "Running", name: "StorageReplica", display: "Storage Replica Core Service" },
        { status: "Running", name: "MSSQLSERVER", display: "SQL Server (MSSQLSERVER)" },
        { status: "Stopped", name: "Spooler", display: "Print Spooler" },
        { status: "Running", name: "W32Time", display: "Windows Time" },
        { status: "Running", name: "nexus-host-agent", display: "NEXUS Fleet Monitoring Agent" }
      ];
      svcs.forEach(s => {
        const color = s.status === "Running" ? "\x1b[32m" : "\x1b[31m";
        xterm.writeln(`${color}${s.status.padEnd(8)}\x1b[0m ${s.name.padEnd(18)} ${s.display}`);
      });
      writePrompt();
      return;
    }

    if (lower.startsWith("get-volume")) {
      xterm.writeln(`\x1b[33mDriveLetter FileSystemLabel FileSystem DriveType HealthStatus SizeRemaining        Size\x1b[0m`);
      xterm.writeln(`\x1b[90m----------- --------------- ---------- --------- ------------ -------------        ----\x1b[0m`);
      xterm.writeln(`C           OS_System       NTFS       Fixed     Healthy       142.50 GB   500.00 GB`);
      xterm.writeln(`G           Data_Replica    ReFS       Fixed     Healthy       412.10 GB  1000.00 GB`);
      xterm.writeln(`L           SR_LogVol       NTFS       Fixed     Healthy        48.80 GB   128.00 GB`);
      writePrompt();
      return;
    }

    if (lower.startsWith("get-disk")) {
      xterm.writeln(`\x1b[33mNumber Friendly Name           Serial Number        HealthStatus OperationalStatus Total Size Partition Style\x1b[0m`);
      xterm.writeln(`\x1b[90m------ -------------           -------------        ------------ ----------------- ---------- ---------------\x1b[0m`);
      xterm.writeln(`0      NVMe Samsung 980 PRO   S5GXNF0R123456       Healthy      Online              500 GB   GPT`);
      xterm.writeln(`1      Virtual SAN Volume 01  SAN-REPLICA-VOL1     Healthy      Online             1000 GB   GPT`);
      xterm.writeln(`2      Virtual SAN Log Vol    SAN-REPLICA-LOG1     Healthy      Online              128 GB   GPT`);
      writePrompt();
      return;
    }

    if (lower.startsWith("ipconfig") || lower.startsWith("get-netipaddress")) {
      xterm.writeln(`Windows IP Configuration\r\n`);
      xterm.writeln(`Ethernet adapter vEthernet (Management Network):`);
      xterm.writeln(`   Connection-specific DNS Suffix  . : nexus.internal`);
      xterm.writeln(`   Link-local IPv6 Address . . . . . : fe80::d41a:88f9:2210:4a5c%12`);
      xterm.writeln(`   IPv4 Address. . . . . . . . . . . : 10.0.1.104`);
      xterm.writeln(`   Subnet Mask . . . . . . . . . . . : 255.255.255.0`);
      xterm.writeln(`   Default Gateway . . . . . . . . . : 10.0.1.1`);
      writePrompt();
      return;
    }

    if (lower.startsWith("get-nettcpconnection")) {
      xterm.writeln(`\x1b[33mLocalAddress   LocalPort RemoteAddress  RemotePort State       AppliedSetting\x1b[0m`);
      xterm.writeln(`\x1b[90m------------   --------- -------------  ---------- -----       --------------\x1b[0m`);
      xterm.writeln(`10.0.1.104     5985      10.0.1.12      51420      Established Internet`);
      xterm.writeln(`10.0.1.104     445       10.0.1.25      58912      Established Internet`);
      xterm.writeln(`10.0.1.104     1433      10.0.1.30      61102      Established Internet`);
      xterm.writeln(`10.0.1.104     3389      10.0.1.5       50218      Established Internet`);
      writePrompt();
      return;
    }

    if (lower.startsWith("get-localuser")) {
      xterm.writeln(`\x1b[33mName               Enabled Description\x1b[0m`);
      xterm.writeln(`\x1b[90m----               ------- -----------\x1b[0m`);
      xterm.writeln(`Administrator      True    Built-in account for administering the computer/domain`);
      xterm.writeln(`Guest              False   Built-in account for guest access`);
      xterm.writeln(`NexusAdmin         True    NEXUS Fleet Control Management Administrative User`);
      xterm.writeln(`DefaultAccount     False   A user account managed by the system.`);
      writePrompt();
      return;
    }

    // Generic fallback script / command simulator
    xterm.writeln(`\x1b[90m[DISPATCH] Executing on ${serverId}: "${trimmed}"...\x1b[0m`);
    setTimeout(() => {
      xterm.writeln(`\x1b[32m[SUCCESS] Command completed on node ${serverId.toUpperCase()} (ExitCode: 0, Elapsed: 18ms)\x1b[0m`);
      writePrompt();
    }, 150);
  }

  function handleInput(data: string) {
    for (let i = 0; i < data.length; i++) {
      const char = data[i];

      // Enter
      if (char === "\r" || char === "\n") {
        const cmdToRun = currentInput;
        currentInput = "";
        evaluateCommand(cmdToRun);
        continue;
      }

      // Backspace
      if (char === "\x7f" || char === "\b") {
        if (currentInput.length > 0) {
          currentInput = currentInput.slice(0, -1);
          xterm.write("\b \b");
        }
        continue;
      }

      // Tab autocompletion
      if (char === "\t") {
        const commonCmdlets = [
          "Get-Process",
          "Get-Service",
          "Get-Volume",
          "Get-Disk",
          "Get-NetTCPConnection",
          "Get-NetIPAddress",
          "Get-LocalUser",
          "Get-LocalGroupMember",
          "Get-Date",
          "Get-Help",
          "Clear-Host"
        ];
        const match = commonCmdlets.find(c => c.toLowerCase().startsWith(currentInput.toLowerCase()));
        if (match) {
          // erase previous input
          for (let j = 0; j < currentInput.length; j++) {
            xterm.write("\b \b");
          }
          currentInput = match;
          xterm.write(currentInput);
        }
        continue;
      }

      // Ctrl + C
      if (char === "\x03") {
        currentInput = "";
        xterm.writeln("^C");
        writePrompt();
        continue;
      }

      // Ctrl + L (Clear screen)
      if (char === "\x0c") {
        xterm.clear();
        xterm.write(`\x1b[38;2;245;158;11m${promptStr}\x1b[0m${currentInput}`);
        continue;
      }

      // Arrow keys (ANSI escape sequences: \x1b[A, \x1b[B)
      if (data.slice(i, i + 3) === "\x1b[A") { // UP
        i += 2;
        if (historyIndex > 0) {
          historyIndex--;
          for (let j = 0; j < currentInput.length; j++) xterm.write("\b \b");
          currentInput = history[historyIndex] || "";
          xterm.write(currentInput);
        }
        continue;
      }

      if (data.slice(i, i + 3) === "\x1b[B") { // DOWN
        i += 2;
        if (historyIndex < history.length - 1) {
          historyIndex++;
          for (let j = 0; j < currentInput.length; j++) xterm.write("\b \b");
          currentInput = history[historyIndex] || "";
          xterm.write(currentInput);
        } else {
          historyIndex = history.length;
          for (let j = 0; j < currentInput.length; j++) xterm.write("\b \b");
          currentInput = "";
        }
        continue;
      }

      // Standard printable characters
      if (char >= " " && char <= "~") {
        currentInput += char;
        xterm.write(char);
      }
    }
  }

  function runCommand(cmd: string) {
    xterm.write(cmd);
    evaluateCommand(cmd);
  }

  return {
    handleInput,
    runCommand,
    destroy: () => {}
  };
}
