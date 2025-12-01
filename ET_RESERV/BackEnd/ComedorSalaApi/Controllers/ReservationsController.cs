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
public class ReservationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private const int CAPACIDAD = 5; // puedes pasar esto a configuración

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

    [HttpGet("timeslots")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<object>>> GetAvailableTimeSlots()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var timeSlots = await _db.TimeSlots.Where(s => s.IsActive).OrderBy(s => s.StartTime).ToListAsync();

        var result = timeSlots.Select(slot => new
        {
            slot.Id,
            TimeRange = $"{slot.StartTime:hh\\:mm}-{slot.EndTime:hh\\:mm}",
            Available = CAPACIDAD - _db.Reservations.Count(r =>
                r.Date == today &&
                r.TimeSlotId == slot.Id &&
                (r.Status == ReservationStatus.Active || r.Status == ReservationStatus.InProgress))
        });

        return Ok(result);
    }

    [HttpGet("today")]
    [Authorize(Roles = "Employee")]
    public async Task<ActionResult<IEnumerable<ReservationDto>>> GetMyTodayReservation()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var now = DateTime.Now;
        var userId = GetCurrentUserId();

        Console.WriteLine($"[TODAY] Hora actual del servidor: {now:yyyy-MM-dd HH:mm:ss}");

        // NO actualizar automáticamente las expiradas aquí
        // El servicio de background se encargará de eso

        // Obtener TODAS las reservaciones del día (incluyendo activas, canceladas y expiradas)
        var reservations = await _db.Reservations
            .Include(r => r.TimeSlot)
            .Where(r => r.UserId == userId && r.Date == today)
            .OrderBy(r => r.TimeSlot.StartTime)
            .ToListAsync();

        foreach (var r in reservations)
        {
            var slotEndTime = DateTime.Today.Add(r.TimeSlot.EndTime);
            Console.WriteLine($"[TODAY] Reservación {r.Id}: {r.TimeSlot.StartTime:hh\\:mm}-{r.TimeSlot.EndTime:hh\\:mm}, Status: {r.Status}, EndTime: {slotEndTime:HH:mm:ss}");
        }

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

    [HttpGet("my-reservations")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<ReservationDto>>> GetMyAllReservations()
    {
        var now = DateTime.Now;
        var today = DateOnly.FromDateTime(DateTime.Today);
        var userId = GetCurrentUserId();

        Console.WriteLine($"[MY-RESERVATIONS] Hora actual del servidor: {now:yyyy-MM-dd HH:mm:ss}");

        // NO actualizar automáticamente, dejar que el servicio de background lo haga

        // Obtener todas las reservaciones
        var reservations = await _db.Reservations
            .Include(r => r.TimeSlot)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.Date)
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
    [Authorize]
    public async Task<IActionResult> CreateReservation([FromBody] CreateReservationRequest request)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var now = DateTime.Now;
        var userId = GetCurrentUserId();

        // Validar que sea después de las 10:00 AM
        var cutoffTime = DateTime.Today.AddHours(10);
        if (now < cutoffTime)
        {
            var minutesUntil10AM = (int)(cutoffTime - now).TotalMinutes;
            return BadRequest($"Las reservaciones solo pueden hacerse a partir de las 10:00 AM. Faltan {minutesUntil10AM} minutos.");
        }

        var user = await _db.Users.FindAsync(userId);
        if (user == null || !user.IsActive) return Unauthorized();

        // Validar slot
        var slot = await _db.TimeSlots.FirstOrDefaultAsync(s => s.Id == request.TimeSlotId && s.IsActive);
        if (slot == null) return BadRequest("TimeSlot inválido.");

        // Validar que el slot no haya terminado
        var slotEndToday = DateTime.Today + slot.EndTime;
        if (now > slotEndToday)
            return BadRequest("Este horario ya terminó.");

        // Validar 1 reserva por día (activa, en progreso o expirada)
        var existingReservation = await _db.Reservations.AnyAsync(r =>
            r.UserId == userId &&
            r.Date == today &&
            (r.Status == ReservationStatus.Active || r.Status == ReservationStatus.InProgress || r.Status == ReservationStatus.Expired));

        if (existingReservation)
            return BadRequest("Ya tienes una reservación para hoy. Solo puedes hacer una reservación por día.");

        // Validar capacidad
        var countActiveInSlot = await _db.Reservations.CountAsync(r =>
            r.Date == today &&
            r.TimeSlotId == request.TimeSlotId &&
            (r.Status == ReservationStatus.Active || r.Status == ReservationStatus.InProgress));

        if (countActiveInSlot >= CAPACIDAD)
            return BadRequest("No hay lugares disponibles en este horario.");

        var reservation = new Reservation
        {
            UserId = userId,
            Date = today,
            TimeSlotId = request.TimeSlotId,
            Status = ReservationStatus.Active,
            CreatedAt = DateTime.Now
        };

        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync();

        return Ok(new { reservation.Id });
    }

    [HttpPost("{id:int}/cancel")]
    [Authorize(Roles = "Employee")]
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

    [HttpGet("all")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<object>>> GetAllReservations()
    {
        var reservations = await _db.Reservations
            .Include(r => r.TimeSlot)
            .Include(r => r.User)
            .OrderByDescending(r => r.Date)
            .ThenBy(r => r.TimeSlot.StartTime)
            .ToListAsync();

        var result = reservations.Select(r => new
        {
            r.Id,
            r.Date,
            TimeRange = $"{r.TimeSlot.StartTime:hh\\:mm}-{r.TimeSlot.EndTime:hh\\:mm}",
            Status = r.Status.ToString(),
            UserName = $"{r.User.FirstName} {r.User.LastName}",
            r.User.Email,
            r.User.Area
        });

        return Ok(result);
    }

    // Endpoint temporal para corregir reservaciones marcadas incorrectamente como expiradas
    [HttpPost("fix-today-reservations")]
    public async Task<IActionResult> FixTodayReservations()
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var now = DateTime.Now;

        Console.WriteLine($"[FIX] Iniciando corrección. Hora actual: {now:yyyy-MM-dd HH:mm:ss}");

        // Buscar todas las reservaciones de hoy que están marcadas como expiradas
        var expiredToday = await _db.Reservations
            .Include(r => r.TimeSlot)
            .Where(r => r.Date == today && r.Status == ReservationStatus.Expired)
            .ToListAsync();

        Console.WriteLine($"[FIX] Encontradas {expiredToday.Count} reservaciones expiradas hoy");

        var correctedCount = 0;
        foreach (var reservation in expiredToday)
        {
            var slotEndTime = DateTime.Today.Add(reservation.TimeSlot.EndTime);
            
            Console.WriteLine($"[FIX] Reservación {reservation.Id}: Fin={slotEndTime:HH:mm:ss}, Ahora={now:HH:mm:ss}");
            
            // Si el horario AÚN NO ha terminado, reactivar la reservación
            if (now <= slotEndTime)
            {
                reservation.Status = ReservationStatus.Active;
                correctedCount++;
                Console.WriteLine($"[FIX] ✓ Reservación {reservation.Id} REACTIVADA");
            }
        }

        if (correctedCount > 0)
        {
            await _db.SaveChangesAsync();
            Console.WriteLine($"[FIX] Se guardaron {correctedCount} correcciones");
            return Ok(new { message = $"Se corrigieron {correctedCount} reservaciones", hora_actual = now.ToString("HH:mm:ss"), total_expiradas = expiredToday.Count });
        }

        return Ok(new { message = "No hay reservaciones para corregir", hora_actual = now.ToString("HH:mm:ss"), total_expiradas = expiredToday.Count });
    }
}