using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddModifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RejectionReason",
                table: "Payments",
                newName: "SecretaryRejectionReason");

            migrationBuilder.RenameColumn(
                name: "PaymentProofUrl",
                table: "Payments",
                newName: "ManualPaymentProofUrl");

            migrationBuilder.AddColumn<int>(
                name: "RefundId",
                table: "Payments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ManualRefundProofUrl",
                table: "PaymentRefunds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ManualRefundTransactionReference",
                table: "PaymentRefunds",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RefundId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ManualRefundProofUrl",
                table: "PaymentRefunds");

            migrationBuilder.DropColumn(
                name: "ManualRefundTransactionReference",
                table: "PaymentRefunds");

            migrationBuilder.RenameColumn(
                name: "SecretaryRejectionReason",
                table: "Payments",
                newName: "RejectionReason");

            migrationBuilder.RenameColumn(
                name: "ManualPaymentProofUrl",
                table: "Payments",
                newName: "PaymentProofUrl");
        }
    }
}
