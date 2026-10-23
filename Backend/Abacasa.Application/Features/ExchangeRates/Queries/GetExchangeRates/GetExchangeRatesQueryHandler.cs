using AutoMapper;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.ExchangeRates.Dtos;
using Abacasa.Domain.Common.Interfaces;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.ExchangeRates.Queries.GetExchangeRates;

public class GetExchangeRatesQueryHandler : IRequestHandler<GetExchangeRatesQuery, Result<List<ExchangeRateDto>>>
{
    // Tarihe göre azalan son kayıtlar
    private const int RecentCount = 20;

    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetExchangeRatesQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<Result<List<ExchangeRateDto>>> Handle(GetExchangeRatesQuery request, CancellationToken cancellationToken)
    {
        var rates = await _unitOfWork.ExchangeRates.GetRecentAsync(request.Currency, RecentCount);

        return Result<List<ExchangeRateDto>>.Success(_mapper.Map<List<ExchangeRateDto>>(rates));
    }
}
