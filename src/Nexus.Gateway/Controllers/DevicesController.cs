using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text.Json.Serialization;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{serverId}/devices")]
public class DevicesController : ControllerBase
{
    public class DeviceDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Other";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "OK";

        [JsonPropertyName("driverVersion")]
        public string DriverVersion { get; set; } = "1.0.0.0";

        [JsonPropertyName("hardwareId")]
        public string HardwareId { get; set; } = string.Empty;
    }

    [HttpGet]
    public IActionResult GetDevices([FromRoute] string serverId)
    {
        var devices = new List<DeviceDto>();
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "powershell",
                Arguments = "-NoProfile -Command \"Get-PnpDevice | Select-Object -First 30 InstanceId, FriendlyName, Class, Status | ConvertTo-Json\"",
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
                            string name = item["FriendlyName"]?.ToString() ?? "";
                            if (string.IsNullOrEmpty(name)) continue;

                            devices.Add(new DeviceDto
                            {
                                Id = item["InstanceId"]?.ToString() ?? Guid.NewGuid().ToString(),
                                Name = name,
                                Category = item["Class"]?.ToString() ?? "System",
                                Status = item["Status"]?.ToString() ?? "OK",
                                DriverVersion = "10.0.22621.1",
                                HardwareId = item["InstanceId"]?.ToString() ?? ""
                            });
                        }
                    }
                }
            }
        }
        catch { }

        return Ok(devices);
    }
}
