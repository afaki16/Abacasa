using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Dashboard.Dtos;
using MediatR;
using System;

namespace Abacasa.Application.Features.Dashboard.Queries.GetDashboard;

public class GetDashboardQuery : IRequest<Result<DashboardDto>>
{
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    /// İstemcinin bugünü; sunucu saat dilimine bağımlı olmamak için
    public DateOnly? Today { get; set; }
}
