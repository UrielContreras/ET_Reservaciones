using ComedorSalaApi.Data;
using ComedorSalaApi.Dtos;
using ComedorSalaApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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