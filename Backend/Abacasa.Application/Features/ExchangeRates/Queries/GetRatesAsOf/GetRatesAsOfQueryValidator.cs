using Abacasa.Application.Common.Localization;
using FluentValidation;
using System;

namespace Abacasa.Application.Features.ExchangeRates.Queries.GetRatesAsOf;

public class GetRatesAsOfQueryValidator : AbstractValidator<GetRatesAsOfQuery>
{
    // TCMB arşivi 1996'dan başlar; uygulamanın kayıt alt sınırı 2000
    public static readonly DateOnly MinDate = new(2000, 1, 1);

    public GetRatesAsOfQueryValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Today)
            .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.today"]]);

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage(localizer["validation.required", localizer["validation.fields.date"]])
            .GreaterThanOrEqualTo(MinDate).WithMessage(localizer["exchangeRates.dateOutOfRange"])
            .LessThanOrEqualTo(x => x.Today).WithMessage(localizer["exchangeRates.dateOutOfRange"]);
    }
}
