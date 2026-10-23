using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationFunds.Common;
using Abacasa.Application.Features.Donations.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Donations.Queries.GetDonationById;

public class GetDonationByIdQueryHandler : IRequestHandler<GetDonationByIdQuery, Result<DonationDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public GetDonationByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<DonationDto>> Handle(GetDonationByIdQuery request, CancellationToken cancellationToken)
    {
        var donation = await _unitOfWork.Donations.GetWithRelationsReadOnlyAsync(request.Id);

        if (donation == null)
            return Result<DonationDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donations.notFound"]));

        var dto = _mapper.Map<DonationDto>(donation);
        dto.FundLabel = donation.Fund == null ? null : FundBalance.Label(donation.Fund, _localizer);

        return Result<DonationDto>.Success(dto);
    }
}
