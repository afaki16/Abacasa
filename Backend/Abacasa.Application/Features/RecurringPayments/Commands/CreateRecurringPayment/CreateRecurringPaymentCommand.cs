using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.RecurringPayments.Common;
using Abacasa.Application.Features.RecurringPayments.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;
using System;

namespace Abacasa.Application.Features.RecurringPayments.Commands.CreateRecurringPayment;

public class CreateRecurringPaymentCommand : IRequest<Result<RecurringPaymentListDto>>, IRecurringPaymentFields
{
    public string Name { get; set; }
    public RecurringPaymentKind Kind { get; set; }
    public decimal? ExpectedAmount { get; set; }
    public int? DueDay { get; set; }
    public DateOnly? StartMonth { get; set; }
    public int PaymentMethodId { get; set; }
    public int? CategoryId { get; set; }
    public int? OwnerPersonId { get; set; }
    public string? Recipient { get; set; }
    public DonationKind? DonationKind { get; set; }
    public decimal? TotalAmount { get; set; }
    public int? InstallmentCount { get; set; }
    public DateOnly? FirstDueDate { get; set; }
}
