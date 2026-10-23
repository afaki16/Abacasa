using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Debts.Common;
using Abacasa.Application.Features.Debts.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Debts.Queries.GetDebtById;

public class GetDebtByIdQueryHandler : IRequestHandler<GetDebtByIdQuery, Result<DebtDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public GetDebtByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<DebtDto>> Handle(GetDebtByIdQuery request, CancellationToken cancellationToken)
    {
        var debt = await _unitOfWork.Debts.GetWithRelationsReadOnlyAsync(request.Id);

        if (debt == null)
            return Result<DebtDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["debts.notFound"]));

        var usdRate = await _unitOfWork.ExchangeRates.GetLatestAsync(Currency.USD);
        var dto = _mapper.Map<DebtDto>(debt);
        DebtAmounts.Fill(dto, debt, usdRate?.Rate);

        return Result<DebtDto>.Success(dto);
    }
}
