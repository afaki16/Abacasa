using Abacasa.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Abacasa.Infrastructure.Persistence.EntityConfigurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("Users");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.FirstName)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(x => x.LastName)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(x => x.Email)
                .IsRequired()
                .HasMaxLength(100);

            // Kimlik globaldir: e-posta tüm sistemde benzersiz. E-posta normalize edilmiş (trim + küçük harf) saklanır.
            // Soft-deleted rows are excluded so email can be reused after delete.
            builder.HasIndex(x => x.Email)
                .IsUnique()
                .HasFilter("\"IsDeleted\" = false");

            builder.Property(x => x.PasswordHash)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(x => x.PhoneNumber)
                .HasMaxLength(20);

            builder.Property(x => x.PendingHouseholdName)
                .HasMaxLength(100);

            // Telefon e-posta gibi global: hane değiştirmek (User.TenantId) hiçbir benzersizlik kuralına takılmaz
            builder.HasIndex(x => x.PhoneNumber)
                .IsUnique()
                .HasFilter("\"PhoneNumber\" IS NOT NULL AND \"PhoneNumber\" <> '' AND \"IsDeleted\" = false");

            builder.HasIndex(x => x.TenantId);

            builder.Property(x => x.Status)
                .IsRequired()
                .HasConversion<int>();

            builder.Property(x => x.ProfileImageUrl)
                .HasMaxLength(500);

        builder.Property(x => x.TenantId)
               .IsRequired(false);

        builder.Property(x => x.EmailConfirmed)
                .IsRequired()
                .HasDefaultValue(false);

            builder.Property(x => x.PhoneConfirmed)
                .IsRequired()
                .HasDefaultValue(false);

            builder.Property(x => x.CreatedDate)
                .IsRequired();

            builder.Property(x => x.LastSessionsRevokedAt)
                .IsRequired(false);

            builder.Property(x => x.IsDeleted)
                .IsRequired()
                .HasDefaultValue(false);

            // Relationships
            builder.HasMany(x => x.UserRoles)
                .WithOne(x => x.User)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(x => x.RefreshTokens)
                .WithOne(x => x.User)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
} 
