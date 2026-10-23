using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationFunds.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.DonationFunds.Queries.GetFundMovements;

public class GetFundMovementsQueryHandler : IRequestHandler<GetFundMovementsQuery, Result<List<FundMovementDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public GetFundMovementsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<List<FundMovementDto>>> Handle(GetFundMovementsQuery request, CancellationToken cancellationToken)
    {
        // Önce emanet filtreli yüklenir; başka hanenin emaneti bulunamaz
        var fund = await _unitOfWork.DonationFunds.GetByIdAsync(request.FundId);

        if (fund == null)
            return Result<List<FundMovementDto>>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donationFunds.notFound"]));

        var movements = await _unitOfWork.DonationFunds.GetMovementsReadOnlyAsync(fund.Id);

        return Result<List<FundMovementDto>>.Success(_mapper.Map<List<FundMovementDto>>(movements));
    }
}
