using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenameOnlinePaymentMethodType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "OnlinePaymentMethod",
                table: "ClinicPaymentIntegrations",
                newName: "OnlinePaymentMethodType");

            migrationBuilder.RenameIndex(
                name: "IX_ClinicPaymentIntegrations_ClinicOnlinePaymentAccountId_OnlinePaymentMethod",
                table: "ClinicPaymentIntegrations",
                newName: "IX_ClinicPaymentIntegrations_ClinicOnlinePaymentAccountId_OnlinePaymentMethodType");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "OnlinePaymentMethodType",
                table: "ClinicPaymentIntegrations",
                newName: "OnlinePaymentMethod");

            migrationBuilder.RenameIndex(
                name: "IX_ClinicPaymentIntegrations_ClinicOnlinePaymentAccountId_OnlinePaymentMethodType",
                table: "ClinicPaymentIntegrations",
                newName: "IX_ClinicPaymentIntegrations_ClinicOnlinePaymentAccountId_OnlinePaymentMethod");
        }
    }
}
