using FluentValidation;
using Kickstart.Application.Common.Localization;
using Kickstart.Application.Common.Pagination;

namespace Kickstart.Application.Features.Users.Queries.GetAllUsers
{
    public class GetAllUsersQueryValidator : AbstractValidator<GetAllUsersQuery>
    {
        public GetAllUsersQueryValidator(IJsonStringLocalizer localizer)
        {
            RuleFor(x => x.Page)
                .GreaterThanOrEqualTo(PaginationLimits.MinPage)
                .WithMessage(localizer["validation.minValue", localizer["validation.fields.page"], PaginationLimits.MinPage]);

            RuleFor(x => x.PageSize)
                .InclusiveBetween(PaginationLimits.MinPageSize, PaginationLimits.MaxUsersPageSize)
                .WithMessage(localizer["validation.range", localizer["validation.fields.pageSize"], PaginationLimits.MinPageSize, PaginationLimits.MaxUsersPageSize]);
        }
    }
}
