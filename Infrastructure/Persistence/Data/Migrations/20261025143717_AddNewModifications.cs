using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddNewModifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProcessedBySecretaryId",
                table: "PaymentRefunds",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestedBySecretaryId",
                table: "PaymentRefunds",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentRefunds_ProcessedBySecretaryId",
                table: "PaymentRefunds",
                column: "ProcessedBySecretaryId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentRefunds_RequestedBySecretaryId",
                table: "PaymentRefunds",
                column: "RequestedBySecretaryId");

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentRefunds_Secretaries_ProcessedBySecretaryId",
                table: "PaymentRefunds",
                column: "ProcessedBySecretaryId",
                principalTable: "Secretaries",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentRefunds_Secretaries_RequestedBySecretaryId",
                table: "PaymentRefunds",
                column: "RequestedBySecretaryId",
                principalTable: "Secretaries",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PaymentRefunds_Secretaries_ProcessedBySecretaryId",
                table: "PaymentRefunds");

            migrationBuilder.DropForeignKey(
                name: "FK_PaymentRefunds_Secretaries_RequestedBySecretaryId",
                table: "PaymentRefunds");

            migrationBuilder.DropIndex(
                name: "IX_PaymentRefunds_ProcessedBySecretaryId",
                table: "PaymentRefunds");

            migrationBuilder.DropIndex(
                name: "IX_PaymentRefunds_RequestedBySecretaryId",
                table: "PaymentRefunds");

            migrationBuilder.DropColumn(
                name: "ProcessedBySecretaryId",
                table: "PaymentRefunds");

            migrationBuilder.DropColumn(
                name: "RequestedBySecretaryId",
                table: "PaymentRefunds");
        }
    }
}
