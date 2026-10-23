using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Abacasa.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurringPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RecurringPaymentId",
                table: "Expenses",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "RecurringPaymentMonth",
                table: "Expenses",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurringPaymentId",
                table: "Donations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "RecurringPaymentMonth",
                table: "Donations",
                type: "date",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "RecurringPayments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Kind = table.Column<int>(type: "integer", nullable: false),
                    ExpectedAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    DueDay = table.Column<int>(type: "integer", nullable: false),
                    StartMonth = table.Column<DateOnly>(type: "date", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    PaymentMethodId = table.Column<int>(type: "integer", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: true),
                    OwnerPersonId = table.Column<int>(type: "integer", nullable: true),
                    Recipient = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DonationKind = table.Column<int>(type: "integer", nullable: true),
                    TotalAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    InstallmentCount = table.Column<int>(type: "integer", nullable: true),
                    FirstDueDate = table.Column<DateOnly>(type: "date", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<int>(type: "integer", nullable: true),
                    UpdatedBy = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecurringPayments_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecurringPayments_PaymentMethods_PaymentMethodId",
                        column: x => x.PaymentMethodId,
                        principalTable: "PaymentMethods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecurringPayments_People_OwnerPersonId",
                        column: x => x.OwnerPersonId,
                        principalTable: "People",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecurringPayments_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_RecurringPaymentId_RecurringPaymentMonth",
                table: "Expenses",
                columns: new[] { "RecurringPaymentId", "RecurringPaymentMonth" },
                unique: true,
                filter: "\"RecurringPaymentId\" IS NOT NULL AND \"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Donations_RecurringPaymentId_RecurringPaymentMonth",
                table: "Donations",
                columns: new[] { "RecurringPaymentId", "RecurringPaymentMonth" },
                unique: true,
                filter: "\"RecurringPaymentId\" IS NOT NULL AND \"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPayments_CategoryId",
                table: "RecurringPayments",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPayments_OwnerPersonId",
                table: "RecurringPayments",
                column: "OwnerPersonId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPayments_PaymentMethodId",
                table: "RecurringPayments",
                column: "PaymentMethodId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPayments_TenantId_Name",
                table: "RecurringPayments",
                columns: new[] { "TenantId", "Name" });

            migrationBuilder.AddForeignKey(
                name: "FK_Donations_RecurringPayments_RecurringPaymentId",
                table: "Donations",
                column: "RecurringPaymentId",
                principalTable: "RecurringPayments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_RecurringPayments_RecurringPaymentId",
                table: "Expenses",
                column: "RecurringPaymentId",
                principalTable: "RecurringPayments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Donations_RecurringPayments_RecurringPaymentId",
                table: "Donations");

            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_RecurringPayments_RecurringPaymentId",
                table: "Expenses");

            migrationBuilder.DropTable(
                name: "RecurringPayments");

            migrationBuilder.DropIndex(
                name: "IX_Expenses_RecurringPaymentId_RecurringPaymentMonth",
                table: "Expenses");

            migrationBuilder.DropIndex(
                name: "IX_Donations_RecurringPaymentId_RecurringPaymentMonth",
                table: "Donations");

            migrationBuilder.DropColumn(
                name: "RecurringPaymentId",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "RecurringPaymentMonth",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "RecurringPaymentId",
                table: "Donations");

            migrationBuilder.DropColumn(
                name: "RecurringPaymentMonth",
                table: "Donations");
        }
    }
}
