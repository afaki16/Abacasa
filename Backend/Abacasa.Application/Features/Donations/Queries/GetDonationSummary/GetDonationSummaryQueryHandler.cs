using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Donations.Dtos;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Linq;

namespace Abacasa.Application.Features.Donations.Queries.GetDonationSummary;

public class GetDonationSummaryQueryHandler : IRequestHandler<GetDonationSummaryQuery, Result<DonationSummaryDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetDonationSummaryQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<DonationSummaryDto>> Handle(GetDonationSummaryQuery request, CancellationToken cancellationToken)
    {
        var filter = new DonationFilter
        {
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Kind = request.Kind,
            SearchTerm = request.SearchTerm,
            FundId = request.FundId
        };

        // Toplamlar SQL'de hesaplanır; saklanmaz
        var (total, count) = await _unitOfWork.Donations.GetTotalsAsync(filter);
        var byKind = await _unitOfWork.Donations.GetTotalsByKindAsync(filter);
        var byGiver = await _unitOfWork.Donations.GetTotalsByGiverAsync(filter);

        // Emanetten dağıtılanlar toplamlara girmez; aynı filtrelerle ayrıca gösterilir
        var (fundTotal, fundCount) = await _unitOfWork.Donations.GetFundDistributedTotalsAsync(filter);

        var summary = new DonationSummaryDto
        {
            Total = total,
            Count = count,
            FundDistributedTotal = fundTotal,
            FundDistributedCount = fundCount,
            ByKind = byKind
                .Select(x => new DonationKindTotalDto
                {
                    Kind = x.Kind,
                    Total = x.Total,
                    Count = x.Count
                })
                .ToList(),
            ByGiver = byGiver
                .Select(x => new DonationGiverTotalDto
                {
                    PersonId = x.PersonId,
                    PersonName = x.PersonName,
                    Total = x.Total,
                    Count = x.Count
                })
                .ToList()
        };

        return Result<DonationSummaryDto>.Success(summary);
    }
}
