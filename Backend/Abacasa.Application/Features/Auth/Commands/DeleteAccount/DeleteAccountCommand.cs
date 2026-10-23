using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Auth.Commands.DeleteAccount;

// Giriş yapmış kullanıcının hesabını siler (anonimleştirir); tek üyesi olduğu haneler onayla birlikte silinir
public class DeleteAccountCommand : IRequest<Result<bool>>
{
    public string Password { get; set; } = string.Empty;
    public bool DeleteSoleHouseholds { get; set; }
}
