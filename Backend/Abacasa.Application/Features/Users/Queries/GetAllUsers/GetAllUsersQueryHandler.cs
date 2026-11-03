using AutoMapper;
using Abacasa.Application.Features.Users.Dtos;
using Abacasa.Application.Features.Roles.Dtos;
using Abacasa.Application.Features.Tenants.Dtos;
using Abacasa.Application.Features.Permissions.Dtos;
using Abacasa.Application.Features.Users.Queries.GetAllUsers;
using Abacasa.Application.Features.Users.Queries.GetUserById;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Common.Authorization;
using Abacasa.Application.Common.Localization;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Models;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Abacasa.Application.Features.Users.Queries.GetAllUsers
{
    public class GetAllUsersQueryHandler : IRequestHandler<GetAllUsersQuery, PagedResult<UserListDto>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;
        private readonly IJsonStringLocalizer _localizer;

        public GetAllUsersQueryHandler(IUnitOfWork unitOfWork, IMapper mapper, ICurrentUserService currentUserService, IJsonStringLocalizer localizer)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _currentUserService = currentUserService;
            _localizer = localizer;
        }

        public async Task<PagedResult<UserListDto>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
        {
            if (!TenantAccess.HasTenantScope(_currentUserService))
                return PagedResult<UserListDto>.Failure(Error.Failure(ErrorCode.Forbidden, _localizer["users.noTenantScope"]));

            // SuperAdmin sees all tenants' users, Admin/User see only their tenant's users
            int? tenantId = _currentUserService.CanAccessAllTenants ? null : _currentUserService.TenantId;
            var excludeSuperAdmins = !_currentUserService.CanAccessAllTenants;
            // SuperAdmin'in üst barda seçtiği hane: o hanede canlı üyeliği olanlar (User.TenantId son aktif hanedir, ölçüt değil)
            var selectedTenantId = _currentUserService.SelectedTenantId;

            var (users, totalCount) = await _unitOfWork.Users.GetUsersPagedAsync(request.Page, request.PageSize, request.SearchTerm, tenantId, excludeSuperAdmins, selectedTenantId, request.Status);
            var userDtos = _mapper.Map<List<UserListDto>>(users);

            // Hane sütunu yalnızca SuperAdmin platform görünümünde: diğer roller kullanıcının başka hanelerini görmez
            if (_currentUserService.CanAccessAllTenants && selectedTenantId == null && userDtos.Count > 0)
            {
                var names = await _unitOfWork.TenantMemberships.GetHouseholdNamesByUsersAsync(userDtos.Select(u => u.Id));
                foreach (var dto in userDtos)
                    dto.HouseholdNames = names.TryGetValue(dto.Id, out var list) ? list : new List<string>();
            }

            var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);
            return PagedResult<UserListDto>.Success(userDtos, request.Page, totalPages, totalCount);
        }
    }
} 
