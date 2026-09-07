using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueDoctorClinicDayWorkingHourIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WorkingHours_DoctorId_ClinicId",
                table: "WorkingHours");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "WorkingHours",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_WorkingHours_DoctorId_ClinicId_Day",
                table: "WorkingHours",
                columns: new[] { "DoctorId", "ClinicId", "Day" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WorkingHours_DoctorId_ClinicId_Day",
                table: "WorkingHours");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "WorkingHours");

            migrationBuilder.CreateIndex(
                name: "IX_WorkingHours_DoctorId_ClinicId",
                table: "WorkingHours",
                columns: new[] { "DoctorId", "ClinicId" });
        }
    }
}
