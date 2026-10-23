using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationTargets.Dtos;
using MediatR;
using System;

namespace Abacasa.Application.Features.DonationTargets.Queries.GetDonationTargetReport;

public class GetDonationTargetReportQuery : IRequest<Result<DonationTargetReportDto>>
{
    public int Year { get; set; }
    /// İstemcinin bugünü; planlanan tutar bugünden yıl sonuna kadar hesaplanır
    public DateOnly? Today { get; set; }
}
