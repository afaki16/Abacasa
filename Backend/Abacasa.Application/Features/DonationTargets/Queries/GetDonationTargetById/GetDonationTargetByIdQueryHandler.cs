using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationTargets.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.DonationTargets.Queries.GetDonationTargetById;

public class GetDonationTargetByIdQueryHandler : IRequestHandler<GetDonationTargetByIdQuery, Result<DonationTargetDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public GetDonationTargetByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<DonationTargetDto>> Handle(GetDonationTargetByIdQuery request, CancellationToken cancellationToken)
    {
        var target = await _unitOfWork.DonationTargets.GetWithOwnerReadOnlyAsync(request.Id);

        if (target == null)
            return Result<DonationTargetDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donationTargets.notFound"]));

        return Result<DonationTargetDto>.Success(_mapper.Map<DonationTargetDto>(target));
    }
}
