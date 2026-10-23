using Abacasa.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Abacasa.Infrastructure.Persistence.EntityConfigurations;

public class DonationConfiguration : IEntityTypeConfiguration<Donation>
{
    public void Configure(EntityTypeBuilder<Donation> builder)
    {
        builder.ToTable("Donations");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Date)
            .IsRequired()
            .HasColumnType("date");

        builder.Property(x => x.Amount)
            .IsRequired()
            .HasColumnType("numeric(18,2)");

        builder.Property(x => x.Kind)
            .IsRequired();

        builder.Property(x => x.Recipient)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Note)
            .HasMaxLength(200);

        builder.Property(x => x.IsDeleted)
            .IsRequired();

        builder.Property(x => x.CreatedDate)
            .IsRequired();

        builder.HasIndex(x => new { x.TenantId, x.Date });
        builder.HasIndex(x => x.PaymentMethodId);
        builder.HasIndex(x => x.GiverPersonId);
        builder.HasIndex(x => x.FundId);

        // Tenant navigation property yok; sadece FK
        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.PaymentMethod)
            .WithMany()
            .HasForeignKey(x => x.PaymentMethodId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.GiverPerson)
            .WithMany()
            .HasForeignKey(x => x.GiverPersonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(x => x.RecurringPaymentMonth)
            .HasColumnType("date");

        builder.HasOne(x => x.RecurringPayment)
            .WithMany()
            .HasForeignKey(x => x.RecurringPaymentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Bir planın bir ayı tek canlı kayıtla ödenir; geri alınan (soft delete) kayıt yeniden ödemeye engel olmaz
        builder.HasIndex(x => new { x.RecurringPaymentId, x.RecurringPaymentMonth })
            .IsUnique()
            .HasFilter("\"RecurringPaymentId\" IS NOT NULL AND \"IsDeleted\" = false");
    }
}
