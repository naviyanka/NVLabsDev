using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;
using System.Text.Json;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{ip}/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IPowerShellExecutionService _ps;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IPowerShellExecutionService ps, ILogger<UsersController> logger)
    {
        _ps = ps;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LocalUserModel>>> GetUsers(string ip)
    {
        try
        {
            var script = @"
                $users = Get-LocalUser -ErrorAction SilentlyContinue
                $result = @()
                foreach ($u in $users) {
                    $groups = @()
                    try {
                        $userGroups = Get-LocalGroup | Where-Object { 
                            $members = Get-LocalGroupMember -Group $_ -ErrorAction SilentlyContinue 
                            $members.Name -contains $u.Name -or $members.Name -match ("".*\\"" + $u.Name + ""$"") 
                        }
                        $groups = $userGroups.Name
                    } catch {}

                    $ll = '—'
                    if ($u.LastLogon) { $ll = $u.LastLogon.ToString('o') }

                    $result += [PSCustomObject]@{
                        Name = $u.Name
                        FullName = $u.FullName
                        LastLogin = $ll
                        Enabled = $u.Enabled
                        PasswordNeverExpires = ($u.PasswordExpires -eq $null -or $u.PasswordExpires -eq '')
                        Groups = $groups
                    }
                }
                $result | ConvertTo-Json -Compress -Depth 3 -WarningAction SilentlyContinue
            ";

            var base64 = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            var psCmd = $"-NoProfile -ExecutionPolicy Bypass -Command \"Invoke-Command -ComputerName {ip} -ScriptBlock {{ [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{base64}')) | Invoke-Expression }}\"";
            
            if (ip == "localhost" || ip == "127.0.0.1" || ip.Equals("dc", StringComparison.OrdinalIgnoreCase))
            {
                 psCmd = $"-NoProfile -ExecutionPolicy Bypass -Command \"[System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{base64}')) | Invoke-Expression\"";
            }

            var result = await _ps.ExecuteAsync(psCmd, HttpContext.RequestAborted);
            var output = result.StandardOutput;

            var userList = new List<LocalUserModel>();

            if (!string.IsNullOrWhiteSpace(output))
            {
                try
                {
                    using var doc = JsonDocument.Parse(output);
                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var el in doc.RootElement.EnumerateArray())
                        {
                            userList.Add(ParseUser(el));
                        }
                    }
                    else if (doc.RootElement.ValueKind == JsonValueKind.Object)
                    {
                        userList.Add(ParseUser(doc.RootElement));
                    }
                }
                catch (JsonException) { }
            }

            return Ok(userList);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get users for {Ip}", ip);
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("groups")]
    public async Task<ActionResult<IEnumerable<LocalGroupModel>>> GetGroups(string ip)
    {
        try
        {
            var script = @"
                $groups = Get-LocalGroup -ErrorAction SilentlyContinue
                $result = @()
                foreach ($g in $groups) {
                    $members = @()
                    try {
                        $mList = Get-LocalGroupMember -Group $g -ErrorAction SilentlyContinue
                        if ($mList) {
                            $members = $mList.Name
                        }
                    } catch {}

                    $result += [PSCustomObject]@{
                        Name = $g.Name
                        Description = $g.Description
                        Members = $members
                    }
                }
                $result | ConvertTo-Json -Compress -Depth 3 -WarningAction SilentlyContinue
            ";

            var base64 = Convert.ToBase64String(System.Text.Encoding.Unicode.GetBytes(script));
            var psCmd = $"-NoProfile -ExecutionPolicy Bypass -Command \"Invoke-Command -ComputerName {ip} -ScriptBlock {{ [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{base64}')) | Invoke-Expression }}\"";
            
            if (ip == "localhost" || ip == "127.0.0.1" || ip.Equals("dc", StringComparison.OrdinalIgnoreCase))
            {
                 psCmd = $"-NoProfile -ExecutionPolicy Bypass -Command \"[System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('{base64}')) | Invoke-Expression\"";
            }

            var result = await _ps.ExecuteAsync(psCmd, HttpContext.RequestAborted);
            var output = result.StandardOutput;

            var groupList = new List<LocalGroupModel>();

            if (!string.IsNullOrWhiteSpace(output))
            {
                try
                {
                    using var doc = JsonDocument.Parse(output);
                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var el in doc.RootElement.EnumerateArray())
                        {
                            groupList.Add(ParseGroup(el));
                        }
                    }
                    else if (doc.RootElement.ValueKind == JsonValueKind.Object)
                    {
                        groupList.Add(ParseGroup(doc.RootElement));
                    }
                }
                catch (JsonException) { }
            }

            return Ok(groupList);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get groups for {Ip}", ip);
            return StatusCode(500, ex.Message);
        }
    }

    private LocalUserModel ParseUser(JsonElement el)
    {
        var model = new LocalUserModel
        {
            Name = el.TryGetProperty("Name", out var name) ? name.GetString() ?? "" : "",
            FullName = el.TryGetProperty("FullName", out var fname) ? fname.GetString() ?? "" : "",
            LastLogin = el.TryGetProperty("LastLogin", out var ll) ? ll.GetString() ?? "" : "",
            Enabled = el.TryGetProperty("Enabled", out var en) && en.ValueKind == JsonValueKind.True,
            PasswordNeverExpires = el.TryGetProperty("PasswordNeverExpires", out var pne) && pne.ValueKind == JsonValueKind.True
        };

        if (el.TryGetProperty("Groups", out var g) && g.ValueKind == JsonValueKind.Array)
        {
            foreach (var group in g.EnumerateArray())
            {
                var gs = group.GetString();
                if (!string.IsNullOrEmpty(gs)) model.Groups.Add(gs);
            }
        }
        else if (g.ValueKind == JsonValueKind.String)
        {
            var gs = g.GetString();
            if (!string.IsNullOrEmpty(gs)) model.Groups.Add(gs);
        }

        return model;
    }

    private LocalGroupModel ParseGroup(JsonElement el)
    {
        var model = new LocalGroupModel
        {
            Name = el.TryGetProperty("Name", out var name) ? name.GetString() ?? "" : "",
            Description = el.TryGetProperty("Description", out var desc) ? desc.GetString() ?? "" : ""
        };

        if (el.TryGetProperty("Members", out var m) && m.ValueKind == JsonValueKind.Array)
        {
            foreach (var member in m.EnumerateArray())
            {
                var ms = member.GetString();
                if (!string.IsNullOrEmpty(ms)) model.Members.Add(ms);
            }
        }
        else if (m.ValueKind == JsonValueKind.String)
        {
            var ms = m.GetString();
            if (!string.IsNullOrEmpty(ms)) model.Members.Add(ms);
        }

        return model;
    }
}
