using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.PaymentMethods.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.PaymentMethods.Queries.GetPaymentMethodById;

public class GetPaymentMethodByIdQueryHandler : IRequestHandler<GetPaymentMethodByIdQuery, Result<PaymentMethodDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public GetPaymentMethodByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<PaymentMethodDto>> Handle(GetPaymentMethodByIdQuery request, CancellationToken cancellationToken)
    {
        var paymentMethod = await _unitOfWork.PaymentMethods.GetWithOwnerReadOnlyAsync(request.Id);

        if (paymentMethod == null)
            return Result<PaymentMethodDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["paymentMethods.notFound"]));

        return Result<PaymentMethodDto>.Success(_mapper.Map<PaymentMethodDto>(paymentMethod));
    }
}
