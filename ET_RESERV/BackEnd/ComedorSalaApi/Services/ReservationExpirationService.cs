using ComedorSalaApi.Data;
using ComedorSalaApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ComedorSalaApi.Services;

public class ReservationExpirationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ReservationExpirationService> _logger;
    private readonly TimeZoneInfo _mexicoTimeZone;

    public ReservationExpirationService(
        IServiceProvider serviceProvider,
        ILogger<ReservationExpirationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _mexicoTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Central Standard Time (Mexico)");
    }

    private DateTime GetMexicoTime()
    {
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _mexicoTimeZone);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Reservation Expiration Service iniciado");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ExpireOldReservations(stoppingToken);
                
                // Ejecutar cada 5 minutos
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en ReservationExpirationService");
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
    }

    private async Task ExpireOldReservations(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = GetMexicoTime();
        var today = DateOnly.FromDateTime(now);

        _logger.LogInformation($"[EXPIRATION SERVICE] Verificando expiración. Hora actual: {now:yyyy-MM-dd HH:mm:ss}");

        // ========== RESERVACIONES DE COMEDOR ==========
        var activeReservations = await db.Reservations
            .Include(r => r.TimeSlot)
            .Where(r => r.Status == ReservationStatus.Active || r.Status == ReservationStatus.InProgress)
            .ToListAsync(cancellationToken);

        _logger.LogInformation($"[EXPIRATION SERVICE] Encontradas {activeReservations.Count} reservaciones de comedor activas/en progreso");

        var updated = 0;
        foreach (var reservation in activeReservations)
        {
            // Crear la hora de inicio y fin completa
            var reservationDate = reservation.Date.ToDateTime(TimeOnly.MinValue);
            var slotStartTime = new DateTime(
                reservationDate.Year, 
                reservationDate.Month, 
                reservationDate.Day,
                reservation.TimeSlot.StartTime.Hours,
                reservation.TimeSlot.StartTime.Minutes,
                reservation.TimeSlot.StartTime.Seconds
            );
            var slotEndTime = new DateTime(
                reservationDate.Year, 
                reservationDate.Month, 
                reservationDate.Day,
                reservation.TimeSlot.EndTime.Hours,
                reservation.TimeSlot.EndTime.Minutes,
                reservation.TimeSlot.EndTime.Seconds
            );
            
            _logger.LogInformation($"[EXPIRATION SERVICE] Reservación Comedor {reservation.Id}: Fecha={reservation.Date}, " +
                $"Horario={reservation.TimeSlot.StartTime:hh\\:mm}-{reservation.TimeSlot.EndTime:hh\\:mm}, " +
                $"Inicio={slotStartTime:yyyy-MM-dd HH:mm:ss}, Fin={slotEndTime:yyyy-MM-dd HH:mm:ss}, " +
                $"Ahora={now:yyyy-MM-dd HH:mm:ss}, Status actual={reservation.Status}");
            
            // Si ya pasó el horario de fin, marcar como expirada
            if (now > slotEndTime.AddMinutes(1))
            {
                if (reservation.Status != ReservationStatus.Expired)
                {
                    reservation.Status = ReservationStatus.Expired;
                    updated++;
                    _logger.LogInformation($"[EXPIRATION SERVICE] ✓ Reservación Comedor {reservation.Id} MARCADA como EXPIRADA");
                }
            }
            // Si ya comenzó pero no ha terminado, marcar como en progreso
            else if (now >= slotStartTime && now <= slotEndTime)
            {
                if (reservation.Status != ReservationStatus.InProgress)
                {
                    reservation.Status = ReservationStatus.InProgress;
                    updated++;
                    _logger.LogInformation($"[EXPIRATION SERVICE] ✓ Reservación Comedor {reservation.Id} MARCADA como EN PROGRESO");
                }
            }
            // Si aún no comienza, mantener como activa
            else
            {
                var minutesUntilStart = (slotStartTime - now).TotalMinutes;
                _logger.LogInformation($"[EXPIRATION SERVICE] - Reservación Comedor {reservation.Id} aún está ACTIVA (comienza en {minutesUntilStart:F1} min)");
            }
        }

        // ========== RESERVACIONES DE SALA ==========
        var activeRoomReservations = await db.RoomReservations
            .Where(r => r.Status == RoomReservationStatus.Active || r.Status == RoomReservationStatus.InProgress)
            .ToListAsync(cancellationToken);

        _logger.LogInformation($"[EXPIRATION SERVICE] Encontradas {activeRoomReservations.Count} reservaciones de sala activas/en progreso");

        foreach (var roomReservation in activeRoomReservations)
        {
            // Crear la hora de inicio y fin completa
            var reservationDate = roomReservation.Date.ToDateTime(TimeOnly.MinValue);
            var roomStartTime = new DateTime(
                reservationDate.Year,
                reservationDate.Month,
                reservationDate.Day,
                roomReservation.StartTime.Hour,
                roomReservation.StartTime.Minute,
                roomReservation.StartTime.Second
            );
            var roomEndTime = new DateTime(
                reservationDate.Year,
                reservationDate.Month,
                reservationDate.Day,
                roomReservation.EndTime.Hour,
                roomReservation.EndTime.Minute,
                roomReservation.EndTime.Second
            );

            _logger.LogInformation($"[EXPIRATION SERVICE] Reservación Sala {roomReservation.Id}: Fecha={roomReservation.Date}, " +
                $"Horario={roomReservation.StartTime:HH\\:mm}-{roomReservation.EndTime:HH\\:mm}, " +
                $"Inicio={roomStartTime:yyyy-MM-dd HH:mm:ss}, Fin={roomEndTime:yyyy-MM-dd HH:mm:ss}, " +
                $"Ahora={now:yyyy-MM-dd HH:mm:ss}, Status actual={roomReservation.Status}");

            // Si ya pasó el horario de fin, marcar como expirada
            if (now > roomEndTime.AddMinutes(1))
            {
                if (roomReservation.Status != RoomReservationStatus.Expired)
                {
                    roomReservation.Status = RoomReservationStatus.Expired;
                    updated++;
                    _logger.LogInformation($"[EXPIRATION SERVICE] ✓ Reservación Sala {roomReservation.Id} MARCADA como EXPIRADA");
                }
            }
            // Si ya comenzó pero no ha terminado, marcar como en progreso
            else if (now >= roomStartTime && now <= roomEndTime)
            {
                if (roomReservation.Status != RoomReservationStatus.InProgress)
                {
                    roomReservation.Status = RoomReservationStatus.InProgress;
                    updated++;
                    _logger.LogInformation($"[EXPIRATION SERVICE] ✓ Reservación Sala {roomReservation.Id} MARCADA como EN PROGRESO");
                }
            }
            // Si aún no comienza, mantener como activa
            else
            {
                var minutesUntilStart = (roomStartTime - now).TotalMinutes;
                _logger.LogInformation($"[EXPIRATION SERVICE] - Reservación Sala {roomReservation.Id} aún está ACTIVA (comienza en {minutesUntilStart:F1} min)");
            }
        }

        if (updated > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation($"[EXPIRATION SERVICE] Total: {updated} reservaciones actualizadas (expiradas/en progreso)");
        }
        else
        {
            _logger.LogInformation($"[EXPIRATION SERVICE] No hay reservaciones para actualizar en este momento");
        }
    }
}
