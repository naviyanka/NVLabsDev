using System.DirectoryServices.AccountManagement;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.Data;
using Nexus.Gateway.Models;

namespace Nexus.Gateway.Services;

public class ActiveDirectoryService
{
    private readonly NexusContext _db;
    private readonly ILogger<ActiveDirectoryService> _logger;

    public ActiveDirectoryService(NexusContext db, ILogger<ActiveDirectoryService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<Server>> GetDomainComputersAsync()
    {
        var servers = new List<Server>();
        var domainName = "nvlabs.com";
        try
        {
            var setting = await _db.AppSettings.FirstOrDefaultAsync(s => s.Id == "global");
            if (setting != null && !string.IsNullOrEmpty(setting.DefaultDomainName))
            {
                domainName = setting.DefaultDomainName;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load DefaultDomainName from AppSettings. Using fallback nvlabs.com.");
        }

        try
        {
            using var context = new PrincipalContext(ContextType.Domain, domainName);
            using var searcher = new ComputerPrincipal(context);
            using var search = new PrincipalSearcher(searcher);
            
            foreach (var result in search.FindAll())
            {
                if (result is ComputerPrincipal computer && !string.IsNullOrEmpty(computer.Name))
                {
                    string ip = computer.Name;
                    try
                    {
                        var addresses = await System.Net.Dns.GetHostAddressesAsync(computer.Name);
                        if (addresses.Length > 0)
                        {
                            ip = addresses[0].ToString();
                        }
                    }
                    catch (Exception)
                    {
                        // DNS resolution failed, keep fallback
                    }

                    servers.Add(new Server
                    {
                        Id = computer.Name.ToLower(),
                        Name = computer.Name,
                        Ip = ip,
                        Site = domainName,
                        Status = "offline",
                        Role = "Unknown"
                    });
                }
            }
        }
        catch (PrincipalServerDownException)
        {
            _logger.LogWarning("Failed to query AD domain {Domain}. Machine is likely not domain joined.", domainName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to query AD domain {Domain}. Machine might not be domain joined.", domainName);
        }
        return servers;
    }
}
