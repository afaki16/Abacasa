using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Debts.Commands.CreateDebtPayment;

// Borcun para birimine bağlı kur kuralı handler'da (DebtPaymentRules): borç bulunamazsa önce 404 dönmeli
public class CreateDebtPaymentCommandValidator : AbstractValidator<CreateDebtPaymentCommand>
{
    public CreateDebtPaymentCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.amount"], 0]);

        RuleFor(x => x.Date)
            .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.date"]]);

        RuleFor(x => x.ExchangeRate)
            .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.exchangeRate"], 0])
            .When(x => x.ExchangeRate.HasValue);

        RuleFor(x => x.Note)
            .MaximumLength(200).WithMessage(localizer["validation.maxLength", localizer["validation.fields.note"], 200])
            .When(x => !string.IsNullOrEmpty(x.Note));
    }
}
