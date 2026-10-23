using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Application.Features.RecurringPayments.Common;

// Create ve Update komutlarının ortak plan alanları; türe göre kurallar tek validator'da tanımlanır
public interface IRecurringPaymentFields
{
    string Name { get; }
    RecurringPaymentKind Kind { get; }
    decimal? ExpectedAmount { get; }
    int? DueDay { get; }
    DateOnly? StartMonth { get; }
    int PaymentMethodId { get; }
    int? CategoryId { get; }
    int? OwnerPersonId { get; }
    string? Recipient { get; }
    DonationKind? DonationKind { get; }
    decimal? TotalAmount { get; }
    int? InstallmentCount { get; }
    DateOnly? FirstDueDate { get; }
}
