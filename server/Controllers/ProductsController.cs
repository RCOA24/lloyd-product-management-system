using Lloyd.ProductManagement.Api.Data;
using Lloyd.ProductManagement.Api.DTOs.Products;
using Lloyd.ProductManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lloyd.ProductManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class ProductsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProductsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<ProductResponse>> CreateProduct(
        ProductCreateRequest request,
        CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .AsNoTracking()
            .SingleOrDefaultAsync(
                item => item.Id == request.CategoryId && item.IsActive,
                cancellationToken);

        if (category is null)
        {
            return NotFound(new
            {
                message = "Active category not found."
            });
        }

        if (string.IsNullOrWhiteSpace(request.ProductName))
        {
            ModelState.AddModelError(nameof(request.ProductName), "Product name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.DosageForm))
        {
            ModelState.AddModelError(nameof(request.DosageForm), "Dosage form is required.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var product = new Product
        {
            ProductName = request.ProductName.Trim(),
            GenericName = NormalizeOptional(request.GenericName),
            CategoryId = category.Id,
            DosageForm = request.DosageForm.Trim(),
            Strength = NormalizeOptional(request.Strength),
            Description = NormalizeOptional(request.Description),
            IsActive = true
        };

        await _context.Products.AddAsync(product, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var response = new ProductResponse
        {
            Id = product.Id,
            ProductName = product.ProductName,
            GenericName = product.GenericName,
            CategoryId = product.CategoryId,
            CategoryName = category.Name,
            DosageForm = product.DosageForm,
            Strength = product.Strength,
            Description = product.Description,
            IsActive = product.IsActive,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt
        };

        return Created($"/api/products/{product.Id}", response);
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}
