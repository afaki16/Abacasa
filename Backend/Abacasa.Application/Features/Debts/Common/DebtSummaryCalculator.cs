using Abacasa.Application.Features.Debts.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Application.Features.Debts.Common;

// Borç özeti; Borçlar sayfası ve Özet aynı kodu kullanır.
// Açık borç toplamları canlı ödemelerden hesaplanır; açık dövizin TL karşılığı en son tarihli kurla.
public static class DebtSummaryCalculator
{
    public static async Task<DebtSummaryDto> CalculateAsync(IUnitOfWork unitOfWork)
    {
        var debts = await unitOfWork.Debts.GetAllWithPaymentsReadOnlyAsync();
        var latest = await unitOfWork.ExchangeRates.GetLatestAsync(Currency.USD);
        decimal? rate = latest?.Rate;

        var open = debts
            .Select(d => new { Debt = d, Remaining = DebtAmounts.Remaining(d) })
            .Where(x => x.Remaining > 0)
            .ToList();

        var openTry = open.Where(x => x.Debt.Currency == Currency.TRY).Sum(x => x.Remaining);
        var openUsd = open.Where(x => x.Debt.Currency == Currency.USD).Sum(x => x.Remaining);
        var openUsdInTry = UsdInTry(openUsd, rate);

        var byCreditor = open
            .GroupBy(x => new { x.Debt.CreditorPersonId, x.Debt.CreditorPerson.Name })
            .Select(g =>
            {
                var creditorTry = g.Where(x => x.Debt.Currency == Currency.TRY).Sum(x => x.Remaining);
                var creditorUsd = g.Where(x => x.Debt.Currency == Currency.USD).Sum(x => x.Remaining);
                var creditorUsdInTry = UsdInTry(creditorUsd, rate);

                return new DebtCreditorTotalDto
                {
                    PersonId = g.Key.CreditorPersonId,
                    Name = g.Key.Name,
                    OpenTry = creditorTry,
                    OpenUsd = creditorUsd,
                    OpenUsdInTry = creditorUsdInTry,
                    TotalInTry = creditorTry + creditorUsdInTry
                };
            })
            .ToList();

        // Kur varsa TL karşılığı toplamına, yoksa TL açığa göre sıralanır
        byCreditor = (rate.HasValue
                ? byCreditor.OrderByDescending(x => x.TotalInTry)
                : byCreditor.OrderByDescending(x => x.OpenTry))
            .ThenBy(x => x.Name)
            .ToList();

        return new DebtSummaryDto
        {
            OpenTry = openTry,
            OpenUsd = openUsd,
            UsdRate = latest == null ? null : new DebtRateDto { Rate = latest.Rate, Date = latest.Date },
            OpenUsdInTry = openUsdInTry,
            OpenTotalInTry = openTry + openUsdInTry,
            PaidTotalInTry = debts.SelectMany(d => d.Payments).Sum(DebtAmounts.PaymentInTry),
            OpenCount = open.Count,
            ByCreditor = byCreditor
        };
    }

    // Açık dolar yoksa TL karşılığı 0'dır; null yalnızca açık dolar varken kur girilmemişse döner
    private static decimal? UsdInTry(decimal openUsd, decimal? rate) =>
        openUsd == 0 ? 0 : rate.HasValue ? DebtAmounts.ToTry(openUsd, rate.Value) : null;
}
