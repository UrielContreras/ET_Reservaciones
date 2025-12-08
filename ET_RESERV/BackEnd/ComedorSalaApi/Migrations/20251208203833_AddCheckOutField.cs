using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComedorSalaApi.Migrations
{
    /// <inheritdoc />
    public partial class AddCheckOutField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CheckOutAt",
                table: "Reservations",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CheckOutAt",
                table: "Reservations");
        }
    }
}
