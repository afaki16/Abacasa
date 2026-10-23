using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Debts.Commands.DeleteDebt;

public class DeleteDebtCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
