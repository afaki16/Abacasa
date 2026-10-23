using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.RecurringPayments.Dtos;
using MediatR;
using System;

namespace Abacasa.Application.Features.RecurringPayments.Commands.PayRecurringPayment;

public class PayRecurringPaymentCommand : IRequest<Result<RecurringPaymentPayResultDto>>
{
    public int Id { get; set; }
    public DateOnly? Month { get; set; }
    public decimal? Amount { get; set; }
    public DateOnly? Date { get; set; }
}
