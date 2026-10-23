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

namespace Abacasa.Application.Features.Debts.Commands.CreateDebt;

public class CreateDebtCommandHandler : IRequestHandler<CreateDebtCommand, Result<DebtListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public CreateDebtCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<DebtListDto>> Handle(CreateDebtCommand request, CancellationToken cancellationToken)
    {
        // Referanslar repository ile yüklenir (tenant filtresi uygulanır); başka hanenin kaydı bulunamaz
        var creditor = await _unitOfWork.People.GetByIdAsync(request.CreditorPersonId);
        if (creditor == null)
            return Result<DebtListDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["debts.creditorNotFound"]));

        Person? debtor = null;
        if (request.DebtorPersonId.HasValue)
        {
            debtor = await _unitOfWork.People.GetByIdAsync(request.DebtorPersonId.Value);
            if (debtor == null)
                return Result<DebtListDto>.Failure(Error.Failure(
                    ErrorCode.ValidationFailed,
                    _localizer["debts.debtorNotFound"]));
        }

        // TenantId ApplicationDbContext tarafından atanır
        var debt = new Debt
        {
            CreditorPersonId = creditor.Id,
            CreditorPerson = creditor,
            DebtorPersonId = debtor?.Id,
            DebtorPerson = debtor,
            Currency = request.Currency,
            Amount = request.Amount,
            Date = request.Date,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
        };

        await _unitOfWork.Debts.AddAsync(debt);
        await _unitOfWork.SaveChangesAsync();

        var usdRate = await _unitOfWork.ExchangeRates.GetLatestAsync(Currency.USD);
        var dto = _mapper.Map<DebtListDto>(debt);
        DebtAmounts.Fill(dto, debt, usdRate?.Rate);

        return Result<DebtListDto>.Success(dto);
    }
}
