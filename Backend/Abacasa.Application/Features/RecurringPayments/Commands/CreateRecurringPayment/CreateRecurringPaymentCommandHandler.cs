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

namespace Abacasa.Application.Features.RecurringPayments.Commands.CreateRecurringPayment;

public class CreateRecurringPaymentCommandHandler : IRequestHandler<CreateRecurringPaymentCommand, Result<RecurringPaymentListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public CreateRecurringPaymentCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<RecurringPaymentListDto>> Handle(CreateRecurringPaymentCommand request, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();

        // Tenant filtresi ApplicationDbContext'te: kontrol sadece kullanıcının hanesinde yapılır
        if (await _unitOfWork.RecurringPayments.NameExistsAsync(name))
            return Result<RecurringPaymentListDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["recurringPayments.nameExists"]));

        // Referanslar repository ile yüklenir (tenant filtresi uygulanır); başka hanenin kaydı bulunamaz
        var paymentMethod = await _unitOfWork.PaymentMethods.GetByIdAsync(request.PaymentMethodId);
        if (paymentMethod == null)
            return Result<RecurringPaymentListDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["recurringPayments.paymentMethodNotFound"]));

        // Pasif ödeme aracıyla yeni plan açılamaz
        if (!paymentMethod.IsActive)
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

        // TenantId ApplicationDbContext tarafından atanır; IsActive constructor'da true
        var plan = new RecurringPayment
        {
            Name = name,
            Kind = request.Kind,
            ExpectedAmount = expectedAmount,
            DueDay = dueDay,
            StartMonth = startMonth,
            PaymentMethodId = paymentMethod.Id,
            PaymentMethod = paymentMethod,
            CategoryId = category?.Id,
            Category = category,
            OwnerPersonId = owner?.Id,
            OwnerPerson = owner,
            Recipient = string.IsNullOrWhiteSpace(request.Recipient) ? null : request.Recipient.Trim(),
            DonationKind = request.DonationKind,
            TotalAmount = request.TotalAmount,
            InstallmentCount = request.InstallmentCount,
            FirstDueDate = request.FirstDueDate
        };

        await _unitOfWork.RecurringPayments.AddAsync(plan);
        await _unitOfWork.SaveChangesAsync();

        return Result<RecurringPaymentListDto>.Success(_mapper.Map<RecurringPaymentListDto>(plan));
    }
}
