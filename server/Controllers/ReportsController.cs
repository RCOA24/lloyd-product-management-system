using Lloyd.ProductManagement.Api.Data;
using Lloyd.ProductManagement.Api.DTOs.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lloyd.ProductManagement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reports")]
public sealed class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ReportsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("products/summary")]
    public async Task<ActionResult<ProductSummaryReportResponse>> GetProductSummary(
        CancellationToken cancellationToken)
    {
        var products = _context.Products.AsNoTracking();

        var report = new ProductSummaryReportResponse
        {
            TotalProducts = await products.CountAsync(cancellationToken),
            ActiveProducts = await products.CountAsync(
                product => product.IsActive,
                cancellationToken),
            InactiveProducts = await products.CountAsync(
                product => !product.IsActive,
                cancellationToken),
            ProductsByCategory = await products
                .GroupBy(product => product.Category.Name)
                .Select(group => new NamedCountResponse
                {
                    Name = group.Key,
                    Count = group.Count()
                })
                .OrderBy(item => item.Name)
                .ToListAsync(cancellationToken),
            ProductsByDosageForm = await products
                .GroupBy(product => product.DosageForm)
                .Select(group => new NamedCountResponse
                {
                    Name = group.Key,
                    Count = group.Count()
                })
                .OrderBy(item => item.Name)
                .ToListAsync(cancellationToken)
        };

        return Ok(report);
    }
}
