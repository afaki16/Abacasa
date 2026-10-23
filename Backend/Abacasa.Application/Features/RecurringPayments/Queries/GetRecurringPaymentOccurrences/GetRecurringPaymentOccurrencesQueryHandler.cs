using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.RecurringPayments.Common;
using Abacasa.Application.Features.RecurringPayments.Dtos;
using Abacasa.Domain.Common.Interfaces;
using MediatR;
using System.Linq;

namespace Abacasa.Application.Features.RecurringPayments.Queries.GetRecurringPaymentOccurrences;

// Aralıktaki vadeler. Vade hesabı Özet ile ortaktır (RecurringPaymentOccurrenceCalculator).
public class GetRecurringPaymentOccurrencesQueryHandler : IRequestHandler<GetRecurringPaymentOccurrencesQuery, Result<RecurringPaymentOccurrencesDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetRecurringPaymentOccurrencesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<RecurringPaymentOccurrencesDto>> Handle(GetRecurringPaymentOccurrencesQuery request, CancellationToken cancellationToken)
    {
        var calculation = await RecurringPaymentOccurrenceCalculator.CalculateAsync(
            _unitOfWork, request.StartDate!.Value, request.EndDate!.Value);
        var items = calculation.Items;

        var byPaymentMethod = items
            .GroupBy(i => new { i.PaymentMethodId, i.PaymentMethodName })
            .Select(g =>
            {
                var paid = g.Where(i => i.IsPaid).Sum(i => i.Amount ?? 0m);
                var pending = g.Where(i => !i.IsPaid).Sum(i => i.Amount ?? 0m);
                return new RecurringPaymentMethodTotalDto
                {
                    Id = g.Key.PaymentMethodId,
                    Name = g.Key.PaymentMethodName,
                    Type = calculation.MethodTypes[g.Key.PaymentMethodId],
                    PaidTotal = paid,
                    PendingTotal = pending,
                    Total = paid + pending
                };
            })
            .OrderByDescending(x => x.Total)
            .ToList();

        var paidTotal = items.Where(i => i.IsPaid).Sum(i => i.Amount ?? 0m);
        var pendingTotal = items.Where(i => !i.IsPaid).Sum(i => i.Amount ?? 0m);

        var result = new RecurringPaymentOccurrencesDto
        {
            Items = items,
            PaidTotal = paidTotal,
            PendingTotal = pendingTotal,
            Total = paidTotal + pendingTotal,
            UnknownCount = items.Count(i => !i.IsPaid && !i.Amount.HasValue),
            ByPaymentMethod = byPaymentMethod
        };

        return Result<RecurringPaymentOccurrencesDto>.Success(result);
    }
}
