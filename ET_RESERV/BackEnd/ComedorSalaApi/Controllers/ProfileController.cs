using ComedorSalaApi.Data;
using ComedorSalaApi.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ComedorSalaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher<ComedorSalaApi.Models.User> _passwordHasher;

    public ProfileController(AppDbContext db, IPasswordHasher<ComedorSalaApi.Models.User> passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    private int GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                  ?? User.FindFirstValue("sub");
        return int.Parse(sub!);
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = GetCurrentUserId();
        var user = await _db.Users.FindAsync(userId);
        
        if (user == null)
            return NotFound("Usuario no encontrado.");

        // Verificar la contraseña actual
        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword);
        if (verificationResult == PasswordVerificationResult.Failed)
            return BadRequest("La contraseña actual es incorrecta.");

        // Validar que la nueva contraseña no sea igual a la actual
        if (request.CurrentPassword == request.NewPassword)
            return BadRequest("La nueva contraseña debe ser diferente a la actual.");

        // Actualizar la contraseña
        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        await _db.SaveChangesAsync();

        return Ok(new { Message = "Contraseña actualizada exitosamente" });
    }
}
