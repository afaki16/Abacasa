using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Budgets.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Budgets.Commands.CreateBudget;

public class CreateBudgetCommandHandler : IRequestHandler<CreateBudgetCommand, Result<BudgetDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public CreateBudgetCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<BudgetDto>> Handle(CreateBudgetCommand request, CancellationToken cancellationToken)
    {
        // Kişi repository ile yüklenir (tenant filtresi uygulanır); başka hanenin kişisi bulunamaz
        Person? owner = null;
        if (request.OwnerPersonId.HasValue)
        {
            owner = await _unitOfWork.People.GetByIdAsync(request.OwnerPersonId.Value);
            if (owner == null)
                return Result<BudgetDto>.Failure(Error.Failure(
                    ErrorCode.ValidationFailed,
                    _localizer["budgets.ownerNotFound"]));
        }

        // Aynı (kişi, başlangıç ayı) için tek kayıt; kişi boşken (hane) de geçerli
        if (await _unitOfWork.Budgets.ExistsAsync(owner?.Id, request.StartYear, request.StartMonth))
            return Result<BudgetDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["budgets.alreadyExists"]));

        // TenantId ApplicationDbContext tarafından atanır
        var budget = new Budget
        {
            OwnerPersonId = owner?.Id,
            OwnerPerson = owner,
            StartYear = request.StartYear,
            StartMonth = request.StartMonth,
            Amount = request.Amount,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
        };

        await _unitOfWork.Budgets.AddAsync(budget);
        await _unitOfWork.SaveChangesAsync();

        return Result<BudgetDto>.Success(_mapper.Map<BudgetDto>(budget));
    }
}
