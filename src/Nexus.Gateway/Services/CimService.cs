using Microsoft.Management.Infrastructure;
using Microsoft.Management.Infrastructure.Options;
using Nexus.Gateway.Models;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace Nexus.Gateway.Services;

public class CimService : IDisposable
{
    private readonly ILogger<CimService> _logger;
    public CimService(ILogger<CimService> logger)
    {
        _logger = logger;
    }

    public CimSession CreateSession(string ip)
    {
        if (string.IsNullOrEmpty(ip) || 
            ip.Equals("localhost", StringComparison.OrdinalIgnoreCase) || 
            ip.Equals("127.0.0.1") || 
            ip.Equals("::1") || 
            ip.Equals(Environment.MachineName, StringComparison.OrdinalIgnoreCase))
        {
            return CimSession.Create(null);
        }
        else
        {
            var options = new DComSessionOptions { Timeout = TimeSpan.FromSeconds(3) };
            return CimSession.Create(ip, options);
        }
    }

    public async Task UpdateServerStatusAsync(Server server)
    {
        await Task.Run(() =>
        {
            try
            {
                using var session = CreateSession(server.Ip);

                var osInstances = session.QueryInstances(@"root\cimv2", "WQL", "SELECT Caption, FreePhysicalMemory, TotalVisibleMemorySize FROM Win32_OperatingSystem").ToList();
                if (osInstances.Any())
                {
                    var os = osInstances.First();
                    server.Status = "online";
                    server.Os = os.CimInstanceProperties["Caption"]?.Value?.ToString() ?? server.Os;

                    if (double.TryParse(os.CimInstanceProperties["TotalVisibleMemorySize"]?.Value?.ToString(), out var totalMem) &&
                        double.TryParse(os.CimInstanceProperties["FreePhysicalMemory"]?.Value?.ToString(), out var freeMem))
                    {
                        server.Mem = Math.Round(((totalMem - freeMem) / totalMem) * 100, 1);
                    }
                }

                var cpuInstances = session.QueryInstances(@"root\cimv2", "WQL", "SELECT LoadPercentage FROM Win32_Processor").ToList();
                if (cpuInstances.Any())
                {
                    var cpu = cpuInstances.First();
                    if (double.TryParse(cpu.CimInstanceProperties["LoadPercentage"]?.Value?.ToString(), out var load))
                    {
                        server.Cpu = load;
                    }
                }

                if (server.Cpu > 90 || server.Mem > 90) server.Status = "critical";
                else if (server.Cpu > 75 || server.Mem > 75) server.Status = "warning";
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to reach CIM on {Ip}: {Message}", server.Ip, ex.Message);
                server.Status = "offline";
            }
        });
    }

    public async Task<PerfSample[]> GetRealtimeMetricsAsync(string ip)
    {
        return await Task.Run(() =>
        {
            var sample = new PerfSample { T = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() };
            try
            {
                using var session = CreateSession(ip);

                // OS Memory
                var os = session.QueryInstances(@"root\cimv2", "WQL", "SELECT FreePhysicalMemory, TotalVisibleMemorySize FROM Win32_OperatingSystem").FirstOrDefault();
                if (os != null && double.TryParse(os.CimInstanceProperties["TotalVisibleMemorySize"]?.Value?.ToString(), out var totalMem) &&
                    double.TryParse(os.CimInstanceProperties["FreePhysicalMemory"]?.Value?.ToString(), out var freeMem))
                {
                    sample.Mem = Math.Round(((totalMem - freeMem) / totalMem) * 100, 1);
                }

                // CPU
                var cpu = session.QueryInstances(@"root\cimv2", "WQL", "SELECT LoadPercentage FROM Win32_Processor").FirstOrDefault();
                if (cpu != null && double.TryParse(cpu.CimInstanceProperties["LoadPercentage"]?.Value?.ToString(), out var load))
                {
                    sample.Cpu = load;
                }

                // Disk I/O (MB/s)
                var disks = session.QueryInstances(@"root\cimv2", "WQL", "SELECT DiskReadBytesPersec, DiskWriteBytesPersec FROM Win32_PerfFormattedData_PerfDisk_PhysicalDisk WHERE Name='_Total'").FirstOrDefault();
                if (disks != null)
                {
                    if (double.TryParse(disks.CimInstanceProperties["DiskReadBytesPersec"]?.Value?.ToString(), out var dr)) sample.DiskR = Math.Round(dr / 1048576, 2);
                    if (double.TryParse(disks.CimInstanceProperties["DiskWriteBytesPersec"]?.Value?.ToString(), out var dw)) sample.DiskW = Math.Round(dw / 1048576, 2);
                }

                // Network I/O (Mb/s)
                var net = session.QueryInstances(@"root\cimv2", "WQL", "SELECT BytesReceivedPersec, BytesSentPersec FROM Win32_PerfFormattedData_Tcpip_NetworkInterface").ToList();
                if (net.Any())
                {
                    double totalIn = 0, totalOut = 0;
                    foreach (var n in net)
                    {
                        if (double.TryParse(n.CimInstanceProperties["BytesReceivedPersec"]?.Value?.ToString(), out var bin)) totalIn += bin;
                        if (double.TryParse(n.CimInstanceProperties["BytesSentPersec"]?.Value?.ToString(), out var bout)) totalOut += bout;
                    }
                    sample.NetIn = Math.Round((totalIn * 8) / 1000000, 2);
                    sample.NetOut = Math.Round((totalOut * 8) / 1000000, 2);
                }
                return new[] { sample };
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to get realtime metrics for {Ip}.", ip);
                return new[] { sample };
            }
        });
    }

