using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class make_modifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SecretaryInvitations_Secretaries_SecretaryId",
                table: "SecretaryInvitations");

            migrationBuilder.DropTable(
                name: "Invitations");

            migrationBuilder.RenameColumn(
                name: "SecretaryId",
                table: "SecretaryInvitations",
                newName: "SecretaryReceiverId");

            migrationBuilder.RenameColumn(
                name: "SecretaryEmail",
                table: "SecretaryInvitations",
                newName: "SecretaryReceiverEmail");

            migrationBuilder.RenameIndex(
                name: "IX_SecretaryInvitations_SecretaryId",
                table: "SecretaryInvitations",
                newName: "IX_SecretaryInvitations_SecretaryReceiverId");

            migrationBuilder.CreateTable(
                name: "DoctorInvitations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Status = table.Column<int>(type: "int", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DoctorSenderId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DoctorReceiverId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClinicId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoctorInvitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoctorInvitations_Clinics_ClinicId",
                        column: x => x.ClinicId,
                        principalTable: "Clinics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DoctorInvitations_Doctors_DoctorReceiverId",
                        column: x => x.DoctorReceiverId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DoctorInvitations_Doctors_DoctorSenderId",
                        column: x => x.DoctorSenderId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DoctorInvitations_ClinicId",
                table: "DoctorInvitations",
                column: "ClinicId");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorInvitations_DoctorReceiverId",
                table: "DoctorInvitations",
                column: "DoctorReceiverId");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorInvitations_DoctorSenderId",
                table: "DoctorInvitations",
                column: "DoctorSenderId");

            migrationBuilder.AddForeignKey(
                name: "FK_SecretaryInvitations_Secretaries_SecretaryReceiverId",
                table: "SecretaryInvitations",
                column: "SecretaryReceiverId",
                principalTable: "Secretaries",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SecretaryInvitations_Secretaries_SecretaryReceiverId",
                table: "SecretaryInvitations");

            migrationBuilder.DropTable(
                name: "DoctorInvitations");

            migrationBuilder.RenameColumn(
                name: "SecretaryReceiverId",
                table: "SecretaryInvitations",
                newName: "SecretaryId");

            migrationBuilder.RenameColumn(
                name: "SecretaryReceiverEmail",
                table: "SecretaryInvitations",
                newName: "SecretaryEmail");

            migrationBuilder.RenameIndex(
                name: "IX_SecretaryInvitations_SecretaryReceiverId",
                table: "SecretaryInvitations",
                newName: "IX_SecretaryInvitations_SecretaryId");

            migrationBuilder.CreateTable(
                name: "Invitations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClinicId = table.Column<int>(type: "int", nullable: false),
                    DoctorReceiverId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DoctorSenderId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Invitations_Clinics_ClinicId",
                        column: x => x.ClinicId,
                        principalTable: "Clinics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Invitations_Doctors_DoctorReceiverId",
                        column: x => x.DoctorReceiverId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Invitations_Doctors_DoctorSenderId",
                        column: x => x.DoctorSenderId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Invitations_ClinicId",
                table: "Invitations",
                column: "ClinicId");

            migrationBuilder.CreateIndex(
                name: "IX_Invitations_DoctorReceiverId",
                table: "Invitations",
                column: "DoctorReceiverId");

            migrationBuilder.CreateIndex(
                name: "IX_Invitations_DoctorSenderId",
                table: "Invitations",
                column: "DoctorSenderId");

            migrationBuilder.AddForeignKey(
                name: "FK_SecretaryInvitations_Secretaries_SecretaryId",
                table: "SecretaryInvitations",
                column: "SecretaryId",
                principalTable: "Secretaries",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
