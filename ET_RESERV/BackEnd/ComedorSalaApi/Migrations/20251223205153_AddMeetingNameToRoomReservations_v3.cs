using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComedorSalaApi.Migrations
{
    /// <inheritdoc />
    public partial class AddMeetingNameToRoomReservations_v3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MeetingName",
                table: "RoomReservations",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MeetingName",
                table: "RoomReservations");
        }
    }
}
