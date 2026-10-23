using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.DeleteHousehold;

// Aktif haneyi bütün kayıtlarıyla kalıcı olarak siler (parola ve hane adıyla onay)
public class DeleteHouseholdCommand : IRequest<Result<bool>>
{
    public string Password { get; set; } = string.Empty;
    public string ConfirmName { get; set; } = string.Empty;
}
