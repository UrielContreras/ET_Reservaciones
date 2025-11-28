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

        // Buscar reservaciones activas del día de hoy cuyo horario ya terminó
        var expiredReservations = await db.Reservations
            .Include(r => r.TimeSlot)
            .Where(r => 
                r.Status == ReservationStatus.Active &&
                r.Date == today)
            .ToListAsync(cancellationToken);

        var updated = 0;
        foreach (var reservation in expiredReservations)
        {
            var slotEndTime = DateTime.Today + reservation.TimeSlot.EndTime;
            
            // Si ya pasó el horario de fin, marcar como expirada
            if (now > slotEndTime)
            {
                reservation.Status = ReservationStatus.Expired;
                updated++;
            }
        }

        if (updated > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation($"Se marcaron {updated} reservaciones como expiradas");
        }
    }
}
