using System.Text;
using ComedorSalaApi.Data;
using ComedorSalaApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Configurar TimeZone de México
var mexicoTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Central Standard Time (Mexico)");
TimeZoneInfo.ClearCachedData();
Console.WriteLine($"[TIMEZONE] Zona horaria configurada: {mexicoTimeZone.Id}");
Console.WriteLine($"[TIMEZONE] Hora actual en México: {TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, mexicoTimeZone):yyyy-MM-dd HH:mm:ss}");

// DB
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// PasswordHasher para User
builder.Services.AddScoped<IPasswordHasher<ComedorSalaApi.Models.User>, PasswordHasher<ComedorSalaApi.Models.User>>();

// JWT
var jwtSection = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSection["Key"]!);

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSection["Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key)
        };
    });

builder.Services.AddAuthorization();

// CORS - Permitir cualquier origen en Docker para facilitar acceso desde red local
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Permite cualquier origen
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Background Service para expirar reservaciones
builder.Services.AddHostedService<ReservationExpirationService>();

var app = builder.Build();

// Habilitar Swagger en todos los entornos para facilitar pruebas
app.UseSwagger();
app.UseSwaggerUI();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
} 

// No redirigir a HTTPS en Docker (ngrok maneja HTTPS)
// app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Aplicar migraciones pendientes automáticamente
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    Console.WriteLine("[MIGRATIONS] Verificando migraciones pendientes...");
    var pendingMigrations = db.Database.GetPendingMigrations().ToList();
    
    if (pendingMigrations.Any())
    {
        Console.WriteLine($"[MIGRATIONS] Aplicando {pendingMigrations.Count} migración(es) pendiente(s):");
        foreach (var migration in pendingMigrations)
        {
            Console.WriteLine($"[MIGRATIONS] - {migration}");
        }
        
        db.Database.Migrate();
        Console.WriteLine("[MIGRATIONS] Migraciones aplicadas exitosamente");
    }
    else
    {
        Console.WriteLine("[MIGRATIONS] No hay migraciones pendientes");
    }
}

// Seed TimeSlots if they don't exist
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (!db.TimeSlots.Any())
    {
        db.TimeSlots.AddRange(
            new ComedorSalaApi.Models.TimeSlot { StartTime = new TimeSpan(13, 0, 0), EndTime = new TimeSpan(14, 0, 0), IsActive = true },
            new ComedorSalaApi.Models.TimeSlot { StartTime = new TimeSpan(14, 0, 0), EndTime = new TimeSpan(15, 0, 0), IsActive = true },
            new ComedorSalaApi.Models.TimeSlot { StartTime = new TimeSpan(15, 0, 0), EndTime = new TimeSpan(16, 0, 0), IsActive = true }
        );
        db.SaveChanges();
    }
}

app.Run();