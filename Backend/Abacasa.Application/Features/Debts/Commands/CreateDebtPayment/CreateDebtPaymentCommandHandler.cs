using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Debts.Common;
using Abacasa.Application.Features.Debts.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Debts.Commands.CreateDebtPayment;

public class CreateDebtPaymentCommandHandler : IRequestHandler<CreateDebtPaymentCommand, Result<DebtPaymentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public CreateDebtPaymentCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<DebtPaymentDto>> Handle(CreateDebtPaymentCommand request, CancellationToken cancellationToken)
    {
        // Filtreli yükleme (canlı ödemeleriyle); başka hanenin borcu bulunamaz
        var debt = await _unitOfWork.Debts.GetWithRelationsAsync(request.DebtId);

        if (debt == null)
            return Result<DebtPaymentDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["debts.notFound"]));

        var error = DebtPaymentRules.Check(debt, request.Date!.Value, request.Amount, request.ExchangeRate, null, _localizer);
        if (error != null)
            return Result<DebtPaymentDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, error));

        // TenantId ApplicationDbContext tarafından atanır
        var payment = new DebtPayment
        {
            DebtId = debt.Id,
            Date = request.Date.Value,
            Amount = request.Amount,
            ExchangeRate = request.ExchangeRate,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
        };

        await _unitOfWork.DebtPayments.AddAsync(payment);
        await _unitOfWork.SaveChangesAsync();

        return Result<DebtPaymentDto>.Success(_mapper.Map<DebtPaymentDto>(payment));
    }
}
