using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class MakeWorkingHourForeignKeyNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppointmentSlots_WorkingHours_WorkingHourId",
                table: "AppointmentSlots");

            migrationBuilder.AlterColumn<int>(
                name: "WorkingHourId",
                table: "AppointmentSlots",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_AppointmentSlots_WorkingHours_WorkingHourId",
                table: "AppointmentSlots",
                column: "WorkingHourId",
                principalTable: "WorkingHours",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppointmentSlots_WorkingHours_WorkingHourId",
                table: "AppointmentSlots");

            migrationBuilder.AlterColumn<int>(
                name: "WorkingHourId",
                table: "AppointmentSlots",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AppointmentSlots_WorkingHours_WorkingHourId",
                table: "AppointmentSlots",
                column: "WorkingHourId",
                principalTable: "WorkingHours",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
