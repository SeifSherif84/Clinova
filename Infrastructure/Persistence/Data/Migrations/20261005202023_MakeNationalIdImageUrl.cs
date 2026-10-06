using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class MakeNationalIdImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NationalId",
                table: "Secretaries");

            migrationBuilder.AddColumn<string>(
                name: "NationalIdImageUrl",
                table: "Secretaries",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NationalIdImageUrl",
                table: "Secretaries");

            migrationBuilder.AddColumn<string>(
                name: "NationalId",
                table: "Secretaries",
                type: "varchar(14)",
                maxLength: 14,
                nullable: false,
                defaultValue: "");
        }
    }
}
