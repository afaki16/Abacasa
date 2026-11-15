using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Application.Features.Donations.Dtos;

public class UpdateDonationDto
{
    public DateOnly Date { get; set; }
    public decimal Amount { get; set; }
    /// TRY dışında: ForeignAmount (birim cinsinden; çeyrekte adet) ve ExchangeRate zorunlu, Amount sunucuda hesaplanır
    public Currency Currency { get; set; } = Currency.TRY;
    public decimal? ForeignAmount { get; set; }
    public decimal? ExchangeRate { get; set; }
    public DonationKind Kind { get; set; }
    public string Recipient { get; set; }
    public int? GiverPersonId { get; set; }
    public int PaymentMethodId { get; set; }
    public string? Note { get; set; }
    /// Emanetten dağıtım; doluysa bağış hiçbir toplama ve hedefe girmez
    public int? FundId { get; set; }
}
