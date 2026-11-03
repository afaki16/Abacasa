using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Users.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.UpdateHouseholdModules;

// Aktif hanenin modüllerini açar/kapatır; kapatmak veriyi silmez
public class UpdateHouseholdModulesCommand : IRequest<Result<HouseholdModulesDto>>
{
    public bool DonationExtras { get; set; }
}
