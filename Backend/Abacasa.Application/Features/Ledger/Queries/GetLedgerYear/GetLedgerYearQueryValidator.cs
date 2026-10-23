using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.Ledger.Common;

namespace Abacasa.Application.Features.Ledger.Queries.GetLedgerYear;

public class GetLedgerYearQueryValidator : AbstractValidator<GetLedgerYearQuery>
{
    public GetLedgerYearQueryValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Year)
            .InclusiveBetween(LedgerRules.MinYear, LedgerRules.MaxYear)
            .WithMessage(localizer["validation.range", localizer["validation.fields.year"], LedgerRules.MinYear, LedgerRules.MaxYear]);
    }
}
