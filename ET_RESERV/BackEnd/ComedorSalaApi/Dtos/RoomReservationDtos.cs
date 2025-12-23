namespace ComedorSalaApi.Dtos;

public class CreateRoomReservationRequest
{
    public string Date { get; set; } = null!; // formato: "yyyy-MM-dd"
    public string StartTime { get; set; } = null!; // formato: "HH:mm"
    public string EndTime { get; set; } = null!; // formato: "HH:mm"
}

public class UpdateRoomReservationRequest
{
    public string Date { get; set; } = null!; // formato: "yyyy-MM-dd"
    public string StartTime { get; set; } = null!; // formato: "HH:mm"
    public string EndTime { get; set; } = null!; // formato: "HH:mm"
}

public class CheckAvailabilityRequest
{
    public string Date { get; set; } = null!; // formato: "yyyy-MM-dd"
    public string StartTime { get; set; } = null!; // formato: "HH:mm"
    public string EndTime { get; set; } = null!; // formato: "HH:mm"
    public int? ExcludeReservationId { get; set; } // ID de reservación a excluir (para reprogramación)
}

public class RoomReservationDto
{
    public int Id { get; set; }
    public string Date { get; set; } = null!;
    public string StartTime { get; set; } = null!;
    public string EndTime { get; set; } = null!;
    public string TimeRange { get; set; } = null!;
    public string Status { get; set; } = null!;
}

public class RoomReservationDetailDto
{
    public int Id { get; set; }
    public string Date { get; set; } = null!;
    public string StartTime { get; set; } = null!;
    public string EndTime { get; set; } = null!;
    public string TimeRange { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string UserName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Area { get; set; } = null!;
}
