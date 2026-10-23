using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.PaymentMethods.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.PaymentMethods.Commands.UpdatePaymentMethod;

public class UpdatePaymentMethodCommandHandler : IRequestHandler<UpdatePaymentMethodCommand, Result<PaymentMethodListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public UpdatePaymentMethodCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<PaymentMethodListDto>> Handle(UpdatePaymentMethodCommand request, CancellationToken cancellationToken)
    {
        // Tracking'li yükle; başka hanenin kaydı filtre yüzünden bulunamaz
        var paymentMethod = await _unitOfWork.PaymentMethods.GetWithOwnerAsync(request.Id);

        if (paymentMethod == null)
            return Result<PaymentMethodListDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["paymentMethods.notFound"]));

        // Sahip kişi repository ile yüklenir (tenant filtresi uygulanır); başka hanenin kişisi bulunamaz
        Person? owner = null;
        if (request.OwnerPersonId.HasValue)
        {
            owner = await _unitOfWork.People.GetByIdAsync(request.OwnerPersonId.Value);
            if (owner == null)
                return Result<PaymentMethodListDto>.Failure(Error.Failure(
                    ErrorCode.ValidationFailed,
                    _localizer["paymentMethods.ownerNotFound"]));
        }

        var name = request.Name.Trim();

        if (await _unitOfWork.PaymentMethods.NameExistsAsync(name, request.Id))
            return Result<PaymentMethodListDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["paymentMethods.nameExists"]));

        paymentMethod.Name = name;
        paymentMethod.Type = request.Type;
        paymentMethod.Bank = string.IsNullOrWhiteSpace(request.Bank) ? null : request.Bank.Trim();
        paymentMethod.OwnerPersonId = owner?.Id;
        paymentMethod.OwnerPerson = owner;
        paymentMethod.StatementDay = request.StatementDay;
        paymentMethod.IsActive = request.IsActive;

        _unitOfWork.PaymentMethods.Update(paymentMethod);
        await _unitOfWork.SaveChangesAsync();

        return Result<PaymentMethodListDto>.Success(_mapper.Map<PaymentMethodListDto>(paymentMethod));
    }
}
