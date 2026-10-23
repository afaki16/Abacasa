using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.ExchangeRates.Commands.DeleteExchangeRate;

public class DeleteExchangeRateCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
