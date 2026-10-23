using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Ledger.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Ledger.Queries.GetLedgerItemById;

public class GetLedgerItemByIdQueryHandler : IRequestHandler<GetLedgerItemByIdQuery, Result<LedgerItemDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public GetLedgerItemByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<LedgerItemDto>> Handle(GetLedgerItemByIdQuery request, CancellationToken cancellationToken)
    {
        var item = await _unitOfWork.LedgerItems.GetWithOwnerReadOnlyAsync(request.Id);

        if (item == null)
            return Result<LedgerItemDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["ledger.notFound"]));

        var dto = _mapper.Map<LedgerItemDto>(item);
        dto.HasAmounts = await _unitOfWork.LedgerItems.HasAmountsAsync(item.Id);

        return Result<LedgerItemDto>.Success(dto);
    }
}
