namespace Lloyd.ProductManagement.Api.DTOs.Reports;

public sealed class ProductSummaryReportResponse
{
    public int TotalProducts { get; init; }

    public int ActiveProducts { get; init; }

    public int InactiveProducts { get; init; }

    public List<NamedCountResponse> ProductsByCategory { get; init; } = [];

    public List<NamedCountResponse> ProductsByDosageForm { get; init; } = [];
}

public sealed class NamedCountResponse
{
    public string Name { get; init; } = string.Empty;

    public int Count { get; init; }
}
