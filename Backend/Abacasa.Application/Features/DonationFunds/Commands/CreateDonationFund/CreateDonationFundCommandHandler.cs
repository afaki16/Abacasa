using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationFunds.Common;
using Abacasa.Application.Features.DonationFunds.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.DonationFunds.Commands.CreateDonationFund;

public class CreateDonationFundCommandHandler : IRequestHandler<CreateDonationFundCommand, Result<DonationFundDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public CreateDonationFundCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<DonationFundDto>> Handle(CreateDonationFundCommand request, CancellationToken cancellationToken)
    {
        // Kişi repository ile yüklenir (tenant filtresi uygulanır); başka hanenin kişisi bulunamaz
        var fromPerson = await _unitOfWork.People.GetByIdAsync(request.FromPersonId);
        if (fromPerson == null)
            return Result<DonationFundDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["donationFunds.fromPersonNotFound"]));

        // TenantId ApplicationDbContext tarafından atanır
        var fund = new DonationFund
        {
            FromPersonId = fromPerson.Id,
            FromPerson = fromPerson,
            Kind = request.Kind,
            Amount = request.Amount,
            Date = request.Date,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
        };

        await _unitOfWork.DonationFunds.AddAsync(fund);
        await _unitOfWork.SaveChangesAsync();

        var dto = _mapper.Map<DonationFundDto>(fund);
        FundBalance.Fill(dto, fund, new FundTotals { FundId = fund.Id });

        return Result<DonationFundDto>.Success(dto);
    }
}
