using Abacasa.Application.Common.Results;
using Abacasa.Application.Interfaces;
using MediatR;

namespace Abacasa.Application.Features.Households.Queries.ExportHousehold;

// Aktif hanenin verisi Excel olarak
public class ExportHouseholdQuery : IRequest<Result<ExportFile>>
{
}
