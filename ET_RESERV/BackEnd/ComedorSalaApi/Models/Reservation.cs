namespace ComedorSalaApi.Models;

public enum ReservationStatus
{
    Active = 0,      // Antes de que comience el horario
    Cancelled = 1,   // Cancelada por el usuario
    Expired = 2,     // Ya terminó el horario
    InProgress = 3   // El horario ya comenzó pero aún no termina
}

public class Reservation
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    // Solo fecha (día), la hora viene del TimeSlot
    public DateOnly Date { get; set; }

    public int TimeSlotId { get; set; }
    public TimeSlot TimeSlot { get; set; } = null!;

    public ReservationStatus Status { get; set; } = ReservationStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? CheckInAt { get; set; }
    public DateTime? CheckOutAt { get; set; }
}