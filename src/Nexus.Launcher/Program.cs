using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.ServiceProcess;
using System.Text.Json;

namespace Nexus.Launcher;

static class Program
{
    [STAThread]
    static void Main()
    {
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        
        // Candidate locations for Gateway appsettings.json
        string[] candidatePaths = new[]
        {
            Path.Combine(baseDir, "Backend", "appsettings.json"),
            Path.Combine(baseDir, "..", "Nexus.Gateway", "appsettings.json"),
            Path.Combine(baseDir, "..", "..", "..", "Nexus.Gateway", "appsettings.json"),
            Path.Combine(baseDir, "..", "..", "..", "src", "Nexus.Gateway", "appsettings.json"),
            Path.Combine(baseDir, "appsettings.json")
        };

        string hostUrl = "localhost";
        int port = 5010;
        string scheme = "http";

        foreach (var path in candidatePaths)
        {
            if (File.Exists(path))
            {
                try
                {
                    string json = File.ReadAllText(path);
                    using JsonDocument doc = JsonDocument.Parse(json);

                    if (doc.RootElement.TryGetProperty("Nexus", out JsonElement nexusEl))
                    {
                        if (nexusEl.TryGetProperty("HostUrl", out JsonElement hostEl))
                            hostUrl = hostEl.GetString() ?? "localhost";
                        if (nexusEl.TryGetProperty("WebBindingPort", out JsonElement portEl) && portEl.TryGetInt32(out int pVal))
                            port = pVal;
                    }

                    if (doc.RootElement.TryGetProperty("Kestrel", out JsonElement kestrelEl) &&
                        kestrelEl.TryGetProperty("Endpoints", out JsonElement endpointsEl))
                    {
                        if (endpointsEl.TryGetProperty("Http", out JsonElement httpEl) &&
                            httpEl.TryGetProperty("Url", out JsonElement httpUrlEl))
                        {
                            string urlStr = httpUrlEl.GetString() ?? "";
                            scheme = "http";
                            int colonIdx = urlStr.LastIndexOf(':');
                            if (colonIdx >= 0 && int.TryParse(urlStr.Substring(colonIdx + 1), out int parsedPort))
                                port = parsedPort;
                        }
                        else if (endpointsEl.TryGetProperty("Https", out JsonElement httpsEl) &&
                                 httpsEl.TryGetProperty("Url", out JsonElement httpsUrlEl))
                        {
                            string urlStr = httpsUrlEl.GetString() ?? "";
                            scheme = "https";
                            int colonIdx = urlStr.LastIndexOf(':');
                            if (colonIdx >= 0 && int.TryParse(urlStr.Substring(colonIdx + 1), out int parsedPort))
                                port = parsedPort;
                        }
                    }
                    break;
                }
                catch
                {
                    // Fallback to default settings
                }
            }
        }

        if (hostUrl == "0.0.0.0" || hostUrl == "*") hostUrl = "localhost";

        // Step 1: Start services if installed
        EnsureServiceRunning("Nexus Backend");
        EnsureServiceRunning("nexus-frontend");

        // Step 2: Fallback — if Gateway isn't running on configured port, start it directly
        if (!IsPortOpen(hostUrl, port))
        {
            TryStartGatewayProcess(baseDir);
        }

        // Step 3: Detect if Vite dev server (port 5173) is active; if so, open it, else open Gateway
        int targetPort = port;
        if (IsPortOpen(hostUrl, 5173))
        {
            targetPort = 5173;
            scheme = "http";
        }

        string finalUrl = $"{scheme}://{hostUrl}:{targetPort}/";

        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = finalUrl,
                UseShellExecute = true
            });
        }
        catch
        {
            // Ignore browser launch errors
        }
    }

    static void EnsureServiceRunning(string serviceName)
    {
        try
        {
            using var sc = new ServiceController(serviceName);
            if (sc.Status != ServiceControllerStatus.Running && sc.Status != ServiceControllerStatus.StartPending)
            {
                sc.Start();
                sc.WaitForStatus(ServiceControllerStatus.Running, TimeSpan.FromSeconds(5));
            }
        }
        catch
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/c net start \"{serviceName}\"",
                    UseShellExecute = true,
                    Verb = "runas",
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                var proc = Process.Start(startInfo);
                proc?.WaitForExit(3000);
            }
            catch
            {
                // Ignore if Windows service is not installed or UAC prompt was rejected
            }
        }
    }

    static bool IsPortOpen(string host, int port)
    {
        try
        {
            using var client = new TcpClient();
            var result = client.BeginConnect(host, port, null, null);
            bool success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(500));
            if (success && client.Connected)
            {
                client.EndConnect(result);
                return true;
            }
            return false;
        }
        catch
        {
            return false;
        }
    }

    static void TryStartGatewayProcess(string baseDir)
    {
        try
        {
            // Installed exe path
            string exePath = Path.Combine(baseDir, "Backend", "Nexus.Gateway.exe");
            if (!File.Exists(exePath)) exePath = Path.Combine(baseDir, "Nexus.Gateway.exe");

            if (File.Exists(exePath))
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = exePath,
                    WorkingDirectory = Path.GetDirectoryName(exePath),
                    UseShellExecute = true
                });
                return;
            }

            // Dev csproj path
            string csprojPath = Path.Combine(baseDir, "..", "Nexus.Gateway", "Nexus.Gateway.csproj");
            if (!File.Exists(csprojPath))
                csprojPath = Path.Combine(baseDir, "..", "..", "..", "Nexus.Gateway", "Nexus.Gateway.csproj");
            if (!File.Exists(csprojPath))
                csprojPath = Path.Combine(baseDir, "..", "..", "..", "src", "Nexus.Gateway", "Nexus.Gateway.csproj");

            if (File.Exists(csprojPath))
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "dotnet",
                    Arguments = $"run --project \"{Path.GetFullPath(csprojPath)}\"",
                    WorkingDirectory = Path.GetDirectoryName(csprojPath),
                    UseShellExecute = true,
                    WindowStyle = ProcessWindowStyle.Normal
                });
            }
        }
        catch
        {
            // Ignore process start errors
        }
    }
}
