using Lloyd.ProductManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Lloyd.ProductManagement.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
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
}