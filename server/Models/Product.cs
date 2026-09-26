namespace Lloyd.ProductManagement.Api.Models;

public class Product
{
    public int Id { get; set; }

    public string ProductName { get; set; } = string.Empty;

    public string? GenericName { get; set; }

    public int CategoryId { get; set; }

    public string DosageForm { get; set; } = string.Empty;

    public string? Strength { get; set; }

    public string? Description { get; set; }

    public string AvailabilityStatus { get; set; } = "Available";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Category Category { get; set; } = null!;
}