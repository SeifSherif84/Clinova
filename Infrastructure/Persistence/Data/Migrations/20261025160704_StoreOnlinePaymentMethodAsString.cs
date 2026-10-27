using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class StoreOnlinePaymentMethodAsString : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ClinicPaymentIntegrations_ClinicOnlinePaymentAccountId_PaymentMethod",
                table: "ClinicPaymentIntegrations");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "ClinicPaymentIntegrations");

            migrationBuilder.AddColumn<string>(
                name: "OnlinePaymentMethod",
                table: "ClinicPaymentIntegrations",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_ClinicPaymentIntegrations_ClinicOnlinePaymentAccountId_OnlinePaymentMethod",
                table: "ClinicPaymentIntegrations",
                columns: new[] { "ClinicOnlinePaymentAccountId", "OnlinePaymentMethod" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ClinicPaymentIntegrations_ClinicOnlinePaymentAccountId_OnlinePaymentMethod",
                table: "ClinicPaymentIntegrations");

            migrationBuilder.DropColumn(
                name: "OnlinePaymentMethod",
                table: "ClinicPaymentIntegrations");

            migrationBuilder.AddColumn<int>(
                name: "PaymentMethod",
                table: "ClinicPaymentIntegrations",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_ClinicPaymentIntegrations_ClinicOnlinePaymentAccountId_PaymentMethod",
                table: "ClinicPaymentIntegrations",
                columns: new[] { "ClinicOnlinePaymentAccountId", "PaymentMethod" },
                unique: true);
        }
    }
}
