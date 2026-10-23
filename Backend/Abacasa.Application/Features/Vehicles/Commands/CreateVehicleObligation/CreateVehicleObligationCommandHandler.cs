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

namespace Abacasa.Application.Features.Vehicles.Commands.CreateVehicleObligation;

public class CreateVehicleObligationCommandHandler : IRequestHandler<CreateVehicleObligationCommand, Result<VehicleObligationDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public CreateVehicleObligationCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<VehicleObligationDto>> Handle(CreateVehicleObligationCommand request, CancellationToken cancellationToken)
    {
        // Filtreli yükleme; başka hanenin aracı bulunamaz
        var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(request.VehicleId);

        if (vehicle == null)
            return Result<VehicleObligationDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["vehicles.notFound"]));

        // TenantId ApplicationDbContext tarafından atanır
        var obligation = new VehicleObligation
        {
            VehicleId = vehicle.Id,
            Type = request.Type,
            Date = request.Date,
            ValidUntil = request.ValidUntil,
            Amount = request.Amount,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
        };

        // "Harcama olarak da kaydet": harcama işlemle aynı SaveChanges içinde oluşur, id'si ExpenseId'ye yazılır
        if (request.CreateExpense)
        {
            var (expense, error) = await VehicleObligationRules.BuildExpenseAsync(_unitOfWork, _localizer,
                vehicle, request.Type, request.Date, request.Amount, request.CategoryId, request.PaymentMethodId);
            if (error != null)
                return Result<VehicleObligationDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, error));

            await _unitOfWork.Expenses.AddAsync(expense!);
            obligation.Expense = expense;
        }

        await _unitOfWork.VehicleObligations.AddAsync(obligation);
        await _unitOfWork.SaveChangesAsync();

        var dto = _mapper.Map<VehicleObligationDto>(obligation);
        dto.HasExpense = obligation.ExpenseId.HasValue;

        return Result<VehicleObligationDto>.Success(dto);
    }
}
