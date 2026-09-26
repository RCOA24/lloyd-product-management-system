namespace Lloyd.ProductManagement.Api.DTOs.Products;

public sealed class ProductResponse
{
    public int Id { get; init; }

    public string ProductName { get; init; } = string.Empty;

    public string? GenericName { get; init; }

    public int CategoryId { get; init; }

    public string CategoryName { get; init; } = string.Empty;

    public string DosageForm { get; init; } = string.Empty;

    public string? Strength { get; init; }

    public string? Description { get; init; }

    public bool IsActive { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime? UpdatedAt { get; init; }
}
