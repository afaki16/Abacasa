using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Ledger.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Ledger.Commands.UpdateLedgerItem;

public class UpdateLedgerItemCommandHandler : IRequestHandler<UpdateLedgerItemCommand, Result<LedgerItemListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public UpdateLedgerItemCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<LedgerItemListDto>> Handle(UpdateLedgerItemCommand request, CancellationToken cancellationToken)
    {
        // Tracking'li yükle; başka hanenin kaydı filtre yüzünden bulunamaz
        var item = await _unitOfWork.LedgerItems.GetWithOwnerAsync(request.Id);

        if (item == null)
            return Result<LedgerItemListDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["ledger.notFound"]));

        // Kişi repository ile yüklenir (tenant filtresi uygulanır); başka hanenin kişisi bulunamaz
        Person? owner = null;
        if (request.OwnerPersonId.HasValue)
        {
            owner = await _unitOfWork.People.GetByIdAsync(request.OwnerPersonId.Value);
            if (owner == null)
                return Result<LedgerItemListDto>.Failure(Error.Failure(
                    ErrorCode.ValidationFailed,
                    _localizer["ledger.ownerNotFound"]));
        }

        var name = request.Name.Trim();

        if (await _unitOfWork.LedgerItems.NameExistsAsync(name, request.Id))
            return Result<LedgerItemListDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["ledger.nameExists"]));

        // Tutarı olan kalemin yönü değişirse geçmiş tutarlar diğer tarafa geçerdi
        var hasAmounts = await _unitOfWork.LedgerItems.HasAmountsAsync(item.Id);
        if (request.Direction != item.Direction && hasAmounts)
            return Result<LedgerItemListDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["ledger.directionLocked"]));

        item.Name = name;
        item.Direction = request.Direction;
        item.OwnerPersonId = owner?.Id;
        item.OwnerPerson = owner;
        item.IsActive = request.IsActive;

        _unitOfWork.LedgerItems.Update(item);
        await _unitOfWork.SaveChangesAsync();

        var dto = _mapper.Map<LedgerItemListDto>(item);
        dto.HasAmounts = hasAmounts;

        return Result<LedgerItemListDto>.Success(dto);
    }
}
