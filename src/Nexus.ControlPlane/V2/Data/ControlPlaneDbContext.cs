using Microsoft.EntityFrameworkCore;

namespace Nexus.ControlPlane.Data;

public sealed class ControlPlaneDbContext(DbContextOptions<ControlPlaneDbContext> options) : DbContext(options)
{
    public DbSet<CredentialProfile> CredentialProfiles => Set<CredentialProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var credentials = modelBuilder.Entity<CredentialProfile>();
        credentials.ToTable("credential_profiles");
        credentials.HasKey(profile => profile.Id);
        credentials.Property(profile => profile.Name).HasMaxLength(120).UseCollation("NOCASE");
        credentials.HasIndex(profile => profile.Name).IsUnique();
        credentials.Property(profile => profile.UserName).HasMaxLength(256);
        credentials.Property(profile => profile.Domain).HasMaxLength(256);
        credentials.Property(profile => profile.ProtectedSecret).IsRequired();
        credentials.Property(profile => profile.CreatedBy).HasMaxLength(256);
        credentials.Property(profile => profile.UpdatedBy).HasMaxLength(256);
        credentials.Property(profile => profile.ConcurrencyToken).IsConcurrencyToken();
    }
}
