using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Expenses.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Expenses.Commands.CreateExpense;

public class CreateExpenseCommandHandler : IRequestHandler<CreateExpenseCommand, Result<ExpenseListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public CreateExpenseCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<ExpenseListDto>> Handle(CreateExpenseCommand request, CancellationToken cancellationToken)
    {
        // Referanslar repository ile yüklenir (tenant filtresi uygulanır); başka hanenin kaydı bulunamaz
        var category = await _unitOfWork.Categories.GetByIdAsync(request.CategoryId);
        if (category == null)
            return Result<ExpenseListDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["expenses.categoryNotFound"]));

        var paymentMethod = await _unitOfWork.PaymentMethods.GetByIdAsync(request.PaymentMethodId);
        if (paymentMethod == null)
            return Result<ExpenseListDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["expenses.paymentMethodNotFound"]));

        // Pasif ödeme aracıyla yeni harcama açılamaz
        if (!paymentMethod.IsActive)
            return Result<ExpenseListDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["expenses.paymentMethodInactive"]));

        Person? owner = null;
        if (request.OwnerPersonId.HasValue)
        {
            owner = await _unitOfWork.People.GetByIdAsync(request.OwnerPersonId.Value);
            if (owner == null)
                return Result<ExpenseListDto>.Failure(Error.Failure(
                    ErrorCode.ValidationFailed,
                    _localizer["expenses.ownerNotFound"]));
        }

        // TenantId ApplicationDbContext tarafından atanır
        var expense = new Expense
        {
            Date = request.Date,
            Amount = request.Amount,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            CategoryId = category.Id,
            Category = category,
            PaymentMethodId = paymentMethod.Id,
            PaymentMethod = paymentMethod,
            OwnerPersonId = owner?.Id,
            OwnerPerson = owner
        };

        await _unitOfWork.Expenses.AddAsync(expense);
        await _unitOfWork.SaveChangesAsync();

        return Result<ExpenseListDto>.Success(_mapper.Map<ExpenseListDto>(expense));
    }
}
