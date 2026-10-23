using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationFunds.Common;
using Abacasa.Application.Features.DonationFunds.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.DonationFunds.Commands.UpdateDonationFund;

public class UpdateDonationFundCommandHandler : IRequestHandler<UpdateDonationFundCommand, Result<DonationFundDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public UpdateDonationFundCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    private Result<DonationFundDto> Invalid(string message) =>
        Result<DonationFundDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, message));

    public async Task<Result<DonationFundDto>> Handle(UpdateDonationFundCommand request, CancellationToken cancellationToken)
    {
        // Tracking'li yükle; başka hanenin kaydı filtre yüzünden bulunamaz
        var fund = await _unitOfWork.DonationFunds.GetWithPersonAsync(request.Id);

        if (fund == null)
            return Result<DonationFundDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donationFunds.notFound"]));

        var fromPerson = await _unitOfWork.People.GetByIdAsync(request.FromPersonId);
        if (fromPerson == null)
            return Invalid(_localizer["donationFunds.fromPersonNotFound"]);

        var totals = (await _unitOfWork.DonationFunds.GetTotalsAsync(new[] { fund.Id }))[fund.Id];
        var balance = FundBalance.From(fund, totals);

        // Dağıtılan bağışlar emanetle aynı türde olmalı
        if (request.Kind != fund.Kind && totals.DistributionCount > 0)
            return Invalid(_localizer["donationFunds.kindLocked"]);

        // Yeni tutar dağıtılan + kullanımda toplamının altına inemez (elde ≥ 0)
        var used = balance.Distributed + balance.InUse;
        if (request.Amount < used)
            return Invalid(_localizer["donationFunds.amountBelowUsed", used]);

        fund.FromPersonId = fromPerson.Id;
        fund.FromPerson = fromPerson;
        fund.Kind = request.Kind;
        fund.Amount = request.Amount;
        fund.Date = request.Date;
        fund.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        _unitOfWork.DonationFunds.Update(fund);
        await _unitOfWork.SaveChangesAsync();

        var dto = _mapper.Map<DonationFundDto>(fund);
        FundBalance.Fill(dto, fund, totals);

        return Result<DonationFundDto>.Success(dto);
    }
}
