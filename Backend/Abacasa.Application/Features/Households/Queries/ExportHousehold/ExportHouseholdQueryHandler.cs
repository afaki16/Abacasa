using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Households.Queries.ExportHousehold;

public class ExportHouseholdQueryHandler : IRequestHandler<ExportHouseholdQuery, Result<ExportFile>>
{
    private readonly IDataExportService _exportService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IJsonStringLocalizer _localizer;

    public ExportHouseholdQueryHandler(IDataExportService exportService, ICurrentUserService currentUserService, IJsonStringLocalizer localizer)
    {
        _exportService = exportService;
        _currentUserService = currentUserService;
        _localizer = localizer;
    }

    public async Task<Result<ExportFile>> Handle(ExportHouseholdQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.TenantId is not int tenantId)
            return Result<ExportFile>.Failure(Error.Failure(ErrorCode.NotFound, _localizer["households.notFound"]));

        return Result<ExportFile>.Success(await _exportService.ExportHouseholdAsync(tenantId, cancellationToken));
    }
}
