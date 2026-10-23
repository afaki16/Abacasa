using FluentValidation;
using Abacasa.Application.Common.Localization;

namespace Abacasa.Application.Features.ExchangeRates.Queries.GetExchangeRates;

public class GetExchangeRatesQueryValidator : AbstractValidator<GetExchangeRatesQuery>
{
    public GetExchangeRatesQueryValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Currency)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.currency"]])
            .When(x => x.Currency.HasValue);
    }
}
