using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationFunds.Common;
using Abacasa.Application.Features.DonationFunds.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.DonationFunds.Queries.GetDonationFundById;

public class GetDonationFundByIdQueryHandler : IRequestHandler<GetDonationFundByIdQuery, Result<DonationFundDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public GetDonationFundByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<DonationFundDto>> Handle(GetDonationFundByIdQuery request, CancellationToken cancellationToken)
    {
        var fund = await _unitOfWork.DonationFunds.GetWithPersonReadOnlyAsync(request.Id);

        if (fund == null)
            return Result<DonationFundDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donationFunds.notFound"]));

        var dto = _mapper.Map<DonationFundDto>(fund);
        FundBalance.Fill(dto, fund, (await _unitOfWork.DonationFunds.GetTotalsAsync(new[] { fund.Id }))[fund.Id]);

        return Result<DonationFundDto>.Success(dto);
    }
}
