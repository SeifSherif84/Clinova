using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRemainingPaymentAndAnalyticsUpdates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PaymentRefunds");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropColumn(
                name: "DepositAmount",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "DoctorNotes",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "PatientNotes",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "RemainingAmountCollectedAt",
                table: "Appointments");

            migrationBuilder.RenameColumn(
                name: "RemainingAmount",
                table: "Appointments",
                newName: "TotalPaidAmount");

            migrationBuilder.AlterColumn<int>(
                name: "FullRefundCancellationWindowMinutes",
                table: "Appointments",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "BookingCancellationGracePeriodMinutes",
                table: "Appointments",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.CreateTable(
                name: "DepositPayments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequiredAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    MethodType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TransactionReference = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProviderPaymentIntentId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProviderOrderId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProviderClientSecret = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProviderTransactionId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClinicManualPaymentMethodId = table.Column<int>(type: "int", nullable: true),
                    ManualProofUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClinicOnlinePaymentAccountId = table.Column<int>(type: "int", nullable: true),
                    AppointmentId = table.Column<int>(type: "int", nullable: false),
                    SecretaryRejectionReason = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DepositPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DepositPayments_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DepositPayments_ClinicManualPaymentMethods_ClinicManualPaymentMethodId",
                        column: x => x.ClinicManualPaymentMethodId,
                        principalTable: "ClinicManualPaymentMethods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DepositPayments_ClinicOnlinePaymentAccounts_ClinicOnlinePaymentAccountId",
                        column: x => x.ClinicOnlinePaymentAccountId,
                        principalTable: "ClinicOnlinePaymentAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RemainingPayments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequiredAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MethodType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ClinicManualPaymentMethodId = table.Column<int>(type: "int", nullable: true),
                    AppointmentId = table.Column<int>(type: "int", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RemainingPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RemainingPayments_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RemainingPayments_ClinicManualPaymentMethods_ClinicManualPaymentMethodId",
                        column: x => x.ClinicManualPaymentMethodId,
                        principalTable: "ClinicManualPaymentMethods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DepositRefunds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestedRefundAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    DepositPaymentId = table.Column<int>(type: "int", nullable: false),
                    IdempotencyKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MethodType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OriginalTransactionId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ProviderRefundTransactionId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FailureReason = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ProviderResponse = table.Column<string>(type: "nvarchar(max)", maxLength: 10000, nullable: true),
                    ManualProofUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ManualTransactionReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RequestedBySecretaryId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    ProcessedBySecretaryId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DepositRefunds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DepositRefunds_DepositPayments_DepositPaymentId",
                        column: x => x.DepositPaymentId,
                        principalTable: "DepositPayments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DepositRefunds_Secretaries_ProcessedBySecretaryId",
                        column: x => x.ProcessedBySecretaryId,
                        principalTable: "Secretaries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DepositRefunds_Secretaries_RequestedBySecretaryId",
                        column: x => x.RequestedBySecretaryId,
                        principalTable: "Secretaries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DepositPayments_AppointmentId",
                table: "DepositPayments",
                column: "AppointmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DepositPayments_ClinicManualPaymentMethodId",
                table: "DepositPayments",
                column: "ClinicManualPaymentMethodId");

            migrationBuilder.CreateIndex(
                name: "IX_DepositPayments_ClinicOnlinePaymentAccountId",
                table: "DepositPayments",
                column: "ClinicOnlinePaymentAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_DepositRefunds_DepositPaymentId",
                table: "DepositRefunds",
                column: "DepositPaymentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DepositRefunds_IdempotencyKey",
                table: "DepositRefunds",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DepositRefunds_ProcessedBySecretaryId",
                table: "DepositRefunds",
                column: "ProcessedBySecretaryId");

            migrationBuilder.CreateIndex(
                name: "IX_DepositRefunds_RequestedBySecretaryId",
                table: "DepositRefunds",
                column: "RequestedBySecretaryId");

            migrationBuilder.CreateIndex(
                name: "IX_RemainingPayments_AppointmentId",
                table: "RemainingPayments",
                column: "AppointmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RemainingPayments_ClinicManualPaymentMethodId",
                table: "RemainingPayments",
                column: "ClinicManualPaymentMethodId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DepositRefunds");

            migrationBuilder.DropTable(
                name: "RemainingPayments");

            migrationBuilder.DropTable(
                name: "DepositPayments");

            migrationBuilder.RenameColumn(
                name: "TotalPaidAmount",
                table: "Appointments",
                newName: "RemainingAmount");

            migrationBuilder.AlterColumn<int>(
                name: "FullRefundCancellationWindowMinutes",
                table: "Appointments",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "BookingCancellationGracePeriodMinutes",
                table: "Appointments",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DepositAmount",
                table: "Appointments",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "DoctorNotes",
                table: "Appointments",
                type: "varchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PatientNotes",
                table: "Appointments",
                type: "varchar(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RemainingAmountCollectedAt",
                table: "Appointments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AppointmentId = table.Column<int>(type: "int", nullable: false),
                    ClinicManualPaymentMethodId = table.Column<int>(type: "int", nullable: true),
                    ClinicOnlinePaymentAccountId = table.Column<int>(type: "int", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ManualPaymentProofUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MethodType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ProviderClientSecret = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProviderOrderId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProviderPaymentIntentId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProviderTransactionId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    SecretaryRejectionReason = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TransactionReference = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Payments_ClinicManualPaymentMethods_ClinicManualPaymentMethodId",
                        column: x => x.ClinicManualPaymentMethodId,
                        principalTable: "ClinicManualPaymentMethods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Payments_ClinicOnlinePaymentAccounts_ClinicOnlinePaymentAccountId",
                        column: x => x.ClinicOnlinePaymentAccountId,
                        principalTable: "ClinicOnlinePaymentAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PaymentRefunds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PaymentId = table.Column<int>(type: "int", nullable: false),
                    ProcessedBySecretaryId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    RequestedBySecretaryId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    FailureReason = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    IdempotencyKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ManualRefundProofUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ManualRefundTransactionReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Method = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OriginalTransactionId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ProviderRefundTransactionId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ProviderResponse = table.Column<string>(type: "nvarchar(max)", maxLength: 10000, nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentRefunds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentRefunds_Payments_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "Payments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentRefunds_Secretaries_ProcessedBySecretaryId",
                        column: x => x.ProcessedBySecretaryId,
                        principalTable: "Secretaries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentRefunds_Secretaries_RequestedBySecretaryId",
                        column: x => x.RequestedBySecretaryId,
                        principalTable: "Secretaries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentRefunds_IdempotencyKey",
                table: "PaymentRefunds",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentRefunds_PaymentId",
                table: "PaymentRefunds",
                column: "PaymentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentRefunds_ProcessedBySecretaryId",
                table: "PaymentRefunds",
                column: "ProcessedBySecretaryId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentRefunds_RequestedBySecretaryId",
                table: "PaymentRefunds",
                column: "RequestedBySecretaryId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_AppointmentId",
                table: "Payments",
                column: "AppointmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ClinicManualPaymentMethodId",
                table: "Payments",
                column: "ClinicManualPaymentMethodId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ClinicOnlinePaymentAccountId",
                table: "Payments",
                column: "ClinicOnlinePaymentAccountId");
        }
    }
}
