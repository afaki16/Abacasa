using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Abacasa.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceProfileImageUrlWithKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ProfileImageUrl",
                table: "Users",
                newName: "ProfileImageKey");

            // Old values were free-text URLs, not storage keys; they would become broken
            // addresses, so they are cleared (photos are now uploaded through the API).
            migrationBuilder.Sql("UPDATE \"Users\" SET \"ProfileImageKey\" = NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Storage keys are not URLs; clear them before turning the column back into a URL
            migrationBuilder.Sql("UPDATE \"Users\" SET \"ProfileImageKey\" = NULL;");

            migrationBuilder.RenameColumn(
                name: "ProfileImageKey",
                table: "Users",
                newName: "ProfileImageUrl");
        }
    }
}
