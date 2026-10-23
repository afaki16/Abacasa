using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Domain.Common.Enums;

namespace Abacasa.Application.Features.RecurringPayments.Common;

// Türe göre alan kuralları. Taksitte DueDay ve StartMonth istekte gelse bile yok sayılır (FirstDueDate'ten türetilir).
public abstract class RecurringPaymentFieldsValidator<T> : AbstractValidator<T> where T : IRecurringPaymentFields
{
    protected RecurringPaymentFieldsValidator(IJsonStringLocalizer localizer)
    {
        string NotAllowed(string field) => localizer["recurringPayments.fieldNotAllowed", localizer[$"validation.fields.{field}"]];

        RuleFor(x => x.Name)
            .Must(n => !string.IsNullOrWhiteSpace(n)).WithMessage(localizer["validation.required", localizer["validation.fields.recurringPaymentName"]]);

        RuleFor(x => x.Name)
            .Must(n => n.Trim().Length <= 100).WithMessage(localizer["validation.maxLength", localizer["validation.fields.recurringPaymentName"], 100])
            .When(x => x.Name != null);

        RuleFor(x => x.Kind)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.recurringPaymentKind"]]);

        RuleFor(x => x.PaymentMethodId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.paymentMethod"]]);

        RuleFor(x => x.OwnerPersonId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.personId"]])
            .When(x => x.OwnerPersonId.HasValue);

        RuleFor(x => x.ExpectedAmount)
            .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.expectedAmount"], 0])
            .When(x => x.ExpectedAmount.HasValue);

        // Abonelik, fatura ve bağış: vade günü ve başlangıç ayı
        When(x => x.Kind is RecurringPaymentKind.Subscription or RecurringPaymentKind.Bill or RecurringPaymentKind.Donation, () =>
        {
            RuleFor(x => x.DueDay)
                .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.dueDay"]]);

            RuleFor(x => x.DueDay)
                .InclusiveBetween(1, 31).WithMessage(localizer["validation.range", localizer["validation.fields.dueDay"], 1, 31])
                .When(x => x.DueDay.HasValue);

            RuleFor(x => x.StartMonth)
                .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.startMonth"]]);

            RuleFor(x => x.StartMonth)
                .Must(m => m!.Value.Day == 1).WithMessage(localizer["recurringPayments.startMonthFirstDay"])
                .When(x => x.StartMonth.HasValue);
        });

        // Abonelik ve fatura
        When(x => x.Kind is RecurringPaymentKind.Subscription or RecurringPaymentKind.Bill, () =>
        {
            RuleFor(x => x.CategoryId)
                .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.category"]]);

            RuleFor(x => x.Recipient).Must(string.IsNullOrEmpty).WithMessage(NotAllowed("recipient"));
            RuleFor(x => x.DonationKind).Null().WithMessage(NotAllowed("donationKind"));
            RuleFor(x => x.TotalAmount).Null().WithMessage(NotAllowed("totalAmount"));
            RuleFor(x => x.InstallmentCount).Null().WithMessage(NotAllowed("installmentCount"));
            RuleFor(x => x.FirstDueDate).Null().WithMessage(NotAllowed("firstDueDate"));
        });

        // Taksit
        When(x => x.Kind == RecurringPaymentKind.Installment, () =>
        {
            RuleFor(x => x.CategoryId)
                .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.category"]]);

            RuleFor(x => x.TotalAmount)
                .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.totalAmount"]]);

            RuleFor(x => x.TotalAmount)
                .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.totalAmount"], 0])
                .When(x => x.TotalAmount.HasValue);

            RuleFor(x => x.InstallmentCount)
                .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.installmentCount"]]);

            RuleFor(x => x.InstallmentCount)
                .InclusiveBetween(2, 120).WithMessage(localizer["validation.range", localizer["validation.fields.installmentCount"], 2, 120])
                .When(x => x.InstallmentCount.HasValue);

            RuleFor(x => x.FirstDueDate)
                .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.firstDueDate"]]);

            RuleFor(x => x.Recipient).Must(string.IsNullOrEmpty).WithMessage(NotAllowed("recipient"));
            RuleFor(x => x.DonationKind).Null().WithMessage(NotAllowed("donationKind"));
        });

        // Bağış
        When(x => x.Kind == RecurringPaymentKind.Donation, () =>
        {
            RuleFor(x => x.Recipient)
                .Must(r => !string.IsNullOrWhiteSpace(r)).WithMessage(localizer["validation.required", localizer["validation.fields.recipient"]]);

            RuleFor(x => x.Recipient)
                .Must(r => r!.Trim().Length <= 100).WithMessage(localizer["validation.maxLength", localizer["validation.fields.recipient"], 100])
                .When(x => x.Recipient != null);

            RuleFor(x => x.DonationKind)
                .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.donationKind"]]);

            RuleFor(x => x.DonationKind)
                .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.donationKind"]])
                .When(x => x.DonationKind.HasValue);

            RuleFor(x => x.CategoryId).Null().WithMessage(NotAllowed("category"));
            RuleFor(x => x.TotalAmount).Null().WithMessage(NotAllowed("totalAmount"));
            RuleFor(x => x.InstallmentCount).Null().WithMessage(NotAllowed("installmentCount"));
            RuleFor(x => x.FirstDueDate).Null().WithMessage(NotAllowed("firstDueDate"));
        });
    }
}
