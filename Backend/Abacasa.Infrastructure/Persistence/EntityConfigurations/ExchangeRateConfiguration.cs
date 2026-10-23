using Abacasa.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Abacasa.Infrastructure.Persistence.EntityConfigurations;

public class ExchangeRateConfiguration : IEntityTypeConfiguration<ExchangeRate>
{
    public void Configure(EntityTypeBuilder<ExchangeRate> builder)
    {
        builder.ToTable("ExchangeRates");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Currency)
            .IsRequired();

        builder.Property(x => x.Rate)
            .IsRequired()
            .HasColumnType("decimal(18,4)");

        builder.Property(x => x.Date)
            .IsRequired()
            .HasColumnType("date");

        builder.Property(x => x.IsDeleted)
            .IsRequired();

        builder.Property(x => x.CreatedDate)
            .IsRequired();

        // Hanede bir para birimi için günde tek canlı kur; silinen (soft delete) kayıt engel olmaz
        builder.HasIndex(x => new { x.TenantId, x.Currency, x.Date })
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");

        // Tenant navigation property yok; sadece FK
        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
