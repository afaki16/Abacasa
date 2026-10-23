using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationTargets.Dtos;
using Abacasa.Application.Features.RecurringPayments.Common;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using MediatR;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace Abacasa.Application.Features.DonationTargets.Queries.GetDonationTargetReport;

// Hedef raporu. Verilen: o yıl, o türde, veren kişisi hedefin sahibi olan bağışlar (emanetten dağıtılanlar hariç).
// Planlanan: sahibin aynı türdeki aktif bağış planlarının max(today, 1 Ocak)–31 Aralık arası ödenmemiş vadeleri;
// vade hesabı sabit ödemelerle ortaktır (RecurringPaymentOccurrenceCalculator).
public class GetDonationTargetReportQueryHandler : IRequestHandler<GetDonationTargetReportQuery, Result<DonationTargetReportDto>>
{
    // Adlar Türkçe sıralanır; hane (null) en sonda
    private static readonly StringComparer NameComparer = StringComparer.Create(new CultureInfo("tr-TR"), ignoreCase: true);

    private readonly IUnitOfWork _unitOfWork;

    public GetDonationTargetReportQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<DonationTargetReportDto>> Handle(GetDonationTargetReportQuery request, CancellationToken cancellationToken)
    {
        var year = request.Year;
        var today = request.Today!.Value;

        var targets = await _unitOfWork.DonationTargets.GetByYearReadOnlyAsync(year);
        var givenTotals = await _unitOfWork.Donations.GetYearTotalsByGiverAndKindAsync(year);

        var given = givenTotals
            .GroupBy(g => (g.PersonId, g.Kind))
            .ToDictionary(g => g.Key, g => (Name: g.First().PersonName, Total: g.Sum(x => x.Total)));

        // Planlanan: geçmiş bir yılda aralık boş kalır, planlanan 0
        var planned = new Dictionary<(int? PersonId, DonationKind Kind), decimal>();
        var from = new DateOnly(year, 1, 1) > today ? new DateOnly(year, 1, 1) : today;
        var to = new DateOnly(year, 12, 31);
        if (targets.Count > 0 && from <= to)
        {
            var calculation = await RecurringPaymentOccurrenceCalculator.CalculateAsync(_unitOfWork, from, to);
            foreach (var item in calculation.Items.Where(i => !i.IsPaid && i.Amount.HasValue))
            {
                var plan = calculation.Plans[item.RecurringPaymentId];
                if (plan.Kind != RecurringPaymentKind.Donation || !plan.IsActive || !plan.DonationKind.HasValue)
                    continue;

                var key = (plan.OwnerPersonId, plan.DonationKind.Value);
                planned[key] = planned.GetValueOrDefault(key) + item.Amount!.Value;
            }
        }

        var rows = targets
            .Select(t =>
            {
                var key = (t.OwnerPersonId, t.Kind);
                var givenAmount = given.TryGetValue(key, out var g) ? g.Total : 0m;
                var plannedAmount = planned.GetValueOrDefault(key);
                var expected = givenAmount + plannedAmount;

                return new DonationTargetRowDto
                {
                    TargetId = t.Id,
                    OwnerPersonId = t.OwnerPersonId,
                    OwnerName = t.OwnerPerson?.Name,
                    Kind = t.Kind,
                    Target = t.Amount,
                    Given = givenAmount,
                    Planned = plannedAmount,
                    ExpectedYearEnd = expected,
                    Remaining = t.Amount - givenAmount,
                    RemainingAfterPlan = t.Amount - expected
                };
            })
            .OrderBy(r => r.Kind)
            .ThenBy(r => r.OwnerPersonId == null)
            .ThenBy(r => r.OwnerName, NameComparer)
            .ToList();

        // Bir kişinin fazla ödemesi başkasının kalanından düşmez: yalnızca pozitif kalanlar toplanır
        var totalsByKind = rows
            .GroupBy(r => r.Kind)
            .OrderBy(g => g.Key)
            .Select(g => new DonationTargetKindTotalDto
            {
                Kind = g.Key,
                Target = g.Sum(r => r.Target),
                Given = g.Sum(r => r.Given),
                RemainingTotal = g.Sum(r => Math.Max(r.Remaining, 0m)),
                RemainingAfterPlanTotal = g.Sum(r => Math.Max(r.RemainingAfterPlan, 0m))
            })
            .ToList();

        // Hedefi olmayan (kişi, tür) çiftlerinin bağışları gönüllüdür
        var targetKeys = targets.Select(t => (t.OwnerPersonId, t.Kind)).ToHashSet();
        var voluntary = given
            .Where(g => !targetKeys.Contains(g.Key))
            .Select(g => new DonationVoluntaryDto
            {
                PersonId = g.Key.PersonId,
                Name = g.Value.Name,
                Kind = g.Key.Kind,
                Given = g.Value.Total
            })
            .OrderBy(v => v.Kind)
            .ThenBy(v => v.PersonId == null)
            .ThenBy(v => v.Name, NameComparer)
            .ToList();

        return Result<DonationTargetReportDto>.Success(new DonationTargetReportDto
        {
            Year = year,
            Rows = rows,
            TotalsByKind = totalsByKind,
            Voluntary = voluntary
        });
    }
}
