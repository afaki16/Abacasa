using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Budgets.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Budgets.Queries.GetBudgetById;

public class GetBudgetByIdQueryHandler : IRequestHandler<GetBudgetByIdQuery, Result<BudgetDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public GetBudgetByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<BudgetDto>> Handle(GetBudgetByIdQuery request, CancellationToken cancellationToken)
    {
        var budget = await _unitOfWork.Budgets.GetWithOwnerReadOnlyAsync(request.Id);

        if (budget == null)
            return Result<BudgetDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["budgets.notFound"]));

        return Result<BudgetDto>.Success(_mapper.Map<BudgetDto>(budget));
    }
}
