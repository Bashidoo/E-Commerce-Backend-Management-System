namespace Application.DTOs.Auth;

public record LoginDto(string Email, string Password);
public record RegisterDto(string FirstName, string LastName, string Email, string Password, string Address);
public record AuthResponseDto(int Id, string Email, string FirstName, string LastName, string Role, string Token);