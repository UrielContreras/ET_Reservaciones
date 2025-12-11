using System.Security.Claims;
using ComedorSalaApi.Data;
using ComedorSalaApi.Dtos;
using ComedorSalaApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ComedorSalaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomReservationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TimeZoneInfo _mexicoTimeZone;

    public RoomReservationsController(AppDbContext db)
    {
        _db = db;
        _mexicoTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Central Standard Time (Mexico)");
    }

    private int GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                  ?? User.FindFirstValue("sub");
        return int.Parse(sub!);
    }

    private DateTime GetMexicoTime()
    {
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _mexicoTimeZone);
    }

    // Obtener todas las reservaciones de sala (solo admin)
    [HttpGet("all")]
    [Authorize(Roles = "HR")]
    public async Task<ActionResult<IEnumerable<RoomReservationDetailDto>>> GetAllRoomReservations()
    {
        var reservations = await _db.RoomReservations
            .Include(r => r.User)
            .OrderByDescending(r => r.Date)
            .ThenBy(r => r.StartTime)
            .ToListAsync();

        var result = reservations.Select(r => new RoomReservationDetailDto
        {
            Id = r.Id,
            Date = r.Date.ToString("yyyy-MM-dd"),
            StartTime = r.StartTime.ToString("HH:mm"),
            EndTime = r.EndTime.ToString("HH:mm"),
            TimeRange = $"{r.StartTime:HH\\:mm}-{r.EndTime:HH\\:mm}",
            Status = r.Status.ToString(),
            UserName = $"{r.User.FirstName} {r.User.LastName}",
            Email = r.User.Email,
            Area = r.User.Area ?? "N/A"
        });

        return Ok(result);
    }

    // Obtener reservaciones de sala de hoy del usuario actual
    [HttpGet("today")]
    [Authorize(Roles = "Employee,HR")]
    public async Task<ActionResult<IEnumerable<RoomReservationDto>>> GetMyTodayRoomReservations()
    {
        var now = GetMexicoTime();
        var today = DateOnly.FromDateTime(now);
        var userId = GetCurrentUserId();

        var reservations = await _db.RoomReservations
            .Where(r => r.UserId == userId && r.Date == today)
            .OrderBy(r => r.StartTime)
            .ToListAsync();

        var result = reservations.Select(r => new RoomReservationDto
        {
            Id = r.Id,
            Date = r.Date.ToString("yyyy-MM-dd"),
            StartTime = r.StartTime.ToString("HH:mm"),
            EndTime = r.EndTime.ToString("HH:mm"),
            TimeRange = $"{r.StartTime:HH\\:mm}-{r.EndTime:HH\\:mm}",
            Status = r.Status.ToString()
        });

        return Ok(result);
    }

    // Obtener todas mis reservaciones de sala
    [HttpGet("my-reservations")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<RoomReservationDto>>> GetMyRoomReservations()
    {
        var userId = GetCurrentUserId();

        var reservations = await _db.RoomReservations
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.Date)
            .ThenBy(r => r.StartTime)
            .ToListAsync();

        var result = reservations.Select(r => new RoomReservationDto
        {
            Id = r.Id,
            Date = r.Date.ToString("yyyy-MM-dd"),
            StartTime = r.StartTime.ToString("HH:mm"),
            EndTime = r.EndTime.ToString("HH:mm"),
            TimeRange = $"{r.StartTime:HH\\:mm}-{r.EndTime:HH\\:mm}",
            Status = r.Status.ToString()
        });

        return Ok(result);
    }

    // Crear una nueva reservación de sala
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateRoomReservation([FromBody] CreateRoomReservationRequest request)
    {
        var now = GetMexicoTime();
        var userId = GetCurrentUserId();

        // Validar que la fecha sea válida
        if (!DateOnly.TryParse(request.Date, out var date))
            return BadRequest("Fecha inválida. Usa el formato yyyy-MM-dd");

        // Validar que los horarios sean válidos
        if (!TimeOnly.TryParse(request.StartTime, out var startTime))
            return BadRequest("Hora de inicio inválida. Usa el formato HH:mm");

        if (!TimeOnly.TryParse(request.EndTime, out var endTime))
            return BadRequest("Hora de fin inválida. Usa el formato HH:mm");

        // Validar que la hora de fin sea después de la hora de inicio
        if (endTime <= startTime)
            return BadRequest("La hora de fin debe ser después de la hora de inicio");

        // Sin restricciones de tiempo - se puede reservar en cualquier momento
        var user = await _db.Users.FindAsync(userId);
        if (user == null || !user.IsActive)
            return Unauthorized();

        // Validar que no tenga conflictos con otras reservaciones activas
        var hasConflict = await _db.RoomReservations.AnyAsync(r =>
            r.Date == date &&
            r.Status == RoomReservationStatus.Active &&
            ((startTime >= r.StartTime && startTime < r.EndTime) ||
             (endTime > r.StartTime && endTime <= r.EndTime) ||
             (startTime <= r.StartTime && endTime >= r.EndTime)));

        if (hasConflict)
            return BadRequest("Ya existe una reservación activa en ese horario");

        var reservation = new RoomReservation
        {
            UserId = userId,
            Date = date,
            StartTime = startTime,
            EndTime = endTime,
            Status = RoomReservationStatus.Active,
            CreatedAt = now
        };

        _db.RoomReservations.Add(reservation);
        await _db.SaveChangesAsync();

        return Ok(new { reservation.Id });
    }

    // Cancelar una reservación de sala
    [HttpPut("{id:int}/cancel")]
    [Authorize(Roles = "Employee,HR")]
    public async Task<IActionResult> CancelRoomReservation(int id)
    {
        var userId = GetCurrentUserId();
        var reservation = await _db.RoomReservations
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        if (reservation == null)
            return NotFound();

        if (reservation.Status != RoomReservationStatus.Active)
            return BadRequest("Solo puedes cancelar reservaciones activas");

        reservation.Status = RoomReservationStatus.Cancelled;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Reservación de sala cancelada exitosamente" });
    }

    // Eliminar una reservación de sala (solo admin)
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "HR")]
    public async Task<IActionResult> DeleteRoomReservation(int id)
    {
        var reservation = await _db.RoomReservations.FindAsync(id);
        if (reservation == null)
            return NotFound();

        _db.RoomReservations.Remove(reservation);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Reservación de sala eliminada exitosamente" });
    }
}
