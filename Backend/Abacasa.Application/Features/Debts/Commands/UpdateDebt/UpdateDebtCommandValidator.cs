using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Domain.Common.Enums;

namespace Abacasa.Application.Features.Debts.Commands.UpdateDebt;

public class UpdateDebtCommandValidator : AbstractValidator<UpdateDebtCommand>
{
    public UpdateDebtCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Id)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.debtId"]]);

        RuleFor(x => x.CreditorPersonId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.creditor"]]);

        RuleFor(x => x.DebtorPersonId)
            .GreaterThan(0).WithMessage(localizer["validation.required", localizer["validation.fields.debtor"]])
            .When(x => x.DebtorPersonId.HasValue);

        RuleFor(x => x.Currency)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.currency"]]);

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.amount"], 0]);

        // Çeyrek altın adettir
        RuleFor(x => x.Amount)
            .Must(a => a == decimal.Truncate(a)).WithMessage(localizer["debts.quarterGoldWhole"])
            .When(x => x.Currency == Currency.QuarterGold);

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.date"]]);

        RuleFor(x => x.Note)
            .MaximumLength(200).WithMessage(localizer["validation.maxLength", localizer["validation.fields.note"], 200])
            .When(x => !string.IsNullOrEmpty(x.Note));
    }
}
