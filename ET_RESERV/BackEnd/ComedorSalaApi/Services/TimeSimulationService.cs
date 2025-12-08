namespace ComedorSalaApi.Services;

/// <summary>
/// Servicio para simular diferentes horas del día en modo desarrollo/pruebas
/// </summary>
public class TimeSimulationService
{
    private static TimeSpan? _simulatedTimeOffset = null;
    private readonly TimeZoneInfo _mexicoTimeZone;

    public TimeSimulationService()
    {
        _mexicoTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Central Standard Time (Mexico)");
    }

    /// <summary>
    /// Establece una hora simulada (ej: 14:00 para probar reservaciones)
    /// </summary>
    public void SetSimulatedTime(int hour, int minute = 0)
    {
        var realTime = GetRealMexicoTime();
        var targetTime = new DateTime(realTime.Year, realTime.Month, realTime.Day, hour, minute, 0);
        _simulatedTimeOffset = targetTime - realTime;
        
        Console.WriteLine($"[TIME_SIMULATION] ⏰ Hora real: {realTime:HH:mm:ss}");
        Console.WriteLine($"[TIME_SIMULATION] 🎭 Hora simulada: {targetTime:HH:mm:ss}");
        Console.WriteLine($"[TIME_SIMULATION] ⚙️ Offset aplicado: {_simulatedTimeOffset}");
    }

    /// <summary>
    /// Desactiva la simulación y vuelve a la hora real
    /// </summary>
    public void ClearSimulation()
    {
        _simulatedTimeOffset = null;
        Console.WriteLine($"[TIME_SIMULATION] ✅ Simulación desactivada - Usando hora real");
    }

    /// <summary>
    /// Obtiene la hora actual (simulada o real)
    /// </summary>
    public DateTime GetCurrentTime()
    {
        var realTime = GetRealMexicoTime();
        
        if (_simulatedTimeOffset.HasValue)
        {
            return realTime.Add(_simulatedTimeOffset.Value);
        }
        
        return realTime;
    }

    /// <summary>
    /// Obtiene la hora real de México sin simulación
    /// </summary>
    private DateTime GetRealMexicoTime()
    {
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _mexicoTimeZone);
    }

    /// <summary>
    /// Verifica si hay una simulación activa
    /// </summary>
    public bool IsSimulating()
    {
        return _simulatedTimeOffset.HasValue;
    }

    /// <summary>
    /// Obtiene información sobre el estado de la simulación
    /// </summary>
    public object GetSimulationStatus()
    {
        var realTime = GetRealMexicoTime();
        var currentTime = GetCurrentTime();
        
        return new
        {
            IsSimulating = IsSimulating(),
            RealTime = realTime.ToString("HH:mm:ss"),
            CurrentTime = currentTime.ToString("HH:mm:ss"),
            Offset = _simulatedTimeOffset?.ToString() ?? "None"
        };
    }
}
