using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Debts.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Debts.Queries.GetDebtById;

public class GetDebtByIdQuery : IRequest<Result<DebtDto>>
{
    public int Id { get; set; }
}
