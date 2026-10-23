using Abacasa.Domain.Common.Enums;
using System;
using System.Collections.Generic;

namespace Abacasa.Application.Features.DonationTargets.Dtos;

public class CreateDonationTargetDto
{
    /// Boşsa hane
    public int? OwnerPersonId { get; set; }
    public int Year { get; set; }
    public DonationKind Kind { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}

public class UpdateDonationTargetDto
{
    public int? OwnerPersonId { get; set; }
    public int Year { get; set; }
    public DonationKind Kind { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}

public class DonationTargetDto
{
    public int Id { get; set; }
    public int? OwnerPersonId { get; set; }
    public string? OwnerName { get; set; }       // Boşsa hane
    public int Year { get; set; }
    public DonationKind Kind { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedDate { get; set; }
}

// Hedef raporu. Emanetten dağıtılan bağışlar verilene ve gönüllüye girmez.
public class DonationTargetReportDto
{
    public int Year { get; set; }
    /// Tür, sonra ad (hane en sonda)
    public List<DonationTargetRowDto> Rows { get; set; } = new();
    /// Yalnızca hedefi olanlardan
    public List<DonationTargetKindTotalDto> TotalsByKind { get; set; } = new();
    /// O yıl hedefi olmayan (kişi, tür) çiftlerinin bağışları
    public List<DonationVoluntaryDto> Voluntary { get; set; } = new();
}

public class DonationTargetRowDto
{
    public int TargetId { get; set; }
    public int? OwnerPersonId { get; set; }
    public string? OwnerName { get; set; }
    public DonationKind Kind { get; set; }
    public decimal Target { get; set; }
    public decimal Given { get; set; }
    /// Aktif bağış planlarının max(today, 1 Ocak)–31 Aralık arasındaki ödenmemiş vadeleri
    public decimal Planned { get; set; }
    /// Given + Planned
    public decimal ExpectedYearEnd { get; set; }
    /// Target − Given; eksi olabilir (fazla ödendi)
    public decimal Remaining { get; set; }
    /// Target − ExpectedYearEnd; eksi olabilir
    public decimal RemainingAfterPlan { get; set; }
}

public class DonationTargetKindTotalDto
{
    public DonationKind Kind { get; set; }
    public decimal Target { get; set; }
    public decimal Given { get; set; }
    /// Yalnızca pozitif kalanların toplamı; bir kişinin fazlası başkasının kalanından düşmez
    public decimal RemainingTotal { get; set; }
    public decimal RemainingAfterPlanTotal { get; set; }
}

public class DonationVoluntaryDto
{
    /// Boşsa hane
    public int? PersonId { get; set; }
    public string? Name { get; set; }
    public DonationKind Kind { get; set; }
    public decimal Given { get; set; }
}
