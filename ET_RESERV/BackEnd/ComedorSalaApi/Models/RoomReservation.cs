namespace ComedorSalaApi.Models;

public enum RoomReservationStatus
{
    Active = 0,
    Cancelled = 1,
    Expired = 2,
    InProgress = 3,
    Completed = 4
}

public class RoomReservation
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? MeetingName { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public RoomReservationStatus Status { get; set; } = RoomReservationStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CheckInAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
}
