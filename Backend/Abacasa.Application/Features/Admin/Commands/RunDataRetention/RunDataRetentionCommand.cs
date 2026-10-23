using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Admin.Commands.RunDataRetention;

// İmha işini elle çalıştırır (yalnızca SuperAdmin); tablo başına silinen/anonimleştirilen satır sayısı döner
public class RunDataRetentionCommand : IRequest<Result<IReadOnlyDictionary<string, int>>>
{
}
