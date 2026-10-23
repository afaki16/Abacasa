using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.ExchangeRates.Commands.DeleteExchangeRate;

public class DeleteExchangeRateCommandHandler : IRequestHandler<DeleteExchangeRateCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public DeleteExchangeRateCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeleteExchangeRateCommand request, CancellationToken cancellationToken)
    {
        var rate = await _unitOfWork.ExchangeRates.GetByIdAsync(request.Id);

        if (rate == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["exchangeRates.notFound"]));

        _unitOfWork.ExchangeRates.SoftDelete(rate);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
