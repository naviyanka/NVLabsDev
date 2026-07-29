using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text.Json.Serialization;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{serverId}")]
public class VmsController : ControllerBase
{
    public class HyperVVmDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Running";

        [JsonPropertyName("cpuUsage")]
        public double CpuUsage { get; set; } = 0;

        [JsonPropertyName("memoryMB")]
        public long MemoryMB { get; set; } = 4096;

        [JsonPropertyName("uptime")]
        public string Uptime { get; set; } = "0d 0h";

        [JsonPropertyName("vcpus")]
        public int Vcpus { get; set; } = 2;

        [JsonPropertyName("generation")]
        public int Generation { get; set; } = 2;

        [JsonPropertyName("dynamicMemory")]
        public bool DynamicMemory { get; set; } = true;

        [JsonPropertyName("notes")]
        public string Notes { get; set; } = string.Empty;
    }

    public class VirtualSwitchDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("switchType")]
        public string SwitchType { get; set; } = "External";

        [JsonPropertyName("allowManagementOS")]
        public bool AllowManagementOS { get; set; } = true;

        [JsonPropertyName("netAdapterInterfaceDescription")]
        public string? NetAdapterInterfaceDescription { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Up";
    }


    [HttpGet("vms")]
    public IActionResult GetVms([FromRoute] string serverId)
    {
        var vms = new List<HyperVVmDto>();
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "powershell",
                Arguments = "-NoProfile -Command \"Get-VM | Select-Object Id, Name, State, CPUUsage, MemoryAssigned, Uptime, ProcessorCount, Generation | ConvertTo-Json\"",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            using var proc = Process.Start(psi);
            if (proc != null)
            {
                string json = proc.StandardOutput.ReadToEnd();
                proc.WaitForExit();
                if (!string.IsNullOrWhiteSpace(json))
                {
                    var parsed = System.Text.Json.JsonSerializer.Deserialize<List<System.Text.Json.Nodes.JsonObject>>(json);
                    if (parsed != null)
                    {
                        foreach (var item in parsed)
                        {
                            vms.Add(new HyperVVmDto
                            {
                                Id = item["Id"]?.ToString() ?? Guid.NewGuid().ToString(),
                                Name = item["Name"]?.ToString() ?? "VM",
                                Status = item["State"]?.ToString() ?? "Off",
                                CpuUsage = Convert.ToDouble(item["CPUUsage"]?.ToString() ?? "0"),
                                MemoryMB = Convert.ToInt64(item["MemoryAssigned"]?.ToString() ?? "2048") / (1024 * 1024),
                                Uptime = item["Uptime"]?.ToString() ?? "0d 0h",
                                Vcpus = Convert.ToInt32(item["ProcessorCount"]?.ToString() ?? "2"),
                                Generation = Convert.ToInt32(item["Generation"]?.ToString() ?? "2")
                            });
                        }
                    }
                }
            }
        }
        catch
        {
            /* Hyper-V feature not enabled */
        }

        return Ok(vms);
    }

    [HttpPost("vms/{vmId}/{action}")]
    public IActionResult ControlVm([FromRoute] string serverId, [FromRoute] string vmId, [FromRoute] string action)
    {
        string psCmd = action.ToLower() switch
        {
            "start" => $"Start-VM -Name '{vmId}' -ErrorAction SilentlyContinue",
            "stop" => $"Stop-VM -Name '{vmId}' -Force -ErrorAction SilentlyContinue",
            "restart" => $"Restart-VM -Name '{vmId}' -Force -ErrorAction SilentlyContinue",
            "pause" => $"Suspend-VM -Name '{vmId}' -ErrorAction SilentlyContinue",
            "resume" => $"Resume-VM -Name '{vmId}' -ErrorAction SilentlyContinue",
            _ => ""
        };

        if (!string.IsNullOrEmpty(psCmd))
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "powershell",
                    Arguments = $"-NoProfile -Command \"{psCmd}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true
                });
            }
            catch { }
        }

        return Ok(new { success = true });
    }

    [HttpDelete("vms/{vmId}")]
    public IActionResult DeleteVm([FromRoute] string serverId, [FromRoute] string vmId)
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "powershell",
                Arguments = $"-NoProfile -Command \"Remove-VM -Name '{vmId}' -Force -ErrorAction SilentlyContinue\"",
                UseShellExecute = false,
                CreateNoWindow = true
            });
        }
        catch { }

        return Ok(new { success = true });
    }

    [HttpGet("vswitches")]
    public IActionResult GetVirtualSwitches([FromRoute] string serverId)
    {
        var switches = new List<VirtualSwitchDto>();
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "powershell",
                Arguments = "-NoProfile -Command \"Get-VMSwitch | Select-Object Id, Name, SwitchType, AllowManagementOS, NetAdapterInterfaceDescription | ConvertTo-Json\"",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            using var proc = Process.Start(psi);
            if (proc != null)
            {
                string json = proc.StandardOutput.ReadToEnd();
                proc.WaitForExit();
                if (!string.IsNullOrWhiteSpace(json))
                {
                    var parsed = System.Text.Json.JsonSerializer.Deserialize<List<System.Text.Json.Nodes.JsonObject>>(json);
                    if (parsed != null)
                    {
                        foreach (var item in parsed)
                        {
                            switches.Add(new VirtualSwitchDto
                            {
                                Id = item["Id"]?.ToString() ?? Guid.NewGuid().ToString(),
                                Name = item["Name"]?.ToString() ?? "vSwitch",
                                SwitchType = item["SwitchType"]?.ToString() ?? "External",
                                AllowManagementOS = item["AllowManagementOS"]?.ToString()?.ToLower() == "true",
                                NetAdapterInterfaceDescription = item["NetAdapterInterfaceDescription"]?.ToString()
                            });
                        }
                    }
                }
            }
        }
        catch { }

        return Ok(switches);
    }


}
