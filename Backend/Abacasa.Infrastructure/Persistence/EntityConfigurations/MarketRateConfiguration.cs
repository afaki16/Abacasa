using Abacasa.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Abacasa.Infrastructure.Persistence.EntityConfigurations;

public class MarketRateConfiguration : IEntityTypeConfiguration<MarketRate>
{
    public void Configure(EntityTypeBuilder<MarketRate> builder)
    {
        builder.ToTable("MarketRates");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Currency)
            .IsRequired();

        builder.Property(x => x.Date)
            .IsRequired();

        builder.Property(x => x.Rate)
            .IsRequired()
            .HasPrecision(18, 4);

        builder.Property(x => x.Source)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(x => x.FetchedAt)
            .IsRequired();

        builder.Property(x => x.IsDeleted)
            .IsRequired();

        builder.Property(x => x.CreatedDate)
            .IsRequired();

        // Birim ve tarih başına tek canlı kayıt (yeniden çekmede güncellenir)
        builder.HasIndex(x => new { x.Currency, x.Date })
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");
    }
}
