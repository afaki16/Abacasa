using Abacasa.Application.Features.Debts.Dtos;
using Abacasa.Application.Features.ExchangeRates.Common;
using Abacasa.Application.Features.ExchangeRates.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Application.Features.Debts.Common;

// Borç özeti; Borçlar sayfası ve Özet aynı kodu kullanır.
// Açık borç toplamları canlı ödemelerden hesaplanır; yabancı birimin TL karşılığı güncel kurla (CurrentRates).
public static class DebtSummaryCalculator
{
    public static async Task<DebtSummaryDto> CalculateAsync(IUnitOfWork unitOfWork)
    {
        var debts = await unitOfWork.Debts.GetAllWithPaymentsReadOnlyAsync();
        var rates = await CurrentRates.GetAllAsync(unitOfWork);

        var open = debts
            .Select(d => new { Debt = d, Remaining = DebtAmounts.Remaining(d) })
            .Where(x => x.Remaining > 0)
            .ToList();

        var openTry = open.Where(x => x.Debt.Currency == Currency.TRY).Sum(x => x.Remaining);

        var foreign = CurrentRates.ForeignCurrencies
            .Select(c => new { Currency = c, Open = open.Where(x => x.Debt.Currency == c).Sum(x => x.Remaining) })
            .Where(x => x.Open > 0)
            .Select(x => new DebtForeignOpenDto
            {
                Currency = x.Currency,
                Open = x.Open,
                Rate = rates.TryGetValue(x.Currency, out var r) ? new DebtRateDto { Rate = r.Rate, Date = r.Date, Source = r.Source } : null,
                OpenInTry = InTry(x.Open, x.Currency, rates)
            })
            .ToList();

        var byCreditor = open
            .GroupBy(x => new { x.Debt.CreditorPersonId, x.Debt.CreditorPerson.Name })
            .Select(g =>
            {
                var creditorTry = g.Where(x => x.Debt.Currency == Currency.TRY).Sum(x => x.Remaining);
                var creditorForeign = CurrentRates.ForeignCurrencies
                    .Select(c => new { Currency = c, Open = g.Where(x => x.Debt.Currency == c).Sum(x => x.Remaining) })
                    .Where(x => x.Open > 0)
                    .Select(x => new DebtCreditorForeignDto { Currency = x.Currency, Open = x.Open, OpenInTry = InTry(x.Open, x.Currency, rates) })
                    .ToList();

                return new DebtCreditorTotalDto
                {
                    PersonId = g.Key.CreditorPersonId,
                    Name = g.Key.Name,
                    OpenTry = creditorTry,
                    Foreign = creditorForeign,
                    TotalInTry = Total(creditorTry, creditorForeign.Select(f => f.OpenInTry))
                };
            })
            .ToList();

        // Bütün TL karşılıkları biliniyorsa toplam TL'ye, değilse TL açığa göre sıralanır
        byCreditor = (byCreditor.All(x => x.TotalInTry.HasValue)
                ? byCreditor.OrderByDescending(x => x.TotalInTry)
                : byCreditor.OrderByDescending(x => x.OpenTry))
            .ThenBy(x => x.Name)
            .ToList();

        return new DebtSummaryDto
        {
            OpenTry = openTry,
            Foreign = foreign,
            OpenTotalInTry = Total(openTry, foreign.Select(f => f.OpenInTry)),
            PaidTotalInTry = debts.SelectMany(d => d.Payments).Sum(DebtAmounts.PaymentInTry),
            OpenCount = open.Count,
            Rates = CurrentRates.ForeignCurrencies.Where(rates.ContainsKey).Select(c => rates[c]).ToList(),
            ByCreditor = byCreditor
        };
    }

    // Kuru olmayan birimde null
    private static decimal? InTry(decimal amount, Currency currency, IReadOnlyDictionary<Currency, CurrentRateDto> rates) =>
        rates.TryGetValue(currency, out var rate) ? DebtAmounts.ToTry(amount, rate.Rate) : null;

    // Bir birimin TL karşılığı bilinmiyorsa toplam da bilinmez
    private static decimal? Total(decimal openTry, IEnumerable<decimal?> foreignInTry)
    {
        var parts = foreignInTry.ToList();
        return parts.Any(p => !p.HasValue) ? null : openTry + parts.Sum(p => p!.Value);
    }
}
