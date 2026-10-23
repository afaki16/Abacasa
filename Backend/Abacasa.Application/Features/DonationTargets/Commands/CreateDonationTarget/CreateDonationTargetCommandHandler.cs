using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationTargets.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.DonationTargets.Commands.CreateDonationTarget;

public class CreateDonationTargetCommandHandler : IRequestHandler<CreateDonationTargetCommand, Result<DonationTargetDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public CreateDonationTargetCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<DonationTargetDto>> Handle(CreateDonationTargetCommand request, CancellationToken cancellationToken)
    {
        // Kişi repository ile yüklenir (tenant filtresi uygulanır); başka hanenin kişisi bulunamaz
        Person? owner = null;
        if (request.OwnerPersonId.HasValue)
        {
            owner = await _unitOfWork.People.GetByIdAsync(request.OwnerPersonId.Value);
            if (owner == null)
                return Result<DonationTargetDto>.Failure(Error.Failure(
                    ErrorCode.ValidationFailed,
                    _localizer["donationTargets.ownerNotFound"]));
        }

        // Aynı (kişi, yıl, tür) için tek hedef; kişi boşken (hane) de geçerli
        if (await _unitOfWork.DonationTargets.ExistsAsync(owner?.Id, request.Year, request.Kind))
            return Result<DonationTargetDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["donationTargets.alreadyExists"]));

        // TenantId ApplicationDbContext tarafından atanır
        var target = new DonationTarget
        {
            OwnerPersonId = owner?.Id,
            OwnerPerson = owner,
            Year = request.Year,
            Kind = request.Kind,
            Amount = request.Amount,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
        };

        await _unitOfWork.DonationTargets.AddAsync(target);
        await _unitOfWork.SaveChangesAsync();

        return Result<DonationTargetDto>.Success(_mapper.Map<DonationTargetDto>(target));
    }
}