    private readonly ConcurrentDictionary<string, double> _totalMemMB = new();
    private readonly ConcurrentDictionary<string, int> _processorCount = new();

    public async Task<List<ProcessModel>> GetProcessesAsync(string ip, int limit = 10)
    {
        return await Task.Run(() =>
        {
            var procs = new List<ProcessModel>();
            try
            {
                using var session = CreateSession(ip);

                if (!_totalMemMB.TryGetValue(ip, out var totalMemMB) || !_processorCount.TryGetValue(ip, out var procCount))
                {
                    var os = session.QueryInstances(@"root\cimv2", "WQL", "SELECT TotalVisibleMemorySize FROM Win32_OperatingSystem").FirstOrDefault();
                    if (os != null && double.TryParse(os.CimInstanceProperties["TotalVisibleMemorySize"]?.Value?.ToString(), out var memKb))
                    {
                        totalMemMB = memKb / 1024.0;
                        _totalMemMB.TryAdd(ip, totalMemMB);
                    }
                    else totalMemMB = 8192; // Fallback 8GB

                    var cs = session.QueryInstances(@"root\cimv2", "WQL", "SELECT NumberOfLogicalProcessors FROM Win32_ComputerSystem").FirstOrDefault();
                    if (cs != null && int.TryParse(cs.CimInstanceProperties["NumberOfLogicalProcessors"]?.Value?.ToString(), out var cores))
                    {
                        procCount = cores;
                        _processorCount.TryAdd(ip, procCount);
                    }
                    else procCount = 1;
                }

                var perfProcs = session.QueryInstances(@"root\cimv2", "WQL", "SELECT IDProcess, Name, PercentProcessorTime, WorkingSet, HandleCount, ThreadCount FROM Win32_PerfFormattedData_PerfProc_Process").ToList();
                
                foreach (var p in perfProcs)
                {
                    var name = p.CimInstanceProperties["Name"]?.Value?.ToString() ?? "Unknown";
                    if (name == "_Total" || name == "Idle") continue;

                    if (int.TryParse(p.CimInstanceProperties["IDProcess"]?.Value?.ToString(), out var pid) &&
                        double.TryParse(p.CimInstanceProperties["PercentProcessorTime"]?.Value?.ToString(), out var rawCpu) &&
                        double.TryParse(p.CimInstanceProperties["WorkingSet"]?.Value?.ToString(), out var memBytes))
                    {
                        int.TryParse(p.CimInstanceProperties["HandleCount"]?.Value?.ToString(), out var handles);
                        int.TryParse(p.CimInstanceProperties["ThreadCount"]?.Value?.ToString(), out var threads);
                        
                        double memMB = memBytes / 1048576.0;
                        double memPct = Math.Round((memMB / totalMemMB) * 100, 1);
                        double cpu = Math.Min(100, Math.Round(rawCpu / procCount, 1));

                        procs.Add(new ProcessModel
                        {
                            Pid = pid,
                            Name = name,
                            Cpu = cpu,
                            MemMB = Math.Round(memMB, 1),
                            MemPct = memPct,
                            Handles = handles,
                            Threads = threads,
                            User = "Unknown" 
                        });
                    }
                }
                var sorted = procs.OrderByDescending(p => p.Cpu).ToList();
                return limit == int.MaxValue ? sorted : sorted.Take(limit).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to get processes for {Ip}.", ip);
                return procs;
            }
        });
    }

