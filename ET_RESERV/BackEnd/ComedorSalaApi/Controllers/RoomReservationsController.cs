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
            MeetingName = r.MeetingName,
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
            MeetingName = r.MeetingName,
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
            MeetingName = r.MeetingName,
            Date = r.Date.ToString("yyyy-MM-dd"),
            StartTime = r.StartTime.ToString("HH:mm"),
            EndTime = r.EndTime.ToString("HH:mm"),
            TimeRange = $"{r.StartTime:HH\\:mm}-{r.EndTime:HH\\:mm}",
            Status = r.Status.ToString()
        });

        return Ok(result);
    }

    // Obtener slots disponibles para una fecha específica
    [HttpGet("available-slots")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<object>>> GetAvailableSlots(
        [FromQuery] string date, 
        [FromQuery] int? excludeReservationId = null)
    {
        if (!DateOnly.TryParse(date, out var targetDate))
            return BadRequest("Fecha inválida. Usa el formato yyyy-MM-dd");

        // Obtener todas las reservaciones activas para esa fecha, excluyendo la que se está reprogramando
        var occupiedReservations = await _db.RoomReservations
            .Where(r => r.Date == targetDate && 
                       r.Status == RoomReservationStatus.Active &&
                       (!excludeReservationId.HasValue || r.Id != excludeReservationId.Value))
            .Select(r => new { r.StartTime, r.EndTime })
            .ToListAsync();

        // Definir slots de tiempo predefinidos
        var timeSlots = new[]
        {
            new { id = 1, timeRange = "08:00-09:00", start = new TimeOnly(8, 0), end = new TimeOnly(9, 0) },
            new { id = 2, timeRange = "09:00-10:00", start = new TimeOnly(9, 0), end = new TimeOnly(10, 0) },
            new { id = 3, timeRange = "10:00-11:00", start = new TimeOnly(10, 0), end = new TimeOnly(11, 0) },
            new { id = 4, timeRange = "11:00-12:00", start = new TimeOnly(11, 0), end = new TimeOnly(12, 0) },
            new { id = 5, timeRange = "12:00-13:00", start = new TimeOnly(12, 0), end = new TimeOnly(13, 0) },
            new { id = 6, timeRange = "13:00-14:00", start = new TimeOnly(13, 0), end = new TimeOnly(14, 0) },
            new { id = 7, timeRange = "14:00-15:00", start = new TimeOnly(14, 0), end = new TimeOnly(15, 0) },
            new { id = 8, timeRange = "15:00-16:00", start = new TimeOnly(15, 0), end = new TimeOnly(16, 0) },
            new { id = 9, timeRange = "16:00-17:00", start = new TimeOnly(16, 0), end = new TimeOnly(17, 0) },
            new { id = 10, timeRange = "17:00-18:00", start = new TimeOnly(17, 0), end = new TimeOnly(18, 0) }
        };

        // Filtrar slots disponibles
        var availableSlots = timeSlots.Where(slot => 
        {
            var isOccupied = occupiedReservations.Any(r =>
                (slot.start >= r.StartTime && slot.start < r.EndTime) ||
                (slot.end > r.StartTime && slot.end <= r.EndTime) ||
                (slot.start <= r.StartTime && slot.end >= r.EndTime));
            
            return !isOccupied;
        }).Select(slot => new { slot.id, slot.timeRange });

        return Ok(availableSlots);
    }

    // Verificar disponibilidad de horario
    [HttpPost("check-availability")]
    [Authorize]
    public async Task<IActionResult> CheckAvailability([FromBody] CheckAvailabilityRequest request)
    {
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
            return BadRequest(new { isAvailable = false, message = "La hora de fin debe ser después de la hora de inicio" });

        // Validar que no tenga conflictos con otras reservaciones activas
        var hasConflict = await _db.RoomReservations.AnyAsync(r =>
            r.Date == date &&
            r.Status == RoomReservationStatus.Active &&
            (!request.ExcludeReservationId.HasValue || r.Id != request.ExcludeReservationId.Value) &&
            ((startTime >= r.StartTime && startTime < r.EndTime) ||
             (endTime > r.StartTime && endTime <= r.EndTime) ||
             (startTime <= r.StartTime && endTime >= r.EndTime)));

        if (hasConflict)
            return Ok(new { isAvailable = false, message = "Ya existe una reservación activa en ese horario" });

        return Ok(new { isAvailable = true, message = "El horario está disponible" });
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
            MeetingName = request.MeetingName,
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
        var userRole = User.FindFirstValue(ClaimTypes.Role);
        
        // Si es admin, puede cancelar cualquier reservación
        var reservation = userRole == "HR" 
            ? await _db.RoomReservations.FirstOrDefaultAsync(r => r.Id == id)
            : await _db.RoomReservations.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        if (reservation == null)
            return NotFound(new { message = "Reservación no encontrada" });

        if (reservation.Status != RoomReservationStatus.Active && reservation.Status != RoomReservationStatus.InProgress)
            return BadRequest(new { message = "Solo puedes cancelar reservaciones activas o en curso" });

        reservation.Status = RoomReservationStatus.Cancelled;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Reservación de sala cancelada exitosamente" });
    }

    // Actualizar/Reprogramar una reservación de sala
    [HttpPut("{id:int}")]
    [Authorize(Roles = "HR")]
    public async Task<IActionResult> UpdateRoomReservation(int id, [FromBody] UpdateRoomReservationRequest request)
    {
        var reservation = await _db.RoomReservations.FindAsync(id);
        
        if (reservation == null)
            return NotFound();

        if (reservation.Status != RoomReservationStatus.Active)
            return BadRequest("Solo puedes reprogramar reservaciones activas");

        // Validar que la fecha sea válida
        if (!DateOnly.TryParse(request.Date, out var newDate))
            return BadRequest("Fecha inválida. Usa el formato yyyy-MM-dd");

        // Validar que los horarios sean válidos
        if (!TimeOnly.TryParse(request.StartTime, out var newStartTime))
            return BadRequest("Hora de inicio inválida. Usa el formato HH:mm");

        if (!TimeOnly.TryParse(request.EndTime, out var newEndTime))
            return BadRequest("Hora de fin inválida. Usa el formato HH:mm");

        // Validar que la hora de fin sea después de la hora de inicio
        if (newEndTime <= newStartTime)
            return BadRequest("La hora de fin debe ser después de la hora de inicio");

        // Validar que no tenga conflictos con otras reservaciones activas (excluyendo la actual)
        var hasConflict = await _db.RoomReservations.AnyAsync(r =>
            r.Id != id &&
            r.Date == newDate &&
            r.Status == RoomReservationStatus.Active &&
            ((newStartTime >= r.StartTime && newStartTime < r.EndTime) ||
             (newEndTime > r.StartTime && newEndTime <= r.EndTime) ||
             (newStartTime <= r.StartTime && newEndTime >= r.EndTime)));

        if (hasConflict)
            return BadRequest("Ya existe una reservación activa en ese horario");

        // Actualizar la reservación
        reservation.MeetingName = request.MeetingName;
        reservation.Date = newDate;
        reservation.StartTime = newStartTime;
        reservation.EndTime = newEndTime;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Reservación reprogramada exitosamente" });
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
