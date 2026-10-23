using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationTargets.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.DonationTargets.Commands.UpdateDonationTarget;

public class UpdateDonationTargetCommandHandler : IRequestHandler<UpdateDonationTargetCommand, Result<DonationTargetDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public UpdateDonationTargetCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<DonationTargetDto>> Handle(UpdateDonationTargetCommand request, CancellationToken cancellationToken)
    {
        // Tracking'li yükle; başka hanenin kaydı filtre yüzünden bulunamaz
        var target = await _unitOfWork.DonationTargets.GetWithOwnerAsync(request.Id);

        if (target == null)
            return Result<DonationTargetDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donationTargets.notFound"]));

        Person? owner = null;
        if (request.OwnerPersonId.HasValue)
        {
            owner = await _unitOfWork.People.GetByIdAsync(request.OwnerPersonId.Value);
            if (owner == null)
                return Result<DonationTargetDto>.Failure(Error.Failure(
                    ErrorCode.ValidationFailed,
                    _localizer["donationTargets.ownerNotFound"]));
        }

        if (await _unitOfWork.DonationTargets.ExistsAsync(owner?.Id, request.Year, request.Kind, target.Id))
            return Result<DonationTargetDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["donationTargets.alreadyExists"]));

        target.OwnerPersonId = owner?.Id;
        target.OwnerPerson = owner;
        target.Year = request.Year;
        target.Kind = request.Kind;
        target.Amount = request.Amount;
        target.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        _unitOfWork.DonationTargets.Update(target);
        await _unitOfWork.SaveChangesAsync();

        return Result<DonationTargetDto>.Success(_mapper.Map<DonationTargetDto>(target));
    }
}
