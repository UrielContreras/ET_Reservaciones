using ComedorSalaApi.Data;
using ComedorSalaApi.Dtos;
using ComedorSalaApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ComedorSalaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "HR")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher<User> _passwordHasher;

    public UsersController(AppDbContext db, IPasswordHasher<User> passwordHasher)
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

    [HttpPost("employees")]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeRequest request)
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
            IsActive = true
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, new { user.Id, user.Email });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var users = await _db.Users
            .Where(u => u.IsActive)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.Area,
                Role = u.Role.ToString()
            })
            .ToListAsync();
        
        return Ok(users);
    }

    [HttpDelete("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return NotFound("Usuario no encontrado.");

        // Eliminar permanentemente el usuario de la base de datos
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        return Ok(new { Message = "Usuario eliminado exitosamente" });
    }

    [HttpPost("change-password")]
    [Authorize]
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

    [HttpPut("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return NotFound("Usuario no encontrado.");

        // Verificar si el email ya existe en otro usuario
        if (await _db.Users.AnyAsync(u => u.Email == request.Email && u.Id != id))
            return BadRequest("Ya existe otro usuario con ese correo.");

        // Actualizar solo los campos permitidos
        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.Email = request.Email;
        user.Area = request.Area;

        await _db.SaveChangesAsync();

        return Ok(new { 
            Message = "Usuario actualizado exitosamente",
            User = new {
                user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.Area
            }
        });
    }
}