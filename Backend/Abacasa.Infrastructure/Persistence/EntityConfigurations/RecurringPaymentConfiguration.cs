using Abacasa.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Abacasa.Infrastructure.Persistence.EntityConfigurations;

public class RecurringPaymentConfiguration : IEntityTypeConfiguration<RecurringPayment>
{
    public void Configure(EntityTypeBuilder<RecurringPayment> builder)
    {
        builder.ToTable("RecurringPayments");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Kind)
            .IsRequired();

        builder.Property(x => x.ExpectedAmount)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.DueDay)
            .IsRequired();

        builder.Property(x => x.StartMonth)
            .IsRequired()
            .HasColumnType("date");

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.Property(x => x.Recipient)
            .HasMaxLength(100);

        builder.Property(x => x.TotalAmount)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.FirstDueDate)
            .HasColumnType("date");

        builder.Property(x => x.IsDeleted)
            .IsRequired();

        builder.Property(x => x.CreatedDate)
            .IsRequired();

        builder.HasIndex(x => new { x.TenantId, x.Name });
        builder.HasIndex(x => x.PaymentMethodId);
        builder.HasIndex(x => x.CategoryId);
        builder.HasIndex(x => x.OwnerPersonId);

        // Tenant navigation property yok; sadece FK
        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.PaymentMethod)
            .WithMany()
            .HasForeignKey(x => x.PaymentMethodId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.OwnerPerson)
            .WithMany()
            .HasForeignKey(x => x.OwnerPersonId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
