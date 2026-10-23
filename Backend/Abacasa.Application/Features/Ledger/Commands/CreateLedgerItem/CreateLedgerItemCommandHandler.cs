using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Ledger.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Ledger.Commands.CreateLedgerItem;

public class CreateLedgerItemCommandHandler : IRequestHandler<CreateLedgerItemCommand, Result<LedgerItemListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public CreateLedgerItemCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<LedgerItemListDto>> Handle(CreateLedgerItemCommand request, CancellationToken cancellationToken)
    {
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

        // Tenant filtresi ApplicationDbContext'te: kontrol sadece kullanıcının hanesinde yapılır
        if (await _unitOfWork.LedgerItems.NameExistsAsync(name))
            return Result<LedgerItemListDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["ledger.nameExists"]));

        // TenantId ApplicationDbContext tarafından atanır; yeni kalem her zaman aktif başlar
        var item = new LedgerItem
        {
            Name = name,
            Direction = request.Direction,
            OwnerPersonId = owner?.Id,
            OwnerPerson = owner
        };

        await _unitOfWork.LedgerItems.AddAsync(item);
        await _unitOfWork.SaveChangesAsync();

        return Result<LedgerItemListDto>.Success(_mapper.Map<LedgerItemListDto>(item));
    }
}
