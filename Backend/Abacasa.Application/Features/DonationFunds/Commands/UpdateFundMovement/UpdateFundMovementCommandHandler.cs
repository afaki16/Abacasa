using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationFunds.Common;
using Abacasa.Application.Features.DonationFunds.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.DonationFunds.Commands.UpdateFundMovement;

public class UpdateFundMovementCommandHandler : IRequestHandler<UpdateFundMovementCommand, Result<FundMovementDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public UpdateFundMovementCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<FundMovementDto>> Handle(UpdateFundMovementCommand request, CancellationToken cancellationToken)
    {
        var fund = await _unitOfWork.DonationFunds.GetByIdAsync(request.FundId);

        if (fund == null)
            return Result<FundMovementDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donationFunds.notFound"]));

        // Hareket bu emanete ait değilse bulunamadı sayılır
        var movement = await _unitOfWork.FundMovements.GetByIdAsync(request.MovementId);
        if (movement == null || movement.FundId != fund.Id)
            return Result<FundMovementDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donationFunds.movementNotFound"]));

        // Hareketin eski hali hariç toplam + yeni hali; kullanımda ≥ 0 ve elde ≥ 0 olmalı
        var totals = (await _unitOfWork.DonationFunds.GetTotalsAsync(new[] { fund.Id }, excludeMovementId: movement.Id))[fund.Id];
        var balance = FundBalance.From(fund, totals);
        balance.Apply(request.Type, request.Amount);
        var violation = balance.ViolationKey();
        if (violation != null)
            return Result<FundMovementDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer[violation]));

        movement.Type = request.Type;
        movement.Date = request.Date!.Value;
        movement.Amount = request.Amount;
        movement.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        _unitOfWork.FundMovements.Update(movement);
        await _unitOfWork.SaveChangesAsync();

        return Result<FundMovementDto>.Success(_mapper.Map<FundMovementDto>(movement));
    }
}
