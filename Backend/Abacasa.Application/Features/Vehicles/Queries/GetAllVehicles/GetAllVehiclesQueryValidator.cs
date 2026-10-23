using FluentValidation;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Pagination;

namespace Abacasa.Application.Features.Vehicles.Queries.GetAllVehicles;

public class GetAllVehiclesQueryValidator : AbstractValidator<GetAllVehiclesQuery>
{
    public GetAllVehiclesQueryValidator(IJsonStringLocalizer localizer)
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(PaginationLimits.MinPage)
            .WithMessage(localizer["validation.minValue", localizer["validation.fields.page"], PaginationLimits.MinPage]);

        RuleFor(x => x.PageSize)
            .InclusiveBetween(PaginationLimits.MinPageSize, PaginationLimits.MaxVehiclesPageSize)
            .WithMessage(localizer["validation.range", localizer["validation.fields.pageSize"], PaginationLimits.MinPageSize, PaginationLimits.MaxVehiclesPageSize]);
    }
}
