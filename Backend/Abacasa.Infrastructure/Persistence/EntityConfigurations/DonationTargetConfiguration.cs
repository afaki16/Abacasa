using Abacasa.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Abacasa.Infrastructure.Persistence.EntityConfigurations;

public class DonationTargetConfiguration : IEntityTypeConfiguration<DonationTarget>
{
    public void Configure(EntityTypeBuilder<DonationTarget> builder)
    {
        builder.ToTable("DonationTargets");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Year)
            .IsRequired();

        builder.Property(x => x.Kind)
            .IsRequired();

        builder.Property(x => x.Amount)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.Note)
            .HasMaxLength(200);

        builder.Property(x => x.IsDeleted)
            .IsRequired();

        builder.Property(x => x.CreatedDate)
            .IsRequired();

        // (kişi, yıl, tür) tekliği uygulamada kontrol edilir; NULL kişi (hane) index'te farklı sayılırdı
        builder.HasIndex(x => new { x.TenantId, x.Year });
        builder.HasIndex(x => x.OwnerPersonId);

        // Tenant navigation property yok; sadece FK
        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.OwnerPerson)
            .WithMany()
            .HasForeignKey(x => x.OwnerPersonId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
