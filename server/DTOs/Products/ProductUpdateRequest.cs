using System.ComponentModel.DataAnnotations;

namespace Lloyd.ProductManagement.Api.DTOs.Products;

public sealed class ProductUpdateRequest
{
    [Required]
    [StringLength(150)]
    public string ProductName { get; set; } = string.Empty;

    [StringLength(150)]
    public string? GenericName { get; set; }

    [Range(1, int.MaxValue)]
    public int CategoryId { get; set; }

    [Required]
    [StringLength(100)]
    public string DosageForm { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Strength { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(20)]
    public string AvailabilityStatus { get; set; } = "Available";
}
