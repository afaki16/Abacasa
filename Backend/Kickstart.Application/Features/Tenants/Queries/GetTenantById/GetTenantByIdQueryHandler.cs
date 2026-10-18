using AutoMapper;
using Kickstart.Domain.Common.Interfaces;
using Kickstart.Domain.Common.Interfaces.Repositories;
using Kickstart.Application.Common.Results;
using Kickstart.Application.Features.Tenants.Dtos;
using Kickstart.Domain.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using Kickstart.Domain.Common.Enums;
namespace Kickstart.Application.Features.Tenants.Queries.GetTenantById
{
    public class GetTenantByIdQueryHandler : IRequestHandler<GetTenantByIdQuery, Result<TenantDto>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public GetTenantByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<Result<TenantDto>> Handle(GetTenantByIdQuery request, CancellationToken cancellationToken)
        {
            var tenant = await _unitOfWork.Tenants.GetQueryable().FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

            if (tenant == null)
            {
                return Result<TenantDto>.Failure(Error.Failure(
                    ErrorCode.NotFound,
                    "Tenant not found"));
            }

            var tenantDto = _mapper.Map<TenantDto>(tenant);
            tenantDto.UserCount = await _unitOfWork.Users.CountByTenantIdAsync(tenant.Id);
            return Result<TenantDto>.Success(tenantDto);
        }
    }
}