    public async Task<ProcessModel?> GetProcessDetailsAsync(string ip, int pid)
    {
        return await Task.Run(() =>
        {
            try
            {
                using var session = CreateSession(ip);
                var pInstance = session.QueryInstances(@"root\cimv2", "WQL", $"SELECT ProcessId, Name, ExecutablePath, CommandLine FROM Win32_Process WHERE ProcessId = {pid}").FirstOrDefault();
                
                if (pInstance != null)
                {
                    return new ProcessModel
                    {
                        Pid = pid,
                        Name = pInstance.CimInstanceProperties["Name"]?.Value?.ToString() ?? "Unknown",
                        ExecutablePath = pInstance.CimInstanceProperties["ExecutablePath"]?.Value?.ToString(),
                        CommandLine = pInstance.CimInstanceProperties["CommandLine"]?.Value?.ToString()
                    };
                }
                return (ProcessModel?)null;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to get process details for {Pid} on {Ip}", pid, ip);
                return (ProcessModel?)null;
            }
        });
    }

    public async Task<bool> KillProcessAsync(string ip, int pid)
    {
        return await Task.Run(() =>
        {
            try
            {
                using var session = CreateSession(ip);
                var pInstance = session.QueryInstances(@"root\cimv2", "WQL", $"SELECT * FROM Win32_Process WHERE ProcessId = {pid}").FirstOrDefault();
                if (pInstance != null)
                {
                    var result = session.InvokeMethod(pInstance, "Terminate", new CimMethodParametersCollection());
                    return result.ReturnValue?.ToString() == "0";
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to kill process {Pid} on {Ip}", pid, ip);
                return false;
            }
        });
    }

    public async Task<List<ServiceModel>> GetServicesAsync(string ip)
    {
        return await Task.Run(() =>
        {
            var svcs = new List<ServiceModel>();
            try
            {
                using var session = CreateSession(ip);
                var wmiSvcs = session.QueryInstances(@"root\cimv2", "WQL", "SELECT Name, DisplayName, State, StartMode, StartName, Description, ProcessId, PathName, AcceptStop, AcceptPause FROM Win32_Service").ToList();
                
                foreach (var s in wmiSvcs)
                {
                    var mode = s.CimInstanceProperties["StartMode"]?.Value?.ToString() ?? "";
                    if (mode == "Auto") mode = "Automatic";
                    
                    svcs.Add(new ServiceModel
                    {
                        Name = s.CimInstanceProperties["Name"]?.Value?.ToString() ?? "",
                        DisplayName = s.CimInstanceProperties["DisplayName"]?.Value?.ToString() ?? "",
                        Status = s.CimInstanceProperties["State"]?.Value?.ToString() ?? "",
                        StartupType = mode,
                        LogOnAs = s.CimInstanceProperties["StartName"]?.Value?.ToString() ?? "",
                        Description = s.CimInstanceProperties["Description"]?.Value?.ToString() ?? "",
                        ProcessId = int.TryParse(s.CimInstanceProperties["ProcessId"]?.Value?.ToString(), out var pid) ? pid : 0,
                        PathName = s.CimInstanceProperties["PathName"]?.Value?.ToString() ?? "",
                        AcceptStop = bool.TryParse(s.CimInstanceProperties["AcceptStop"]?.Value?.ToString(), out var acceptStop) && acceptStop,
                        AcceptPause = bool.TryParse(s.CimInstanceProperties["AcceptPause"]?.Value?.ToString(), out var acceptPause) && acceptPause
                    });
                }
                return svcs.OrderBy(s => s.DisplayName).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to get services for {Ip}.", ip);
                return svcs;
            }
        });
    }

    private static readonly Regex SafeServiceName = new(@"^[a-zA-Z0-9_\-\. ]+$", RegexOptions.Compiled);

    public async Task<bool> ControlServiceAsync(string ip, string serviceName, string action)
    {
        if (!SafeServiceName.IsMatch(serviceName))
            throw new ArgumentException($"Invalid service name: {serviceName}");

        return await Task.Run(async () =>
        {
            try
            {
                using var session = CreateSession(ip);
                // Escape single quotes in service name for WQL safety
                var safeName = serviceName.Replace("'", "''");
                var svcInstance = session.QueryInstances(@"root\cimv2", "WQL", $"SELECT * FROM Win32_Service WHERE Name = '{safeName}'").FirstOrDefault();
                if (svcInstance != null)
                {
                    string method = action.ToLower() switch
                    {
                        "start" => "StartService",
                        "stop" => "StopService",
                        "restart" => "StopService",
                        _ => throw new ArgumentException()
                    };

                    if (action.ToLower() == "restart")
                    {
                        session.InvokeMethod(svcInstance, "StopService", new CimMethodParametersCollection());
                        await Task.Delay(2000); 
                        session.InvokeMethod(svcInstance, "StartService", new CimMethodParametersCollection());
                        return true;
                    }
                    else
                    {
                        var result = session.InvokeMethod(svcInstance, method, new CimMethodParametersCollection());
                        return result.ReturnValue?.ToString() == "0";
                    }
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to control service {Svc} on {Ip}", serviceName, ip);
                return false;
            }
        });
    }

    public async Task<List<DiskModel>> GetDisksAsync(string ip)
    {
        return await Task.Run(() =>
        {
            var disks = new List<DiskModel>();
            try
            {
                using var session = CreateSession(ip);
                var driveInstances = session.QueryInstances(@"root\cimv2", "WQL", "SELECT DeviceID, Model, Size, InterfaceType, Status, Index FROM Win32_DiskDrive").ToList();
                var partInstances = session.QueryInstances(@"root\cimv2", "WQL", "SELECT DeviceID, Size, Type, DiskIndex FROM Win32_DiskPartition").ToList();
                var logicalToPart = session.QueryInstances(@"root\cimv2", "WQL", "SELECT Antecedent, Dependent FROM Win32_LogicalDiskToPartition").ToList();

                var partToDrive = new Dictionary<string, string>();
                foreach (var l2p in logicalToPart)
                {
                    var ant = l2p.CimInstanceProperties["Antecedent"]?.Value?.ToString() ?? "";
                    var dep = l2p.CimInstanceProperties["Dependent"]?.Value?.ToString() ?? "";
                    
                    var antMatch = System.Text.RegularExpressions.Regex.Match(ant, @"DeviceID\s*=\s*""([^""]+)""");
                    var depMatch = System.Text.RegularExpressions.Regex.Match(dep, @"DeviceID\s*=\s*""([^""]+)""");
                    
                    if (antMatch.Success && depMatch.Success)
                    {
                        var pId = antMatch.Groups[1].Value;
                        var lId = depMatch.Groups[1].Value.Replace(":", "");
                        partToDrive[pId] = lId;
                    }
                }

                foreach (var d in driveInstances)
                {
                    if (double.TryParse(d.CimInstanceProperties["Size"]?.Value?.ToString(), out var sizeBytes))
                    {
                        var diskIndexStr = d.CimInstanceProperties["Index"]?.Value?.ToString() ?? "";
                        
                        var model = new DiskModel
                        {
                            Id = $"Disk {diskIndexStr}",
                            Model = d.CimInstanceProperties["Model"]?.Value?.ToString() ?? "Unknown",
                            SizeGB = Math.Round(sizeBytes / 1073741824, 1),
                            Bus = d.CimInstanceProperties["InterfaceType"]?.Value?.ToString() ?? "Unknown",
                            Health = (d.CimInstanceProperties["Status"]?.Value?.ToString() ?? "OK") == "OK" ? "Healthy" : "Warning"
                        };

                        var mappedLetters = new List<string>();

                        foreach (var p in partInstances)
                        {
                            if (p.CimInstanceProperties["DiskIndex"]?.Value?.ToString() == diskIndexStr && 
                                double.TryParse(p.CimInstanceProperties["Size"]?.Value?.ToString(), out var pSize))
                            {
                                var typeStr = p.CimInstanceProperties["Type"]?.Value?.ToString() ?? "";
                                var mappedType = typeStr.Contains("System") || typeStr.Contains("EFI") ? "System" : 
                                                 typeStr.Contains("Recovery") ? "Recovery" : "Data";
                                                 
                                var pDeviceId = p.CimInstanceProperties["DeviceID"]?.Value?.ToString() ?? "";
                                var label = pDeviceId;
                                
                                if (partToDrive.TryGetValue(pDeviceId, out var driveLetter))
                                {
                                    label = driveLetter;
                                    mappedLetters.Add(driveLetter);
                                }

                                model.Partitions.Add(new DiskPartition
                                {
                                    Label = label,
                                    SizeGB = Math.Round(pSize / 1073741824, 1),
                                    Type = mappedType
                                });
                            }
                        }

                        if (mappedLetters.Any())
                        {
                            model.Id = $"Drive {string.Join(", ", mappedLetters.OrderBy(x => x))}";
                        }
                        else
                        {
                            model.Id = $"Disk {diskIndexStr}";
                        }

                        disks.Add(model);
                    }
                }
                return disks;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to get disks for {Ip}", ip);
                return disks;
            }
        });
    }

    public async Task<List<VolumeModel>> GetVolumesAsync(string ip)
    {
        return await Task.Run(() =>
        {
            var vols = new List<VolumeModel>();
            try
            {
                using var session = CreateSession(ip);
                
                var logicalToPart = session.QueryInstances(@"root\cimv2", "WQL", "SELECT Antecedent, Dependent FROM Win32_LogicalDiskToPartition").ToList();
                var driveToDisk = new Dictionary<string, string>();
                foreach (var l2p in logicalToPart)
                {
                    var ant = l2p.CimInstanceProperties["Antecedent"]?.Value?.ToString() ?? "";
                    var dep = l2p.CimInstanceProperties["Dependent"]?.Value?.ToString() ?? "";
                    
                    var antMatch = System.Text.RegularExpressions.Regex.Match(ant, @"DeviceID\s*=\s*""Disk #(\d+)");
                    var depMatch = System.Text.RegularExpressions.Regex.Match(dep, @"DeviceID\s*=\s*""([^""]+)""");

                    if (antMatch.Success && depMatch.Success)
                    {
                        var diskNum = antMatch.Groups[1].Value;
                        var lId = depMatch.Groups[1].Value.Replace(":", "");
                        driveToDisk[lId] = "Disk " + diskNum;
                    }
                }

                // DriveType=3 is local disk
                var volInstances = session.QueryInstances(@"root\cimv2", "WQL", "SELECT Name, VolumeName, FileSystem, Size, FreeSpace, Status FROM Win32_LogicalDisk WHERE DriveType = 3").ToList();

                foreach (var v in volInstances)
                {
                    if (double.TryParse(v.CimInstanceProperties["Size"]?.Value?.ToString(), out var sizeBytes) &&
                        double.TryParse(v.CimInstanceProperties["FreeSpace"]?.Value?.ToString(), out var freeBytes))
                    {
                        var sizeGB = Math.Round(sizeBytes / 1073741824, 1);
                        var freeGB = Math.Round(freeBytes / 1073741824, 1);
                        var letter = (v.CimInstanceProperties["Name"]?.Value?.ToString() ?? "").Replace(":", "");

                        vols.Add(new VolumeModel
                        {
                            Letter = letter,
                            Label = v.CimInstanceProperties["VolumeName"]?.Value?.ToString() ?? "",
                            Fs = v.CimInstanceProperties["FileSystem"]?.Value?.ToString() ?? "Unknown",
                            SizeGB = sizeGB,
                            UsedGB = Math.Round(sizeGB - freeGB, 1),
                            Status = (v.CimInstanceProperties["Status"]?.Value?.ToString() ?? "OK") == "OK" ? "Healthy" : "At Risk",
                            DiskId = driveToDisk.TryGetValue(letter, out var dId) ? dId : "Unknown"
                        });
                    }
                }
                return vols;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to get volumes for {Ip}", ip);
                return vols;
            }
        });
    }

    public async Task<bool> RestartServerAsync(string ip)
    {
        return await Task.Run(() =>
        {
            try
            {
                using var session = CreateSession(ip);
                session.InvokeMethod(@"root\cimv2", "Win32_OperatingSystem", "Reboot", null);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to restart server {ip}");
                return false;
            }
        });
    }

    public async Task<bool> ShutdownServerAsync(string ip)
    {
        return await Task.Run(() =>
        {
            try
            {
                using var session = CreateSession(ip);
                session.InvokeMethod(@"root\cimv2", "Win32_OperatingSystem", "Shutdown", null);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to shutdown server {ip}");
                return false;
            }
        });
    }

    public async Task<bool> EnableWinRmAsync(string ip)
    {
        return await Task.Run(() =>
        {
            try
            {
                using var session = CreateSession(ip);
                var parameters = new CimMethodParametersCollection
                {
                    CimMethodParameter.Create("CommandLine", "powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \"Enable-PSRemoting -Force; winrm quickconfig -q\"", CimType.String, CimFlags.In)
                };
                var result = session.InvokeMethod(@"root\cimv2", "Win32_Process", "Create", parameters);
                return result.ReturnValue?.ToString() == "0";
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to remote-enable WinRM on {Ip}", ip);
                return false;
            }
        });
    }

    public void Dispose()
    {
    }
}
