using System.Security.Cryptography;
using System.Text;
using Lloyd.ProductManagement.Api.Configuration;
using Lloyd.ProductManagement.Api.Data;
using Lloyd.ProductManagement.Api.Models;
using Lloyd.ProductManagement.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Register controllers.
builder.Services.AddControllers();

// Register Entity Framework Core.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

var jwtOptions = new JwtOptions
{
    Issuer = builder.Configuration["Jwt:Issuer"] ?? "Lloyd.ProductManagement.Api",
    Audience = builder.Configuration["Jwt:Audience"] ?? "Lloyd.ProductManagement.Client",
    Key = builder.Configuration["Jwt:Key"] ?? string.Empty,
    ExpirationMinutes = int.TryParse(
        builder.Configuration["Jwt:ExpirationMinutes"],
        out var expirationMinutes) && expirationMinutes > 0
        ? expirationMinutes
        : 60
};

if (string.IsNullOrWhiteSpace(jwtOptions.Key))
{
    if (!builder.Environment.IsDevelopment())
    {
        throw new InvalidOperationException(
            "Jwt:Key must be configured outside the Development environment.");
    }

    jwtOptions.Key = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
}

if (Encoding.UTF8.GetByteCount(jwtOptions.Key) < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key must be at least 32 bytes long.");
}

builder.Services.AddSingleton(jwtOptions);
builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<AuthService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

// OpenAPI.
builder.Services.AddOpenApi();

var app = builder.Build();

// Seed initial database data.
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider
        .GetRequiredService<ApplicationDbContext>();
    var passwordHasher = scope.ServiceProvider
        .GetRequiredService<IPasswordHasher<User>>();

    await dbContext.Database.MigrateAsync();

    await DbSeeder.SeedAsync(
        dbContext,
        builder.Configuration,
        passwordHasher);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

// Map attribute-routed controllers.
app.MapControllers();

app.Run();
