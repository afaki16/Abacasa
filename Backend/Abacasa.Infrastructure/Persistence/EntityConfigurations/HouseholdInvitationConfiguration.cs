using Abacasa.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Abacasa.Infrastructure.Persistence.EntityConfigurations;

public class HouseholdInvitationConfiguration : IEntityTypeConfiguration<HouseholdInvitation>
{
    public void Configure(EntityTypeBuilder<HouseholdInvitation> builder)
    {
        builder.ToTable("HouseholdInvitations");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.Role)
            .IsRequired();

        builder.Property(x => x.TokenHash)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(x => x.ExpiresAt)
            .IsRequired();

        builder.Property(x => x.IsDeleted)
            .IsRequired();

        builder.Property(x => x.CreatedDate)
            .IsRequired();

        builder.HasIndex(x => x.TokenHash)
            .IsUnique();
        // Hanede bir e-postaya tek açık (kabul ya da iptal edilmemiş) davet; eşzamanlı davetlerde biri hariç 23505 → 409.
        // Süresi dolmuş açık davet, yeni davetten önce iptal edilir (CreateHouseholdInvitation).
        builder.HasIndex(x => new { x.TenantId, x.Email })
            .IsUnique()
            .HasFilter("\"AcceptedAt\" IS NULL AND \"RevokedAt\" IS NULL AND \"IsDeleted\" = false");

        // Tenant navigation property yok; sadece FK
        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Person)
            .WithMany()
            .HasForeignKey(x => x.PersonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.InvitedByUser)
            .WithMany()
            .HasForeignKey(x => x.InvitedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.AcceptedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
