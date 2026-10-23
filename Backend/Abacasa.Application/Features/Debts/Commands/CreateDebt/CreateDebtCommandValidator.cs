using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.Debts.Commands.CreateDebt;

public class CreateDebtCommandValidator : AbstractValidator<CreateDebtCommand>
{
    public CreateDebtCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.CreditorPersonId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.creditor"]]);

        RuleFor(x => x.DebtorPersonId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.debtor"]])
            .When(x => x.DebtorPersonId.HasValue);

        RuleFor(x => x.Currency)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.currency"]]);

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.amount"], 0]);

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.date"]]);

        RuleFor(x => x.Note)
            .MaximumLength(200).WithMessage(localizer["validation.maxLength", localizer["validation.fields.note"], 200])
            .When(x => !string.IsNullOrEmpty(x.Note));
    }
}
