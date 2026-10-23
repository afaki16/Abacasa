using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.CreateHousehold;

public class CreateHouseholdCommand : IRequest<Result<HouseholdDto>>
{
    public string Name { get; set; }
}
