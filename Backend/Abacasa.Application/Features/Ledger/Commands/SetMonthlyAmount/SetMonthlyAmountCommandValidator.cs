using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.Ledger.Common;

namespace Abacasa.Application.Features.Ledger.Commands.SetMonthlyAmount;

public class SetMonthlyAmountCommandValidator : AbstractValidator<SetMonthlyAmountCommand>
{
    public SetMonthlyAmountCommandValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Year)
            .InclusiveBetween(LedgerRules.MinYear, LedgerRules.MaxYear)
            .WithMessage(localizer["validation.range", localizer["validation.fields.year"], LedgerRules.MinYear, LedgerRules.MaxYear]);

        RuleFor(x => x.Month)
            .InclusiveBetween(1, 12)
            .WithMessage(localizer["validation.range", localizer["validation.fields.month"], 1, 12]);

        RuleFor(x => x.Amount)
            .GreaterThanOrEqualTo(0).WithMessage(localizer["validation.minValue", localizer["validation.fields.amount"], 0])
            .When(x => x.Amount.HasValue);
    }
}
