using Abacasa.Application.Features.Tenants.Commands.CreateTenant;
using Abacasa.Application.Features.Tenants.Commands.UpdateTenant;
using Abacasa.Application.Features.Tenants.Commands.DeleteTenant;
using Abacasa.Application.Common.Localization;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Models;
using MediatR;
using System.Threading;
using System.Threading.Tasks;
using Abacasa.Domain.Common.Enums;

namespace Abacasa.Application.Features.Tenants.Commands.DeleteTenant;

    public class DeleteTenantCommandHandler : IRequestHandler<DeleteTenantCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public DeleteTenantCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeleteTenantCommand request, CancellationToken cancellationToken)
    {
        var tenant = await _unitOfWork.Tenants.GetByIdAsync(request.Id);

        if (tenant == null)
        {
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["tenants.notFound"]));
        }

        // Deleting a tenant would lock out its SuperAdmin
        if (await _unitOfWork.Users.TenantHasSuperAdminAsync(tenant.Id))
        {
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.Forbidden,
                _localizer["tenants.hasSuperAdmin"]));
        }

        // Soft delete is an UPDATE (IsDeleted = true): users are not deleted and their TenantId does not change
        // (DeleteBehavior.SetNull only applies to a real DELETE). Access is blocked by the login, refresh and
        // per-request session checks, which treat a deleted tenant as inactive.
        _unitOfWork.Tenants.SoftDelete(tenant);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
