using Application.DTOs.Auth;
using Application.Exceptions;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services;

public class AuthService : IAuthService
{
    private readonly IGenericRepository<User> _userRepository;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(IGenericRepository<User> userRepository, IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken)
    {
        var user = await _userRepository.FindOneAsync(u => u.Email == dto.Email, cancellationToken);
        
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid Credentials");
        }

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponseDto(user.Id, user.Email, user.FirstName, user.LastName, user.Role, token);
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken)
    {
        var existingUser = await _userRepository.FindOneAsync(u => u.Email == dto.Email, cancellationToken);
        if (existingUser != null)
        {
            throw new ValidationException(new [] { new FluentValidation.Results.ValidationFailure("Email", "Email already exists") });
        }

        var user = new User
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            Address = dto.Address,
            Role = "Customer",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        await _userRepository.AddAsync(user, cancellationToken);
        
        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponseDto(user.Id, user.Email, user.FirstName, user.LastName, user.Role, token);
    }
}