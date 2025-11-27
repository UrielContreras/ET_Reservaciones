namespace ComedorSalaApi.Dtos;

public class CreateReservationRequest
{
    public int TimeSlotId { get; set; }
}

public class ReservationDto
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public int TimeSlotId { get; set; }
    public string TimeRange { get; set; } = null!;
    public string Status { get; set; } = null!;
}