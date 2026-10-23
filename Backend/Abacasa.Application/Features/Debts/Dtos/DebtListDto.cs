using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Application.Features.Debts.Dtos;

public class DebtListDto
{
    public int Id { get; set; }
    public int CreditorPersonId { get; set; }
    public string CreditorName { get; set; }
    public int? DebtorPersonId { get; set; }
    public string? DebtorName { get; set; }      // Boşsa borçlu hanedir
    public Currency Currency { get; set; }
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Note { get; set; }

    // Hesaplanan alanlar (handler'da doldurulur, saklanmaz)
    public decimal PaidAmount { get; set; }      // Borcun para biriminde
    public decimal Remaining { get; set; }
    public bool IsClosed { get; set; }
    public decimal PaidInTry { get; set; }
    public decimal? RemainingInTry { get; set; } // USD'de kur yoksa null
    public int PaymentCount { get; set; }
    public bool HasPayments { get; set; }

    public DateTime CreatedDate { get; set; }
}
