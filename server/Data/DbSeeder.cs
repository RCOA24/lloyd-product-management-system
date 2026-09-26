using Lloyd.ProductManagement.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Lloyd.ProductManagement.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext context,
        IConfiguration configuration,
        IPasswordHasher<User> passwordHasher)
    {
        await SeedCategoriesAsync(context);
        await SeedProductsAsync(context);
        await SeedDevelopmentUserAsync(context, configuration, passwordHasher);
    }

    private static async Task SeedCategoriesAsync(ApplicationDbContext context)
    {
        if (await context.Categories.AnyAsync())
        {
            return;
        }

        var categories = new List<Category>
        {
            new()
            {
                Name = "Anti-Infective",
                Description = "Products used in the management of infections."
            },
            new()
            {
                Name = "Analgesic",
                Description = "Products associated with pain management."
            },
            new()
            {
                Name = "Antihistamine",
                Description = "Products associated with allergic conditions."
            },
            new()
            {
                Name = "Vitamin",
                Description = "Vitamin and nutritional products."
            },
            new()
            {
                Name = "Antifungal",
                Description = "Products associated with fungal conditions."
            },
            new()
            {
                Name = "Other",
                Description = "Products not classified under the primary categories."
            }
        };

        await context.Categories.AddRangeAsync(categories);
        await context.SaveChangesAsync();
    }

    private static async Task SeedProductsAsync(ApplicationDbContext context)
    {
        var categoryIds = await context.Categories
            .Where(category => category.IsActive)
            .ToDictionaryAsync(category => category.Name, category => category.Id);
        var existingNames = new HashSet<string>(
            await context.Products.Select(product => product.ProductName).ToListAsync(),
            StringComparer.OrdinalIgnoreCase);

        // Generic pharmaceutical entries are adapted from the public Lloyd Laboratories
        // product-capability page for demonstration purposes; they are not official SKUs.
        var productSeeds = new (string ProductName, string CategoryName, string AvailabilityStatus)[]
        {
            ("Ibuprofen", "Analgesic", "Available"),
            ("Paracetamol", "Analgesic", "Available"),
            ("Tramadol", "Analgesic", "Available"),
            ("Mefenamic Acid", "Analgesic", "Available"),
            ("Naproxen", "Analgesic", "Available"),
            ("Amoxicillin", "Anti-Infective", "Available"),
            ("Ampicillin", "Anti-Infective", "Available"),
            ("Co-Amoxiclav", "Anti-Infective", "Available"),
            ("Ciprofloxacin", "Anti-Infective", "Available"),
            ("Doxycycline Hyclate", "Anti-Infective", "Available"),
            ("Metronidazole", "Anti-Infective", "Available"),
            ("Fluconazole", "Antifungal", "Available"),
            ("Ketoconazole", "Antifungal", "Available"),
            ("Miconazole", "Antifungal", "Available"),
            ("Chlorphenamine Maleate", "Antihistamine", "Available"),
            ("Diphenhydramine HCl", "Antihistamine", "Available"),
            ("Loratadine", "Antihistamine", "Available"),
            ("Ascorbic Acid", "Vitamin", "Available"),
            ("Calcium Ascorbate", "Vitamin", "Available"),
            ("Multivitamins", "Vitamin", "Available"),
            ("Natural Vitamin E", "Vitamin", "Available"),
            ("Demo Product - Out of Stock", "Analgesic", "OutOfStock"),
            ("Demo Antibiotic - Out of Stock", "Anti-Infective", "OutOfStock"),
            ("Demo Antifungal - Out of Stock", "Antifungal", "OutOfStock"),
            ("Demo Antihistamine - Out of Stock", "Antihistamine", "OutOfStock"),
            ("Demo Vitamin - Out of Stock", "Vitamin", "OutOfStock"),
            ("Demo Other Product - Out of Stock", "Other", "OutOfStock")
        };

        var products = productSeeds
            .Where(seed => !existingNames.Contains(seed.ProductName))
            .Where(seed => categoryIds.ContainsKey(seed.CategoryName))
            .Select(seed => new Product
            {
                ProductName = seed.ProductName,
                CategoryId = categoryIds[seed.CategoryName],
                DosageForm = "Not specified",
                Description = "Publicly listed generic entry included as technical-exam demonstration data.",
                AvailabilityStatus = seed.AvailabilityStatus,
                IsActive = true
            })
            .ToList();

        if (products.Count == 0)
        {
            return;
        }

        await context.Products.AddRangeAsync(products);
        await context.SaveChangesAsync();
    }

    private static async Task SeedDevelopmentUserAsync(
        ApplicationDbContext context,
        IConfiguration configuration,
        IPasswordHasher<User> passwordHasher)
    {
        var username = configuration["SeedAdmin:Username"]?.Trim();
        var password = configuration["SeedAdmin:Password"];

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        if (await context.Users.AnyAsync())
        {
            return;
        }

        var user = new User
        {
            Username = username,
            FullName = "System Administrator",
            Role = "Admin",
            IsActive = true
        };
        user.PasswordHash = passwordHasher.HashPassword(user, password);

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();
    }
}
