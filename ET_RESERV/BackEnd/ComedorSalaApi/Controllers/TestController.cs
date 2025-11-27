using ComedorSalaApi.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace ComedorSalaApi.Controllers
{
    [ApiController]
    [Route("api/test")]
    public class TestController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TestController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("dbconnection")]
        public async Task<IActionResult> TestDatabaseConnection()
        {
            try
            {
                // Intenta hacer una consulta simple para verificar la conexión
                await _context.Users.FirstOrDefaultAsync();
                return Ok("La conexión a la base de datos se ha establecido correctamente.");
            }
            catch (Exception ex)
            {
                // Si hay un error, devuelve un mensaje de error detallado
                return StatusCode(500, $"Error al conectar con la base de datos: {ex.Message}");
            }
        }
    }
}
