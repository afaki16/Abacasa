using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Abacasa.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDataRetention : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "Vehicles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "VehicleObligations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "UserVerificationTokens",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "UserRoles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "Tenants",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "TenantMemberships",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "Roles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "RolePermissions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "RefreshTokens",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "RecurringPayments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "Permissions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "People",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "PaymentMethods",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "PasswordResetTokens",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "MonthlyAmounts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "LoginAttempts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "LedgerItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "HouseholdInvitations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "FundMovements",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "Expenses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "ExchangeRates",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "DonationTargets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "Donations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "DonationFunds",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "Debts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "DebtPayments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                table: "Categories",
                type: "timestamp with time zone",
                nullable: true);

            // Mevcut soft-deleted satırların silinme zamanı bilinmiyor: son değişiklik (yoksa oluşturma) zamanı yazılır
            migrationBuilder.Sql("""
                DO $$
                DECLARE t text;
                BEGIN
                    FOR t IN
                        SELECT c.table_name FROM information_schema.columns c
                        WHERE c.table_schema = 'public' AND c.column_name = 'DeletedDate'
                    LOOP
                        EXECUTE format(
                            'UPDATE %I SET "DeletedDate" = COALESCE("UpdatedDate", "CreatedDate") WHERE "IsDeleted" AND "DeletedDate" IS NULL', t);
                    END LOOP;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "VehicleObligations");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "UserVerificationTokens");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "UserRoles");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "TenantMemberships");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "RolePermissions");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "RecurringPayments");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "Permissions");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "People");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "PaymentMethods");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "PasswordResetTokens");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "MonthlyAmounts");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "LoginAttempts");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "LedgerItems");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "HouseholdInvitations");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "FundMovements");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "ExchangeRates");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "DonationTargets");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "Donations");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "DonationFunds");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "Debts");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "DebtPayments");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                table: "Categories");
        }
    }
}
