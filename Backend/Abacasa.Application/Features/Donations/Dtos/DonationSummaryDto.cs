using Abacasa.Domain.Common.Enums;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Donations.Dtos;

public class DonationSummaryDto
{
    public decimal Total { get; set; }
    public int Count { get; set; }
    /// Emanetten dağıtılan bağışlar; yukarıdaki toplamlara girmez
    public decimal FundDistributedTotal { get; set; }
    public int FundDistributedCount { get; set; }
    public List<DonationKindTotalDto> ByKind { get; set; } = new();
    public List<DonationGiverTotalDto> ByGiver { get; set; } = new();
}

public class DonationKindTotalDto
{
    public DonationKind Kind { get; set; }
    public decimal Total { get; set; }
    public int Count { get; set; }
}

public class DonationGiverTotalDto
{
    /// Boşsa bağışı hane vermiştir
    public int? PersonId { get; set; }
    public string? PersonName { get; set; }
    public decimal Total { get; set; }
    public int Count { get; set; }
}
