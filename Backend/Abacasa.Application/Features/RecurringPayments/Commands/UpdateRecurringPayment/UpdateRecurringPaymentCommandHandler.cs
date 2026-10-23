using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.RecurringPayments.Common;
using Abacasa.Application.Features.RecurringPayments.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.RecurringPayments.Commands.UpdateRecurringPayment;

public class UpdateRecurringPaymentCommandHandler : IRequestHandler<UpdateRecurringPaymentCommand, Result<RecurringPaymentListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public UpdateRecurringPaymentCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<RecurringPaymentListDto>> Handle(UpdateRecurringPaymentCommand request, CancellationToken cancellationToken)
    {
        // Tracking'li yükle; başka hanenin kaydı filtre yüzünden bulunamaz
        var plan = await _unitOfWork.RecurringPayments.GetWithRelationsAsync(request.Id);

        if (plan == null)
            return Result<RecurringPaymentListDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["recurringPayments.notFound"]));

        var name = request.Name.Trim();

        if (await _unitOfWork.RecurringPayments.NameExistsAsync(name, request.Id))
            return Result<RecurringPaymentListDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["recurringPayments.nameExists"]));

        // Ödemesi olan planda vadeleri belirleyen tür ve taksit alanları değişemez
        var hasPayments = await _unitOfWork.RecurringPayments.HasPaymentsAsync(plan.Id);
        if (hasPayments &&
            (request.Kind != plan.Kind ||
             request.InstallmentCount != plan.InstallmentCount ||
             request.FirstDueDate != plan.FirstDueDate))
            return Result<RecurringPaymentListDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["recurringPayments.lockedFieldsHavePayments"]));

        // Referanslar repository ile yüklenir (tenant filtresi uygulanır); başka hanenin kaydı bulunamaz
        var paymentMethod = await _unitOfWork.PaymentMethods.GetByIdAsync(request.PaymentMethodId);
        if (paymentMethod == null)
            return Result<RecurringPaymentListDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["recurringPayments.paymentMethodNotFound"]));

        // Ödeme aracı değişiyorsa yeni araç aktif olmalı; mevcut pasif araç korunabilir
        if (paymentMethod.Id != plan.PaymentMethodId && !paymentMethod.IsActive)
            return Result<RecurringPaymentListDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["recurringPayments.paymentMethodInactive"]));

        Category? category = null;
        if (request.CategoryId.HasValue)
        {
            category = await _unitOfWork.Categories.GetByIdAsync(request.CategoryId.Value);
            if (category == null)
                return Result<RecurringPaymentListDto>.Failure(Error.Failure(
                    ErrorCode.ValidationFailed,
                    _localizer["recurringPayments.categoryNotFound"]));
        }

        Person? owner = null;
        if (request.OwnerPersonId.HasValue)
        {
            owner = await _unitOfWork.People.GetByIdAsync(request.OwnerPersonId.Value);
            if (owner == null)
                return Result<RecurringPaymentListDto>.Failure(Error.Failure(
                    ErrorCode.ValidationFailed,
                    _localizer["recurringPayments.ownerNotFound"]));
        }

        var (dueDay, startMonth, expectedAmount) = RecurringPaymentSchedule.Derive(request);

        plan.Name = name;
        plan.Kind = request.Kind;
        plan.ExpectedAmount = expectedAmount;
        plan.DueDay = dueDay;
        plan.StartMonth = startMonth;
        plan.IsActive = request.IsActive;
        plan.PaymentMethodId = paymentMethod.Id;
        plan.PaymentMethod = paymentMethod;
        plan.CategoryId = category?.Id;
        plan.Category = category;
        plan.OwnerPersonId = owner?.Id;
        plan.OwnerPerson = owner;
        plan.Recipient = string.IsNullOrWhiteSpace(request.Recipient) ? null : request.Recipient.Trim();
        plan.DonationKind = request.DonationKind;
        plan.TotalAmount = request.TotalAmount;
        plan.InstallmentCount = request.InstallmentCount;
        plan.FirstDueDate = request.FirstDueDate;

        _unitOfWork.RecurringPayments.Update(plan);
        await _unitOfWork.SaveChangesAsync();

        var dto = _mapper.Map<RecurringPaymentListDto>(plan);
        dto.HasPayments = hasPayments;
        return Result<RecurringPaymentListDto>.Success(dto);
    }
}
