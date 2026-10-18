using FluentValidation;
using Kickstart.Application.Common.Localization;
using Kickstart.Application.Common.Pagination;

namespace Kickstart.Application.Features.Roles.Queries.GetAllRoles
{
    public class GetAllRolesQueryValidator : AbstractValidator<GetAllRolesQuery>
    {
        public GetAllRolesQueryValidator(IJsonStringLocalizer localizer)
        {
            RuleFor(x => x.Page)
                .GreaterThanOrEqualTo(PaginationLimits.MinPage)
                .WithMessage(localizer["validation.minValue", localizer["validation.fields.page"], PaginationLimits.MinPage]);

            RuleFor(x => x.PageSize)
                .InclusiveBetween(PaginationLimits.MinPageSize, PaginationLimits.MaxRolesPageSize)
                .WithMessage(localizer["validation.range", localizer["validation.fields.pageSize"], PaginationLimits.MinPageSize, PaginationLimits.MaxRolesPageSize]);
        }
    }
}
