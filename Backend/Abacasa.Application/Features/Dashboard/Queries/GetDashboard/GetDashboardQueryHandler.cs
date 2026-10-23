using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Dashboard.Dtos;
using Abacasa.Application.Features.Debts.Common;
using Abacasa.Application.Features.RecurringPayments.Common;
using Abacasa.Application.Features.Vehicles.Common;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Collections.Generic;
using System.Linq;

namespace Abacasa.Application.Features.Dashboard.Queries.GetDashboard;

// Dönem özeti. Vade hesabı sabit ödemelerle (RecurringPaymentOccurrenceCalculator),
// borç özeti Borçlar ile (DebtSummaryCalculator) ortaktır. Sorgular toplu; N+1 yok.
public class GetDashboardQueryHandler : IRequestHandler<GetDashboardQuery, Result<DashboardDto>>
{
    // Yaklaşan ödemeler: vade [today − 60, today + 30]
    private const int UpcomingDaysBack = 60;
    private const int UpcomingDaysAhead = 30;

    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public GetDashboardQueryHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<DashboardDto>> Handle(GetDashboardQuery request, CancellationToken cancellationToken)
    {
        var start = request.StartDate!.Value;
        var end = request.EndDate!.Value;
        var today = request.Today!.Value;

        // Gerçekleşen: kaydın tarihine göre, araç ve kişi kırılımında (yemek kartı dahil)
        var expenseTotals = await _unitOfWork.Expenses.GetTotalsByPaymentMethodAndPersonAsync(
            new ExpenseFilter { StartDate = start, EndDate = end });
        var donationTotals = await _unitOfWork.Donations.GetTotalsByPaymentMethodAndPersonAsync(
            new DonationFilter { StartDate = start, EndDate = end });

        // Vadeler: ödenmiş vade zaten harcama/bağış kaydıdır; bekleyene yalnızca ödenmemişler girer
        var period = await RecurringPaymentOccurrenceCalculator.CalculateAsync(_unitOfWork, start, end);
        bool IsMealCard(int paymentMethodId) => period.MethodTypes[paymentMethodId] == PaymentMethodType.MealCard;

        var spentRows = expenseTotals.Concat(donationTotals).ToList();
        var spentOutflow = spentRows.Where(r => r.PaymentMethodType != PaymentMethodType.MealCard).ToList();
        var pendingItems = period.Items.Where(i => !i.IsPaid).ToList();
        var pendingOutflow = pendingItems.Where(i => !IsMealCard(i.PaymentMethodId)).ToList();
        var recurringOutflow = period.Items.Where(i => !IsMealCard(i.PaymentMethodId)).ToList();

        var spent = new DashboardSpentDto
        {
            Expenses = expenseTotals.Where(r => r.PaymentMethodType != PaymentMethodType.MealCard).Sum(r => r.Total),
            Donations = donationTotals.Where(r => r.PaymentMethodType != PaymentMethodType.MealCard).Sum(r => r.Total)
        };
        spent.Total = spent.Expenses + spent.Donations;

        // Tutarı belli olmayan vade toplama girmez, UnknownCount'a girer
        var pending = new DashboardPendingDto
        {
            Total = pendingOutflow.Sum(i => i.Amount ?? 0m),
            Count = pendingOutflow.Count,
            UnknownCount = pendingOutflow.Count(i => !i.Amount.HasValue)
        };

        var mealCard = new DashboardMealCardDto
        {
            Spent = spentRows.Where(r => r.PaymentMethodType == PaymentMethodType.MealCard).Sum(r => r.Total),
            Pending = pendingItems.Where(i => IsMealCard(i.PaymentMethodId)).Sum(i => i.Amount ?? 0m)
        };
        mealCard.Total = mealCard.Spent + mealCard.Pending;

        // Ödenmiş vade bağlı kaydın tutarıyla sayılır
        var recurring = new DashboardRecurringDto
        {
            PaidTotal = recurringOutflow.Where(i => i.IsPaid).Sum(i => i.Amount ?? 0m),
            PendingTotal = pending.Total,
            UnknownCount = pending.UnknownCount
        };
        recurring.Total = recurring.PaidTotal + recurring.PendingTotal;

        // Gerçekleşen kaydın gerçek aracına, bekleyen planın aracına göre (yemek kartı dahil)
        var byPaymentMethod = spentRows
            .Select(r => new { Id = r.PaymentMethodId, Name = r.PaymentMethodName, Type = r.PaymentMethodType, Spent = r.Total, Pending = 0m })
            .Concat(pendingItems.Select(i => new
            {
                Id = i.PaymentMethodId,
                Name = i.PaymentMethodName,
                Type = period.MethodTypes[i.PaymentMethodId],
                Spent = 0m,
                Pending = i.Amount ?? 0m
            }))
            .GroupBy(x => x.Id)
            .Select(g => new DashboardPaymentMethodDto
            {
                Id = g.Key,
                Name = g.First().Name,
                Type = g.First().Type,
                Spent = g.Sum(x => x.Spent),
                Pending = g.Sum(x => x.Pending),
                Total = g.Sum(x => x.Spent + x.Pending)
            })
            .OrderByDescending(x => x.Total)
            .ThenBy(x => x.Name)
            .ToList();

        // Kişi: harcamada sahip, bağışta veren, bekleyen vadede planın kişisi; boşsa hane (yemek kartı hariç)
        var byPerson = spentOutflow
            .Select(r => new { r.PersonId, r.PersonName, Spent = r.Total, Pending = 0m })
            .Concat(pendingOutflow.Select(i =>
            {
                var plan = period.Plans[i.RecurringPaymentId];
                return new { PersonId = plan.OwnerPersonId, PersonName = plan.OwnerPerson?.Name, Spent = 0m, Pending = i.Amount ?? 0m };
            }))
            .GroupBy(x => x.PersonId)
            .Select(g => new DashboardPersonDto
            {
                PersonId = g.Key,
                Name = g.First().PersonName,
                Spent = g.Sum(x => x.Spent),
                Pending = g.Sum(x => x.Pending),
                Total = g.Sum(x => x.Spent + x.Pending)
            })
            .OrderByDescending(x => x.Total)
            .ThenBy(x => x.Name)
            .ToList();

        // Yaklaşan: ödenmemiş vadeler, yemek kartı dahil
        var upcomingRange = await RecurringPaymentOccurrenceCalculator.CalculateAsync(
            _unitOfWork, today.AddDays(-UpcomingDaysBack), today.AddDays(UpcomingDaysAhead));
        var upcoming = upcomingRange.Items
            .Where(i => !i.IsPaid)
            .Select(i => new DashboardUpcomingDto
            {
                Source = DashboardUpcomingSource.Recurring,
                RecurringPaymentId = i.RecurringPaymentId,
                Name = i.Name,
                Kind = i.Kind,
                DueDate = i.DueDate,
                Amount = i.Amount,
                IsEstimated = i.IsEstimated,
                PaymentMethodName = i.PaymentMethodName,
                IsOverdue = i.DueDate < today
            })
            .ToList();

        // Araç hatırlatmaları Araçlar sayfasıyla aynı koddan; yalnızca listede, hiçbir toplama girmez.
        // Sıralama kararlıdır: sabit ödeme satırlarının kendi sırası değişmez
        var vehicleReminders = await VehicleObligationRules.GetRemindersAsync(_unitOfWork, today);
        upcoming = upcoming
            .Concat(vehicleReminders.Select(r => new DashboardUpcomingDto
            {
                Source = DashboardUpcomingSource.Vehicle,
                VehicleId = r.VehicleId,
                Name = $"{r.VehicleName} · {VehicleObligationRules.TypeLabel(r.Type, _localizer)}",
                ObligationType = r.Type,
                DueDate = r.ValidUntil,
                Amount = r.LastAmount,
                IsEstimated = true,
                PaymentMethodName = null,
                IsOverdue = r.IsOverdue
            }))
            .OrderBy(u => u.DueDate)
            .ToList();

        var dashboard = new DashboardDto
        {
            Spent = spent,
            Pending = pending,
            OutflowTotal = spent.Total + pending.Total,
            MealCard = mealCard,
            Recurring = recurring,
            ByPaymentMethod = byPaymentMethod,
            ByPerson = byPerson,
            Debts = await DebtSummaryCalculator.CalculateAsync(_unitOfWork),
            Upcoming = upcoming
        };

        return Result<DashboardDto>.Success(dashboard);
    }
}
