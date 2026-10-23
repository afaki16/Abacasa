using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Linq;

namespace Abacasa.Application.Features.Debts.Commands.DeleteDebt;

public class DeleteDebtCommandHandler : IRequestHandler<DeleteDebtCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public DeleteDebtCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeleteDebtCommand request, CancellationToken cancellationToken)
    {
        var debt = await _unitOfWork.Debts.GetWithRelationsAsync(request.Id);

        if (debt == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["debts.notFound"]));

        // Canlı ödemesi olan borç silinemez; önce ödemeler silinir
        if (debt.Payments.Any())
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.InvalidOperation,
                _localizer["debts.hasPayments"],
                409));

        _unitOfWork.Debts.SoftDelete(debt);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
