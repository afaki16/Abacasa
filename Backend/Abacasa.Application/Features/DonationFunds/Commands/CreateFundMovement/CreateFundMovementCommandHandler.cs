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

namespace Abacasa.Application.Features.DonationFunds.Commands.CreateFundMovement;

public class CreateFundMovementCommandHandler : IRequestHandler<CreateFundMovementCommand, Result<FundMovementDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public CreateFundMovementCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<FundMovementDto>> Handle(CreateFundMovementCommand request, CancellationToken cancellationToken)
    {
        // Filtreli yükleme; başka hanenin emaneti bulunamaz
        var fund = await _unitOfWork.DonationFunds.GetByIdAsync(request.FundId);

        if (fund == null)
            return Result<FundMovementDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donationFunds.notFound"]));

        // Hareket eklendikten sonra kullanımda ≥ 0 ve elde ≥ 0 olmalı
        var balance = FundBalance.From(fund, (await _unitOfWork.DonationFunds.GetTotalsAsync(new[] { fund.Id }))[fund.Id]);
        balance.Apply(request.Type, request.Amount);
        var violation = balance.ViolationKey();
        if (violation != null)
            return Result<FundMovementDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer[violation]));

        // TenantId ApplicationDbContext tarafından atanır
        var movement = new FundMovement
        {
            FundId = fund.Id,
            Type = request.Type,
            Date = request.Date!.Value,
            Amount = request.Amount,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
        };

        await _unitOfWork.FundMovements.AddAsync(movement);
        await _unitOfWork.SaveChangesAsync();

        return Result<FundMovementDto>.Success(_mapper.Map<FundMovementDto>(movement));
    }
}
