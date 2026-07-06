using System;
using System.Diagnostics;
using System.IO;
using System.ServiceProcess;
using System.Text.Json;

namespace Nexus.Launcher;

static class Program
{
    [STAThread]
    static void Main()
    {
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        // The launcher sits directly in {app}, so Backend folder is a peer
        string appSettingsPath = Path.Combine(baseDir, "Backend", "appsettings.json");
        
        string hostUrl = "localhost";
        int port = 443;
        
        if (File.Exists(appSettingsPath))
        {
            try
            {
                string json = File.ReadAllText(appSettingsPath);
                using JsonDocument doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("Nexus", out JsonElement nexusEl))
                {
                    if (nexusEl.TryGetProperty("HostUrl", out JsonElement hostEl))
                    {
                        hostUrl = hostEl.GetString() ?? "localhost";
                    }
                }
                
                if (doc.RootElement.TryGetProperty("Kestrel", out JsonElement kestrelEl) &&
                    kestrelEl.TryGetProperty("Endpoints", out JsonElement endpointsEl) &&
                    endpointsEl.TryGetProperty("Https", out JsonElement httpsEl) &&
                    httpsEl.TryGetProperty("Url", out JsonElement urlEl))
                {
                    string urlStr = urlEl.GetString() ?? "";
                    int colonIdx = urlStr.LastIndexOf(':');
                    if (colonIdx >= 0)
                    {
                        int.TryParse(urlStr.Substring(colonIdx + 1), out port);
                    }
                }
            }
            catch
            {
                // Fallback to default
            }
        }
        
        // Start services if not running
        EnsureServiceRunning("Nexus Backend");
        EnsureServiceRunning("nexus-frontend");
        
        // Open browser
        string finalUrl = $"https://{hostUrl}:{port}/";
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
            // Ignore
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
                proc?.WaitForExit(5000);
            }
            catch
            {
                // Ignore if UAC prompt was rejected
            }
        }
    }
}
