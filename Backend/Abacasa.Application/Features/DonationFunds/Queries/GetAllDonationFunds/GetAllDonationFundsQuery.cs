using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationFunds.Dtos;
using MediatR;

namespace Abacasa.Application.Features.DonationFunds.Queries.GetAllDonationFunds;

public class GetAllDonationFundsQuery : IRequest<PagedResult<DonationFundDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SearchTerm { get; set; }
    public bool? IsClosed { get; set; }
}
