using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Budgets.Commands.DeleteBudget;

public class DeleteBudgetCommandHandler : IRequestHandler<DeleteBudgetCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public DeleteBudgetCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeleteBudgetCommand request, CancellationToken cancellationToken)
    {
        // Bütçeye bağlı kayıt yok; silinince o aylarda aynı kişinin önceki kaydı geçerli olur
        var budget = await _unitOfWork.Budgets.GetByIdAsync(request.Id);

        if (budget == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["budgets.notFound"]));

        _unitOfWork.Budgets.SoftDelete(budget);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
