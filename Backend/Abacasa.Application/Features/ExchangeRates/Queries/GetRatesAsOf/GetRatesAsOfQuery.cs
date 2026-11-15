using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.ExchangeRates.Dtos;
using MediatR;
using System;
using System.Collections.Generic;

namespace Abacasa.Application.Features.ExchangeRates.Queries.GetRatesAsOf;

// Bir tarihte geçerli kurlar (yabancı birim başına; kuru olmayan birim listede yoktur)
public class GetRatesAsOfQuery : IRequest<Result<List<CurrentRateDto>>>
{
    public DateOnly Date { get; set; }

    // İstemcinin bugünü; gelecek tarih istenemez (sunucu saat dilimine bağlı kalmamak için istemciden gelir)
    public DateOnly Today { get; set; }
}
