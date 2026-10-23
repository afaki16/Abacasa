using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Expenses.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Expenses.Commands.UpdateExpense;

public class UpdateExpenseCommandHandler : IRequestHandler<UpdateExpenseCommand, Result<ExpenseListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public UpdateExpenseCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<ExpenseListDto>> Handle(UpdateExpenseCommand request, CancellationToken cancellationToken)
    {
        // Tracking'li yükle; başka hanenin kaydı filtre yüzünden bulunamaz
        var expense = await _unitOfWork.Expenses.GetWithRelationsAsync(request.Id);

        if (expense == null)
            return Result<ExpenseListDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["expenses.notFound"]));

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

        // Ödeme aracı değişiyorsa yeni araç aktif olmalı; mevcut pasif araç korunabilir
        if (paymentMethod.Id != expense.PaymentMethodId && !paymentMethod.IsActive)
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

        expense.Date = request.Date;
        expense.Amount = request.Amount;
        expense.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        expense.CategoryId = category.Id;
        expense.Category = category;
        expense.PaymentMethodId = paymentMethod.Id;
        expense.PaymentMethod = paymentMethod;
        expense.OwnerPersonId = owner?.Id;
        expense.OwnerPerson = owner;

        _unitOfWork.Expenses.Update(expense);
        await _unitOfWork.SaveChangesAsync();

        return Result<ExpenseListDto>.Success(_mapper.Map<ExpenseListDto>(expense));
    }
}
