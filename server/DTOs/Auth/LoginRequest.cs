using System.ComponentModel.DataAnnotations;

namespace Lloyd.ProductManagement.Api.DTOs.Auth;

public sealed class LoginRequest
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
