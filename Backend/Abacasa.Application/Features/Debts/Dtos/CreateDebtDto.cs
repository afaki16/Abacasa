using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Application.Features.Debts.Dtos;

public class CreateDebtDto
{
    public int CreditorPersonId { get; set; }
    public int? DebtorPersonId { get; set; }
    public Currency Currency { get; set; }
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Note { get; set; }
}
