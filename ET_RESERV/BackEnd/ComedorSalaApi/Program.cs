using System.Net;
using System.Text;
using System.Text.Json;
using ComedorSalaApi.Data;
using ComedorSalaApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var bootstrapJson = Environment.GetEnvironmentVariable("APP_BOOTSTRAP_JSON");
if (!string.IsNullOrWhiteSpace(bootstrapJson))
{
    try
    {
        using var doc = JsonDocument.Parse(bootstrapJson);
        var flattened = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);

        void FlattenJson(string prefix, JsonElement element)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    foreach (var property in element.EnumerateObject())
                    {
                        var nextPrefix = string.IsNullOrEmpty(prefix)
                            ? property.Name
                            : $"{prefix}:{property.Name}";
                        FlattenJson(nextPrefix, property.Value);
                    }
                    break;

                case JsonValueKind.Array:
                    var i = 0;
                    foreach (var item in element.EnumerateArray())
                    {
                        FlattenJson($"{prefix}:{i}", item);
                        i++;
                    }
                    break;

                case JsonValueKind.String:
                    flattened[prefix] = element.GetString();
                    break;

                case JsonValueKind.Number:
                case JsonValueKind.True:
                case JsonValueKind.False:
                    flattened[prefix] = element.ToString();
                    break;

                case JsonValueKind.Null:
                    flattened[prefix] = null;
                    break;
            }
        }

        FlattenJson(string.Empty, doc.RootElement);
        builder.Configuration.AddInMemoryCollection(flattened);
        Console.WriteLine("[CONFIG] APP_BOOTSTRAP_JSON cargado correctamente.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[CONFIG] Error al parsear APP_BOOTSTRAP_JSON: {ex.Message}");
    }
}

// Configurar TimeZone de México
var mexicoTimeZone = TimeZoneResolver.ResolveMexicoTimeZone(builder.Configuration["AppSettings:TimeZoneId"]);
TimeZoneInfo.ClearCachedData();
Console.WriteLine($"[TIMEZONE] Zona horaria configurada: {mexicoTimeZone.Id}");
Console.WriteLine($"[TIMEZONE] Hora actual en México: {TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, mexicoTimeZone):yyyy-MM-dd HH:mm:ss}");

// DB
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
            sqlOptions.CommandTimeout(60);
        }));

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

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var explicitOrigins = new[]
        {
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:3000",
            "https://comedorsalaweb-b8f3hwcuhjhvh3bt.westus2-01.azurewebsites.net"
        };

        policy.SetIsOriginAllowed(origin =>
            {
                if (explicitOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
                    return true;

                if (!builder.Environment.IsDevelopment())
                    return false;

                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                    return false;

                if (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                    uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase))
                    return true;

                if (!IPAddress.TryParse(uri.Host, out var ip))
                    return false;

                var bytes = ip.GetAddressBytes();
                return bytes.Length == 4 &&
                       (bytes[0] == 10 ||
                        (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
                        (bytes[0] == 192 && bytes[1] == 168));
            })
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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
// Configure the HTTP request pipeline.
app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

var runDbInitializationOnStartup = builder.Environment.IsDevelopment() ||
                                   builder.Configuration.GetValue<bool>("Startup:RunDbInitialization");

if (runDbInitializationOnStartup)
{
    // Aplicar migraciones pendientes automáticamente
    using (var scope = app.Services.CreateScope())
    {
        try
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
        catch (Exception ex)
        {
            Console.WriteLine($"[MIGRATIONS] Error al aplicar migraciones: {ex.Message}");
            Console.WriteLine("[MIGRATIONS] La aplicación continuará iniciando para facilitar diagnóstico en Azure.");
        }
    }

    // Seed TimeSlots if they don't exist
    using (var scope = app.Services.CreateScope())
    {
        try
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
        catch (Exception ex)
        {
            Console.WriteLine($"[SEED] Error al sembrar TimeSlots: {ex.Message}");
        }
    }
}
else
{
    Console.WriteLine("[STARTUP] Inicialización de DB en arranque deshabilitada para este entorno.");
}

app.Run();