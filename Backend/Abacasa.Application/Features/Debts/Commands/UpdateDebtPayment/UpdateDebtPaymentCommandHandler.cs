using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Debts.Common;
using Abacasa.Application.Features.Debts.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Linq;

namespace Abacasa.Application.Features.Debts.Commands.UpdateDebtPayment;

public class UpdateDebtPaymentCommandHandler : IRequestHandler<UpdateDebtPaymentCommand, Result<DebtPaymentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public UpdateDebtPaymentCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<DebtPaymentDto>> Handle(UpdateDebtPaymentCommand request, CancellationToken cancellationToken)
    {
        // Tracking'li yükle (canlı ödemeleriyle); başka hanenin borcu bulunamaz
        var debt = await _unitOfWork.Debts.GetWithRelationsAsync(request.DebtId);

        if (debt == null)
            return Result<DebtPaymentDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["debts.notFound"]));

        // Ödeme bu borca ait değilse bulunamadı sayılır
        var payment = debt.Payments.FirstOrDefault(p => p.Id == request.PaymentId);
        if (payment == null)
            return Result<DebtPaymentDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["debts.paymentNotFound"]));

        var error = DebtPaymentRules.Check(debt, request.Date!.Value, request.Amount, request.ExchangeRate, payment.Id, _localizer);
        if (error != null)
            return Result<DebtPaymentDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, error));

        payment.Date = request.Date.Value;
        payment.Amount = request.Amount;
        payment.ExchangeRate = request.ExchangeRate;
        payment.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        _unitOfWork.DebtPayments.Update(payment);
        await _unitOfWork.SaveChangesAsync();

        return Result<DebtPaymentDto>.Success(_mapper.Map<DebtPaymentDto>(payment));
    }
}
