using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.LeaveHousehold;

// Kullanıcı aktif hanedeki kendi üyeliğini siler; yeni aktif hane refresh'te seçilir
public class LeaveHouseholdCommand : IRequest<Result<bool>>
{
}
