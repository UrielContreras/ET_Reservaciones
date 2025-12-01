using ComedorSalaApi.Data;
using ComedorSalaApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ComedorSalaApi.Services;

public class ReservationExpirationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ReservationExpirationService> _logger;

    public ReservationExpirationService(
        IServiceProvider serviceProvider,
        ILogger<ReservationExpirationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
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

        var now = DateTime.Now;
        var today = DateOnly.FromDateTime(DateTime.Today);

        _logger.LogInformation($"[EXPIRATION SERVICE] Verificando expiración. Hora actual: {now:yyyy-MM-dd HH:mm:ss}");

        // Buscar reservaciones activas de cualquier fecha que ya hayan terminado
        var activeReservations = await db.Reservations
            .Include(r => r.TimeSlot)
            .Where(r => r.Status == ReservationStatus.Active)
            .ToListAsync(cancellationToken);

        _logger.LogInformation($"[EXPIRATION SERVICE] Encontradas {activeReservations.Count} reservaciones activas");

        var updated = 0;
        foreach (var reservation in activeReservations)
        {
            // Crear la hora de fin completa: fecha de la reservación + hora de fin del slot
            var reservationDateTime = reservation.Date.ToDateTime(TimeOnly.MinValue);
            var slotEndTime = reservationDateTime.Add(reservation.TimeSlot.EndTime);
            
            _logger.LogInformation($"[EXPIRATION SERVICE] Reservación {reservation.Id}: Fecha={reservation.Date}, " +
                $"Horario={reservation.TimeSlot.StartTime:hh\\:mm}-{reservation.TimeSlot.EndTime:hh\\:mm}, " +
                $"Fin calculado={slotEndTime:yyyy-MM-dd HH:mm:ss}, Ahora={now:yyyy-MM-dd HH:mm:ss}, " +
                $"Diferencia={(slotEndTime - now).TotalMinutes:F1} minutos");
            
            // Solo marcar como expirada si YA PASÓ el horario de fin (con 1 minuto de margen)
            if (now > slotEndTime.AddMinutes(1))
            {
                reservation.Status = ReservationStatus.Expired;
                updated++;
                _logger.LogInformation($"[EXPIRATION SERVICE] ✓ Reservación {reservation.Id} MARCADA como expirada");
            }
            else
            {
                _logger.LogInformation($"[EXPIRATION SERVICE] - Reservación {reservation.Id} aún está ACTIVA");
            }
        }

        if (updated > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation($"[EXPIRATION SERVICE] Total: {updated} reservaciones marcadas como expiradas");
        }
        else
        {
            _logger.LogInformation($"[EXPIRATION SERVICE] No hay reservaciones para expirar en este momento");
        }
    }
}
