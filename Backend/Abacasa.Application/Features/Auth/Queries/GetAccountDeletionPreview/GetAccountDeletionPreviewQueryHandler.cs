using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Auth.Commands.DeleteAccount;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Auth.Queries.GetAccountDeletionPreview;

public class GetAccountDeletionPreviewQueryHandler : IRequestHandler<GetAccountDeletionPreviewQuery, Result<AccountDeletionPlan>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IJsonStringLocalizer _localizer;

    public GetAccountDeletionPreviewQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _localizer = localizer;
    }

    public async Task<Result<AccountDeletionPlan>> Handle(GetAccountDeletionPreviewQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId is not int userId)
            return Result<AccountDeletionPlan>.Failure(Error.Failure(ErrorCode.Unauthorized, _localizer["auth.userNotAuthenticated"]));

        return Result<AccountDeletionPlan>.Success(await AccountDeletionPlan.BuildAsync(_unitOfWork, userId));
    }
}
