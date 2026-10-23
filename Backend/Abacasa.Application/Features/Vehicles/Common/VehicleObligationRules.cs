using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.Vehicles.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Application.Features.Vehicles.Common;

// Araç işlemi kuralları; araç listesi, hatırlatmalar ve Özet aynı kodu kullanır
public static class VehicleObligationRules
{
    // Hatırlatma: geçerlilik sonu today + 30 gün içinde olanlar (gecikmişler ne kadar eski olursa olsun)
    public const int ReminderDaysAhead = 30;

    /// Araç ve tür için güncel kayıt: en büyük ValidUntil, eşitlikte en büyük Date, sonra en büyük Id
    public static IEnumerable<VehicleObligation> PickCurrent(IEnumerable<VehicleObligation> obligations) =>
        obligations
            .GroupBy(o => (o.VehicleId, o.Type))
            .Select(g => g
                .OrderByDescending(o => o.ValidUntil)
                .ThenByDescending(o => o.Date)
                .ThenByDescending(o => o.Id)
                .First());

    private static string TypeKey(VehicleObligationType type) => type switch
    {
        VehicleObligationType.TrafficInsurance => "vehicleObligationTypes.trafficInsurance",
        VehicleObligationType.Kasko => "vehicleObligationTypes.kasko",
        VehicleObligationType.Inspection => "vehicleObligationTypes.inspection",
        _ => "vehicleObligationTypes.mtv"
    };

    // İstek dilinde etiket (Özet'teki satır adı)
    public static string TypeLabel(VehicleObligationType type, IJsonStringLocalizer localizer) => localizer[TypeKey(type)];

    // Saklanan veride (harcama açıklaması) etiket her zaman Türkçe
    public static string TypeLabelTr(VehicleObligationType type, IJsonStringLocalizer localizer) => localizer.GetString(TypeKey(type), "tr");

    /// Aktif araçların güncel kayıtlarından geçerlilik sonu today + 30 içinde ya da geçmiş olanlar, geçerlilik sonuna göre.
    /// Araçlar sayfası ve Özet'teki yaklaşan ödemeler aynı kodu kullanır.
    public static async Task<List<VehicleReminderDto>> GetRemindersAsync(IUnitOfWork unitOfWork, DateOnly today)
    {
        var obligations = await unitOfWork.VehicleObligations.GetForActiveVehiclesReadOnlyAsync();
        var limit = today.AddDays(ReminderDaysAhead);

        return PickCurrent(obligations)
            .Where(o => o.ValidUntil <= limit)
            .Select(o => new VehicleReminderDto
            {
                VehicleId = o.VehicleId,
                VehicleName = o.Vehicle.Name,
                Plate = o.Vehicle.Plate,
                Type = o.Type,
                ValidUntil = o.ValidUntil,
                LastAmount = o.Amount,
                DaysLeft = o.ValidUntil.DayNumber - today.DayNumber,
                IsOverdue = o.ValidUntil < today
            })
            .OrderBy(r => r.ValidUntil)
            .ThenBy(r => r.VehicleName)
            .ThenBy(r => r.Type)
            .ToList();
    }

    /// "Harcama olarak da kaydet": tutar, kategori ve aktif ödeme aracı gerekir. Harcama işlemin tarih ve tutarıyla,
    /// aracın sahibiyle ve "{Araç adı} · {Tür etiketi}" açıklamasıyla oluşur. Hata yoksa Error null.
    public static async Task<(Expense? Expense, string? Error)> BuildExpenseAsync(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer,
        Vehicle vehicle, VehicleObligationType type, DateOnly date, decimal? amount, int? categoryId, int? paymentMethodId)
    {
        if (!amount.HasValue || !categoryId.HasValue || !paymentMethodId.HasValue)
            return (null, localizer["vehicles.expenseFieldsRequired"]);

        // Referanslar repository ile yüklenir (tenant filtresi uygulanır); başka hanenin kaydı bulunamaz
        var category = await unitOfWork.Categories.GetByIdAsync(categoryId.Value);
        if (category == null)
            return (null, localizer["expenses.categoryNotFound"]);

        var paymentMethod = await unitOfWork.PaymentMethods.GetByIdAsync(paymentMethodId.Value);
        if (paymentMethod == null)
            return (null, localizer["expenses.paymentMethodNotFound"]);

        if (!paymentMethod.IsActive)
            return (null, localizer["expenses.paymentMethodInactive"]);

        // TenantId ApplicationDbContext tarafından atanır
        return (new Expense
        {
            Date = date,
            Amount = amount.Value,
            Description = $"{vehicle.Name} · {TypeLabelTr(type, localizer)}",
            CategoryId = category.Id,
            Category = category,
            PaymentMethodId = paymentMethod.Id,
            PaymentMethod = paymentMethod,
            OwnerPersonId = vehicle.OwnerPersonId
        }, null);
    }
}
