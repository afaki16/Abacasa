using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Auth.Commands.DeleteAccount;
using MediatR;

namespace Abacasa.Application.Features.Auth.Queries.GetAccountDeletionPreview;

// Giriş yapmış kullanıcının hesap silme önizlemesi
public class GetAccountDeletionPreviewQuery : IRequest<Result<AccountDeletionPlan>>
{
}
