using AutoMapper;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.PaymentMethods.Dtos;
using Abacasa.Domain.Common.Interfaces;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.PaymentMethods.Queries.GetAllPaymentMethods;

public class GetAllPaymentMethodsQueryHandler : IRequestHandler<GetAllPaymentMethodsQuery, PagedResult<PaymentMethodListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllPaymentMethodsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResult<PaymentMethodListDto>> Handle(GetAllPaymentMethodsQuery request, CancellationToken cancellationToken)
    {
        var (paymentMethods, totalCount) = await _unitOfWork.PaymentMethods.GetPaymentMethodsPagedAsync(
            request.Page, request.PageSize, request.SearchTerm, request.IsActive);

        var dtos = _mapper.Map<IEnumerable<PaymentMethodListDto>>(paymentMethods);
        var totalPages = (int)System.Math.Ceiling(totalCount / (double)request.PageSize);

        return PagedResult<PaymentMethodListDto>.Success(dtos, request.Page, totalPages, totalCount);
    }
}
