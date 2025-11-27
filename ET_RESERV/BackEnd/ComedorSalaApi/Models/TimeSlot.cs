namespace  ComedorSalaApi.Models;

public class TimeSlot
{
    public int Id { get; set; }

    // Solo hora/minuto, el día se maneja aparte en la reserva
    public TimeSpan StartTime { get; set; } // ej 13:00
    public TimeSpan EndTime { get; set; }   // ej 13:30

    public bool IsActive { get; set; } = true;
}