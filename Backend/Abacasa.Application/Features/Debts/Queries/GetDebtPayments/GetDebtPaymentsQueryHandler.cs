using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Debts.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Debts.Queries.GetDebtPayments;

public class GetDebtPaymentsQueryHandler : IRequestHandler<GetDebtPaymentsQuery, Result<List<DebtPaymentDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public GetDebtPaymentsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<List<DebtPaymentDto>>> Handle(GetDebtPaymentsQuery request, CancellationToken cancellationToken)
    {
        // Önce borç filtreli yüklenir; başka hanenin borcu bulunamaz
        var debt = await _unitOfWork.Debts.GetByIdAsync(request.DebtId);

        if (debt == null)
            return Result<List<DebtPaymentDto>>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["debts.notFound"]));

        var payments = await _unitOfWork.DebtPayments.GetByDebtIdReadOnlyAsync(debt.Id);

        return Result<List<DebtPaymentDto>>.Success(_mapper.Map<List<DebtPaymentDto>>(payments));
    }
}
