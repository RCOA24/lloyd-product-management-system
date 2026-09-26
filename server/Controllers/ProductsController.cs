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

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductResponse>> UpdateProduct(
        int id,
        ProductUpdateRequest request,
        CancellationToken cancellationToken)
    {
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

        var product = await _context.Products
            .SingleOrDefaultAsync(
                item => item.Id == id && item.IsActive,
                cancellationToken);

        if (product is null)
        {
            return NotFound(new
            {
                message = "Product not found."
            });
        }

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

        product.ProductName = request.ProductName.Trim();
        product.GenericName = NormalizeOptional(request.GenericName);
        product.CategoryId = category.Id;
        product.DosageForm = request.DosageForm.Trim();
        product.Strength = NormalizeOptional(request.Strength);
        product.Description = NormalizeOptional(request.Description);
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new ProductResponse
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
        });
    }

    [HttpGet]
    public async Task<ActionResult<List<ProductResponse>>> GetProducts(
        [FromQuery] string? search,
        [FromQuery] int? categoryId,
        CancellationToken cancellationToken)
    {
        var query = _context.Products
            .AsNoTracking()
            .Where(product => product.IsActive);

        if (categoryId.HasValue)
        {
            query = query.Where(product => product.CategoryId == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.Trim();
            query = query.Where(product =>
                product.ProductName.Contains(searchTerm) ||
                (product.GenericName != null && product.GenericName.Contains(searchTerm)) ||
                product.DosageForm.Contains(searchTerm));
        }

        var products = await ProjectProducts(query.OrderBy(product => product.ProductName))
            .ToListAsync(cancellationToken);

        return Ok(products);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductResponse>> GetProduct(
        int id,
        CancellationToken cancellationToken)
    {
        var product = await ProjectProducts(_context.Products
                .AsNoTracking()
                .Where(item => item.Id == id && item.IsActive))
            .SingleOrDefaultAsync(cancellationToken);

        if (product is null)
        {
            return NotFound(new
            {
                message = "Product not found."
            });
        }

        return Ok(product);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProduct(
        int id,
        CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .SingleOrDefaultAsync(
                item => item.Id == id && item.IsActive,
                cancellationToken);

        if (product is null)
        {
            return NotFound(new
            {
                message = "Product not found."
            });
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static IQueryable<ProductResponse> ProjectProducts(
        IQueryable<Product> products)
    {
        return products.Select(product => new ProductResponse
        {
            Id = product.Id,
            ProductName = product.ProductName,
            GenericName = product.GenericName,
            CategoryId = product.CategoryId,
            CategoryName = product.Category.Name,
            DosageForm = product.DosageForm,
            Strength = product.Strength,
            Description = product.Description,
            IsActive = product.IsActive,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt
        });
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}
