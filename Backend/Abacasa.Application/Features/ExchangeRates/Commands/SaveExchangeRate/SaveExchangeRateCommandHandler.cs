using AutoMapper;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.ExchangeRates.Dtos;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using MediatR;

namespace Abacasa.Application.Features.ExchangeRates.Commands.SaveExchangeRate;

// Aynı (Currency, Date) için canlı kayıt varsa onu günceller, yoksa yeni açar
public class SaveExchangeRateCommandHandler : IRequestHandler<SaveExchangeRateCommand, Result<SaveExchangeRateResultDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public SaveExchangeRateCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<Result<SaveExchangeRateResultDto>> Handle(SaveExchangeRateCommand request, CancellationToken cancellationToken)
    {
        var date = request.Date!.Value;

        // Filtreli ve tracking'li yükleme; yalnızca kullanıcının hanesi
        var rate = await _unitOfWork.ExchangeRates.GetByDateAsync(request.Currency, date);
        var created = rate == null;

        if (created)
        {
            // TenantId ApplicationDbContext tarafından atanır
            rate = new ExchangeRate
            {
                Currency = request.Currency,
                Rate = request.Rate,
                Date = date
            };
            await _unitOfWork.ExchangeRates.AddAsync(rate);
        }
        else
        {
            rate!.Rate = request.Rate;
            _unitOfWork.ExchangeRates.Update(rate);
        }

        await _unitOfWork.SaveChangesAsync();

        return Result<SaveExchangeRateResultDto>.Success(new SaveExchangeRateResultDto
        {
            Rate = _mapper.Map<ExchangeRateDto>(rate),
            Created = created
        });
    }
}
