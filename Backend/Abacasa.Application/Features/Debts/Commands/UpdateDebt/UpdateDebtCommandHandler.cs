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
using System.Linq;

namespace Abacasa.Application.Features.Debts.Commands.UpdateDebt;

public class UpdateDebtCommandHandler : IRequestHandler<UpdateDebtCommand, Result<DebtListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public UpdateDebtCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    private Result<DebtListDto> Invalid(string message) =>
        Result<DebtListDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, message));

    public async Task<Result<DebtListDto>> Handle(UpdateDebtCommand request, CancellationToken cancellationToken)
    {
        // Tracking'li yükle (canlı ödemeleriyle); başka hanenin kaydı filtre yüzünden bulunamaz
        var debt = await _unitOfWork.Debts.GetWithRelationsAsync(request.Id);

        if (debt == null)
            return Result<DebtListDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["debts.notFound"]));

        // Referanslar repository ile yüklenir (tenant filtresi uygulanır); başka hanenin kaydı bulunamaz
        var creditor = await _unitOfWork.People.GetByIdAsync(request.CreditorPersonId);
        if (creditor == null)
            return Invalid(_localizer["debts.creditorNotFound"]);

        Person? debtor = null;
        if (request.DebtorPersonId.HasValue)
        {
            debtor = await _unitOfWork.People.GetByIdAsync(request.DebtorPersonId.Value);
            if (debtor == null)
                return Invalid(_localizer["debts.debtorNotFound"]);
        }

        if (debt.Payments.Any())
        {
            if (request.Currency != debt.Currency)
                return Invalid(_localizer["debts.currencyLocked"]);

            if (request.Date > debt.Payments.Min(p => p.Date))
                return Invalid(_localizer["debts.dateAfterPayment"]);
        }

        var paid = DebtAmounts.Paid(debt);
        if (request.Amount < paid)
            return Invalid(_localizer["debts.amountBelowPaid", paid]);

        debt.CreditorPersonId = creditor.Id;
        debt.CreditorPerson = creditor;
        debt.DebtorPersonId = debtor?.Id;
        debt.DebtorPerson = debtor;
        debt.Currency = request.Currency;
        debt.Amount = request.Amount;
        debt.Date = request.Date;
        debt.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        _unitOfWork.Debts.Update(debt);
        await _unitOfWork.SaveChangesAsync();

        var usdRate = await _unitOfWork.ExchangeRates.GetLatestAsync(Currency.USD);
        var dto = _mapper.Map<DebtListDto>(debt);
        DebtAmounts.Fill(dto, debt, usdRate?.Rate);

        return Result<DebtListDto>.Success(dto);
    }
}
