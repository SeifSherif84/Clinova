using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class MakeMerchantIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClinicOnlinePaymentAccount_Clinics_ClinicId",
                table: "ClinicOnlinePaymentAccount");

            migrationBuilder.DropForeignKey(
                name: "FK_ClinicPaymentIntegration_ClinicOnlinePaymentAccount_ClinicOnlinePaymentAccountId",
                table: "ClinicPaymentIntegration");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_ClinicOnlinePaymentAccount_ClinicOnlinePaymentAccountId",
                table: "Payments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ClinicPaymentIntegration",
                table: "ClinicPaymentIntegration");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ClinicOnlinePaymentAccount",
                table: "ClinicOnlinePaymentAccount");

            migrationBuilder.RenameTable(
                name: "ClinicPaymentIntegration",
                newName: "ClinicPaymentIntegrations");

            migrationBuilder.RenameTable(
                name: "ClinicOnlinePaymentAccount",
                newName: "ClinicOnlinePaymentAccounts");

            migrationBuilder.RenameIndex(
                name: "IX_ClinicPaymentIntegration_ClinicOnlinePaymentAccountId_PaymentMethod",
                table: "ClinicPaymentIntegrations",
                newName: "IX_ClinicPaymentIntegrations_ClinicOnlinePaymentAccountId_PaymentMethod");

            migrationBuilder.RenameIndex(
                name: "IX_ClinicOnlinePaymentAccount_ClinicId_Provider",
                table: "ClinicOnlinePaymentAccounts",
                newName: "IX_ClinicOnlinePaymentAccounts_ClinicId_Provider");

            migrationBuilder.AlterColumn<string>(
                name: "MerchantId",
                table: "ClinicOnlinePaymentAccounts",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AddPrimaryKey(
                name: "PK_ClinicPaymentIntegrations",
                table: "ClinicPaymentIntegrations",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ClinicOnlinePaymentAccounts",
                table: "ClinicOnlinePaymentAccounts",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ClinicOnlinePaymentAccounts_Clinics_ClinicId",
                table: "ClinicOnlinePaymentAccounts",
                column: "ClinicId",
                principalTable: "Clinics",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ClinicPaymentIntegrations_ClinicOnlinePaymentAccounts_ClinicOnlinePaymentAccountId",
                table: "ClinicPaymentIntegrations",
                column: "ClinicOnlinePaymentAccountId",
                principalTable: "ClinicOnlinePaymentAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_ClinicOnlinePaymentAccounts_ClinicOnlinePaymentAccountId",
                table: "Payments",
                column: "ClinicOnlinePaymentAccountId",
                principalTable: "ClinicOnlinePaymentAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClinicOnlinePaymentAccounts_Clinics_ClinicId",
                table: "ClinicOnlinePaymentAccounts");

            migrationBuilder.DropForeignKey(
                name: "FK_ClinicPaymentIntegrations_ClinicOnlinePaymentAccounts_ClinicOnlinePaymentAccountId",
                table: "ClinicPaymentIntegrations");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_ClinicOnlinePaymentAccounts_ClinicOnlinePaymentAccountId",
                table: "Payments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ClinicPaymentIntegrations",
                table: "ClinicPaymentIntegrations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ClinicOnlinePaymentAccounts",
                table: "ClinicOnlinePaymentAccounts");

            migrationBuilder.RenameTable(
                name: "ClinicPaymentIntegrations",
                newName: "ClinicPaymentIntegration");

            migrationBuilder.RenameTable(
                name: "ClinicOnlinePaymentAccounts",
                newName: "ClinicOnlinePaymentAccount");

            migrationBuilder.RenameIndex(
                name: "IX_ClinicPaymentIntegrations_ClinicOnlinePaymentAccountId_PaymentMethod",
                table: "ClinicPaymentIntegration",
                newName: "IX_ClinicPaymentIntegration_ClinicOnlinePaymentAccountId_PaymentMethod");

            migrationBuilder.RenameIndex(
                name: "IX_ClinicOnlinePaymentAccounts_ClinicId_Provider",
                table: "ClinicOnlinePaymentAccount",
                newName: "IX_ClinicOnlinePaymentAccount_ClinicId_Provider");

            migrationBuilder.AlterColumn<string>(
                name: "MerchantId",
                table: "ClinicOnlinePaymentAccount",
                type: "varchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_ClinicPaymentIntegration",
                table: "ClinicPaymentIntegration",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ClinicOnlinePaymentAccount",
                table: "ClinicOnlinePaymentAccount",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ClinicOnlinePaymentAccount_Clinics_ClinicId",
                table: "ClinicOnlinePaymentAccount",
                column: "ClinicId",
                principalTable: "Clinics",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ClinicPaymentIntegration_ClinicOnlinePaymentAccount_ClinicOnlinePaymentAccountId",
                table: "ClinicPaymentIntegration",
                column: "ClinicOnlinePaymentAccountId",
                principalTable: "ClinicOnlinePaymentAccount",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_ClinicOnlinePaymentAccount_ClinicOnlinePaymentAccountId",
                table: "Payments",
                column: "ClinicOnlinePaymentAccountId",
                principalTable: "ClinicOnlinePaymentAccount",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
