using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Nexus.ControlPlane.Data;

public sealed class ControlPlaneDbContextFactory : IDesignTimeDbContextFactory<ControlPlaneDbContext>
{
    public ControlPlaneDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<ControlPlaneDbContext>()
            .UseSqlite("Data Source=nexus-control-plane.design.db")
            .Options;

        return new ControlPlaneDbContext(options);
    }
}
