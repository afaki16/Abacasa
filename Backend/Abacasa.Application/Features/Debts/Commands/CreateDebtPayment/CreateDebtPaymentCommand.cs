using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Debts.Dtos;
using MediatR;
using System;

namespace Abacasa.Application.Features.Debts.Commands.CreateDebtPayment;

public class CreateDebtPaymentCommand : IRequest<Result<DebtPaymentDto>>
{
    public int DebtId { get; set; }
    public DateOnly? Date { get; set; }
    public decimal Amount { get; set; }
    public decimal? ExchangeRate { get; set; }
    public string? Note { get; set; }
}
