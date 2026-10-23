using Abacasa.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Abacasa.Infrastructure.Persistence.EntityConfigurations;

public class MonthlyAmountConfiguration : IEntityTypeConfiguration<MonthlyAmount>
{
    public void Configure(EntityTypeBuilder<MonthlyAmount> builder)
    {
        builder.ToTable("MonthlyAmounts");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Year)
            .IsRequired();

        builder.Property(x => x.Month)
            .IsRequired();

        builder.Property(x => x.Amount)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.IsDeleted)
            .IsRequired();

        builder.Property(x => x.CreatedDate)
            .IsRequired();

        // Bir kalemin bir ayı tek canlı kayıttır; silinen (soft delete) hücre yeniden yazmaya engel olmaz
        builder.HasIndex(x => new { x.LedgerItemId, x.Year, x.Month })
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");

        builder.HasIndex(x => new { x.TenantId, x.Year });

        // Tenant navigation property yok; sadece FK
        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.LedgerItem)
            .WithMany()
            .HasForeignKey(x => x.LedgerItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
