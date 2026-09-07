using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class RefactorAppointmentSlots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_AvailableSlots_AvailableSlotId",
                table: "Appointments");

            migrationBuilder.DropTable(
                name: "AvailableSlots");

            migrationBuilder.RenameColumn(
                name: "AvailableSlotId",
                table: "Appointments",
                newName: "AppointmentSlotId");

            migrationBuilder.RenameIndex(
                name: "IX_Appointments_AvailableSlotId",
                table: "Appointments",
                newName: "IX_Appointments_AppointmentSlotId");

            migrationBuilder.CreateTable(
                name: "AppointmentSlots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    WorkingHourId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppointmentSlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppointmentSlots_WorkingHours_WorkingHourId",
                        column: x => x.WorkingHourId,
                        principalTable: "WorkingHours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentSlots_WorkingHourId",
                table: "AppointmentSlots",
                column: "WorkingHourId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_AppointmentSlots_AppointmentSlotId",
                table: "Appointments",
                column: "AppointmentSlotId",
                principalTable: "AppointmentSlots",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_AppointmentSlots_AppointmentSlotId",
                table: "Appointments");

            migrationBuilder.DropTable(
                name: "AppointmentSlots");

            migrationBuilder.RenameColumn(
                name: "AppointmentSlotId",
                table: "Appointments",
                newName: "AvailableSlotId");

            migrationBuilder.RenameIndex(
                name: "IX_Appointments_AppointmentSlotId",
                table: "Appointments",
                newName: "IX_Appointments_AvailableSlotId");

            migrationBuilder.CreateTable(
                name: "AvailableSlots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkingHoursId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Day = table.Column<int>(type: "int", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvailableSlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvailableSlots_WorkingHours_WorkingHoursId",
                        column: x => x.WorkingHoursId,
                        principalTable: "WorkingHours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AvailableSlots_WorkingHoursId",
                table: "AvailableSlots",
                column: "WorkingHoursId");

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_AvailableSlots_AvailableSlotId",
                table: "Appointments",
                column: "AvailableSlotId",
                principalTable: "AvailableSlots",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
