using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Nexus.ControlPlane.Controllers;
using Nexus.ControlPlane.Credentials;
using Nexus.ControlPlane.Data;

namespace Nexus.Gateway.Tests;

public sealed class CredentialsControllerTests : IAsyncLifetime
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private ControlPlaneDbContext _db = null!;
    private CredentialsController _controller = null!;

    public async Task InitializeAsync()
    {
        await _connection.OpenAsync();
        var options = new DbContextOptionsBuilder<ControlPlaneDbContext>()
            .UseSqlite(_connection)
            .Options;
        _db = new ControlPlaneDbContext(options);
        await _db.Database.MigrateAsync();
        var vault = new CredentialVault(_db, new DpapiCredentialProtector(), TimeProvider.System);
        _controller = new CredentialsController(vault)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        [new Claim(ClaimTypes.Name, "NEXUS\\admin")],
                        "test"))
                }
            }
        };
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task Create_returns_metadata_without_secret()
    {
        var result = await _controller.Create(
            new CreateCredentialRequest("Production", "operator", "CORP", "hidden-value"),
            CancellationToken.None);

        var created = Assert.IsType<CreatedResult>(result.Result);
        var json = JsonSerializer.Serialize(created.Value);

        Assert.DoesNotContain("hidden-value", json, StringComparison.Ordinal);
        Assert.DoesNotContain("protectedSecret", json, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Production", json, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Delete_unknown_id_returns_structured_problem()
    {
        var result = await _controller.Delete(Guid.NewGuid(), CancellationToken.None);

        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(notFound.Value);
        Assert.Equal(StatusCodes.Status404NotFound, problem.Status);
        Assert.Equal("Credential not found", problem.Title);
    }
}
