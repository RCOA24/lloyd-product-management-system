using Lloyd.ProductManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Lloyd.ProductManagement.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUser(modelBuilder);
        ConfigureCategory(modelBuilder);
        ConfigureProduct(modelBuilder);
    }

    private static void ConfigureUser(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<User>();

        entity.ToTable("Users");

        entity.HasKey(x => x.Id);

        entity.Property(x => x.Username)
            .HasMaxLength(50)
            .IsRequired();

        entity.HasIndex(x => x.Username)
            .IsUnique();

        entity.Property(x => x.PasswordHash)
            .HasMaxLength(255)
            .IsRequired();

        entity.Property(x => x.FullName)
            .HasMaxLength(100)
            .IsRequired();

        entity.Property(x => x.Role)
            .HasMaxLength(50)
            .IsRequired();

        entity.Property(x => x.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");
    }

    private static void ConfigureCategory(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<Category>();

        entity.ToTable("Categories");

        entity.HasKey(x => x.Id);

        entity.Property(x => x.Name)
            .HasMaxLength(100)
            .IsRequired();

        entity.HasIndex(x => x.Name)
            .IsUnique();

        entity.Property(x => x.Description)
            .HasMaxLength(500);

        entity.Property(x => x.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");
    }

    private static void ConfigureProduct(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<Product>();

        entity.ToTable("Products");

        entity.HasKey(x => x.Id);

        entity.Property(x => x.ProductName)
            .HasMaxLength(150)
            .IsRequired();

        entity.Property(x => x.GenericName)
            .HasMaxLength(150);

        entity.Property(x => x.DosageForm)
            .HasMaxLength(100)
            .IsRequired();

        entity.Property(x => x.Strength)
            .HasMaxLength(100);

        entity.Property(x => x.Description)
            .HasMaxLength(1000);

        entity.Property(x => x.AvailabilityStatus)
            .HasMaxLength(20)
            .HasDefaultValue("Available")
            .IsRequired();

        entity.HasOne(x => x.Category)
            .WithMany(x => x.Products)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasIndex(x => x.CategoryId);

        entity.HasIndex(x => x.IsActive);

        entity.Property(x => x.CreatedAt)
            .HasDefaultValueSql("SYSUTCDATETIME()");
    }
}