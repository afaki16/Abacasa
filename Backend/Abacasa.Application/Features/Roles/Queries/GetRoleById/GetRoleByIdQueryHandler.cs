using AutoMapper;
using Abacasa.Application.Features.Roles.Queries.GetAllRoles;
using Abacasa.Application.Features.Roles.Queries.GetRoleById;
using Abacasa.Application.Interfaces;
using Abacasa.Application.Common.Localization;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Models;
using MediatR;
using System.Threading;
using System.Threading.Tasks;
using Abacasa.Application.Features.Users.Dtos;
using Abacasa.Application.Features.Roles.Dtos;
using Abacasa.Application.Features.Tenants.Dtos;
using Abacasa.Application.Features.Permissions.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Constants;

namespace Abacasa.Application.Features.Roles.Queries.GetRoleById
{
    public class GetRoleByIdQueryHandler : IRequestHandler<GetRoleByIdQuery, Result<RoleDto>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;
        private readonly IJsonStringLocalizer _localizer;

        public GetRoleByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper, ICurrentUserService currentUserService, IJsonStringLocalizer localizer)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _currentUserService = currentUserService;
            _localizer = localizer;
        }

        public async Task<Result<RoleDto>> Handle(GetRoleByIdQuery request, CancellationToken cancellationToken)
        {
            var role = await _unitOfWork.Roles.GetRoleWithPermissionsReadOnlyAsync(request.Id);

            // Missing, SuperAdmin (for non-SuperAdmin) and other tenants' roles all look the same: not found
            if (role == null ||
                (!_currentUserService.CanAccessAllTenants &&
                 (role.Name == RoleNames.SuperAdmin ||
                  (role.TenantId != null && role.TenantId != _currentUserService.TenantId))))
                return Result<RoleDto>.Failure(Error.Failure(
                    ErrorCode.NotFound,
                    _localizer["roles.notFound"]));

        var roleDto = _mapper.Map<RoleDto>(role);
            return Result<RoleDto>.Success(roleDto);
    }
    }
} 
