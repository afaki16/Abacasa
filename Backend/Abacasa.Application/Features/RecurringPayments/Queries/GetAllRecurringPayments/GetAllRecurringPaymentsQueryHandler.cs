using AutoMapper;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.RecurringPayments.Dtos;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Collections.Generic;
using System.Linq;

namespace Abacasa.Application.Features.RecurringPayments.Queries.GetAllRecurringPayments;

public class GetAllRecurringPaymentsQueryHandler : IRequestHandler<GetAllRecurringPaymentsQuery, PagedResult<RecurringPaymentListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllRecurringPaymentsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResult<RecurringPaymentListDto>> Handle(GetAllRecurringPaymentsQuery request, CancellationToken cancellationToken)
    {
        var filter = new RecurringPaymentFilter
        {
            Kind = request.Kind,
            IsActive = request.IsActive,
            SearchTerm = request.SearchTerm
        };

        var (plans, totalCount) = await _unitOfWork.RecurringPayments.GetRecurringPaymentsPagedAsync(
            request.Page, request.PageSize, filter);

        var dtos = _mapper.Map<List<RecurringPaymentListDto>>(plans);

        // hasPayments sayfadaki planlar için tek seferde hesaplanır
        var idsWithPayments = await _unitOfWork.RecurringPayments.GetIdsWithPaymentsAsync(dtos.Select(d => d.Id));
        foreach (var dto in dtos)
            dto.HasPayments = idsWithPayments.Contains(dto.Id);

        var totalPages = (int)System.Math.Ceiling(totalCount / (double)request.PageSize);

        return PagedResult<RecurringPaymentListDto>.Success(dtos, request.Page, totalPages, totalCount);
    }
}
