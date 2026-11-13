using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Budgets.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Budgets.Commands.UpdateBudget;

public class UpdateBudgetCommandHandler : IRequestHandler<UpdateBudgetCommand, Result<BudgetDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public UpdateBudgetCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<BudgetDto>> Handle(UpdateBudgetCommand request, CancellationToken cancellationToken)
    {
        // Tracking'li yükle; başka hanenin kaydı filtre yüzünden bulunamaz
        var budget = await _unitOfWork.Budgets.GetWithOwnerAsync(request.Id);

        if (budget == null)
            return Result<BudgetDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["budgets.notFound"]));

        Person? owner = null;
        if (request.OwnerPersonId.HasValue)
        {
            owner = await _unitOfWork.People.GetByIdAsync(request.OwnerPersonId.Value);
            if (owner == null)
                return Result<BudgetDto>.Failure(Error.Failure(
                    ErrorCode.ValidationFailed,
                    _localizer["budgets.ownerNotFound"]));
        }

        if (await _unitOfWork.Budgets.ExistsAsync(owner?.Id, request.StartYear, request.StartMonth, budget.Id))
            return Result<BudgetDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["budgets.alreadyExists"]));

        budget.OwnerPersonId = owner?.Id;
        budget.OwnerPerson = owner;
        budget.StartYear = request.StartYear;
        budget.StartMonth = request.StartMonth;
        budget.Amount = request.Amount;
        budget.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        _unitOfWork.Budgets.Update(budget);
        await _unitOfWork.SaveChangesAsync();

        return Result<BudgetDto>.Success(_mapper.Map<BudgetDto>(budget));
    }
}
