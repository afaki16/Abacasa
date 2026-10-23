using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.PaymentMethods.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.PaymentMethods.Commands.CreatePaymentMethod;

public class CreatePaymentMethodCommandHandler : IRequestHandler<CreatePaymentMethodCommand, Result<PaymentMethodListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public CreatePaymentMethodCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<PaymentMethodListDto>> Handle(CreatePaymentMethodCommand request, CancellationToken cancellationToken)
    {
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

        if (await _unitOfWork.PaymentMethods.NameExistsAsync(name))
            return Result<PaymentMethodListDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["paymentMethods.nameExists"]));

        // TenantId ApplicationDbContext tarafından atanır
        var paymentMethod = new PaymentMethod
        {
            Name = name,
            Type = request.Type,
            Bank = string.IsNullOrWhiteSpace(request.Bank) ? null : request.Bank.Trim(),
            OwnerPersonId = owner?.Id,
            OwnerPerson = owner,
            StatementDay = request.StatementDay,
            IsActive = request.IsActive
        };

        await _unitOfWork.PaymentMethods.AddAsync(paymentMethod);
        await _unitOfWork.SaveChangesAsync();

        return Result<PaymentMethodListDto>.Success(_mapper.Map<PaymentMethodListDto>(paymentMethod));
    }
}
