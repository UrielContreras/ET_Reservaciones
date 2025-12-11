using ComedorSalaApi.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ComedorSalaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MigrationController : ControllerBase
{
    private readonly AppDbContext _db;

    public MigrationController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("apply")]
    public async Task<IActionResult> ApplyMigrations()
    {
        try
        {
            // Obtener migraciones pendientes
            var pendingMigrations = await _db.Database.GetPendingMigrationsAsync();
            var pendingList = pendingMigrations.ToList();

            if (!pendingList.Any())
            {
                return Ok(new { message = "No hay migraciones pendientes", applied = 0 });
            }

            // Aplicar migraciones
            await _db.Database.MigrateAsync();

            return Ok(new 
            { 
                message = "Migraciones aplicadas exitosamente", 
                applied = pendingList.Count,
                migrations = pendingList
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new 
            { 
                message = "Error al aplicar migraciones", 
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpPost("create-table-sql")]
    public async Task<IActionResult> CreateTableDirectly()
    {
        try
        {
            // Verificar si la tabla ya existe
            var tableExists = await _db.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RoomReservations')
                BEGIN
                    SELECT 0
                END
                ELSE
                BEGIN
                    SELECT 1
                END
            ");

            // Crear la tabla directamente con SQL
            await _db.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RoomReservations')
                BEGIN
                    CREATE TABLE [dbo].[RoomReservations](
                        [Id] [int] IDENTITY(1,1) NOT NULL,
                        [UserId] [int] NOT NULL,
                        [Date] [date] NOT NULL,
                        [StartTime] [time](7) NOT NULL,
                        [EndTime] [time](7) NOT NULL,
                        [Status] [int] NOT NULL,
                        [CreatedAt] [datetime2](7) NOT NULL,
                        [CheckInAt] [datetime2](7) NULL,
                        CONSTRAINT [PK_RoomReservations] PRIMARY KEY CLUSTERED ([Id] ASC)
                    );

                    CREATE NONCLUSTERED INDEX [IX_RoomReservations_UserId] ON [dbo].[RoomReservations]([UserId] ASC);

                    ALTER TABLE [dbo].[RoomReservations] WITH CHECK 
                    ADD CONSTRAINT [FK_RoomReservations_Users_UserId] 
                    FOREIGN KEY([UserId]) REFERENCES [dbo].[Users] ([Id]);

                    ALTER TABLE [dbo].[RoomReservations] CHECK CONSTRAINT [FK_RoomReservations_Users_UserId];
                END
            ");

            // Registrar la migración en el historial
            await _db.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM [__EFMigrationsHistory] WHERE MigrationId = '20251210134700_AddRoomReservationsTable')
                BEGIN
                    INSERT INTO [__EFMigrationsHistory] (MigrationId, ProductVersion)
                    VALUES ('20251210134700_AddRoomReservationsTable', '9.0.0');
                END
            ");

            return Ok(new { message = "Tabla RoomReservations creada exitosamente" });
        }
        catch (Exception ex)
        {
            return BadRequest(new 
            { 
                message = "Error al crear la tabla", 
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetMigrationStatus()
    {
        try
        {
            var appliedMigrations = await _db.Database.GetAppliedMigrationsAsync();
            var pendingMigrations = await _db.Database.GetPendingMigrationsAsync();

            return Ok(new
            {
                applied = appliedMigrations.ToList(),
                pending = pendingMigrations.ToList(),
                appliedCount = appliedMigrations.Count(),
                pendingCount = pendingMigrations.Count()
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
