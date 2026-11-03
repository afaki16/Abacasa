using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationFunds.Common;
using Abacasa.Application.Features.Donations.Common;
using Abacasa.Application.Features.Donations.Dtos;
using Abacasa.Application.Features.Households.Common;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Donations.Commands.UpdateDonation;

public class UpdateDonationCommandHandler : IRequestHandler<UpdateDonationCommand, Result<DonationListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    private readonly ICurrentUserService _currentUserService;

    public UpdateDonationCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer, ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<DonationListDto>> Handle(UpdateDonationCommand request, CancellationToken cancellationToken)
    {
        // Tracking'li yükle; başka hanenin kaydı filtre yüzünden bulunamaz
        var donation = await _unitOfWork.Donations.GetWithRelationsAsync(request.Id);

        if (donation == null)
            return Result<DonationListDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donations.notFound"]));

        // Referanslar repository ile yüklenir (tenant filtresi uygulanır); başka hanenin kaydı bulunamaz
        var paymentMethod = await _unitOfWork.PaymentMethods.GetByIdAsync(request.PaymentMethodId);
        if (paymentMethod == null)
            return Result<DonationListDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["donations.paymentMethodNotFound"]));

        // Ödeme aracı değişiyorsa yeni araç aktif olmalı; mevcut pasif araç korunabilir
        if (paymentMethod.Id != donation.PaymentMethodId && !paymentMethod.IsActive)
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

        // Emanetten dağıtım: yeni emanet ve (değişiyorsa) eski emanet ayrı ayrı kontrol edilir; ikisinde de elde ≥ 0
        DonationFund? fund = null;
        if (request.FundId.HasValue)
        {
            // Emanet, bağış hedefleri ve emanetler modülüne bağlı: kapalıysa 403. Bağlantı aynı kalıyorsa
            // (eski dağıtımın diğer alanları düzenleniyor) modül kapalı olsa da izin verilir
            if (request.FundId != donation.FundId && !await HouseholdModules.IsDonationExtrasEnabledAsync(_unitOfWork, _currentUserService))
                return Result<DonationListDto>.Failure(HouseholdModules.DisabledError(_localizer));

            var (checkedFund, error) = await FundDistributionCheck.CheckAsync(
                _unitOfWork, _localizer, request.FundId.Value, request.Kind, request.Amount, donation.Id);
            if (error != null)
                return Result<DonationListDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, error));
            fund = checkedFund;
        }

        if (donation.FundId.HasValue && donation.FundId != request.FundId)
        {
            // Emanetten ayırma da modüle bağlı
            if (!await HouseholdModules.IsDonationExtrasEnabledAsync(_unitOfWork, _currentUserService))
                return Result<DonationListDto>.Failure(HouseholdModules.DisabledError(_localizer));

            var error = await FundDistributionCheck.CheckReleasedAsync(_unitOfWork, _localizer, donation.FundId.Value, donation.Id);
            if (error != null)
                return Result<DonationListDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, error));
        }

        donation.Date = request.Date;
        donation.Amount = request.Amount;
        donation.Kind = request.Kind;
        donation.Recipient = request.Recipient.Trim();
        donation.GiverPersonId = giver?.Id;
        donation.GiverPerson = giver;
        donation.PaymentMethodId = paymentMethod.Id;
        donation.PaymentMethod = paymentMethod;
        donation.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        donation.FundId = fund?.Id;
        donation.Fund = fund;

        _unitOfWork.Donations.Update(donation);
        await _unitOfWork.SaveChangesAsync();

        var dto = _mapper.Map<DonationListDto>(donation);
        dto.FundLabel = fund == null ? null : FundBalance.Label(fund, _localizer);

        return Result<DonationListDto>.Success(dto);
    }
}
