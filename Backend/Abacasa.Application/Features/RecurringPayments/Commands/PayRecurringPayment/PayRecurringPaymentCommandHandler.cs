using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.RecurringPayments.Common;
using Abacasa.Application.Features.RecurringPayments.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.RecurringPayments.Commands.PayRecurringPayment;

// Bir vadeyi öder: türe göre plana ve aya bağlı Expense ya da Donation oluşturur.
// Kontroller handler'da, sözleşmedeki sırayla yapılır (önce plan bulunmalı: 404).
public class PayRecurringPaymentCommandHandler : IRequestHandler<PayRecurringPaymentCommand, Result<RecurringPaymentPayResultDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public PayRecurringPaymentCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    private Result<RecurringPaymentPayResultDto> Invalid(string key) =>
        Result<RecurringPaymentPayResultDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer[key]));

    public async Task<Result<RecurringPaymentPayResultDto>> Handle(PayRecurringPaymentCommand request, CancellationToken cancellationToken)
    {
        // Filtreli yükleme; başka hanenin planı bulunamaz
        var plan = await _unitOfWork.RecurringPayments.GetWithRelationsReadOnlyAsync(request.Id);

        if (plan == null)
            return Result<RecurringPaymentPayResultDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["recurringPayments.notFound"]));

        if (!request.Month.HasValue || request.Month.Value.Day != 1)
            return Invalid("recurringPayments.monthNotFirstDay");

        var month = request.Month.Value;

        // Başlangıç ayından önce ya da taksit aralığı dışında vade yoktur
        if (!RecurringPaymentSchedule.IsDueInMonth(plan, month, out var installmentNo))
            return Invalid("recurringPayments.notDueInMonth");

        if (!plan.IsActive)
            return Invalid("recurringPayments.planInactive");

        if (await _unitOfWork.RecurringPayments.IsMonthPaidAsync(plan.Id, month))
            return Result<RecurringPaymentPayResultDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["recurringPayments.alreadyPaid"]));

        var amount = request.Amount ?? plan.ExpectedAmount;
        if (!amount.HasValue)
            return Invalid("recurringPayments.amountRequired");

        if (amount.Value <= 0)
            return Result<RecurringPaymentPayResultDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["validation.greaterThan", _localizer["validation.fields.amount"], 0]));

        if (!request.Date.HasValue)
            return Result<RecurringPaymentPayResultDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["validation.required", _localizer["validation.fields.date"]]));

        if (!plan.PaymentMethod.IsActive)
            return Invalid("recurringPayments.paymentMethodInactive");

        // TenantId ApplicationDbContext tarafından atanır
        if (plan.Kind == RecurringPaymentKind.Donation)
        {
            var donation = new Donation
            {
                Date = request.Date.Value,
                Amount = amount.Value,
                Kind = plan.DonationKind!.Value,
                Recipient = plan.Recipient!,
                GiverPersonId = plan.OwnerPersonId,
                PaymentMethodId = plan.PaymentMethodId,
                Note = plan.Name,
                RecurringPaymentId = plan.Id,
                RecurringPaymentMonth = month
            };

            await _unitOfWork.Donations.AddAsync(donation);
            await _unitOfWork.SaveChangesAsync();

            return Result<RecurringPaymentPayResultDto>.Success(new RecurringPaymentPayResultDto { Type = "donation", Id = donation.Id });
        }

        var expense = new Expense
        {
            Date = request.Date.Value,
            Amount = amount.Value,
            Description = installmentNo.HasValue ? $"{plan.Name} ({installmentNo}/{plan.InstallmentCount})" : plan.Name,
            CategoryId = plan.CategoryId!.Value,
            PaymentMethodId = plan.PaymentMethodId,
            OwnerPersonId = plan.OwnerPersonId,
            RecurringPaymentId = plan.Id,
            RecurringPaymentMonth = month
        };

        await _unitOfWork.Expenses.AddAsync(expense);
        await _unitOfWork.SaveChangesAsync();

        return Result<RecurringPaymentPayResultDto>.Success(new RecurringPaymentPayResultDto { Type = "expense", Id = expense.Id });
    }
}
