using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Ledger.Commands.DeleteLedgerItem;

public class DeleteLedgerItemCommandHandler : IRequestHandler<DeleteLedgerItemCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public DeleteLedgerItemCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeleteLedgerItemCommand request, CancellationToken cancellationToken)
    {
        var item = await _unitOfWork.LedgerItems.GetByIdAsync(request.Id);

        if (item == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["ledger.notFound"]));

        // Canlı tutarı olan kalem silinemez; pasif yapılabilir
        if (await _unitOfWork.LedgerItems.HasAmountsAsync(item.Id))
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.InvalidOperation,
                _localizer["ledger.hasAmounts"],
                409));

        _unitOfWork.LedgerItems.SoftDelete(item);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
