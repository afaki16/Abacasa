using Abacasa.Application.Common.Localization;
using Abacasa.Domain.Common.Enums;
using FluentValidation;
using System;

namespace Abacasa.Application.Features.Donations.Common;

// Dövizli bağış: döviz tutarı ve bağış günündeki kur (elle) saklanır; Amount her zaman TL karşılığıdır
// (tutar × kur, 2 haneye yuvarlanır). Böylece bütün toplamlar, hedefler ve yıllık tablo TL üzerinden çalışır.
// Emanetten dağıtım yalnızca TL'dir.
public static class DonationCurrency
{
    public static decimal ToTry(decimal foreignAmount, decimal rate) =>
        Math.Round(foreignAmount * rate, 2, MidpointRounding.AwayFromZero);

    // TL bağışta istekteki tutar; dövizde tutar × kur
    public static decimal AmountInTry(Currency currency, decimal amount, decimal? foreignAmount, decimal? exchangeRate) =>
        currency == Currency.TRY ? amount : ToTry(foreignAmount!.Value, exchangeRate!.Value);
}

// Create ve Update komutlarının ortak alanları
public interface IDonationCurrencyFields
{
    decimal Amount { get; }
    Currency Currency { get; }
    decimal? ForeignAmount { get; }
    decimal? ExchangeRate { get; }
    int? FundId { get; }
}

public static class DonationCurrencyRules
{
    public static void AddCurrencyRules<T>(this AbstractValidator<T> validator, IJsonStringLocalizer localizer)
        where T : IDonationCurrencyFields
    {
        validator.RuleFor(x => x.Currency)
            .IsInEnum().WithMessage(localizer["validation.invalidEnum", localizer["validation.fields.currency"]]);

        // TL bağışta tutar girilir; dövizde tutar sunucuda hesaplanır
        validator.RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.amount"], 0])
            .When(x => x.Currency == Currency.TRY);

        validator.RuleFor(x => x.ForeignAmount)
            .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.amount"]])
            .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.amount"], 0])
            .LessThan(1_000_000_000m).WithMessage(localizer["validation.range", localizer["validation.fields.amount"], 0, "1.000.000.000"])
            .When(x => x.Currency != Currency.TRY);

        validator.RuleFor(x => x.ForeignAmount)
            .Must(a => a == decimal.Truncate(a!.Value)).WithMessage(localizer["donations.quarterGoldWhole"])
            .When(x => x.Currency == Currency.QuarterGold && x.ForeignAmount.HasValue);

        validator.RuleFor(x => x.ExchangeRate)
            .NotNull().WithMessage(localizer["validation.required", localizer["validation.fields.exchangeRate"]])
            .GreaterThan(0).WithMessage(localizer["validation.greaterThan", localizer["validation.fields.exchangeRate"], 0])
            .LessThan(1_000_000m).WithMessage(localizer["validation.range", localizer["validation.fields.exchangeRate"], 0, "1.000.000"])
            .When(x => x.Currency != Currency.TRY);

        validator.RuleFor(x => x.FundId)
            .Null().WithMessage(localizer["donations.fundRequiresTry"])
            .When(x => x.Currency != Currency.TRY);
    }
}
