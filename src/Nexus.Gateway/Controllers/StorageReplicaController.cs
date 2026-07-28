using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexus.Gateway.Models;
using Nexus.Gateway.Services;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/servers/{serverId}/storage-replica")]
[Authorize]
public class StorageReplicaController : ControllerBase
{
    private readonly IPowerShellExecutionService _psService;
    private readonly ILogger<StorageReplicaController> _logger;

    // Strict validation patterns to prevent PowerShell injection
    private static readonly Regex SafeNamePattern = new(@"^[a-zA-Z0-9._\-]+$", RegexOptions.Compiled);
    private static readonly Regex SafeVolumePathPattern = new(@"^[a-zA-Z]:\\[a-zA-Z0-9\\_.\-\s]+$", RegexOptions.Compiled);
    private static readonly Regex SafeServerPattern = new(@"^[a-zA-Z0-9._\-]+$", RegexOptions.Compiled);

    public StorageReplicaController(IPowerShellExecutionService psService, ILogger<StorageReplicaController> logger)
    {
        _psService = psService;
        _logger = logger;
    }

    /// <summary>
    /// Validates that a partnership/group name contains only safe characters.
    /// </summary>
    private static bool IsValidName(string? value)
        => !string.IsNullOrWhiteSpace(value) && SafeNamePattern.IsMatch(value);

    /// <summary>
    /// Validates that a server name/hostname contains only safe characters.
    /// </summary>
    private static bool IsValidServer(string? value)
        => !string.IsNullOrWhiteSpace(value) && SafeServerPattern.IsMatch(value);

    /// <summary>
    /// Validates that a volume path matches expected Windows path format (e.g., "E:\Data").
    /// </summary>
    private static bool IsValidVolumePath(string? value)
        => !string.IsNullOrWhiteSpace(value) && SafeVolumePathPattern.IsMatch(value);

