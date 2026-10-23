using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Donations.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;
using System;

namespace Abacasa.Application.Features.Donations.Queries.GetAllDonations;

public class GetAllDonationsQuery : IRequest<PagedResult<DonationListDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SearchTerm { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public DonationKind? Kind { get; set; }
    public int? FundId { get; set; }
}
