using Abacasa.Application.Common.Results;
using Abacasa.Application.Interfaces;
using MediatR;

namespace Abacasa.Application.Features.Auth.Queries.ExportAccount;

// Giriş yapmış kullanıcının kişisel verisi Excel olarak
public class ExportAccountQuery : IRequest<Result<ExportFile>>
{
}
