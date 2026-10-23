using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Domain.Common.Enums;

namespace Abacasa.Application.Features.ExchangeRates.Commands.SaveExchangeRate;

public class SaveExchangeRateCommandValidator : AbstractValidator<SaveExchangeRateCommand>
{
    public SaveExchangeRateCommandValidator(IJsonStringLocalizer localizer)
    {
        // Şimdilik yalnızca USD kuru girilir; TL'nin kuru olmaz
        RuleFor(x => x.Currency)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.currency"]])
            .Equal(Currency.USD).WithMessage(localizer["exchangeRates.onlyUsd"]);

        RuleFor(x => x.Rate)
            .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.exchangeRate"], 0]);

        RuleFor(x => x.Date)
            .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.date"]]);
    }
}
