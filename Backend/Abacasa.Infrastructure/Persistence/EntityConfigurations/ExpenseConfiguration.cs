using Abacasa.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Abacasa.Infrastructure.Persistence.EntityConfigurations;

public class ExpenseConfiguration : IEntityTypeConfiguration<Expense>
{
    public void Configure(EntityTypeBuilder<Expense> builder)
    {
        builder.ToTable("Expenses");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Date)
            .IsRequired();

        builder.Property(x => x.Amount)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.Description)
            .HasMaxLength(200);

        builder.Property(x => x.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(x => x.CreatedDate)
            .IsRequired();

        builder.HasIndex(x => new { x.TenantId, x.Date });
        builder.HasIndex(x => x.CategoryId);
        builder.HasIndex(x => x.PaymentMethodId);

        // Tenant navigation property yok; sadece FK
        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.PaymentMethod)
            .WithMany()
            .HasForeignKey(x => x.PaymentMethodId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.OwnerPerson)
            .WithMany()
            .HasForeignKey(x => x.OwnerPersonId)
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
