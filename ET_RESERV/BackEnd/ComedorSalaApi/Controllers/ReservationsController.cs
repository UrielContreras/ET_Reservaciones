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
[Authorize(Roles = "Employee")]
public class ReservationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private const int CAPACIDAD = 20; // puedes pasar esto a configuración

    public ReservationsController(AppDbContext db)
    {
        _db = db;
    }

    private int GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                  ?? User.FindFirstValue("sub");

        return int.Parse(sub!);
    }

    [HttpGet("today")]
    public async Task<ActionResult<IEnumerable<ReservationDto>>> GetMyTodayReservation()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var userId = GetCurrentUserId();

        var reservations = await _db.Reservations
            .Include(r => r.TimeSlot)
            .Where(r => r.UserId == userId && r.Date == today)
            .ToListAsync();

        var result = reservations.Select(r => new ReservationDto
        {
            Id = r.Id,
            Date = r.Date,
            TimeSlotId = r.TimeSlotId,
            TimeRange = $"{r.TimeSlot.StartTime:hh\\:mm}-{r.TimeSlot.EndTime:hh\\:mm}",
            Status = r.Status.ToString()
        });

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateReservation([FromBody] CreateReservationRequest request)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var now = DateTime.Now;
        var userId = GetCurrentUserId();

        var user = await _db.Users.FindAsync(userId);
        if (user == null || !user.IsActive) return Unauthorized();

        // Validar slot
        var slot = await _db.TimeSlots.FirstOrDefaultAsync(s => s.Id == request.TimeSlotId && s.IsActive);
        if (slot == null) return BadRequest("TimeSlot inválido.");

        // Validar que el slot no haya terminado
        var slotEndToday = DateTime.Today + slot.EndTime;
        if (now > slotEndToday)
            return BadRequest("Este horario ya terminó.");

        // Validar 1 reserva activa por día
        var existingActive = await _db.Reservations.AnyAsync(r =>
            r.UserId == userId &&
            r.Date == today &&
            r.Status == ReservationStatus.Active);

        if (existingActive)
            return BadRequest("Ya tienes una reserva activa para hoy.");

        // Validar capacidad
        var countActiveInSlot = await _db.Reservations.CountAsync(r =>
            r.Date == today &&
            r.TimeSlotId == request.TimeSlotId &&
            r.Status == ReservationStatus.Active);

        if (countActiveInSlot >= CAPACIDAD)
            return BadRequest("No hay lugares disponibles en este horario.");

        var reservation = new Reservation
        {
            UserId = userId,
            Date = today,
            TimeSlotId = request.TimeSlotId,
            Status = ReservationStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync();

        return Ok(new { reservation.Id });
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> CancelReservation(int id)
    {
        var userId = GetCurrentUserId();
        var reservation = await _db.Reservations
            .Include(r => r.TimeSlot)
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        if (reservation == null) return NotFound();

        if (reservation.Status != ReservationStatus.Active)
            return BadRequest("La reserva no está activa.");

        var now = DateTime.Now;
        var slotStartToday = DateTime.Today + reservation.TimeSlot.StartTime;

        // Aquí podrías poner una política tipo: no cancelar después de que empiece
        if (now > slotStartToday)
            return BadRequest("No puedes cancelar una reserva que ya inició.");

        reservation.Status = ReservationStatus.Cancelled;
        await _db.SaveChangesAsync();

        return Ok();
    }
}