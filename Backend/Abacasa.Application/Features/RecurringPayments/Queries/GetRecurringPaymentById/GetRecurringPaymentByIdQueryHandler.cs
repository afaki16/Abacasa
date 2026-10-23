using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.RecurringPayments.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.RecurringPayments.Queries.GetRecurringPaymentById;

public class GetRecurringPaymentByIdQueryHandler : IRequestHandler<GetRecurringPaymentByIdQuery, Result<RecurringPaymentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public GetRecurringPaymentByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<RecurringPaymentDto>> Handle(GetRecurringPaymentByIdQuery request, CancellationToken cancellationToken)
    {
        var plan = await _unitOfWork.RecurringPayments.GetWithRelationsReadOnlyAsync(request.Id);

        if (plan == null)
            return Result<RecurringPaymentDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["recurringPayments.notFound"]));

        var dto = _mapper.Map<RecurringPaymentDto>(plan);
        dto.HasPayments = await _unitOfWork.RecurringPayments.HasPaymentsAsync(plan.Id);

        return Result<RecurringPaymentDto>.Success(dto);
    }
}
