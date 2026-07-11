using Nexus.Gateway.Models;
using Nexus.Gateway.Data;
using Microsoft.EntityFrameworkCore;

namespace Nexus.Gateway.Services;

public class ServerService
{
    private readonly NexusContext _db;
    private readonly ActiveDirectoryService _adService;
    private readonly CimService _cimService;
    private readonly ILogger<ServerService> _logger;

    public ServerService(NexusContext db, ActiveDirectoryService adService, CimService cimService, ILogger<ServerService> logger)
    {
        _db = db;
        _adService = adService;
        _cimService = cimService;
        _logger = logger;
    }

    public async Task<List<Server>> GetServersAsync()
    {
        try
        {
            // Ensure local machine is present
            var localMachineName = Environment.MachineName;
            var localId = localMachineName.ToLowerInvariant();
            var localExists = await _db.Servers.AnyAsync(s => s.Id == localId || s.Id == "localhost" || s.Ip == "127.0.0.1");
            if (!localExists)
            {
                var localServer = new Server
                {
                    Id = localId,
                    Name = localMachineName,
                    Ip = "127.0.0.1",
                    Role = "Local Server",
                    Site = "Local",
                    IsAdFetched = false,
                    Status = "offline"
                };
                _db.Servers.Add(localServer);
                await _db.SaveChangesAsync();
            }

            var adServers = await _adService.GetDomainComputersAsync();
            
            foreach (var adServer in adServers)
            {
                var existing = await _db.Servers.FirstOrDefaultAsync(s => s.Id == adServer.Id);
                if (existing == null)
                {
                    adServer.IsAdFetched = true;
                    _db.Servers.Add(adServer);
                    _ = Task.Run(() => _cimService.EnableWinRmAsync(adServer.Ip)); // Fire and forget
                }
                else
                {
                    if (existing.IsAdFetched && existing.Ip != adServer.Ip && adServer.Ip != adServer.Name)
                    {
                        existing.Ip = adServer.Ip;
                    }
                }
            }
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to sync AD servers to DB.");
        }

        return await _db.Servers.ToListAsync();
    }

    public async Task<Server> AddManualServerAsync(ServerCreateDto dto)
    {
        var server = new Server
        {
            Id = dto.Name.ToLowerInvariant(),
            Name = dto.Name,
            Ip = dto.Ip,
            Role = dto.Role,
            IsAdFetched = false
        };

        if (!await _db.Servers.AnyAsync(s => s.Id == server.Id || s.Ip == server.Ip))
        {
            _db.Servers.Add(server);
            await _db.SaveChangesAsync();
            
            // Auto configure WinRM on the new server
            _ = Task.Run(() => _cimService.EnableWinRmAsync(server.Ip));
        }

        return server;
    }

    public async Task<Server?> UpdateServerAsync(string ip, ServerCreateDto dto)
    {
        var server = await _db.Servers.FirstOrDefaultAsync(s => s.Ip == ip);
        if (server == null) return null;

        server.Name = dto.Name;
        if (!string.IsNullOrWhiteSpace(dto.Ip) && dto.Ip != ip)
        {
            // Optional: allow changing IP if not taken
            if (!await _db.Servers.AnyAsync(s => s.Ip == dto.Ip))
            {
                server.Ip = dto.Ip;
            }
        }
        server.Role = dto.Role;

        await _db.SaveChangesAsync();
        return server;
    }

    public async Task<bool> DeleteServerAsync(string ip)
    {
        var server = await _db.Servers.FirstOrDefaultAsync(s => s.Ip == ip);
        if (server == null) return false;
        
        _db.Servers.Remove(server);
        await _db.SaveChangesAsync();
        return true;
    }
}
