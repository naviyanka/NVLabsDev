using System.ComponentModel.DataAnnotations;

namespace Nexus.Gateway.Models;

public class SecurityEventLog
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ServerIp { get; set; } = "";
    public int EventId { get; set; }
    public string Level { get; set; } = "";
    public DateTime TimeCreated { get; set; }
    public string Message { get; set; } = "";
    public long RecordId { get; set; }
}

public class SecuritySnapshot
{
    [Key]
    public string ServerIp { get; set; } = "";
    public string OpenPortsJson { get; set; } = "[]";
    public string LocalAdminsJson { get; set; } = "[]";
    public int FailedLogins24h { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class SecurityDashboardDto
{
    public IEnumerable<SecurityEventLog> Events { get; set; } = new List<SecurityEventLog>();
    public IEnumerable<OpenPortDto> OpenPorts { get; set; } = new List<OpenPortDto>();
    public IEnumerable<LocalAdminDto> LocalAdmins { get; set; } = new List<LocalAdminDto>();
    public int FailedLogins24h { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class OpenPortDto
{
    public int LocalPort { get; set; }
    public string Protocol { get; set; } = "TCP";
    public string ProcessName { get; set; } = "";
    public string State { get; set; } = "";
}

public class LocalAdminDto
{
    public string Name { get; set; } = "";
    public string PrincipalSource { get; set; } = "";
    public bool Expected { get; set; }
}
