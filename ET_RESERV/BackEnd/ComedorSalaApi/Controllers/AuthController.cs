using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ComedorSalaApi.Data;
using ComedorSalaApi.Dtos;
using ComedorSalaApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ComedorSalaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext db, IPasswordHasher<User> passwordHasher, IConfiguration config)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || !user.IsActive)
            return Unauthorized("Credenciales inválidas.");

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
            return Unauthorized("Credenciales inválidas.");

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return new LoginResponse
        {
            Token = token,
            FullName = $"{user.FirstName} {user.LastName}",
            Role = user.Role.ToString()
        };
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSection = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"]!));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var expiresMinutes = int.Parse(jwtSection["ExpiresMinutes"] ?? "60");

        var token = new JwtSecurityToken(
            issuer: jwtSection["Issuer"],
            audience: jwtSection["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] CreateEmployeeRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest("Ya existe un usuario con ese correo.");

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Area = request.Area,
            Role = UserRole.Employee,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new { Message = "User registered successfully" });
    }
}