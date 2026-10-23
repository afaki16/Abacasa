using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.UpdateHousehold;

// Aktif hanenin adı
public class UpdateHouseholdCommand : IRequest<Result<HouseholdDetailDto>>
{
    public string Name { get; set; } = string.Empty;
}
