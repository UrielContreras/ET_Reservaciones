using ComedorSalaApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace ComedorSalaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TimeSimulationController : ControllerBase
{
    private readonly TimeSimulationService _timeService;

    public TimeSimulationController(TimeSimulationService timeService)
    {
        _timeService = timeService;
    }

    /// <summary>
    /// Establece una hora simulada para pruebas
    /// Ejemplo: POST /api/timesimulation/set { "hour": 14, "minute": 0 }
    /// </summary>
    [HttpPost("set")]
    public IActionResult SetSimulatedTime([FromBody] SetTimeRequest request)
    {
        if (request.Hour < 0 || request.Hour > 23)
        {
            return BadRequest("La hora debe estar entre 0 y 23");
        }

        if (request.Minute < 0 || request.Minute > 59)
        {
            return BadRequest("Los minutos deben estar entre 0 y 59");
        }

        _timeService.SetSimulatedTime(request.Hour, request.Minute);

        return Ok(new
        {
            message = $"Hora simulada establecida: {request.Hour:D2}:{request.Minute:D2}",
            status = _timeService.GetSimulationStatus()
        });
    }

    /// <summary>
    /// Desactiva la simulación y vuelve a la hora real
    /// </summary>
    [HttpPost("clear")]
    public IActionResult ClearSimulation()
    {
        _timeService.ClearSimulation();

        return Ok(new
        {
            message = "Simulación desactivada - Usando hora real",
            status = _timeService.GetSimulationStatus()
        });
    }

    /// <summary>
    /// Obtiene el estado actual de la simulación
    /// </summary>
    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        return Ok(_timeService.GetSimulationStatus());
    }

    /// <summary>
    /// Atajos rápidos para horas comunes de prueba
    /// </summary>
    [HttpPost("quick/{preset}")]
    public IActionResult SetQuickTime(string preset)
    {
        switch (preset.ToLower())
        {
            case "before10am":
                _timeService.SetSimulatedTime(9, 30);
                return Ok(new { message = "Hora establecida: 09:30 (antes de las 10 AM)" });
            
            case "10am":
                _timeService.SetSimulatedTime(10, 0);
                return Ok(new { message = "Hora establecida: 10:00 (inicio de reservaciones)" });
            
            case "lunch1":
                _timeService.SetSimulatedTime(13, 0);
                return Ok(new { message = "Hora establecida: 13:00 (primer horario de comida)" });
            
            case "lunch2":
                _timeService.SetSimulatedTime(14, 0);
                return Ok(new { message = "Hora establecida: 14:00 (segundo horario)" });
            
            case "lunch3":
                _timeService.SetSimulatedTime(15, 0);
                return Ok(new { message = "Hora establecida: 15:00 (tercer horario)" });
            
            case "afterlunch":
                _timeService.SetSimulatedTime(16, 30);
                return Ok(new { message = "Hora establecida: 16:30 (después del horario de comida)" });
            
            default:
                return BadRequest($"Preset no válido. Opciones: before10am, 10am, lunch1, lunch2, lunch3, afterlunch");
        }
    }
}

public class SetTimeRequest
{
    public int Hour { get; set; }
    public int Minute { get; set; } = 0;
}
