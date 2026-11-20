using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenameSupportTicketMessageTableToPlural : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SupportTicketMessage_SupportTickets_SupportTicketId",
                table: "SupportTicketMessage");

            migrationBuilder.DropForeignKey(
                name: "FK_SupportTicketMessage_Users_SenderId",
                table: "SupportTicketMessage");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SupportTicketMessage",
                table: "SupportTicketMessage");

            migrationBuilder.RenameTable(
                name: "SupportTicketMessage",
                newName: "SupportTicketMessages");

            migrationBuilder.RenameIndex(
                name: "IX_SupportTicketMessage_SupportTicketId",
                table: "SupportTicketMessages",
                newName: "IX_SupportTicketMessages_SupportTicketId");

            migrationBuilder.RenameIndex(
                name: "IX_SupportTicketMessage_SenderId",
                table: "SupportTicketMessages",
                newName: "IX_SupportTicketMessages_SenderId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SupportTicketMessages",
                table: "SupportTicketMessages",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SupportTicketMessages_SupportTickets_SupportTicketId",
                table: "SupportTicketMessages",
                column: "SupportTicketId",
                principalTable: "SupportTickets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SupportTicketMessages_Users_SenderId",
                table: "SupportTicketMessages",
                column: "SenderId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SupportTicketMessages_SupportTickets_SupportTicketId",
                table: "SupportTicketMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_SupportTicketMessages_Users_SenderId",
                table: "SupportTicketMessages");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SupportTicketMessages",
                table: "SupportTicketMessages");

            migrationBuilder.RenameTable(
                name: "SupportTicketMessages",
                newName: "SupportTicketMessage");

            migrationBuilder.RenameIndex(
                name: "IX_SupportTicketMessages_SupportTicketId",
                table: "SupportTicketMessage",
                newName: "IX_SupportTicketMessage_SupportTicketId");

            migrationBuilder.RenameIndex(
                name: "IX_SupportTicketMessages_SenderId",
                table: "SupportTicketMessage",
                newName: "IX_SupportTicketMessage_SenderId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SupportTicketMessage",
                table: "SupportTicketMessage",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SupportTicketMessage_SupportTickets_SupportTicketId",
                table: "SupportTicketMessage",
                column: "SupportTicketId",
                principalTable: "SupportTickets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SupportTicketMessage_Users_SenderId",
                table: "SupportTicketMessage",
                column: "SenderId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
