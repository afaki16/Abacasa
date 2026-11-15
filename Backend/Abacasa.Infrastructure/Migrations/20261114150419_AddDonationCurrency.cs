using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Abacasa.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDonationCurrency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Currency",
                table: "Donations",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<decimal>(
                name: "ExchangeRate",
                table: "Donations",
                type: "numeric(18,4)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ForeignAmount",
                table: "Donations",
                type: "numeric(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Donations");

            migrationBuilder.DropColumn(
                name: "ExchangeRate",
                table: "Donations");

            migrationBuilder.DropColumn(
                name: "ForeignAmount",
                table: "Donations");
        }
    }
}
