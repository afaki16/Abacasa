using Abacasa.Application.Features.Users.Common;
using Abacasa.Application.Features.Users.Dtos;
using Abacasa.Application.Features.Users.Queries.GetCurrentUser;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Users.Queries.GetCurrentUser
{
    // /me: login yanıtındaki kullanıcı nesnesiyle aynı (UserProfileBuilder); izinler token'daki aktif haneye göre
    public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, Result<UserDto>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPermissionService _permissionService;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILegalVersions _legalVersions;

        public GetCurrentUserQueryHandler(IUnitOfWork unitOfWork, IPermissionService permissionService, ICurrentUserService currentUserService,
            ILegalVersions legalVersions)
        {
            _legalVersions = legalVersions;
            _unitOfWork = unitOfWork;
            _permissionService = permissionService;
            _currentUserService = currentUserService;
        }

        public async Task<Result<UserDto>> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
        {
            var user = await _unitOfWork.Users.GetUserWithRolesReadOnlyAsync(request.UserId);

            if (user == null)
                return Result<UserDto>.Failure(Error.Failure(
                    ErrorCode.NotFound,
                    "User not found"));

            var userDto = await UserProfileBuilder.BuildAsync(_unitOfWork, _permissionService, _legalVersions, user, _currentUserService.TenantId);
            return Result<UserDto>.Success(userDto);
        }
    }
}
