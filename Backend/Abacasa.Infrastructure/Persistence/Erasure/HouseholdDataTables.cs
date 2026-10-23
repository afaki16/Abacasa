using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace Abacasa.Infrastructure.Persistence.Erasure;

// Hane verisi tablolarının TEK listesi: imha işi (DataRetentionRunner) ve hane silme (HouseholdEraser) bunu kullanır.
// Sıra çocuktan ebeveyne (FK grafiği). Yeni hane tablosu ya da FK eklenince burası güncellenmeli;
// Validate eksik ITenantScoped tabloyu ve ters sırayı yakalar ve işi durdurur.
public static class HouseholdDataTables
{
    public static readonly Type[] DeleteOrder =
    {
        typeof(VehicleObligation),   // → Vehicles, Expenses
        typeof(FundMovement),        // → DonationFunds
        typeof(MonthlyAmount),       // → LedgerItems
        typeof(DebtPayment),         // → Debts
        typeof(Expense),             // → Categories, PaymentMethods, RecurringPayments, People
        typeof(Donation),            // → DonationFunds, PaymentMethods, RecurringPayments, People
        typeof(RecurringPayment),    // → Categories, PaymentMethods, People
        typeof(Debt),                // → People
        typeof(DonationFund),        // → People
        typeof(DonationTarget),      // → People
        typeof(LedgerItem),          // → People
        typeof(Vehicle),             // → People
        typeof(ExchangeRate),
        typeof(Category),
        typeof(PaymentMethod),       // → People
        typeof(HouseholdInvitation), // → People, Users
        typeof(TenantMembership),    // → People, Users
        typeof(Person)
    };

    public sealed record ForeignKeyRef(string Table, string Column, bool Required);

    public sealed record TableInfo(Type ClrType, string Table, IReadOnlyList<ForeignKeyRef> ReferencedBy);

    private static IReadOnlyList<TableInfo>? _tables;
    private static readonly object Lock = new();

    // Tablo adları ve bu tabloyu gösteren FK'ler EF modelinden okunur (elle tutulan tek şey sıra)
    public static IReadOnlyList<TableInfo> Get(DbContext context)
    {
        if (_tables != null) return _tables;
        lock (Lock)
        {
            if (_tables != null) return _tables;
            Validate(context.Model);
            _tables = DeleteOrder.Select(type =>
            {
                var entity = context.Model.FindEntityType(type)!;
                var refs = context.Model.GetEntityTypes()
                    .SelectMany(e => e.GetForeignKeys())
                    .Where(fk => fk.PrincipalEntityType == entity)
                    .Select(fk => new ForeignKeyRef(
                        fk.DeclaringEntityType.GetTableName()!,
                        fk.Properties[0].GetColumnName(),
                        fk.IsRequired))
                    .ToList();
                return new TableInfo(type, entity.GetTableName()!, refs);
            }).ToList();
            return _tables;
        }
    }

    public static string Quote(string identifier) => "\"" + identifier.Replace("\"", "\"\"") + "\"";

    private static void Validate(IModel model)
    {
        // Her ITenantScoped tablo listede olmalı
        var missing = model.GetEntityTypes()
            .Where(e => typeof(ITenantScoped).IsAssignableFrom(e.ClrType) && !DeleteOrder.Contains(e.ClrType))
            .Select(e => e.ClrType.Name)
            .ToList();
        if (missing.Count > 0)
            throw new InvalidOperationException($"HouseholdDataTables.DeleteOrder eksik: {string.Join(", ", missing)}");

        // Listedeki tablolar arasındaki her FK'de çocuk ebeveynden önce gelmeli
        for (var i = 0; i < DeleteOrder.Length; i++)
        {
            var entity = model.FindEntityType(DeleteOrder[i])
                ?? throw new InvalidOperationException($"Modelde yok: {DeleteOrder[i].Name}");
            foreach (var fk in entity.GetForeignKeys())
            {
                var parentIndex = Array.IndexOf(DeleteOrder, fk.PrincipalEntityType.ClrType);
                if (parentIndex >= 0 && parentIndex < i)
                    throw new InvalidOperationException(
                        $"HouseholdDataTables.DeleteOrder sırası yanlış: {DeleteOrder[i].Name}, {fk.PrincipalEntityType.ClrType.Name}'den önce gelmeli");
            }
        }
    }
}
