using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Abacasa.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHouseholdModules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HouseholdInvitations_TenantId_Email",
                table: "HouseholdInvitations");

            migrationBuilder.AddColumn<bool>(
                name: "DonationExtrasEnabled",
                table: "Tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Mevcut haneler bu modülü zaten kullanıyordu: hepsinde açılır (yeni haneler kapalı açılır)
            migrationBuilder.Sql("""
                UPDATE "Tenants" SET "DonationExtrasEnabled" = true;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_HouseholdInvitations_TenantId_Email",
                table: "HouseholdInvitations",
                columns: new[] { "TenantId", "Email" },
                unique: true,
                filter: "\"AcceptedAt\" IS NULL AND \"RevokedAt\" IS NULL AND \"IsDeleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HouseholdInvitations_TenantId_Email",
                table: "HouseholdInvitations");

            migrationBuilder.DropColumn(
                name: "DonationExtrasEnabled",
                table: "Tenants");

            migrationBuilder.CreateIndex(
                name: "IX_HouseholdInvitations_TenantId_Email",
                table: "HouseholdInvitations",
                columns: new[] { "TenantId", "Email" });
        }
    }
}
