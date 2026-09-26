namespace Lloyd.ProductManagement.Api.Configuration;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "Lloyd.ProductManagement.Api";

    public string Audience { get; set; } = "Lloyd.ProductManagement.Client";

    public string Key { get; set; } = string.Empty;

    public int ExpirationMinutes { get; set; } = 60;
}
