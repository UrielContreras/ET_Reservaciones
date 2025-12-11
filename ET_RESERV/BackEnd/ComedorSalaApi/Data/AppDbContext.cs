using ComedorSalaApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ComedorSalaApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<TimeSlot> TimeSlots => Set<TimeSlot>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<RoomReservation> RoomReservations => Set<RoomReservation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Email único
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Relaciones
        modelBuilder.Entity<Reservation>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Reservation>()
            .HasOne(r => r.TimeSlot)
            .WithMany()
            .HasForeignKey(r => r.TimeSlotId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relación para RoomReservation
        modelBuilder.Entity<RoomReservation>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}