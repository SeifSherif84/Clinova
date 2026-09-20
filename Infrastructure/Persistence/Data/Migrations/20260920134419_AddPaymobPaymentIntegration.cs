using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymobPaymentIntegration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_ClinicPaymentMethods_ClinicPaymentMethodId",
                table: "Payments");

            migrationBuilder.DropTable(
                name: "ClinicPaymentMethods");

            migrationBuilder.RenameColumn(
                name: "ClinicPaymentMethodId",
                table: "Payments",
                newName: "ClinicOnlinePaymentAccountId");

            migrationBuilder.RenameIndex(
                name: "IX_Payments_ClinicPaymentMethodId",
                table: "Payments",
                newName: "IX_Payments_ClinicOnlinePaymentAccountId");

            migrationBuilder.AddColumn<int>(
                name: "ClinicManualPaymentMethodId",
                table: "Payments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderClientSecret",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderOrderId",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderPaymentIntentId",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderTransactionId",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "DepositPercentage",
                table: "Clinics",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<DateTime>(
                name: "ReservationExpiresAt",
                table: "Appointments",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "ClinicManualPaymentMethods",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<int>(type: "int", nullable: false),
                    AccountIdentifier = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    ClinicId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClinicManualPaymentMethods", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClinicManualPaymentMethods_Clinics_ClinicId",
                        column: x => x.ClinicId,
                        principalTable: "Clinics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ClinicOnlinePaymentAccount",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Provider = table.Column<int>(type: "int", nullable: false),
                    MerchantId = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    PublicKey = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecretKey = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HmacSecret = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClinicId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClinicOnlinePaymentAccount", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClinicOnlinePaymentAccount_Clinics_ClinicId",
                        column: x => x.ClinicId,
                        principalTable: "Clinics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ClinicPaymentIntegration",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PaymentMethod = table.Column<int>(type: "int", nullable: false),
                    IntegrationId = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    ClinicOnlinePaymentAccountId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClinicPaymentIntegration", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClinicPaymentIntegration_ClinicOnlinePaymentAccount_ClinicOnlinePaymentAccountId",
                        column: x => x.ClinicOnlinePaymentAccountId,
                        principalTable: "ClinicOnlinePaymentAccount",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ClinicManualPaymentMethodId",
                table: "Payments",
                column: "ClinicManualPaymentMethodId");

            migrationBuilder.CreateIndex(
                name: "IX_ClinicManualPaymentMethods_ClinicId_Type_AccountIdentifier",
                table: "ClinicManualPaymentMethods",
                columns: new[] { "ClinicId", "Type", "AccountIdentifier" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClinicOnlinePaymentAccount_ClinicId_Provider",
                table: "ClinicOnlinePaymentAccount",
                columns: new[] { "ClinicId", "Provider" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClinicPaymentIntegration_ClinicOnlinePaymentAccountId_PaymentMethod",
                table: "ClinicPaymentIntegration",
                columns: new[] { "ClinicOnlinePaymentAccountId", "PaymentMethod" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_ClinicManualPaymentMethods_ClinicManualPaymentMethodId",
                table: "Payments",
                column: "ClinicManualPaymentMethodId",
                principalTable: "ClinicManualPaymentMethods",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_ClinicOnlinePaymentAccount_ClinicOnlinePaymentAccountId",
                table: "Payments",
                column: "ClinicOnlinePaymentAccountId",
                principalTable: "ClinicOnlinePaymentAccount",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_ClinicManualPaymentMethods_ClinicManualPaymentMethodId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_ClinicOnlinePaymentAccount_ClinicOnlinePaymentAccountId",
                table: "Payments");

            migrationBuilder.DropTable(
                name: "ClinicManualPaymentMethods");

            migrationBuilder.DropTable(
                name: "ClinicPaymentIntegration");

            migrationBuilder.DropTable(
                name: "ClinicOnlinePaymentAccount");

            migrationBuilder.DropIndex(
                name: "IX_Payments_ClinicManualPaymentMethodId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ClinicManualPaymentMethodId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ProviderClientSecret",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ProviderOrderId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ProviderPaymentIntentId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "ProviderTransactionId",
                table: "Payments");

            migrationBuilder.RenameColumn(
                name: "ClinicOnlinePaymentAccountId",
                table: "Payments",
                newName: "ClinicPaymentMethodId");

            migrationBuilder.RenameIndex(
                name: "IX_Payments_ClinicOnlinePaymentAccountId",
                table: "Payments",
                newName: "IX_Payments_ClinicPaymentMethodId");

            migrationBuilder.AlterColumn<decimal>(
                name: "DepositPercentage",
                table: "Clinics",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(5,2)",
                oldPrecision: 5,
                oldScale: 2);

            migrationBuilder.AlterColumn<DateTime>(
                name: "ReservationExpiresAt",
                table: "Appointments",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.CreateTable(
                name: "ClinicPaymentMethods",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClinicId = table.Column<int>(type: "int", nullable: false),
                    AccountIdentifier = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Provider = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProviderAccountId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Type = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClinicPaymentMethods", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClinicPaymentMethods_Clinics_ClinicId",
                        column: x => x.ClinicId,
                        principalTable: "Clinics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClinicPaymentMethods_ClinicId",
                table: "ClinicPaymentMethods",
                column: "ClinicId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_ClinicPaymentMethods_ClinicPaymentMethodId",
                table: "Payments",
                column: "ClinicPaymentMethodId",
                principalTable: "ClinicPaymentMethods",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
