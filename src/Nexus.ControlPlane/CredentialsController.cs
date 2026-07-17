using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Nexus.ControlPlane.Credentials;

namespace Nexus.ControlPlane.Controllers;

[ApiController]
[Route("api/v2/credentials")]
[Authorize(Policy = "CredentialAdministrators")]
public sealed class CredentialsController(ICredentialVault vault) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CredentialSummary>>> List(CancellationToken cancellationToken) =>
        Ok(await vault.ListAsync(cancellationToken));

    [HttpPost]
    public async Task<ActionResult<CredentialSummary>> Create(
        CreateCredentialRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var credential = await vault.CreateAsync(request, GetActor(), cancellationToken);
            return Created($"/api/v2/credentials/{credential.Id}", credential);
        }
        catch (CredentialConflictException exception)
        {
            return Conflict(CreateProblem(StatusCodes.Status409Conflict, "Credential name conflict", exception.Message));
        }
    }

    [HttpPut("{id:guid}/secret")]
    public async Task<ActionResult<CredentialSummary>> Rotate(
        Guid id,
        RotateCredentialRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await vault.RotateAsync(id, request.Secret, GetActor(), cancellationToken));
        }
        catch (CredentialNotFoundException exception)
        {
            return NotFound(CreateProblem(StatusCodes.Status404NotFound, "Credential not found", exception.Message));
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await vault.DeleteAsync(id, cancellationToken);
            return NoContent();
        }
        catch (CredentialNotFoundException exception)
        {
            return NotFound(CreateProblem(StatusCodes.Status404NotFound, "Credential not found", exception.Message));
        }
    }

    private string GetActor() =>
        User.Identity?.Name
        ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? "unknown";

    private ProblemDetails CreateProblem(int status, string title, string detail) => new()
    {
        Status = status,
        Title = title,
        Detail = detail,
        Instance = HttpContext.Request.Path
    };
}
