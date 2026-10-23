using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Vehicles.Commands.DeleteVehicleObligation;

public class DeleteVehicleObligationCommandHandler : IRequestHandler<DeleteVehicleObligationCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public DeleteVehicleObligationCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeleteVehicleObligationCommand request, CancellationToken cancellationToken)
    {
        var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(request.VehicleId);

        if (vehicle == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["vehicles.notFound"]));

        // İşlem bu araca ait değilse bulunamadı sayılır
        var obligation = await _unitOfWork.VehicleObligations.GetByIdAsync(request.ObligationId);
        if (obligation == null || obligation.VehicleId != vehicle.Id)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["vehicles.obligationNotFound"]));

        // Canlı bağlı harcama da aynı SaveChanges içinde silinir
        if (obligation.ExpenseId.HasValue)
        {
            var expense = await _unitOfWork.Expenses.GetByIdAsync(obligation.ExpenseId.Value);
            if (expense != null)
                _unitOfWork.Expenses.SoftDelete(expense);
        }

        _unitOfWork.VehicleObligations.SoftDelete(obligation);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
