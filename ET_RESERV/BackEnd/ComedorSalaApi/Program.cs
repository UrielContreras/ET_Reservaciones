using System.Text;
using ComedorSalaApi.Data;
using ComedorSalaApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

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

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "https://comedoret-afb0gheaegfkajdd.northcentralus-01.azurewebsites.net"
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
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
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
} 
app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

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