using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIsActiveColumnToOnlinePaymentAccount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MerchantId",
                table: "ClinicOnlinePaymentAccounts");

            migrationBuilder.AlterColumn<string>(
                name: "OriginalTransactionId",
                table: "PaymentRefunds",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "ClinicOnlinePaymentAccounts",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "ClinicManualPaymentMethods",
                type: "bit",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "bit");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "ClinicOnlinePaymentAccounts");

            migrationBuilder.AlterColumn<string>(
                name: "OriginalTransactionId",
                table: "PaymentRefunds",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MerchantId",
                table: "ClinicOnlinePaymentAccounts",
                type: "varchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "ClinicManualPaymentMethods",
                type: "bit",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValue: true);
        }
    }
}
