using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Debts.Common;
using Abacasa.Application.Features.Debts.Dtos;
using Abacasa.Domain.Common.Interfaces;
using MediatR;

namespace Abacasa.Application.Features.Debts.Queries.GetDebtSummary;

// Hesap Özet ile ortaktır (DebtSummaryCalculator)
public class GetDebtSummaryQueryHandler : IRequestHandler<GetDebtSummaryQuery, Result<DebtSummaryDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetDebtSummaryQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<DebtSummaryDto>> Handle(GetDebtSummaryQuery request, CancellationToken cancellationToken)
    {
        return Result<DebtSummaryDto>.Success(await DebtSummaryCalculator.CalculateAsync(_unitOfWork));
    }
}
