using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Vehicles.Common;
using Abacasa.Application.Features.Vehicles.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Vehicles.Commands.UpdateVehicleObligation;

public class UpdateVehicleObligationCommandHandler : IRequestHandler<UpdateVehicleObligationCommand, Result<VehicleObligationDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public UpdateVehicleObligationCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    private Result<VehicleObligationDto> Invalid(string message) =>
        Result<VehicleObligationDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, message));

    public async Task<Result<VehicleObligationDto>> Handle(UpdateVehicleObligationCommand request, CancellationToken cancellationToken)
    {
        var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(request.VehicleId);

        if (vehicle == null)
            return Result<VehicleObligationDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["vehicles.notFound"]));

        // İşlem bu araca ait değilse bulunamadı sayılır
        var obligation = await _unitOfWork.VehicleObligations.GetByIdAsync(request.ObligationId);
        if (obligation == null || obligation.VehicleId != vehicle.Id)
            return Result<VehicleObligationDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["vehicles.obligationNotFound"]));

        // Bağlı harcama filtreli yüklenir; Harcamalar'dan silindiyse canlı sayılmaz
        Expense? expense = obligation.ExpenseId.HasValue
            ? await _unitOfWork.Expenses.GetByIdAsync(obligation.ExpenseId.Value)
            : null;

        if (expense != null)
        {
            // Canlı bağlı harcama işlemle aynı tarih ve tutara getirilir; CreateExpense yok sayılır
            if (!request.Amount.HasValue)
                return Invalid(_localizer["vehicles.amountRequiredWithExpense"]);

            expense.Date = request.Date;
            expense.Amount = request.Amount.Value;
            _unitOfWork.Expenses.Update(expense);
        }
        else if (request.CreateExpense)
        {
            var (created, error) = await VehicleObligationRules.BuildExpenseAsync(_unitOfWork, _localizer,
                vehicle, request.Type, request.Date, request.Amount, request.CategoryId, request.PaymentMethodId);
            if (error != null)
                return Invalid(error);

            await _unitOfWork.Expenses.AddAsync(created!);
            obligation.Expense = created;
            expense = created;
        }

        obligation.Type = request.Type;
        obligation.Date = request.Date;
        obligation.ValidUntil = request.ValidUntil;
        obligation.Amount = request.Amount;
        obligation.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        _unitOfWork.VehicleObligations.Update(obligation);
        await _unitOfWork.SaveChangesAsync();

        var dto = _mapper.Map<VehicleObligationDto>(obligation);
        dto.HasExpense = expense != null;

        return Result<VehicleObligationDto>.Success(dto);
    }
}
