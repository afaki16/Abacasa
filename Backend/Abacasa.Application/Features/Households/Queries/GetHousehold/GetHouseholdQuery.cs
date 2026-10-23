using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Households.Queries.GetHousehold;

// Aktif hane
public class GetHouseholdQuery : IRequest<Result<HouseholdDetailDto>>
{
}
