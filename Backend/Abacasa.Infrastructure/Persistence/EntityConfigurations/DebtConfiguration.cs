using Abacasa.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Abacasa.Infrastructure.Persistence.EntityConfigurations;

public class DebtConfiguration : IEntityTypeConfiguration<Debt>
{
    public void Configure(EntityTypeBuilder<Debt> builder)
    {
        builder.ToTable("Debts");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Currency)
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

        builder.HasIndex(x => new { x.TenantId, x.Date });
        builder.HasIndex(x => x.CreditorPersonId);
        builder.HasIndex(x => x.DebtorPersonId);

        // Tenant navigation property yok; sadece FK
        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.CreditorPerson)
            .WithMany()
            .HasForeignKey(x => x.CreditorPersonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.DebtorPerson)
            .WithMany()
            .HasForeignKey(x => x.DebtorPersonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Payments)
            .WithOne(x => x.Debt)
            .HasForeignKey(x => x.DebtId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
