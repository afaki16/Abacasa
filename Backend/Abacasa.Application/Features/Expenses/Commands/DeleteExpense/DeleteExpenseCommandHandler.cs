using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Expenses.Commands.DeleteExpense;

public class DeleteExpenseCommandHandler : IRequestHandler<DeleteExpenseCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public DeleteExpenseCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeleteExpenseCommand request, CancellationToken cancellationToken)
    {
        var expense = await _unitOfWork.Expenses.GetByIdAsync(request.Id);

        if (expense == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["expenses.notFound"]));

        _unitOfWork.Expenses.SoftDelete(expense);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
