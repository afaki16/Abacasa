using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Auth.Queries.ExportAccount;

public class ExportAccountQueryHandler : IRequestHandler<ExportAccountQuery, Result<ExportFile>>
{
    private readonly IDataExportService _exportService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IJsonStringLocalizer _localizer;

    public ExportAccountQueryHandler(IDataExportService exportService, ICurrentUserService currentUserService, IJsonStringLocalizer localizer)
    {
        _exportService = exportService;
        _currentUserService = currentUserService;
        _localizer = localizer;
    }

    public async Task<Result<ExportFile>> Handle(ExportAccountQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId is not int userId)
            return Result<ExportFile>.Failure(Error.Failure(ErrorCode.Unauthorized, _localizer["auth.userNotAuthenticated"]));

        return Result<ExportFile>.Success(await _exportService.ExportAccountAsync(userId, cancellationToken));
    }
}
