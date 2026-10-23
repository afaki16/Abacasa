using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Debts.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;
using System;

namespace Abacasa.Application.Features.Debts.Commands.CreateDebt;

public class CreateDebtCommand : IRequest<Result<DebtListDto>>
{
    public int CreditorPersonId { get; set; }
    public int? DebtorPersonId { get; set; }
    public Currency Currency { get; set; }
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Note { get; set; }
}
