using Abacasa.Domain.Common.Enums;
using System;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Vehicles.Dtos;

public class CreateVehicleDto
{
    public string Name { get; set; }
    public string Plate { get; set; }
    public int? OwnerPersonId { get; set; }
    public string? Note { get; set; }
}

public class UpdateVehicleDto
{
    public string Name { get; set; }
    public string Plate { get; set; }
    public int? OwnerPersonId { get; set; }
    public bool IsActive { get; set; }
    public string? Note { get; set; }
}

public class VehicleDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Plate { get; set; }
    public int? OwnerPersonId { get; set; }
    public string? OwnerName { get; set; }       // Boşsa araç hanenindir
    public bool IsActive { get; set; }
    public string? Note { get; set; }
    /// Her tür için güncel kayıt (handler'da doldurulur)
    public List<VehicleCurrentDto> Current { get; set; } = new();
    public DateTime CreatedDate { get; set; }
}

public class VehicleCurrentDto
{
    public VehicleObligationType Type { get; set; }
    public DateOnly ValidUntil { get; set; }
    public decimal? LastAmount { get; set; }
}

public class VehicleObligationDto
{
    public int Id { get; set; }
    public int VehicleId { get; set; }
    public VehicleObligationType Type { get; set; }
    public DateOnly Date { get; set; }
    public DateOnly ValidUntil { get; set; }
    public decimal? Amount { get; set; }
    public string? Note { get; set; }
    public int? ExpenseId { get; set; }
    /// Bağlı harcama canlı mı (handler'da doldurulur)
    public bool HasExpense { get; set; }
    public DateTime CreatedDate { get; set; }
}

// İşlem ekleme ve güncelleme için ortak gövde
public class SaveVehicleObligationDto
{
    public VehicleObligationType Type { get; set; }
    public DateOnly Date { get; set; }
    public DateOnly ValidUntil { get; set; }
    public decimal? Amount { get; set; }
    public string? Note { get; set; }
    /// "Harcama olarak da kaydet"; canlı bağlı harcama varsa yok sayılır
    public bool CreateExpense { get; set; }
    public int? CategoryId { get; set; }
    public int? PaymentMethodId { get; set; }
}

// Hatırlatma: aktif aracın güncel kaydı, geçerlilik sonu today + 30 gün içinde ya da geçmiş
public class VehicleReminderDto
{
    public int VehicleId { get; set; }
    public string VehicleName { get; set; }
    public string Plate { get; set; }
    public VehicleObligationType Type { get; set; }
    public DateOnly ValidUntil { get; set; }
    public decimal? LastAmount { get; set; }
    /// Eksi ise gecikmiş gün sayısı
    public int DaysLeft { get; set; }
    public bool IsOverdue { get; set; }
}
