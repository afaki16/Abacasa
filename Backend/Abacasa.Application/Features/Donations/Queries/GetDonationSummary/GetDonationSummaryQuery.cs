using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Donations.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;
using System;

namespace Abacasa.Application.Features.Donations.Queries.GetDonationSummary;

public class GetDonationSummaryQuery : IRequest<Result<DonationSummaryDto>>
{
    public string SearchTerm { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public DonationKind? Kind { get; set; }
    public int? FundId { get; set; }
}
