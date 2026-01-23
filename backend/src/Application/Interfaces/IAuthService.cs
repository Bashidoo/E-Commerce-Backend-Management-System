using Application.DTOs.Auth;

namespace Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken);
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken);
}