using Abacasa.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Abacasa.Infrastructure.Persistence.EntityConfigurations;

public class DonationFundConfiguration : IEntityTypeConfiguration<DonationFund>
{
    public void Configure(EntityTypeBuilder<DonationFund> builder)
    {
        builder.ToTable("DonationFunds");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Kind)
            .IsRequired();

        builder.Property(x => x.Amount)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.Date)
            .IsRequired()
            .HasColumnType("date");

        builder.Property(x => x.Note)
            .HasMaxLength(200);

        builder.Property(x => x.IsDeleted)
            .IsRequired();

        builder.Property(x => x.CreatedDate)
            .IsRequired();

        builder.HasIndex(x => x.TenantId);
        builder.HasIndex(x => x.FromPersonId);

        // Tenant navigation property yok; sadece FK
        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.FromPerson)
            .WithMany()
            .HasForeignKey(x => x.FromPersonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Distributions)
            .WithOne(x => x.Fund)
            .HasForeignKey(x => x.FundId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Movements)
            .WithOne(x => x.Fund)
            .HasForeignKey(x => x.FundId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