    /// <summary>
    /// List all Storage Replica partnerships on the target server.
    /// Uses Get-SRPartnership piped to ConvertTo-Json.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPartnerships([FromRoute] string serverId, CancellationToken ct)
    {
        try
        {
            var script = @"
$partnerships = Get-SRPartnership -ErrorAction SilentlyContinue | ForEach-Object {
    $group = Get-SRGroup -Name $_.ReplicationGroupName -ErrorAction SilentlyContinue
    $replication = $group | Get-SRPartnership -ErrorAction SilentlyContinue
    [PSCustomObject]@{
        id = $_.Name
        sourceServer = $_.SourceComputerName
        destServer = $_.DestinationComputerName
        sourceVol = $_.SourceRGName
        destVol = $_.DestinationRGName
        sourceLogVol = $_.SourceLogVolumeName
        destLogVol = $_.DestinationLogVolumeName
        mode = if ($_.ReplicationMode -eq 'Synchronous') { 'Synchronous' } else { 'Asynchronous' }
        status = $_.ReplicationStatus
        progress = if ($_.ReplicationStatus -eq 'ContinuouslyReplicating') { 100 } else { [int]$_.DataVolumesReplicationProgress }
        bytes = [long]$_.TotalBytesReplicated
        latencyMs = [double]$_.AverageLatencyMs
        transferRateMbps = [double]$_.AverageThroughputMBps
        name = $_.ReplicationGroupName
        replicationGroup = $_.ReplicationGroupName
        logSizeGb = [int]($_.LogSizeInBytes / 1GB)
        encryption = $_.IsEncrypted
        autoFailover = $_.EnableAutoFailover
    }
}
$partnerships | ConvertTo-Json -Depth 3
";
            var result = await _psService.ExecuteAsync(script, ct);

            if (result.ExitCode != 0 || string.IsNullOrWhiteSpace(result.StandardOutput))
            {
                _logger.LogWarning("Get-SRPartnership returned no data or failed. Exit: {Exit}, Err: {Err}",
                    result.ExitCode, result.StandardError);
                return Ok(Array.Empty<ReplicaPartnershipDto>());
            }

            var partnerships = JsonSerializer.Deserialize<List<ReplicaPartnershipDto>>(result.StandardOutput,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return Ok(partnerships ?? new List<ReplicaPartnershipDto>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Storage Replica partnerships for server {ServerId}", serverId);
            return Ok(Array.Empty<ReplicaPartnershipDto>());
        }
    }

    /// <summary>
    /// Create a new Storage Replica partnership using New-SRPartnership.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreatePartnership([FromRoute] string serverId,
        [FromBody] CreateReplicaPartnershipRequest request, CancellationToken ct)
    {
        try
        {
            // Validate all user-supplied inputs to prevent PowerShell injection
            if (!IsValidServer(request.SourceServer))
                return BadRequest(new { error = "Invalid SourceServer. Only alphanumeric, dots, hyphens, and underscores are allowed." });
            if (!IsValidServer(request.DestServer))
                return BadRequest(new { error = "Invalid DestServer. Only alphanumeric, dots, hyphens, and underscores are allowed." });
            if (!IsValidName(request.ReplicationGroup))
                return BadRequest(new { error = "Invalid ReplicationGroup name. Only alphanumeric, dots, hyphens, and underscores are allowed." });
            if (!IsValidVolumePath(request.SourceVol))
                return BadRequest(new { error = "Invalid SourceVol path. Must be a valid Windows path (e.g., E:\\Data)." });
            if (!IsValidVolumePath(request.DestVol))
                return BadRequest(new { error = "Invalid DestVol path. Must be a valid Windows path (e.g., E:\\Data)." });
            if (!IsValidVolumePath(request.SourceLogVol))
                return BadRequest(new { error = "Invalid SourceLogVol path. Must be a valid Windows path (e.g., E:\\Logs)." });
            if (!IsValidVolumePath(request.DestLogVol))
                return BadRequest(new { error = "Invalid DestLogVol path. Must be a valid Windows path (e.g., E:\\Logs)." });
            if (request.LogSizeGb < 1 || request.LogSizeGb > 1024)
                return BadRequest(new { error = "LogSizeGb must be between 1 and 1024." });

            var mode = request.Mode == "Asynchronous" ? "Asynchronous" : "Synchronous";
            var encryptionFlag = request.Encryption ? "-EnableEncryption" : "";

            var script = $@"
New-SRPartnership `
    -SourceComputerName '{request.SourceServer}' `
    -SourceRGName '{request.ReplicationGroup}' `
    -SourceVolumeName '{request.SourceVol}' `
    -SourceLogVolumeName '{request.SourceLogVol}' `
    -DestinationComputerName '{request.DestServer}' `
    -DestinationRGName '{request.ReplicationGroup}_Dest' `
    -DestinationVolumeName '{request.DestVol}' `
    -DestinationLogVolumeName '{request.DestLogVol}' `
    -LogSizeInBytes ({request.LogSizeGb}GB) `
    -ReplicationMode '{mode}' `
    {encryptionFlag} `
    -ErrorAction Stop | ConvertTo-Json
";
            var result = await _psService.ExecuteAsync(script, ct);

            if (result.ExitCode != 0)
            {
                _logger.LogError("New-SRPartnership failed: {Error}", result.StandardError);
                return StatusCode(500, new { error = "Failed to create Storage Replica partnership", detail = result.StandardError });
            }

            return Ok(new { success = true, message = "Storage Replica partnership created successfully." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Storage Replica partnership");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update settings on an existing Storage Replica partnership using Set-SRPartnership.
    /// </summary>
    [HttpPut("{partnershipId}")]
    public async Task<IActionResult> UpdatePartnership([FromRoute] string serverId,
        [FromRoute] string partnershipId, [FromBody] UpdateReplicaPartnershipRequest request, CancellationToken ct)
    {
        try
        {
            if (!IsValidName(partnershipId))
                return BadRequest(new { error = "Invalid partnershipId. Only alphanumeric, dots, hyphens, and underscores are allowed." });

            if (!string.IsNullOrEmpty(request.Mode) && request.Mode != "Synchronous" && request.Mode != "Asynchronous")
                return BadRequest(new { error = "Mode must be 'Synchronous' or 'Asynchronous'." });

            if (request.LogSizeGb.HasValue && (request.LogSizeGb.Value < 1 || request.LogSizeGb.Value > 1024))
                return BadRequest(new { error = "LogSizeGb must be between 1 and 1024." });

            var setClauses = new List<string>();

            if (!string.IsNullOrEmpty(request.Mode))
            {
                setClauses.Add($"-ReplicationMode '{request.Mode}'");
            }
            if (request.LogSizeGb.HasValue)
            {
                setClauses.Add($"-LogSizeInBytes ({request.LogSizeGb.Value}GB)");
            }
            if (request.Encryption.HasValue)
            {
                setClauses.Add(request.Encryption.Value ? "-EnableEncryption" : "-DisableEncryption");
            }

            if (setClauses.Count == 0)
            {
                return Ok(new { success = true, message = "No changes specified." });
            }

            var setParams = string.Join(" `\n    ", setClauses);
            var script = $@"
Set-SRPartnership -Name '{partnershipId}' `
    {setParams} `
    -ErrorAction Stop
";
            var result = await _psService.ExecuteAsync(script, ct);

            if (result.ExitCode != 0)
            {
                _logger.LogError("Set-SRPartnership failed: {Error}", result.StandardError);
                return StatusCode(500, new { error = "Failed to update partnership", detail = result.StandardError });
            }

            return Ok(new { success = true, message = "Partnership updated successfully." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Storage Replica partnership {Id}", partnershipId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a Storage Replica partnership using Remove-SRPartnership.
    /// </summary>
    [HttpDelete("{partnershipId}")]
    public async Task<IActionResult> DeletePartnership([FromRoute] string serverId,
        [FromRoute] string partnershipId, CancellationToken ct)
    {
        try
        {
            if (!IsValidName(partnershipId))
                return BadRequest(new { error = "Invalid partnershipId. Only alphanumeric, dots, hyphens, and underscores are allowed." });

            var script = $@"
Remove-SRPartnership -Name '{partnershipId}' -Force -ErrorAction Stop
Remove-SRGroup -Name '{partnershipId}' -Force -ErrorAction SilentlyContinue
";
            var result = await _psService.ExecuteAsync(script, ct);

            if (result.ExitCode != 0)
            {
                _logger.LogError("Remove-SRPartnership failed: {Error}", result.StandardError);
                return StatusCode(500, new { error = "Failed to remove partnership", detail = result.StandardError });
            }

            return Ok(new { success = true, message = "Partnership removed successfully." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Storage Replica partnership {Id}", partnershipId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Swap replication direction using Set-SRPartnership -NewSourceComputerName.
    /// </summary>
    [HttpPost("{partnershipId}/swap")]
    public async Task<IActionResult> SwapDirection([FromRoute] string serverId,
        [FromRoute] string partnershipId, CancellationToken ct)
    {
        try
        {
            if (!IsValidName(partnershipId))
                return BadRequest(new { error = "Invalid partnershipId. Only alphanumeric, dots, hyphens, and underscores are allowed." });

            var script = $@"
$partnership = Get-SRPartnership -Name '{partnershipId}' -ErrorAction Stop
Set-SRPartnership -Name '{partnershipId}' `
    -NewSourceComputerName $partnership.DestinationComputerName `
    -ErrorAction Stop
";
            var result = await _psService.ExecuteAsync(script, ct);

            if (result.ExitCode != 0)
            {
                _logger.LogError("Swap direction failed: {Error}", result.StandardError);
                return StatusCode(500, new { error = "Failed to swap replication direction", detail = result.StandardError });
            }

            return Ok(new { success = true, message = "Replication direction swapped." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error swapping direction for partnership {Id}", partnershipId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Execute disaster recovery failover by mounting destination volume.
    /// </summary>
    [HttpPost("{partnershipId}/failover")]
    public async Task<IActionResult> Failover([FromRoute] string serverId,
        [FromRoute] string partnershipId, CancellationToken ct)
    {
        try
        {
            if (!IsValidName(partnershipId))
                return BadRequest(new { error = "Invalid partnershipId. Only alphanumeric, dots, hyphens, and underscores are allowed." });

            var script = $@"
$partnership = Get-SRPartnership -Name '{partnershipId}' -ErrorAction Stop
$destComputer = $partnership.DestinationComputerName
$destGroup = $partnership.DestinationRGName

# Break partnership on destination to allow write access
Set-SRPartnership -Name '{partnershipId}' `
    -NewSourceComputerName $destComputer `
    -Force -ErrorAction Stop

Write-Output 'Failover completed. Destination volume is now primary.'
";
            var result = await _psService.ExecuteAsync(script, ct);

            if (result.ExitCode != 0)
            {
                _logger.LogError("Failover failed: {Error}", result.StandardError);
                return StatusCode(500, new { error = "Failover operation failed", detail = result.StandardError });
            }

            return Ok(new { success = true, message = "Failover executed. Target volume mounted as primary." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing failover for partnership {Id}", partnershipId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Toggle pause/resume using Suspend-SRPartnership or Resume-SRPartnership.
    /// </summary>
    [HttpPost("{partnershipId}/toggle-pause")]
    public async Task<IActionResult> TogglePause([FromRoute] string serverId,
        [FromRoute] string partnershipId, CancellationToken ct)
    {
        try
        {
            if (!IsValidName(partnershipId))
                return BadRequest(new { error = "Invalid partnershipId. Only alphanumeric, dots, hyphens, and underscores are allowed." });

            var script = $@"
$partnership = Get-SRPartnership -Name '{partnershipId}' -ErrorAction Stop
if ($partnership.ReplicationStatus -eq 'Suspended' -or $partnership.ReplicationStatus -eq 'Paused') {{
    Resume-SRPartnership -Name '{partnershipId}' -ErrorAction Stop
    Write-Output 'Resumed'
}} else {{
    Suspend-SRPartnership -Name '{partnershipId}' -ErrorAction Stop
    Write-Output 'Suspended'
}}
";
            var result = await _psService.ExecuteAsync(script, ct);

            if (result.ExitCode != 0)
            {
                _logger.LogError("Toggle pause failed: {Error}", result.StandardError);
                return StatusCode(500, new { error = "Failed to toggle pause state", detail = result.StandardError });
            }

            var action = result.StandardOutput.Trim().Contains("Resumed") ? "resumed" : "paused";
            return Ok(new { success = true, message = $"Replication {action} successfully." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling pause for partnership {Id}", partnershipId);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Force resynchronization using Sync-SRGroup.
    /// </summary>
    [HttpPost("{partnershipId}/resync")]
    public async Task<IActionResult> Resync([FromRoute] string serverId,
        [FromRoute] string partnershipId, CancellationToken ct)
    {
        try
        {
            if (!IsValidName(partnershipId))
                return BadRequest(new { error = "Invalid partnershipId. Only alphanumeric, dots, hyphens, and underscores are allowed." });

            var script = $@"
$partnership = Get-SRPartnership -Name '{partnershipId}' -ErrorAction Stop
Sync-SRGroup -Name $partnership.SourceRGName -Force -ErrorAction Stop
Write-Output 'Resynchronization initiated.'
";
            var result = await _psService.ExecuteAsync(script, ct);

            if (result.ExitCode != 0)
            {
                _logger.LogError("Resync failed: {Error}", result.StandardError);
                return StatusCode(500, new { error = "Failed to resynchronize", detail = result.StandardError });
            }

            return Ok(new { success = true, message = "Resynchronization initiated." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resyncing partnership {Id}", partnershipId);
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
