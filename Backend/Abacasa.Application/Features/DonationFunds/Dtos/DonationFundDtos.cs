using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Application.Features.DonationFunds.Dtos;

public class CreateDonationFundDto
{
    public int FromPersonId { get; set; }
    public DonationKind Kind { get; set; }
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Note { get; set; }
}

public class UpdateDonationFundDto
{
    public int FromPersonId { get; set; }
    public DonationKind Kind { get; set; }
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Note { get; set; }
}

public class DonationFundDto
{
    public int Id { get; set; }
    public int FromPersonId { get; set; }
    public string FromPersonName { get; set; }
    public DonationKind Kind { get; set; }
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Note { get; set; }

    // Hesaplanan alanlar (FundBalance.Fill ile doldurulur, saklanmaz)
    public decimal Distributed { get; set; }
    public decimal InUse { get; set; }
    /// Dağıtılacak kalan
    public decimal Remaining { get; set; }
    public decimal OnHand { get; set; }
    /// Remaining == 0
    public bool IsClosed { get; set; }
    public int DistributionCount { get; set; }
    public int MovementCount { get; set; }

    public DateTime CreatedDate { get; set; }
}

public class FundMovementDto
{
    public int Id { get; set; }
    public int FundId { get; set; }
    public FundMovementType Type { get; set; }
    public DateOnly Date { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedDate { get; set; }
}

// Hareket ekleme ve güncelleme için ortak gövde
public class SaveFundMovementDto
{
    public FundMovementType Type { get; set; }
    public DateOnly? Date { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}
