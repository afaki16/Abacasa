using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Debts.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;
using System;

namespace Abacasa.Application.Features.Debts.Commands.UpdateDebt;

public class UpdateDebtCommand : IRequest<Result<DebtListDto>>
{
    public int Id { get; set; }
    public int CreditorPersonId { get; set; }
    public int? DebtorPersonId { get; set; }
    public Currency Currency { get; set; }
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Note { get; set; }
}
