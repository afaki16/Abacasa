using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.ExchangeRates.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;
using System;

namespace Abacasa.Application.Features.ExchangeRates.Commands.SaveExchangeRate;

public class SaveExchangeRateCommand : IRequest<Result<SaveExchangeRateResultDto>>
{
    public Currency Currency { get; set; }
    public decimal Rate { get; set; }
    public DateOnly? Date { get; set; }
}
