using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Ledger.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Ledger.Commands.SetMonthlyAmount;

// Hücre yazma: tutar varsa günceller ya da açar; null ise kaydı siler (hücre "girilmemiş" olur).
// Pasif kalemde de çalışır; geçmiş düzeltmeleri için.
public class SetMonthlyAmountCommandHandler : IRequestHandler<SetMonthlyAmountCommand, Result<SetMonthlyAmountResultDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public SetMonthlyAmountCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<SetMonthlyAmountResultDto>> Handle(SetMonthlyAmountCommand request, CancellationToken cancellationToken)
    {
        // Filtreli yükleme; başka hanenin kalemi bulunamaz
        var item = await _unitOfWork.LedgerItems.GetByIdAsync(request.LedgerItemId);

        if (item == null)
            return Result<SetMonthlyAmountResultDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["ledger.notFound"]));

        var existing = await _unitOfWork.MonthlyAmounts.GetAsync(item.Id, request.Year, request.Month);
        var created = false;

        if (!request.Amount.HasValue)
        {
            if (existing != null)
                _unitOfWork.MonthlyAmounts.SoftDelete(existing);
        }
        else if (existing != null)
        {
            existing.Amount = request.Amount.Value;
            _unitOfWork.MonthlyAmounts.Update(existing);
        }
        else
        {
            // TenantId ApplicationDbContext tarafından atanır
            await _unitOfWork.MonthlyAmounts.AddAsync(new MonthlyAmount
            {
                LedgerItemId = item.Id,
                Year = request.Year,
                Month = request.Month,
                Amount = request.Amount.Value
            });
            created = true;
        }

        await _unitOfWork.SaveChangesAsync();

        return Result<SetMonthlyAmountResultDto>.Success(new SetMonthlyAmountResultDto
        {
            Cell = new MonthlyAmountDto
            {
                LedgerItemId = item.Id,
                Year = request.Year,
                Month = request.Month,
                Amount = request.Amount
            },
            Created = created
        });
    }
}
