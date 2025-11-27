namespace ComedorSalaApi.Models;

public enum ReservationStatus
{
    Active = 0,
    Cancelled = 1,
    Expired = 2
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
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CheckInAt { get; set; }
}