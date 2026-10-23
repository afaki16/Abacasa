using Abacasa.Application.Features.Debts.Dtos;
using Abacasa.Domain.Common.Enums;
using System;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Dashboard.Dtos;

// Dönem özeti. Gerçekleşen = dönemdeki harcama + bağış kayıtları; bekleyen = dönemde vadesi olan ödenmemiş sabit ödemeler.
// Ödenmiş vade zaten harcama/bağış kaydı olduğu için bekleyene girmez. Yemek kartı ve borç hareketleri dönem toplamına girmez.
public class DashboardDto
{
    /// Yemek kartı hariç gerçekleşen
    public DashboardSpentDto Spent { get; set; } = new();
    /// Yemek kartı hariç bekleyen vadeler
    public DashboardPendingDto Pending { get; set; } = new();
    /// Spent.Total + Pending.Total
    public decimal OutflowTotal { get; set; }
    public DashboardMealCardDto MealCard { get; set; } = new();
    /// Dönemdeki sabit ödeme vadeleri, yemek kartı hariç
    public DashboardRecurringDto Recurring { get; set; } = new();
    /// Yemek kartı dahil, Total'e göre azalan
    public List<DashboardPaymentMethodDto> ByPaymentMethod { get; set; } = new();
    /// Yemek kartı hariç, Total'e göre azalan; satırların toplamı OutflowTotal
    public List<DashboardPersonDto> ByPerson { get; set; } = new();
    /// /api/debts/summary ile aynı (hanenin tamamı)
    public DebtSummaryDto Debts { get; set; }
    /// Ödenmemiş vadeler, yemek kartı dahil; vade [today − 60, today + 30] içinde
    public List<DashboardUpcomingDto> Upcoming { get; set; } = new();
}

public class DashboardSpentDto
{
    public decimal Expenses { get; set; }
    public decimal Donations { get; set; }
    public decimal Total { get; set; }
}

public class DashboardPendingDto
{
    /// Tutarı belli olmayan vadeler toplama girmez
    public decimal Total { get; set; }
    public int Count { get; set; }
    public int UnknownCount { get; set; }
}

public class DashboardMealCardDto
{
    public decimal Spent { get; set; }
    public decimal Pending { get; set; }
    public decimal Total { get; set; }
}

public class DashboardRecurringDto
{
    public decimal PaidTotal { get; set; }
    public decimal PendingTotal { get; set; }
    public decimal Total { get; set; }
    public int UnknownCount { get; set; }
}

public class DashboardPaymentMethodDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public PaymentMethodType Type { get; set; }
    public decimal Spent { get; set; }
    public decimal Pending { get; set; }
    public decimal Total { get; set; }
}

public class DashboardPersonDto
{
    /// Boşsa hane
    public int? PersonId { get; set; }
    public string? Name { get; set; }
    public decimal Spent { get; set; }
    public decimal Pending { get; set; }
    public decimal Total { get; set; }
}

public static class DashboardUpcomingSource
{
    public const string Recurring = "recurring";
    public const string Vehicle = "vehicle";
}

public class DashboardUpcomingDto
{
    /// recurring | vehicle
    public string Source { get; set; }
    /// Araç satırında boş
    public int? RecurringPaymentId { get; set; }
    /// Yalnızca araç satırında
    public int? VehicleId { get; set; }
    /// Araç satırında "{Araç adı} · {Tür etiketi}"
    public string Name { get; set; }
    /// Yalnızca sabit ödeme satırında
    public RecurringPaymentKind? Kind { get; set; }
    /// Yalnızca araç satırında işlem türü
    public VehicleObligationType? ObligationType { get; set; }
    /// Araç satırında geçerlilik sonu
    public DateOnly DueDate { get; set; }
    /// null: tutar belli değil; araç satırında son tutar
    public decimal? Amount { get; set; }
    public bool IsEstimated { get; set; }
    /// Araç satırında boş
    public string? PaymentMethodName { get; set; }
    public bool IsOverdue { get; set; }
}
