using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Abacasa.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantMemberships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_TenantId_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Tenants_Name",
                table: "Tenants");

            migrationBuilder.AlterColumn<string>(
                name: "Domain",
                table: "Tenants",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "RefreshTokens",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TenantMemberships",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    PersonId = table.Column<int>(type: "integer", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<int>(type: "integer", nullable: true),
                    UpdatedBy = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantMemberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TenantMemberships_People_PersonId",
                        column: x => x.PersonId,
                        principalTable: "People",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TenantMemberships_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TenantMemberships_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_TenantMemberships_PersonId",
                table: "TenantMemberships",
                column: "PersonId");

            migrationBuilder.CreateIndex(
                name: "IX_TenantMemberships_TenantId",
                table: "TenantMemberships",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_TenantMemberships_UserId_TenantId",
                table: "TenantMemberships",
                columns: new[] { "UserId", "TenantId" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            // Veri taşıma: hanesi olan her canlı kullanıcıya o hanede üyelik.
            // SuperAdmin veya Admin sistem rolü olan yönetici (1), diğerleri üye (2).
            migrationBuilder.Sql("""
                INSERT INTO "TenantMemberships" ("UserId", "TenantId", "Role", "PersonId", "CreatedDate", "IsDeleted")
                SELECT u."Id", u."TenantId",
                       CASE WHEN EXISTS (
                           SELECT 1 FROM "UserRoles" ur
                           JOIN "Roles" r ON r."Id" = ur."RoleId"
                           WHERE ur."UserId" = u."Id" AND ur."IsDeleted" = false
                             AND r."Name" IN ('SuperAdmin', 'Admin')
                       ) THEN 1 ELSE 2 END,
                       NULL, now(), false
                FROM "Users" u
                WHERE u."IsDeleted" = false AND u."TenantId" IS NOT NULL;
                """);

            // Hane yetkisi artık üyelikten: Admin ve User sistem rolü atamaları kalkar (SuperAdmin kalır)
            migrationBuilder.Sql("""
                DELETE FROM "UserRoles"
                WHERE "RoleId" IN (SELECT "Id" FROM "Roles" WHERE "Name" IN ('Admin', 'User'));
                """);

            // Mevcut oturumlar kullanıcının hanesiyle devam eder
            migrationBuilder.Sql("""
                UPDATE "RefreshTokens" rt
                SET "TenantId" = u."TenantId"
                FROM "Users" u
                WHERE u."Id" = rt."UserId";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Geri dönüş: User.TenantId hanesindeki üyelik rolünden Admin/User sistem rolü atanır
            migrationBuilder.Sql("""
                INSERT INTO "UserRoles" ("UserId", "RoleId", "CreatedDate", "IsDeleted")
                SELECT m."UserId", r."Id", now(), false
                FROM "TenantMemberships" m
                JOIN "Users" u ON u."Id" = m."UserId" AND u."TenantId" = m."TenantId"
                JOIN "Roles" r ON r."Name" = CASE WHEN m."Role" = 1 THEN 'Admin' ELSE 'User' END
                WHERE m."IsDeleted" = false
                  AND NOT EXISTS (
                      SELECT 1 FROM "UserRoles" ur JOIN "Roles" sr ON sr."Id" = ur."RoleId"
                      WHERE ur."UserId" = m."UserId" AND sr."Name" = 'SuperAdmin');
                """);

            migrationBuilder.DropTable(
                name: "TenantMemberships");

            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "RefreshTokens");

            migrationBuilder.AlterColumn<string>(
                name: "Domain",
                table: "Tenants",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true,
                filter: "\"TenantId\" IS NULL AND NOT \"IsDeleted\"");

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId_Email",
                table: "Users",
                columns: new[] { "TenantId", "Email" },
                unique: true,
                filter: "\"TenantId\" IS NOT NULL AND NOT \"IsDeleted\"");

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_Name",
                table: "Tenants",
                column: "Name",
                unique: true);
        }
    }
}
