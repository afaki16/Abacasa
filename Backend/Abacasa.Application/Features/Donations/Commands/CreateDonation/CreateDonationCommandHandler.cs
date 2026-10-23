using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationFunds.Common;
using Abacasa.Application.Features.Donations.Common;
using Abacasa.Application.Features.Donations.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Donations.Commands.CreateDonation;

public class CreateDonationCommandHandler : IRequestHandler<CreateDonationCommand, Result<DonationListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public CreateDonationCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<DonationListDto>> Handle(CreateDonationCommand request, CancellationToken cancellationToken)
    {
        // Referanslar repository ile yüklenir (tenant filtresi uygulanır); başka hanenin kaydı bulunamaz
        var paymentMethod = await _unitOfWork.PaymentMethods.GetByIdAsync(request.PaymentMethodId);
        if (paymentMethod == null)
            return Result<DonationListDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["donations.paymentMethodNotFound"]));

        // Pasif ödeme aracıyla yeni bağış açılamaz
        if (!paymentMethod.IsActive)
            return Result<DonationListDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["donations.paymentMethodInactive"]));

        Person? giver = null;
        if (request.GiverPersonId.HasValue)
        {
            giver = await _unitOfWork.People.GetByIdAsync(request.GiverPersonId.Value);
            if (giver == null)
                return Result<DonationListDto>.Failure(Error.Failure(
                    ErrorCode.ValidationFailed,
                    _localizer["donations.giverNotFound"]));
        }

        // Emanetten dağıtım: emanet bulunmalı, tür aynı olmalı, kayıttan sonra elde ≥ 0 kalmalı
        DonationFund? fund = null;
        if (request.FundId.HasValue)
        {
            var (checkedFund, error) = await FundDistributionCheck.CheckAsync(
                _unitOfWork, _localizer, request.FundId.Value, request.Kind, request.Amount);
            if (error != null)
                return Result<DonationListDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, error));
            fund = checkedFund;
        }

        // TenantId ApplicationDbContext tarafından atanır
        var donation = new Donation
        {
            Date = request.Date,
            Amount = request.Amount,
            Kind = request.Kind,
            Recipient = request.Recipient.Trim(),
            GiverPersonId = giver?.Id,
            GiverPerson = giver,
            PaymentMethodId = paymentMethod.Id,
            PaymentMethod = paymentMethod,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            FundId = fund?.Id,
            Fund = fund
        };

        await _unitOfWork.Donations.AddAsync(donation);
        await _unitOfWork.SaveChangesAsync();

        var dto = _mapper.Map<DonationListDto>(donation);
        dto.FundLabel = fund == null ? null : FundBalance.Label(fund, _localizer);

        return Result<DonationListDto>.Success(dto);
    }
}
